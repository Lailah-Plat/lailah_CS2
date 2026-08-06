import jwt from 'jsonwebtoken';

export interface ITokenService {
  sign(payload: object, expiresIn?: string): string;
  verify(token: string): any | null;
}

export class TokenService implements ITokenService {
  private secret: string;

  constructor() {
    const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'lailah_default_dev_encryption_key_2026';
    this.secret = secret;
  }

  /**
   * Signs a payload and returns a secure JWT token
   */
  sign(payload: object, expiresIn: string = '7d'): string {
    return jwt.sign(payload, this.secret, { expiresIn: expiresIn as any });
  }

  /**
   * Verifies a secure JWT token and returns the decoded payload or null
   */
  verify(token: string): any | null {
    try {
      return jwt.verify(token, this.secret);
    } catch {
      return null;
    }
  }
}
