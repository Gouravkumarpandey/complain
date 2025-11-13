# Using Subscription Features in Components

## Example 1: Conditionally Render Features

```typescript
import React from 'react';
import { useSubscription } from '../../hooks/useSubscription';
import FeatureLocked from '../subscription/FeatureLocked';

export const AnalyticsDashboard = () => {
  const { hasFeature, loading, getRequiredPlans } = useSubscription();

  if (loading) {
    return <div>Loading...</div>;
  }

  // Check if user has access to analytics
  if (!hasFeature('analytics')) {
    return (
      <FeatureLocked
        feature="Analytics Dashboard"
        requiredPlans={getRequiredPlans('analytics')}
        title="Advanced Analytics"
        description="Get detailed insights into your complaints with our analytics dashboard. Available for Pro and Premium users."
      />
    );
  }

  return (
    <div>
      {/* Your analytics dashboard component */}
      <h1>Analytics Dashboard</h1>
      {/* ... */}
    </div>
  );
};
```

## Example 2: Compact Feature Lock (Inline)

```typescript
import React from 'react';
import { useSubscription } from '../../hooks/useSubscription';
import FeatureLocked from '../subscription/FeatureLocked';

export const ComplaintForm = () => {
  const { hasFeature } = useSubscription();

  return (
    <div>
      <h1>Submit Complaint</h1>
      
      {/* Basic form fields */}
      <input type="text" placeholder="Title" />
      <textarea placeholder="Description" />

      {/* AI Diagnosis Feature */}
      <div className="mt-6">
        <h3>AI-Powered Diagnosis</h3>
        {hasFeature('ai-diagnosis') ? (
          <button className="btn-primary">
            Get AI Diagnosis
          </button>
        ) : (
          <FeatureLocked
            feature="AI Diagnosis"
            requiredPlans={['Pro', 'Premium']}
            compact={true}
          />
        )}
      </div>
    </div>
  );
};
```

## Example 3: Multiple Feature Checks

```typescript
import React from 'react';
import { useSubscription } from '../../hooks/useSubscription';

export const UserDashboard = () => {
  const { hasFeature, isPlan, subscription } = useSubscription();

  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Show plan badge */}
      <div className="plan-badge">
        Current Plan: {subscription?.planType || 'Free'}
      </div>

      {/* Conditional features */}
      <div className="features-grid">
        {hasFeature('analytics') && (
          <div className="feature-card">
            <h3>Analytics</h3>
            <p>View detailed reports</p>
          </div>
        )}

        {hasFeature('live-chat') && (
          <div className="feature-card">
            <h3>Live Chat</h3>
            <p>Chat with support agents</p>
          </div>
        )}

        {hasFeature('team-management') && (
          <div className="feature-card">
            <h3>Team Management</h3>
            <p>Manage your team members</p>
          </div>
        )}

        {/* Premium-only feature */}
        {isPlan('Premium') && (
          <div className="feature-card premium">
            <h3>Custom Branding</h3>
            <p>Customize your experience</p>
          </div>
        )}
      </div>

      {/* Upgrade prompt for Free users */}
      {isPlan('Free') && (
        <div className="upgrade-banner">
          <p>Unlock powerful features with Pro or Premium!</p>
          <a href="/pricing" className="btn-upgrade">View Plans</a>
        </div>
      )}
    </div>
  );
};
```

## Example 4: Check Before API Call

```typescript
import React from 'react';
import { useSubscription } from '../../hooks/useSubscription';
import { apiService } from '../../services/apiService';

export const AIAssistant = () => {
  const { checkFeatureAccess } = useSubscription();

  const handleAIDiagnosis = async () => {
    // Check access before making API call
    const hasAccess = await checkFeatureAccess('ai-diagnosis');
    
    if (!hasAccess) {
      alert('This feature requires Pro or Premium plan');
      return;
    }

    // Proceed with API call
    try {
      const result = await apiService.getAIDiagnosis(complaintData);
      // Handle result...
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <button onClick={handleAIDiagnosis}>
      Get AI Diagnosis
    </button>
  );
};
```

## Example 5: Disable Features for Free Users

