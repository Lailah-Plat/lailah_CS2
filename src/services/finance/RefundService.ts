import { IFinanceRepository } from "../../modules/finance/finance.repository.js";

export class RefundService {
  /**
   * Safe-converts a force majeure held balance to customer wallet cash credit.
   */
  static async convertForceMajeureBalance(
    financeRepository: IFinanceRepository,
    heldBalanceId: number,
    approvedBy: string
  ) {
    const hb = await financeRepository.findCustomerHeldBalanceByPk(heldBalanceId);
    if (!hb) {
      throw new Error("سجل الرصيد المحجوز غير موجود");
    }

    if (hb.conversionStatus !== "held") {
      throw new Error("عذراً، هذا الرصيد تم استخدامه أو تحويله مسبقاً.");
    }

    if (hb.holdReason !== "force_majeure") {
      throw new Error(
        "تحذير أمني: المسار اليدوي للاسترداد المائي الفوري بدون رسوم مسموح به خصيصاً لحالات القوة القاهرة (force majeure) فقط."
      );
    }

    // Validate 30 days rule
    const now = new Date();
    const heldSinceDate = hb.heldSince ? new Date(hb.heldSince) : new Date();
    const diffMs = now.getTime() - heldSinceDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays < 30) {
      throw new Error(
        `لا يمكن تحويل رصيد القوة القاهرة يدوياً إلا بعد انقضاء 30 يوماً على الأقل من تاريخ الحجز. الأيام المنقضية الحالية: ${Math.floor(
          diffDays
        )} يوم فقط.`
      );
    }

    // Process manual conversion with no fees
    hb.conversionStatus = "converted_to_cash";
    hb.approvedByAdmin = approvedBy || "إدارة العمليات العليا بموافقة رسمية";
    hb.notes =
      (hb.notes || "") +
      ` | تم تحويل رصيد القوة القاهرة يدوياً بالكامل [${hb.amount} ر.س] لموافقة الإدارة والامتثال دون خصم أي تكاليف للمنصة.`;
    await hb.save();

    const [wallet] = await financeRepository.findOrCreateCustomerWallet(
      hb.customerEmail,
      {
        customerName: hb.customerName || "عميل منصة ليلة",
        cashBalance: 0,
      }
    );
    wallet.cashBalance += hb.amount;
    await wallet.save();

    return { heldBalance: hb, wallet };
  }
}
