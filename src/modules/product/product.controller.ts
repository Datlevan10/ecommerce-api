import type { Request, Response } from 'express';
import productService from './product.service.js';
import type { CreateProductDto, UpdateProductDto } from './product.service.js';

export class ProductController {
  async getAllProducts(req: Request, res: Response): Promise<void> {
    try {
      const includeCategory = req.query.includeCategory === 'true';
      const products = await productService.getAllProducts(includeCategory);
      res.status(200).json({
        success: true,
        data: products,
        count: products.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const includeCategory = req.query.includeCategory === 'true';
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Product ID is required'
        });
        return;
      }

      const product = await productService.getProductById(id, includeCategory);
      
      if (!product) {
        res.status(404).json({
          success: false,
          error: 'Product not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: product
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async getProductsByCategoryId(req: Request, res: Response): Promise<void> {
    try {
      const { categoryId } = req.params;
      
      if (!categoryId) {
        res.status(400).json({
          success: false,
          error: 'Category ID is required'
        });
        return;
      }

      const products = await productService.getProductsByCategoryId(categoryId);
      
      res.status(200).json({
        success: true,
        data: products,
        count: products.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const { 
        categoryId, 
        productName, 
        description, 
        color, 
        size, 
        image, 
        oldPrice, 
        newPrice, 
        quantityInStock, 
        variant, 
        note 
      } = req.body;

      // Validation
      if (!categoryId || categoryId.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'Category ID is required'
        });
        return;
      }

      if (!productName || productName.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'Product name is required'
        });
        return;
      }

      if (!description || description.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'Product description is required'
        });
        return;
      }

      if (!color || !Array.isArray(color) || color.length === 0) {
        res.status(400).json({
          success: false,
          error: 'At least one color is required'
        });
        return;
      }

      if (!size || !Array.isArray(size) || size.length === 0) {
        res.status(400).json({
          success: false,
          error: 'At least one size is required'
        });
        return;
      }

      if (!image || !Array.isArray(image) || image.length === 0) {
        res.status(400).json({
          success: false,
          error: 'At least one image is required'
        });
        return;
      }

      if (!newPrice || newPrice <= 0) {
        res.status(400).json({
          success: false,
          error: 'Valid product price is required'
        });
        return;
      }

      const productData: CreateProductDto = {
        categoryId: categoryId.trim(),
        productName: productName.trim(),
        description: description.trim(),
        color,
        size,
        image,
        oldPrice: oldPrice ? Number(oldPrice) : undefined,
        newPrice: Number(newPrice),
        quantityInStock: quantityInStock ? Number(quantityInStock) : undefined,
        variant: variant || undefined,
        note: note || undefined
      };

      const product = await productService.createProduct(productData);
      
      res.status(201).json({
        success: true,
        data: product,
        message: 'Product created successfully'
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Category not found') {
        res.status(404).json({
          success: false,
          error: 'Category not found'
        });
      } else {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    }
  }

  async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Product ID is required'
        });
        return;
      }

      const {
        categoryId,
        productName,
        description,
        color,
        size,
        image,
        oldPrice,
        newPrice,
        quantityInStock,
        variant,
        note
      } = req.body;

      // Validation for updates
      if (productName !== undefined && productName.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'Product name cannot be empty'
        });
        return;
      }

      if (description !== undefined && description.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'Product description cannot be empty'
        });
        return;
      }

      if (color !== undefined && (!Array.isArray(color) || color.length === 0)) {
        res.status(400).json({
          success: false,
          error: 'Color must be a non-empty array'
        });
        return;
      }

      if (size !== undefined && (!Array.isArray(size) || size.length === 0)) {
        res.status(400).json({
          success: false,
          error: 'Size must be a non-empty array'
        });
        return;
      }

      if (image !== undefined && (!Array.isArray(image) || image.length === 0)) {
        res.status(400).json({
          success: false,
          error: 'Image must be a non-empty array'
        });
        return;
      }

      if (newPrice !== undefined && newPrice <= 0) {
        res.status(400).json({
          success: false,
          error: 'Product price must be greater than 0'
        });
        return;
      }

      const updateData: UpdateProductDto = {};
      if (categoryId !== undefined) updateData.categoryId = categoryId.trim();
      if (productName !== undefined) updateData.productName = productName.trim();
      if (description !== undefined) updateData.description = description.trim();
      if (color !== undefined) updateData.color = color;
      if (size !== undefined) updateData.size = size;
      if (image !== undefined) updateData.image = image;
      if (oldPrice !== undefined) updateData.oldPrice = oldPrice ? Number(oldPrice) : null;
      if (newPrice !== undefined) updateData.newPrice = Number(newPrice);
      if (quantityInStock !== undefined) updateData.quantityInStock = quantityInStock ? Number(quantityInStock) : null;
      if (variant !== undefined) updateData.variant = variant;
      if (note !== undefined) updateData.note = note;

      const product = await productService.updateProduct(id, updateData);
      
      res.status(200).json({
        success: true,
        data: product,
        message: 'Product updated successfully'
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Product not found') {
          res.status(404).json({
            success: false,
            error: 'Product not found'
          });
        } else if (error.message === 'Category not found') {
          res.status(404).json({
            success: false,
            error: 'Category not found'
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

  async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Product ID is required'
        });
        return;
      }

      await productService.deleteProduct(id);
      
      res.status(200).json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Product not found') {
        res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      } else {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    }
  }
}

export default new ProductController();