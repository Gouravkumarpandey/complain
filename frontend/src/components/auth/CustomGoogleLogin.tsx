import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

interface CustomGoogleLoginProps {
    onSuccess: (token: string) => void;
    onFailure: (error: any) => void;
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
    const handleSuccess = (credentialResponse: CredentialResponse) => {
        if (credentialResponse.credential) {
            onSuccess(credentialResponse.credential);
        } else {
            onFailure(new Error('No credential received from Google'));
        }
    };

    const isSignup = buttonText?.toLowerCase().includes('sign up');

    return (
        <div
            className={`google-login-wrapper w-full ${className}`}
            style={{
                opacity: isLoading ? 0.5 : 1,
                pointerEvents: isLoading ? 'none' : 'auto',
            }}
        >
            <GoogleLogin
                onSuccess={handleSuccess}
                onError={() => onFailure(new Error('Google Sign-In Failed'))}
                theme="outline"
                size="large"
                text={isSignup ? 'signup_with' : 'signin_with'}
                shape="rectangular"
                width="400"
                logo_alignment="left"
            />
        </div>
    );
}
