/**
 * @file FinancialEngine.ts
 * @description المحرك المالي السيادي والموحد لمنصة "ليلة".
 * يدير عمليات حساب العمولات، اقتطاع رسوم بوابة الدفع، احتساب ضريبة القيمة المضافة (15%)،
 * وإدارة قيود دفتر الأستاذ المالي (Ledger Entries) والتحويلات لحسابات المزودين والمنصة.
 */

import { sequelize, Wallet, LedgerEntry, Settlement, WalletTransaction } from "../../models/Database.js";
import { TaxService } from "./TaxService.js";
import { generateSettlementNumber, generateLedgerNumber } from "../../modules/finance/usecases/GenerateId.js";
import { Logger } from "../logger.service.js";
import { Op } from "sequelize";


/**
 * مدخلات العملية الحسابية المالية
 */
export interface FinancialCalculationInput {
  /** إجمالي مبلغ الحجز أو الخدمة شامل الضريبة (Gross Price) */
  grossAmount: number;
  /** نسبة عمولة المنصة (مثال: 0.10 لنسبة 10%) */
  commissionRate: number; 
  /** نسبة رسوم بوابة الدفع (مثال: 0.02 لنسبة 2%) */
  gatewayFeeRate?: number; 
  /** الرسوم الثابتة لبوابة الدفع (مثال: 1.00 ر.س) */
  gatewayFlatFee?: number; 
  /** الوعاء الخاضع للعمولة فعلياً بعد استبعاد العناصر المعفاة (مثل منتجات المتجر المصغر) */
  commissionableAmount?: number;
  /** مبلغ العناصر المعفاة من العمولة */
  nonCommissionableAmount?: number;
}

/**
 * نتائج وتفاصيل الحسابات المالية المحسوبة
 */
export interface FinancialSnapshotData {
  /** نسبة عمولة المنصة المطبقة */
  commissionRate: number;
  /** إجمالي مبلغ عمولة المنصة شامل الضريبة */
  commissionAmount: number;
  /** صافي إيراد عمولة المنصة بدون ضريبة */
  commissionBase: number;
  /** مبلغ ضريبة القيمة المضافة على عمولة المنصة (15%) */
  commissionVat: number;
  /** صافي حصة الشريك/المزود المستحقة */
  providerShare: number;
  /** تكلفة رسوم بوابة الدفع */
  gatewayFee: number;
  /** الوعاء الخاضع للعمولة */
  commissionableBase: number;
  /** الوعاء المعفى من العمولة (مبيعات المتجر المصغر) */
  nonCommissionableBase: number;
  /** نسبة ضريبة القيمة المضافة العامة (0.15) */
  vatRate: number;
  /** إصدار القواعد المالية المطبقة */
  rulesVersion: string;
}

/**
 * المحرك المالي المركزي لمنصة ليلة
 */
export class FinancialEngine {
  /** نسبة ضريبة القيمة المضافة القياسية (15%) */
  private static readonly DEFAULT_VAT_RATE = 0.15;
  /** رقم إصدار القواعد المالية المعتمدة */
  private static readonly RULES_VERSION = "V1.0.0";

