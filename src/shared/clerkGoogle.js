const googleScopes = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
];

// Links (or re-authorizes) the signed-in Clerk user's Google account with the
// mail and calendar scopes, then redirects through Google's consent screen.
export async function connectGoogleWithMailScopes() {
  const user = window.Clerk?.user;
  if (!user) {
    throw new Error("Sign in first");
  }

  const redirectUrl = window.location.href;
  const existing = user.externalAccounts?.find(
    (account) =>
      account.provider === "google" || account.provider === "oauth_google",
  );

  const account = existing
    ? await existing.reauthorize({
        additionalScopes: googleScopes,
        redirectUrl,
      })
    : await user.createExternalAccount({
        strategy: "oauth_google",
        additionalScopes: googleScopes,
        redirectUrl,
      });

  const verificationUrl =
    account?.verification?.externalVerificationRedirectURL;
  if (verificationUrl) {
    window.location.href = String(verificationUrl);
  }
  return account;
}
