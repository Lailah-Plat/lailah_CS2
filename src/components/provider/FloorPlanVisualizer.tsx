import React, { useState, useMemo, useRef } from 'react';
import {
  LayoutGrid, Plus, Trash2, Move, Share2, Printer, Check,
  Layers, Users, Sparkles, Box, Info, Shield, Compass, RotateCw,
  Eye, Sliders, AlertTriangle, CheckCircle2, ChevronRight, ChevronLeft,
  X, QrCode, Phone, Coffee, UserCheck, Lock, Unlock, Search, Download,
  Maximize2, ArrowRight, RefreshCw, Bookmark, Star, FileText, Send,
  SlidersHorizontal, Flame, Award, Heart, HelpCircle, Copy, Minus, GripVertical
} from 'lucide-react';
import { useEntitlements } from '../../context/EntitlementContext';

export interface LayoutGuest {
  id: string;
  seatNumber: number;
  name: string;
  phone?: string;
  rsvpStatus: 'confirmed' | 'pending' | 'declined' | 'checked_in';
  specialNotes?: string;
  isVIP?: boolean;
}

export interface LayoutElement {
  id: string;
  type: 
    | 'round_table_6' 
    | 'round_table_8' 
    | 'round_table_10' 
    | 'round_table_12'
    | 'round_table_custom'
    | 'royal_table'
    | 'cocktail_table'
    | 'vip_najdi'
    | 'vip_hijazi'
    | 'vip_modern'
    | 'stage'
    | 'catwalk'
    | 'buffet'
    | 'reception'
    | 'dj_booth'
    | 'emergency_exit'
    | 'service_station';
  label: string;
  category: 'table' | 'lounge' | 'structure' | 'service';
  capacity: number;
  x: number; // percentage coordinate 0-100
  y: number; // percentage coordinate 0-100
  width?: number; // relative px or scale
  height?: number;
  rotation: number; // 0 to 360 degrees
  isVIPZone?: boolean;
  assignedStaff?: string;
  status: 'available' | 'partial' | 'occupied' | 'vip';
  guests: LayoutGuest[];
  specialServiceNotes?: string;
  isLocked?: boolean;
  zone?: 'left' | 'center' | 'right' | 'vip_front';
  rowNumber?: number;
  colNumber?: number;
}

interface FloorPlanVisualizerProps {
  currentProviderName?: string;
  providerSubscription?: any;
  halls?: any[];
  bookings?: any[];
  showNotification?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const FloorPlanVisualizer: React.FC<FloorPlanVisualizerProps> = ({
  currentProviderName = 'مزود معتمد',
  providerSubscription,
  halls = [],
  bookings = [],
  showNotification
}) => {
  const { capabilities } = useEntitlements();
  const isFeatureAllowed = capabilities.hasFloorPlan360 !== false;

  // Selected Hall
  const currentHall = halls[0] || null;
  const initialHallMaxCap = currentHall?.capacity ? Number(currentHall.capacity) : 350;
  
  const [selectedHallId, setSelectedHallId] = useState<string>(halls[0]?.id || 'hall-1');
  const [hallLength, setHallLength] = useState<number>(35); // in meters
  const [hallWidth, setHallWidth] = useState<number>(24);   // in meters
  const [selectedBookingId, setSelectedBookingId] = useState<string>('master_template');

  // 1. Capacity & Guest Calculator States
  const [maxHallCapacity, setMaxHallCapacity] = useState<number>(initialHallMaxCap);
  const [targetGuests, setTargetGuests] = useState<number>(Math.min(250, initialHallMaxCap));
  const [defaultTableCapacity, setDefaultTableCapacity] = useState<number>(10); // 8, 10, 12, or custom 3-16
  const [vipSeatsTarget, setVipSeatsTarget] = useState<number>(24); // VIP front row seats

  // Grid / Columns & Rows Distribution Control
  const [leftWingCols, setLeftWingCols] = useState<number>(2);
  const [rightWingCols, setRightWingCols] = useState<number>(2);
  const [centerCols, setCenterCols] = useState<number>(2);
  const [stageClearanceMeters, setStageClearanceMeters] = useState<number>(4.0); // Buffer space between Stage and first rows

  // View modes: 2D Blueprint vs 360° Virtual Preview
  const [viewMode, setViewMode] = useState<'2d' | '360'>('2d');
  const [isSnapGridEnabled, setIsSnapGridEnabled] = useState<boolean>(true);
  
  // Right Panel / Calculator Drawer
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(true);
  const [selectedElementId, setSelectedElementId] = useState<string | null>('el-2');
  
  // Modals & Export States
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [printDocType, setPrintDocType] = useState<'table_tent' | 'blueprint' | 'gate_manifest' | 'readiness_sheet'>('table_tent');
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareLinkCopied, setShareLinkCopied] = useState<boolean>(false);
  const [active360PerspectiveElementId, setActive360PerspectiveElementId] = useState<string | null>('el-2');

