import { Router } from 'express'
import productRoutes from '../modules/product/product.route'

const router = Router()

router.use('/products', productRoutes)

export default router
