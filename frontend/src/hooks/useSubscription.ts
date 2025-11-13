import { useState, useEffect } from 'react';
import subscriptionService from '../services/subscriptionService';
import { Subscription, PlanType, FeatureAccess } from '../types/subscription';
import { useAuth } from './useAuth';

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadSubscription();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const data = await subscriptionService.getCurrentSubscription();
      setSubscription(data);
    } catch (err) {
      setError('Failed to load subscription');
      console.error('Error loading subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkFeatureAccess = async (feature: string): Promise<boolean> => {
    try {
      const access: FeatureAccess = await subscriptionService.checkFeatureAccess(feature);
      return access.hasAccess;
    } catch (err) {
      console.error('Error checking feature access:', err);
      return false;
    }
  };

  const hasFeature = (feature: string): boolean => {
    const currentPlan = subscription?.planType || user?.planType || 'Free';
    
    const featureAccess: Record<string, PlanType[]> = {
      'ai-diagnosis': ['Pro', 'Premium'],
      'live-chat': ['Pro', 'Premium'],
      'video-call': ['Premium'],
      'analytics': ['Pro', 'Premium'],
      'team-management': ['Premium'],
      'custom-branding': ['Premium'],
      'api-access': ['Premium'],
      'priority-support': ['Pro', 'Premium'],
      'real-time-alerts': ['Premium'],
      'unlimited-complaints': ['Pro', 'Premium'],
      'advanced-reports': ['Premium']
    };

    return featureAccess[feature]?.includes(currentPlan) || false;
  };

  const isPlan = (planType: PlanType): boolean => {
    const currentPlan = subscription?.planType || user?.planType || 'Free';
    return currentPlan === planType;
  };

  const isExpired = (): boolean => {
    return subscription?.isExpired || false;
  };

  const canUpgrade = (): boolean => {
    const currentPlan = subscription?.planType || user?.planType || 'Free';
    return currentPlan !== 'Premium';
  };

  const getRequiredPlans = (feature: string): PlanType[] => {
    const featureAccess: Record<string, PlanType[]> = {
      'ai-diagnosis': ['Pro', 'Premium'],
      'live-chat': ['Pro', 'Premium'],
      'video-call': ['Premium'],
      'analytics': ['Pro', 'Premium'],
      'team-management': ['Premium'],
      'custom-branding': ['Premium'],
      'api-access': ['Premium'],
      'priority-support': ['Pro', 'Premium'],
      'real-time-alerts': ['Premium'],
      'unlimited-complaints': ['Pro', 'Premium'],
      'advanced-reports': ['Premium']
    };

    return featureAccess[feature] || [];
  };

  return {
    subscription,
    loading,
    error,
    checkFeatureAccess,
    hasFeature,
    isPlan,
    isExpired,
    canUpgrade,
    getRequiredPlans,
    refresh: loadSubscription
  };
};
