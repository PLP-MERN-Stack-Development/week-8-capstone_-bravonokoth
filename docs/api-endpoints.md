# API Endpoints Documentation

## Fish Supply & Delivery Platform REST API

**Base URL**: `http://localhost:5000/api`

---

## Authentication Endpoints

### POST /auth/register
**Description**: Register a new client user  
**Access**: Public  
**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "deliveryAddress": "123 Main St, Nairobi"
}
```
**Response**: `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "64f5a1b2c3d4e5f6g7h8i9j0",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "client"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /auth/login
**Description**: Login user and get JWT token  
**Access**: Public  
**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "64f5a1b2c3d4e5f6g7h8i9j0",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "client"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## Fish Management Endpoints

### GET /fish
**Description**: Get all available fish  
**Access**: Public  
**Query Parameters**:
- `type`: Filter by fish type (tilapia, omena, catfish, nileperch)
- `size`: Filter by size (2-8)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "fish": [
      {
        "id": "64f5a1b2c3d4e5f6g7h8i9j1",
        "type": "tilapia",
        "size": 4,
        "pricePerKg": 800,
        "stock": 50,
        "description": "Fresh tilapia, size 4"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25
    }
  }
}
```

### POST /fish
**Description**: Add new fish to inventory  
**Access**: Admin only  
**Headers**: `Authorization: Bearer <token>`  
**Request Body**:
```json
{
  "type": "tilapia",
  "size": 4,
  "pricePerKg": 800,
  "stock": 100,
  "description": "Fresh tilapia from Lake Victoria"
}
```
**Response**: `201 Created`

### PUT /fish/:id
**Description**: Update fish information  
**Access**: Admin only  
**Headers**: `Authorization: Bearer <token>`  
**Request Body**: (partial update allowed)
```json
{
  "stock": 75,
  "pricePerKg": 850
}
```
**Response**: `200 OK`

### DELETE /fish/:id
**Description**: Remove fish from inventory (soft delete)  
**Access**: Admin only  
**Headers**: `Authorization: Bearer <token>`  
**Response**: `200 OK`

---

## Order Management Endpoints

### POST /orders
**Description**: Create new order  
**Access**: Authenticated clients  
**Headers**: `Authorization: Bearer <token>`  
**Request Body**:
```json
{
  "items": [
    {
      "fishId": "64f5a1b2c3d4e5f6g7h8i9j1",
      "quantity": 2,
      "size": 4
    }
  ],
  "deliveryAddress": "123 Main St, Nairobi",
  "notes": "Please call before delivery"
}
```
**Response**: `201 Created`
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": {
      "id": "64f5a1b2c3d4e5f6g7h8i9j2",
      "orderNumber": "ORD-20231201-0001",
      "items": [...],
      "totalPrice": 1700,
      "status": "pending"
    }
  }
}
```

### GET /orders
**Description**: Get orders (user's own orders or all orders for admin)  
**Access**: Authenticated users  
**Headers**: `Authorization: Bearer <token>`  
**Query Parameters**:
- `status`: Filter by status
- `page`: Page number
- `limit`: Items per page

**Response**: `200 OK`

### PUT /orders/:id
**Description**: Update order status  
**Access**: Admin only  
**Headers**: `Authorization: Bearer <token>`  
**Request Body**:
```json
{
  "status": "processing",
  "notes": "Order is being prepared"
}
```
**Response**: `200 OK`

### GET /orders/:id
**Description**: Get specific order details  
**Access**: Order owner or Admin  
**Headers**: `Authorization: Bearer <token>`  
**Response**: `200 OK`

---

## User Profile Endpoints

### GET /users/me
**Description**: Get current user profile  
**Access**: Authenticated users  
**Headers**: `Authorization: Bearer <token>`  
**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64f5a1b2c3d4e5f6g7h8i9j0",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "client",
      "deliveryAddress": "123 Main St, Nairobi",
      "createdAt": "2023-12-01T10:00:00Z"
    }
  }
}
```

### PUT /users/me
**Description**: Update user profile  
**Access**: Authenticated users  
**Headers**: `Authorization: Bearer <token>`  
**Request Body**: (partial update allowed)
```json
{
  "name": "John Smith",
  "deliveryAddress": "456 New St, Nairobi",
  "password": "newpassword123"
}
```
**Response**: `200 OK`

---

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"]
}
```

### HTTP Status Codes
- `200 OK`: Successful GET, PUT requests
- `201 Created`: Successful POST requests
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate resource
- `500 Internal Server Error`: Server error

---

## Authentication

### JWT Token Format
**Header**: `Authorization: Bearer <token>`

### Token Payload
```json
{
  "userId": "64f5a1b2c3d4e5f6g7h8i9j0",
  "role": "client",
  "iat": 1701432000,
  "exp": 1701518400
}
```

### Token Expiration
- **Access Token**: 24 hours
- **Refresh**: Re-login required

---

## Rate Limiting

### Limits
- **Authentication**: 5 requests per minute
- **General API**: 100 requests per minute per user
- **Admin endpoints**: 200 requests per minute

### Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1701432000
```