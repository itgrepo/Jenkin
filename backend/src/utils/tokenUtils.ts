/**
 * Decode JWT token and extract payload
 */
export function decodeJWT(token: string): any | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Check if JWT token is expired
 * @param token - JWT token string
 * @returns true if token is expired or invalid, false if valid
 */
export function isTokenExpired(token: string): boolean {
  if (!token) return true;
  
  const decoded = decodeJWT(token);
  if (!decoded) return true;
  
  // Check if token has expiration claim (exp)
  if (!decoded.exp) {
    // If no exp claim, assume token is valid (some tokens might not have exp)
    return false;
  }
  
  // exp is in seconds, Date.now() is in milliseconds
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}

/**
 * Get remaining time until token expires (in seconds)
 * @param token - JWT token string
 * @returns number of seconds until expiration, or null if token is invalid or has no exp
 */
export function getTokenExpirationTime(token: string): number | null {
  if (!token) return null;
  
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return null;
  
  const currentTime = Math.floor(Date.now() / 1000);
  const remainingTime = decoded.exp - currentTime;
  
  return remainingTime > 0 ? remainingTime : 0;
}

