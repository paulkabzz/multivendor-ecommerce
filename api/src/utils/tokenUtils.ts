import jwt from 'jsonwebtoken';

export function generateVerificationToken(email: string, userId: string): string {
  const payload = {
    email,
    userId,
    type: 'email_verification',
    timestamp: Date.now()
  };
  
  const secret = process.env.JWT_SECRET || '';
  return jwt.sign(payload, secret, { expiresIn: '24h' });
}

export function verifyVerificationToken(token: string): { email: string; userId: string } | null {
  try {
    const secret = process.env.JWT_SECRET || '';
    const decoded = jwt.verify(token, secret) as any;
    
    if (decoded.type !== 'email_verification') {
      return null;
    }
    
    return {
      email: decoded.email,
      userId: decoded.userId
    };
  } catch (error) {
    return null;
  }
}