import React from 'react';
import { Lock, ArrowRight, Zap, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PlanType } from '../../types/subscription';

interface FeatureLockedProps {
  feature: string;
  requiredPlans: PlanType[];
  title?: string;
  description?: string;
  compact?: boolean;
}

export const FeatureLocked: React.FC<FeatureLockedProps> = ({
  feature,
  requiredPlans,
  title,
  description,
  compact = false
}) => {
  const getIcon = () => {
    if (requiredPlans.includes('Premium')) {
      return <Crown className="w-12 h-12 text-orange-500" />;
    }
    return <Zap className="w-12 h-12 text-teal-500" />;
  };

  const getColor = () => {
    if (requiredPlans.includes('Premium')) {
      return 'orange';
    }
    return 'teal';
  };

  const color = getColor();
  const planText = requiredPlans.join(' or ');

  if (compact) {
    return (
      <div className={`bg-${color}-50 border border-${color}-200 rounded-lg p-4`}>
        <div className="flex items-center gap-3">
          <div className={`bg-${color}-100 p-2 rounded-lg`}>
            <Lock className={`w-5 h-5 text-${color}-600`} />
          </div>
          <div className="flex-1">
            <p className={`text-sm font-medium text-${color}-900`}>
              {title || `${planText} Feature`}
            </p>
            <p className={`text-xs text-${color}-700`}>
              {description || `Upgrade to ${planText} to unlock this feature`}
            </p>
          </div>
          <Link
            to="/pricing"
            className={`bg-${color}-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-${color}-700 transition-colors flex items-center gap-2`}
          >
            Upgrade
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center max-w-lg mx-auto">
      <div className={`inline-flex items-center justify-center w-20 h-20 bg-${color}-50 rounded-full mb-4`}>
        {getIcon()}
      </div>
      
      <div className={`inline-flex items-center gap-2 px-4 py-2 bg-${color}-100 rounded-full mb-4`}>
        <Lock className={`w-4 h-4 text-${color}-600`} />
        <span className={`text-sm font-medium text-${color}-900`}>
          {planText} Feature
        </span>
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mb-3">
        {title || 'Unlock Premium Features'}
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {description || `This feature is available for ${planText} users. Upgrade now to access ${feature} and many other powerful features.`}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/pricing"
          className={`bg-${color}-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-${color}-700 transition-all hover:shadow-lg inline-flex items-center justify-center gap-2`}
        >
          View Pricing Plans
          <ArrowRight className="w-5 h-5" />
        </Link>
        
        <Link
          to="/contact"
          className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
        >
          Contact Sales
        </Link>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          ✓ No credit card required • ✓ Cancel anytime • ✓ 24/7 Support
        </p>
      </div>
    </div>
  );
};

export default FeatureLocked;
