// -------------------------------------------------------------
// نموذج افتراضي لخلفية Node.js (Node.js & Database Schema)
// هذا الملف للتوضيح كجزء من بنية Full-Stack كما هو مطلوب.
// في بيئة الإنتاج يتم استخدام Express و Multer و DB.
// -------------------------------------------------------------

import express from 'express';
import multer from 'multer';
import path from 'path';

// إعداد التخزين باستخدام multer
// يتم حفظ الصور في مجلد uploads في الخادم
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/branding'); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const app = express();
app.use(express.json());

/*
 * Database Schema (Example using Prisma / SQL):
 *
 * CREATE TABLE System_Settings (
 *   id INT PRIMARY KEY AUTO_INCREMENT,
 *   setting_key VARCHAR(255) UNIQUE,
 *   setting_value TEXT
 * );
 */

// محاكاة قاعدة البيانات
const mockDatabase: Record<string, string> = {
  logoUrl: '',
  faviconUrl: '',
  coverUrl: ''
};

/**
 * Endpoint: تحديث الهوية البصرية (Branding)
 * Method: PUT
 */
app.put('/api/settings/branding', upload.single('image') as any, async (req: express.Request, res: express.Response) => {
  try {
    const file = req.file;
    const { type } = req.body; // e.g., 'logoUrl', 'faviconUrl', 'coverUrl'

    if (!file) {
       return res.status(400).json({ success: false, message: 'لم يتم إرسال أي صورة' });
    }

    // مسار الصورة الذي سيتم حفظه في قاعدة البيانات
    const imageUrl = `/uploads/branding/${file.filename}`;

    // حفظ المسار في قاعدة البيانات
    // await db.query('UPDATE System_Settings SET setting_value = ? WHERE setting_key = ?', [imageUrl, type]);
    mockDatabase[type] = imageUrl;

    res.json({
      success: true,
      message: 'تم تحديث الصورة بنجاح',
      url: imageUrl
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
});

/**
 * Endpoint: استرجاع الهوية البصرية الحالية
 * Method: GET
 */
app.get('/api/settings/branding', async (req, res) => {
  try {
    // جلب من قاعدة البيانات
    // const rows = await db.query('SELECT * FROM System_Settings WHERE setting_key IN ("logoUrl", "faviconUrl", "coverUrl")');
    
    res.json({
      success: true,
      data: mockDatabase
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
});

export default app;
