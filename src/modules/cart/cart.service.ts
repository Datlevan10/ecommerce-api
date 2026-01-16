import prisma from '../../lib/prisma.js';
import { Prisma } from '@prisma/client';

interface AddToCartDto {
  productId: string;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

interface UpdateCartItemDto {
  quantity: number;
}

class CartService {
  async getCart(customerId: string) {
    // Get or create active cart
    let cart = await prisma.cart.findFirst({
      where: {
        customerId,
        status: 'active'
      },
      include: {
        cartDetails: {
          include: {
            product: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!cart) {
      // Create new active cart if none exists
      cart = await prisma.cart.create({
        data: {
          customerId,
          status: 'active'
        },
        include: {
          cartDetails: {
            include: {
              product: true
            }
          }
        }
      });
    }

    // Calculate total
    const total = cart.cartDetails.reduce((sum, item) => {
      return sum + (Number(item.priceAtTime) * item.quantity);
    }, 0);

    return {
      ...cart,
      totalAmount: total,
      itemCount: cart.cartDetails.reduce((sum, item) => sum + item.quantity, 0)
    };
  }

  async addToCart(customerId: string, data: AddToCartDto) {
    // Validate product
    const product = await prisma.product.findUnique({
      where: { productId: data.productId }
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.isActive) {
      throw new Error('Product is not available');
    }

    // Check stock
    if (product.quantityInStock !== null && product.quantityInStock < data.quantity) {
      throw new Error('Insufficient stock');
    }

    // Get active cart
    let cart = await prisma.cart.findFirst({
      where: {
        customerId,
        status: 'active'
      }
    });

    if (!cart) {
      // Create cart if doesn't exist
      cart = await prisma.cart.create({
        data: {
          customerId,
          status: 'active'
        }
      });
    }

    // Check if item with same variant already exists
    const existingItem = await prisma.cartDetail.findFirst({
      where: {
        cartId: cart.cartId,
        productId: data.productId,
        selectedColor: data.selectedColor || null,
        selectedSize: data.selectedSize || null
      }
    });

    if (existingItem) {
      // Update quantity if item exists
      const newQuantity = existingItem.quantity + data.quantity;
      
      // Check stock for new quantity
      if (product.quantityInStock !== null && product.quantityInStock < newQuantity) {
        throw new Error('Insufficient stock for requested quantity');
      }

      const updatedItem = await prisma.cartDetail.update({
        where: { cartDetailId: existingItem.cartDetailId },
        data: { quantity: newQuantity },
        include: { product: true }
      });

      await this.updateCartTotal(cart.cartId);
      return updatedItem;
    } else {
      // Add new item
      const newItem = await prisma.cartDetail.create({
        data: {
          cartId: cart.cartId,
          productId: data.productId,
          quantity: data.quantity,
          selectedColor: data.selectedColor,
          selectedSize: data.selectedSize,
          priceAtTime: product.newPrice
        },
        include: { product: true }
      });

      await this.updateCartTotal(cart.cartId);
      return newItem;
    }
  }

  async updateCartItem(customerId: string, cartDetailId: string, data: UpdateCartItemDto) {
    // Verify cart detail belongs to customer
    const cartDetail = await prisma.cartDetail.findFirst({
      where: {
        cartDetailId,
        cart: {
          customerId,
          status: 'active'
        }
      },
      include: {
        product: true
      }
    });

    if (!cartDetail) {
      throw new Error('Cart item not found');
    }

    // Check stock
    if (cartDetail.product.quantityInStock !== null && 
        cartDetail.product.quantityInStock < data.quantity) {
      throw new Error('Insufficient stock');
    }

    // Update quantity
    const updatedItem = await prisma.cartDetail.update({
      where: { cartDetailId },
      data: { quantity: data.quantity },
      include: { product: true }
    });

    await this.updateCartTotal(cartDetail.cartId);
    return updatedItem;
  }

  async removeCartItem(customerId: string, cartDetailId: string) {
    // Verify cart detail belongs to customer
    const cartDetail = await prisma.cartDetail.findFirst({
      where: {
        cartDetailId,
        cart: {
          customerId,
          status: 'active'
        }
      }
    });

    if (!cartDetail) {
      throw new Error('Cart item not found');
    }

    // Delete item
    await prisma.cartDetail.delete({
      where: { cartDetailId }
    });

    await this.updateCartTotal(cartDetail.cartId);
    return { message: 'Item removed from cart' };
  }

  async clearCart(customerId: string) {
    const cart = await prisma.cart.findFirst({
      where: {
        customerId,
        status: 'active'
      }
    });

    if (!cart) {
      throw new Error('Cart not found');
    }

    // Delete all cart items
    await prisma.cartDetail.deleteMany({
      where: { cartId: cart.cartId }
    });

    // Reset cart total
    await prisma.cart.update({
      where: { cartId: cart.cartId },
      data: { totalAmount: 0 }
    });

    return { message: 'Cart cleared' };
  }

  private async updateCartTotal(cartId: string) {
    const cartDetails = await prisma.cartDetail.findMany({
      where: { cartId }
    });

    const total = cartDetails.reduce((sum, item) => {
      return sum + (Number(item.priceAtTime) * item.quantity);
    }, 0);

    await prisma.cart.update({
      where: { cartId },
      data: { totalAmount: total }
    });
  }
}

export default new CartService();