export type SupportedPlatform = 'leetcode' | 'codeforces' | 'unknown';

export interface PlatformInfo {
  platform: SupportedPlatform;
  displayName: string;
  isSupported: boolean;
  activeUrl?: string;
}

export function detectPlatformFromUrl(url?: string): SupportedPlatform {
  if (!url) {
    if (typeof window !== 'undefined') {
      url = window.location.href;
    } else {
      return 'unknown';
    }
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host === 'leetcode.com' || host.endsWith('.leetcode.com')) {
      return 'leetcode';
    }
    if (host === 'codeforces.com' || host.endsWith('.codeforces.com')) {
      return 'codeforces';
    }
  } catch {
    // invalid URL format
  }

  return 'unknown';
}
