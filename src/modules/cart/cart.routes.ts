import { Router } from 'express';
import cartController from './cart.controller.js';
import { customerAuth } from '../../middlewares/auth.middleware.js';
import { body } from 'express-validator';
import { validateRequest } from '../../middlewares/validation.middleware.js';

const router = Router();

// All cart routes require customer authentication
router.use(customerAuth);

// Get cart
router.get('/', cartController.getCart);

// Add item to cart
router.post(
  '/items',
  [
    body('productId').notEmpty().withMessage('Product ID is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('selectedColor').optional(),
    body('selectedSize').optional(),
    validateRequest
  ],
  cartController.addToCart
);

// Update cart item quantity
router.put(
  '/items/:id',
  [
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    validateRequest
  ],
  cartController.updateCartItem
);

// Remove cart item
router.delete('/items/:id', cartController.removeCartItem);

// Clear cart
router.delete('/clear', cartController.clearCart);

export default router;