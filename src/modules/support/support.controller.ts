import { Router, Request, Response } from "express";
import { createZohoDeskTicket } from "../integrations/zohoDesk.service.js";

const router = Router();

// In-Memory Database for demonstration
export const tickets: any[] = [
    { 
        id: 'TKT-1001', 
        title: 'مشكلة في بوابة الدفع جيديا', 
        description: 'تظهر رسالة خطأ عند محاولة الدفع عبر جيديا.',
        status: 'مفتوحة', 
        priority: 'عالية', 
        department: 'مالي', 
        customerName: 'أحمد عبدالله',
        userPlan: 'VIP', 
        createdAt: new Date(),
        slaDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
        assignedAgent: 'سارة خالد'
    },
    { 
        id: 'TKT-1002', 
        title: 'تغيير صور القاعة', 
        description: 'أرغب في تحديث صور قاعة الملكية في النظام.',
        status: 'قيد المعالجة', 
        priority: 'متوسطة', 
        department: 'تقني', 
        customerName: 'شركة أطياف لتنظيم المعارض',
        userPlan: 'الاحترافية', 
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        slaDeadline: new Date(Date.now() + 7 * 60 * 60 * 1000), // 7 hours left
        assignedAgent: 'محمد علي'
    },
    { 
        id: 'TKT-1003', 
        title: 'تأخر استلام كود تفعيل الجوال', 
        description: 'لم يصلني رمز تفعيل الجوال المؤقت للدخول على لوحة تحكم الحجز لتعديل المواعيد.',
        status: 'مفتوحة', 
        priority: 'عالية', 
        department: 'تقني', 
        customerName: 'سارة الشمري',
        userPlan: 'VIP', 
        createdAt: new Date(),
        slaDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000),
        assignedAgent: 'سارة خالد'
    },
    { 
        id: 'TKT-1004', 
        title: 'طلب ربط حساب بوابة تابي/تمارا والتقسيط المالي', 
        description: 'نرجو تفعيل بوابة الدفع تابي لتسهيل تقسيط وتأجير المناسبات والتقويم الذكي.',
        status: 'بانتظار العميل', 
        priority: 'متوسطة', 
        department: 'مالي', 
        customerName: 'مؤسسة ليلة لخدمات للمناسبات',
        userPlan: 'VIP', 
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        slaDeadline: new Date(Date.now() + 1 * 60 * 60 * 1000),
        assignedAgent: 'أحمد علي'
    },
    { 
        id: 'TKT-1005', 
        title: 'خلل في تحديث الأسعار في مؤشر التقويم الذكي', 
        description: 'عند تعديل أسعار المناسبات وعروض الويكند لا تظهر بشكل صحيح للعملاء بالواجهة.',
        status: 'مفتوحة', 
        priority: 'عالية جداً', 
        department: 'تقني', 
        customerName: 'شركة الريم لخدمات الفندقة والضيافة ومستلزمات الحفلات',
        userPlan: 'الاحترافية', 
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        slaDeadline: new Date(Date.now() + 11 * 60 * 60 * 1000),
        assignedAgent: 'محمد عمر'
    },
    { 
        id: 'TKT-1006', 
        title: 'طلب استرجاع عربون حجز تالف أو ملغي', 
        description: 'قمت بإلغاء حجز قاعة الأسطورة الكبرى ضمن المدة المسموحة ولم يسترد العربون لمحفظتي الرقمية.',
        status: 'مغلقة', 
        priority: 'منخفضة', 
        department: 'مالي', 
        customerName: 'فيصل العتيبي',
        userPlan: 'عادية', 
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        slaDeadline: new Date(Date.now() - 24 * 60 * 60 * 1000),
        assignedAgent: 'سارة خالد'
    },
    { 
        id: 'TKT-1007', 
        title: 'طلب ترقية الباقة وزيادة عدد المنتجات المتاحة بالصفحة', 
        description: 'رغبة في ترقية الحساب الحزمة الاحترافية لاستيعاب تغطية درون والبث المباشر للأجنحة الترفيهية.',
        status: 'قيد المعالجة', 
        priority: 'متوسطة', 
        department: 'مبيعات', 
        customerName: 'استوديو روتانا الفوتوغرافي',
        userPlan: 'الاحترافية', 
        createdAt: new Date(),
        slaDeadline: new Date(Date.now() + 12 * 60 * 60 * 1000),
        assignedAgent: 'محمد علي'
    }
];

export const messages: any[] = [
    {
        id: 'MSG-1',
        ticketId: 'TKT-1001',
        senderName: 'أحمد عبدالله',
        senderType: 'عميل',
        message: 'تظهر رسالة خطأ عند محاولة الدفع عبر جيديا.',
        createdAt: new Date()
    }
];