```typescript
import React from 'react';
import { useSubscription } from '../../hooks/useSubscription';

export const ComplaintList = () => {
  const { hasFeature, isPlan } = useSubscription();

  const complaints = [/* your complaints */];
  const maxFreeComplaints = 5;

  return (
    <div>
      <h1>My Complaints</h1>
      
      {/* Show complaint limit for Free users */}
      {isPlan('Free') && (
        <div className="alert alert-info">
          <p>
            Free plan: {complaints.length} / {maxFreeComplaints} complaints this month
          </p>
          <a href="/pricing">Upgrade for unlimited complaints</a>
        </div>
      )}

      <div className="complaints-list">
        {complaints.map(complaint => (
          <div key={complaint.id} className="complaint-card">
            {/* Complaint details */}
            
            {/* Show premium features only for paid users */}
            {hasFeature('priority-support') && (
              <button className="btn-priority">
                Mark as Priority
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Disable "Create" button if Free user reached limit */}
      <button 
        disabled={isPlan('Free') && complaints.length >= maxFreeComplaints}
        onClick={() => {/* create complaint */}}
      >
        {isPlan('Free') && complaints.length >= maxFreeComplaints 
          ? 'Upgrade to create more complaints'
          : 'Create New Complaint'
        }
      </button>
    </div>
  );
};
```

## Example 6: Show Different UI Based on Plan

```typescript
import React from 'react';
import { useSubscription } from '../../hooks/useSubscription';

export const Navbar = () => {
  const { subscription, isPlan } = useSubscription();

  return (
    <nav>
      <div className="nav-links">
        <a href="/dashboard">Dashboard</a>
        <a href="/complaints">Complaints</a>
        
        {/* Show these links only for Pro/Premium users */}
        {(isPlan('Pro') || isPlan('Premium')) && (
          <>
            <a href="/analytics">Analytics</a>
            <a href="/live-chat">Live Chat</a>
          </>
        )}

        {/* Show team management only for Premium */}
        {isPlan('Premium') && (
          <a href="/team">Team</a>
        )}
      </div>

      {/* Plan badge */}
      <div className="plan-indicator">
        <span className={`badge badge-${subscription?.planType?.toLowerCase()}`}>
          {subscription?.planType || 'Free'}
        </span>
        {!isPlan('Premium') && (
          <a href="/pricing" className="upgrade-link">Upgrade</a>
        )}
      </div>
    </nav>
  );
};
```

## Example 7: Route Protection

```typescript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSubscription } from '../../hooks/useSubscription';

export const ProtectedRoute = ({ 
  children, 
  requiredFeature 
}: { 
  children: React.ReactNode;
  requiredFeature: string;
}) => {
  const { hasFeature, loading } = useSubscription();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!hasFeature(requiredFeature)) {
    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
};

// Usage in router
<Route 
  path="/analytics" 
  element={
    <ProtectedRoute requiredFeature="analytics">
      <AnalyticsDashboard />
    </ProtectedRoute>
  } 
/>
```

## Available Features to Check

```typescript
const features = [
  'ai-diagnosis',          // Pro, Premium
  'live-chat',             // Pro, Premium
  'video-call',            // Premium only
  'analytics',             // Pro, Premium
  'team-management',       // Premium only
  'custom-branding',       // Premium only
  'api-access',            // Premium only
  'priority-support',      // Pro, Premium
  'real-time-alerts',      // Premium only
  'unlimited-complaints',  // Pro, Premium
  'advanced-reports'       // Premium only
];
```

## Testing Different Plans

During development, you can test different plans by using the admin endpoint:

```bash
# Set user to Pro plan
curl -X POST http://localhost:5000/api/subscriptions/admin/set-plan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "userId": "USER_ID",
    "planType": "Pro",
    "duration": 30
  }'
```

Or use the browser console:

```javascript
// In browser console (when logged in as admin)
const response = await fetch('http://localhost:5000/api/subscriptions/admin/set-plan', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({
    userId: 'YOUR_USER_ID',
    planType: 'Premium',
    duration: 30
  })
});

console.log(await response.json());
```
