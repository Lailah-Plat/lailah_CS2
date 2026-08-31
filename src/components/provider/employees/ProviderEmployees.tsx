import React from 'react';
import { StaffList } from './StaffList';
import { ShiftSchedule } from './ShiftSchedule';

interface ProviderEmployeesProps {
  showNotification?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const ProviderEmployees: React.FC<ProviderEmployeesProps> = ({
  showNotification,
}) => {
  return (
    <div className="space-y-6">
      <StaffList
        onAddStaff={() => {
          showNotification?.('info', 'تم فتح نموذج تسجيل موظف جديد');
        }}
      />
      <ShiftSchedule />
    </div>
  );
};

export default ProviderEmployees;
