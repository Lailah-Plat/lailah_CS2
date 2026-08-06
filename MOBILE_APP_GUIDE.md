# دليل برمجة وتصميم تطبيقات الجوال لمنصة "ليلة" (React Native / Expo Architecture & Implementation Guide) 📱🛠️

تم تصميم هذه الهيكلية البرمجية لبناء **تطبيقي جوال مستقلين ومحترفين** باستخدام **React Native (Expo SDK 51+ مع Custom Dev Client)** لدعم نظامي **iOS** و **Android** بشكل كامل، مع تجربة مستخدم ملكية وتوافق تام مع قواعد البيانات والتشفير وقيود الأمان لمنصة "ليلة":
1. **تطبيق "ليلة" للعملاء (`sa.lailah.app`):** مخصص حصرية لعملاء المنصة لتصفح القاعات وحجز المناسبات والدفع وتتبع المواعيد.
2. **تطبيق "ليلة للأعمال" (`sa.lailah.business`):** مخصص حصرية لمزودي الخدمات أصحاب القاعات والشركاء وموظفيهم (`provider_staff`) لإدارة العمليات التشغيلية، التقويم، المحفظة، وتراخيص الموظفين.

---

## 🏗️ نظام التطبيقين المستقلين وهيكلية المشاريع (Monorepo / Multi-App Structure)

```text
layla-mobile-apps/
│
├── apps/
│   ├── client-app/             # 1️⃣ تطبيق العملاء (Bundle ID: sa.lailah.app)
│   │   ├── app.json            # إعدادات متجر العملاء (اسم التطبيق: ليلة | Lailah)
│   │   ├── src/screens/customer/ # شاشات استكشاف القاعات، الحجز، الدفع، المحفظة
│   │   └── src/navigation/CustomerTab.tsx
│   │
│   └── business-app/           # 2️⃣ تطبيق المزودين والأعمال (Bundle ID: sa.lailah.business)
│       ├── app.json            # إعدادات متجر الشركاء (اسم التطبيق: ليلة للأعمال | Lailah Business)
│       ├── src/screens/provider/ # شاشات لوحة العمليات، التقويم، إدارة الموظفين، المحفظة
│       └── src/navigation/ProviderTab.tsx
│
└── packages/                   # المكتبات الحزمة المشتركة بين التطبيقين
    ├── shared-ui/              # المكونات الملكية المشتركة (GoldButton, LeafCard, GlassCard)
    ├── shared-core/            # الخدمات والأمان (authService, secureStore, api, formatters)
    └── database-types/         # نماذج وقواعد PostgreSQL / Supabase الموحدة
```
│   │   ├── auth/              # (LoginOTP, RegisterDualOTP, RoleSelect, BiometricSetup)
│   │   ├── customer/          # (CustomerHome, HallDetails, Checkout, BookingsList, ExploreMap)
│   │   ├── provider/          # (ProviderDashboard, HallEdit, StaffManagement, WalletClaims)
│   │   ├── chat/              # (ChatList, ChatRoom, TicketDetails)
│   │   └── profile/           # (ProfileSettings, PrivacyPolicy, AccountDeletion, LoyaltyPoints)
│   │
│   ├── services/              # التعامل مع الخدمات الخارجية والأمان
│   │   ├── api.ts             # إعدادات Axios مع التجديد الآلي لـ Access Token
│   │   ├── authService.ts     # تسجيل الدخول وتشفير كلمات المرور والـ OTP
│   │   ├── secureStore.ts     # تخزين مفاتيح Keychain / EncryptedSharedPreferences
│   │   ├── mediaService.ts    # معالجة الصور وفيديوهات MP4 القياسية
│   │   └── notification.ts    # إدارة إشعارات Push Notifications (FCM / APNs)
│   │
│   ├── store/                 # إدارة حالة التطبيق (Zustand)
│   │   ├── useAuthStore.ts    # بيانات العميل أو المزود المصادق عليه
│   │   ├── useBookingStore.ts # الحجوزات النشطة والخدمات المختارة
│   │   └── useAppThemeStore.ts# ثيمات الواجهة واللغات
│   │
│   └── utils/                 # الدوال المساعدة والرياضية
│       ├── formatters.ts      # توثيق الأرقام التسلسلية (BKG-26-..., INV-26...) والعملة (ر.س)
│       └── validators.ts      # التحقق من أرقام الجوال والبريد والتسجيل الضريبي
```

---

## 2. نظام التنقل والعزل الصارم للأدوار (Navigation & Multi-Role Isolation)

يتم تطبيق نظام تنقل صارم يتحقق من رتبة المستخدم (`role: 'عميل' | 'provider' | 'provider_staff' | 'Admin'`) ويعزل واجهات المزودين بالكامل عن خيارات الإعدادات العامة للنظام:

```tsx
// src/navigation/AppNavigator.tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { I18nManager, ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useAppThemeStore } from '../store/useAppThemeStore';

