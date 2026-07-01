import { clerkClient } from "@clerk/fastify";

export async function getClerkGoogleAccess(userId) {
  const [tokens, user] = await Promise.all([
    clerkClient.users.getUserOauthAccessToken(userId, "google"),
    clerkClient.users.getUser(userId),
  ]);

  const accessToken = tokens.data?.[0]?.token ?? null;
  const googleAccount = user.externalAccounts?.find(
    (account) =>
      account.provider === "oauth_google" || account.provider === "google",
  );
  const email =
    googleAccount?.emailAddress ??
    user.primaryEmailAddress?.emailAddress ??
    null;

  return { accessToken, email };
}
