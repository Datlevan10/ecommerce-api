import { Router } from 'express';
import categoryController from './category.controller.js';
import { uploadCategory } from '../../config/multer.js';

const router = Router();

router.get('/', categoryController.getAllCategories);
router.get('/slug/:slug', categoryController.getCategoryBySlug);
router.get('/:id', categoryController.getCategoryById);
router.post('/', uploadCategory.single('imageFile'), categoryController.createCategory);
router.put('/:id', uploadCategory.single('imageFile'), categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

export default router;