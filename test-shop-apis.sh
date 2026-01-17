#!/bin/bash

# Shop API Testing Script
# Make sure the server is running on port 5000

BASE_URL="http://localhost:5000/api"
ADMIN_TOKEN=""  # Will be set after admin login

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Shop API Testing ===${NC}"
echo ""

# 1. First, create an admin account (if not exists)
echo -e "${GREEN}1. Creating Admin Account...${NC}"
curl -X POST ${BASE_URL}/auth/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@shop.com",
    "password": "Admin123!",
    "adminCode": "ADMIN2024"
  }' | json_pp

echo ""
echo "Press Enter to continue..."
read

# 2. Login as admin to get token
echo -e "${GREEN}2. Admin Login...${NC}"
RESPONSE=$(curl -s -X POST ${BASE_URL}/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@shop.com",
    "password": "Admin123!"
  }')

echo "$RESPONSE" | json_pp

# Extract token from response
ADMIN_TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*' | grep -o '[^"]*$')

if [ -z "$ADMIN_TOKEN" ]; then
    echo "Failed to get admin token. Please check if admin exists and credentials are correct."
    exit 1
fi

echo ""
echo "Admin Token obtained: ${ADMIN_TOKEN:0:20}..."
echo "Press Enter to continue..."
read

# 3. Initialize default shop (first time setup)
echo -e "${GREEN}3. Initialize Default Shop (System Setup)...${NC}"
curl -X POST ${BASE_URL}/shop/admin/initialize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | json_pp

echo ""
echo "Press Enter to continue..."
read

# 4. Get active shop (Public API - no auth needed)
echo -e "${GREEN}4. Get Active Shop (Public API)...${NC}"
curl -X GET ${BASE_URL}/shop | json_pp

echo ""
echo "Press Enter to continue..."
read

# 5. Get all shops (Admin only)
echo -e "${GREEN}5. Get All Shops (Admin)...${NC}"
curl -X GET ${BASE_URL}/shop/admin/all \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | json_pp

echo ""
echo "Press Enter to continue..."
read

# 6. Create a new shop (Admin only)
echo -e "${GREEN}6. Create New Shop (Admin)...${NC}"
curl -X POST ${BASE_URL}/shop/admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
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
  }' | json_pp

echo ""
echo "Press Enter to continue..."
read

# Get the shop ID from the previous response for update/delete operations
echo -e "${GREEN}7. Get Shop Stats (Admin Dashboard)...${NC}"
curl -X GET ${BASE_URL}/shop/admin/stats \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | json_pp

echo ""
echo "Press Enter to continue..."
read

# 8. Get shop by ID (need to manually set SHOP_ID)
echo -e "${GREEN}8. Get Shop by ID (Admin)...${NC}"
echo "Note: Replace SHOP_ID_HERE with actual shop ID from previous responses"
# Example: curl -X GET ${BASE_URL}/shop/admin/SHOP_ID_HERE \
#   -H "Authorization: Bearer ${ADMIN_TOKEN}" | json_pp

echo ""
echo "Press Enter to continue..."
read

# 9. Update shop (need to manually set SHOP_ID)
echo -e "${GREEN}9. Update Shop Example (Admin)...${NC}"
echo "Example command (replace SHOP_ID_HERE with actual ID):"
echo 'curl -X PUT ${BASE_URL}/shop/admin/SHOP_ID_HERE \'
echo '  -H "Content-Type: application/json" \'
echo '  -H "Authorization: Bearer ${ADMIN_TOKEN}" \'
echo '  -d "{"'
echo '    "shopName": "Updated Fashion Store",'
echo '    "description": "Premium Fashion and Lifestyle Store - Updated",'
echo '    "phone": "+9876543210"'
echo '  }" | json_pp'

echo ""
echo "Press Enter to continue..."
read

# 10. Activate specific shop (need to manually set SHOP_ID)
echo -e "${GREEN}10. Activate Shop Example (Admin)...${NC}"
echo "Example command (replace SHOP_ID_HERE with actual ID):"
echo 'curl -X PUT ${BASE_URL}/shop/admin/SHOP_ID_HERE/activate \'
echo '  -H "Authorization: Bearer ${ADMIN_TOKEN}" | json_pp'

echo ""
echo "Press Enter to continue..."
read

# 11. Test validation errors
echo -e "${GREEN}11. Test Validation Error (Invalid Shop Creation)...${NC}"
curl -X POST ${BASE_URL}/shop/admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -d '{
    "shopName": "Invalid Shop",
    "shopCode": "TOO_LONG_CODE_123456",
    "email": "invalid-email",
    "phone": ""
  }' | json_pp

echo ""
echo "Press Enter to continue..."
read

# 12. Test unauthorized access
echo -e "${GREEN}12. Test Unauthorized Access (No Token)...${NC}"
curl -X GET ${BASE_URL}/shop/admin/all | json_pp

echo ""
echo -e "${YELLOW}=== Shop API Testing Complete ===${NC}"
echo ""
echo "Summary of endpoints tested:"
echo "✓ POST   /api/shop/admin/initialize    - Initialize default shop"
echo "✓ GET    /api/shop                      - Get active shop (public)"
echo "✓ GET    /api/shop/admin/all            - Get all shops (admin)"
echo "✓ POST   /api/shop/admin                - Create new shop (admin)"
echo "✓ GET    /api/shop/admin/stats          - Get shop statistics (admin)"
echo "✓ GET    /api/shop/admin/:id            - Get shop by ID (admin)"
echo "✓ PUT    /api/shop/admin/:id            - Update shop (admin)"
echo "✓ PUT    /api/shop/admin/:id/activate   - Activate shop (admin)"
echo "✓ DELETE /api/shop/admin/:id            - Delete shop (admin)"
echo ""
echo "Notes:"
echo "- Only one shop can be active at a time"
echo "- Creating/activating a shop deactivates all others"
echo "- Shop data is cached for 5 minutes on public endpoint"
echo "- Admin endpoints require valid JWT token"