// دالة احتساب وقت الـ SLA بناءً على الباقة
function calculateSLADeadline(plan: string, createdAt: Date): Date {
    const deadline = new Date(createdAt);
    if (plan === 'VIP' || plan === 'أعمال VIP') {
        deadline.setHours(deadline.getHours() + 2); // ساعتان للباقات المميزة
    } else if (plan === 'الاحترافية') {
        deadline.setHours(deadline.getHours() + 12); // 12 ساعة للباقة الاحترافية
    } else {
        deadline.setHours(deadline.getHours() + 24); // 24 ساعة للأساسية والمجانية
    }
    return deadline;
}

// دالة توجيه التذاكر آلياً (Auto-Routing)
function assignTicketAuto(department: string) {
    const agents = {
        'تقني': ['محمد علي', 'عبدالله أحمد'],
        'مالي': ['سارة خالد', 'نورة محمد'],
        'عام': ['فهد سعد', 'ريم عبدالعزيز']
    };
    const deptAgents = agents[department as keyof typeof agents] || agents['عام'];
    return deptAgents[Math.floor(Math.random() * deptAgents.length)];
}

router.get("/tickets", (req: Request, res: Response) => {
    res.json(tickets);
});

router.post("/tickets", (req: Request, res: Response) => {
    const { title, description, department, userPlan, customerName } = req.body;
    const createdAt = new Date();
    const slaDeadline = calculateSLADeadline(userPlan || 'الأساسية', createdAt);
    const assignedAgent = assignTicketAuto(department);
    
    const newTicket = {
        id: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
        title,
        description,
        department,
        status: 'مفتوحة',
        priority: userPlan === 'VIP' ? 'عالية' : 'متوسطة',
        userPlan,
        customerName,
        createdAt,
        slaDeadline,
        assignedAgent
    };
    
    tickets.unshift(newTicket);
    
    // Create initial message
    messages.push({
        id: `MSG-${Date.now()}`,
        ticketId: newTicket.id,
        senderName: customerName,
        senderType: 'عميل',
        message: description,
        createdAt
    });

    // Trigger Zoho Desk integration asynchronously (if enabled)
    (async () => {
        try {
            const zohoRes = await createZohoDeskTicket({
                customerName: customerName || 'عميل منصة ليلة',
                email: req.body.email || req.body.customerEmail || 'customer@layla.sa',
                subject: title || 'شكوى / بلاغ جديد - منصة ليلة',
                description: description,
                bookingId: req.body.bookingId || '',
                priority: newTicket.priority
            });
            if (zohoRes.success && zohoRes.ticketNumber) {
                console.log(`[Zoho Sync] Ticket synced to Zoho Desk. Ticket #: ${zohoRes.ticketNumber}`);
            }
        } catch (zErr: any) {
            console.warn('[Zoho Sync Warning] Could not sync ticket to Zoho Desk:', zErr.message);
        }
    })();

    res.json({ success: true, ticket: newTicket });
});

router.get("/tickets/:id/messages", (req: Request, res: Response) => {
    const ticketMessages = messages.filter(m => m.ticketId === req.params.id);
    res.json(ticketMessages);
});

router.post("/tickets/:id/reply", (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { message, senderName, senderType } = req.body;
        
        const reply = {
            id: `MSG-${Date.now()}`,
            ticketId: id,
            message,
            senderName,
            senderType,
            createdAt: new Date()
        };
        messages.push(reply);

        // Update ticket status on reply
        const ticket = tickets.find(t => t.id === id);
        if (ticket) {
            if (senderType === 'موظف') {
                ticket.status = 'بانتظار العميل';
            } else {
                ticket.status = 'مفتوحة';
            }
        }

        const io = req.app.get("io");
        if (io) {
            io.to(`ticket_${id}`).emit("new_message", reply);
            io.emit("ticket_updated", ticket);
        }

        res.json({ success: true, reply, ticket });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// SLA Cron Job Simulation (Checks every 15 minutes)
export function startSLAWorker(io: any) {
    setInterval(() => {
        try {
            const now = new Date();
            let violated = false;
            tickets.forEach(ticket => {
                if (ticket && ticket.status !== 'مغلقة' && ticket.status !== 'مخالفة الأولوية') {
                    const deadline = ticket.slaDeadline instanceof Date ? ticket.slaDeadline : new Date(ticket.slaDeadline);
                    if (now > deadline) {
                        ticket.status = 'مخالفة الأولوية';
                        ticket.priority = 'عالية جدا';
                        violated = true;
                        console.log(`[SLA Alert] Ticket ${ticket.id} violated SLA limit!`);
                        if (io) io.emit("ticket_violation", ticket); // Alert management
                    }
                }
            });
            if (violated && io) {
                io.emit("tickets_refresh");
            }
        } catch (e) {
            console.error("SLA worker background ticker error caught securely:", e);
        }
    }, 15 * 60 * 1000);
}

export default router;
