import { useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { LoaderCircle } from "lucide-react";
import { googleClientId } from "@/lib/google-auth";

interface GoogleAuthButtonProps {
  disabled?: boolean;
  width?: number;
  onCredential(credential: string): void;
  onError(message: string): void;
}

const getResponsiveWidth = (width: number): number =>
  typeof window === "undefined" || window.innerWidth >= 640
    ? width
    : Math.min(width, Math.max(200, window.innerWidth - 56));

export function GoogleAuthButton({
  disabled = false,
  width = 320,
  onCredential,
  onError,
}: GoogleAuthButtonProps) {
  const [buttonWidth, setButtonWidth] = useState(() =>
    getResponsiveWidth(width),
  );

  useEffect(() => {
    const updateWidth = () => setButtonWidth(getResponsiveWidth(width));
    window.addEventListener("resize", updateWidth);
    updateWidth();
    return () => window.removeEventListener("resize", updateWidth);
  }, [width]);

  if (!googleClientId) {
    return (
      <p className="text-destructive text-center text-sm" role="alert">
        Google sign-in is not configured.
      </p>
    );
  }

  return (
    <div
      className={
        disabled
          ? "pointer-events-none relative mx-auto flex min-h-11 w-full justify-center opacity-60"
          : "relative mx-auto flex min-h-11 w-full justify-center"
      }
      style={{ maxWidth: width }}
      aria-busy={disabled}
    >
      <GoogleLogin
        key={buttonWidth}
        onSuccess={(response) => {
          if (response.credential) onCredential(response.credential);
          else onError("Google sign-in did not return a credential.");
        }}
        onError={() =>
          onError("Google sign-in was cancelled or could not be completed.")
        }
        shape="rectangular"
        size="large"
        text="continue_with"
        theme="outline"
        width={String(buttonWidth)}
      />
      {disabled && (
        <span className="bg-background/80 absolute inset-0 grid place-items-center rounded-sm">
          <LoaderCircle className="text-primary size-5 animate-spin motion-reduce:animate-none" />
        </span>
      )}
    </div>
  );
}
