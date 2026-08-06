import React from 'react';
import { ReviewsManagement } from '../ReviewsManagement';

interface ReviewsSectionProps {
  userRole: string;
  allReviews: any[];
  currentProviderName: string;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  handleDeleteReview: (id: number | string) => Promise<void>;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = (props) => {
  return <ReviewsManagement {...props} />;
};
