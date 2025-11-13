// Subscription Types
export type PlanType = 'Free' | 'Pro' | 'Premium';

export interface Subscription {
  planType: PlanType;
  planExpiresAt: string | null;
  isExpired: boolean;
  subscriptionId: string | null;
  paymentHistory: PaymentRecord[];
}

export interface PaymentRecord {
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  planType: PlanType;
  createdAt: string;
}

export interface PlanFeatures {
  name: PlanType;
  price: number;
  currency: string;
  priceLabel?: string;
  features: string[];
  limitations: string[];
}

export interface PlanDetails {
  Free: PlanFeatures;
  Pro: PlanFeatures;
  Premium: PlanFeatures;
}

export interface FeatureAccess {
  hasAccess: boolean;
  currentPlan: PlanType;
  requiredPlans: PlanType[];
}

export interface StripeCheckoutSession {
  sessionId: string;
  url: string;
  planType: PlanType;
}

export interface StripePaymentResponse {
  sessionId: string;
}

export interface SubscriptionStats {
  totalUsers: number;
  freeUsers: number;
  proUsers: number;
  premiumUsers: number;
  expiredUsers: number;
  revenue: {
    total: number;
    pro: number;
    premium: number;
    currency: string;
  };
}

export interface UpgradeResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    planType: PlanType;
    planExpiresAt: string | null;
  };
}

export interface DowngradeResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    planType: PlanType;
    planExpiresAt: string | null;
  };
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  planType: PlanType;
  planExpiresAt: string | null;
  paymentDetails: {
    orderId: string;
    paymentId: string;
    amount: number;
    currency: string;
  };
}

export interface PaymentError {
  message: string;
  code?: string;
}

export interface RefundResponse {
  success: boolean;
  message: string;
  refund: {
    id: string;
    amount: number;
    status: string;
    createdAt: number;
  };
}

export interface AllPaymentsResponse {
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  planType: PlanType;
  createdAt: string;
  userName: string;
  userEmail: string;
  currentPlan: PlanType;
}

// Stripe window interface
declare global {
  interface Window {
    Stripe?: unknown;
  }
}