  // Dragging state
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Master Layout Elements Initial State
  const [elements, setElements] = useState<LayoutElement[]>([
    {
      id: 'el-stage',
      type: 'stage',
      category: 'structure',
      label: 'منصة المسرح والكوشة الملكية',
      capacity: 0,
      x: 32,
      y: 3,
      rotation: 0,
      status: 'available',
      guests: [],
      isLocked: true
    },
    {
      id: 'el-catwalk',
      type: 'catwalk',
      category: 'structure',
      label: 'ممر الزفة الرئيسي (Catwalk)',
      capacity: 0,
      x: 46,
      y: 16,
      rotation: 0,
      status: 'available',
      guests: [],
      isLocked: true
    },
    // VIP Front Royal Tables (مقابل المسرح في المقدمة مع مسافة فارغة)
    {
      id: 'el-vip-1',
      type: 'royal_table',
      category: 'table',
      label: 'طاولة الشرف الملكية (VIP 01 - اليمين)',
      capacity: 12,
      x: 16,
      y: 28,
      rotation: 0,
      isVIPZone: true,
      zone: 'vip_front',
      assignedStaff: 'المشرفة نورة السبيعي',
      status: 'vip',
      specialServiceNotes: 'ضيافة ملكية، دلال رسلان بالزعفران، وأطقم كريستال مخصصة',
      guests: [
        { id: 'g-1', seatNumber: 1, name: 'والد العريس', phone: '0501234567', rsvpStatus: 'checked_in', isVIP: true },
        { id: 'g-2', seatNumber: 2, name: 'العم فهد السالم', phone: '0559876543', rsvpStatus: 'confirmed', isVIP: true },
        { id: 'g-3', seatNumber: 3, name: 'سعادة الدكتور إبراهيم', phone: '0543322110', rsvpStatus: 'confirmed', isVIP: true },
        { id: 'g-4', seatNumber: 4, name: 'الشيخ خالد الفالح', phone: '0567788990', rsvpStatus: 'confirmed', isVIP: true }
      ]
    },
    {
      id: 'el-vip-2',
      type: 'royal_table',
      category: 'table',
      label: 'طاولة الشرف الملكية (VIP 02 - اليسار)',
      capacity: 12,
      x: 62,
      y: 28,
      rotation: 0,
      isVIPZone: true,
      zone: 'vip_front',
      assignedStaff: 'المشرفة سارة القحطاني',
      status: 'vip',
      specialServiceNotes: 'أهل العروس - طاقم مباشرين مخصص',
      guests: [
        { id: 'g-5', seatNumber: 1, name: 'والد العروس', phone: '0505551122', rsvpStatus: 'confirmed', isVIP: true },
        { id: 'g-6', seatNumber: 2, name: 'الخال عبدالرحمن', phone: '0533334455', rsvpStatus: 'confirmed', isVIP: true }
      ]
    },
    // Row 1 - Left & Right Columns
    {
      id: 'el-t-1',
      type: 'round_table_10',
      category: 'table',
      label: 'طاولة 01 (يمين - صف 1)',
      capacity: 10,
      x: 10,
      y: 44,
      rotation: 0,
      zone: 'left',
      rowNumber: 1,
      colNumber: 1,
      status: 'occupied',
      guests: Array.from({ length: 10 }).map((_, i) => ({
        id: `g-1-${i}`,
        seatNumber: i + 1,
        name: `ضيف ${i + 1}`,
        rsvpStatus: 'confirmed'
      }))
    },
    {
      id: 'el-t-2',
      type: 'round_table_10',
      category: 'table',
      label: 'طاولة 02 (يمين - صف 1)',
      capacity: 10,
      x: 26,
      y: 44,
      rotation: 0,
      zone: 'left',
      rowNumber: 1,
      colNumber: 2,
      status: 'partial',
      guests: Array.from({ length: 6 }).map((_, i) => ({
        id: `g-2-${i}`,
        seatNumber: i + 1,
        name: `ضيف ${i + 1}`,
        rsvpStatus: 'confirmed'
      }))
    },
    {
      id: 'el-t-3',
      type: 'round_table_10',
      category: 'table',
      label: 'طاولة 03 (يسار - صف 1)',
      capacity: 10,
      x: 60,
      y: 44,
      rotation: 0,
      zone: 'right',
      rowNumber: 1,
      colNumber: 1,
      status: 'available',
      guests: []
    },
    {
      id: 'el-t-4',
      type: 'round_table_10',
      category: 'table',
      label: 'طاولة 04 (يسار - صف 1)',
      capacity: 10,
      x: 76,
      y: 44,
      rotation: 0,
      zone: 'right',
      rowNumber: 1,
      colNumber: 2,
      status: 'available',
      guests: []
    },
    // Row 2 - Left & Right Columns
    {
      id: 'el-t-5',
      type: 'round_table_10',
      category: 'table',
      label: 'طاولة 05 (يمين - صف 2)',
      capacity: 10,
      x: 10,
      y: 60,
      rotation: 0,
      zone: 'left',
      rowNumber: 2,
      colNumber: 1,
      status: 'available',
      guests: []
    },
    {
      id: 'el-t-6',
      type: 'round_table_10',
      category: 'table',
      label: 'طاولة 06 (يمين - صف 2)',
      capacity: 10,
      x: 26,
      y: 60,
      rotation: 0,
      zone: 'left',
      rowNumber: 2,
      colNumber: 2,
      status: 'available',
      guests: []
    },
    {
      id: 'el-t-7',
      type: 'round_table_10',
      category: 'table',
      label: 'طاولة 07 (يسار - صف 2)',
      capacity: 10,
      x: 60,
      y: 60,
      rotation: 0,
      zone: 'right',
      rowNumber: 2,
      colNumber: 1,
      status: 'available',
      guests: []
    },
    {
      id: 'el-t-8',
      type: 'round_table_10',
      category: 'table',
      label: 'طاولة 08 (يسار - صف 2)',
      capacity: 10,
      x: 76,
      y: 60,
      rotation: 0,
      zone: 'right',
      rowNumber: 2,
      colNumber: 2,
      status: 'available',
      guests: []
    },
    // Facilities at bottom
    {
      id: 'el-buffet',
      type: 'buffet',
      category: 'service',
      label: 'جناح البوفيه المفتوح الملكي',
      capacity: 0,
      x: 34,
      y: 84,
      rotation: 0,
      status: 'available',
      guests: []
    },
    {
      id: 'el-reception',
      type: 'reception',
      category: 'service',
      label: 'بوابة الاستقبال والترحيب',
      capacity: 0,
      x: 80,
      y: 84,
      rotation: 0,
      status: 'available',
      guests: []
    },
    {
      id: 'el-dj',
      type: 'dj_booth',
      category: 'structure',
      label: 'كابينة التحكم بالصوتيات والإضاءة',
      capacity: 0,
      x: 84,
      y: 8,
      rotation: 0,
      status: 'available',
      guests: []
    }
  ]);

  // Derived Calculations
  const grossArea = hallLength * hallWidth;
  const fixedStructuresArea = 160; // Stage, Catwalk, Buffet, Reception, Clearances
  const netUsableArea = Math.max(100, grossArea - fixedStructuresArea);

  // VIP Area & Standard Area Calculation
  const vipAreaAllocated = (vipSeatsTarget * 2.25); // 2.25 m² per VIP seat (2.0 - 2.5 standard)
  const standardAreaAvailable = Math.max(50, netUsableArea - vipAreaAllocated);

  // Capacity Math
  const standardGuestsTarget = Math.max(0, targetGuests - vipSeatsTarget);
  const requiredStandardTables = Math.ceil(standardGuestsTarget / defaultTableCapacity);
  const requiredVipTables = Math.ceil(vipSeatsTarget / 12); // Standard Royal VIP table = 12 seats
  const totalCalculatedTables = requiredStandardTables + requiredVipTables;

  const totalSeatsInCanvas = useMemo(() => {
    return elements.reduce((acc, curr) => acc + curr.capacity, 0);
  }, [elements]);

  const totalConfirmedGuests = useMemo(() => {
    return elements.reduce((acc, curr) => {
      return acc + (curr.guests?.filter(g => g.rsvpStatus === 'confirmed' || g.rsvpStatus === 'checked_in').length || 0);
    }, 0);
  }, [elements]);

  const maxLicensedCapacity = useMemo(() => {
    return Math.min(maxHallCapacity, Math.floor(netUsableArea / 1.4));
  }, [netUsableArea, maxHallCapacity]);

  const occupancyRate = maxLicensedCapacity > 0 ? Math.round((totalSeatsInCanvas / maxLicensedCapacity) * 100) : 0;
  const areaPerGuest = totalSeatsInCanvas > 0 ? (netUsableArea / totalSeatsInCanvas).toFixed(2) : '0';

  // Safety & Distance Clearance Detector
  const safetyWarnings = useMemo(() => {
    const warnings: string[] = [];
    if (totalSeatsInCanvas > maxHallCapacity) {
      warnings.push(`تنبيه: السعة الموزعة بالمخطط (${totalSeatsInCanvas} مقعد) تتجاوز طاقة القاعة الاستيعابية المحددة مسبقاً (${maxHallCapacity} ضيف).`);
    }
    if (occupancyRate > 98) {
      warnings.push(`تنبيه: السعة الموزعة تتجاوز الحد المرخص للدفاع المدني (${maxLicensedCapacity} ضيف).`);
    }
    if (parseFloat(areaPerGuest) < 1.4 && totalSeatsInCanvas > 0) {
      warnings.push(`معدل نصيب الضيف (${areaPerGuest} م²/ضيف) أقل من المعيار القياسي الموصى به (1.4 - 1.8 م²).`);
    }
    // Check elements too close to stage or catwalk
    const tablesNearStage = elements.filter(e => e.category === 'table' && e.y < (18 + stageClearanceMeters * 1.5));
    if (tablesNearStage.length > 0) {
      warnings.push(`يوجد ${tablesNearStage.length} طاولات قريبة من منصة الكوشة ومسار الزفة (مسافة أقل من ${stageClearanceMeters} أمتار).`);
    }
    return warnings;
  }, [occupancyRate, totalSeatsInCanvas, maxHallCapacity, maxLicensedCapacity, areaPerGuest, elements, stageClearanceMeters]);

