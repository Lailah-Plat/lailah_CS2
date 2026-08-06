export class ResetTokenStore {
  private static store: Record<string, { code: string; expiresAt: Date }> = {};

  /**
   * Saves a verification code for an email with an expiration timestamp
   */
  static set(email: string, code: string, expiresAt: Date): void {
    this.store[email.toLowerCase().trim()] = { code, expiresAt };
  }

  /**
   * Retrieves the verification details for a given email
   */
  static get(email: string): { code: string; expiresAt: Date } | undefined {
    return this.store[email.toLowerCase().trim()];
  }

  /**
   * Deletes verification details after completion or expiry
   */
  static delete(email: string): void {
    delete this.store[email.toLowerCase().trim()];
  }
}
