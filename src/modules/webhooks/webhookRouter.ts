import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { PaymentWebhookService } from '../../services/payment/PaymentWebhookService.js';

export const webhookRouter = Router();

/**
 * @route POST /api/webhooks/payment
 * @description أتمتة استقبال إشارات بوابات الدفع (Payment Gateway Webhook Listener)
 * يستقبل إشعارات الخادم للخادم (Server-to-Server) لجميع بوابات الدفع (Moyasar, Tap, HyperPay, Laylah)
 * ويتحقق من التوقيع الرقمي لمنع التلاعب وتحديث حالة الحجز والعقد فورياً عبر VerifiedPaymentEvent.
 */
webhookRouter.post('/payment', async (req: Request, res: Response) => {
  try {
    const signature = (req.headers['x-webhook-signature'] || req.headers['x-moyasar-signature'] || req.headers['x-tap-signature'] || req.headers['signature'] || '') as string;
    let rawPayload = req.body;
    if (Buffer.isBuffer(rawPayload)) {
      try {
        rawPayload = JSON.parse(rawPayload.toString('utf8'));
      } catch (e) {
        rawPayload = {};
      }
    }

    console.log('[Payment Webhook] Received event:', JSON.stringify(rawPayload, null, 2));

    const gatewayName = (req.query.gateway as string) || (req.headers['x-gateway-name'] as string) || 'moyasar';

    let webhookResult;
    try {
      webhookResult = await PaymentWebhookService.handleIncomingWebhook(
        gatewayName,
        rawPayload,
        signature,
        req.headers as Record<string, any>
      );
    } catch (secError: any) {
      console.error('[Payment Webhook] Verification/Capture Security Guard Error:', secError.message || secError);
      return res.status(400).json({ success: false, error: secError.message });
    }

    const event = rawPayload;
    const paymentData = event.data || event;
    const bookingNumber = paymentData.metadata?.bookingNumber || paymentData.bookingNumber || paymentData.reference_id || `BKG-26-${String(Math.floor(Math.random() * 9000000000) + 1000000000)}`;
    const amount = paymentData.amount || paymentData.amount_format || 0;
    const transactionId = paymentData.id || paymentData.transaction_id || `TRX-${Date.now()}`;

    // إطلاق حدث Socket.IO لحظي للعملاء والمزودين والإدارة
    const io = req.app.get('io');
    if (io) {
      io.emit('payment_status_changed', {
        bookingNumber,
        status: 'confirmed',
        paymentStatus: 'paid',
        transactionId,
        amount,
        timestamp: new Date().toISOString(),
        webhookVerified: true,
        verifiedEventId: webhookResult.verifiedEvent.id
      });

      io.emit('new_notification', {
        type: 'PAYMENT_CAPTURED',
        title: 'تأكيد الدفع التلقائي عبر البوابة',
        message: `تم سداد المبلغ المطلوب وحجز الطلب رقم ${bookingNumber} بنجاح via Webhook.`,
        bookingNumber,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      status: 'processed',
      message: 'تم استقبال واعتماد إشارة الدفع وتثبيت اللقطة المالية بنجاح',
      bookingNumber,
      transactionId,
      verifiedEventId: webhookResult.verifiedEvent.id,
      verifiedServerToServer: true
    });
  } catch (err: any) {
    console.error('[Payment Webhook] Error processing webhook:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});
