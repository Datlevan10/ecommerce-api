# Ecommerce Database Design Documentation

## Overview
Production-ready database schema for a clothing ecommerce platform using PostgreSQL, Prisma ORM, and Laravel-style conventions.

## Database Conventions
- **Table names**: lowercase, plural, snake_case
- **Column names**: snake_case
- **Primary keys**: CUID strings for global uniqueness
- **Timestamps**: created_at, updated_at on all tables
- **Soft deletes**: deleted_at where appropriate

## 1. User System Architecture

### 1.1 Customers Table (`customers`)
**Purpose**: Store regular users who shop on the platform

**Key Fields**:
- `customer_id` (PK): CUID primary key
- `email` (UNIQUE): For authentication
- `password_hash`: Bcrypt hashed password
- `status`: enum (active|inactive|banned)
- `email_verified_at`: Email verification timestamp
- `deleted_at`: Soft delete support

**Business Rules**:
- One customer → One active cart
- One customer → Many orders
- One customer → Many reviews (one per product)
- One customer → Many favorites

**Constraints**:
- Email must be unique
- Only one active cart allowed (enforced by unique constraint)

### 1.2 Admins Table (`admins`)
**Purpose**: Super admin users for platform management

**Roles**:
- `super_admin`: Full system access
- `admin`: Limited administrative access

**Capabilities**:
- Product management
- Order management
- Review approval
- Customer management

### 1.3 Staffs Table (`staffs`)
**Purpose**: Shop employees for operations

**Roles**:
- `manager`: Order processing, inventory
- `support`: Customer service
- `warehouse`: Fulfillment operations

## 2. Cart System Architecture

### 2.1 Carts Table (`carts`)
**Business Logic**:
```
Customer Registration → Auto-create cart (status: active)
Add to cart → Update active cart
Place order → Cart status: active → converted
Abandoned cart → Status: active → abandoned (after X days)
```

**Unique Constraint**: `(customer_id, status)`
- Ensures only ONE active cart per customer

### 2.2 Cart Details (`cart_details`)
**Variant Management**:
```
Same product + same color + same size = Update quantity
Same product + different variant = New cart_detail row
```

**Cascade Delete**: When cart is deleted → cart_details auto-deleted

## 3. Order System Architecture

### 3.1 Order Lifecycle
```
PENDING → Customer placed order, awaiting payment
   ↓
PROCESSING → Payment confirmed, preparing order
   ↓
SHIPPED → Order dispatched
   ↓
COMPLETED → Order delivered successfully

Alternative flows:
PENDING → CANCELLED (by customer/timeout)
ANY STATUS → REFUNDED (return processed)
```

### 3.2 Order Creation Process
```sql
BEGIN TRANSACTION;
1. Validate cart items & stock
2. Create order with unique order_code
3. Copy cart_details → order_details (snapshot prices)
4. Update cart status to 'converted'
5. Decrease product stock
6. Clear/create new active cart
COMMIT;
```

### 3.3 Order Details
**Immutable Snapshot**: Product data at purchase time
- Price doesn't change if product price updates
- Product name preserved even if renamed
- Variant details locked at purchase

## 4. Review System

### 4.1 Review Constraints
- **One review per product per customer** (unique constraint)
- **Purchase verification**: Link to order_id
- **Approval workflow**: Admin/staff must approve

### 4.2 Review Impact on Products
```sql
ON REVIEW APPROVED:
UPDATE products SET
  total_review = total_review + 1,
  average_review = (
    (average_review * total_review) + new_rating
  ) / (total_review + 1)
```

## 5. Relationships Summary

### One-to-One
- Customer ↔ Active Cart (via unique constraint)

### One-to-Many
- Customer → Orders
- Customer → Reviews
- Cart → CartDetails
- Order → OrderDetails
- Category → Products
- Category → Subcategories (self-referential)

### Many-to-Many (via junction tables)
- Customer ↔ Products (via ProductFavorites)
- Customer ↔ Products (via Reviews)

## 6. API Business Logic

### 6.1 Cart Operations

#### Add to Cart
```typescript
async addToCart(customerId, productId, color, size, quantity) {
  // 1. Get or create active cart
  let cart = await findActiveCart(customerId)
  if (!cart) {
    cart = await createCart(customerId)
  }
  
  // 2. Check existing item
  const existing = await findCartDetail(cart.id, productId, color, size)
  
  if (existing) {
    // 3a. Update quantity if same variant
    await updateQuantity(existing.id, existing.quantity + quantity)
  } else {
    // 3b. Add new cart detail
    await createCartDetail(cart.id, productId, color, size, quantity)
  }
  
  // 4. Recalculate cart total
  await updateCartTotal(cart.id)
}
```

#### Update Cart Item
```typescript
async updateCartItem(cartDetailId, quantity) {
  if (quantity <= 0) {
    // Remove item
    await deleteCartDetail(cartDetailId)
  } else {
    // Update quantity
    await updateCartDetailQuantity(cartDetailId, quantity)
  }
  await recalculateCartTotal()
}
```

### 6.2 Order Operations

