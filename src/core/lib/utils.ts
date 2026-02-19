import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function to extract user ID from JWT token
export function extractUserIdFromToken(token: string): string | null {
  try {
    // Split the JWT token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT token format');
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const decoded = JSON.parse(jsonPayload);
    
    // Extract the user ID from the 'sub' claim
    const userId = decoded.sub;
    
    if (!userId || typeof userId !== 'string') {
      console.error('No user ID found in JWT token');
      return null;
    }

    return userId;
  } catch (error) {
    console.error('Error extracting user ID from token:', error);
    return null;
  }
}
