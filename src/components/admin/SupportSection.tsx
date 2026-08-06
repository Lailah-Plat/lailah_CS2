import React from 'react';
import { SupportManagement } from '../SupportManagement';

interface SupportSectionProps {
  userRole: string;
  supportTickets: any[];
  setSupportTickets: React.Dispatch<React.SetStateAction<any[]>>;
  currentProviderName: string;
  toggleCalendarType?: () => void;
  calendarType?: string;
  isCreateTicketModalOpen: boolean;
  setIsCreateTicketModalOpen: (open: boolean) => void;
  selectedTicket: any;
  setSelectedTicket: (ticket: any) => void;
  staffList: any[];
  activeTicketTimer?: any;
  ticketMessages: any[];
  ticketReply: string;
  setTicketReply: (reply: string) => void;
  handleSendReply: (ticketId: number | string) => void;
  supportProviderForm: any;
  setSupportProviderForm: (form: any) => void;
  submitProviderTicket: () => void;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const SupportSection: React.FC<any> = (props) => {
  return <SupportManagement {...props} />;
};
