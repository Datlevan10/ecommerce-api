import prisma from "../../lib/prisma.js";
import type { Shop } from "@prisma/client";

interface CreateShopDto {
  shopName: string;
  shopCode: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state?: string;
    country: string;
    zip?: string;
  };
  logoUrl?: string;
  bannerImages?: string[];
  description?: string;
  websiteUrl?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    youtube?: string;
  };
  currencyCode?: string;
  timezone?: string;
  language?: string;
  taxNumber?: string;
  businessName?: string;
  metadata?: any;
}

interface UpdateShopDto extends Partial<CreateShopDto> {
  isActive?: boolean;
}

interface ShopCache {
  data: Shop | null;
  timestamp: number;
}

class ShopService {
  private cache: ShopCache = {
    data: null,
    timestamp: 0,
  };
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

  /**
   * Get active shop (public API - cached)
   */
  async getActiveShop(): Promise<Shop | null> {
    // Check cache first
    const now = Date.now();
    if (
      this.cache.data &&
      this.cache.timestamp &&
      now - this.cache.timestamp < this.CACHE_TTL
    ) {
      return this.cache.data;
    }

    // Fetch from database
    const shop = await prisma.shop.findFirst({
      where: { isActive: true },
    });

    // Update cache
    if (shop) {
      this.cache.data = shop;
      this.cache.timestamp = now;
    }

    return shop;
  }

  /**
   * Get shop by ID (admin)
   */
  async getShopById(shopId: string): Promise<Shop | null> {
    return await prisma.shop.findUnique({
      where: { shopId },
    });
  }

  /**
   * Get all shops (admin)
   */
  async getAllShops(): Promise<Shop[]> {
    return await prisma.shop.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Create shop (admin only)
   * Business rule: Only one active shop at a time
   */
  async createShop(data: CreateShopDto): Promise<Shop> {
    // Check if shop code already exists
    const existingCode = await prisma.shop.findUnique({
      where: { shopCode: data.shopCode },
    });

    if (existingCode) {
      throw new Error("Shop code already exists");
    }

    // Deactivate all other shops if this will be active
    await prisma.shop.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new shop
    const shop = await prisma.shop.create({
      data: {
        shopName: data.shopName,
        shopCode: data.shopCode.toUpperCase(),
        email: data.email,
        phone: data.phone,
        address: data.address,
        logoUrl: data.logoUrl,
        bannerImages: data.bannerImages || [],
        description: data.description,
        websiteUrl: data.websiteUrl,
        socialLinks: data.socialLinks || {},
        currencyCode: data.currencyCode || "USD",
        timezone: data.timezone || "UTC",
        language: data.language || "en",
        taxNumber: data.taxNumber,
        businessName: data.businessName,
        metadata: data.metadata,
        isActive: true,
      },
    });

    // Clear cache
    this.clearCache();

    return shop;
  }

  /**
   * Update shop (admin only)
   */
  async updateShop(shopId: string, data: UpdateShopDto): Promise<Shop> {
    // Check if shop exists
    const shop = await prisma.shop.findUnique({
      where: { shopId },
    });

    if (!shop) {
      throw new Error("Shop not found");
    }

    // If updating shop code, check uniqueness
    if (data.shopCode && data.shopCode !== shop.shopCode) {
      const existingCode = await prisma.shop.findUnique({
        where: { shopCode: data.shopCode },
      });

      if (existingCode) {
        throw new Error("Shop code already exists");
      }
    }

    // If activating this shop, deactivate others
    if (data.isActive === true && !shop.isActive) {
      await prisma.shop.updateMany({
        where: {
          isActive: true,
          NOT: { shopId },
        },
        data: { isActive: false },
      });
    }

    // Update shop
    const updatedShop = await prisma.shop.update({
      where: { shopId },
      data: {
        ...(data.shopName && { shopName: data.shopName }),
        ...(data.shopCode && { shopCode: data.shopCode.toUpperCase() }),
        ...(data.email && { email: data.email }),
        ...(data.phone && { phone: data.phone }),
        ...(data.address && { address: data.address }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
        ...(data.bannerImages !== undefined && {
          bannerImages: data.bannerImages,
        }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.websiteUrl !== undefined && { websiteUrl: data.websiteUrl }),
        ...(data.socialLinks !== undefined && {
          socialLinks: data.socialLinks,
        }),
        ...(data.currencyCode && { currencyCode: data.currencyCode }),
        ...(data.timezone && { timezone: data.timezone }),
        ...(data.language && { language: data.language }),
        ...(data.taxNumber !== undefined && { taxNumber: data.taxNumber }),
        ...(data.businessName !== undefined && {
          businessName: data.businessName,
        }),
        ...(data.metadata !== undefined && { metadata: data.metadata }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    // Clear cache if shop is active
    if (updatedShop.isActive) {
      this.clearCache();
    }

    return updatedShop;
  }

  /**
   * Delete shop (admin only)
   */
  async deleteShop(shopId: string): Promise<void> {
    const shop = await prisma.shop.findUnique({
      where: { shopId },
    });

    if (!shop) {
      throw new Error("Shop not found");
    }

    // Prevent deleting the only active shop
    if (shop.isActive) {
      const otherShops = await prisma.shop.count({
        where: {
          NOT: { shopId },
          isActive: false,
        },
      });

      if (otherShops === 0) {
        throw new Error(
          "Cannot delete the only shop. Create another shop first."
        );
      }
    }

    await prisma.shop.delete({
      where: { shopId },
    });

    // Clear cache if deleted shop was active
    if (shop.isActive) {
      this.clearCache();
    }
  }

  /**
   * Activate shop (admin only)
   */
  async activateShop(shopId: string): Promise<Shop> {
    // Deactivate all shops
    await prisma.shop.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Activate specified shop
    const shop = await prisma.shop.update({
      where: { shopId },
      data: { isActive: true },
    });

    // Clear cache
    this.clearCache();

    return shop;
  }

  /**
   * Get shop statistics (admin dashboard)
   */
  async getShopStats(shopId?: string): Promise<any> {
    const whereClause = shopId
      ? {
          /* Add shopId relation when multi-shop */
        }
      : {};

    const [totalProducts, totalOrders, totalCustomers, todayOrders] =
      await Promise.all([
        prisma.product.count({
          where: { isActive: true },
        }),
        prisma.order.count(),
        prisma.customer.count({
          where: { status: "active" },
        }),
        prisma.order.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
      ]);

    return {
      totalProducts,
      totalOrders,
      totalCustomers,
      todayOrders,
    };
  }

  /**
   * Clear cache
   */
  private clearCache(): void {
    this.cache.data = null;
    this.cache.timestamp = 0;
  }

  /**
   * Initialize default shop if none exists
   */
  async initializeDefaultShop(): Promise<Shop | null> {
    const shopCount = await prisma.shop.count();

    if (shopCount === 0) {
      return await this.createShop({
        shopName: "My Ecommerce Store",
        shopCode: "SHOP001",
        email: "contact@mystore.com",
        phone: "+1234567890",
        address: {
          street: "123 Main Street",
          city: "New York",
          state: "NY",
          country: "USA",
          zip: "10001",
        },
        description: "Welcome to our online store",
        currencyCode: "USD",
        timezone: "America/New_York",
        language: "en",
      });
    }

    return null;
  }
}

export default new ShopService();
