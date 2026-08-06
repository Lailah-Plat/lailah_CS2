import { ISecurityRepository, maskUrl, maskToken } from '../security.repository.js';
import { decrypt } from '../../../models/Database.js';

export class GetConfigUseCase {
  constructor(private securityRepository: ISecurityRepository) {}

  async execute() {
    const dbConfig = this.securityRepository.getConfig();

    const preFlightCheckEnabled = dbConfig.preFlightCheckEnabled !== false;
    const preFlightTimeoutMs = dbConfig.preFlightTimeoutMs || 8000;
    const encryptedDbUrl = dbConfig.encryptedDbUrl || '';
    const dbProvider = dbConfig.dbProvider || 'supabase';
    const encryptedSecretToken = dbConfig.encryptedSecretToken || '';
    const localDatabaseEnabled = dbConfig.localDatabaseEnabled !== false;
    const videoServerUrl = dbConfig.videoServerUrl || 'https://vids.eventplatform.com/upload';
    const videosEnabled = dbConfig.videosEnabled === true;
    const maxVideoSizeMB = dbConfig.maxVideoSizeMB || 10;

    let decryptedUrl = '';
    if (encryptedDbUrl) {
      const dec = decrypt(encryptedDbUrl);
      if (dec) decryptedUrl = dec;
    }

    let decryptedSecretToken = '';
    if (encryptedSecretToken) {
      const dec = decrypt(encryptedSecretToken);
      if (dec) decryptedSecretToken = dec;
    }

    const envUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || '';

    return {
      config: {
        preFlightCheckEnabled,
        preFlightTimeoutMs,
        encryptedDbUrl,
        dbProvider,
        encryptedSecretToken,
        localDatabaseEnabled,
        videoServerUrl,
        videosEnabled,
        maxVideoSizeMB
      },
      envUrlMasked: envUrl ? maskUrl(envUrl) : '',
      decryptedUrlMasked: decryptedUrl ? maskUrl(decryptedUrl) : '',
      decryptedSecretTokenMasked: decryptedSecretToken ? maskToken(decryptedSecretToken) : '',
      hasEnvUrl: !!envUrl
    };
  }
}