  /**
   * 1. حاسبة المعادلات المالية الموحدة
   * القاعدة السيادية:
   * - السعر الإجمالي المسجل: Gross Amount (شامل الضريبة)
   * - رسوم بوابة الدفع: تُحسب على كامل العملية المالية المدفوعة (Gross Amount)
   * - عمولة المنصة: تُحسب حصراً على الوعاء الخاضع للعمولة (Commissionable Base)
   *   مع استبعاد مبيعات المتجر المصغر (Mini Store Products) طالما سياسة الإعفاء مفعلة.
   * - صافي حصة المزود: إجمالي المبلغ - رسوم بوابة الدفع - عمولة المنصة
   * 
   * @param input بيانات المبلغ والنسب
   * @returns FinancialSnapshotData اللقطة المالية التفصيلية
   */
  static calculate(input: FinancialCalculationInput): FinancialSnapshotData {
    const { 
      grossAmount, 
      commissionRate, 
      gatewayFeeRate = 0, 
      gatewayFlatFee = 0,
      commissionableAmount,
      nonCommissionableAmount
    } = input;

    // 1. حساب رسوم بوابة الدفع بناءً على كامل مبلغ العملية المالية
    const gatewayFee = (grossAmount * gatewayFeeRate) + gatewayFlatFee;
    
    // 2. تحديد الوعاء الخاضع للعمولة (Commissionable Base)
    // إذا لم يُحدد صراحة، فإن الوعاء الخاضع للعمولة هو المبلغ الإجمالي
    const eligibleBase = commissionableAmount !== undefined 
      ? Math.max(0, commissionableAmount) 
      : (nonCommissionableAmount !== undefined ? Math.max(0, grossAmount - nonCommissionableAmount) : grossAmount);
    
    const nonEligibleBase = nonCommissionableAmount !== undefined 
      ? nonCommissionableAmount 
      : Math.max(0, grossAmount - eligibleBase);

    // 3. احتساب عمولة المنصة بناءً على الوعاء الخاضع للعمولة
    const proportionalGatewayFee = grossAmount > 0 ? (gatewayFee * (eligibleBase / grossAmount)) : 0;
    const splitEligible = Math.max(0, eligibleBase - proportionalGatewayFee);
    const commissionAmount = splitEligible * commissionRate;

    // 4. استخراج صافي الإيراد والضريبة الخاصة بالمنصة من عمولة المنصة
    const commissionBase = TaxService.calculateBaseAmount(commissionAmount, this.DEFAULT_VAT_RATE);
    const commissionVat = commissionAmount - commissionBase;

    // 5. حساب صافي حصة المزود = المبلغ الإجمالي - رسوم البوابة - إجمالي العمولة
    const providerShare = Math.max(0, grossAmount - gatewayFee - commissionAmount);

    return {
      commissionRate,
      commissionAmount: Math.round(commissionAmount * 100) / 100,
      commissionBase: Math.round(commissionBase * 100) / 100,
      commissionVat: Math.round(commissionVat * 100) / 100,
      providerShare: Math.round(providerShare * 100) / 100,
      gatewayFee: Math.round(gatewayFee * 100) / 100,
      commissionableBase: Math.round(eligibleBase * 100) / 100,
      nonCommissionableBase: Math.round(nonEligibleBase * 100) / 100,
      vatRate: this.DEFAULT_VAT_RATE,
      rulesVersion: this.RULES_VERSION,
    };
  }

  /**
   * 2. حساب رصيد محفظة المنصة في دفتر الأستاذ العام
   * @param walletType نوع المحفظة (إيرادات المنصة، ضريبة القيمة المضافة، أو رسوم بوابة الدفع)
   * @param options خيارات الاستعلام الإضافية
   * @returns رصيد المحفظة الحالي
   */
  static async getPlatformLedgerBalance(
    walletType: "platform_revenue" | "platform_vat" | "gateway_fee",
    options?: any
  ): Promise<number> {
    const ledgerTable = LedgerEntry;
    const credits = await ledgerTable.sum("amount", {
      where: {
        walletType,
        type: "credit",
        status: "completed",
      },
      ...options,
    }) || 0;

    const debits = await ledgerTable.sum("amount", {
      where: {
        walletType,
        type: "debit",
        status: "completed",
      },
      ...options,
    }) || 0;

    return credits - debits;
  }

