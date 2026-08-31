import React from 'react';
import { ProviderWorkspace, ProviderWorkspaceProps } from './ProviderWorkspace';

export type ProviderDashboardProps = ProviderWorkspaceProps;

export const ProviderDashboard: React.FC<ProviderDashboardProps> = (props) => {
  return <ProviderWorkspace {...props} />;
};

export default ProviderDashboard;
