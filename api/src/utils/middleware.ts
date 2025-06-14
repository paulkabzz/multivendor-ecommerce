import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { authenticateRequest, DecodedToken, verifyAuthToken } from "./authMiddleware";

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
    // Authenticate the request
    const authError = authenticateRequest(request, roles);
    if (authError) return authError;
    
    // Get token from authorization header
    const token = request.headers.get('authorization')!.split(' ')[1];
    const decodedToken = verifyAuthToken(token) as DecodedToken;
    
    // Call the original handler with the decoded token
    return handler(request, context, decodedToken);
  };
}