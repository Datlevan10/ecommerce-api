import { Prisma } from '@prisma/client';
import type { Product } from '@prisma/client';
import prisma from '../../lib/prisma.js';

export interface CreateProductDto {
  categoryId: string;
  productName: string;
  description: string;
  color: any; // JSON array of colors
  size: any; // JSON array of sizes
  image: any; // JSON array of image URLs or objects
  oldPrice?: number;
  newPrice: number;
  quantityInStock?: number;
  variant?: any; // JSON object for complex variants
  note?: string;
}

export interface UpdateProductDto {
  categoryId?: string;
  productName?: string;
  description?: string;
  color?: any;
  size?: any;
  image?: any;
  oldPrice?: number | null;
  newPrice?: number;
  quantityInStock?: number | null;
  variant?: any | null;
  note?: string | null;
}

export class ProductService {
  async getAllProducts(includeCategory: boolean = false): Promise<Product[]> {
    try {
      return await prisma.product.findMany({
        include: {
          category: includeCategory
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (error) {
      throw new Error('Failed to fetch products');
    }
  }

  async getProductById(productId: string, includeCategory: boolean = false): Promise<Product | null> {
    try {
      return await prisma.product.findUnique({
        where: { productId },
        include: {
          category: includeCategory
        }
      });
    } catch (error) {
      throw new Error('Failed to fetch product');
    }
  }

  async getProductsByCategoryId(categoryId: string): Promise<Product[]> {
    try {
      return await prisma.product.findMany({
        where: { categoryId },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (error) {
      throw new Error('Failed to fetch products by category');
    }
  }

  async createProduct(data: CreateProductDto): Promise<Product> {
    try {
      // Verify category exists
      const category = await prisma.category.findUnique({
        where: { categoryId: data.categoryId }
      });

      if (!category) {
        throw new Error('Category not found');
      }

      return await prisma.product.create({
        data: {
          categoryId: data.categoryId,
          productName: data.productName,
          description: data.description,
          color: data.color,
          size: data.size,
          image: data.image,
          oldPrice: data.oldPrice,
          newPrice: data.newPrice,
          quantityInStock: data.quantityInStock,
          variant: data.variant,
          note: data.note
        },
        include: {
          category: true
        }
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Category not found') {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Database error: ${error.message}`);
      }
      throw new Error('Failed to create product');
    }
  }

  async updateProduct(productId: string, data: UpdateProductDto): Promise<Product> {
    try {
      // If updating category, verify it exists
      if (data.categoryId) {
        const category = await prisma.category.findUnique({
          where: { categoryId: data.categoryId }
        });

        if (!category) {
          throw new Error('Category not found');
        }
      }

      return await prisma.product.update({
        where: { productId },
        data: {
          ...(data.categoryId && { categoryId: data.categoryId }),
          ...(data.productName && { productName: data.productName }),
          ...(data.description && { description: data.description }),
          ...(data.color !== undefined && { color: data.color }),
          ...(data.size !== undefined && { size: data.size }),
          ...(data.image !== undefined && { image: data.image }),
          ...(data.oldPrice !== undefined && { oldPrice: data.oldPrice }),
          ...(data.newPrice !== undefined && { newPrice: data.newPrice }),
          ...(data.quantityInStock !== undefined && { quantityInStock: data.quantityInStock }),
          ...(data.variant !== undefined && { variant: data.variant }),
          ...(data.note !== undefined && { note: data.note })
        },
        include: {
          category: true
        }
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Category not found') {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('Product not found');
        }
      }
      throw new Error('Failed to update product');
    }
  }

  async deleteProduct(productId: string): Promise<Product> {
    try {
      return await prisma.product.delete({
        where: { productId }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('Product not found');
        }
      }
      throw new Error('Failed to delete product');
    }
  }

  async updateProductReviews(productId: string, totalReview: number, averageReview: number): Promise<Product> {
    try {
      return await prisma.product.update({
        where: { productId },
        data: {
          totalReview,
          averageReview
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('Product not found');
        }
      }
      throw new Error('Failed to update product reviews');
    }
  }
}

const productService = new ProductService();
export default productService;