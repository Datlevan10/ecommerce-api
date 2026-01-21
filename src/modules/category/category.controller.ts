import type { Request, Response } from 'express';
import categoryService from './category.service.js';
import type { CreateCategoryDto, UpdateCategoryDto } from './category.service.js';

export class CategoryController {
  async getAllCategories(req: Request, res: Response): Promise<void> {
    try {
      const includeChildren = req.query.includeChildren === 'true';
      const withProductCount = req.query.withProductCount === 'true';
      
      let categories;
      if (withProductCount) {
        categories = await categoryService.getCategoriesWithProductCount();
      } else {
        categories = await categoryService.getAllCategories(includeChildren);
      }
      
      res.status(200).json({
        success: true,
        data: categories,
        count: categories.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async getCategoryById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const includeChildren = req.query.includeChildren === 'true';
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Category ID is required'
        });
        return;
      }

      const category = await categoryService.getCategoryById(id, includeChildren);
      
      if (!category) {
        res.status(404).json({
          success: false,
          error: 'Category not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: category
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async getCategoryBySlug(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      
      if (!slug) {
        res.status(400).json({
          success: false,
          error: 'Slug is required'
        });
        return;
      }

      const category = await categoryService.getCategoryBySlug(slug);
      
      if (!category) {
        res.status(404).json({
          success: false,
          error: 'Category not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: category
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async createCategory(req: Request, res: Response): Promise<void> {
    try {
      // Handle file upload
      let imageUrl: string | undefined;
      if (req.file) {
        // If file was uploaded, use the file path
        imageUrl = `/uploads/categories/${req.file.filename}`;
      }
      
      const { 
        categoryName, 
        slug, 
        description, 
        parentId,
        imageUrl: providedImageUrl,
        isActive,
        sortOrder
      } = req.body;
      
      // Use uploaded file URL if available, otherwise use provided URL
      const finalImageUrl = imageUrl || providedImageUrl;

      // Validation
      if (!categoryName || categoryName.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'Category name is required'
        });
        return;
      }

      if (!slug || slug.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'Slug is required'
        });
        return;
      }

      // Validate slug format (lowercase, alphanumeric with hyphens)
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugRegex.test(slug)) {
        res.status(400).json({
          success: false,
          error: 'Invalid slug format. Use lowercase letters, numbers, and hyphens only'
        });
        return;
      }

      // Handle form-data boolean conversion
      const isActiveValue = isActive === 'false' ? false : isActive === 'true' ? true : isActive ?? true;

      const categoryData: CreateCategoryDto = {
        categoryName: categoryName.trim(),
        slug: slug.trim(),
        description: description?.trim(),
        parentId: parentId?.trim() || undefined,
        imageUrl: finalImageUrl?.trim() || undefined,
        isActive: isActiveValue,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0
      };

      const category = await categoryService.createCategory(categoryData);
      
      res.status(201).json({
        success: true,
        data: category,
        message: 'Category created successfully'
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          res.status(409).json({
            success: false,
            error: error.message
          });
        } else if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            error: error.message
          });
        } else {
          res.status(500).json({
            success: false,
            error: error.message
          });
        }
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        });
      }
    }
  }

  async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Category ID is required'
        });
        return;
      }

      // Handle file upload
      let imageUrl: string | undefined;
      if (req.file) {
        // If file was uploaded, use the file path
        imageUrl = `/uploads/categories/${req.file.filename}`;
      }

      const {
        categoryName,
        slug,
        description,
        parentId,
        imageUrl: providedImageUrl,
        isActive,
        sortOrder
      } = req.body;
      
      // Use uploaded file URL if available, otherwise use provided URL
      const finalImageUrl = imageUrl || providedImageUrl;

      // Validation for updates
      if (categoryName !== undefined && categoryName.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'Category name cannot be empty'
        });
        return;
      }

      if (slug !== undefined) {
        if (slug.trim() === '') {
          res.status(400).json({
            success: false,
            error: 'Slug cannot be empty'
          });
          return;
        }

        // Validate slug format
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        if (!slugRegex.test(slug)) {
          res.status(400).json({
            success: false,
            error: 'Invalid slug format. Use lowercase letters, numbers, and hyphens only'
          });
          return;
        }
      }

      const updateData: UpdateCategoryDto = {};
      if (categoryName !== undefined) updateData.categoryName = categoryName.trim();
      if (slug !== undefined) updateData.slug = slug.trim();
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (parentId !== undefined) updateData.parentId = parentId?.trim() || null;
      if (finalImageUrl !== undefined) updateData.imageUrl = finalImageUrl?.trim() || null;
      // Handle form-data boolean conversion
      if (isActive !== undefined) {
        updateData.isActive = isActive === 'false' ? false : isActive === 'true' ? true : isActive;
      }
      if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder);

      const category = await categoryService.updateCategory(id, updateData);
      
      res.status(200).json({
        success: true,
        data: category,
        message: 'Category updated successfully'
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Category not found') {
          res.status(404).json({
            success: false,
            error: error.message
          });
        } else if (error.message.includes('already exists') || error.message.includes('circular')) {
          res.status(409).json({
            success: false,
            error: error.message
          });
        } else if (error.message.includes('Parent category not found')) {
          res.status(404).json({
            success: false,
            error: error.message
          });
        } else {
          res.status(500).json({
            success: false,
            error: error.message
          });
        }
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        });
      }
    }
  }

  async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const force = req.query.force === 'true';
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Category ID is required'
        });
        return;
      }

      await categoryService.deleteCategory(id, force);
      
      res.status(200).json({
        success: true,
        message: force 
          ? 'Category deleted and products reassigned to Uncategorized'
          : 'Category deleted successfully'
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Category not found') {
          res.status(404).json({
            success: false,
            error: error.message
          });
        } else if (error.message.includes('Cannot delete category')) {
          res.status(409).json({
            success: false,
            error: error.message
          });
        } else {
          res.status(500).json({
            success: false,
            error: error.message
          });
        }
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        });
      }
    }
  }
}

export default new CategoryController();