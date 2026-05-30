import { useGoogleLogin } from '@react-oauth/google';
import { useState, useEffect, useRef } from 'react';

interface CustomGoogleLoginProps {
    onSuccess: (token: string) => void;
    onFailure: (error: Error) => void;
    buttonText?: string;
    className?: string;
    isLoading?: boolean;
}

export function CustomGoogleLogin({
    onSuccess,
    onFailure,
    buttonText = 'Sign in with Google',
    className = '',
    isLoading = false,
}: CustomGoogleLoginProps) {
    const [loading, setLoading] = useState(false);
    const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ─────────────────────────────────────────────────────────────
    // Option 2 — postMessage-based popup-closed detection
    //
    // `window.closed` polling is blocked by COOP when the popup is
    // cross-origin (e.g. accounts.google.com).  Instead we listen
    // for postMessage events.  @react-oauth/google relays the OAuth
    // result through a same-origin frame that fires postMessage back
    // to the opener, so we catch both the success path and the
    // user-closed path here without ever touching popup.closed.
    // ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Only accept messages from our own origin or Google's OAuth relay
            const trustedOrigins = [
                window.location.origin,
                'https://accounts.google.com',
            ];
            if (!trustedOrigins.includes(event.origin)) return;

            const data = event.data;

            // @react-oauth/google sends these on popup close / error
            if (
                data?.type === 'popup-closed'   ||
                data?.type === 'oauth_error'     ||
                data === 'popup_closed_by_user'  ||
                // Google's own relay message shape
                (typeof data === 'string' && data.includes('oauth'))
            ) {
                clearSafetyTimer();
                setLoading(false);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // Cleanup safety timer on unmount
    useEffect(() => {
        return () => clearSafetyTimer();
    }, []);

    const clearSafetyTimer = () => {
        if (safetyTimerRef.current) {
            clearTimeout(safetyTimerRef.current);
            safetyTimerRef.current = null;
        }
    };

    const googleLogin = useGoogleLogin({
        flow: 'implicit',

        onSuccess: (tokenResponse) => {
            clearSafetyTimer();
            setLoading(false);
            onSuccess(tokenResponse.access_token);
        },

        onError: (error) => {
            clearSafetyTimer();
            setLoading(false);
            console.error('Google login error:', error);
            onFailure(new Error('Google Sign-In Failed'));
        },

        // ── Option 2 fallback ──────────────────────────────────────
        // onNonOAuthError fires for popup_closed / popup_blocked even
        // when COOP prevents window.closed polling.  The library still
        // dispatches this event via its own internal postMessage relay,
        // so it reaches us without touching cross-origin window props.
        onNonOAuthError: (error) => {
            clearSafetyTimer();
            setLoading(false);
            // popup_closed is user-initiated — not an error worth surfacing
            if (error.type !== 'popup_closed') {
                onFailure(new Error('Google Sign-In was cancelled'));
            }
        },
    });

    const handleClick = () => {
        setLoading(true);

        // Safety timeout — reset loading if postMessage is never received
        // (e.g. network error, browser blocks popup, etc.)
        clearSafetyTimer();
        safetyTimerRef.current = setTimeout(() => {
            setLoading(false);
        }, 3 * 60 * 1000); // 3 minutes

        googleLogin();
    };

    const busy = isLoading || loading;

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={busy}
            className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                />
                <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                />
                <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                />
                <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                />
            </svg>
            <span className="text-sm font-semibold text-gray-700">
                {busy ? 'Signing in...' : buttonText}
            </span>
        </button>
    );
}
