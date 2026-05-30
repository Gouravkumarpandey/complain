import { useEffect, useRef } from "react";

export const useOAuthPopup = (onSuccess: (data: any) => void, onClose?: () => void) => {
  const popupRef = useRef<Window | null>(null);

  const openPopup = (url: string) => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    popupRef.current = window.open(
      url,
      "oauth-popup",
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Always verify origin for security
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "oauth-success") {
        onSuccess(event.data.payload);
        popupRef.current?.close();
      }

      if (event.data?.type === "oauth-closed") {
        onClose?.();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage); // cleanup
  }, [onSuccess, onClose]);

  return { openPopup };
};
