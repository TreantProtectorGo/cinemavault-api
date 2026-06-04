import { OAuth2Client } from "google-auth-library";
import { env } from "../../config/env.js";

export type VerifiedGoogleProfile = {
  email: string;
  name?: string;
  picture?: string;
};

type GoogleCredentialVerifier = (credential: string) => Promise<VerifiedGoogleProfile>;

async function verifyGoogleCredentialWithGoogle(
  credential: string
): Promise<VerifiedGoogleProfile> {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new Error("Google OAuth is not configured");
  }

  const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: env.GOOGLE_CLIENT_ID
  });
  const payload = ticket.getPayload();

  if (!payload?.email || payload.email_verified === false) {
    throw new Error("Google credential is invalid");
  }

  return {
    email: payload.email.toLowerCase(),
    name: payload.name,
    picture: payload.picture
  };
}

let googleCredentialVerifier: GoogleCredentialVerifier = verifyGoogleCredentialWithGoogle;

export async function verifyGoogleCredential(credential: string) {
  return googleCredentialVerifier(credential);
}

export function setGoogleCredentialVerifierForTest(verifier: GoogleCredentialVerifier) {
  if (env.NODE_ENV !== "test") {
    throw new Error("Google credential verifier can only be replaced in tests");
  }

  googleCredentialVerifier = verifier;
}

export function resetGoogleCredentialVerifierForTest() {
  googleCredentialVerifier = verifyGoogleCredentialWithGoogle;
}