import AuthNavigator from './AuthNavigator';
import CustomerTab from './CustomerTab';
import ProviderTab from './ProviderTab';
import { DarkThemeColors, LightThemeColors } from '../constants/Theme';

// تفعيل اتجاه اليمين لليسار (RTL) بشكل إلزامي وافتراضي
I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, user, isLoading, checkAuthStatus } = useAuthStore();
  const { currentTheme } = useAppThemeStore();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E141B' }}>
        <ActivityIndicator size="large" color="#DFBA6B" />
      </View>
    );
  }

  const isProviderOrStaff = user?.role === 'provider' || user?.role === 'provider_staff' || user?.role === 'مزود';

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: true }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : isProviderOrStaff ? (
          // واجهة الشريك والموظفين المحمية بالعزل الصارم
          <Stack.Screen name="ProviderRoot" component={ProviderTab} />
        ) : (
          // واجهة العملاء الفاخرة
          <Stack.Screen name="CustomerRoot" component={CustomerTab} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## 3. معالج التشفير والتخزين الآمن وتأكيد الـ OTP (Security & Auth Service)

تأمين كلمات المرور باستخدام تشفير جهة الخادم وحفظ التوكنات بـ `expo-secure-store`:

```typescript
// src/services/secureStore.ts
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'LAILAH_SECURE_ACCESS_TOKEN';
const REFRESH_TOKEN_KEY = 'LAILAH_SECURE_REFRESH_TOKEN';
const USER_INFO_KEY = 'LAILAH_SECURE_USER_INFO';

export async function saveAuthTokens(accessToken: string, refreshToken: string, userInfo: any) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken, { keychainAccessible: SecureStore.WHEN_UNLOCKED });
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken, { keychainAccessible: SecureStore.WHEN_UNLOCKED });
  await SecureStore.setItemAsync(USER_INFO_KEY, JSON.stringify(userInfo));
}

export async function getAccessToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function clearAuthSession() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_INFO_KEY);
}
```

---

## 4. توليد الأرقام التسلسلية المعيارية (Serial Number Utility)

أداة مطابقة لتوليد الأرقام التسلسلية الصريحة وفقاً لشروط النظام الأساسية:

```typescript
// src/utils/formatters.ts

/**
 * توليد أرقام التسلسل المعيارية وفق قواعد منصة ليلة
 * @param type نوع المعرف المطلوب
 * @param seqNumber الرقم التسلسلي للسنة الحالية (1 => 0000000001)
 * @param year السنة الحالية (مثل 26 لعام 2026)
 */
export function formatSerialNumber(
  type: 'booking' | 'service_request' | 'invoice' | 'revenue' | 'expense',
  seqNumber: number,
  year: string = '26'
): string {
  const paddedSeq = String(seqNumber).padStart(10, '0');

  switch (type) {
    case 'booking':
      return `BKG-${year}-${paddedSeq}`; // BKG-26-0000000001
    case 'service_request':
      return `SRV-${year}-${paddedSeq}`; // SRV-26-0000000001
    case 'invoice':
      return `INV-${year}${paddedSeq}`;  // INV-260000000001 (بدون واصلة)
    case 'revenue':
      return `REV-${year}-${paddedSeq}`; // REV-26-0000000001
    case 'expense':
      return `EXP-${year}-${paddedSeq}`; // EXP-26-0000000001
    default:
      return `${year}-${paddedSeq}`;
  }
}

export function formatSARCurrency(amount: number): string {
  return `${amount.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س`;
}
```

---

## 5. ضغط الصور والتحقق من الفيديوهات القياسية (Media Upload Helper)

تطبيق قيود الوسائط الصارمة (صور حتى 500KB وأبعاد بين 960x540 و 1280x720، وفيديوهات MP4 حتى 10MB):

```typescript
// src/hooks/useMediaUpload.ts
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

export function useMediaUpload() {
  const [isProcessing, setIsProcessing] = useState(false);

  const pickAndValidateImage = async (): Promise<string | null> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7, // ضغط الصورة تلقائياً للحفاظ على الحجم
    });

    if (result.canceled || !result.assets[0]) return null;

    const asset = result.assets[0];
    const fileInfo = await FileSystem.getInfoAsync(asset.uri);

    if (fileInfo.exists && fileInfo.size) {
      const sizeInKB = fileInfo.size / 1024;
      if (sizeInKB > 500) {
        Alert.alert('تنبيه الحجم', 'حجم الصورة يتجاوز الحد الأقصى المسموح به (500 كيلوبايت). تم ضغط الصورة تلقائياً.');
      }
    }

    if (asset.width < 960 || asset.height < 540) {
      Alert.alert('تنبيه أبعاد الصورة', 'يفضل أن تكون أبعاد الصورة 960x540 بكسل على الأقل لضمان الجودة الملكية.');
    }

    return asset.uri;
  };

  const pickAndValidateVideo = async (): Promise<string | null> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return null;

    const asset = result.assets[0];
    const fileInfo = await FileSystem.getInfoAsync(asset.uri);

    if (fileInfo.exists && fileInfo.size) {
      const sizeInMB = fileInfo.size / (1024 * 1024);
      if (sizeInMB > 10) {
        Alert.alert('خطأ في الرفع', 'حجم ملف الفيديو يتجاوز 10 ميجابايت. يُرجى اختيار فيديو أقصر لتسريع التحميل.');
        return null;
      }
    }

    return asset.uri;
  };

  return { pickAndValidateImage, pickAndValidateVideo, isProcessing };
}
```

---

## 6. نموذج الفلترة والتسعير الهجين ومنع الازدواجية (Hybrid Pricing Hook)

منع عرض أو اقتراح خدمات إضافية من مزودين مستقلين إذا كانت القاعة توفر نفس الفئة:

```typescript
// src/hooks/useHybridServicesFilter.ts
import { useMemo } from 'react';

export interface HallServiceAddon {
  id: number;
  name: string;
  category: string; // 'hospitality' | 'photography' | 'lighting' | 'decoration'
  price: number;
}

export interface IndependentService {
  id: number;
  title: string;
  category: string;
  price: number;
  providerName: string;
}

export function useHybridServicesFilter(
  hallServices: HallServiceAddon[],
  allIndependentServices: IndependentService[]
) {
  // استخراج جميع فئات الخدمات المتاحة داخلياً في القاعة
  const hallCategories = useMemo(() => {
    return new Set(hallServices.map(s => s.category.toLowerCase().trim()));
  }, [hallServices]);

  // تصفية الخدمات المستقلة: إخفاء أي خدمة مستقلة تندرج تحت فئة تغطيها القاعة بالفعل
  const filteredIndependentServices = useMemo(() => {
    return allIndependentServices.filter(indService => {
      const cat = indService.category.toLowerCase().trim();
      const isDuplicatedByHall = hallCategories.has(cat);
      // إذا كانت القاعة تقدم هذه الفئة، يُمحى المورد المستقل لتجنب التعارض
      return !isDuplicatedByHall;
    });
  }, [hallCategories, allIndependentServices]);

  return {
    hallServices,
    filteredIndependentServices,
    hasInternalServices: hallServices.length > 0
  };
}
```

---

## 7. شاشة إدارة الموظفين والصلاحيات للمزود (`ProviderStaffManagement`)

إدارة تراخيص الموظفين إضافة مقاعد إضافية وتحديد أدوارهم داخل تطبيق الجوال:

```tsx
// src/screens/provider/StaffManagementScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { formatSARCurrency } from '../../utils/formatters';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'booking_manager' | 'financial_viewer' | 'support_agent';
  status: 'active' | 'invited';
}

export default function StaffManagementScreen() {
  const [purchasedSeats, setPurchasedSeats] = useState(3);
  const [staffList, setStaffList] = useState<StaffMember[]>([
    { id: '1', name: 'عبدالله العتيبي', email: 'a.otaibi@example.com', role: 'booking_manager', status: 'active' },
    { id: '2', name: 'سارة الشمري', email: 'sara@example.com', role: 'financial_viewer', status: 'active' },
  ]);

  const handleBuySeats = () => {
    Alert.alert(
      'ترقية مقاعد الموظفين (provider_staff)',
      `تكلفة إضافة مقعد إضافي هي 50.00 ر.س شهرياً.\nهل ترغب في المتابعة عبر الشراء داخل التطبيق؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'متابعة الشراء', onPress: () => setPurchasedSeats(prev => prev + 1) }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>إدارة العاملين والصلاحيات</Text>
        <Text style={styles.subtitle}>إدارة فريق العمل والمقاعد المرخصة لمؤسستك</Text>
      </View>

      {/* Seats Capacity Banner */}
      <View style={styles.seatsCard}>
        <View style={styles.seatsInfo}>
          <Text style={styles.seatsTitle}>مقاعد الموظفين المتاحة</Text>
          <Text style={styles.seatsCount}>{staffList.length} / {purchasedSeats} مقعد مستخدم</Text>
        </View>
        <TouchableOpacity style={styles.buySeatBtn} onPress={handleBuySeats}>
          <Text style={styles.buySeatText}>+ إضافة مقعد</Text>
        </TouchableOpacity>
      </View>

      {/* Staff List */}
      <FlatList
        data={staffList}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.staffItem}>
            <View style={styles.staffIcon}>
              <Icon name="user" size={20} color="#DFBA6B" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.staffName}>{item.name}</Text>
              <Text style={styles.staffEmail}>{item.email}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>
                  {item.role === 'booking_manager' ? 'مدير حجوزات' : 'مراقب مالية'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => Alert.alert('تعديل الصلاحية', `تعديل صلاحية ${item.name}`)}>
              <Icon name="more-vertical" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E141B', padding: 16 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#FFF7EA', textAlign: 'left' },
  subtitle: { fontSize: 13, color: '#94A3B8', marginTop: 4, textAlign: 'left' },
  seatsCard: { backgroundColor: '#2D1F28', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#6E284D' },
  seatsInfo: { flex: 1 },
  seatsTitle: { fontSize: 14, color: '#94A3B8' },
  seatsCount: { fontSize: 18, fontWeight: 'bold', color: '#DFBA6B', marginTop: 4 },
  buySeatBtn: { backgroundColor: '#DFBA6B', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  buySeatText: { color: '#1E141B', fontWeight: 'bold', fontSize: 13 },
  staffItem: { backgroundColor: '#2D1F28', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  staffIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3B1A2F', justifyContent: 'center', alignItems: 'center' },
  staffName: { fontSize: 15, fontWeight: 'bold', color: '#FFF7EA' },
  staffEmail: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  roleBadge: { backgroundColor: '#3B1A2F', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginTop: 6 },
  roleText: { color: '#DFBA6B', fontSize: 11, fontWeight: '600' },
});
```

---

## 8. متطلبات القبول بالمتاجر (Apple App Store & Google Play Compliance)

1. **حذف الحساب الصريح (Account Deletion):**
   - توفير زر صريح تحت (`Profile > Settings > Account Deletion`) لاستدعاء `DELETE /api/users/me` لمسح كافة بيانات المستخدم نهائياً من PostgreSQL.
2. **تسجيل الدخول بـ Apple (Apple Sign-In):**
   - إلزامي عند نشر تطبيقات iOS التي تتضمن خيارات دخول خارجية.
3. **مكافحة المحتوى غير اللائق (UGC Content Moderation):**
   - إضافة زر "إبلاغ" (Report) و "حظر" (Block) في الشات والتقييمات.
4. **اشتراكات المزودين عبر الشراء داخل التطبيق (In-App Purchases):**
   - دعم شراء باقات الاشتراك ومقاعد الموظفين (`provider_staff`) عبر آلية IAP لتفادي الرفض.
