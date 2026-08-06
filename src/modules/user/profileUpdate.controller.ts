import { Request, Response } from 'express';
import { User, PendingProfileUpdate, ProfileDataHistory, PlatformConfig } from '../../models/UserModels.js';
import { Op, DataTypes } from 'sequelize';
import { sequelize } from '../../models/dbInstance.js';

const SENSITIVE_FIELDS = [
  'commercialRecord',
  'cr',
  'vatNumber',
  'vatRecord',
  'iban',
  'bankName',
  'nationalId',
  'phone',
  'email',
  'name',
  'officialName',
  'nationalAddress',
  'addressDetails',
  'providerType',
  'avatarUrl',
  'image',
  'documents',
  'crFile',
  'vatFile',
  'ibanFile'
];

export class ProfileUpdateController {
  /**
   * Submit profile update request (enforces Admin approval for sensitive fields)
   */
  async submitProfileUpdate(req: Request, res: Response) {
    try {
      const { userId, changes, requestedByRole, email, name } = req.body;

      if (!userId || !changes || typeof changes !== 'object') {
        return res.status(400).json({ success: false, error: 'بيانات التحديث غير اكتمال' });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
      }

      // Check which fields in changes are sensitive vs non-sensitive
      const sensitiveKeys = Object.keys(changes).filter(key => SENSITIVE_FIELDS.includes(key));
      const nonSensitiveKeys = Object.keys(changes).filter(key => !SENSITIVE_FIELDS.includes(key));

      // Build current values dictionary for sensitive fields
      const currentValues: Record<string, any> = {};
      const sensitiveChanges: Record<string, any> = {};
      sensitiveKeys.forEach(key => {
        currentValues[key] = (user as any)[key] ?? null;
        sensitiveChanges[key] = changes[key];
      });

      // Update non-sensitive fields immediately
      if (nonSensitiveKeys.length > 0) {
        const nonSensitiveUpdates: Record<string, any> = {};
        nonSensitiveKeys.forEach(key => {
          nonSensitiveUpdates[key] = changes[key];
        });
        await user.update(nonSensitiveUpdates);
      }

      // If sensitive fields were edited, create pending profile update request
      if (sensitiveKeys.length > 0) {
        // Cancel or supersede previous pending requests for this user if any
        await PendingProfileUpdate.update(
          { status: 'rejected', rejectionReason: 'تم استبداله بطلب تحديث جديد' },
          { where: { userId, status: 'pending' } }
        );

        const pendingUpdate = await PendingProfileUpdate.create({
          userId: user.id,
          userEmail: email || user.email,
          userName: name || user.name,
          requestedByRole: requestedByRole || user.role,
          status: 'pending',
          requestedChanges: sensitiveChanges,
          currentValues,
          sensitiveFieldsChanged: sensitiveKeys
        });

        return res.json({
          success: true,
          pendingApproval: true,
          requestId: pendingUpdate.id,
          sensitiveFields: sensitiveKeys,
          message: 'تم تسجيل طلب تعديل البيانات الحساسة بنجاح، وهو بانتظار موافقة واعتماد الإدارة.'
        });
      }

      return res.json({
        success: true,
        pendingApproval: false,
        message: 'تم تحديث البيانات بنجاح.'
      });
    } catch (error: any) {
      console.error('Error submitting profile update:', error);
      return res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء تقديم طلب التحديث' });
    }
  }

  /**
   * Get all pending profile update requests for Admin view (includes pending and needs_revision)
   */
  async getPendingUpdates(req: Request, res: Response) {
    try {
      const pendingList = await PendingProfileUpdate.findAll({
        where: {
          status: {
            [Op.in]: ['pending', 'needs_revision']
          }
        },
        order: [['createdAt', 'DESC']]
      });
      return res.json({ success: true, pendingUpdates: pendingList });
    } catch (error: any) {
      console.error('Error fetching pending profile updates:', error);
      try {
        if (sequelize.getDialect() === 'postgres') {
          try {
            await sequelize.query(`ALTER TYPE "enum_pending_profile_updates_status" ADD VALUE IF NOT EXISTS 'needs_revision'`);
          } catch (e) {}
          try {
            await sequelize.query(`ALTER TABLE "${PendingProfileUpdate.tableName}" ALTER COLUMN "status" TYPE VARCHAR(255) USING "status"::varchar`);
          } catch (e) {}
        }
        const pendingList = await PendingProfileUpdate.findAll({
          where: {
            status: {
              [Op.in]: ['pending', 'needs_revision']
            }
          },
          order: [['createdAt', 'DESC']]
        });
        return res.json({ success: true, pendingUpdates: pendingList });
      } catch (retryErr) {
        console.error('Retry fetching pending profile updates failed:', retryErr);
        try {
          const fallbackList = await PendingProfileUpdate.findAll({
            where: { status: 'pending' },
            order: [['createdAt', 'DESC']]
          });
          return res.json({ success: true, pendingUpdates: fallbackList });
        } catch (fErr) {
          return res.status(500).json({ success: false, error: error.message });
        }
      }
    }
  }

