
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

async function signup(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const headers = {
            'Content-Type': 'application/json'
    };

    try {
        return {
            status: 200, headers, body: "OK"
        };

    } catch (error) {
        context.log(error)
        return {
            status: 500, headers, body: "Internal server error"
        }
    }
}

app.http('sign-up',
   { 
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: signup
}
    
)