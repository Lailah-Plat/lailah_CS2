import { ISecurityRepository, maskToken } from '../security.repository.js';
import { decrypt } from '../../../models/Database.js';

export class GetPaymentKeysUseCase {
  constructor(private securityRepository: ISecurityRepository) {}

  async execute() {
    const dbConfig = this.securityRepository.getConfig();

    const getDecryptedOrEnv = (encryptedKey: string, envName: string): string => {
      if (dbConfig[encryptedKey]) {
        const dec = decrypt(dbConfig[encryptedKey]);
        if (dec) return dec;
      }
      return process.env[envName] || '';
    };

    const moyasarSecretRaw = getDecryptedOrEnv('encryptedMoyasarSecret', 'MOYASAR_SECRET_KEY');
    const paytabsProfileRaw = getDecryptedOrEnv('encryptedPaytabsProfile', 'PAYTABS_PROFILE_ID');
    const paytabsServerRaw = getDecryptedOrEnv('encryptedPaytabsServer', 'PAYTABS_SERVER_KEY');
    const hyperpayEntityRaw = getDecryptedOrEnv('encryptedHyperpayEntity', 'HYPERPAY_ENTITY_ID');
    const geideaPublicRaw = getDecryptedOrEnv('encryptedGeideaPublic', 'GEIDEA_PUBLIC_KEY');
    const geideaMerchantRaw = getDecryptedOrEnv('encryptedGeideaMerchant', 'GEIDEA_MERCHANT_ID');
    const tabbySecretRaw = getDecryptedOrEnv('encryptedTabbySecret', 'TABBY_SECRET_KEY');
    const tamaraTokenRaw = getDecryptedOrEnv('encryptedTamaraToken', 'TAMARA_API_TOKEN');

    const encryptionKeyRaw = process.env.ENCRYPTION_KEY || 'default_secret_key_change_in_prod_1234';

    return {
      encryptionKey: maskToken(encryptionKeyRaw),
      moyasarSecret: maskToken(moyasarSecretRaw),
      paytabsProfile: paytabsProfileRaw ? (paytabsProfileRaw.includes('***') ? paytabsProfileRaw : maskToken(paytabsProfileRaw)) : '',
      paytabsServer: maskToken(paytabsServerRaw),
      hyperpayEntity: hyperpayEntityRaw ? (hyperpayEntityRaw.includes('***') ? hyperpayEntityRaw : maskToken(hyperpayEntityRaw)) : '',
      geideaPublic: maskToken(geideaPublicRaw),
      geideaMerchant: geideaMerchantRaw ? (geideaMerchantRaw.includes('***') ? geideaMerchantRaw : maskToken(geideaMerchantRaw)) : '',
      tabbySecret: maskToken(tabbySecretRaw),
      tamaraToken: maskToken(tamaraTokenRaw)
    };
  }
}