  /**
   * 3. تسجيل قيد مالي موحد وغير قابل للعديل في دفتر الأستاذ (Ledger Entry)
   * @param data بيانات القيد المالي
   * @param options خيارات المعاملة
   */
  static async postLedgerEntry(
    data: {
      walletType: "provider" | "platform_revenue" | "platform_vat" | "gateway_fee";
      providerId: number | null;
      referenceId: string;
      referenceType: string;
      type: "debit" | "credit";
      amount: number;
      description: string;
      status?: "pending" | "completed" | "failed";
      createdBy?: string | null;
    },
    options?: any
  ): Promise<LedgerEntry> {
    const { walletType, providerId, referenceId, referenceType, type, amount, description, status = "completed", createdBy = null } = data;
    const transaction = options?.transaction;

    let balanceBefore = 0;
    let balanceAfter = 0;

    if (walletType === "provider") {
      if (!providerId) {
        throw new Error("معرف المزود مطلوب لتسجيل القيود في محفظة المزود.");
      }

      // البحث عن محفظة المزود أو إنشائها
      const [wallet] = await Wallet.findOrCreate({
        where: { providerId },
        defaults: { balance: 0, pendingBalance: 0 },
        transaction,
      });

      balanceBefore = wallet.balance;
      const change = type === "credit" ? amount : -amount;
      balanceAfter = balanceBefore + change;

      wallet.balance = balanceAfter;
      await wallet.save({ transaction });

      // إنشاء حركة محفظة لتوافق التقارير والواجهات
      await WalletTransaction.create({
        providerId,
        type: referenceType === "withdrawal" ? "withdrawal" : (type === "credit" ? "release_deposit" : "commission_charge"),
        description,
        amount,
        status: status === "completed" ? "completed" : "pending",
      }, { transaction });

    } else {
      // حساب الرصيد التراكمي لحسابات المنصة
      balanceBefore = await this.getPlatformLedgerBalance(walletType, { transaction });
      const change = type === "credit" ? amount : -amount;
      balanceAfter = balanceBefore + change;
    }

    const ledgerNumber = await generateLedgerNumber();

    const entry = await LedgerEntry.create({
      ledgerNumber,
      walletType,
      providerId,
      referenceId,
      referenceType,
      type,
      amount,
      balanceBefore,
      balanceAfter,
      description,
      status,
      createdBy,
    }, { transaction }) as LedgerEntry;

    Logger.financial(`تم تسجيل قيد دفتر الأستاذ: ${ledgerNumber}`, {
      walletType,
      providerId,
      referenceId,
      type,
      amount,
      balanceBefore,
      balanceAfter,
    });

    return entry;
  }

  /**
   * تحديث الرصيد المعلق للشريك/المزود وتسجيل القيد المرتبط
   */
  static async updateProviderPendingBalance(
    data: {
      providerId: number;
      amount: number;
      referenceId: string;
      referenceType: string;
      type: "debit" | "credit";
      description: string;
    },
    options?: any
  ): Promise<Wallet> {
    const { providerId, amount, referenceId, referenceType, type, description } = data;
    const transaction = options?.transaction;

    const [wallet] = await Wallet.findOrCreate({
      where: { providerId },
      defaults: { balance: 0, pendingBalance: 0 },
      transaction,
    });

    const balanceBefore = wallet.pendingBalance;
    const change = type === "credit" ? amount : -amount;
    const balanceAfter = balanceBefore + change;

    wallet.pendingBalance = balanceAfter;
    await wallet.save({ transaction });

    // تسجيل قيد معلق للإنفاذ والتتبع الكامل
    const ledgerNumber = await generateLedgerNumber();
    await LedgerEntry.create({
      ledgerNumber,
      walletType: "provider",
      providerId,
      referenceId,
      referenceType,
      type,
      amount,
      balanceBefore,
      balanceAfter,
      description: `${description} (رصيد معلق)`,
      status: "pending",
    }, { transaction });

    // تسجيل معاملة محفظة معلقة
    await WalletTransaction.create({
      providerId,
      type: "deposit_pending",
      description,
      amount,
      status: "pending",
    }, { transaction });

    return wallet;
  }

