import React from 'react';
import { ProviderSubscriptionCenter } from './ProviderSubscriptionCenter';
import { PlanDetails } from './PlanDetails';
import { AddonMarketplace } from './AddonMarketplace';

interface ProviderSubscriptionsProps {
  providerPlan: 'starter' | 'pro';
  setProviderPlan: (plan: 'starter' | 'pro') => void;
  hasDynamicPricingAccess: boolean;
  setPurchasedDynamicPricingAddon: (val: boolean) => void;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const ProviderSubscriptions: React.FC<ProviderSubscriptionsProps> = (props) => {
  return (
    <ProviderSubscriptionCenter
      providerPlan={props.providerPlan}
      setProviderPlan={props.setProviderPlan}
      hasDynamicPricingAccess={props.hasDynamicPricingAccess}
      setPurchasedDynamicPricingAddon={props.setPurchasedDynamicPricingAddon}
      showNotification={props.showNotification}
    />
  );
};

export default ProviderSubscriptions;
