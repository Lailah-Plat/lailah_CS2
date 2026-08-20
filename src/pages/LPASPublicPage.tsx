/**
 * @file LPASPublicPage.tsx
 * @description Standalone Public Landing Page Route Component for Lailah LPAS.
 * Handles direct URL access to LPAS landing pages via routes like /landing/:slug, /lp/:slug, /lpas/:slug,
 * as well as query parameters like ?lpas_page=slug, ?lpas_slug=slug, ?landing_page=slug.
 */

import React, { useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { resolveLPASPage } from '../services/LPASResolverService';
import { LPASPageRenderer } from '../components/lpas/LPASPageRenderer';

export default function LPASPublicPage() {
  const { slug: routeSlug } = useParams<{ slug?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Extract slug from route parameters or search parameters
  const activeSlug = useMemo(() => {
    if (routeSlug) return routeSlug;
    return (
      searchParams.get('lpas_page') ||
      searchParams.get('lpas_slug') ||
      searchParams.get('landing_page') ||
      'general-acquisition'
    );
  }, [routeSlug, searchParams]);

  // Resolve the landing page data dynamically or from storage
  const lpasPage = useMemo(() => {
    return resolveLPASPage(activeSlug);
  }, [activeSlug]);

  const handleNavigateToRegistration = (context?: {
    providerType?: 'VENUE' | 'SERVICE_PROVIDER' | 'ALL';
    defaultCategory?: string;
    defaultCity?: string;
    landingPageId?: string;
  }) => {
    if (context) {
      try {
        localStorage.setItem('LPAS_REGISTRATION_CONTEXT', JSON.stringify(context));
      } catch (e) {
        console.warn('Failed to save registration context:', e);
      }
    }
    // Navigate to registration page
    navigate('/register');
  };

  const handleViewOtherPages = () => {
    navigate('/explore');
  };

  return (
    <LPASPageRenderer
      page={lpasPage}
      onNavigateToRegistration={handleNavigateToRegistration}
      onViewOtherPages={handleViewOtherPages}
    />
  );
}
