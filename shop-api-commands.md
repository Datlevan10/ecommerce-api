# Shop API Testing Commands

## Prerequisites
First, you need an admin token. Use these commands:

### 1. Register Admin (if not exists)
```bash
curl -X POST http://localhost:5000/api/auth/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@shop.com",
    "password": "Admin123!",
    "adminCode": "ADMIN2024"
  }'
```

### 2. Admin Login (Get Token)
```bash
curl -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@shop.com",
    "password": "Admin123!"
  }'
```
**Response:**
```json
{
  "success": true,
  "data": {
    "admin": {
      "adminId": "cm4abc...",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@shop.com",
      "role": "super_admin",
      "isActive": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

## Shop API Endpoints

### 3. Initialize Default Shop (First Time Setup)
```bash
curl -X POST http://localhost:5000/api/shop/admin/initialize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```
**Response:**
```json
{
  "success": true,
  "message": "Default shop initialized successfully",
  "data": {
    "shopId": "cm4xyz...",
    "shopName": "My Ecommerce Store",
    "shopCode": "SHOP001",
    "email": "contact@mystore.com",
    "phone": "+1234567890",
    "address": {
      "street": "123 Main Street",
      "city": "New York",
      "state": "NY",
      "country": "USA",
      "zip": "10001"
    },
    "currencyCode": "USD",
    "language": "en",
    "isActive": true,
    "createdAt": "2024-01-17T10:00:00.000Z"
  }
}
```

### 4. Get Active Shop (Public - No Auth Required)
```bash
curl -X GET http://localhost:5000/api/shop
```
**Response:**
```json
{
  "success": true,
  "data": {
    "shopId": "cm4xyz...",
    "shopName": "My Ecommerce Store",
    "logoUrl": null,
    "bannerImages": [],
    "description": "Welcome to our online store",
    "email": "contact@mystore.com",
    "phone": "+1234567890",
    "websiteUrl": null,
    "address": {
      "street": "123 Main Street",
      "city": "New York",
      "state": "NY",
      "country": "USA",
      "zip": "10001"
    },
    "socialLinks": {},
    "currencyCode": "USD",
    "language": "en"
  }
}
```

### 5. Get All Shops (Admin Only)
```bash
curl -X GET http://localhost:5000/api/shop/admin/all \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "shopId": "cm4xyz...",
      "shopName": "My Ecommerce Store",
      "shopCode": "SHOP001",
      "isActive": true,
      "createdAt": "2024-01-17T10:00:00.000Z"
    }
  ]
}
```

### 6. Create New Shop (Admin Only)
```bash
curl -X POST http://localhost:5000/api/shop/admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "shopName": "Fashion Store",
    "shopCode": "FASH001",
    "email": "contact@fashionstore.com",
    "phone": "+1234567890",
    "address": {
      "street": "456 Fashion Avenue",
      "city": "Los Angeles",
      "state": "CA",
      "country": "USA",
      "zip": "90001"
    },
    "description": "Premium Fashion and Lifestyle Store",
    "websiteUrl": "https://fashionstore.com",
    "logoUrl": "https://example.com/logo.png",
    "bannerImages": [
      "https://example.com/banner1.jpg",
      "https://example.com/banner2.jpg"
    ],
    "socialLinks": {
      "facebook": "https://facebook.com/fashionstore",
      "instagram": "https://instagram.com/fashionstore",
      "tiktok": "https://tiktok.com/@fashionstore"
    },
    "currencyCode": "USD",
    "language": "en",
    "timezone": "America/Los_Angeles"
  }'
```
**Response:**
```json
{
  "success": true,
  "message": "Shop created successfully",
  "data": {
    "shopId": "cm4abc...",
    "shopName": "Fashion Store",
    "shopCode": "FASH001",
    "isActive": true,
    "createdAt": "2024-01-17T11:00:00.000Z"
  }
}
```

### 7. Get Shop Statistics (Admin Dashboard)
```bash
curl -X GET http://localhost:5000/api/shop/admin/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```
**Response:**
```json
{
  "success": true,
  "data": {
    "totalProducts": 0,
    "totalOrders": 0,
    "totalCustomers": 0,
    "todayOrders": 0
  }
}
```

