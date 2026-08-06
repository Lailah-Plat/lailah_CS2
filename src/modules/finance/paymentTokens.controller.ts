import { Request, Response } from 'express';
import { SavedPaymentToken, ProviderPayoutAccount } from '../../models/PaymentTokenModels.js';

export class PaymentTokensController {
  /**
   * Get all saved payment tokens for a customer or provider owner
   */
  async getTokens(req: Request, res: Response) {
    try {
      const { ownerType, ownerId } = req.query;
      if (!ownerType || !ownerId) {
        return res.status(400).json({ success: false, error: 'ownerType and ownerId are required' });
      }

      const tokens = await SavedPaymentToken.findAll({
        where: {
          ownerType: ownerType as 'customer' | 'provider',
          ownerId: String(ownerId),
          status: 'active'
        },
        order: [['isDefault', 'DESC'], ['createdAt', 'DESC']]
      });

      // Mask sensitive token data for safe response
      const safeTokens = tokens.map(t => ({
        id: t.id,
        ownerType: t.ownerType,
        ownerId: t.ownerId,
        gatewayName: t.gatewayName,
        cardBrand: t.cardBrand,
        lastFourDigits: t.lastFourDigits,
        expiryMonth: t.expiryMonth,
        expiryYear: t.expiryYear,
        cardholderName: t.cardholderName,
        isDefault: t.isDefault,
        oneClickEnabled: t.oneClickEnabled,
        autoRenewalConsent: t.autoRenewalConsent,
        autoRenewalConsentedAt: t.autoRenewalConsentedAt,
        status: t.status,
        createdAt: t.createdAt
      }));

      return res.json({ success: true, tokens: safeTokens });
    } catch (err: any) {
      console.error('Error fetching payment tokens:', err);
      return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  }

  /**
   * Save a new payment token (e.g. after successful authorization or card save)
   */
  async saveToken(req: Request, res: Response) {
    try {
      const { 
        ownerType, ownerId, gatewayName, cardToken, cardBrand, 
        lastFourDigits, expiryMonth, expiryYear, cardholderName, 
        isDefault, autoRenewalConsent, oneClickEnabled 
      } = req.body;

      if (!ownerType || !ownerId || !cardToken || !lastFourDigits) {
        return res.status(400).json({ success: false, error: 'Missing required token parameters' });
      }

      if (isDefault) {
        // Reset previous default for same owner
        await SavedPaymentToken.update(
          { isDefault: false },
          { where: { ownerType, ownerId } }
        );
      }

      const newToken = await SavedPaymentToken.create({
        ownerType,
        ownerId: String(ownerId),
        gatewayName: gatewayName || 'moyasar',
        cardToken, // Auto-encrypted by setter
        cardBrand: cardBrand || 'mada',
        lastFourDigits,
        expiryMonth: expiryMonth || '12',
        expiryYear: expiryYear || '28',
        cardholderName: cardholderName || null,
        isDefault: isDefault ?? true,
        oneClickEnabled: oneClickEnabled ?? true,
        autoRenewalConsent: Boolean(autoRenewalConsent),
        autoRenewalConsentedAt: autoRenewalConsent ? new Date() : null,
        status: 'active'
      });

      return res.json({ 
        success: true, 
        message: 'تم حفظ توكن وسيلة الدفع بأمان في قاعدة البيانات السحابية 🟢',
        tokenId: newToken.id
      });
    } catch (err: any) {
      console.error('Error saving payment token:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Toggle auto-renewal consent for Provider subscription card
   */
  async toggleAutoRenewal(req: Request, res: Response) {
    try {
      const { tokenId } = req.params;
      const { autoRenewalConsent } = req.body;

      const token = await SavedPaymentToken.findByPk(tokenId);
      if (!token) {
        return res.status(404).json({ success: false, error: 'Token not found' });
      }

      token.autoRenewalConsent = Boolean(autoRenewalConsent);
      token.autoRenewalConsentedAt = autoRenewalConsent ? new Date() : null;
      await token.save();

      return res.json({
        success: true,
        message: autoRenewalConsent 
          ? 'تم تفعيل التجديد التلقائي لاشتراك المنصة ببطاقتك المحفوظة'
          : 'تم إيقاف التجديد التلقائي للاشتراك',
        autoRenewalConsent: token.autoRenewalConsent
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Set token as default
   */
  async setDefaultToken(req: Request, res: Response) {
    try {
      const { tokenId } = req.params;
      const token = await SavedPaymentToken.findByPk(tokenId);
      if (!token) {
        return res.status(404).json({ success: false, error: 'Token not found' });
      }

      await SavedPaymentToken.update(
        { isDefault: false },
        { where: { ownerType: token.ownerType, ownerId: token.ownerId } }
      );

      token.isDefault = true;
      await token.save();

      return res.json({ success: true, message: 'تم تعيين البطاقة كبطاقة افتراضية للمدفوعات القادمة 🟢' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Delete or revoke payment token
   */
  async deleteToken(req: Request, res: Response) {
    try {
      const { tokenId } = req.params;
      const token = await SavedPaymentToken.findByPk(tokenId);
      if (!token) {
        return res.status(404).json({ success: false, error: 'Token not found' });
      }

      token.status = 'revoked';
      await token.save();

      return res.json({ success: true, message: 'تم حذف وحظر توكن البطاقة بنجاح' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Process One-Click Payment / Remaining Balance / Installment Payment using saved token
   */
  async processOneClickPayment(req: Request, res: Response) {
    try {
      const { tokenId, bookingId, amount, paymentType, description } = req.body;
      const token = await SavedPaymentToken.findByPk(tokenId);

      if (!token || token.status !== 'active') {
        return res.status(400).json({ success: false, error: 'وسيلة الدفع المحفوظة غير متاحة أو منتهية الصلاحية' });
      }

      const decryptedToken = token.getDecryptedToken();

      // Simulate Gateway Charge with decrypted token (Moyasar / HyperPay / PayTabs API)
      const mockGatewayRef = `ONECLICK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      return res.json({
        success: true,
        message: `تمت عملية الدفع بنجاح (${paymentType || 'نقرة واحدة'}) بمبلغ ${amount} ريال عبر بطاقة ${token.cardBrand.toUpperCase()} (**** ${token.lastFourDigits})`,
        gatewayReference: mockGatewayRef,
        chargedTokenId: token.id,
        bookingId,
        amount
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Get provider's payout settlement accounts
   */
  async getPayoutAccounts(req: Request, res: Response) {
    try {
      const { providerId } = req.query;
      if (!providerId) {
        return res.status(400).json({ success: false, error: 'providerId is required' });
      }

      const accounts = await ProviderPayoutAccount.findAll({
        where: { providerId: String(providerId) },
        order: [['isDefault', 'DESC'], ['createdAt', 'DESC']]
      });

      const safeAccounts = accounts.map(a => ({
        id: a.id,
        providerId: a.providerId,
        payoutMethodType: a.payoutMethodType,
        connectedAccountId: a.connectedAccountId,
        beneficiaryToken: a.beneficiaryToken,
        maskedIban: a.encryptedIban ? `SA** **** **** **** ${a.getDecryptedIban()?.slice(-4) || '****'}` : null,
        bankName: a.bankName,
        officialName: a.officialName,
        commercialRegister: a.commercialRegister,
        kycStatus: a.kycStatus,
        isDefault: a.isDefault,
        verifiedAt: a.verifiedAt
      }));

      return res.json({ success: true, accounts: safeAccounts });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Save or Update provider payout account
   */
  async savePayoutAccount(req: Request, res: Response) {
    try {
      const { 
        providerId, payoutMethodType, connectedAccountId, 
        beneficiaryToken, iban, bankName, officialName, commercialRegister 
      } = req.body;

      if (!providerId || !officialName) {
        return res.status(400).json({ success: false, error: 'المعلومات المطلوبة غير مكتملة' });
      }

      const account = await ProviderPayoutAccount.create({
        providerId: String(providerId),
        payoutMethodType: payoutMethodType || 'connected_account',
        connectedAccountId: connectedAccountId || null,
        beneficiaryToken: beneficiaryToken || null,
        encryptedIban: iban || null,
        bankName: bankName || 'البنك الأهلي السعودي',
        officialName,
        commercialRegister: commercialRegister || null,
        kycStatus: payoutMethodType === 'connected_account' ? 'verified' : 'under_review',
        isDefault: true,
        verifiedAt: payoutMethodType === 'connected_account' ? new Date() : null
      });

      return res.json({
        success: true,
        message: 'تم حفظ وتحديث طريقة استلام المستحقات المالية للمزود بنجاح 🟢',
        accountId: account.id
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
