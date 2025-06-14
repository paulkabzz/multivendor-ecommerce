import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { withAuth } from "../utils/middleware";

async function createDepartment(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const headers = {
        'Content-Type': 'application/json'
    };

    return {
        status: 405,
        headers,
        body: JSON.stringify({ success: false, message: "Method not allowed" })        
    }
}

const adminCreateDepartment = withAuth(createDepartment, ['ADMIN']);

app.http('create-department', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: adminCreateDepartment
});