import { isNative, getPlatform } from "./platform";

/**
 * Devuelve la redirectTo correcta para OAuth segun la plataforma.
 * - Web: usa window.location.origin
 * - iOS/Android: usa deep link scheme
 */
export function getOAuthRedirectUrl(): string {
  if (!isNative()) {
    return `${window.location.origin}/auth/callback`;
  }

  const platform = getPlatform();
  if (platform === "ios") {
    return "eduscan://auth/callback";
  }
  // Android App Links
  return "https://eduscan.vercel.app/auth/callback";
}
