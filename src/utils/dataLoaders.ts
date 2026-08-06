/**
 * Utility functions for loading initial data and verifying local storage consistency
 */

import { initialRegions } from '../data/dashboardConstants';

export const loadDynamicRegions = (): any[] | null => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }
  try {
    const storedRegions = localStorage.getItem('SYSTEM_DATastore_regions');
    const storedCities = localStorage.getItem('SYSTEM_DATastore_cities');
    
    const defaultRegionNames = [
      'الرياض', 'مكة المكرمة', 'المدينة المنورة', 'المنطقة الشرقية', 'القصيم', 'حائل', 'عسير', 'تبوك', 'الجوف', 'جيزان', 'نجران', 'الباحة', 'الحدود الشمالية'
    ];
    const defaultCities = [
      'الرياض', 'الخرج', 'الدرعية',
      'مكة', 'جدة', 'الطائف', 'مكة المكرمة',
      'المدينة المنورة', 'ينبع', 'بدر',
      'الدمام', 'الخبر', 'الظهران', 'الجبيل',
      'بريدة', 'عنيزة', 'الرس',
      'حائل', 'بقعاء', 'الشنان',
      'أبها', 'خميس مشيط', 'أحد رفيدة',
      'تبوك', 'ضباء', 'الوجه',
      'سكاكا', 'القريات', 'دومة الجندل',
      'جيزان', 'صبيا', 'أبو عريش',
      'نجران', 'شرورة',
      'الباحة', 'بلجرشي',
      'عرعر', 'رفحاء', 'طريف'
    ];

    let regionNames: string[];
    let cityList: string[];

    if (storedRegions) {
      try {
        regionNames = JSON.parse(storedRegions);
      } catch {
        regionNames = [...defaultRegionNames];
      }
    } else {
      regionNames = [...defaultRegionNames];
      localStorage.setItem('SYSTEM_DATastore_regions', JSON.stringify(regionNames));
    }

    if (storedCities) {
      try {
        cityList = JSON.parse(storedCities);
      } catch {
        cityList = [...defaultCities];
      }
    } else {
      cityList = [...defaultCities];
      localStorage.setItem('SYSTEM_DATastore_cities', JSON.stringify(cityList));
    }

    // Load the customized regions metadata from SYSTEM_REGIONS if present
    let baseRegions: any[] = [];
    const hasStoredRegions = localStorage.getItem('SYSTEM_REGIONS');
    if (hasStoredRegions) {
      try {
        baseRegions = JSON.parse(hasStoredRegions);
      } catch {
        baseRegions = [];
      }
    }
    
    const defaultRegionCities: Record<string, string[]> = {
      'الرياض': ['الرياض', 'الخرج', 'الدرعية'],
      'مكة المكرمة': ['مكة', 'جدة', 'الطائف', 'مكة المكرمة'],
      'المدينة المنورة': ['المدينة المنورة', 'ينبع', 'بدر'],
      'المنطقة الشرقية': ['الدمام', 'الخبر', 'الظهران', 'الجبيل'],
      'القصيم': ['بريدة', 'عنيزة', 'الرس'],
      'حائل': ['حائل', 'بقعاء', 'الشنان'],
      'عسير': ['أبها', 'خميس مشيط', 'أحد رفيدة'],
      'تبوك': ['تبوك', 'ضباء', 'الوجه'],
      'الجوف': ['سكاكا', 'القريات', 'دومة الجندل'],
      'جيزان': ['جيزان', 'صبيا', 'أبو عريش'],
      'نجران': ['نجران', 'شرورة'],
      'الباحة': ['الباحة', 'بلجرشي'],
      'الحدود الشمالية': ['عرعر', 'رفحاء', 'طريف']
    };

    // Strictly keep only regions whose name exists in regionNames (from DataStore)
    let filteredBase = baseRegions.filter(r => regionNames.includes(r.name));
    
    // Add any region name in regionNames that doesn't exist yet in filteredBase
    regionNames.forEach((rName, idx) => {
      if (!filteredBase.some(r => r.name === rName)) {
        filteredBase.push({
          id: Date.now() + idx + Math.floor(Math.random() * 1000),
          name: rName,
          cities: defaultRegionCities[rName] || [rName],
          image: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
        });
      }
    });

    // Ensure cities within regions are filtered to match cityList if present
    filteredBase = filteredBase.map(r => ({
      ...r,
      cities: (r.cities || []).filter(c => cityList.includes(c))
    }));

    // Save synced result to SYSTEM_REGIONS
    localStorage.setItem('SYSTEM_REGIONS', JSON.stringify(filteredBase));

    return filteredBase;
  } catch (e) {
    console.error('Error in loadDynamicRegions:', e);
  }
  return null;
};

/**
 * Sync system configuration items or reset storage to initial defaults
 */
export const syncConfigItemToDB = (key: string, value: any): void => {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to sync config item: ${key}`, e);
    }
  }
};
