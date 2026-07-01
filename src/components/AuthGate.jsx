import { Show, SignIn } from "@clerk/react";
import { clerkEnabled } from "../shared/clerk";

function SignInScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--background)] px-5">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-[var(--primary)]">
          <span className="font-mono text-xs font-bold text-[var(--primary-foreground)]">
            M
          </span>
        </div>
        <span className="font-display text-2xl font-semibold text-[var(--foreground)]">
          Monday
        </span>
      </div>
      <SignIn />
    </div>
  );
}

export function AuthGate({ children }) {
  if (!clerkEnabled) return children;

  return (
    <Show when="signed-in" fallback={<SignInScreen />}>
      {children}
    </Show>
  );
}
