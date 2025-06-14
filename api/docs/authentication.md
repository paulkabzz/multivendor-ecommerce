# API Authentication Documentation

## Overview

This document provides information on how to use the authentication system implemented in the Market Place API. The authentication system uses JSON Web Tokens (JWT) to verify user identity and permissions before allowing access to protected resources.

## Authentication Flow

1. User logs in with email and password
2. Server validates credentials and returns a JWT token
3. Client includes the token in the Authorization header for subsequent requests
4. Server verifies the token and grants access to protected resources

## Token Format

The JWT token contains the following information:

```json
{
  "user_id": "user's unique identifier",
  "email": "user's email address",
  "role": "user's role (CUSTOMER, VENDOR, or ADMIN)",
  "iat": "issued at timestamp",
  "exp": "expiration timestamp"
}
```

## Making Authenticated Requests

To access protected endpoints, include the JWT token in the Authorization header using the Bearer scheme:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Authentication Middleware

The API uses a middleware-based approach to protect endpoints. There are two main components:

### 1. Direct Authentication

The `authenticateRequest` function in `authMiddleware.ts` can be used directly in the handler functions:

```typescript
import { authenticateRequest } from "../utils/authMiddleware";

async function yourHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  // Authenticate the request
  const authError = authenticateRequest(request);
  if (authError) return authError;
  
  // Get token from authorization header
  const token = request.headers.get('authorization')!.split(' ')[1];
  const decodedToken = verifyAuthToken(token) as DecodedToken;
  
  // handler logic here
}
```

### 2. Higher-Order Function Pattern

The recommended approach is to use the `withAuth` higher-order function from `middleware.ts`:

```typescript
import { withAuth } from "../utils/middleware";

async function yourHandler(request: HttpRequest, context: InvocationContext, decodedToken?: DecodedToken): Promise<HttpResponseInit> {
  //  handelr logic here goes here
  // decodedToken contains the user information from the JWT
}

// Apply authentication middleware to the handler
const protectedEndpoint = withAuth(yourHandler);

app.http('your-endpoint', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: protectedEndpoint
});
```

## Role-Based Access Control

You can restrict access to endpoints based on user roles:

```typescript
// Only allow ADMIN users to access this endpoint
const adminOnlyEndpoint = withAuth(yourHandler, ['ADMIN']);

// Allow both ADMIN and VENDOR users to access this endpoint
const restrictedEndpoint = withAuth(yourHandler, ['ADMIN', 'VENDOR']);
```

## Example: Protecting User Data

Here's a complete example of protecting an endpoint that updates user data:

```typescript
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import prisma from "../utils/database";
import { IUpdateUserRequest } from "../utils/types";
import { DecodedToken } from "../utils/authMiddleware";
import { withAuth } from "../utils/middleware";

async function updateUserHandler(request: HttpRequest, context: InvocationContext, decodedToken?: DecodedToken): Promise<HttpResponseInit> {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (request.method === "PATCH") {
    try {
      const { first_name, last_name, email, phone, user_id } = await request.json() as IUpdateUserRequest;
      
      // Verify that the user is updating their own profile or is an admin
      if (decodedToken && decodedToken.user_id !== user_id && decodedToken.role !== 'ADMIN') {
        return {
          status: 403,
          headers,
          body: JSON.stringify({
            success: false,
            message: "You are not authorised to update this user's information"
          })
        };
      };
      
      // Update user logic here...
    } catch (error) {
      // Error handling...
    }
  }

  return {
    status: 405,
    headers,
    body: JSON.stringify({ success: false, message: "Method not allowed" })
  };
}

// Apply authentication middleware to the handler
const updateUser = withAuth(updateUserHandler);

app.http('update-user', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  handler: updateUser
});
```

## Testing Authentication

You can test authentication using tools like cURL or Postman:

```bash
# First, get a token by logging in
curl -X POST http://localhost:7071/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"yourpassword"}'

# Then use the token to access a protected endpoint
curl http://localhost:7071/api/protected-endpoint \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Error Responses

Authentication errors will return one of the following responses:

- **401 Unauthorized**: Missing or invalid token
  ```json
  {
    "success": false,
    "message": "Authentication required"
  }
  ```
  or
  ```json
  {
    "success": false,
    "message": "Invalid or expired token"
  }
  ```

- **403 Forbidden**: Valid token but insufficient permissions
  ```json
  {
    "success": false,
    "message": "You do not have permission to access this resource"
  }
  ```
