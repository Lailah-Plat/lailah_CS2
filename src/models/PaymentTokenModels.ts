import { DataTypes, Model } from 'sequelize';
import { sequelize, encrypt, decrypt } from './dbInstance.js';

/**
 * 1. SavedPaymentToken Model
 * Tokenized payment methods for Customers (one-click, installments, remaining balance)
 * and Providers (subscription fees, feature marketplace with auto-renewal consent).
 */
export class SavedPaymentToken extends Model {
  declare id: string;
  declare ownerType: 'customer' | 'provider';
  declare ownerId: string;
  declare gatewayName: string;
  declare cardToken: string; // Encrypted
  declare cardBrand: 'mada' | 'visa' | 'mastercard' | 'amex' | 'applepay' | 'other';
  declare lastFourDigits: string;
  declare expiryMonth: string;
  declare expiryYear: string;
  declare cardholderName: string | null;
  declare isDefault: boolean;
  declare oneClickEnabled: boolean;
  declare autoRenewalConsent: boolean; // Provider subscription auto-renewal agreement
  declare autoRenewalConsentedAt: Date | null;
  declare status: 'active' | 'expired' | 'revoked';
  declare metadata: object | null;
  declare createdAt: Date;
  declare updatedAt: Date;

  // Helper method to get decrypted card token
  getDecryptedToken(): string | null {
    return decrypt(this.cardToken);
  }
}

SavedPaymentToken.init({
  id: { 
    type: DataTypes.UUID, 
    defaultValue: DataTypes.UUIDV4, 
    primaryKey: true 
  },
  ownerType: { 
    type: DataTypes.ENUM('customer', 'provider'), 
    allowNull: false 
  },
  ownerId: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  gatewayName: { 
    type: DataTypes.STRING, 
    allowNull: false, 
    defaultValue: 'moyasar' 
  },
  cardToken: { 
    type: DataTypes.TEXT, 
    allowNull: false,
    set(value: string) {
      // Automatically encrypt token before storing in Cloud DB
      this.setDataValue('cardToken', encrypt(value));
    }
  },
  cardBrand: { 
    type: DataTypes.ENUM('mada', 'visa', 'mastercard', 'amex', 'applepay', 'other'), 
    allowNull: false, 
    defaultValue: 'mada' 
  },
  lastFourDigits: { 
    type: DataTypes.STRING(4), 
    allowNull: false 
  },
  expiryMonth: { 
    type: DataTypes.STRING(2), 
    allowNull: false 
  },
  expiryYear: { 
    type: DataTypes.STRING(4), 
    allowNull: false 
  },
  cardholderName: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  isDefault: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: false 
  },
  oneClickEnabled: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: true 
  },
  autoRenewalConsent: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: false 
  },
  autoRenewalConsentedAt: { 
    type: DataTypes.DATE, 
    allowNull: true 
  },
  status: { 
    type: DataTypes.ENUM('active', 'expired', 'revoked'), 
    defaultValue: 'active',
    allowNull: false 
  },
  metadata: { 
    type: DataTypes.JSON, 
    allowNull: true 
  }
}, {
  sequelize,
  modelName: 'SavedPaymentToken',
  tableName: 'saved_payment_tokens',
  indexes: [
    { fields: ['ownerType', 'ownerId'] },
    { fields: ['isDefault'] },
    { fields: ['status'] }
  ]
});

/**
 * 2. ProviderPayoutAccount Model
 * Secure account mapping for Providers to receive settlement payouts.
 * Uses Connected Account ID, Beneficiary Token, or Encrypted Bank IBAN.
 */
export class ProviderPayoutAccount extends Model {
  declare id: string;
  declare providerId: string;
  declare payoutMethodType: 'connected_account' | 'beneficiary_token' | 'bank_iban';
  declare connectedAccountId: string | null; // e.g. Connected Account ID at Gateway
  declare beneficiaryToken: string | null;   // e.g. Gateway Beneficiary Token
  declare encryptedIban: string | null;      // AES-256 Encrypted Bank IBAN
  declare bankName: string | null;
  declare bankCode: string | null;
  declare officialName: string;
  declare commercialRegister: string | null;
  declare kycStatus: 'pending' | 'under_review' | 'verified' | 'rejected' | 'suspended';
  declare isDefault: boolean;
  declare verifiedAt: Date | null;
  declare notes: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;

  getDecryptedIban(): string | null {
    return decrypt(this.encryptedIban);
  }
}

ProviderPayoutAccount.init({
  id: { 
    type: DataTypes.UUID, 
    defaultValue: DataTypes.UUIDV4, 
    primaryKey: true 
  },
  providerId: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  payoutMethodType: { 
    type: DataTypes.ENUM('connected_account', 'beneficiary_token', 'bank_iban'), 
    allowNull: false,
    defaultValue: 'connected_account'
  },
  connectedAccountId: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  beneficiaryToken: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  encryptedIban: { 
    type: DataTypes.TEXT, 
    allowNull: true,
    set(value: string | null) {
      if (value) {
        this.setDataValue('encryptedIban', encrypt(value));
      } else {
        this.setDataValue('encryptedIban', null);
      }
    }
  },
  bankName: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  bankCode: { 
    type: DataTypes.STRING, 
    allowNull: true,
    defaultValue: 'SA'
  },
  officialName: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  commercialRegister: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  kycStatus: { 
    type: DataTypes.ENUM('pending', 'under_review', 'verified', 'rejected', 'suspended'), 
    defaultValue: 'pending',
    allowNull: false 
  },
  isDefault: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: true 
  },
  verifiedAt: { 
    type: DataTypes.DATE, 
    allowNull: true 
  },
  notes: { 
    type: DataTypes.TEXT, 
    allowNull: true 
  }
}, {
  sequelize,
  modelName: 'ProviderPayoutAccount',
  tableName: 'provider_payout_accounts',
  indexes: [
    { fields: ['providerId'] },
    { fields: ['kycStatus'] },
    { fields: ['payoutMethodType'] }
  ]
});
