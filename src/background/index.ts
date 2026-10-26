import {
  getSettings,
  getCustomImageFromDB,
  saveCustomImageToDB,
  deleteCustomImageFromDB,
} from '../storage/storage';

chrome.runtime.onInstalled.addListener(async (details: chrome.runtime.InstalledDetails) => {
  if (details.reason === 'install' || details.reason === 'update') {
    // Ensures either safe migration from v1 or clean v2 initialization
    await getSettings();
  }
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener(
  (
    message: { action?: string; id?: string; dataUrl?: string },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
    if (message.action === 'open_studio') {
      chrome.tabs.create({ url: chrome.runtime.getURL('studio.html') });
      sendResponse({ status: 'ok' });
      return true;
    }

    if (message.action === 'get_custom_image' && message.id) {
      getCustomImageFromDB(message.id)
        .then((dataUrl) => {
          sendResponse({ status: dataUrl ? 'ok' : 'not_found', dataUrl });
        })
        .catch((err) => {
          sendResponse({ status: 'error', error: err?.message });
        });
      return true;
    }

    if (message.action === 'save_custom_image' && message.id && message.dataUrl) {
      saveCustomImageToDB(message.id, message.dataUrl)
        .then(() => {
          sendResponse({ status: 'ok' });
        })
        .catch((err) => {
          sendResponse({ status: 'error', error: err?.message });
        });
      return true;
    }

    if (message.action === 'delete_custom_image' && message.id) {
      deleteCustomImageFromDB(message.id)
        .then(() => {
          sendResponse({ status: 'ok' });
        })
        .catch((err) => {
          sendResponse({ status: 'error', error: err?.message });
        });
      return true;
    }

    return true;
  }
);
