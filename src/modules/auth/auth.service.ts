import prisma from '../../lib/prisma.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { generateTokenPair } from '../../utils/jwt.js';
import { nanoid } from 'nanoid';
import type { Customer } from '@prisma/client';

interface RegisterDto {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

interface LoginDto {
  email: string;
  password: string;
}

class AuthService {
  async register(data: RegisterDto) {
    // Check if email exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { email: data.email }
    });

    if (existingCustomer) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create customer and cart in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create customer
      const customer = await tx.customer.create({
        data: {
          fullName: data.fullName,
          email: data.email,
          passwordHash,
          phone: data.phone || null
        }
      });

      // Create active cart for customer
      await tx.cart.create({
        data: {
          customerId: customer.customerId,
          status: 'active'
        }
      });

      // Generate verification token
      const verificationToken = nanoid(32);
      await tx.emailVerificationToken.create({
        data: {
          token: verificationToken,
          email: customer.email,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      });

      return { customer, verificationToken };
    });

    // Generate tokens
    const tokens = generateTokenPair({
      id: result.customer.customerId,
      email: result.customer.email,
      type: 'customer'
    });

    // Update refresh token
    await prisma.customer.update({
      where: { customerId: result.customer.customerId },
      data: { refreshToken: tokens.refreshToken }
    });

    return {
      customer: {
        customerId: result.customer.customerId,
        fullName: result.customer.fullName,
        email: result.customer.email,
        phone: result.customer.phone
      },
      tokens,
      verificationToken: result.verificationToken
    };
  }

  async login(data: LoginDto) {
    // Find customer
    const customer = await prisma.customer.findUnique({
      where: { email: data.email }
    });

    if (!customer) {
      throw new Error('Invalid credentials');
    }

    // Check if account is active
    if (customer.status !== 'active') {
      throw new Error(`Account is ${customer.status}`);
    }

    // Verify password
    const isValidPassword = await verifyPassword(data.password, customer.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const tokens = generateTokenPair({
      id: customer.customerId,
      email: customer.email,
      type: 'customer'
    });

    // Update refresh token and last login
    await prisma.customer.update({
      where: { customerId: customer.customerId },
      data: {
        refreshToken: tokens.refreshToken,
        lastLoginAt: new Date()
      }
    });

    return {
      customer: {
        customerId: customer.customerId,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        emailVerifiedAt: customer.emailVerifiedAt
      },
      tokens
    };
  }

  async verifyEmail(token: string) {
    // Find token
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token }
    });

    if (!verificationToken) {
      throw new Error('Invalid verification token');
    }

    if (verificationToken.expiresAt < new Date()) {
      throw new Error('Verification token expired');
    }

    // Update customer
    await prisma.customer.update({
      where: { email: verificationToken.email },
      data: { emailVerifiedAt: new Date() }
    });

    // Delete token
    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id }
    });

    return { message: 'Email verified successfully' };
  }

  async forgotPassword(email: string) {
    const customer = await prisma.customer.findUnique({
      where: { email }
    });

    if (!customer) {
      // Don't reveal if email exists
      return { message: 'If email exists, password reset link has been sent' };
    }

    // Generate reset token
    const resetToken = nanoid(32);
    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        email: customer.email,
        userType: 'customer',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      }
    });

    // TODO: Send email with reset token
    console.log('Reset token:', resetToken);

    return { message: 'If email exists, password reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    // Find token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token }
    });

    if (!resetToken) {
      throw new Error('Invalid reset token');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new Error('Reset token expired');
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await prisma.customer.update({
      where: { email: resetToken.email },
      data: { passwordHash }
    });

    // Delete token
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id }
    });

    return { message: 'Password reset successfully' };
  }

  async refreshToken(refreshToken: string) {
    // Find customer with refresh token
    const customer = await prisma.customer.findFirst({
      where: { refreshToken }
    });

    if (!customer) {
      throw new Error('Invalid refresh token');
    }

    // Generate new token pair
    const tokens = generateTokenPair({
      id: customer.customerId,
      email: customer.email,
      type: 'customer'
    });

    // Update refresh token
    await prisma.customer.update({
      where: { customerId: customer.customerId },
      data: { refreshToken: tokens.refreshToken }
    });

    return tokens;
  }

  async logout(customerId: string) {
    await prisma.customer.update({
      where: { customerId },
      data: { refreshToken: null }
    });

    return { message: 'Logged out successfully' };
  }
}

export default new AuthService();