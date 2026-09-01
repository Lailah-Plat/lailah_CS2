import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { SequelizeFinanceRepository } from './finance.repository.js';
import { GatewayEvent, SettlementInstruction, ReconciliationItem, PayoutInstruction, Beneficiary } from '../../models/Database.js';
import { UnifiedPaymentsEngine, generateExpenseNumber } from '../../services/payment/UnifiedPaymentsEngine.js';
import { PayoutOrchestrator } from '../../services/payout/PayoutOrchestrator.js';
import { SettlementEligibilityEngine } from '../../services/finance/SettlementEligibilityEngine.js';
import { GetStatsUseCase } from './usecases/GetStats.usecase.js';
import { AddExpenseUseCase } from './usecases/AddExpense.usecase.js';
import { AddRevenueUseCase } from './usecases/AddRevenue.usecase.js';
import { 
  GetRevenueTypesUseCase, 
  CreateRevenueTypeUseCase, 
  UpdateRevenueTypeUseCase, 
  DeleteRevenueTypeUseCase 
} from './usecases/RevenueTypes.usecase.js';
import {
  GetExpenseCategoriesUseCase,
  CreateExpenseCategoryUseCase,
  UpdateExpenseCategoryUseCase,
  DeleteExpenseCategoryUseCase
} from './usecases/ExpenseCategories.usecase.js';
import { CompleteBookingUseCase } from './usecases/CompleteBooking.usecase.js';
import { WithdrawUseCase } from './usecases/Withdraw.usecase.js';
import { SettleClaimUseCase } from './usecases/SettleClaim.usecase.js';
import { ReleaseFundsUseCase } from './usecases/ReleaseFunds.usecase.js';
import { TriggerCronUseCase } from './usecases/TriggerCron.usecase.js';
import { ProcessPayoutUseCase } from './usecases/ProcessPayout.usecase.js';
import { ForecastAIUseCase } from './usecases/ForecastAI.usecase.js';
import { GeneratePDFUseCase } from './usecases/GeneratePDF.usecase.js';
import {
  FetchAndReconcileCustomerWalletsUseCase,
  ConvertForceMajeureBalanceUseCase,
  IssueCreditUseCase
} from './usecases/CustomerWallets.usecase.js';

function getVerifiedUser(req: Request): any | null {
  const authHeader = req.headers.authorization || '';
  let token = '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.headers['x-auth-token']) {
    token = String(req.headers['x-auth-token']);
  }
  
  if (token) {
    try {
      const TOKEN_SECRET = process.env.ENCRYPTION_KEY;
      if (!TOKEN_SECRET) {
        throw new Error("CRITICAL CONFIGURATION ERROR: ENCRYPTION_KEY environment variable is required.");
      }
      return jwt.verify(token, TOKEN_SECRET);
    } catch (e) {
      console.error("[Token Verification Error]", e);
    }
  }
  return null;
}

export class FinanceController {
  private repo = new SequelizeFinanceRepository();

  getStats = async (req: Request, res: Response) => {
    try {
      const { role, provider } = req.query;
      const verifiedUser = getVerifiedUser(req);
      
      let finalRole = String(role || '').toLowerCase();
      let finalProviderId: number | null = provider ? Number(provider) : null;

      if (verifiedUser) {
        const tokenRole = String(verifiedUser.role || '').toLowerCase();
        if (tokenRole.includes('admin') || tokenRole.includes('مدير') || tokenRole.includes('مشرف')) {
          finalRole = 'admin';
          finalProviderId = null;
        } else if (tokenRole.includes('provider') || tokenRole.includes('مزود')) {
          finalRole = 'provider';
          finalProviderId = verifiedUser.id; // STRICTLY force their own provider ID
        } else {
          finalRole = 'client';
          finalProviderId = null;
        }
      } else {
        const headerRole = String(req.headers['x-user-role'] || '').toLowerCase();
        if (headerRole.includes('admin') || headerRole.includes('مدير') || headerRole.includes('مشرف')) {
          finalRole = 'admin';
          finalProviderId = null;
        } else if (headerRole.includes('provider') || headerRole.includes('مزود')) {
          finalRole = 'provider';
          const headerId = req.headers['x-user-id'];
          if (headerId) {
            finalProviderId = Number(headerId);
          }
        }
      }

      // Ensure wallets exist for active providers
      if (finalProviderId) {
        await this.repo.findOrCreateWallet(finalProviderId);
      }

      const useCase = new GetStatsUseCase(this.repo);
      const result = await useCase.execute(finalRole, finalProviderId);
      res.json(result);
    } catch (error: any) {
      console.error("CRITICAL ERROR IN FinanceController.getStats:", error);
      res.status(500).json({ error: error.message, stack: error.stack });
    }
  };

