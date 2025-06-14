import { HttpRequest, HttpResponseInit } from "@azure/functions";
import jwt from 'jsonwebtoken';

export interface DecodedToken {
  user_id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Verifies a JWT token from the Authorization header
 * @param token The JWT token to verify
 * @returns The decoded token payload or null if invalid
 */
export function verifyAuthToken(token: string): DecodedToken | null {
  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) throw new Error("JWT_SECRET environment variable not set");

    // Verify and decode the token
    const decoded = jwt.verify(token, secret) as DecodedToken;
    
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Middleware to authenticate requests using JWT
 * @param request The HTTP request object
 * @param roles Optional array of roles allowed to access the endpoint
 * @returns An error response or null if authentication is successful
 */
export function authenticateRequest(request: HttpRequest, roles?: string[]): HttpResponseInit | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        message: 'Authentication required'
      })
    };
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyAuthToken(token);

  if (!decoded) {
    return {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        message: 'Invalid or expired token'
      })
    };
  }

  // Check role-based access if roles are specified
  if (roles && roles.length > 0 && !roles.includes(decoded.role)) {
    return {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        message: 'You do not have permission to access this resource'
      })
    };
  }

  // Authentication successful
  return null;
}