#### Create Order (with transaction)
```typescript
async createOrder(customerId, paymentMethod, shippingAddress) {
  return await prisma.$transaction(async (tx) => {
    // 1. Get active cart with items
    const cart = await tx.cart.findFirst({
      where: { customerId, status: 'active' },
      include: { cartDetails: { include: { product: true } } }
    })
    
    if (!cart || cart.cartDetails.length === 0) {
      throw new Error('Cart is empty')
    }
    
    // 2. Validate stock
    for (const item of cart.cartDetails) {
      if (item.quantity > item.product.quantityInStock) {
        throw new Error(`Insufficient stock for ${item.product.productName}`)
      }
    }
    
    // 3. Create order
    const order = await tx.order.create({
      data: {
        customerId,
        orderCode: generateOrderCode(),
        totalAmount: cart.totalAmount,
        paymentMethod,
        shippingAddress,
        orderDetails: {
          create: cart.cartDetails.map(item => ({
            productId: item.productId,
            productName: item.product.productName,
            quantity: item.quantity,
            price: item.priceAtTime,
            selectedColor: item.selectedColor,
            selectedSize: item.selectedSize
          }))
        }
      }
    })
    
    // 4. Update product stock
    for (const item of cart.cartDetails) {
      await tx.product.update({
        where: { productId: item.productId },
        data: { 
          quantityInStock: {
            decrement: item.quantity
          }
        }
      })
    }
    
    // 5. Convert cart
    await tx.cart.update({
      where: { cartId: cart.cartId },
      data: { status: 'converted' }
    })
    
    // 6. Create new active cart
    await tx.cart.create({
      data: {
        customerId,
        status: 'active'
      }
    })
    
    return order
  })
}
```

### 6.3 Review Operations

#### Create Review (with validation)
```typescript
async createReview(customerId, productId, rating, comment) {
  // 1. Check if customer purchased this product
  const purchase = await prisma.orderDetail.findFirst({
    where: {
      productId,
      order: {
        customerId,
        orderStatus: 'completed'
      }
    }
  })
  
  if (!purchase) {
    throw new Error('You must purchase this product to review it')
  }
  
  // 2. Check existing review
  const existing = await prisma.review.findUnique({
    where: {
      productId_customerId: { productId, customerId }
    }
  })
  
  if (existing) {
    throw new Error('You have already reviewed this product')
  }
  
  // 3. Create review (pending approval)
  return await prisma.review.create({
    data: {
      productId,
      customerId,
      orderId: purchase.orderId,
      rating,
      comment,
      isApproved: false
    }
  })
}
```

## 7. Authentication & Security

### 7.1 Password Management
- **Hashing**: Bcrypt with 10+ rounds
- **Reset tokens**: Time-limited, single-use

### 7.2 JWT Strategy
```typescript
Access Token (15 mins) + Refresh Token (7 days)

Login flow:
1. Validate credentials
2. Generate access + refresh tokens
3. Store refresh token in DB
4. Return both tokens to client

Refresh flow:
1. Validate refresh token
2. Generate new access token
3. Optionally rotate refresh token
```

### 7.3 Middleware Stack
```typescript
// Customer routes
app.use('/api/customer/*', authenticateCustomer)

// Admin routes  
app.use('/api/admin/*', authenticateAdmin, authorizeRole(['super_admin', 'admin']))

// Staff routes
app.use('/api/staff/*', authenticateStaff, authorizeRole(['manager', 'support']))
```

## 8. Scalability Considerations

### 8.1 Indexes
Strategic indexes on:
- Foreign keys (automatic in most cases)
- Frequently queried fields (email, status, created_at)
- Unique constraints (automatic)

### 8.2 Future Extensions
Schema supports easy addition of:
- **Vouchers/Coupons**: New table with order relationship
- **Multiple payment providers**: Extend payment_method enum
- **Shipping providers**: New shipping_methods table
- **Inventory tracking**: Extend products with SKU system
- **Multi-vendor**: Add vendor_id to products
- **Loyalty points**: Add points field to customers

### 8.3 Performance Optimizations
- **Soft deletes**: Keep data for analytics
- **JSON fields**: Flexible variant storage
- **Partial indexes**: On active records only
- **Read replicas**: For reporting queries

## 9. Data Integrity Rules

### 9.1 Cascade Rules
- Delete Customer → Soft delete (keep orders)
- Delete Cart → Cascade delete cart_details
- Delete Product → Prevent if in orders (FK constraint)

### 9.2 Transaction Requirements
Always use transactions for:
- Order creation
- Stock updates
- Payment processing
- Cart to order conversion

### 9.3 Consistency Checks
- Cart total = SUM(cart_details.price * quantity)
- Order total = subtotal + shipping - discount
- Average review = SUM(ratings) / COUNT(reviews)

## 10. API Error Handling

### Standard Error Responses
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Not enough stock available",
    "details": {
      "product": "product_id",
      "available": 5,
      "requested": 10
    }
  }
}
```

### Error Codes
- `AUTH_FAILED`: Invalid credentials
- `TOKEN_EXPIRED`: JWT expired
- `CART_EMPTY`: No items in cart
- `INSUFFICIENT_STOCK`: Stock validation failed
- `DUPLICATE_REVIEW`: Review already exists
- `ORDER_NOT_FOUND`: Invalid order ID
- `PERMISSION_DENIED`: Insufficient privileges

## Migration Commands

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Generate client
npx prisma generate

# Reset database (dev only)
npx prisma migrate reset
```

## Security Checklist

- [ ] Passwords hashed with bcrypt
- [ ] SQL injection prevented (Prisma parameterized queries)
- [ ] Rate limiting on auth endpoints
- [ ] CORS properly configured
- [ ] Sensitive data excluded from responses
- [ ] JWT secrets in environment variables
- [ ] HTTPS only in production
- [ ] Input validation on all endpoints
- [ ] XSS prevention (sanitize user input)
- [ ] CSRF tokens for state-changing operations