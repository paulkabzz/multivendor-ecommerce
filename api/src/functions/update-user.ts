import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import prisma from "../utils/database";
import { IUpdateUserRequest, IUser } from "../utils/types";
import { DecodedToken } from "../utils/authMiddleware";
import { withAuth } from "../utils/middleware";
import { generateVerificationToken } from "../utils/tokenUtils";
import { sendVerificationEmail } from "../utils/gmailService";
import { headers, isValidAppwriteImageUrl, isValidUCTEmail } from "../utils/helpers";

interface IUpdateUserWithImageRequest extends IUpdateUserRequest {
    profile_pic_url?: string;
}

async function updateUserHandler(request: HttpRequest, context: InvocationContext, decodedToken?: DecodedToken): Promise<HttpResponseInit> {

    if (request.method === "PATCH") {
        try {
            const { 
                first_name, 
                last_name, 
                email, 
                phone, 
                user_id, 
                profile_pic_url 
            } = await request.json() as IUpdateUserWithImageRequest;
        
            if (!user_id) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "No user ID provided"
                    })
                }
            };
            
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

            const existingUser = await prisma.users.findUnique({ where: {user_id: user_id}});

            if (!existingUser) {
                return {
                    status: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "User does not exist"
                    })
                }
            };

            const url: URL = new URL(request.url);
            const baseUrl: string = `${url.protocol}//localhost:5173`;

            // If user is not verified, resend verification email (skip for profile image updates)
            if (!existingUser?.is_verified && !profile_pic_url) {
                // Generate a new verification token
                const verificationToken = generateVerificationToken(existingUser.email, existingUser.user_id);
                
                // Send verification email
                const emailSent = await sendVerificationEmail({
                    to: existingUser.email,
                    firstName: existingUser.first_name,
                    verificationToken,
                    baseUrl
                });
                
                return {
                    status: 403,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        message: "Account is not verified. A new verification email has been sent to your email address.",
                        emailSent
                    })
                }
            };

            // Build update data object with only changed fields
            const updateData: Partial<IUpdateUserWithImageRequest> = {};
            if (first_name && first_name !== existingUser.first_name) updateData.first_name = first_name;
            if (last_name && last_name !== existingUser.last_name) updateData.last_name = last_name;
            if (phone && phone !== existingUser.phone) updateData.phone = phone;
            
            // Handle profile image URL update
            if (profile_pic_url !== undefined) {
                // Validate that the profile image URL is from the expected source (Appwrite)
                if (profile_pic_url && !isValidAppwriteImageUrl(profile_pic_url, user_id)) {
                    return {
                        status: 400,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            message: "Invalid profile image URL"
                        })
                    }
                }
                updateData.profile_pic_url = profile_pic_url;
            }
            
            // Check if email is being updated
            let emailUpdated = false;
            let verificationToken = null;
            
            if (email && email !== existingUser.email) {
                // Validate email format
                if (!isValidUCTEmail(email)) {
                    return {
                        status: 400,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            message: email + " is not a valid UCT email."
                        })
                    }
                }

                updateData.email = email;
                updateData.is_verified = false;
                emailUpdated = true;
                
                // Generate a new verification token for the new email
                verificationToken = generateVerificationToken(email, existingUser.user_id);
            }

            if (Object.keys(updateData).length === 0) {
                return {
                    status: 200,
                    headers,
                    body: JSON.stringify({ 
                        success: true, 
                        message: "No changes detected.",
                        user: existingUser 
                    })
                };
            }

            const updatedUser = await prisma.users.update({
                where: {
                    user_id
                },
                data: updateData
            });
            
            // If email was updated, send verification email to the new email address
            let emailSent = false;

            if (emailUpdated && verificationToken) {
                emailSent = await sendVerificationEmail({
                    to: email!,
                    firstName: updatedUser.first_name,
                    verificationToken,
                    baseUrl
                });
            }

            // Prepare response message based on what was updated
            let message = "User updated successfully";
            if (emailUpdated) {
                message = "User updated successfully. A verification email has been sent to your new email address. Please verify your email to complete the update.";
            } else if (profile_pic_url !== undefined) {
                message = "Profile picture updated successfully";
            }
            
            return {
                status: 201,
                headers: headers,
                body: JSON.stringify({
                    success: true,
                    message: message,
                    user: updatedUser,
                    emailSent: emailUpdated ? emailSent : undefined
                })
            }

        } catch (error) {
            context.log("Error updating user", error);
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

const UPDATE_USER = withAuth(updateUserHandler);

app.http('update-user', {
    methods: ['PATCH'],
    authLevel: 'anonymous',
    handler: UPDATE_USER
});