import { useEffect, useState } from 'react';
import { Facebook } from 'lucide-react';

interface FacebookLoginProps {
  onSuccess: (response: { profile: FacebookProfile; auth: FacebookAuth }) => void;
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

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    FB: any;
    fbAsyncInit: () => void;
  }
}

export function FacebookLogin({ 
  onSuccess, 
  onFailure, 
  buttonText = 'Continue with Facebook',
  className = ''
}: FacebookLoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);

  useEffect(() => {
    // Load Facebook SDK
    const loadFacebookSdk = () => {
      // Check if SDK is already loaded
      if (window.FB) {
        setIsSdkLoaded(true);
        return;
      }

      // Define FB init function
      window.fbAsyncInit = () => {
        window.FB.init({
          appId: import.meta.env.VITE_FB_APP_ID,
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
        setIsSdkLoaded(true);
        console.log('✅ Facebook SDK loaded successfully');
      };

      // Load the SDK script
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      
      script.onerror = () => {
        console.error('❌ Failed to load Facebook SDK');
        onFailure('Failed to load Facebook SDK. Please check your internet connection.');
      };

      const firstScript = document.getElementsByTagName('script')[0];
      firstScript.parentNode?.insertBefore(script, firstScript);
    };

    loadFacebookSdk();
  }, [onFailure]);

  const handleFacebookLogin = () => {
    if (!isSdkLoaded || !window.FB) {
      onFailure('Facebook SDK not loaded yet. Please try again.');
      return;
    }

    if (!import.meta.env.VITE_FB_APP_ID) {
      onFailure('Facebook App ID is not configured. Please add VITE_FB_APP_ID to your .env file.');
      return;
    }

    setIsLoading(true);

    window.FB.login(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (response: any) => {
        if (response.authResponse) {
          const auth: FacebookAuth = {
            accessToken: response.authResponse.accessToken,
            userID: response.authResponse.userID,
            expiresIn: response.authResponse.expiresIn
          };

          // Get user profile information
          window.FB.api(
            '/me',
            { fields: 'id,name,email,picture' },
            (profile: FacebookProfile) => {
              setIsLoading(false);
              
              if (profile && !profile.error) {
                onSuccess({ profile, auth });
              } else {
                onFailure('Failed to retrieve user profile from Facebook.');
              }
            }
          );
        } else {
          setIsLoading(false);
          onFailure('Facebook login was cancelled or failed.');
        }
      },
      { scope: 'public_profile,email' }
    );
  };

  return (
    <button
      type="button"
      onClick={handleFacebookLogin}
      disabled={isLoading || !isSdkLoaded}
      className={`flex items-center justify-center gap-2 w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <Facebook className="w-5 h-5 text-blue-600" />
      <span className="text-sm font-medium text-gray-700">
        {isLoading ? 'Logging in...' : buttonText}
      </span>
    </button>
  );
}
