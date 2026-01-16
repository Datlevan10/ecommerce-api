import type { Request, Response } from 'express';
import cartService from './cart.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

class CartController {
  async getCart(req: Request, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Not authenticated', 401);
      }
      const cart = await cartService.getCart(req.user.id);
      sendSuccess(res, cart);
    } catch (error) {
      if (error instanceof Error) {
        sendError(res, error.message, 400);
      } else {
        sendError(res, 'Failed to fetch cart', 500);
      }
    }
  }

  async addToCart(req: Request, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Not authenticated', 401);
      }
      const item = await cartService.addToCart(req.user.id, req.body);
      sendSuccess(res, item, 'Item added to cart');
    } catch (error) {
      if (error instanceof Error) {
        sendError(res, error.message, 400);
      } else {
        sendError(res, 'Failed to add item to cart', 500);
      }
    }
  }

  async updateCartItem(req: Request, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Not authenticated', 401);
      }
      const { id } = req.params;
      const item = await cartService.updateCartItem(req.user.id, id, req.body);
      sendSuccess(res, item, 'Cart item updated');
    } catch (error) {
      if (error instanceof Error) {
        sendError(res, error.message, 400);
      } else {
        sendError(res, 'Failed to update cart item', 500);
      }
    }
  }

  async removeCartItem(req: Request, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Not authenticated', 401);
      }
      const { id } = req.params;
      const result = await cartService.removeCartItem(req.user.id, id);
      sendSuccess(res, result);
    } catch (error) {
      if (error instanceof Error) {
        sendError(res, error.message, 400);
      } else {
        sendError(res, 'Failed to remove cart item', 500);
      }
    }
  }

  async clearCart(req: Request, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Not authenticated', 401);
      }
      const result = await cartService.clearCart(req.user.id);
      sendSuccess(res, result);
    } catch (error) {
      if (error instanceof Error) {
        sendError(res, error.message, 400);
      } else {
        sendError(res, 'Failed to clear cart', 500);
      }
    }
  }
}

export default new CartController();