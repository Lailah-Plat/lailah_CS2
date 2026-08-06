export interface NotificationDriver {
  /**
   * The name of the channel / driver (e.g. 'sms', 'email', 'whatsapp', 'push')
   */
  getChannelName(): string;

  /**
   * Sends a standard notification with standard text payload or HTML.
   */
  send(recipient: string, message: string, options?: any): Promise<boolean>;
}
