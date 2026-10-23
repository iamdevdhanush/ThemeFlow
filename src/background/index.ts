import { DEFAULT_USER_SETTINGS } from '../themes/presets';

const STORAGE_KEY = 'themeflow_user_settings_v1';

chrome.runtime.onInstalled.addListener(async (details: chrome.runtime.InstalledDetails) => {
  if (details.reason === 'install') {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    if (!result || !result[STORAGE_KEY]) {
      await chrome.storage.local.set({ [STORAGE_KEY]: DEFAULT_USER_SETTINGS });
    }
  }
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener(
  (
    message: { action?: string },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
    if (message.action === 'open_studio') {
      chrome.tabs.create({ url: chrome.runtime.getURL('studio.html') });
      sendResponse({ status: 'ok' });
    }
    return true;
  }
);
