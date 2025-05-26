import nodemailer from 'nodemailer';

export interface VerificationEmailData {
  to: string;
  firstName: string;
  verificationToken: string;
  baseUrl: string;
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, 
    pass: process.env.GMAIL_APP_PASSWORD 
  }
});

export async function sendVerificationEmail(data: VerificationEmailData): Promise<boolean> {
  try {
    const verificationUrl = `${data.baseUrl}/api/verify-email?token=${data.verificationToken}`;
    
    const mailOptions = {
      from: `"Market Place" <${process.env.GMAIL_USER}>`,
      to: data.to,
      subject: 'Verify Your Account - Market Place',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>Verify Your Account</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #fff;
              background: linear-gradient(135deg, #131313 0%, #1a1a1a 100%);
              margin: 0;
              padding: 20px 0;
            }
            
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background: #131313;
              border-radius: 24px;
              overflow: hidden;
              box-shadow: 
                0 20px 40px rgba(0, 0, 0, 0.4),
                0 0 0 1px rgba(255, 255, 255, 0.05);
              position: relative;
            }
            
            .email-container::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 2px;
              background: linear-gradient(90deg, #fff 0%, #fff 50%, transparent 100%);
              opacity: 0.8;
            }
            
            .header {
              background: linear-gradient(135deg, #131313 0%, #1f1f1f 100%);
              padding: 60px 40px 40px;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            
            .header::before {
              content: '';
              position: absolute;
              top: -50%;
              left: -50%;
              width: 200%;
              height: 200%;
              background: radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, transparent 70%);
              animation: subtle-pulse 4s ease-in-out infinite;
            }
            
            @keyframes subtle-pulse {
              0%, 100% { opacity: 0.5; }
              50% { opacity: 1; }
            }
            
            .logo {
              width: 60px;
              height: 60px;
              background: linear-gradient(135deg, #fff 0%, #e0e0e0 100%);
              border-radius: 16px;
              margin: 0 auto 24px;
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
              z-index: 1;
              box-shadow: 0 8px 32px rgba(255, 255, 255, 0.1);
            }
            
            .logo::after {
              content: 'MP';
              font-size: 24px;
              font-weight: 800;
              color: #131313;
              letter-spacing: -1px;
            }
            
            .brand-name {
              font-size: 32px;
              font-weight: 700;
              color: #fff;
              margin-bottom: 8px;
              letter-spacing: -0.5px;
              position: relative;
              z-index: 1;
            }
            
            .tagline {
              font-size: 16px;
              color: rgba(255, 255, 255, 0.7);
              font-weight: 400;
              position: relative;
              z-index: 1;
            }
            
            .content {
              padding: 50px 40px;
              background: #131313;
            }
            
            .greeting {
              font-size: 28px;
              font-weight: 600;
              color: #fff;
              margin-bottom: 24px;
              letter-spacing: -0.3px;
            }
            
            .message {
              font-size: 18px;
              color: rgba(255, 255, 255, 0.85);
              margin-bottom: 20px;
              line-height: 1.7;
            }
            
            .cta-section {
              text-align: center;
              margin: 50px 0;
            }
            
            .verify-button {
              display: inline-block;
              background: linear-gradient(135deg, #fff 0%, #f0f0f0 100%);
              color: #131313;
              text-decoration: none;
              padding: 18px 40px;
              border-radius: 50px;
              font-size: 18px;
              font-weight: 600;
              letter-spacing: 0.5px;
              box-shadow: 
                0 12px 24px rgba(255, 255, 255, 0.15),
                0 4px 8px rgba(255, 255, 255, 0.1);
              transition: all 0.3s ease;
              position: relative;
              overflow: hidden;
            }
            
            .verify-button::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
              transition: left 0.5s;
            }
            
            .verify-button:hover::before {
              left: 100%;
            }
            
            .security-note {
              background: rgba(255, 255, 255, 0.03);
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 16px;
              padding: 24px;
              margin: 40px 0;
            }
            
            .security-icon {
              width: 32px;
              height: 32px;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 8px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 12px;
            }
            
            .security-icon::after {
              content: '🔒';
              font-size: 16px;
            }
            
            .security-title {
              font-size: 16px;
              font-weight: 600;
              color: #fff;
              margin-bottom: 8px;
            }
            
            .security-text {
              font-size: 14px;
              color: rgba(255, 255, 255, 0.7);
              line-height: 1.5;
            }
            
            .link-section {
              background: rgba(255, 255, 255, 0.02);
              border-radius: 12px;
              padding: 20px;
              margin: 30px 0;
              border: 1px solid rgba(255, 255, 255, 0.05);
            }
            
            .link-label {
              font-size: 14px;
              color: rgba(255, 255, 255, 0.6);
              margin-bottom: 8px;
              font-weight: 500;
            }
            
            .verification-link {
              word-break: break-all;
              color: rgba(255, 255, 255, 0.8);
              text-decoration: none;
              font-size: 14px;
              font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
              background: rgba(255, 255, 255, 0.05);
              padding: 12px;
              border-radius: 8px;
              display: block;
              border: 1px solid rgba(255, 255, 255, 0.08);
            }
            
            .footer {
              background: linear-gradient(135deg, #0a0a0a 0%, #131313 100%);
              padding: 40px;
              text-align: center;
              border-top: 1px solid rgba(255, 255, 255, 0.05);
            }
            
            .footer-content {
              margin-bottom: 24px;
            }
            
            .footer-text {
              font-size: 14px;
              color: rgba(255, 255, 255, 0.5);
              margin-bottom: 8px;
            }
            
            .copyright {
              font-size: 12px;
              color: rgba(255, 255, 255, 0.4);
              font-weight: 400;
            }
            
            .divider {
              height: 1px;
              background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
              margin: 30px 0;
            }
            
            /* Mobile responsiveness */
            @media only screen and (max-width: 600px) {
              body {
                padding: 10px 0;
              }
              
              .email-container {
                margin: 0 10px;
                border-radius: 16px;
              }
              
              .header {
                padding: 40px 20px 30px;
              }
              
              .content {
                padding: 30px 20px;
              }
              
              .footer {
                padding: 30px 20px;
              }
              
              .brand-name {
                font-size: 28px;
              }
              
              .greeting {
                font-size: 24px;
              }
              
              .message {
                font-size: 16px;
              }
              
              .verify-button {
                padding: 16px 32px;
                font-size: 16px;
              }
            }
            
            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
              .email-container {
                box-shadow: 
                  0 20px 40px rgba(0, 0, 0, 0.6),
                  0 0 0 1px rgba(255, 255, 255, 0.08);
              }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <div class="logo"></div>
              <div class="brand-name">Market Place</div>
              <div class="tagline">Your Premium Marketplace Experience</div>
            </div>
            
            <div class="content">
              <h1 class="greeting">Welcome, ${data.firstName}!</h1>
              
              <p class="message">
                Thank you for joining Market Place. We're excited to have you as part of our premium community.
              </p>
              
              <p class="message">
                To complete your registration and unlock all features, please verify your email address by clicking the button below:
              </p>
              
              <div class="cta-section">
                <a href="${verificationUrl}" class="verify-button">
                  Verify Email Address
                </a>
              </div>
              
              <div class="security-note">
                <div class="security-icon"></div>
                <div class="security-title">Security Notice</div>
                <div class="security-text">
                  This verification link will expire in 24 hours for your security. If you didn't create this account, please ignore this email.
                </div>
              </div>
              
              <div class="divider"></div>
              
              <div class="link-section">
                <div class="link-label">Alternative verification link:</div>
                <a href="${verificationUrl}" class="verification-link">${verificationUrl}</a>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-content">
                <div class="footer-text">
                  Need help? Contact our support team anytime.
                </div>
              </div>
              <div class="copyright">
                &copy; 2024 Market Place. All rights reserved.
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}