import type { Request, Response } from 'express';
import shopService from './shop.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

class ShopController {
  /**
   * Get active shop info (Public API)
   */
  async getActiveShop(req: Request, res: Response) {
    try {
      const shop = await shopService.getActiveShop();
      
      if (!shop) {
        return sendError(res, 'No active shop found', 404);
      }

      // Return public-safe shop data
      const publicShop = {
        shopId: shop.shopId,
        shopName: shop.shopName,
        logoUrl: shop.logoUrl,
        bannerImages: shop.bannerImages,
        description: shop.description,
        email: shop.email,
        phone: shop.phone,
        websiteUrl: shop.websiteUrl,
        address: shop.address,
        socialLinks: shop.socialLinks,
        currencyCode: shop.currencyCode,
        language: shop.language
      };

      sendSuccess(res, publicShop);
    } catch (error) {
      if (error instanceof Error) {
        sendError(res, error.message, 500);
      } else {
        sendError(res, 'Failed to fetch shop info', 500);
      }
    }
  }

  /**
   * Get all shops (Admin only)
   */
  async getAllShops(req: Request, res: Response) {
    try {
      const shops = await shopService.getAllShops();
      sendSuccess(res, shops);
    } catch (error) {
      if (error instanceof Error) {
        sendError(res, error.message, 500);
      } else {
        sendError(res, 'Failed to fetch shops', 500);
      }
    }
  }

  /**
   * Get shop by ID (Admin only)
   */
  async getShopById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const shop = await shopService.getShopById(id);
      
      if (!shop) {
        return sendError(res, 'Shop not found', 404);
      }

      sendSuccess(res, shop);
    } catch (error) {
      if (error instanceof Error) {
        sendError(res, error.message, 500);
      } else {
        sendError(res, 'Failed to fetch shop', 500);
      }
    }
  }

  /**
   * Create shop (Admin only)
   */
  async createShop(req: Request, res: Response) {
    try {
      const shop = await shopService.createShop(req.body);
      sendSuccess(res, shop, 'Shop created successfully', 201);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          sendError(res, error.message, 400);
        } else {
          sendError(res, error.message, 500);
        }
      } else {
        sendError(res, 'Failed to create shop', 500);
      }
    }
  }

  /**
   * Update shop (Admin only)
   */
  async updateShop(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const shop = await shopService.updateShop(id, req.body);
      sendSuccess(res, shop, 'Shop updated successfully');
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Shop not found') {
          sendError(res, error.message, 404);
        } else if (error.message.includes('already exists')) {
          sendError(res, error.message, 400);
        } else {
          sendError(res, error.message, 500);
        }
      } else {
        sendError(res, 'Failed to update shop', 500);
      }
    }
  }

  /**
   * Delete shop (Admin only)
   */
  async deleteShop(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await shopService.deleteShop(id);
      sendSuccess(res, null, 'Shop deleted successfully');
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Shop not found') {
          sendError(res, error.message, 404);
        } else if (error.message.includes('Cannot delete')) {
          sendError(res, error.message, 400);
        } else {
          sendError(res, error.message, 500);
        }
      } else {
        sendError(res, 'Failed to delete shop', 500);
      }
    }
  }

  /**
   * Activate shop (Admin only)
   */
  async activateShop(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const shop = await shopService.activateShop(id);
      sendSuccess(res, shop, 'Shop activated successfully');
    } catch (error) {
      if (error instanceof Error) {
        sendError(res, error.message, 500);
      } else {
        sendError(res, 'Failed to activate shop', 500);
      }
    }
  }

  /**
   * Get shop statistics (Admin dashboard)
   */
  async getShopStats(req: Request, res: Response) {
    try {
      const { shopId } = req.query;
      const stats = await shopService.getShopStats(shopId as string);
      sendSuccess(res, stats);
    } catch (error) {
      if (error instanceof Error) {
        sendError(res, error.message, 500);
      } else {
        sendError(res, 'Failed to fetch shop statistics', 500);
      }
    }
  }

  /**
   * Initialize default shop (System setup)
   */
  async initializeShop(req: Request, res: Response) {
    try {
      const shop = await shopService.initializeDefaultShop();
      
      if (!shop) {
        sendSuccess(res, null, 'Shop already exists');
      } else {
        sendSuccess(res, shop, 'Default shop initialized successfully', 201);
      }
    } catch (error) {
      if (error instanceof Error) {
        sendError(res, error.message, 500);
      } else {
        sendError(res, 'Failed to initialize shop', 500);
      }
    }
  }
}

export default new ShopController();