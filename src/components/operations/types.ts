export interface PriorityReason {
  code: string;
  label: string;
  weight: number;
}

export interface OperationalCase {
  id: number;
  caseId: string;
  caseType: string;
  title: string;
  description: string;
  source: string;
  sourceEventId?: string | null;
  sourceEntityType: string;
  sourceEntityId: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  priorityReasons: PriorityReason[];
  status: 'NEW' | 'TRIAGED' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING_EXTERNAL' | 'ESCALATED' | 'RESOLVED' | 'CLOSED' | 'REOPENED';
  assignedUserId?: number | null;
  assignedUserName?: string | null;
  assignedTeamId?: string | null;
  assignedTeamName?: string | null;
  dueAt: string;
  firstResponseAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  isSlaPaused: boolean;
  slaPauseReason?: string | null;
  slaPausedAt?: string | null;
  escalationLevel: number;
  financialImpact: number;
  customerImpact: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKING';
  eventDate?: string | null;
  resolutionCode?: string | null;
  resolutionSummary?: string | null;
  createdBy: string;
  deduplicationKey: string;
  version: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  activities?: OperationalCaseActivity[];
}

export interface OperationalCaseActivity {
  id: number;
  caseId: string;
  activityType: string;
  authorId?: number | null;
  authorName: string;
  authorRole: string;
  previousValue?: string | null;
  newValue?: string | null;
  message: string;
  metadata?: any;
  createdAt: string;
}

export interface OperationalPulseCounts {
  totalActive: number;
  critical: number;
  high: number;
  unassigned: number;
  assignedToMe: number;
  overdue: number;
  approachingSla: number;
  pendingApprovals: number;
  bookingsAttention: number;
  financialStalled: number;
  openDisputes: number;
  activeEscalations: number;
}

export interface OperationalTeam {
  id: string;
  name: string;
  lead: string;
}

export interface CommandDefinition {
  commandId: string;
  label: string;
  description: string;
  requiredPermission: string;
  allowedCaseTypes: string[];
  allowedStatuses: string[];
  confirmationLevel: 'NONE' | 'CONFIRM' | 'SENSITIVE' | 'TWO_PERSON';
  reasonRequired: boolean;
  approvalRequired: boolean;
  category: 'LIFECYCLE' | 'ASSIGNMENT' | 'ESCALATION' | 'COLLABORATION' | 'VIEW';
}

export type OperationsMode = 'exceptions' | 'command' | 'workspace';
export type WorkspaceViewMode = 'focused' | 'split' | 'three-column' | 'timeline';
export type ExceptionsViewMode = 'smart-list' | 'stage-board' | 'timeline' | 'team-distribution';

export const CASE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  PROVIDER_APPROVAL: { label: 'اعتماد شريك جديد', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  HALL_APPROVAL: { label: 'اعتماد قاعة ومنشأة', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  VENUE_APPROVAL: { label: 'اعتماد منشأة', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  SERVICE_APPROVAL: { label: 'اعتماد خدمة مساندة', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  BOOKING_ATTENTION: { label: 'حجز يحتاج تدخلاً', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  SERVICE_REQUEST_STALLED: { label: 'طلب خدمة متعثر', color: 'text-orange-700 bg-orange-50 border-orange-200' },
  PROVIDER_DEADLINE_EXPIRED: { label: 'انتهاء مهلة رد المزود', color: 'text-red-700 bg-red-50 border-red-200' },
  PAYMENT_FAILED: { label: 'فشل عملية سداد', color: 'text-red-700 bg-red-50 border-red-200' },
  FINANCIAL_MISMATCH: { label: 'فروقات تسوية مالية', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  SETTLEMENT_STALLED: { label: 'تسوية مالية متوقفة', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  REFUND_REQUEST: { label: 'طلب استرداد مالي', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  FINANCIAL_DISPUTE: { label: 'نزاع مالي وتشغيلي', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  OPERATIONAL_COMPLAINT: { label: 'شكوى عميل حرجة', color: 'text-red-700 bg-red-50 border-red-200' },
  PROVIDER_CANCELLATION_REQUEST: { label: 'طلب إلغاء حجز مؤكد', color: 'text-red-800 bg-red-100 border-red-300' },
  EXPIRED_DOCUMENT: { label: 'وثيقة رسمية منتهية', color: 'text-yellow-800 bg-yellow-50 border-yellow-200' },
  VIOLATION_REVIEW: { label: 'مراجعة مخالفة تشغيلية', color: 'text-red-700 bg-red-50 border-red-200' },
  CROSS_DEPARTMENT_COORDINATION: { label: 'تنسيق بين الإدارات', color: 'text-blue-700 bg-blue-50 border-blue-200' }
};

export const STATUS_LABELS: Record<string, { label: string; badge: string; stepOrder: number }> = {
  NEW: { label: 'جديدة', badge: 'bg-blue-100 text-blue-800 border-blue-300', stepOrder: 1 },
  TRIAGED: { label: 'تحت الفرز', badge: 'bg-indigo-100 text-indigo-800 border-indigo-300', stepOrder: 2 },
  ASSIGNED: { label: 'مسندة', badge: 'bg-purple-100 text-purple-800 border-purple-300', stepOrder: 3 },
  IN_PROGRESS: { label: 'قيد المعالجة', badge: 'bg-amber-100 text-amber-800 border-amber-300', stepOrder: 4 },
  WAITING_EXTERNAL: { label: 'بانتظار جهة خارجية', badge: 'bg-gray-100 text-gray-800 border-gray-300', stepOrder: 5 },
  ESCALATED: { label: 'مصعّدة', badge: 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse', stepOrder: 6 },
  RESOLVED: { label: 'محلولة', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', stepOrder: 7 },
  CLOSED: { label: 'مغلقة', badge: 'bg-slate-100 text-slate-700 border-slate-300', stepOrder: 8 },
  REOPENED: { label: 'أعيد فتحها', badge: 'bg-orange-100 text-orange-800 border-orange-300', stepOrder: 9 }
};

export const PRIORITY_LABELS: Record<string, { label: string; badge: string; dot: string }> = {
  CRITICAL: { label: 'حرجة', badge: 'bg-red-50 text-red-700 border-red-200 font-bold', dot: 'bg-red-600' },
  HIGH: { label: 'عالية', badge: 'bg-orange-50 text-orange-700 border-orange-200 font-semibold', dot: 'bg-orange-500' },
  MEDIUM: { label: 'متوسطة', badge: 'bg-yellow-50 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
  LOW: { label: 'منخفضة', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' }
};

export const OPERATIONAL_TEAMS = [
  { id: 'SUPPORT', name: 'فريق دعم العملاء والشركاء', lead: 'سارة المطيري' },
  { id: 'VERIFICATION', name: 'فريق الاعتماد والتحقق', lead: 'عبدالله السالم' },
  { id: 'FINANCE', name: 'فريق التدقيق والعمليات المالية', lead: 'محمد القحطاني' },
  { id: 'LOGISTICS', name: 'فريق التنسيق اللوجستي والميداني', lead: 'فهد العتيبي' },
  { id: 'EXECUTIVE', name: 'الإدارة والرقابة السيادية', lead: 'المشرف العام' }
];

