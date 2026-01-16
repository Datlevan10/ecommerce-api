# Authentication API Testing Commands

## 1. Register - Customer

### cURL Command:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "+1234567890"
  }'
```

### Expected Success Response (201):
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "customer": {
      "customerId": "cm5v8k9x40000qwer123456",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "verificationToken": "abc123xyz456..."
  }
}
```

### Validation Error Response (422):
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Full name is required",
      "param": "fullName",
      "location": "body"
    },
    {
      "msg": "Valid email is required",
      "param": "email",
      "location": "body"
    },
    {
      "msg": "Password must be at least 6 characters",
      "param": "password",
      "location": "body"
    }
  ]
}
```

### Email Already Exists Error (400):
```json
{
  "success": false,
  "message": "Email already registered"
}
```

---

## 2. Login - Customer

### cURL Command:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Success Response (200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "customer": {
      "customerId": "cm5v8k9x40000qwer123456",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "emailVerifiedAt": null
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtNXY4azl4NDAwMDBxd2VyMTIzNDU2IiwiZW1haWwiOiJqb2huQGV4YW1wbGUuY29tIiwidHlwZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzM3MDE2ODEyLCJleHAiOjE3MzcwMTc3MTJ9.abc123",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtNXY4azl4NDAwMDBxd2VyMTIzNDU2IiwiZW1haWwiOiJqb2huQGV4YW1wbGUuY29tIiwidHlwZSI6ImN1c3RvbWVyIiwidG9rZW5JZCI6IjEyM2FiYyIsImlhdCI6MTczNzAxNjgxMiwiZXhwIjoxNzM3NjIxNjEyfQ.xyz789"
    }
  }
}
```

### Invalid Credentials Response (401):
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### Account Banned Response (401):
```json
{
  "success": false,
  "message": "Account is banned"
}
```

---

## 3. Verify Email

### cURL Command:
```bash
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123xyz456..."
  }'
```

### Success Response (200):
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "message": "Email verified successfully"
  }
}
```

### Invalid/Expired Token Response (400):
```json
{
  "success": false,
  "message": "Invalid verification token"
}
```

### Expired Token Response (400):
```json
{
  "success": false,
  "message": "Verification token expired"
}
```

---

## 4. Refresh Token

### cURL Command:
```bash
curl -X POST http://localhost:3000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

### Success Response (200):
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.newAccessToken...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.newRefreshToken..."
  }
}
```

### Invalid Refresh Token Response (401):
```json
{
  "success": false,
  "message": "Invalid refresh token"
}
```

---

## 5. Authenticated Request - Get Profile

### cURL Command (with valid access token):
```bash
curl -X GET http://localhost:3000/api/customers/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Success Response (200):
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "customerId": "cm5v8k9x40000qwer123456",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "avatarUrl": null,
    "emailVerifiedAt": "2024-01-16T10:30:00.000Z",
    "status": "active",
    "createdAt": "2024-01-16T10:00:00.000Z",
    "updatedAt": "2024-01-16T10:30:00.000Z"
  }
}
```

### No Token Response (401):
```json
{
  "success": false,
  "message": "No token provided"
}
```

### Invalid Token Response (401):
```json
{
  "success": false,
  "message": "Invalid token"
}
```

### Expired Token Response (401):
```json
{
  "success": false,
  "message": "Token expired"
}
```

---

## Quick Test Sequence

### 1. First, register a new user:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"test@example.com","password":"test123"}'
```

### 2. Login with the registered user:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### 3. Copy the accessToken from login response and test authenticated request:
```bash
curl -X GET http://localhost:3000/api/customers/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### 4. Test refresh token (use refreshToken from login):
```bash
curl -X POST http://localhost:3000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN_HERE"}'
```

---

## Testing Tips

1. **Save tokens to variables (bash)**:
```bash
# After login, save tokens
ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIs..."
REFRESH_TOKEN="eyJhbGciOiJIUzI1NiIs..."

# Use in requests
curl -X GET http://localhost:3000/api/customers/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

2. **Test validation errors**:
```bash
# Missing required fields
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{}'

# Invalid email format
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test","email":"invalid-email","password":"123"}'
```

3. **Test duplicate email**:
```bash
# Register same email twice
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"User 1","email":"duplicate@example.com","password":"test123"}'

curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"User 2","email":"duplicate@example.com","password":"test456"}'
```

4. **Test wrong credentials**:
```bash
# Wrong password
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpassword"}'

# Non-existent email
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@example.com","password":"test123"}'
```

---

## Notes

- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Email verification token expires in 24 hours
- Password reset token expires in 1 hour
- All timestamps are in UTC
- Customer IDs are CUID format
- Passwords must be at least 6 characters
- Phone numbers are validated for mobile format