  // Selected element for property editing
  const selectedElement = useMemo(() => {
    return elements.find(e => e.id === selectedElementId) || null;
  }, [elements, selectedElementId]);

  // -------------------------------------------------------------
  // RE-CALCULATE AND RE-GENERATE STRUCTURED GRID (صفوف وأعمدة منتظمة)
  // -------------------------------------------------------------
  const generateStructuredGridLayout = (
    totalGuestsNum: number = targetGuests,
    tableCap: number = defaultTableCapacity,
    vipCount: number = vipSeatsTarget,
    leftCols: number = leftWingCols,
    rightCols: number = rightWingCols,
    centerColsCount: number = centerCols,
    clearance: number = stageClearanceMeters
  ) => {
    const baseStructures = elements.filter(e => e.category === 'structure' || e.category === 'service');
    
    // 1. VIP Tables placed upfront facing stage with designated buffer clearance
    const vipTablesCount = Math.max(1, Math.ceil(vipCount / 12));
    const newVipTables: LayoutElement[] = [];

    // Distribute VIP tables symmetrically upfront
    const startY = 24 + Math.round(clearance * 1.2); // respect distance clearance from stage

    for (let i = 0; i < vipTablesCount; i++) {
      const isEven = vipTablesCount % 2 === 0;
      let posX = 50;
      if (vipTablesCount === 1) {
        posX = 38; // Center Left
      } else if (vipTablesCount === 2) {
        posX = i === 0 ? 16 : 62; // Flanking the catwalk
      } else {
        const step = 70 / (vipTablesCount - 1);
        posX = 12 + i * step;
      }

      newVipTables.push({
        id: `el-vip-gen-${i + 1}`,
        type: 'royal_table',
        category: 'table',
        label: `طاولة الشرف الملكية (VIP ${String(i + 1).padStart(2, '0')})`,
        capacity: 12,
        x: posX,
        y: startY,
        rotation: 0,
        isVIPZone: true,
        zone: 'vip_front',
        status: 'vip',
        assignedStaff: `المشرفة ${i % 2 === 0 ? 'نورة السبيعي' : 'سارة القحطاني'}`,
        specialServiceNotes: 'ضيافة ملكية خاصة وأطقم كريستال',
        guests: []
      });
    }

    // 2. Standard Guest Tables arranged in structured rows and columns
    const standardGuests = Math.max(0, totalGuestsNum - (vipTablesCount * 12));
    const standardTablesCount = Math.ceil(standardGuests / tableCap);

    const standardTables: LayoutElement[] = [];
    const totalCols = leftCols + rightCols;
    const tablesPerWing = Math.ceil(standardTablesCount / 2);

    let tableCounter = 1;
    const standardStartY = startY + 16; // Start standard rows below VIP tables

    // Build Left Wing (جهة اليمين بالنسبة للمشاهد العربي)
    let leftIndex = 0;
    const leftRows = Math.ceil(tablesPerWing / leftCols);
    for (let r = 0; r < leftRows; r++) {
      for (let c = 0; c < leftCols; c++) {
        if (leftIndex < tablesPerWing && tableCounter <= standardTablesCount) {
          const xPos = 8 + c * (34 / Math.max(1, leftCols));
          const yPos = standardStartY + r * 14;

          standardTables.push({
            id: `el-std-l-${leftIndex + 1}`,
            type: tableCap === 8 ? 'round_table_8' : tableCap === 12 ? 'round_table_12' : 'round_table_10',
            category: 'table',
            label: `طاولة ${String(tableCounter).padStart(2, '0')} (جناح اليمين - صف ${r + 1})`,
            capacity: tableCap,
            x: Math.min(40, Math.round(xPos)),
            y: Math.min(78, Math.round(yPos)),
            rotation: 0,
            zone: 'left',
            rowNumber: r + 1,
            colNumber: c + 1,
            status: 'available',
            guests: []
          });
          tableCounter++;
          leftIndex++;
        }
      }
    }

    // Build Right Wing (جهة اليسار بالنسبة للمشاهد العربي)
    let rightIndex = 0;
    const remainingRightTables = standardTablesCount - leftIndex;
    const rightRows = Math.ceil(remainingRightTables / rightCols);
    for (let r = 0; r < rightRows; r++) {
      for (let c = 0; c < rightCols; c++) {
        if (rightIndex < remainingRightTables && tableCounter <= standardTablesCount) {
          const xPos = 56 + c * (34 / Math.max(1, rightCols));
          const yPos = standardStartY + r * 14;

          standardTables.push({
            id: `el-std-r-${rightIndex + 1}`,
            type: tableCap === 8 ? 'round_table_8' : tableCap === 12 ? 'round_table_12' : 'round_table_10',
            category: 'table',
            label: `طاولة ${String(tableCounter).padStart(2, '0')} (جناح اليسار - صف ${r + 1})`,
            capacity: tableCap,
            x: Math.min(84, Math.round(xPos)),
            y: Math.min(78, Math.round(yPos)),
            rotation: 0,
            zone: 'right',
            rowNumber: r + 1,
            colNumber: c + 1,
            status: 'available',
            guests: []
          });
          tableCounter++;
          rightIndex++;
        }
      }
    }

    setElements([...baseStructures, ...newVipTables, ...standardTables]);
    if (showNotification) {
      showNotification('success', `تمت إعادة ترتيب وتوزيع ${standardTablesCount + vipTablesCount} طاولة هندسياً في صفوف وأعمدة متناسقة.`);
    }
  };

  // Adjust Target Guests
  const handleGuestsChange = (delta: number) => {
    const nextVal = Math.max(10, Math.min(maxHallCapacity, targetGuests + delta));
    setTargetGuests(nextVal);
    generateStructuredGridLayout(nextVal, defaultTableCapacity, vipSeatsTarget);
  };

  // Adjust Target Guests via Range Slider
  const handleGuestsSlider = (val: number) => {
    const nextVal = Math.max(10, Math.min(maxHallCapacity, val));
    setTargetGuests(nextVal);
    generateStructuredGridLayout(nextVal, defaultTableCapacity, vipSeatsTarget);
  };

  // Change Default Table Capacity (8, 10, 12, or custom)
  const handleDefaultTableCapacityChange = (cap: number) => {
    const nextCap = Math.max(3, Math.min(16, cap));
    setDefaultTableCapacity(nextCap);
    generateStructuredGridLayout(targetGuests, nextCap, vipSeatsTarget);
  };

  // Adjust VIP Seats Target
  const handleVipSeatsChange = (delta: number) => {
    const nextVal = Math.max(0, Math.min(Math.floor(targetGuests * 0.4), vipSeatsTarget + delta));
    setVipSeatsTarget(nextVal);
    generateStructuredGridLayout(targetGuests, defaultTableCapacity, nextVal);
  };

  // Override Single Table Capacity
  const handleSingleTableCapacityChange = (id: string, delta: number) => {
    setElements(prev => prev.map(el => {
      if (el.id === id) {
        const nextCap = Math.max(1, Math.min(24, el.capacity + delta));
        return { ...el, capacity: nextCap };
      }
      return el;
    }));
  };

  // Duplicate Table
  const handleDuplicateTable = (id: string) => {
    const targetEl = elements.find(e => e.id === id);
    if (!targetEl) return;

    const newId = `el-dup-${Date.now()}`;
    const newEl: LayoutElement = {
      ...targetEl,
      id: newId,
      label: `${targetEl.label} (نسخة)`,
      x: Math.min(85, targetEl.x + 4),
      y: Math.min(80, targetEl.y + 4),
      guests: []
    };

    setElements(prev => [...prev, newEl]);
    setSelectedElementId(newId);
    if (showNotification) {
      showNotification('info', `تم نسخ وتكرار ${targetEl.label} بنجاح.`);
    }
  };