  /**
   * Admin requests revision / additional attachments from provider/client/employee
   */
  async requestRevision(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { noteText, reviewedBy, attachments } = req.body;

      const pendingUpdate = await PendingProfileUpdate.findByPk(id);
      if (!pendingUpdate) {
        return res.status(404).json({ success: false, error: 'طلب التحديث غير موجود' });
      }

      const existingNotes = Array.isArray(pendingUpdate.notesThread) ? pendingUpdate.notesThread : [];
      const newNote = {
        id: Date.now().toString(),
        sender: reviewedBy || 'الإدارة العامة',
        senderRole: 'admin',
        text: noteText || 'يرجى إرفاق المستندات الموضحة أو إعادة إرفاق ملف الآيبان/السجل التجاري للتأكد.',
        attachments: attachments || [],
        createdAt: new Date().toISOString()
      };

      await pendingUpdate.update({
        status: 'needs_revision',
        notesThread: [...existingNotes, newNote],
        reviewedBy: reviewedBy || 'Admin',
        reviewedAt: new Date()
      });

      return res.json({
        success: true,
        message: 'تم إرجاع الطلب للمزود/العميل بنجاح وبانتظار رفع المرفقات والتعديلات المطلوبة.',
        pendingUpdate
      });
    } catch (error: any) {
      console.error('Error requesting revision for profile update:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Add a note / reply to notes thread
   */
  async addNoteThread(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { text, sender, senderRole, attachments } = req.body;

      const pendingUpdate = await PendingProfileUpdate.findByPk(id);
      if (!pendingUpdate) {
        return res.status(404).json({ success: false, error: 'طلب التحديث غير موجود' });
      }

      const existingNotes = Array.isArray(pendingUpdate.notesThread) ? pendingUpdate.notesThread : [];
      const newNote = {
        id: Date.now().toString(),
        sender: sender || 'المستخدم',
        senderRole: senderRole || 'user',
        text: text || '',
        attachments: attachments || [],
        createdAt: new Date().toISOString()
      };

      await pendingUpdate.update({
        notesThread: [...existingNotes, newNote]
      });

      return res.json({
        success: true,
        message: 'تم إضافة الملاحظة للطلب بنجاح',
        notesThread: [...existingNotes, newNote]
      });
    } catch (error: any) {
      console.error('Error adding note thread:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Admin approves profile update request
   */
  async approveUpdate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reviewedBy } = req.body;

      const pendingUpdate = await PendingProfileUpdate.findByPk(id);
      if (!pendingUpdate) {
        return res.status(404).json({ success: false, error: 'طلب التحديث غير موجود' });
      }

      if (pendingUpdate.status !== 'pending') {
        return res.status(400).json({ success: false, error: 'تم اتخاذ إجراء بشأن هذا الطلب سابقاً' });
      }

      const user = await User.findByPk(pendingUpdate.userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'المستخدم صاحب الطلب غير موجود' });
      }

      // Snapshot current user data before applying updates
      const currentSnapshot = user.toJSON();

      // Get retention policy from PlatformConfig or default to 365 days
      let retentionDays = 365;
      const retentionConfig = await PlatformConfig.findByPk('SETTINGS_DATA_RETENTION_DAYS');
      if (retentionConfig && retentionConfig.value) {
        retentionDays = parseInt(retentionConfig.value, 10) || 365;
      }

      // Save historical archive log
      await ProfileDataHistory.create({
        userId: user.id,
        userEmail: user.email,
        changedBy: reviewedBy || 'Admin',
        changeType: 'admin_approval',
        snapshot: currentSnapshot,
        changedFields: pendingUpdate.requestedChanges,
        retentionDays
      });

      // Apply requested sensitive changes to user model
      await user.update(pendingUpdate.requestedChanges);

      // Update pending request status to approved
      await pendingUpdate.update({
        status: 'approved',
        reviewedBy: reviewedBy || 'Admin',
        reviewedAt: new Date()
      });

      return res.json({
        success: true,
        message: 'تم اعتماد وتطبيق البيانات الجديدة وتوثيق النسخة السابقة في الأرشيف التاريخي بنجاح.'
      });
    } catch (error: any) {
      console.error('Error approving profile update:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Admin rejects profile update request
   */
  async rejectUpdate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { rejectionReason, reviewedBy } = req.body;

      const pendingUpdate = await PendingProfileUpdate.findByPk(id);
      if (!pendingUpdate) {
        return res.status(404).json({ success: false, error: 'طلب التحديث غير موجود' });
      }

      await pendingUpdate.update({
        status: 'rejected',
        rejectionReason: rejectionReason || 'تم الرفض من قبل الإدارة',
        reviewedBy: reviewedBy || 'Admin',
        reviewedAt: new Date()
      });

      return res.json({ success: true, message: 'تم رفض طلب التحديث' });
    } catch (error: any) {
      console.error('Error rejecting profile update:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get user data change history logs
   */
  async getProfileHistory(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const history = await ProfileDataHistory.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']]
      });
      return res.json({ success: true, history });
    } catch (error: any) {
      console.error('Error fetching profile history:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Cleanup expired data history logs based on retention days
   */
  async cleanupHistory(req: Request, res: Response) {
    try {
      const historyItems = await ProfileDataHistory.findAll();
      let deletedCount = 0;
      const now = new Date();

      for (const item of historyItems) {
        const retentionDays = item.retentionDays || 365;
        const expiryDate = new Date(item.createdAt.getTime() + retentionDays * 24 * 60 * 60 * 1000);
        if (now > expiryDate) {
          await item.destroy();
          deletedCount++;
        }
      }

      return res.json({
        success: true,
        deletedCount,
        message: `تم تنظيف ${deletedCount} سجل تاريخي تجاوزت فترة الاحتفاظ المحددة.`
      });
    } catch (error: any) {
      console.error('Error cleaning up profile history:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}
