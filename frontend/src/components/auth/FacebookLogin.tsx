import { useState } from 'react';
import { Facebook } from 'lucide-react';

interface FacebookLoginProps {
  onSuccess?: (response: { profile: FacebookProfile; auth: FacebookAuth }) => void;
  onFailure: (error: string) => void;
  buttonText?: string;
  className?: string;
}

interface FacebookProfile {
  id: string;
  name: string;
  email: string;
  picture: {
    data: {
      url: string;
    };
  };
  error?: unknown;
}

interface FacebookAuth {
  accessToken: string;
  userID: string;
  expiresIn: number;
}

export function FacebookLogin({ 
  onFailure, 
  buttonText = 'Continue with Facebook',
  className = ''
}: FacebookLoginProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleFacebookLogin = () => {
    const appId = import.meta.env.VITE_FB_APP_ID;

    if (!appId) {
      onFailure('Facebook App ID is not configured. Please add VITE_FB_APP_ID to your .env file.');
      return;
    }

    setIsLoading(true);

    // Use redirect-based OAuth flow instead of popup to avoid COOP issues
    const redirectUri = `${window.location.origin}/auth/facebook/callback`;
    const scope = 'public_profile,email';
    const state = window.location.pathname.includes('signup') ? 'signup' : 'login';

    const facebookAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}&response_type=code`;

    // Redirect the entire page to Facebook OAuth
    window.location.href = facebookAuthUrl;
  };

  return (
    <button
      type="button"
      onClick={handleFacebookLogin}
      disabled={isLoading}
      className={`flex items-center justify-center gap-2 w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <Facebook className="w-5 h-5 text-blue-600" />
      <span className="text-sm font-medium text-gray-700">
        {isLoading ? 'Redirecting...' : buttonText}
      </span>
    </button>
  );
}
