import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DecodedToken } from "../utils/authMiddleware";
import { withAuth } from "../utils/middleware";

/**
 * Example of a protected endpoint that requires authentication
 * This function can only be accessed by authenticated users
 */
async function protectedEndpointHandler(request: HttpRequest, context: InvocationContext, decodedToken?: DecodedToken): Promise<HttpResponseInit> {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (request.method === "GET") {
        try {
            // The user is already authenticated at this point
            // decodedToken contains the user information from the JWT
            
            return {
                status: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: "This is a protected endpoint",
                    user: {
                        user_id: decodedToken?.user_id,
                        email: decodedToken?.email,
                        role: decodedToken?.role
                    }
                })
            };
        } catch (error) {
            context.log("Error in protected endpoint", error);
            return {
                status: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "Internal server error"
                })
            };
        }
    }

    return {
        status: 405,
        headers,
        body: JSON.stringify({ success: false, message: "Method not allowed" })
    };
}

/**
 * Example of a protected endpoint that requires specific roles
 * This function can only be accessed by users with ADMIN role
 */
async function adminOnlyEndpointHandler(request: HttpRequest, context: InvocationContext, decodedToken?: DecodedToken): Promise<HttpResponseInit> {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (request.method === "GET") {
        try {
            return {
                status: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: "This is an admin-only endpoint",
                    user: {
                        user_id: decodedToken?.user_id,
                        email: decodedToken?.email,
                        role: decodedToken?.role
                    }
                })
            };
        } catch (error) {
            context.log("Error in admin-only endpoint", error);
            return {
                status: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "Internal server error"
                })
            };
        }
    }

    return {
        status: 405,
        headers,
        body: JSON.stringify({ success: false, message: "Method not allowed" })
    };
}

// Apply authentication middleware to the handlers
const protectedEndpoint = withAuth(protectedEndpointHandler);
const adminOnlyEndpoint = withAuth(adminOnlyEndpointHandler, ['ADMIN']);

// Register the HTTP functions
app.http('protected-endpoint', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: protectedEndpoint
});

app.http('admin-only-endpoint', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: adminOnlyEndpoint
});