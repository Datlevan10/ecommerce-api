# Ecommerce API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All protected routes require JWT Bearer token in Authorization header:
```
Authorization: Bearer <access_token>
```

## Standard Response Format
```json
{
  "success": true|false,
  "message": "string",
  "data": {},
  "count": 0  // For array responses
}
```

## Error Response Format
```json
{
  "success": false,
  "message": "Error message",
  "error": {} // Optional error details
}
```

## API Endpoints

### 1. Authentication APIs

#### Register Customer
```http
POST /api/auth/register
```
**Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890" // Optional
}
```
**Response:** Customer data + tokens + verification token

#### Login
```http
POST /api/auth/login
```
**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "customer": {...},
  "tokens": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

#### Verify Email
```http
POST /api/auth/verify-email
```
**Body:**
```json
{
  "token": "verification_token"
}
```

#### Forgot Password
```http
POST /api/auth/forgot-password
```
**Body:**
```json
{
  "email": "john@example.com"
}
```

#### Reset Password
```http
POST /api/auth/reset-password
```
**Body:**
```json
{
  "token": "reset_token",
  "password": "newpassword123"
}
```

#### Refresh Token
```http
POST /api/auth/refresh-token
```
**Body:**
```json
{
  "refreshToken": "..."
}
```

#### Logout
```http
POST /api/auth/logout
```
**Auth Required:** Yes

### 2. Customer APIs

#### Get Profile
```http
GET /api/customers/profile
```
**Auth Required:** Yes (Customer)

#### Update Profile
```http
PUT /api/customers/profile
```
**Auth Required:** Yes (Customer)
**Body:**
```json
{
  "fullName": "John Updated",
  "phone": "+9876543210",
  "avatarUrl": "https://..."
}
```

### 3. Product APIs

#### Get All Products
```http
GET /api/products
GET /api/products?includeCategory=true
GET /api/products?page=1&limit=20
GET /api/products?search=shirt
GET /api/products?categoryId=xxx
GET /api/products?minPrice=10&maxPrice=100
```
**Auth Required:** No

#### Get Product by ID
```http
GET /api/products/:id
GET /api/products/:id?includeCategory=true
```
**Auth Required:** No

#### Get Products by Category
```http
GET /api/products/category/:categoryId
```
**Auth Required:** No

#### Create Product
```http
POST /api/products
```
**Auth Required:** Yes (Admin/Staff)
**Body:**
```json
{
  "categoryId": "xxx",
  "productName": "Cotton T-Shirt",
  "description": "Comfortable cotton t-shirt",
  "color": ["Red", "Blue", "Green"],
  "size": ["S", "M", "L", "XL"],
  "image": ["url1", "url2"],
  "oldPrice": 29.99,
  "newPrice": 19.99,
  "quantityInStock": 100,
  "variant": {...},
  "note": "Limited edition"
}
```

#### Update Product
```http
PUT /api/products/:id
```
**Auth Required:** Yes (Admin/Staff)

#### Delete Product
```http
DELETE /api/products/:id
```
**Auth Required:** Yes (Admin/Staff)

### 4. Category APIs

#### Get All Categories
```http
GET /api/categories
GET /api/categories?includeProducts=true
```
**Auth Required:** No

#### Get Category by ID
```http
GET /api/categories/:id
```
**Auth Required:** No

#### Create Category
```http
POST /api/categories
```
**Auth Required:** Yes (Admin/Staff)
**Body:**
```json
{
  "categoryName": "Men's Clothing",
  "description": "All men's clothing items",
  "slug": "mens-clothing",
  "parentId": null,
  "imageUrl": "https://...",
  "sortOrder": 1
}
```

#### Update Category
```http
PUT /api/categories/:id
```
**Auth Required:** Yes (Admin/Staff)

#### Delete Category
```http
DELETE /api/categories/:id
```
**Auth Required:** Yes (Admin/Staff)

### 5. Cart APIs

#### Get Cart
```http
GET /api/cart
```
**Auth Required:** Yes (Customer)
**Response:**
```json
{
  "cartId": "xxx",
  "status": "active",
  "totalAmount": 199.99,
  "itemCount": 5,
  "cartDetails": [
    {
      "cartDetailId": "xxx",
      "product": {...},
      "quantity": 2,
      "selectedColor": "Red",
      "selectedSize": "M",
      "priceAtTime": 19.99
    }
  ]
}
```

#### Add Item to Cart
```http
POST /api/cart/items
```
**Auth Required:** Yes (Customer)
**Body:**
```json
{
  "productId": "xxx",
  "quantity": 2,
  "selectedColor": "Red",
  "selectedSize": "M"
}
```
**Business Logic:**
- If same product + variant exists → merge quantity
- Check stock availability
- Auto-create cart if needed

#### Update Cart Item
```http
PUT /api/cart/items/:cartDetailId
```
**Auth Required:** Yes (Customer)
**Body:**
```json
{
  "quantity": 3
}
```

#### Remove Cart Item
```http
DELETE /api/cart/items/:cartDetailId
```
**Auth Required:** Yes (Customer)

#### Clear Cart
```http
DELETE /api/cart/clear
```
**Auth Required:** Yes (Customer)

### 6. Order APIs

#### Create Order
```http
POST /api/orders
```
**Auth Required:** Yes (Customer)
**Body:**
```json
{
  "paymentMethod": "cod", // cod|bank_transfer|stripe|paypal
  "shippingAddress": {
    "fullName": "John Doe",
    "phone": "+1234567890",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA"
  },
  "note": "Please deliver before 5pm"
}
```
**Transaction Logic:**
1. Validate cart items
2. Check product stock
3. Create order with unique order_code
4. Copy cart_details → order_details
5. Update product stock
6. Convert cart status
7. Create new active cart

#### Get My Orders
```http
GET /api/orders
```
**Auth Required:** Yes (Customer)

#### Get Order by ID
```http
GET /api/orders/:id
```
**Auth Required:** Yes (Customer)

#### Cancel Order
```http
PUT /api/orders/:id/cancel
```
**Auth Required:** Yes (Customer)
**Rules:** Only pending/processing orders can be cancelled

#### Track Order by Code
```http
GET /api/orders/track/:orderCode
```
**Auth Required:** No

### 7. Favorite APIs

#### Get Favorites
```http
GET /api/favorites
```
**Auth Required:** Yes (Customer)

#### Add to Favorites
```http
POST /api/favorites/:productId
```
**Auth Required:** Yes (Customer)

#### Remove from Favorites
```http
DELETE /api/favorites/:productId
```
**Auth Required:** Yes (Customer)

### 8. Review APIs

#### Get Product Reviews
```http
GET /api/products/:productId/reviews
GET /api/products/:productId/reviews?approved=true
```
**Auth Required:** No

#### Create Review
```http
POST /api/reviews
```
**Auth Required:** Yes (Customer)
**Body:**
```json
{
  "productId": "xxx",
  "rating": 5,
  "comment": "Excellent product!",
  "images": ["url1", "url2"]
}
```
**Rules:**
- Customer must have purchased the product
- One review per product per customer
- Reviews require admin approval

#### Get My Reviews
```http
GET /api/reviews/my
```
**Auth Required:** Yes (Customer)

#### Approve Review (Admin)
```http
PUT /api/reviews/:id/approve
```
**Auth Required:** Yes (Admin/Staff)

#### Delete Review
```http
DELETE /api/reviews/:id
```
**Auth Required:** Yes (Admin or Review Owner)

### 9. Admin/Staff APIs

#### Admin Login
```http
POST /api/admin/login
```
**Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

#### Staff Login
```http
POST /api/staff/login
```

#### Get All Orders (Admin)
```http
GET /api/admin/orders
GET /api/admin/orders?status=pending
GET /api/admin/orders?paymentStatus=paid
GET /api/admin/orders?startDate=2024-01-01&endDate=2024-12-31
```
**Auth Required:** Yes (Admin/Staff)

#### Update Order Status
```http
PUT /api/admin/orders/:id/status
```
**Auth Required:** Yes (Admin/Staff)
**Body:**
```json
{
  "status": "processing" // pending|processing|shipped|completed|cancelled
}
```

#### Update Payment Status
```http
PUT /api/admin/orders/:id/payment-status
```
**Auth Required:** Yes (Admin/Staff)
**Body:**
```json
{
  "status": "paid" // pending|paid|failed|refunded
}
```

#### Get All Customers
```http
GET /api/admin/customers
```
**Auth Required:** Yes (Admin)

#### Update Customer Status
```http
PUT /api/admin/customers/:id/status
```
**Auth Required:** Yes (Admin)
**Body:**
```json
{
  "status": "banned" // active|inactive|banned
}
```

## HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## Rate Limiting

- Authentication endpoints: 5 requests per minute
- Other endpoints: 100 requests per minute

## Pagination

For list endpoints, use query parameters:
```
?page=1&limit=20&sort=createdAt&order=desc
```

## Search & Filters

Products support:
```
?search=keyword
?categoryId=xxx
?minPrice=10&maxPrice=100
?color=Red
?size=M
?inStock=true
```

## Webhook Events (Future)

- `order.created`
- `order.paid`
- `order.shipped`
- `order.completed`
- `review.approved`

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"test@example.com","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Get Products
```bash
curl http://localhost:3000/api/products
```

### Add to Cart (Authenticated)
```bash
curl -X POST http://localhost:3000/api/cart/items \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":"xxx","quantity":2}'
```