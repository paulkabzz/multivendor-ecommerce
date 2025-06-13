import jwt from 'jsonwebtoken';

export function generateVerificationToken(email: string, userId: string): string {
  const payload = {
    email,
    userId,
    type: 'email_verification',
    timestamp: Date.now()
  };
  
  const secret = process.env.JWT_SECRET;

  if (!secret) throw new Error("JWT_SECRET environment variable not set");

  return jwt.sign(payload, secret, { expiresIn: '24h' });
}

export function verifyVerificationToken(token: string): { email: string; userId: string } | null {
  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) throw new Error("JWT_SECRET environment variable not set");

    const decoded = jwt.verify(token, secret) as any;
    
    if (decoded.type !== 'email_verification') {
      return null;
    }
    
    return {
      email: decoded.email,
      userId: decoded.userId
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}