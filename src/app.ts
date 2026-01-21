import express from "express";
import cors from "cors";
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import productRoutes from './modules/product/product.routes.js';
import categoryRoutes from './modules/category/category.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import cartRoutes from './modules/cart/cart.routes.js';
import customerRoutes from './modules/customer/customer.routes.js';
import shopRoutes from './modules/shop/shop.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Parse form-data
app.use(morgan('dev'));

// Serve static files from public folder
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/shop', shopRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : undefined
  });
});

export default app;