import { OAuth2Client } from "google-auth-library";
import { config } from "../config.js";

export const gmailScopes = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
];

export function createGoogleOAuthClient() {
  return new OAuth2Client(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri,
  );
}

export function buildGoogleAuthUrl() {
  const client = createGoogleOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: gmailScopes,
  });
}

export async function exchangeGoogleCode(code) {
  const client = createGoogleOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens;
}

export async function readGoogleProfile(idToken) {
  const client = createGoogleOAuthClient();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: config.google.clientId,
  });
  return ticket.getPayload();
}

export async function refreshGoogleAccessToken(refreshToken) {
  const client = createGoogleOAuthClient();
  client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await client.refreshAccessToken();
  return credentials;
}
