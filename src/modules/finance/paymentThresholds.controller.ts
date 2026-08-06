import { Request, Response } from 'express';
import { PlatformConfig } from '../../models/UserModels.js';

const DEFAULT_SAMA_THRESHOLDS = {
  cardMaxPerTransaction: 100000,
  madaMaxPerTransaction: 200000,
  visaMaxPerTransaction: 150000,
  dailyMerchantLimit: 500000,
  manualReviewThreshold: 50000,
  bankTransferRequiredThreshold: 100000,
  dataRetentionDays: 365,
  gateways: {
    moyasar: { name: 'ميسر (Moyasar)', enabled: true, maxTransaction: 100000, dailyLimit: 500000, riskLevel: 'low' },
    paytabs: { name: 'بي تابس (PayTabs)', enabled: true, maxTransaction: 100000, dailyLimit: 500000, riskLevel: 'medium' },
    hyperpay: { name: 'هايبر باي (HyperPay)', enabled: true, maxTransaction: 150000, dailyLimit: 1000000, riskLevel: 'low' },
    geidea: { name: 'جاليري جيديا (Geidea)', enabled: true, maxTransaction: 100000, dailyLimit: 500000, riskLevel: 'medium' },
    tap: { name: 'تاب للمدفوعات (Tap)', enabled: true, maxTransaction: 50000, dailyLimit: 250000, riskLevel: 'medium' },
    checkout: { name: 'شيك أوت (Checkout.com)', enabled: true, maxTransaction: 100000, dailyLimit: 500000, riskLevel: 'medium' }
  }
};

export class PaymentThresholdsController {
  /**
   * Get payment threshold configurations
   */
  async getThresholds(req: Request, res: Response) {
    try {
      const config = await PlatformConfig.findByPk('SAMA_PAYMENT_THRESHOLDS');
      let thresholds = DEFAULT_SAMA_THRESHOLDS;

      if (config && config.value) {
        try {
          thresholds = { ...DEFAULT_SAMA_THRESHOLDS, ...JSON.parse(config.value) };
        } catch {
          console.warn('Could not parse SAMA_PAYMENT_THRESHOLDS from PlatformConfig, using default.');
        }
      }

      return res.json({ success: true, thresholds });
    } catch (error: any) {
      console.error('Error fetching payment thresholds:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Update payment threshold configurations
   */
  async saveThresholds(req: Request, res: Response) {
    try {
      const { thresholds } = req.body;
      if (!thresholds || typeof thresholds !== 'object') {
        return res.status(400).json({ success: false, error: 'البيانات المرسلة غير صحيحة' });
      }

      const stringValue = JSON.stringify(thresholds);
      
      const [configRecord, created] = await PlatformConfig.findOrCreate({
        where: { key: 'SAMA_PAYMENT_THRESHOLDS' },
        defaults: { key: 'SAMA_PAYMENT_THRESHOLDS', value: stringValue }
      });

      if (!created) {
        await configRecord.update({ value: stringValue });
      }

      // Also save data retention days separately for quick lookup
      if (thresholds.dataRetentionDays) {
        await PlatformConfig.upsert({
          key: 'SETTINGS_DATA_RETENTION_DAYS',
          value: String(thresholds.dataRetentionDays)
        });
      }

      return res.json({
        success: true,
        thresholds,
        message: 'تم حفظ إعدادات حدود وسقوف بوابات الدفع وقواعد المخاطر بنجاح على قاعدة البيانات السحابية.'
      });
    } catch (error: any) {
      console.error('Error saving payment thresholds:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}
