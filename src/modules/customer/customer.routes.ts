import { Router } from 'express';
import { customerAuth } from '../../middlewares/auth.middleware.js';
import { sendSuccess } from '../../utils/response.js';
import prisma from '../../lib/prisma.js';

const router = Router();

// Get customer profile (requires authentication)
router.get('/profile', customerAuth, async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { customerId: req.user!.id },
      select: {
        customerId: true,
        fullName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        emailVerifiedAt: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    sendSuccess(res, customer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

export default router;