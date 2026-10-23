import { UserSettings } from '../types/theme';
import { detectPlatformFromUrl } from '../types/platform';
import { getSettings, subscribeToSettingsChanges } from '../storage/storage';
import { ThemeEngine } from '../core/themeEngine';
import { LeetCodeAdapter } from '../platforms/leetcode/leetcodeAdapter';
import { CodeforcesAdapter } from '../platforms/codeforces/codeforcesAdapter';

const themeEngine = new ThemeEngine();
let leetcodeAdapter: LeetCodeAdapter | null = null;
let codeforcesAdapter: CodeforcesAdapter | null = null;

async function initMultiPlatform() {
  const platform = detectPlatformFromUrl();
  console.log(`[ThemeFlow] Active on platform: ${platform}`);

  if (platform === 'unknown') {
    return;
  }

  const platformClass = platform === 'leetcode' ? 'themeflow-leetcode' : 'themeflow-codeforces';

  // Instantiate proper platform adapter
  if (platform === 'leetcode') {
    leetcodeAdapter = new LeetCodeAdapter();
  } else if (platform === 'codeforces') {
    codeforcesAdapter = new CodeforcesAdapter();
  }

  const settings = await getSettings();

  // Apply shared theme engine
  await themeEngine.apply(settings, platformClass);

  // Initialize platform adapter
  if (leetcodeAdapter) {
    leetcodeAdapter.init(settings);
  } else if (codeforcesAdapter) {
    codeforcesAdapter.init(settings);
  }

  // Subscribe to settings changes
  subscribeToSettingsChanges(async (newSettings) => {
    await themeEngine.apply(newSettings, platformClass);
    if (leetcodeAdapter) {
      leetcodeAdapter.update(newSettings);
    } else if (codeforcesAdapter) {
      codeforcesAdapter.update(newSettings);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMultiPlatform);
} else {
  initMultiPlatform();
}
