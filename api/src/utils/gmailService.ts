import nodemailer from "nodemailer";

export interface VerificationEmailData {
  to: string;
  firstName: string;
  verificationToken: string;
  baseUrl: string;
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendVerificationEmail(
  data: VerificationEmailData
): Promise<boolean> {
  try {
    const verificationUrl = `${data.baseUrl.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(data.verificationToken)}`;
    
    const mailOptions = {
      from: `"Market Place" <${process.env.GMAIL_USER}>`,
      to: data.to,
      subject: "Verify Your Account - Market Place",
      html: `     
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
            <title>Verify Your Email Address</title>
            <style>
                /* Reset styles for email clients */
                * {
                  font-family: Inter, Sans-Serif;
                }
                body, table, td, p, a, li, blockquote {
                    -webkit-text-size-adjust: 100%;
                    -ms-text-size-adjust: 100%;
                }
                table, td {
                    mso-table-lspace: 0pt;
                    mso-table-rspace: 0pt;
                }
                img {
                    -ms-interpolation-mode: bicubic;
                    border: 0;
                    height: auto;
                    line-height: 100%;
                    outline: none;
                    text-decoration: none;
                }
            </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <!-- Main container -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
                <tr>
                    <td style="padding: 40px 10px;">
                        <!-- Email content wrapper -->
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                            <!-- Header -->
                            <tr>
                                <td style="padding: 40px 25px 0 25px;">
                                    <!-- Logo placeholder -->
                                    <div style="display:flex; align-items: center;">
                                      <img src="https://github.com/paulkabzz/multivendor-ecommerce/blob/main/client/src/assets/logo-2.png?raw=true" href="logo" style="width: 45px; height:45px;"/>
                                      <h1 style="margin: 0 0 0 .5rem; font-size: 28px; font-weight: 800; color: #1f2937; line-height: 1.2;">
                                        Verify Your Email Address
                                      </h1>
                                    </div>
                                    <p style="font-size:12px; font-weight: 600;">
                                      Hello, ${data.firstName}!
                                    </p>
                                    <p style="margin: 0 0 16px 0; font-size: 12px; color: #6b7280; line-height: 1.5;">
                                        Thanks for signing up! Please verify your email address to complete your account setup.
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Main content -->
                            <tr>
                                <td style="padding: 0 25px;">
                                    <div style="background-color: #f9fafb; border-radius: 8px; padding: 32px; text-align: center; margin-bottom: 32px;">
                                        <p style="margin: 0 0 24px 0; font-size: 12px; color: #374151; line-height: 1.5;">
                                            Click the button below to verify your email address and activate your account:
                                        </p>
                                        
                                        <!-- Verification button -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                            <tr>
                                                <td style="border-radius: 8px; background-color: #131313; text-align: center;">
                                                    <a href="${verificationUrl}" 
                                                      style="display: inline-block; padding: 16px 16px; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 8px; transition: all 0.2s ease;">
                                                        Verify Email Address
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="margin: 12px 0 0 0; font-size: 12px; color: #6b7280; line-height: 1.5;">
                                            This link will expire in 24 hours for security reasons.
                                        </p>
                                    </div>
                                    
                                    <!-- Alternative verification -->
                                    <div style="text-align: center; margin-bottom: 32px;">
                                        <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
                                            If the button doesn't work, copy and paste this link into your browser:
                                        </p>
                                        <p style="margin: 0; font-size: 12px; font-weight: 600; color: #667eea; word-break: break-all; background-color: #f3f4f6; padding: 12px; border-radius: 6px; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;">
                                            ${verificationUrl}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="padding: 0 40px 40px 40px;">
                                    <div style="border-top: 1px solid #e5e7eb; padding-top: 32px; text-align: center;">
                                        <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; line-height: 1.5;">
                                            If you didn't create an account with us, you can safely ignore this email.
                                        </p>
                                        <p style="margin: 0 0 16px 0; font-size: 12px; color: #6b7280; line-height: 1.5;">
                                            Need help? Contact our support team at 
                                            <a href="uctmarketplace@gmail.com" style="color: #667eea; text-decoration: none;">uctmarketplace@gmail.com</a>
                                        </p>
                                        <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                                            &copy; ${new Date().getFullYear()} UCT Marketplace. All rights reserved.<br>
                                            UCT Upper Campus, Senior Lab.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return false;
  }
}
