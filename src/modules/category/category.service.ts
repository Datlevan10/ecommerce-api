import prisma from '../../config/database.js';
import type { Category, Prisma } from '@prisma/client';

export interface CreateCategoryDto {
  categoryName: string;
  slug: string;
  description?: string;
  parentId?: string;
  imageUrl?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCategoryDto {
  categoryName?: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

class CategoryService {
  async getAllCategories(includeChildren: boolean = false): Promise<Category[]> {
    const includeOptions = includeChildren 
      ? {
          children: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' as Prisma.SortOrder }
          }
        }
      : undefined;

    return await prisma.category.findMany({
      where: { },
      include: includeOptions,
      orderBy: { sortOrder: 'asc' }
    });
  }

  async getCategoryById(categoryId: string, includeChildren: boolean = false): Promise<Category | null> {
    const includeOptions = includeChildren 
      ? {
          children: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' as Prisma.SortOrder }
          },
          parent: true
        }
      : undefined;

    return await prisma.category.findFirst({
      where: { 
        categoryId
      },
      include: includeOptions
    });
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    return await prisma.category.findFirst({
      where: { 
        slug
      }
    });
  }

  async createCategory(data: CreateCategoryDto): Promise<Category> {
    // Check if slug already exists
    const existingCategory = await this.getCategoryBySlug(data.slug);
    if (existingCategory) {
      throw new Error('Category with this slug already exists');
    }

    // Check if parent category exists (if parentId provided)
    if (data.parentId) {
      const parentCategory = await this.getCategoryById(data.parentId);
      if (!parentCategory) {
        throw new Error('Parent category not found');
      }
    }

    return await prisma.category.create({
      data: {
        categoryName: data.categoryName,
        slug: data.slug,
        description: data.description,
        parentId: data.parentId,
        imageUrl: data.imageUrl,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0
      }
    });
  }

  async updateCategory(categoryId: string, data: UpdateCategoryDto): Promise<Category> {
    // Check if category exists
    const category = await this.getCategoryById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    // Check if new slug already exists (if slug is being updated)
    if (data.slug && data.slug !== category.slug) {
      const existingCategory = await this.getCategoryBySlug(data.slug);
      if (existingCategory) {
        throw new Error('Category with this slug already exists');
      }
    }

    // Check if new parent category exists (if parentId is being updated)
    if (data.parentId !== undefined && data.parentId !== null) {
      // Prevent category from being its own parent
      if (data.parentId === categoryId) {
        throw new Error('Category cannot be its own parent');
      }

      const parentCategory = await this.getCategoryById(data.parentId);
      if (!parentCategory) {
        throw new Error('Parent category not found');
      }

      // Check for circular reference
      await this.checkCircularReference(categoryId, data.parentId);
    }

    const updateData: Prisma.CategoryUpdateInput = {};
    if (data.categoryName !== undefined) updateData.categoryName = data.categoryName;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.parentId !== undefined) updateData.parentId = data.parentId;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    return await prisma.category.update({
      where: { categoryId },
      data: updateData
    });
  }

  async deleteCategory(categoryId: string, force: boolean = false): Promise<void> {
    // Check if category exists
    const category = await this.getCategoryById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    // Check if category has products
    const productCount = await prisma.product.count({
      where: { 
        categoryId
      }
    });

    if (productCount > 0 && !force) {
      throw new Error(`Cannot delete category. ${productCount} products are linked to this category. Use force=true to reassign products to uncategorized.`);
    }

    // Check if category has child categories
    const childCount = await prisma.category.count({
      where: { 
        parentId: categoryId
      }
    });

    if (childCount > 0) {
      throw new Error(`Cannot delete category. ${childCount} child categories exist. Delete child categories first.`);
    }

    if (force && productCount > 0) {
      // Create or find "Uncategorized" category
      let uncategorizedCategory = await prisma.category.findFirst({
        where: { slug: 'uncategorized' }
      });

      if (!uncategorizedCategory) {
        uncategorizedCategory = await prisma.category.create({
          data: {
            categoryName: 'Uncategorized',
            slug: 'uncategorized',
            description: 'Products without a category',
            isActive: true,
            sortOrder: 999
          }
        });
      }

      // Reassign products to uncategorized
      await prisma.product.updateMany({
        where: { categoryId },
        data: { categoryId: uncategorizedCategory.categoryId }
      });
    }

    // Delete the category
    await prisma.category.delete({
      where: { categoryId }
    });
  }

  private async checkCircularReference(categoryId: string, parentId: string): Promise<void> {
    const visited = new Set<string>();
    let currentId: string | null = parentId;

    while (currentId) {
      if (visited.has(currentId)) {
        throw new Error('Circular reference detected in category hierarchy');
      }
      if (currentId === categoryId) {
        throw new Error('Setting this parent would create a circular reference');
      }
      visited.add(currentId);

      const parent = await this.getCategoryById(currentId);
      currentId = parent?.parentId || null;
    }
  }

  async getCategoriesWithProductCount(): Promise<any[]> {
    const categories = await prisma.category.findMany({
      where: { },
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    return categories.map(category => ({
      ...category,
      productCount: category._count.products
    }));
  }
}

export default new CategoryService();