  addExpense = async (req: Request, res: Response) => {
    try {
      const useCase = new AddExpenseUseCase(this.repo);
      const result = await useCase.execute(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  addRevenue = async (req: Request, res: Response) => {
    try {
      const verified = getVerifiedUser(req);
      const role = verified ? verified.role : (req.headers['x-user-role'] || '');
      const isAdmin = String(role).toLowerCase().includes('admin') || String(role).includes('مدير') || String(role).includes('مشرف');
      if (!isAdmin) {
        return res.status(403).json({ error: 'نأسف، لا يمتلك مزودو الخدمات الصلاحية لتسجيل الإيرادات الخارجية.' });
      }

      const useCase = new AddRevenueUseCase(this.repo);
      const result = await useCase.execute(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getRevenueTypes = async (req: Request, res: Response) => {
    try {
      const useCase = new GetRevenueTypesUseCase(this.repo);
      const result = await useCase.execute();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  createRevenueType = async (req: Request, res: Response) => {
    try {
      const verified = getVerifiedUser(req);
      const role = verified ? verified.role : (req.headers['x-user-role'] || '');
      const isAdmin = String(role).toLowerCase().includes('admin') || String(role).includes('مدير') || String(role).includes('مشرف');
      if (!isAdmin) {
        return res.status(403).json({ error: 'غير مصرح للوصول لهذه العملية' });
      }

      const { name, key } = req.body;
      const useCase = new CreateRevenueTypeUseCase(this.repo);
      const result = await useCase.execute(name, key);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  updateRevenueType = async (req: Request, res: Response) => {
    try {
      const verified = getVerifiedUser(req);
      const role = verified ? verified.role : (req.headers['x-user-role'] || '');
      const isAdmin = String(role).toLowerCase().includes('admin') || String(role).includes('مدير') || String(role).includes('مشرف');
      if (!isAdmin) {
        return res.status(403).json({ error: 'غير مصرح للوصول لهذه العملية' });
      }

      const { id } = req.params;
      const { name } = req.body;
      const useCase = new UpdateRevenueTypeUseCase(this.repo);
      const result = await useCase.execute(id, name);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  deleteRevenueType = async (req: Request, res: Response) => {
    try {
      const verified = getVerifiedUser(req);
      const role = verified ? verified.role : (req.headers['x-user-role'] || '');
      const isAdmin = String(role).toLowerCase().includes('admin') || String(role).includes('مدير') || String(role).includes('مشرف');
      if (!isAdmin) {
        return res.status(403).json({ error: 'غير مصرح للوصول لهذه العملية' });
      }

      const { id } = req.params;
      const useCase = new DeleteRevenueTypeUseCase(this.repo);
      await useCase.execute(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getExpenseCategories = async (req: Request, res: Response) => {
    try {
      const useCase = new GetExpenseCategoriesUseCase(this.repo);
      const result = await useCase.execute();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  createExpenseCategory = async (req: Request, res: Response) => {
    try {
      const verified = getVerifiedUser(req);
      const role = verified ? verified.role : (req.headers['x-user-role'] || '');
      const isAdmin = String(role).toLowerCase().includes('admin') || String(role).includes('مدير') || String(role).includes('مشرف');
      if (!isAdmin) {
        return res.status(403).json({ error: 'غير مصرح للوصول لهذه العملية' });
      }

      const { name, key } = req.body;
      const useCase = new CreateExpenseCategoryUseCase(this.repo);
      const result = await useCase.execute(name, key);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  updateExpenseCategory = async (req: Request, res: Response) => {
    try {
      const verified = getVerifiedUser(req);
      const role = verified ? verified.role : (req.headers['x-user-role'] || '');
      const isAdmin = String(role).toLowerCase().includes('admin') || String(role).includes('مدير') || String(role).includes('مشرف');
      if (!isAdmin) {
        return res.status(403).json({ error: 'غير مصرح للوصول لهذه العملية' });
      }

      const { id } = req.params;
      const { name } = req.body;
      const useCase = new UpdateExpenseCategoryUseCase(this.repo);
      const result = await useCase.execute(id, name);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  deleteExpenseCategory = async (req: Request, res: Response) => {
    try {
      const verified = getVerifiedUser(req);
      const role = verified ? verified.role : (req.headers['x-user-role'] || '');
      const isAdmin = String(role).toLowerCase().includes('admin') || String(role).includes('مدير') || String(role).includes('مشرف');
      if (!isAdmin) {
        return res.status(403).json({ error: 'غير مصرح للوصول لهذه العملية' });
      }

      const { id } = req.params;
      const useCase = new DeleteExpenseCategoryUseCase(this.repo);
      await useCase.execute(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  completeBooking = async (req: Request, res: Response) => {
    try {
      const useCase = new CompleteBookingUseCase(this.repo);
      const result = await useCase.execute(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  withdraw = async (req: Request, res: Response) => {
    try {
      const useCase = new WithdrawUseCase(this.repo);
      const result = await useCase.execute(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  settleClaim = async (req: Request, res: Response) => {
    try {
      const useCase = new SettleClaimUseCase(this.repo);
      const result = await useCase.execute(req.body);
      res.json({ success: true, claim: result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  releaseFunds = async (req: Request, res: Response) => {
    try {
      const useCase = new ReleaseFundsUseCase(this.repo);
      const result = await useCase.execute(req.body);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  triggerCron = async (req: Request, res: Response) => {
    try {
      const useCase = new TriggerCronUseCase(this.repo);
      const result = await useCase.execute();
      res.json({
        success: true,
        ...result,
        message: `تم تفعيل دورة المقاصة والجدولة الآلية للـ Cron بنجاح. تم فحص وتصفية الأرصدة.`
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  processPayout = async (req: Request, res: Response) => {
    try {
      const useCase = new ProcessPayoutUseCase(this.repo);
      const result = await useCase.execute(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  handlePayoutWebhook = async (req: Request, res: Response) => {
    try {
      const rawPayload = req.body || {};
      const signature = (req.headers["x-signature"] as string) || (req.headers["signature"] as string) || (req.headers["authorization"] as string) || "";
      const externalReference = rawPayload.transaction_reference || rawPayload.external_instruction_id || rawPayload.merchant_reference || rawPayload.reference || rawPayload.id || `TXN-${Date.now()}`;

      const result = await PayoutOrchestrator.handleExternalConfirmation(
        externalReference,
        rawPayload,
        signature,
        req.headers
      );

      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Payout webhook error:", error);
      return res.status(500).json({ error: error.message });
    }
  };

  evaluateSettlementEligibility = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await SettlementEligibilityEngine.evaluateEligibility(id);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  releaseSettlement = async (req: Request, res: Response) => {
    try {
      const { settlementId } = req.body;
      const verified = getVerifiedUser(req);
      const actor = verified?.name || verified?.email || req.headers['x-user-name'] || 'ADMIN';
      const result = await PayoutOrchestrator.requestSettlementRelease(settlementId, String(actor));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  createPayout = async (req: Request, res: Response) => {
    try {
      const verified = getVerifiedUser(req);
      const actor = verified?.name || verified?.email || req.headers['x-user-name'] || 'ADMIN';
      const result = await PayoutOrchestrator.createPayoutInstruction({
        ...req.body,
        actor: String(actor)
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  dispatchPayout = async (req: Request, res: Response) => {
    try {
      const { payoutId } = req.body;
      const verified = getVerifiedUser(req);
      const actor = verified?.name || verified?.email || req.headers['x-user-name'] || 'ADMIN';
      const result = await PayoutOrchestrator.dispatchPayout(payoutId, String(actor));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  reconcilePayout = async (req: Request, res: Response) => {
    try {
      const { payoutId, externalReference, externalAmountHalalas, externalCurrency, externalStatus } = req.body;
      const result = await PayoutOrchestrator.handleExternalConfirmation(
        externalReference || payoutId,
        {
          status: externalStatus || 'SUCCESS',
          amount: externalAmountHalalas,
          currency: externalCurrency || 'SAR'
        },
        'AUTH_TEST_SIG',
        req.headers
      );
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  returnPayout = async (req: Request, res: Response) => {
    try {
      const { payoutId, returnReason } = req.body;
      const verified = getVerifiedUser(req);
      const actor = verified?.name || verified?.email || req.headers['x-user-name'] || 'ADMIN';
      const result = await PayoutOrchestrator.handleReturnedPayout(payoutId, returnReason, String(actor));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  dualApprovePayout = async (req: Request, res: Response) => {
    try {
      const { payoutId } = req.body;
      const verified = getVerifiedUser(req);
      const actor = verified?.name || verified?.email || req.headers['x-user-name'] || 'ADMIN_CHECKER';
      const result = await PayoutOrchestrator.approveDualAuthorization(payoutId, String(actor));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getPayouts = async (req: Request, res: Response) => {
    try {
      const payouts = await PayoutInstruction.findAll({
        order: [['createdAt', 'DESC']],
        limit: 100
      });
      res.json({ success: true, payouts });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getPayoutById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const payout = await PayoutInstruction.findByPk(id);
      if (!payout) {
        return res.status(404).json({ error: 'أمر الصرف غير موجود' });
      }
      res.json({ success: true, payout });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  forecastAI = async (req: Request, res: Response) => {
    try {
      const useCase = new ForecastAIUseCase(this.repo);
      const result = await useCase.execute(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  generatePDF = async (req: Request, res: Response) => {
    try {
      const useCase = new GeneratePDFUseCase(this.repo);
      const result = await useCase.execute(req.body);
      res.json(result);
    } catch (error: any) {
      console.error("Failed to generate PDF on server-side:", error);
      res.status(500).json({ error: 'حدث عطل أثناء إصدار ومعالجة ملف الـ PDF برمجياً في الخادم: ' + error.message });
    }
  };

  getCustomerWallets = async (req: Request, res: Response) => {
    try {
      const useCase = new FetchAndReconcileCustomerWalletsUseCase(this.repo);
      const result = await useCase.execute();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  convertForceMajeureBalance = async (req: Request, res: Response) => {
    try {
      const useCase = new ConvertForceMajeureBalanceUseCase(this.repo);
      const result = await useCase.execute(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  issueCredit = async (req: Request, res: Response) => {
    try {
      const useCase = new IssueCreditUseCase(this.repo);
      const result = await useCase.execute(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getSettlements = async (req: Request, res: Response) => {
    try {
      const verified = getVerifiedUser(req);
      let providerId: number | null = null;
      let isAdmin = false;

      if (verified) {
        const role = String(verified.role || '').toLowerCase();
        if (role.includes('admin') || role.includes('مدير') || role.includes('مشرف')) {
          isAdmin = true;
        } else if (role.includes('provider') || role.includes('مزود')) {
          providerId = verified.id;
        }
      } else {
        const headerRole = String(req.headers['x-user-role'] || '').toLowerCase();
        if (headerRole.includes('admin') || headerRole.includes('مدير') || headerRole.includes('مشرف')) {
          isAdmin = true;
        } else if (headerRole.includes('provider') || headerRole.includes('مزود')) {
          const headerId = req.headers['x-user-id'];
          if (headerId) providerId = Number(headerId);
        }
      }

      const where: any = {};
      if (!isAdmin && providerId) {
        where.providerId = providerId;
      } else if (!isAdmin && !providerId) {
        return res.status(403).json({ error: 'غير مصرح بالوصول لتسويات مزودين آخرين.' });
      }

      const { Settlement } = await import('../../models/Database.js');
      const { User } = await import('../../models/UserModels.js');
      const settlements = await Settlement.findAll({
        where,
        include: [
          { model: User, as: 'providerUser', attributes: ['id', 'username', 'email'] }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json(settlements);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  approveSettlement = async (req: Request, res: Response) => {
    try {
      const verified = getVerifiedUser(req);
      let isAdmin = false;

      if (verified) {
        const role = String(verified.role || '').toLowerCase();
        if (role.includes('admin') || role.includes('مدير') || role.includes('مشرف')) {
          isAdmin = true;
        }
      } else {
        const headerRole = String(req.headers['x-user-role'] || '').toLowerCase();
        if (headerRole.includes('admin') || headerRole.includes('مدير') || headerRole.includes('مشرف')) {
          isAdmin = true;
        }
      }

      if (!isAdmin) {
        return res.status(403).json({ error: 'صلاحية اعتماد التسويات المالية حصرية لإدارة النظام فقط.' });
      }

      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'معرف التسوية مطلوب.' });
      }

      const { FinancialEngine } = await import('../../services/finance/FinancialEngine.js');
      const result = await FinancialEngine.approveAndReleaseSettlement(Number(id));

      res.json({ success: true, settlement: result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getLedgerEntries = async (req: Request, res: Response) => {
    try {
      const verified = getVerifiedUser(req);
      let providerId: number | null = null;
      let isAdmin = false;

      if (verified) {
        const role = String(verified.role || '').toLowerCase();
        if (role.includes('admin') || role.includes('مدير') || role.includes('مشرف')) {
          isAdmin = true;
        } else if (role.includes('provider') || role.includes('مزود')) {
          providerId = verified.id;
        }
      } else {
        const headerRole = String(req.headers['x-user-role'] || '').toLowerCase();
        if (headerRole.includes('admin') || headerRole.includes('مدير') || headerRole.includes('مشرف')) {
          isAdmin = true;
        } else if (headerRole.includes('provider') || headerRole.includes('مزود')) {
          const headerId = req.headers['x-user-id'];
          if (headerId) providerId = Number(headerId);
        }
      }

      const where: any = {};
      if (!isAdmin && providerId) {
        where.providerId = providerId;
        where.walletType = 'provider';
      } else if (!isAdmin && !providerId) {
        return res.status(403).json({ error: 'غير مصرح بالوصول لسجلات القيود اليومية.' });
      }

      const { LedgerEntry } = await import('../../models/Database.js');
      const { User } = await import('../../models/UserModels.js');
      const entries = await LedgerEntry.findAll({
        where,
        include: [
          { model: User, as: 'providerUser', attributes: ['id', 'username', 'email'] }
        ],
        order: [['date', 'DESC']]
      });

      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
