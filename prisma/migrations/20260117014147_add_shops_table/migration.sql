-- CreateTable
CREATE TABLE "shops" (
    "shop_id" TEXT NOT NULL,
    "shop_name" TEXT NOT NULL,
    "shop_code" TEXT NOT NULL,
    "logo_url" TEXT,
    "banner_images" JSONB,
    "description" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "website_url" TEXT,
    "address" JSONB NOT NULL,
    "social_links" JSONB,
    "currency_code" TEXT NOT NULL DEFAULT 'USD',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "language" TEXT NOT NULL DEFAULT 'en',
    "tax_number" TEXT,
    "business_name" TEXT,
    "metadata" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shops_pkey" PRIMARY KEY ("shop_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shops_shop_code_key" ON "shops"("shop_code");

-- CreateIndex
CREATE INDEX "shops_shop_code_idx" ON "shops"("shop_code");

-- CreateIndex
CREATE INDEX "shops_is_active_idx" ON "shops"("is_active");
