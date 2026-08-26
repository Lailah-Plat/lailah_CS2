/**
 * Data definitions for Saudi Arabia Geographic Zones, Administrative Regions & Cities
 * Optimized for full-bleed 480px Metro UI Grid with 90-degree crisp geometry matching the reference design 100%.
 */

export interface GeoZoneDefinition {
  id: 'central' | 'western' | 'southern' | 'eastern' | 'northern';
  name: string;
  subtitle: string;
  image: string;
  adminRegionIds: string[];
  citiesList: string[];
  gridPosition: 'hero-right' | 'mid-top' | 'mid-bottom' | 'left-top' | 'left-bottom';
}

export interface SaudiAdminRegion {
  id: string;
  name: string;
  zoneId: 'central' | 'western' | 'southern' | 'eastern' | 'northern';
  query: string;
  subtitle: string;
  image: string;
  cities: {
    name: string;
    subtitle: string;
    image: string;
  }[];
}

export interface MetroTile {
  id: string;
  title: string;
  subtitle: string;
  count: number;
  query: string;
  city?: string;
  regionName?: string;
  adminRegionId?: string;
  zoneId?: string;
  image: string;
  badgeText?: string;
  actionText?: string;
  isHero?: boolean;
}

export const SAUDI_GEO_ZONES: GeoZoneDefinition[] = [
  {
    id: 'central',
    name: 'المنطقة الوسطى',
    subtitle: 'منطقة الرياض، منطقة القصيم، منطقة حائل',
    image: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?auto=format&fit=crop&w=1600&q=80',
    adminRegionIds: ['riyadh', 'qassim', 'hail'],
    citiesList: ['الرياض', 'الدرعية', 'الخرج', 'المجمعة', 'الدوادمي', 'الزلفي', 'بريدة', 'عنيزة', 'الرس', 'حائل'],
    gridPosition: 'hero-right',
  },
  {
    id: 'western',
    name: 'المنطقة الغربية',
    subtitle: 'منطقة مكة المكرمة، منطقة المدينة المنورة',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80',
    adminRegionIds: ['makkah', 'madinah'],
    citiesList: ['جدة', 'مكة المكرمة', 'الطائف', 'المدينة المنورة', 'ينبع', 'العلا', 'رابغ', 'القنفذة'],
    gridPosition: 'mid-top',
  },
  {
    id: 'southern',
    name: 'المنطقة الجنوبية',
    subtitle: 'منطقة عسير، منطقة الباحة، منطقة جازان، منطقة نجران',
    image: 'https://images.unsplash.com/photo-1627998656608-f40b28ecda90?auto=format&fit=crop&w=1400&q=80',
    adminRegionIds: ['asir', 'baha', 'jizan', 'najran'],
    citiesList: ['أبها', 'خميس مشيط', 'النماص', 'تنومة', 'جيزان', 'صبيا', 'نجران', 'الباحة', 'بلجرشي'],
    gridPosition: 'mid-bottom',
  },
  {
    id: 'eastern',
    name: 'المنطقة الشرقية',
    subtitle: 'الدمام، الخبر، الأحساء، الجبيل، القطيف، حفر الباطن',
    image: 'https://images.unsplash.com/photo-1578306338421-2a061bb0e271?auto=format&fit=crop&w=1400&q=80',
    adminRegionIds: ['eastern'],
    citiesList: ['الدمام', 'الخبر', 'الأحساء', 'الظهران', 'الجبيل', 'القطيف', 'حفر الباطن', 'الخفجي'],
    gridPosition: 'left-top',
  },
  {
    id: 'northern',
    name: 'المنطقة الشمالية',
    subtitle: 'منطقة الجوف، منطقة تبوك، منطقة الحدود الشمالية',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=80',
    adminRegionIds: ['tabuk', 'jouf', 'northern_borders'],
    citiesList: ['تبوك', 'أملج', 'ضباء', 'سكاكا', 'القريات', 'دومة الجندل', 'عرعر', 'رفحاء', 'طريف'],
    gridPosition: 'left-bottom',
  },
];

