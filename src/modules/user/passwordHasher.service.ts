import bcrypt from 'bcryptjs';
import CryptoJS from 'crypto-js';

export interface IPasswordHasher {
  hash(password: string): string;
  verify(password: string, hash: string): boolean;
}

export class PasswordHasher implements IPasswordHasher {
  /**
   * Hashes a password securely using bcrypt with 10 salt rounds
   */
  hash(password: string): string {
    return bcrypt.hashSync(password, 10);
  }

  /**
   * Verifies if a plain text password matches a secure hash (with support for legacy SHA256 and plaintext)
   */
  verify(password: string, hash: string): boolean {
    try {
      if (password === hash) return true; // Plaintext legacy support (e.g. from seeds)
      
      // Check if it is a legacy SHA256 hash
      const sha256Hash = CryptoJS.SHA256(password).toString();
      if (sha256Hash === hash) return true;
      
      return bcrypt.compareSync(password, hash);
    } catch (err) {
      console.error("[PasswordHasher] Verification failed:", err);
      return false;
    }
  }
}
