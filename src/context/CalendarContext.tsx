import React, { createContext, useContext, useState, useEffect } from 'react';
import { CalendarType } from '../utils/dateUtils';

interface CalendarContextType {
  calendarType: CalendarType;
  setCalendarType: (type: CalendarType) => void;
  toggleCalendarType: () => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [calendarType, setCalendarTypeState] = useState<CalendarType>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('calendar_type');
        return (saved as CalendarType) || 'gregorian';
      }
    } catch {}
    return 'gregorian';
  });

  const setCalendarType = (type: CalendarType) => {
    setCalendarTypeState(type);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('calendar_type', type);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('calendarTypeChanged', { detail: type }));
      }
    } catch {}
  };

  const toggleCalendarType = () => {
    const nextType = calendarType === 'gregorian' ? 'hijri' : 'gregorian';
    setCalendarType(nextType);
  };

  return (
    <CalendarContext.Provider value={{ calendarType, setCalendarType, toggleCalendarType }}>
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};