export const SAUDI_13_ADMIN_REGIONS: SaudiAdminRegion[] = [
  {
    id: 'riyadh',
    name: 'منطقة الرياض',
    zoneId: 'central',
    query: 'الرياض',
    subtitle: 'الرياض، الدرعية، الخرج، المجمعة، الدوادمي، الزلفي، شقراء',
    image: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?auto=format&fit=crop&w=1400&q=80',
    cities: [
      { name: 'الرياض', subtitle: 'العاصمة وأرقى قصور وقاعات الاحتفالات الفارهة', image: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?auto=format&fit=crop&w=1200&q=80' },
      { name: 'الدرعية', subtitle: 'أصالة نجد وقاعات المناسبات التراثية والتاريخية', image: 'https://images.unsplash.com/photo-1578306338421-2a061bb0e271?auto=format&fit=crop&w=1000&q=80' },
      { name: 'الخرج', subtitle: 'واحات نجد ومجمعات وقصور المناسبات الراقية', image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1000&q=80' },
      { name: 'المجمعة', subtitle: 'عروس سدير وقاعات الاحتفالات الكبرى', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80' },
      { name: 'الدوادمي', subtitle: 'عالية نجد واستراحات ومناسبات الفخامة', image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1000&q=80' },
      { name: 'الزلفي', subtitle: 'واحات الرمال وقاعات الضيافة المميزة', image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1000&q=80' },
      { name: 'وادي الدواسر', subtitle: 'مضايف الكرم والخيام وقاعات المناسبات الأصيلة', image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1000&q=80' },
      { name: 'القويعية', subtitle: 'بوابة الذهب وقاعات ومناسبات المنطقة الوسطى', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80' },
      { name: 'شقراء', subtitle: 'عراقة التراث وقاعات احتفالات الوشم', image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=80' },
    ]
  },
  {
    id: 'makkah',
    name: 'منطقة مكة المكرمة',
    zoneId: 'western',
    query: 'مكة المكرمة',
    subtitle: 'جدة، مكة المكرمة، الطائف، رابغ، القنفذة، الليث، خليص',
    image: 'https://images.unsplash.com/photo-1565552643952-b4306354dd95?auto=format&fit=crop&w=1400&q=80',
    cities: [
      { name: 'جدة', subtitle: 'عروس البحر الأحمر وأفخم القاعات والمنتجعات الساحلية', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80' },
      { name: 'مكة المكرمة', subtitle: 'قصور الضيافة والاحتفالات المعتمدة بجوار الحرم', image: 'https://images.unsplash.com/photo-1565552643952-b4306354dd95?auto=format&fit=crop&w=1200&q=80' },
      { name: 'الطائف', subtitle: 'مدينة الورد وقاعات ومصايف المناسبات الفندقية', image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1000&q=80' },
      { name: 'رابغ', subtitle: 'الساحل الغربي وقاعات ومجمعات الاحتفالات', image: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1000&q=80' },
      { name: 'القنفذة', subtitle: 'غادة الجنوب وقاعات المناسبات البحرية', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=80' },
      { name: 'الليث', subtitle: 'شواطئ اللؤلؤ وقاعات الأفراح والمناسبات', image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1000&q=80' },
      { name: 'خليص', subtitle: 'واحات الحجاز ومضايف وقاعات المناسبات', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1000&q=80' },
    ]
  },
  {
    id: 'eastern',
    name: 'المنطقة الشرقية',
    zoneId: 'eastern',
    query: 'المنطقة الشرقية',
    subtitle: 'الدمام، الخبر، الظهران، الأحساء، الجبيل، القطيف، حفر الباطن، الخفجي',
    image: 'https://images.unsplash.com/photo-1578306338421-2a061bb0e271?auto=format&fit=crop&w=1400&q=80',
    cities: [
      { name: 'الخبر', subtitle: 'أفخم القاعات الفندقية والواجهات البحرية الراقية', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80' },
      { name: 'الدمام', subtitle: 'حاضرة الشرقية وقصور الأفراح والاحتفالات الكبرى', image: 'https://images.unsplash.com/photo-1578306338421-2a061bb0e271?auto=format&fit=crop&w=1200&q=80' },
      { name: 'الأحساء', subtitle: 'أكبر واحة نخيل وقصور الأفراح والمناسبات التراثية', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80' },
      { name: 'الظهران', subtitle: 'مدينة المعرفة وقاعات ومراكز المؤتمرات الراقية', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=80' },
      { name: 'الجبيل', subtitle: 'عاصمة الصناعة وقاعات ومنتجعات المناسبات البحرية', image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1000&q=80' },
      { name: 'القطيف', subtitle: 'واحات الساحل وقاعات المناسبات والأعراس', image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1000&q=80' },
      { name: 'حفر الباطن', subtitle: 'عاصمة الربيع وقصور وقاعات الاحتفالات الفارهة', image: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1000&q=80' },
      { name: 'الخفجي', subtitle: 'لؤلؤة الخليج وقاعات ومناسبات الساحل الشرقي', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1000&q=80' },
    ]
  },
  {
    id: 'madinah',
    name: 'منطقة المدينة المنورة',
    zoneId: 'western',
    query: 'المدينة المنورة',
    subtitle: 'المدينة المنورة، ينبع، العلا، بدر، خيبر، الحناكية',
    image: 'https://images.unsplash.com/photo-1591462002164-81ebd02d6b38?auto=format&fit=crop&w=1400&q=80',
    cities: [
      { name: 'المدينة المنورة', subtitle: 'طيبة الطيبة وأرقى قصور وقاعات المناسبات الكبرى', image: 'https://images.unsplash.com/photo-1591462002164-81ebd02d6b38?auto=format&fit=crop&w=1200&q=80' },
      { name: 'ينبع', subtitle: 'لؤلؤة البحر الأحمر وقاعات ومنتجعات الاحتفالات الراقية', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1000&q=80' },
      { name: 'العلا', subtitle: 'واحة التاريخ والمواقع والمناسبات الاستثنائية العالمية', image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1000&q=80' },
      { name: 'بدر', subtitle: 'تاريخ عريق وقاعات ومناسبات مميزة', image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=80' },
      { name: 'خيبر', subtitle: 'حصون التاريخ ومضايف الضيافة الأصيلة', image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1000&q=80' },
    ]
  },
  {
    id: 'asir',
    name: 'منطقة عسير',
    zoneId: 'southern',
    query: 'عسير',
    subtitle: 'أبها، خميس مشيط، النماص، تنومة، محايل عسير، بيشة، سراة عبيدة',
    image: 'https://images.unsplash.com/photo-1627998656608-f40b28ecda90?auto=format&fit=crop&w=1400&q=80',
    cities: [
      { name: 'أبها', subtitle: 'عروس الضباب وقصور الأفراح والمناسبات الجبلية الفاخرة', image: 'https://images.unsplash.com/photo-1627998656608-f40b28ecda90?auto=format&fit=crop&w=1200&q=80' },
      { name: 'خميس مشيط', subtitle: 'قلب عسير التجاري وأكبر قصور وقاعات الاحتفالات', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80' },
      { name: 'النماص', subtitle: 'مدينة السحاب وقاعات المناسبات البانورامية', image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1000&q=80' },
      { name: 'تنومة', subtitle: 'شلالات الطبيعة وقاعات الاحتفالات الجبلية', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80' },
      { name: 'محايل عسير', subtitle: 'دفء تهامة وقصور ومجمعات المناسبات الكبرى', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80' },
      { name: 'بيشة', subtitle: 'نخيل الجنوب وقاعات ومضايف الاحتفالات', image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1000&q=80' },
    ]
  },
  {
    id: 'qassim',
    name: 'منطقة القصيم',
    zoneId: 'central',
    query: 'القصيم',
    subtitle: 'بريدة، عنيزة، الرس، البكيرية، المذنب، البدائع، رياض الخبراء',
    image: 'https://images.unsplash.com/photo-1582236371728-4ce67cfab7ef?auto=format&fit=crop&w=1400&q=80',
    cities: [
      { name: 'بريدة', subtitle: 'عاصمة القصيم وقصور وقاعات الاحتفالات الفاخرة', image: 'https://images.unsplash.com/photo-1582236371728-4ce67cfab7ef?auto=format&fit=crop&w=1200&q=80' },
      { name: 'عنيزة', subtitle: 'باريس نجد وأرقى صالات وقاعات المناسبات الراقية', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80' },
      { name: 'الرس', subtitle: 'واحات القصيم وقاعات ومنتجعات الضيافة والأفراح', image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=80' },
      { name: 'البكيرية', subtitle: 'مدينة الزهور وقاعات المناسبات والاحتفالات', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80' },
      { name: 'المذنب', subtitle: 'واحة النقاء وقاعات الأفراح والاستراحات الفاخرة', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1000&q=80' },
    ]
  },
  {
    id: 'tabuk',
    name: 'منطقة تبوك',
    zoneId: 'northern',
    query: 'تبوك',
    subtitle: 'تبوك، أملج، ضباء، الوجه، حقل، تيماء، البدع',
    image: 'https://images.unsplash.com/photo-1647432243886-42ab22c95333?auto=format&fit=crop&w=1400&q=80',
    cities: [
      { name: 'تبوك', subtitle: 'عاصمة الورد وبوابة نيوم وقصور الأفراح الكبرى', image: 'https://images.unsplash.com/photo-1647432243886-42ab22c95333?auto=format&fit=crop&w=1200&q=80' },
      { name: 'أملج', subtitle: 'مالديف السعودية وقاعات ومنتجعات الساحل البحرية', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1000&q=80' },
      { name: 'ضباء', subtitle: 'لؤلؤة البحر الأحمر وقاعات المناسبات الساحلية', image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1000&q=80' },
      { name: 'الوجه', subtitle: 'شواطئ الزمرد وقاعات الاحتفالات الراقية', image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1000&q=80' },
      { name: 'حقل', subtitle: 'إطلالات خليج العقبة وقاعات المناسبات البحرية', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80' },
      { name: 'تيماء', subtitle: 'أرض الحضارات وقاعات الضيافة التاريخية', image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1000&q=80' },
    ]
  },
  {
    id: 'hail',
    name: 'منطقة حائل',
    zoneId: 'central',
    query: 'حائل',
    subtitle: 'حائل، بقعاء، الشنان، الغزالة، الشملي، الحائط',
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1400&q=80',
    cities: [
      { name: 'حائل', subtitle: 'عروس الشمال ومضايف الكرم وقصور الاحتفالات الفاخرة', image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80' },
      { name: 'بقعاء', subtitle: 'واحات حائل الخضراء وقاعات الأفراح والمناسبات', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80' },
      { name: 'الشنان', subtitle: 'بوابة الكرم وقاعات الضيافة الحاتمية', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80' },
    ]
  },
  {
    id: 'jizan',
    name: 'منطقة جازان',
    zoneId: 'southern',
    query: 'جازان',
    subtitle: 'جيزان، صبيا، أبو عريش، فرسان، صامطة، بيش، الدرب',
    image: 'https://images.unsplash.com/photo-1621213501708-518dd3e198b1?auto=format&fit=crop&w=1400&q=80',
    cities: [
      { name: 'جيزان', subtitle: 'حاضرة الجنوب وقصور الأفراح والمنتجعات الساحلية', image: 'https://images.unsplash.com/photo-1621213501708-518dd3e198b1?auto=format&fit=crop&w=1200&q=80' },
      { name: 'صبيا', subtitle: 'تاريخ وحضارة وقاعات الاحتفالات والمناسبات الكبرى', image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1000&q=80' },
      { name: 'أبو عريش', subtitle: 'واحات الفل والكاذي وقاعات ومضايف الضيافة', image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=80' },
      { name: 'فرسان', subtitle: 'جزر اللؤلؤ وقاعات المناسبات السياحية الفاخرة', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1000&q=80' },
      { name: 'صامطة', subtitle: 'أصالة الجنوب وقاعات ومجمعات الأفراح الراقية', image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1000&q=80' },
    ]
  },
  {
    id: 'najran',
    name: 'منطقة نجران',
    zoneId: 'southern',
    query: 'نجران',
    subtitle: 'نجران، شرورة، حبونا، بدر الجنوب، يدمة، خباش',
    image: 'https://images.unsplash.com/photo-1549419131-7294860b7cb3?auto=format&fit=crop&w=1400&q=80',
    cities: [
      { name: 'نجران', subtitle: 'مدينة الأخدود وقصور وقاعات الاحتفالات التراثية والحديثة', image: 'https://images.unsplash.com/photo-1549419131-7294860b7cb3?auto=format&fit=crop&w=1200&q=80' },
      { name: 'شرورة', subtitle: 'عروس الربع الخالي وقاعات المناسبات الفاخرة', image: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1000&q=80' },
      { name: 'حبونا', subtitle: 'واحات النخيل وقاعات الضيافة الأصيلة', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80' },
    ]
  },
  {
    id: 'baha',
    name: 'منطقة الباحة',
    zoneId: 'southern',
    query: 'الباحة',
    subtitle: 'الباحة، بلجرشي، المندق، المخواة، قلوة، العقيق',
    image: 'https://images.unsplash.com/photo-1623945415707-16067fa23cd2?auto=format&fit=crop&w=1400&q=80',
    cities: [
      { name: 'الباحة', subtitle: 'حديقة الحجاز وقاعات المناسبات وسط الغابات الخضراء', image: 'https://images.unsplash.com/photo-1623945415707-16067fa23cd2?auto=format&fit=crop&w=1200&q=80' },
      { name: 'بلجرشي', subtitle: 'عروس الباحة وقصور وقاعات الاحتفالات الفارهة', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80' },
      { name: 'المندق', subtitle: 'مدينة الضباب وقاعات المناسبات البانورامية', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80' },
      { name: 'المخواة', subtitle: 'دفء تهامة الباحة وقاعات المناسبات الكبرى', image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1000&q=80' },
    ]
  },
  {
    id: 'jouf',
    name: 'منطقة الجوف',
    zoneId: 'northern',
    query: 'الجوف',
    subtitle: 'سكاكا، القريات، دومة الجندل، طبرجل',
    image: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1400&q=80',
    cities: [
      { name: 'سكاكا', subtitle: 'عاصمة الجوف وقصور وقاعات الاحتفالات الكبرى', image: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80' },
      { name: 'القريات', subtitle: 'بوابة الشمال وقاعات المناسبات والأفراح الراقية', image: 'https://images.unsplash.com/photo-1582236371728-4ce67cfab7ef?auto=format&fit=crop&w=1000&q=80' },
      { name: 'دومة الجندل', subtitle: 'عراقة التاريخ والبحيرة وقاعات المناسبات التراثية', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80' },
      { name: 'طبرجل', subtitle: 'واحة المشاريع الزراعية وقاعات الضيافة', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80' },
    ]
  },
  {
    id: 'northern_borders',
    name: 'منطقة الحدود الشمالية',
    zoneId: 'northern',
    query: 'الحدود الشمالية',
    subtitle: 'عرعر، رفحاء، طريف، العويقيلة',
    image: 'https://images.unsplash.com/photo-1625695507914-7f152d127a92?auto=format&fit=crop&w=1400&q=80',
    cities: [
      { name: 'عرعر', subtitle: 'عاصمة الحدود الشمالية ومضايف وقصور الاحتفالات', image: 'https://images.unsplash.com/photo-1625695507914-7f152d127a92?auto=format&fit=crop&w=1200&q=80' },
      { name: 'رفحاء', subtitle: 'واحات الشمال وقاعات الضيافة الحاتمية', image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1000&q=80' },
      { name: 'طريف', subtitle: 'بوابة الشمال وقاعات ومناسبات الأفراح', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1000&q=80' },
    ]
  }
];

export const getInitialRegionsList = () => {
  return SAUDI_13_ADMIN_REGIONS.map((r, idx) => ({
    id: idx + 1,
    name: r.name.replace('منطقة ', ''),
    cities: r.cities.map(c => c.name),
    image: r.image
  }));
};