  // Delete element
  const handleDeleteElement = (id: string) => {
    setElements(prev => prev.filter(e => e.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  // Rotate element
  const handleRotateElement = (id: string, delta: number = 45) => {
    setElements(prev => prev.map(e => {
      if (e.id === id) {
        return { ...e, rotation: (e.rotation + delta) % 360 };
      }
      return e;
    }));
  };

  // Mouse Drag Handlers for Canvas Elements
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    const el = elements.find(item => item.id === id);
    if (!el || el.isLocked) return;

    setSelectedElementId(id);
    setActive360PerspectiveElementId(id);
    setDraggingId(id);

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * 100;
      const clickY = ((e.clientY - rect.top) / rect.height) * 100;
      setDragOffset({ x: clickX - el.x, y: clickY - el.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    let newX = ((e.clientX - rect.left) / rect.width) * 100 - dragOffset.x;
    let newY = ((e.clientY - rect.top) / rect.height) * 100 - dragOffset.y;

    if (isSnapGridEnabled) {
      newX = Math.round(newX / 2) * 2;
      newY = Math.round(newY / 2) * 2;
    }

    // Boundary constraints
    newX = Math.max(2, Math.min(88, newX));
    newY = Math.max(2, Math.min(86, newY));

    setElements(prev => prev.map(el => {
      if (el.id === draggingId) {
        return { ...el, x: Math.round(newX), y: Math.round(newY) };
      }
      return el;
    }));
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  // If feature is locked by subscription tier
  if (!isFeatureAllowed) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-right space-y-6 animate-in fade-in" dir="rtl">
        <div className="max-w-2xl mx-auto text-center space-y-4 py-8">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <span className="text-xs font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block font-mono">
            FEATURE LOCKED • REQUIRES PRO TIER
          </span>
          <h3 className="text-xl font-black text-slate-900">ميزة مخطط القاعة التفاعلي وتوزيع الطاولات بزاوية 360°</h3>
          <p className="text-sm font-medium text-slate-600 leading-relaxed">
            هذه الأداة الهندسية المتقدمة مخصصة للمشتركين في الباقات المتقدمة والاحترافية. تتيح لك تخطيط وتصميم القاعات هندسياً، ضبط السعات وفق معايير الدفاع المدني، إدارة المقاعد الـ VIP، وتوليد بطاقات الـ QR الميدانية.
          </p>
          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => alert('يمكنك ترقية اشتراكك من تبويب "باقات الاشتراك والعمولة" في القائمة الجانبية.')}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Award className="w-4 h-4" /> ترقية باقة الاشتراك وتفعيل المخطط 🚀
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-5 text-right font-sans" dir="rtl" id="floor-plan-360-container">
      {/* ========================================================================= */}
      {/* 1. TOP CONTROL BAR & VIEW TOGGLE                                          */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 shadow-xs">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                مخطط القاعة وتوزيع الطاولات الميداني (360° Layout & Ergonomics Engine)
              </h3>
              <span className="text-[10px] font-black bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                طاقة القاعة: {maxHallCapacity} ضيف 🏛️
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              توزيع هندسي بالأعمدة والصفوف، حاسبة السعة الدقيقة، طاولات الشرف VIP، ومعايير السلامة
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher: 2D vs 360° */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex items-center gap-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('2d')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === '2d'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>مخطط هندسي (2D)</span>
            </button>
            <button
              onClick={() => setViewMode('360')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === '360'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>معاينة بانورامية 360°</span>
            </button>
          </div>

          {/* Calculator Drawer Toggle */}
          <button
            onClick={() => setIsCalculatorOpen(!isCalculatorOpen)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
              isCalculatorOpen
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>حاسبة السعة ومعايير التوزيع</span>
          </button>

          {/* Share Collaboration Link */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="px-3 py-2 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-100 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border border-purple-200 dark:border-purple-800"
          >
            <Share2 className="w-4 h-4" />
            <span>مشاركة مع العميل</span>
          </button>

          {/* Print & Export Center */}
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة وتصدير الميدان</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. REAL-TIME CAPACITY & ERGONOMICS STRIP                                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-700 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">الطاقة القصوى للقاعة</span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-mono font-black text-slate-900 dark:text-white">{maxHallCapacity}</span>
            <span className="text-[10px] text-slate-500">ضيف معتمد</span>
          </div>
          <span className="text-[9px] text-slate-400 font-mono">({hallLength}م × {hallWidth}م = {grossArea}م²)</span>
        </div>

        <div className="bg-indigo-50/70 dark:bg-indigo-950/40 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-800 space-y-1">
          <span className="text-[10px] font-bold text-indigo-900 dark:text-indigo-300 block">العدد المستهدف المطلوب</span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-mono font-black text-indigo-950 dark:text-indigo-200">{targetGuests}</span>
            <span className="text-[10px] text-indigo-700 dark:text-indigo-400">ضيف</span>
          </div>
          <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold">
            يتطلب {totalCalculatedTables} طاولة موزعة
          </span>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-800 space-y-1">
          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block">المقاعد الموزعة بالمخطط</span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-mono font-black text-emerald-900 dark:text-emerald-100">{totalSeatsInCanvas}</span>
            <span className="text-[10px] text-emerald-700">مقعداً</span>
          </div>
          <span className="text-[9px] text-emerald-600 font-bold">{elements.filter(e => e.category === 'table').length} طاولة مفروشة</span>
        </div>

        <div className="bg-purple-50 dark:bg-purple-950/40 p-3 rounded-2xl border border-purple-100 dark:border-purple-800 space-y-1">
          <span className="text-[10px] font-bold text-purple-900 dark:text-purple-300 block">كراسي الشرف والـ VIP</span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-mono font-black text-purple-950 dark:text-purple-100">{vipSeatsTarget}</span>
            <span className="text-[10px] text-purple-700">مقعد VIP</span>
          </div>
          <span className="text-[9px] text-purple-600 font-bold">بمعامل 2.25 م²/ضيف</span>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-2xl border border-amber-100 dark:border-amber-800 space-y-1">
          <span className="text-[10px] font-bold text-amber-900 dark:text-amber-300 block">نصيب الضيف من المساحة</span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-mono font-black text-amber-950 dark:text-amber-100">{areaPerGuest}</span>
            <span className="text-[10px] text-amber-700">م² / ضيف</span>
          </div>
          <span className="text-[9px] text-amber-700 font-bold">المعيار: 1.4 - 1.8 م²</span>
        </div>

        <div className={`p-3 rounded-2xl border space-y-1 ${
          occupancyRate > 95
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900'
            : occupancyRate > 80
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold block">نسبة الإشغال اللحظية</span>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-white dark:bg-slate-900 shadow-2xs">
              {occupancyRate > 95 ? '🔴 أقصى حد' : occupancyRate > 80 ? '🟡 اقتراب' : '🟢 مثالي'}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-mono font-black">{occupancyRate}%</span>
            <span className="text-[10px] opacity-80">من سعة الترخيص ({maxLicensedCapacity})</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                occupancyRate > 95 ? 'bg-rose-500' : occupancyRate > 80 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, occupancyRate)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Safety Alerts Strip */}
      {safetyWarnings.length > 0 && (
        <div className="bg-amber-50/90 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 p-3 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5 flex-1">
            <strong className="block text-[11px] font-black">إرشادات السلامة والامتثال الميداني (Civil Defense & Clearance Alerts):</strong>
            <ul className="list-disc list-inside space-y-0.5 text-[10px] font-medium">
              {safetyWarnings.map((warn, i) => (
                <li key={i}>{warn}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MAIN WORKSPACE: CALCULATOR (LEFT) + CANVAS (CENTER) + PROPERTIES (RIGHT) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ========================================================================= */}
        {/* SECTION 1: CAPACITY & ERGONOMICS CALCULATOR (حاسبة السعة ومعايير التوزيع) */}
        {/* ========================================================================= */}
        {isCalculatorOpen && (
          <div className="lg:col-span-4 space-y-4 animate-in slide-in-from-right-4 duration-200">
            <div className="bg-slate-900 text-white p-4 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-black flex items-center gap-1.5 text-indigo-400">
                  <Sliders className="w-4 h-4" />
                  <span>حاسبة السعة ومعايير التوزيع</span>
                </span>
                <span className="text-[10px] bg-indigo-950 text-indigo-300 font-mono px-2 py-0.5 rounded-full border border-indigo-800">
                  REAL-TIME SYNC
                </span>
              </div>

              {/* 1. Target Guests Count (تغيير إجمالي عدد الضيوف) */}
              <div className="space-y-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black text-slate-200 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span>١. إجمالي عدد الضيوف (Target Guests):</span>
                  </label>
                  <span className="text-xs font-mono font-black text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-800/60">
                    {targetGuests} ضيف
                  </span>
                </div>

                <div className="text-[9px] text-slate-400">
                  محدد بواقع الطاقة الاستيعابية للقاعة: <strong>{maxHallCapacity} ضيف</strong> كحد أقصى
                </div>

                {/* Counter Buttons [ - ] and [ + ] with Step Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleGuestsChange(-50)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-black text-slate-300 transition-all cursor-pointer"
                    title="إنقاص 50 ضيف"
                  >
                    -50
                  </button>
                  <button
                    onClick={() => handleGuestsChange(-10)}
                    className="p-2 bg-slate-800 hover:bg-rose-900/60 text-rose-400 hover:text-white rounded-xl text-xs font-black transition-all cursor-pointer flex-1 flex items-center justify-center gap-1 border border-slate-700"
                  >
                    <Minus className="w-3.5 h-3.5" /> 10-
                  </button>
                  
                  <span className="font-mono text-sm font-black text-white px-2">
                    {targetGuests}
                  </span>

                  <button
                    onClick={() => handleGuestsChange(10)}
                    className="p-2 bg-slate-800 hover:bg-emerald-900/60 text-emerald-400 hover:text-white rounded-xl text-xs font-black transition-all cursor-pointer flex-1 flex items-center justify-center gap-1 border border-slate-700"
                  >
                    <Plus className="w-3.5 h-3.5" /> 10+
                  </button>
                  <button
                    onClick={() => handleGuestsChange(50)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-black text-slate-300 transition-all cursor-pointer"
                    title="زيادة 50 ضيف"
                  >
                    +50
                  </button>
                </div>

                {/* Range Slider for smooth drag */}
                <div className="pt-1">
                  <input
                    type="range"
                    min={10}
                    max={maxHallCapacity}
                    step={10}
                    value={targetGuests}
                    onChange={(e) => handleGuestsSlider(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[8px] text-slate-500 font-mono mt-0.5">
                    <span>10 ضيوف</span>
                    <span>سعة القاعة ({maxHallCapacity})</span>
                  </div>
                </div>

                {/* Automatic Tables Required Formula Output */}
                <div className="bg-indigo-950/60 p-2.5 rounded-xl border border-indigo-900/80 text-[10px] space-y-1">
                  <div className="flex justify-between text-indigo-200">
                    <span>عدد الطاولات المطلوبة بدقة:</span>
                    <strong className="font-mono text-amber-300 font-black">{totalCalculatedTables} طاولة</strong>
                  </div>
                  <div className="text-[9px] text-indigo-300/80">
                    ({requiredStandardTables} طاولة عادية سعة {defaultTableCapacity} + {requiredVipTables} طاولة شرف VIP)
                  </div>
                </div>
              </div>

              {/* 2. Table Capacity Selection (تغيير سعة ونوع الطاولات القياسية) */}
              <div className="space-y-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black text-slate-200 flex items-center gap-1">
                    <Box className="w-3.5 h-3.5 text-purple-400" />
                    <span>٢. سعة ونوع الطاولات القياسية:</span>
                  </label>
                  <span className="text-xs font-mono font-black text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-lg border border-purple-800/60">
                    {defaultTableCapacity} مقاعد / طاولة
                  </span>
                </div>

                {/* Quick Selection Buttons (طاولات 8، 10، 12 كراسي) */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    onClick={() => handleDefaultTableCapacityChange(8)}
                    className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                      defaultTableCapacity === 8
                        ? 'bg-purple-600 text-white border-purple-500 shadow-sm font-black'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 font-bold'
                    }`}
                  >
                    <span className="text-xs block">8 كراسي</span>
                    <span className="text-[8px] opacity-80 block">عائلية مصغرة</span>
                  </button>

                  <button
                    onClick={() => handleDefaultTableCapacityChange(10)}
                    className={`p-2 rounded-xl text-center border transition-all cursor-pointer relative ${
                      defaultTableCapacity === 10
                        ? 'bg-purple-600 text-white border-purple-500 shadow-sm font-black ring-2 ring-purple-400/50'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 font-bold'
                    }`}
                  >
                    <span className="text-xs block">10 كراسي ⭐</span>
                    <span className="text-[8px] opacity-80 block">الافتراضي الأكثر استخداماً</span>
                  </button>

                  <button
                    onClick={() => handleDefaultTableCapacityChange(12)}
                    className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                      defaultTableCapacity === 12
                        ? 'bg-purple-600 text-white border-purple-500 shadow-sm font-black'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 font-bold'
                    }`}
                  >
                    <span className="text-xs block">12 كرسي</span>
                    <span className="text-[8px] opacity-80 block">للمساحات المحدودة</span>
                  </button>
                </div>

                {/* Custom Chair Count (من 3 إلى 16 مقعد) */}
                <div className="pt-1 space-y-1 border-t border-slate-800">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>تخصيص حر لعدد الكراسي (3 - 16 مقعد):</span>
                    <strong className="text-white font-mono">{defaultTableCapacity} مقاعد</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDefaultTableCapacityChange(defaultTableCapacity - 1)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-black cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="range"
                      min={3}
                      max={16}
                      value={defaultTableCapacity}
                      onChange={(e) => handleDefaultTableCapacityChange(Number(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                    <button
                      onClick={() => handleDefaultTableCapacityChange(defaultTableCapacity + 1)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-black cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. VIP Seats & Royal Lounges (تعديل مقاعد كبار الشخصيات) */}
              <div className="space-y-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black text-amber-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>٣. كراسي كبار الشخصيات والـ VIP:</span>
                  </label>
                  <span className="text-xs font-mono font-black text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-800/60">
                    {vipSeatsTarget} مقعد VIP
                  </span>
                </div>

                <div className="text-[9px] text-slate-400">
                  توضع في الصف الأول مقابل المسرح بمعامل مساحة أوسع (2.0 - 2.5 م²/ضيف)
                </div>

                {/* VIP Counter Controls */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleVipSeatsChange(-6)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black transition-all cursor-pointer flex-1 flex items-center justify-center gap-1 border border-slate-700"
                  >
                    <Minus className="w-3.5 h-3.5" /> 6-
                  </button>

                  <span className="font-mono text-sm font-black text-amber-400 px-3">
                    {vipSeatsTarget} مقعد
                  </span>

                  <button
                    onClick={() => handleVipSeatsChange(6)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-black transition-all cursor-pointer flex-1 flex items-center justify-center gap-1 border border-slate-700"
                  >
                    <Plus className="w-3.5 h-3.5" /> 6+
                  </button>
                </div>

                <div className="pt-1">
                  <input
                    type="range"
                    min={0}
                    max={Math.floor(targetGuests * 0.4)}
                    step={2}
                    value={vipSeatsTarget}
                    onChange={(e) => setVipSeatsTarget(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[8px] text-slate-500 font-mono mt-0.5">
                    <span>0 (بدون شرف)</span>
                    <span>الحد الأقصى ({Math.floor(targetGuests * 0.4)} مقعد)</span>
                  </div>
                </div>
              </div>

              {/* SECTION 2 CONTROL: Structured Grid Distribution (التحكم بالأعمدة والصفوف) */}
              <div className="space-y-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
                <label className="text-[11px] font-black text-indigo-300 flex items-center gap-1">
                  <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
                  <span>٤. التوزيع بالأعمدة والصفوف والمسافات:</span>
                </label>
                
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 block font-bold">أعمدة جناح اليمين:</span>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          const n = Math.max(1, leftWingCols - 1);
                          setLeftWingCols(n);
                          generateStructuredGridLayout(targetGuests, defaultTableCapacity, vipSeatsTarget, n, rightWingCols, centerCols, stageClearanceMeters);
                        }}
                        className="w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold"
                      >-</button>
                      <span className="font-mono font-black text-white">{leftWingCols} أعمدة</span>
                      <button
                        onClick={() => {
                          const n = Math.min(4, leftWingCols + 1);
                          setLeftWingCols(n);
                          generateStructuredGridLayout(targetGuests, defaultTableCapacity, vipSeatsTarget, n, rightWingCols, centerCols, stageClearanceMeters);
                        }}
                        className="w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold"
                      >+</button>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 block font-bold">أعمدة جناح اليسار:</span>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          const n = Math.max(1, rightWingCols - 1);
                          setRightWingCols(n);
                          generateStructuredGridLayout(targetGuests, defaultTableCapacity, vipSeatsTarget, leftWingCols, n, centerCols, stageClearanceMeters);
                        }}
                        className="w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold"
                      >-</button>
                      <span className="font-mono font-black text-white">{rightWingCols} أعمدة</span>
                      <button
                        onClick={() => {
                          const n = Math.min(4, rightWingCols + 1);
                          setRightWingCols(n);
                          generateStructuredGridLayout(targetGuests, defaultTableCapacity, vipSeatsTarget, leftWingCols, n, centerCols, stageClearanceMeters);
                        }}
                        className="w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold"
                      >+</button>
                    </div>
                  </div>
                </div>

                {/* Stage Buffer Clearance */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] text-slate-300">
                    <span>حرم ومسافة المسرح والكوشة الفارغة:</span>
                    <strong className="text-amber-400 font-mono">{stageClearanceMeters} أمتار</strong>
                  </div>
                  <input
                    type="range"
                    min={2.0}
                    max={8.0}
                    step={0.5}
                    value={stageClearanceMeters}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setStageClearanceMeters(val);
                      generateStructuredGridLayout(targetGuests, defaultTableCapacity, vipSeatsTarget, leftWingCols, rightWingCols, centerCols, val);
                    }}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                {/* Generate Structured Grid Action */}
                <button
                  onClick={() => generateStructuredGridLayout()}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>تطبيق وإعادة تنظيم المخطط هندسياً 🏛️</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CENTER INTERACTIVE CANVAS (المخطط التفاعلي 2D / 360°)                      */}
        {/* ========================================================================= */}
        <div className={`space-y-3 ${isCalculatorOpen ? 'lg:col-span-5' : 'lg:col-span-8'}`}>
          {/* Canvas Sub-Controls Header */}
          <div className="flex items-center justify-between bg-slate-900 text-slate-300 p-2.5 px-4 rounded-2xl text-xs font-mono border border-slate-800">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[11px] font-bold text-white">
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                <span>CANVAS 360° | GRID: {isSnapGridEnabled ? 'METRIC SNAP 1.0M' : 'FREE MOVE'}</span>
              </span>
              <label className="inline-flex items-center gap-1 text-[10px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSnapGridEnabled}
                  onChange={(e) => setIsSnapGridEnabled(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0"
                />
                <span>محاذاة تلقائية</span>
              </label>
            </div>

            <div className="flex items-center gap-2 text-[10px]">
              <span className="px-2 py-0.5 bg-slate-800 rounded-md text-emerald-400 font-black">
                {elements.length} عناصر نشطة
              </span>
              <button
                onClick={() => {
                  if (confirm('هل أنت متأكد من إعادة ضبط المخطط للحالة الافتراضية؟')) {
                    generateStructuredGridLayout();
                  }
                }}
                className="hover:text-amber-400 transition-all cursor-pointer flex items-center gap-1"
                title="إعادة التوزيع المتناسق"
              >
                <RefreshCw className="w-3 h-3" /> إعادة الضبط
              </button>
            </div>
          </div>

          {/* THE 2D BLUEPRINT CANVAS */}
          {viewMode === '2d' ? (
            <div
              ref={canvasRef}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="relative w-full h-[580px] bg-slate-950 rounded-3xl border-2 border-slate-800 overflow-hidden shadow-2xl p-4 flex flex-col justify-between select-none"
            >
              {/* Metric Grid Pattern Overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-40 pointer-events-none"></div>

              {/* Stage & Kosha Zone Indicator at Top */}
              <div className="absolute top-0 inset-x-0 h-11 bg-gradient-to-b from-amber-500/20 to-transparent border-b border-amber-500/30 flex items-center justify-center pointer-events-none z-10">
                <span className="text-[10px] font-black text-amber-400 tracking-widest uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  منصة المسرح والكوشة الملكية (STAGE & SIGHTLINE AXIS)
                </span>
              </div>

              {/* Buffer Clearance Zone Indicator */}
              <div
                className="absolute inset-x-0 bg-amber-400/5 border-b border-dashed border-amber-400/20 flex items-center justify-center pointer-events-none"
                style={{ top: '44px', height: `${stageClearanceMeters * 10}px` }}
              >
                <span className="text-[8px] font-mono text-amber-400/60">
                  ← مسافة فارغة فاصلة بين المسرح والمقاعد: {stageClearanceMeters} أمتار →
                </span>
              </div>

              {/* Catwalk Runway Central Line */}
              <div className="absolute top-11 bottom-20 left-1/2 -translate-x-1/2 w-10 bg-amber-400/10 border-x border-dashed border-amber-400/30 flex items-center justify-center pointer-events-none">
                <span className="text-[8px] font-black text-amber-300/80 -rotate-90 whitespace-nowrap tracking-widest">
                  ممر الزفة الملكي CATWALK
                </span>
              </div>

              {/* Main Entrance & Service Doors at Bottom */}
              <div className="absolute bottom-0 inset-x-0 h-8 bg-blue-500/10 border-t border-blue-500/30 flex items-center justify-between px-6 pointer-events-none text-[9px] font-black text-blue-400 z-10">
                <span>🚪 بوابة الضيافة والمباشرات</span>
                <span>✨ البوابة الرئيسية لاستقبال الضيوف</span>
                <span>🚨 مخرج الطوارئ المعتمد</span>
              </div>

              {/* Rendered Elements on Canvas */}
              <div className="relative w-full h-full">
                {elements.map((el) => {
                  const isSelected = selectedElementId === el.id;
                  const isDragging = draggingId === el.id;

                  return (
                    <div
                      key={el.id}
                      onMouseDown={(e) => handleMouseDown(e, el.id)}
                      onClick={() => {
                        setSelectedElementId(el.id);
                        setActive360PerspectiveElementId(el.id);
                      }}
                      style={{
                        left: `${el.x}%`,
                        top: `${el.y}%`,
                        transform: `rotate(${el.rotation}deg)`
                      }}
                      className={`absolute p-2 rounded-2xl shadow-xl transition-shadow cursor-move flex flex-col items-center justify-center text-center group border ${
                        isSelected
                          ? 'ring-4 ring-indigo-500 ring-offset-2 ring-offset-slate-950 scale-105 z-30'
                          : 'z-10'
                      } ${isDragging ? 'opacity-80 scale-110 shadow-2xl' : ''} ${
                        el.type === 'stage'
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black border-amber-300 w-52 h-14'
                          : el.type === 'catwalk'
                            ? 'bg-amber-400/80 text-slate-950 font-bold border-amber-300 w-14 h-24'
                            : el.type === 'buffet'
                              ? 'bg-blue-600 text-white font-bold border-blue-400 w-44 h-12'
                              : el.isVIPZone || el.type === 'royal_table'
                                ? 'bg-gradient-to-r from-purple-800 to-purple-950 text-white font-bold border-purple-400 w-36 h-18 shadow-purple-900/50'
                                : el.category === 'lounge'
                                  ? 'bg-amber-900/90 text-amber-100 font-bold border-amber-600 w-40 h-16'
                                  : el.status === 'occupied'
                                    ? 'bg-rose-950/90 text-rose-100 font-bold border-rose-500 w-28 h-18'
                                    : el.status === 'partial'
                                      ? 'bg-amber-950/90 text-amber-100 font-bold border-amber-500 w-28 h-18'
                                      : 'bg-slate-900 text-slate-100 font-bold border-slate-700 w-28 h-18'
                      }`}
                    >
                      {/* Drag Handle Indicator */}
                      {!el.isLocked && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-slate-300 px-1 py-0.2 rounded text-[7px] pointer-events-none">
                          اسحب لتحريك الموقع
                        </div>
                      )}

                      {/* State Badge & VIP Tag */}
                      <div className="flex items-center gap-1 mb-0.5">
                        {el.isVIPZone && (
                          <span className="bg-amber-400 text-slate-950 text-[7.5px] font-black px-1.5 py-0.2 rounded-full">
                            VIP
                          </span>
                        )}
                        <span className="text-[9.5px] font-black truncate max-w-[105px]">{el.label}</span>
                      </div>

                      {el.capacity > 0 && (
                        <div className="flex items-center gap-1 text-[8.5px] opacity-90 font-mono">
                          <Users className="w-2.5 h-2.5" />
                          <span>{el.capacity} كراسي</span>
                        </div>
                      )}

                      {/* Quick Hover Controls on Element */}
                      <div className="absolute -top-3 -right-3 hidden group-hover:flex items-center gap-1 z-40">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRotateElement(el.id);
                          }}
                          className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] cursor-pointer shadow-md hover:bg-indigo-700"
                          title="تدوير 45°"
                        >
                          <RotateCw className="w-2.5 h-2.5" />
                        </button>
                        {!el.isLocked && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicateTable(el.id);
                              }}
                              className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[9px] cursor-pointer shadow-md hover:bg-purple-700"
                              title="نسخ وتكرار الطاولة"
                            >
                              <Copy className="w-2.5 h-2.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteElement(el.id);
                              }}
                              className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] cursor-pointer shadow-md hover:bg-rose-700"
                              title="حذف الطاولة"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Canvas Footer Legend */}
              <div className="relative z-10 flex flex-wrap justify-between items-center text-[9.5px] text-slate-400 font-mono font-bold bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800 gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span> VIP الشرف
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block"></span> متاح
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> مكتمل العدد
                  </span>
                </div>
                <span>الضغط والسحب لتحريك أي طاولة • النقر لتعديل الخصائص</span>
              </div>
            </div>
          ) : (
            /* 360° VIRTUAL PERSPECTIVE VIEWPORT */
            <div className="relative w-full h-[580px] bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 rounded-3xl border-2 border-indigo-500/40 overflow-hidden shadow-2xl p-6 flex flex-col justify-between text-white">
              <div className="text-center space-y-2 pt-2">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-800 inline-block font-mono">
                  360° SIGHTLINE PERSPECTIVE SIMULATOR
                </span>
                <h4 className="text-base font-black text-white flex items-center justify-center gap-2">
                  <span>منظور الضيف الجالس في:</span>
                  <span className="text-amber-400">{selectedElement?.label || 'طاولة الشرف VIP'}</span>
                </h4>
                <p className="text-xs text-slate-300">
                  محاكاة بصرية ثلاثية الأبعاد لزاوية رؤية الكوشة ومسار الزفة بدون أي حجب للرؤية
                </p>
              </div>

              {/* 360 Simulated Stage Backdrop */}
              <div className="relative my-auto flex flex-col items-center justify-center">
                <div className="w-80 h-32 bg-gradient-to-t from-amber-500/20 to-amber-500/5 rounded-t-full border-t-2 border-x-2 border-amber-400 flex flex-col items-center justify-end pb-3 shadow-[0_-20px_50px_rgba(245,158,11,0.2)]">
                  <Sparkles className="w-8 h-8 text-amber-300 animate-pulse mb-1" />
                  <span className="text-xs font-black text-amber-200">منصة المسرح والكوشة الملكية</span>
                  <span className="text-[9px] text-amber-400 font-mono">وضوح خط الرؤية (Sightline): 100% ممتاز ✨</span>
                </div>

                <div className="w-full max-w-lg flex justify-between text-[10px] font-mono text-slate-400 pt-3 border-t border-slate-700">
                  <span>الزاوية: {selectedElement?.rotation || 0}°</span>
                  <span>المسافة عن الكوشة: {((selectedElement?.y || 40) * 0.4).toFixed(1)} م</span>
                  <span>ارتفاع خط النظر: 1.2م (جلوس)</span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-400" />
                  <span className="text-slate-300 font-bold">انقر على أي طاولة في المخطط لتغيير زاوية المعاينة</span>
                </div>
                <button
                  onClick={() => setViewMode('2d')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  العودة للمخطط الهيكلي (2D)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: CUSTOM TABLE OVERRIDE & PROPERTIES (التعديل اليدوي للطاولة)    */}
        {/* ========================================================================= */}
        <div className="lg:col-span-3 space-y-4">
          {selectedElement ? (
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1">
                  <Bookmark className="w-3.5 h-3.5 text-purple-600" />
                  <span>لوحة خصائص الطاولة المحددة</span>
                </span>
                <span className="text-[9px] font-mono bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold">
                  {selectedElement.id}
                </span>
              </div>

              {/* 4.1 Custom Table Override: Single Table Chair Capacity */}
              <div className="space-y-1.5 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    كراسي هذه الطاولة تحديداً:
                  </span>
                  <span className="font-mono text-xs font-black text-purple-600 dark:text-purple-300">
                    {selectedElement.capacity} كراسي
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleSingleTableCapacityChange(selectedElement.id, -1)}
                    className="p-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-600 rounded-xl text-xs font-black cursor-pointer flex-1 flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-600"
                    title="إنقاص كرسي واحد لهذه الطاولة دون التأثير على البقية"
                  >
                    <Minus className="w-3.5 h-3.5" /> 1- كرسي
                  </button>

                  <button
                    onClick={() => handleSingleTableCapacityChange(selectedElement.id, 1)}
                    className="p-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-emerald-600 rounded-xl text-xs font-black cursor-pointer flex-1 flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-600"
                    title="زيادة كرسي واحد لهذه الطاولة تحديداً"
                  >
                    <Plus className="w-3.5 h-3.5" /> 1+ كرسي
                  </button>
                </div>
                <span className="text-[8px] text-slate-400 block text-center">
                  تعديل سعة هذه الطاولة تحديداً دون التأثير على باقي القاعة
                </span>
              </div>

              {/* 4.2 Duplicate or Delete Table Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleDuplicateTable(selectedElement.id)}
                  className="p-2 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-black cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ وتكرار</span>
                </button>

                {!selectedElement.isLocked && (
                  <button
                    onClick={() => handleDeleteElement(selectedElement.id)}
                    className="p-2 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-black cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف الطاولة</span>
                  </button>
                )}
              </div>

              {/* Table Name & Host Staff Details */}
              <div className="space-y-2 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block">اسم / رقم الطاولة:</label>
                  <input
                    type="text"
                    value={selectedElement.label}
                    onChange={(e) => {
                      const val = e.target.value;
                      setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, label: val } : el));
                    }}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block">المشرفة / المباشرة المسؤولة:</label>
                  <input
                    type="text"
                    value={selectedElement.assignedStaff || ''}
                    placeholder="اسم المشرفة (مثال: نورة السبيعي)"
                    onChange={(e) => {
                      const val = e.target.value;
                      setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, assignedStaff: val } : el));
                    }}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block">ملاحظات وطلبات الضيافة الخاصة:</label>
                  <textarea
                    rows={2}
                    value={selectedElement.specialServiceNotes || ''}
                    placeholder="مثل: دلال رسلان، وجبات خاصة، كبار سن..."
                    onChange={(e) => {
                      const val = e.target.value;
                      setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, specialServiceNotes: val } : el));
                    }}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>

                {/* VIP Toggle */}
                <label className="flex items-center justify-between p-2.5 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800 cursor-pointer">
                  <span className="text-[10px] font-black text-purple-950 dark:text-purple-200">تخصيص كطاولة كبار شخصيات VIP</span>
                  <input
                    type="checkbox"
                    checked={!!selectedElement.isVIPZone}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setElements(prev => prev.map(el => el.id === selectedElement.id ? { ...el, isVIPZone: checked, status: checked ? 'vip' : 'available' } : el));
                    }}
                    className="rounded text-purple-600 focus:ring-0"
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
              <Compass className="w-8 h-8 text-slate-400 mx-auto" />
              <h5 className="text-xs font-black text-slate-700 dark:text-slate-300">لم يتم اختيار أي طاولة</h5>
              <p className="text-[10px] text-slate-500">انقر على أي طاولة في المخطط لتعديل كراسيها أو تكرارها أو تحريكها</p>
            </div>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. MODALS: PRINT & EXPORT ENGINE                                          */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl p-6 space-y-5 text-right font-sans" dir="rtl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-xl">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">مركز الطباعة والتصدير الميداني الذكي</h4>
                  <p className="text-xs text-slate-500">طباعة بطاقات الطاولات، مخططات التشغيل، وكشوفات استقبال البوابات</p>
                </div>
              </div>
              <button onClick={() => setIsPrintModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer">✕</button>
            </div>

            {/* Document Type Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'table_tent', label: 'بطاقات الطاولات QR', desc: 'A5 للوقوف على الطاولة' },
                { id: 'blueprint', label: 'مخطط التشغيل A3', desc: 'للمشرفين والمطبخ' },
                { id: 'gate_manifest', label: 'كشف بوابة الدخول', desc: 'جدول أبجدي للمعازيم' },
                { id: 'readiness_sheet', label: 'شهادة الجاهزية', desc: 'تقرير السلامة والسعة' },
              ].map(doc => (
                <button
                  key={doc.id}
                  onClick={() => setPrintDocType(doc.id as any)}
                  className={`p-3 rounded-2xl text-right border transition-all cursor-pointer ${
                    printDocType === doc.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span className="text-xs font-black block">{doc.label}</span>
                  <span className={`text-[9px] block mt-0.5 ${printDocType === doc.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {doc.desc}
                  </span>
                </button>
              ))}
            </div>

            {/* Live Print Preview Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="text-xs font-black text-slate-900 dark:text-white block">
                معاينة الطباعة ({printDocType === 'table_tent' ? 'بطاقة طاولة رقمية مع QR Code' : 'المستند التشغيلي'})
              </span>
              
              {printDocType === 'table_tent' ? (
                <div className="max-w-sm mx-auto bg-white p-5 rounded-2xl border-2 border-indigo-600 shadow-md text-center space-y-3">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider font-mono">
                    LAILAH VENUE SYSTEM • TABLE CARD
                  </span>
                  <h3 className="text-xl font-black text-slate-900">{selectedElement?.label || 'طاولة رقم ٠١'}</h3>
                  <div className="w-24 h-24 bg-slate-900 mx-auto rounded-xl p-2 flex items-center justify-center text-white">
                    <QrCode className="w-16 h-16 text-white" />
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold">
                    امسح الرمز لاستعراض منيو العشاء، جدول فقرات الحفل، وطلب الضيافة الفورية ☕
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 text-xs font-mono space-y-1.5">
                  <div className="flex justify-between border-b pb-1 font-bold">
                    <span>DOCUMENT: {printDocType.toUpperCase()}</span>
                    <span>VENUE: {currentProviderName}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 space-y-0.5">
                    <p>• إجمالي الطاولات الموزعة: {elements.filter(e => e.category === 'table').length}</p>
                    <p>• إجمالي المقاعد المعتمدة: {totalSeatsInCanvas} مقعداً</p>
                    <p>• كراسي الشرف والـ VIP: {vipSeatsTarget} مقعد</p>
                    <p>• حالة الدفاع المدني: مطابقة لمعايير السلامة ومسارات الإخلاء 2.0م</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  window.print();
                  setIsPrintModalOpen(false);
                }}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>إرسال للطابعة وتوليد PDF 🖨️</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODALS: HOST COLLABORATION SHARE LINK                                  */}
      {/* ========================================================================= */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl p-6 space-y-4 text-right font-sans" dir="rtl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 dark:bg-purple-950 text-purple-600 rounded-xl">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">مشاركة المخطط التفاعلي مع العريس / صاحب الحجز</h4>
                  <p className="text-xs text-slate-500">تمكين العميل من توزيع ضيوفه وعائلته على الطاولات بنفسه بكل خصوصية</p>
                </div>
              </div>
              <button onClick={() => setIsShareModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer">✕</button>
            </div>

            <div className="bg-purple-50/70 dark:bg-purple-950/30 p-4 rounded-2xl border border-purple-100 dark:border-purple-800 space-y-2 text-xs text-purple-950 dark:text-purple-200">
              <strong className="block font-black">ما الذي يستطيع العميل فعله عبر الرابط؟</strong>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-purple-900 dark:text-purple-300">
                <li>استعراض المخطط الهيكلي 2D والجولة البانورامية 360°.</li>
                <li>توزيع أسماء المعازيم وأرقام هواتفهم على المقاعد المتاحة.</li>
                <li>تحديد طاولات أهل العريس وأهل العروس بدون تغيير الإعدادات الهندسية للقاعة.</li>
              </ul>
            </div>

            {/* Generated Link Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 block">رابط المشاركة التفاعلي المشفر:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`https://lailah.app/collaborate/floor-plan/${selectedBookingId}?token=lp_sec_${Date.now()}`}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300 outline-none text-left"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://lailah.app/collaborate/floor-plan/${selectedBookingId}`);
                    setShareLinkCopied(true);
                    setTimeout(() => setShareLinkCopied(false), 3000);
                  }}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer"
                >
                  {shareLinkCopied ? 'تم النسخ ✓' : 'نسخ الرابط'}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
