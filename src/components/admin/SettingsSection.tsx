import React from 'react';
import { SettingsManagement } from '../SettingsManagement';
import { useApp } from '../../context/AppContext';

export const SettingsSection: React.FC<any> = (props) => {
  const appState = useApp();
  return (
    <div id="settings_section_container">
      <SettingsManagement {...{ ...appState, ...props } as any} />
    </div>
  );
};
export default SettingsSection;
