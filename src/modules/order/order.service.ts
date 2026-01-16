import prisma from '../../lib/prisma.js';
import { PaymentMethod } from '@prisma/client';
import { generateOrderCode } from '../../utils/orderCode.js';

interface CreateOrderDto {
  paymentMethod: PaymentMethod;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
  };
  note?: string;
}

class OrderService {
  async createOrder(customerId: string, data: CreateOrderDto) {
    return await prisma.$transaction(async (tx) => {
      // 1. Get active cart with items
      const cart = await tx.cart.findFirst({
        where: {
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

      if (!cart || cart.cartDetails.length === 0) {
        throw new Error('Cart is empty');
      }

      // 2. Validate stock for all items
      for (const item of cart.cartDetails) {
        if (item.product.quantityInStock !== null) {
          if (item.product.quantityInStock < item.quantity) {
            throw new Error(`Insufficient stock for ${item.product.productName}`);
          }
        }

        if (!item.product.isActive) {
          throw new Error(`Product ${item.product.productName} is no longer available`);
        }
      }

      // 3. Calculate totals
      const subtotal = cart.cartDetails.reduce((sum, item) => {
        return sum + (Number(item.priceAtTime) * item.quantity);
      }, 0);

      const shippingFee = 10; // Fixed shipping fee, can be dynamic
      const totalAmount = subtotal + shippingFee;

      // 4. Create order
      const order = await tx.order.create({
        data: {
          customerId,
          orderCode: generateOrderCode(),
          totalAmount,
          subtotal,
          shippingFee,
          paymentMethod: data.paymentMethod,
          shippingAddress: data.shippingAddress,
          note: data.note,
          orderDetails: {
            create: cart.cartDetails.map(item => ({
              productId: item.productId,
              productName: item.product.productName,
              quantity: item.quantity,
              price: item.priceAtTime,
              selectedColor: item.selectedColor,
              selectedSize: item.selectedSize
            }))
          }
        },
        include: {
          orderDetails: true
        }
      });

      // 5. Update product stock
      for (const item of cart.cartDetails) {
        if (item.product.quantityInStock !== null) {
          await tx.product.update({
            where: { productId: item.productId },
            data: {
              quantityInStock: {
                decrement: item.quantity
              }
            }
          });
        }
      }

      // 6. Convert cart to 'converted' status
      await tx.cart.update({
        where: { cartId: cart.cartId },
        data: { status: 'converted' }
      });

      // 7. Create new active cart for customer
      await tx.cart.create({
        data: {
          customerId,
          status: 'active'
        }
      });

      return order;
    });
  }

  async getOrders(customerId: string) {
    const orders = await prisma.order.findMany({
      where: { customerId },
      include: {
        orderDetails: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return orders;
  }

  async getOrderById(customerId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: {
        orderId,
        customerId
      },
      include: {
        orderDetails: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  async getOrderByCode(orderCode: string) {
    const order = await prisma.order.findUnique({
      where: { orderCode },
      include: {
        orderDetails: {
          include: {
            product: true
          }
        },
        customer: {
          select: {
            fullName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  async cancelOrder(customerId: string, orderId: string) {
    return await prisma.$transaction(async (tx) => {
      // Get order
      const order = await tx.order.findFirst({
        where: {
          orderId,
          customerId
        },
        include: {
          orderDetails: true
        }
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Check if order can be cancelled
      if (!['pending', 'processing'].includes(order.orderStatus)) {
        throw new Error('Order cannot be cancelled');
      }

      // Restore stock
      for (const item of order.orderDetails) {
        const product = await tx.product.findUnique({
          where: { productId: item.productId }
        });

        if (product && product.quantityInStock !== null) {
          await tx.product.update({
            where: { productId: item.productId },
            data: {
              quantityInStock: {
                increment: item.quantity
              }
            }
          });
        }
      }

      // Update order status
      const updatedOrder = await tx.order.update({
        where: { orderId },
        data: {
          orderStatus: 'cancelled',
          cancelledAt: new Date()
        },
        include: {
          orderDetails: true
        }
      });

      return updatedOrder;
    });
  }

  // Admin/Staff methods
  async getAllOrders(filters?: {
    status?: string;
    paymentStatus?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.orderStatus = filters.status;
    }

    if (filters?.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: {
          select: {
            fullName: true,
            email: true,
            phone: true
          }
        },
        orderDetails: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return orders;
  }

  async updateOrderStatus(orderId: string, status: string) {
    const updateData: any = {
      orderStatus: status
    };

    // Set timestamps based on status
    if (status === 'processing') {
      updateData.processedAt = new Date();
    } else if (status === 'shipped') {
      updateData.shippedAt = new Date();
    } else if (status === 'completed') {
      updateData.completedAt = new Date();
    } else if (status === 'cancelled') {
      updateData.cancelledAt = new Date();
    }

    const order = await prisma.order.update({
      where: { orderId },
      data: updateData,
      include: {
        orderDetails: true
      }
    });

    return order;
  }

  async updatePaymentStatus(orderId: string, status: string) {
    const order = await prisma.order.update({
      where: { orderId },
      data: {
        paymentStatus: status as any
      }
    });

    // If payment is confirmed, update order status to processing
    if (status === 'paid') {
      await this.updateOrderStatus(orderId, 'processing');
    }

    return order;
  }
}

export default new OrderService();