### 8. Get Shop by ID (Admin Only)
```bash
curl -X GET http://localhost:5000/api/shop/admin/SHOP_ID_HERE \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```
**Response:**
```json
{
  "success": true,
  "data": {
    "shopId": "cm4xyz...",
    "shopName": "Fashion Store",
    "shopCode": "FASH001",
    "email": "contact@fashionstore.com",
    "phone": "+1234567890",
    "address": { ... },
    "isActive": true,
    "createdAt": "2024-01-17T11:00:00.000Z",
    "updatedAt": "2024-01-17T11:00:00.000Z"
  }
}
```

### 9. Update Shop (Admin Only)
```bash
curl -X PUT http://localhost:5000/api/shop/admin/SHOP_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "shopName": "Updated Fashion Store",
    "description": "Premium Fashion and Lifestyle Store - Now with more collections",
    "phone": "+9876543210",
    "socialLinks": {
      "facebook": "https://facebook.com/newfashionstore",
      "instagram": "https://instagram.com/newfashionstore",
      "youtube": "https://youtube.com/newfashionstore"
    }
  }'
```
**Response:**
```json
{
  "success": true,
  "message": "Shop updated successfully",
  "data": {
    "shopId": "cm4xyz...",
    "shopName": "Updated Fashion Store",
    "description": "Premium Fashion and Lifestyle Store - Now with more collections",
    "phone": "+9876543210",
    "updatedAt": "2024-01-17T12:00:00.000Z"
  }
}
```

### 10. Activate Specific Shop (Admin Only)
```bash
curl -X PUT http://localhost:5000/api/shop/admin/SHOP_ID_HERE/activate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```
**Response:**
```json
{
  "success": true,
  "message": "Shop activated successfully",
  "data": {
    "shopId": "cm4xyz...",
    "shopName": "Fashion Store",
    "isActive": true
  }
}
```

### 11. Delete Shop (Admin Only)
```bash
curl -X DELETE http://localhost:5000/api/shop/admin/SHOP_ID_HERE \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```
**Response:**
```json
{
  "success": true,
  "message": "Shop deleted successfully",
  "data": null
}
```

## Error Examples

### Validation Error
```bash
curl -X POST http://localhost:5000/api/shop/admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "shopName": "Invalid Shop",
    "shopCode": "TOOLONGCODE123456",
    "email": "invalid-email",
    "phone": ""
  }'
```
**Response:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "shopCode",
      "message": "Shop code must be 3-10 characters"
    },
    {
      "field": "email",
      "message": "Valid email is required"
    },
    {
      "field": "phone",
      "message": "Phone number is required"
    }
  ]
}
```

### Unauthorized Access
```bash
curl -X GET http://localhost:5000/api/shop/admin/all
```
**Response:**
```json
{
  "success": false,
  "message": "No token provided"
}
```

### Duplicate Shop Code
```bash
curl -X POST http://localhost:5000/api/shop/admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "shopName": "Another Shop",
    "shopCode": "SHOP001",
    "email": "another@shop.com",
    "phone": "+1234567890",
    "address": {
      "street": "789 Another Street",
      "city": "Chicago",
      "country": "USA"
    }
  }'
```
**Response:**
```json
{
  "success": false,
  "message": "Shop code already exists"
}
```

## Notes
1. **Single Active Shop**: Only one shop can be active at a time. Creating or activating a shop automatically deactivates all others.
2. **Caching**: The public `/api/shop` endpoint caches the active shop data for 5 minutes to improve performance.
3. **Shop Code**: Must be unique, 3-10 characters, alphanumeric only. Automatically converted to uppercase.
4. **Required Fields**: shopName, shopCode, email, phone, and address (street, city, country) are required when creating a shop.
5. **Admin Only**: All `/admin` endpoints require a valid admin JWT token in the Authorization header.
6. **Shop Deletion**: Cannot delete the only active shop. Must have at least one other shop before deletion.