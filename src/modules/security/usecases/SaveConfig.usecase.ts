import { ISecurityRepository } from '../security.repository.js';
import { encrypt } from '../../../models/Database.js';

export class SaveConfigUseCase {
  constructor(private securityRepository: ISecurityRepository) {}

  async execute(data: any) {
    const { preFlightCheckEnabled, preFlightTimeoutMs, plainDatabaseUrl, dbProvider, plainSecretToken, localDatabaseEnabled, videoServerUrl, videosEnabled, maxVideoSizeMB } = data;

    const dbConfig = this.securityRepository.getConfig();

    dbConfig.preFlightCheckEnabled = preFlightCheckEnabled !== false;
    dbConfig.preFlightTimeoutMs = typeof preFlightTimeoutMs === 'number' ? preFlightTimeoutMs : 8000;
    
    if (localDatabaseEnabled !== undefined) {
      dbConfig.localDatabaseEnabled = localDatabaseEnabled === true || localDatabaseEnabled === 'true';
    }

    if (dbProvider !== undefined) {
      dbConfig.dbProvider = dbProvider;
    }

    if (videoServerUrl !== undefined) {
      dbConfig.videoServerUrl = videoServerUrl;
    }

    if (videosEnabled !== undefined) {
      dbConfig.videosEnabled = videosEnabled === true || videosEnabled === 'true';
    }

    if (maxVideoSizeMB !== undefined) {
      dbConfig.maxVideoSizeMB = typeof maxVideoSizeMB === 'number' ? maxVideoSizeMB : Number(maxVideoSizeMB) || 10;
    }

    if (plainDatabaseUrl !== undefined) {
      if (plainDatabaseUrl.trim() === '') {
        dbConfig.encryptedDbUrl = '';
      } else {
        const encrypted = encrypt(plainDatabaseUrl.trim());
        if (encrypted) {
          dbConfig.encryptedDbUrl = encrypted;
        }
      }
    }

    if (plainSecretToken !== undefined) {
      if (plainSecretToken.trim() === '') {
        dbConfig.encryptedSecretToken = '';
      } else {
        const encrypted = encrypt(plainSecretToken.trim());
        if (encrypted) {
          dbConfig.encryptedSecretToken = encrypted;
        }
      }
    }

    this.securityRepository.saveConfig(dbConfig);
    return dbConfig;
  }
}
