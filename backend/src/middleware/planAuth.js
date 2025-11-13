import { User } from '../models/User.js';

/**
 * Middleware to check if user has required plan type
 * Usage: requirePlan(['Pro', 'Premium'])
 */
export const requirePlan = (allowedPlans) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if plan is expired
      if (user.planExpiresAt && new Date() > new Date(user.planExpiresAt)) {
        user.planType = 'Free';
        user.planExpiresAt = null;
        await user.save();
      }

      // Check if user's plan is in the allowed list
      if (!allowedPlans.includes(user.planType)) {
        return res.status(403).json({
          message: `This feature requires ${allowedPlans.join(' or ')} plan`,
          currentPlan: user.planType,
          requiredPlans: allowedPlans,
          upgradeRequired: true
        });
      }

      // Add plan info to request for later use
      req.userPlan = user.planType;
      next();
    } catch (error) {
      console.error('Error in requirePlan middleware:', error);
      res.status(500).json({ message: 'Error verifying plan access', error: error.message });
    }
  };
};

/**
 * Middleware to check if user has access to a specific feature
 * Usage: requireFeature('ai-diagnosis')
 */
export const requireFeature = (feature) => {
  const featureAccess = {
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

  const allowedPlans = featureAccess[feature] || [];
  
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if plan is expired
      if (user.planExpiresAt && new Date() > new Date(user.planExpiresAt)) {
        user.planType = 'Free';
        user.planExpiresAt = null;
        await user.save();
      }

      // Check if user's plan has access to this feature
      if (!allowedPlans.includes(user.planType)) {
        return res.status(403).json({
          message: `Feature "${feature}" requires ${allowedPlans.join(' or ')} plan`,
          feature,
          currentPlan: user.planType,
          requiredPlans: allowedPlans,
          upgradeRequired: true
        });
      }

      // Add plan info to request
      req.userPlan = user.planType;
      req.feature = feature;
      next();
    } catch (error) {
      console.error('Error in requireFeature middleware:', error);
      res.status(500).json({ message: 'Error verifying feature access', error: error.message });
    }
  };
};

/**
 * Middleware to check complaint limits for free users
 * Free users can only create 5 complaints per month
 */
export const checkComplaintLimit = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if plan is expired
    if (user.planExpiresAt && new Date() > new Date(user.planExpiresAt)) {
      user.planType = 'Free';
      user.planExpiresAt = null;
      await user.save();
    }

    // Only apply limit to Free plan users
    if (user.planType !== 'Free') {
      return next();
    }

    // Import Complaint model dynamically to avoid circular dependency
    const { default: Complaint } = await import('../models/Complaint.js');
    
    // Count complaints created in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const complaintCount = await Complaint.countDocuments({
      userId: req.user.id,
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Free plan limit: 5 complaints per month
    const FREE_PLAN_LIMIT = 5;
    
    if (complaintCount >= FREE_PLAN_LIMIT) {
      return res.status(403).json({
        message: `Free plan limit reached. You can only create ${FREE_PLAN_LIMIT} complaints per month.`,
        currentPlan: 'Free',
        complaintsUsed: complaintCount,
        limit: FREE_PLAN_LIMIT,
        upgradeRequired: true,
        suggestedPlans: ['Pro', 'Premium']
      });
    }

    // Add remaining complaints info to request
    req.remainingComplaints = FREE_PLAN_LIMIT - complaintCount;
    next();
  } catch (error) {
    console.error('Error in checkComplaintLimit middleware:', error);
    res.status(500).json({ message: 'Error checking complaint limit', error: error.message });
  }
};

/**
 * Add plan info to response for all authenticated requests
 * This is a passive middleware that just adds info without blocking
 */
export const attachPlanInfo = async (req, res, next) => {
  try {
    if (req.user && req.user.id) {
      const user = await User.findById(req.user.id).select('planType planExpiresAt');
      
      if (user) {
        // Check if plan is expired
        let planType = user.planType;
        if (user.planExpiresAt && new Date() > new Date(user.planExpiresAt)) {
          planType = 'Free';
        }
        
        req.planInfo = {
          planType,
          planExpiresAt: user.planExpiresAt,
          isExpired: user.planExpiresAt && new Date() > new Date(user.planExpiresAt)
        };
      }
    }
    next();
  } catch (error) {
    console.error('Error in attachPlanInfo middleware:', error);
    // Don't block the request, just continue without plan info
    next();
  }
};
