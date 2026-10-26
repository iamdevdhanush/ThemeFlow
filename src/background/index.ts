import { getSettings } from '../storage/storage';

chrome.runtime.onInstalled.addListener(async (details: chrome.runtime.InstalledDetails) => {
  if (details.reason === 'install' || details.reason === 'update') {
    // Ensures either safe migration from v1 or clean v2 initialization
    await getSettings();
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
