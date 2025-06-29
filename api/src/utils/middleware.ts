import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { authenticateRequest, DecodedToken, verifyAuthToken } from "./authMiddleware";
import { validateToken } from "../functions/logout";

/**
 * Type for HTTP handler functions
 */
type HttpHandler = (request: HttpRequest, context: InvocationContext, decodedToken?: DecodedToken) => Promise<HttpResponseInit>;

/**
 * Higher-order function that wraps an HTTP handler with authentication
 * @param handler The original handler function
 * @param roles Optional array of roles allowed to access the endpoint
 * @returns A new handler function with authentication
 */
export function withAuth(handler: HttpHandler, roles?: string[]): HttpHandler {
  return async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {

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
    const validToken = await validateToken(token);
    

    const authError = authenticateRequest(request, roles, validToken);
    if (authError) return authError;
    

    const decodedToken = verifyAuthToken(token) as DecodedToken;
    

    return handler(request, context, decodedToken);
  };
}