  /**
   * 4. إنشاء سجل تسوية مالية جديدة للحجوزات والخدمات
   */
  static async createSettlement(
    data: {
      referenceId: string;
      referenceType: "booking" | "order" | "support_service" | "subscription" | "other";
      providerId: number;
      grossAmount: number;
      commissionRate: number;
      gatewayFeeRate?: number;
      gatewayFlatFee?: number;
    },
    options?: any
  ): Promise<Settlement> {
    const { referenceId, referenceType, providerId, grossAmount, commissionRate, gatewayFeeRate = 0, gatewayFlatFee = 0 } = data;
    const transaction = options?.transaction;

    const calculations = this.calculate({
      grossAmount,
      commissionRate,
      gatewayFeeRate,
      gatewayFlatFee,
    });

    const settlementNumber = await generateSettlementNumber();

    const settlement = await Settlement.create({
      settlementNumber,
      referenceId,
      referenceType,
      providerId,
      grossAmount,
      gatewayFee: calculations.gatewayFee,
      commissionAmount: calculations.commissionAmount,
      commissionBase: calculations.commissionBase,
      commissionVat: calculations.commissionVat,
      providerShare: calculations.providerShare,
      status: "pending",
    }, { transaction }) as Settlement;

    Logger.financial(`تم إنشاء سجل تسوية مالية: ${settlementNumber}`, {
      referenceId,
      providerId,
      grossAmount,
      providerShare: calculations.providerShare,
    });

    return settlement;
  }

  /**
   * 5. اعتماد وتحرير التسوية المالية للمزود
   * تحويل المستحقات من الرصيد المعلق إلى الرصيد المتاح القابل للخصم أو السحب.
   */
  static async approveAndReleaseSettlement(settlementId: number, options?: any): Promise<Settlement> {
    const transaction = options?.transaction;

    const settlement = await Settlement.findByPk(settlementId, { transaction }) as Settlement;
    if (!settlement) {
      throw new Error(`سجل التسوية #${settlementId} غير موجود.`);
    }

    if (settlement.status !== "pending") {
      throw new Error(`حالة التسوية حالياً هي ${settlement.status}، ويشترط أن تكون معلقة (pending).`);
    }

    // 1. خصم من الرصيد المعلق للمزود
    await this.updateProviderPendingBalance({
      providerId: settlement.providerId,
      amount: settlement.providerShare,
      referenceId: settlement.referenceId,
      referenceType: settlement.referenceType,
      type: "debit",
      description: `تحرير رصيد معلق للتسوية #${settlement.settlementNumber}`,
    }, { transaction });

    // 2. إضافة إلى الرصيد المتاح للمزود عبر قيد مالي مثبت
    await this.postLedgerEntry({
      walletType: "provider",
      providerId: settlement.providerId,
      referenceId: settlement.referenceId,
      referenceType: settlement.referenceType,
      type: "credit",
      amount: settlement.providerShare,
      description: `تحويل الرصيد المتاح من تسوية #${settlement.settlementNumber}`,
    }, { transaction });

    // 3. تسجيل إيرادات المنصة والضريبة في دفتر الأستاذ
    await this.postLedgerEntry({
      walletType: "platform_revenue",
      providerId: null,
      referenceId: settlement.referenceId,
      referenceType: settlement.referenceType,
      type: "credit",
      amount: settlement.commissionBase,
      description: `إيراد عمولة المنصة لتسوية #${settlement.settlementNumber}`,
    }, { transaction });

    await this.postLedgerEntry({
      walletType: "platform_vat",
      providerId: null,
      referenceId: settlement.referenceId,
      referenceType: settlement.referenceType,
      type: "credit",
      amount: settlement.commissionVat,
      description: `ضريبة القيمة المضافة المحصلة لتسوية #${settlement.settlementNumber}`,
    }, { transaction });

    if (settlement.gatewayFee > 0) {
      await this.postLedgerEntry({
        walletType: "gateway_fee",
        providerId: null,
        referenceId: settlement.referenceId,
        referenceType: settlement.referenceType,
        type: "credit",
        amount: settlement.gatewayFee,
        description: `تكلفة بوابة الدفع لتسوية #${settlement.settlementNumber}`,
      }, { transaction });
    }

    // تحديث حالة التسوية
    settlement.status = "approved";
    settlement.transferredAt = new Date();
    await settlement.save({ transaction });

    Logger.financial(`تمت الموافقة على التسوية وتحرير الأموال: ${settlement.settlementNumber}`, {
      settlementId,
      providerShare: settlement.providerShare,
    });

    return settlement;
  }
}

