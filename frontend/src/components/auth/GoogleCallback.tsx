import React, { useEffect } from 'react';

const GoogleCallback: React.FC = () => {
  useEffect(() => {
    // Google returns access_token in the URL hash fragment (#access_token=...)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const token = hashParams.get('access_token');

    if (token) {
      window.opener?.postMessage(
        { type: 'oauth-success', payload: { token } },
        window.location.origin
      );
    } else {
      window.opener?.postMessage(
        { type: 'oauth-closed' },
        window.location.origin
      );
    }

    window.close();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto"></div>
        <p className="mt-4 text-gray-600 font-medium">Completing Google authentication...</p>
      </div>
    </div>
  );
};

export default GoogleCallback;
