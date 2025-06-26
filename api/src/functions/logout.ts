import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { headers } from "../utils/helpers";
import prisma from "../utils/database";
import jwt from 'jsonwebtoken';

async function logout(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Processing logout request for URL "${request.url}"`);

    if (request.method === "POST") {
        try {
            const authHeader = request.headers.get('authorization');
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return {
                    status: 401,
                    headers,
                    body: JSON.stringify({ success: false, message: "No token provided" })
                };
            }

            const token = authHeader.substring(7);
            const jwtSecret = process.env.JWT_SECRET;
            
            if (!jwtSecret) throw new Error("JWT_SECRET environment variable not set.");

            const decoded = jwt.verify(token, jwtSecret) as any;
            
            await prisma.tokenblacklist.create({
                data: {
                    token_jti: decoded.jti,
                    expires_at: new Date(decoded.exp * 1000)
                }
            });

            return {
                status: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    message: "Logged out successfully" 
                })
            };

        } catch (error) {
            context.log('Logout error:', error);
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

export async function validateToken(token: string): Promise<boolean> {
    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) throw new Error("JWT_SECRET environment variable not set.");

        const decoded = jwt.verify(token, jwtSecret) as any;
        
        const blacklistedToken = await prisma.tokenblacklist.findUnique({
            where: { token_jti: decoded.jti }
        });

        if (blacklistedToken) {
            return false;
        }

        return true;
    } catch (error) {
        return false;
    }
}

export async function cleanupExpiredTokens() {
    await prisma.tokenblacklist.deleteMany({
        where: {
            expires_at: {
                lt: new Date()
            }
        }
    });
}

app.http('logout', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: logout
});