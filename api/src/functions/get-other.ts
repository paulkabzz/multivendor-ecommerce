import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { headers } from "../utils/helpers";
import prisma from "../utils/database";

async function getBrands(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    if (request.method === "GET") {
        const brands = await prisma.brands.findMany();

        context.log(brands);

        if (!brands) {
            context.error("No brands found.")
            return {
                status: 404,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "Brands not found."
                })
            }
        }

        return {
            status: 201,
            headers,
            body: JSON.stringify({
                success:  true,
                brands
            })
        }

    }
    return {
        status: 405,
        headers,
        body: JSON.stringify({
            success: false,
            message: "Method not allowed."
        })
    }
}

async function getSizes(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    if (request.method === "GET") {
        const sizes = await prisma.sizes.findMany({
            select: {
                size_name: true,
                size_id: true
            }
        })

        if (!sizes) {
            context.error("No sizes found.")
            return {
                status: 404,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: "Sizes not found."
                })
            } 
        }

        return {
            status: 200,
            headers,
            body: JSON.stringify({
                success: true, 
                sizes 
            })
        }
    }


    return {
        status: 405,
        headers,
        body: JSON.stringify({
            success: false,
            message: "Method not allowed."
        })
    }
}

app.http('get-brands', {
    methods: ["GET"],
    authLevel: "anonymous",
    handler: getBrands
});

app.http('get-sizes', {
    methods: ["GET"],
    authLevel: "anonymous",
    handler: getSizes
});
