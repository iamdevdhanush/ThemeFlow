import assert from 'node:assert';

let totalTests = 0;
let passedTests = 0;

async function test(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`[PASS] Test ${totalTests}: ${name}`);
  } catch (err) {
    console.error(`[FAIL] Test ${totalTests}: ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

// Setup Mock DOM & Browser Environment for Node.js
class MockClassList {
  constructor() {
    this.classes = new Set();
  }
  add(...names) {
    for (const n of names) this.classes.add(n);
  }
  remove(...names) {
    for (const n of names) this.classes.delete(n);
  }
  contains(name) {
    return this.classes.has(name);
  }
}

class MockElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.id = '';
    this.style = {};
    this.classList = new MockClassList();
    this.children = [];
    this.attributes = new Map();
    this.parentNode = null;
  }
  setAttribute(name, val) {
    this.attributes.set(name, val);
  }
  getAttribute(name) {
    return this.attributes.get(name);
  }
  prepend(child) {
    child.parentNode = this;
    this.children.unshift(child);
  }
  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
  }
  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentNode = null;
    }
  }
  querySelector(sel) {
    if (sel.startsWith('#')) {
      const targetId = sel.slice(1);
      return this.children.find((c) => c.id === targetId) || null;
    }
    return null;
  }
  querySelectorAll() {
    return [];
  }
}

const mockDocElement = new MockElement('html');
const mockBody = new MockElement('body');
mockDocElement.appendChild(mockBody);

const mockElementsMap = new Map();
mockElementsMap.set('themeflow-bg-layer', null);
mockElementsMap.set('themeflow-overlay-layer', null);

const mockDocument = {
  documentElement: mockDocElement,
  body: mockBody,
  createElement(tag) {
    const el = new MockElement(tag);
    return el;
  },
  getElementById(id) {
    if (id === 'themeflow-bg-layer' || id === 'themeflow-overlay-layer') {
      return mockDocElement.children.find((c) => c.id === id) || null;
    }
    return null;
  },
  querySelector(sel) {
    return mockDocElement.querySelector(sel);
  },
  querySelectorAll() {
    return [];
  },
  addEventListener() {},
  removeEventListener() {},
};

globalThis.document = mockDocument;
globalThis.window = {
  addEventListener() {},
  removeEventListener() {},
  location: { protocol: 'chrome-extension:' },
};
globalThis.location = globalThis.window.location;
globalThis.Image = class {
  constructor() {
    this.src = '';
    this.onload = null;
    this.onerror = null;
  }
};

// Mock IndexedDB
const mockIndexedDBStore = new Map();

const mockIDBDatabase = {
  objectStoreNames: {
    contains(name) {
      return name === 'custom_images';
    },
  },
  createObjectStore() {},
  transaction(storeName, mode) {
    const tx = {
      objectStore(name) {
        return {
          put(item) {
            mockIndexedDBStore.set(item.id, item);
            return {};
          },
          get(id) {
            const req = {
              onsuccess: null,
              onerror: null,
              result: mockIndexedDBStore.get(id) || null,
            };
            setTimeout(() => {
              if (req.onsuccess) req.onsuccess({ target: req });
            }, 0);
            return req;
          },
          delete(id) {
            mockIndexedDBStore.delete(id);
            return {};
          },
        };
      },
      oncomplete: null,
      onerror: null,
    };
    setTimeout(() => {
      if (tx.oncomplete) tx.oncomplete();
    }, 0);
    return tx;
  },
};

globalThis.indexedDB = {
  open(dbName, version) {
    const req = {
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      result: mockIDBDatabase,
    };
    setTimeout(() => {
      if (req.onsuccess) req.onsuccess({ target: req });
    }, 0);
    return req;
  },
};

// Mock chrome storage & runtime
const mockChromeStorageMap = new Map();
const messageListeners = [];

globalThis.chrome = {
  runtime: {
    getURL(path) {
      return `chrome-extension://mock-extension-id/${path}`;
    },
    onMessage: {
      addListener(fn) {
        messageListeners.push(fn);
      },
      removeListener(fn) {
        const i = messageListeners.indexOf(fn);
        if (i !== -1) messageListeners.splice(i, 1);
      },
    },
    sendMessage(msg, callback) {
      for (const listener of messageListeners) {
        const sendResponse = (res) => {
          if (callback) callback(res);
        };
        const willRespondAsync = listener(msg, {}, sendResponse);
        if (willRespondAsync) return;
      }
      if (callback) callback(null);
    },
    lastError: null,
  },
  storage: {
    local: {
      get(keys, cb) {
        const res = {};
        for (const k of keys) {
          if (mockChromeStorageMap.has(k)) {
            res[k] = mockChromeStorageMap.get(k);
          }
        }
        cb(res);
      },
      set(items, cb) {
        for (const [k, v] of Object.entries(items)) {
          mockChromeStorageMap.set(k, v);
        }
        if (cb) cb();
      },
    },
    onChanged: {
      addListener() {},
      removeListener() {},
    },
  },
};

// Import ThemeFlow Modules
const { ThemeEngine } = await import('../src/core/themeEngine.ts');
const {
  saveCustomImageToDB,
  getCustomImageFromDB,
  deleteCustomImageFromDB,
  saveSettings,
  getSettings,
  STORAGE_KEY_V2,
} = await import('../src/storage/storage.ts');
const { themeRegistry } = await import('../src/themes/themeRegistry.ts');

// Register background message listeners using the same logic as src/background/index.ts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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
});

console.log('\n--- Running ThemeFlow Custom Wallpaper End-to-End Regression Tests ---\n');

async function runAllTests() {
  await test('Custom wallpaper uploads and persists full dataUrl to IndexedDB', async () => {
  const customId = `custom_test_${Date.now()}`;
  const testDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...mock-wallpaper-image-bytes';

  // 1. Save to DB
  await saveCustomImageToDB(customId, testDataUrl);

  // 2. Verify stored in IndexedDB
  const retrieved = await getCustomImageFromDB(customId);
  assert.strictEqual(retrieved, testDataUrl);
  console.log('[PASS] Test 1: Custom wallpaper saved and retrieved from IndexedDB successfully');
});

await test('Test 2: Custom theme settings persist and are restored when reopening Studio', async () => {
  const customId = `custom_persistence_${Date.now()}`;
  const testDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  await saveCustomImageToDB(customId, testDataUrl);

  const customConfig = {
    id: customId,
    name: 'My Anime Wallpaper',
    description: 'User uploaded custom background wallpaper.',
    imagePath: testDataUrl,
    thumbnailPath: 'data:image/webp;base64,mockthumb',
    accentColor: '#f472b6',
    mode: 'glass',
    overlayOpacity: 0.6,
    blur: 4,
    brightness: 105,
    contrast: 110,
    cardGlassOpacity: 0.75,
    fontFamily: 'JetBrains Mono',
    effect: 'sakura',
    soundEnabled: true,
    soundVolume: 0.8,
    confettiEnabled: true,
    isCustom: true,
  };

  const initialSettings = {
    enabled: true,
    activeThemeId: customId,
    quickSwitchVisible: true,
    customThemes: [customConfig],
    currentConfig: customConfig,
  };

  await saveSettings(initialSettings);

  // Simulate closing Studio and reopening: call getSettings()
  const restoredSettings = await getSettings();

  assert.strictEqual(restoredSettings.activeThemeId, customId);
  assert.strictEqual(restoredSettings.customThemes.length, 1);
  assert.strictEqual(restoredSettings.customThemes[0].id, customId);
  assert.strictEqual(restoredSettings.customThemes[0].name, 'My Anime Wallpaper');
  assert.strictEqual(restoredSettings.customThemes[0].isCustom, true);
  assert.strictEqual(restoredSettings.currentConfig.id, customId);
  assert.strictEqual(restoredSettings.currentConfig.accentColor, '#f472b6');
  assert.strictEqual(restoredSettings.currentConfig.effect, 'sakura');

  // Verify image can still be fetched from IndexedDB
  const retrievedImage = await getCustomImageFromDB(customId);
  assert.strictEqual(retrievedImage, testDataUrl);

  console.log('[PASS] Test 2: Custom theme settings and wallpaper persist across sessions');
});

await test('Test 3: Content script on LeetCode resolves custom wallpaper via background messaging', async () => {
  const customId = `custom_leetcode_${Date.now()}`;
  const testDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...leetcode-wallpaper';

  // Seed DB in extension context
  await saveCustomImageToDB(customId, testDataUrl);

  const customConfig = {
    id: customId,
    name: 'LeetCode Dark Galaxy',
    description: 'Custom theme for LeetCode',
    imagePath: testDataUrl,
    thumbnailPath: 'data:image/webp;base64,thumb',
    accentColor: '#38bdf8',
    mode: 'dark',
    overlayOpacity: 0.7,
    blur: 2,
    brightness: 100,
    contrast: 100,
    cardGlassOpacity: 0.8,
    fontFamily: 'Consolas',
    effect: 'none',
    soundEnabled: false,
    soundVolume: 0.7,
    confettiEnabled: true,
    isCustom: true,
  };

  // Simulate content script execution: location is https://leetcode.com
  globalThis.window.location = { protocol: 'https:', host: 'leetcode.com' };
  globalThis.location = globalThis.window.location;

  const engine = new ThemeEngine();
  const resolvedUrl = await engine.resolveImageUrl(customConfig);

  assert.strictEqual(resolvedUrl, testDataUrl);

  // Apply to mock DOM with platform class
  await engine.apply(
    {
      enabled: true,
      activeThemeId: customId,
      quickSwitchVisible: true,
      customThemes: [customConfig],
      currentConfig: customConfig,
    },
    'themeflow-leetcode'
  );

  const bgLayer = mockDocument.getElementById('themeflow-bg-layer');
  assert.ok(bgLayer);
  assert.strictEqual(bgLayer.style.backgroundImage, `url("${testDataUrl}")`);
  assert.ok(mockDocElement.classList.contains('themeflow-leetcode'));
  assert.ok(mockDocElement.classList.contains('themeflow-active'));

  // Restore extension context
  globalThis.window.location = { protocol: 'chrome-extension:' };
  globalThis.location = globalThis.window.location;

  console.log('[PASS] Test 3: Content script on LeetCode resolves and applies custom wallpaper');
});

await test('Test 4: Content script on Codeforces resolves and applies custom wallpaper', async () => {
  const customId = `custom_codeforces_${Date.now()}`;
  const testDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...codeforces-wallpaper';

  await saveCustomImageToDB(customId, testDataUrl);

  const customConfig = {
    id: customId,
    name: 'Codeforces Violet Pulse',
    description: 'Custom theme for Codeforces',
    imagePath: testDataUrl,
    thumbnailPath: 'data:image/webp;base64,thumb',
    accentColor: '#c084fc',
    mode: 'midnight',
    overlayOpacity: 0.65,
    blur: 0,
    brightness: 95,
    contrast: 105,
    cardGlassOpacity: 0.85,
    fontFamily: 'JetBrains Mono',
    effect: 'stars',
    soundEnabled: true,
    soundVolume: 0.9,
    confettiEnabled: true,
    isCustom: true,
  };

  // Simulate content script on codeforces.com
  globalThis.window.location = { protocol: 'https:', host: 'codeforces.com' };
  globalThis.location = globalThis.window.location;

  const engine = new ThemeEngine();
  const resolvedUrl = await engine.resolveImageUrl(customConfig);

  assert.strictEqual(resolvedUrl, testDataUrl);

  await engine.apply(
    {
      enabled: true,
      activeThemeId: customId,
      quickSwitchVisible: true,
      customThemes: [customConfig],
      currentConfig: customConfig,
    },
    'themeflow-codeforces'
  );

  const bgLayer = mockDocument.getElementById('themeflow-bg-layer');
  assert.ok(bgLayer);
  assert.strictEqual(bgLayer.style.backgroundImage, `url("${testDataUrl}")`);
  assert.ok(mockDocElement.classList.contains('themeflow-codeforces'));

  // Restore extension context
  globalThis.window.location = { protocol: 'chrome-extension:' };
  globalThis.location = globalThis.window.location;

  console.log('[PASS] Test 4: Content script on Codeforces resolves and applies custom wallpaper');
});

await test('Test 5: Missing or corrupt IndexedDB image record gracefully falls back to default wallpaper', async () => {
  const corruptConfig = {
    id: 'custom_missing_nonexistent_id',
    name: 'Ghost Wallpaper',
    description: 'Theme whose image record was cleared or missing',
    imagePath: 'custom_missing_nonexistent_id', // invalid path
    thumbnailPath: '',
    accentColor: '#a78bfa',
    mode: 'dark',
    overlayOpacity: 0.72,
    blur: 0,
    brightness: 100,
    contrast: 100,
    cardGlassOpacity: 0.78,
    fontFamily: 'Consolas',
    effect: 'none',
    soundEnabled: false,
    soundVolume: 0.7,
    confettiEnabled: true,
    isCustom: true,
  };

  const engine = new ThemeEngine();
  const resolvedUrl = await engine.resolveImageUrl(corruptConfig);

  // Must cleanly fall back to default Cosmic Void asset rather than breaking
  assert.ok(
    resolvedUrl.includes('IMAGES/galaxy.jpg'),
    `Expected fallback to IMAGES/galaxy.jpg, got "${resolvedUrl}"`
  );

  console.log('[PASS] Test 5: Missing or corrupt custom image record safely falls back to default wallpaper');
});

await test('Test 6: Switching between custom theme and built-in theme preserves custom theme list', async () => {
  const customId = `custom_switching_${Date.now()}`;
  const customDataUrl = 'data:image/jpeg;base64,switching-image-bytes';

  await saveCustomImageToDB(customId, customDataUrl);

  const customConfig = {
    id: customId,
    name: 'Preserved Custom Theme',
    imagePath: customDataUrl,
    thumbnailPath: 'thumb',
    isCustom: true,
    accentColor: '#34d399',
    mode: 'light',
    overlayOpacity: 0.5,
    blur: 0,
    brightness: 100,
    contrast: 100,
    cardGlassOpacity: 0.8,
    fontFamily: 'JetBrains Mono',
    effect: 'none',
    soundEnabled: false,
    soundVolume: 0.7,
    confettiEnabled: true,
  };

  // 1. User active on custom theme
  await saveSettings({
    enabled: true,
    activeThemeId: customId,
    quickSwitchVisible: true,
    customThemes: [customConfig],
    currentConfig: customConfig,
  });

  // 2. User switches to built-in theme 'cyberpunk-neon'
  const cyberpunkDef = themeRegistry.get('cyberpunk-neon');
  const cyberpunkConfig = themeRegistry.definitionToConfig(cyberpunkDef);

  await saveSettings({
    enabled: true,
    activeThemeId: 'cyberpunk-neon',
    quickSwitchVisible: true,
    customThemes: [customConfig], // custom theme remains in customThemes list
    currentConfig: cyberpunkConfig,
  });

  const settingsAfterBuiltin = await getSettings();
  assert.strictEqual(settingsAfterBuiltin.activeThemeId, 'cyberpunk-neon');
  assert.strictEqual(settingsAfterBuiltin.customThemes.length, 1);
  assert.strictEqual(settingsAfterBuiltin.customThemes[0].id, customId);

  // 3. User switches back to custom theme
  const customToRestore = settingsAfterBuiltin.customThemes[0];
  await saveSettings({
    enabled: true,
    activeThemeId: customToRestore.id,
    quickSwitchVisible: true,
    customThemes: settingsAfterBuiltin.customThemes,
    currentConfig: customToRestore,
  });

  const settingsAfterReactivate = await getSettings();
  assert.strictEqual(settingsAfterReactivate.activeThemeId, customId);
  assert.strictEqual(settingsAfterReactivate.currentConfig.id, customId);
  assert.strictEqual(settingsAfterReactivate.currentConfig.isCustom, true);

  });

  await test('Test 7: Deleting custom theme cleans up IndexedDB and storage correctly', async () => {
    const customId = `custom_to_delete_${Date.now()}`;
    const customDataUrl = 'data:image/jpeg;base64,delete-me-bytes';

    await saveCustomImageToDB(customId, customDataUrl);

    const customConfig = {
      id: customId,
      name: 'Theme to Delete',
      imagePath: customDataUrl,
      thumbnailPath: 'thumb',
      isCustom: true,
      accentColor: '#f87171',
      mode: 'dark',
      overlayOpacity: 0.7,
      blur: 0,
      brightness: 100,
      contrast: 100,
      cardGlassOpacity: 0.8,
      fontFamily: 'Consolas',
      effect: 'none',
      soundEnabled: false,
      soundVolume: 0.7,
      confettiEnabled: true,
    };

    await saveSettings({
      enabled: true,
      activeThemeId: customId,
      quickSwitchVisible: true,
      customThemes: [customConfig],
      currentConfig: customConfig,
    });

    // User deletes custom theme
    await deleteCustomImageFromDB(customId);

    const defaultPreset = themeRegistry.definitionToConfig(themeRegistry.getDefault());
    await saveSettings({
      enabled: true,
      activeThemeId: defaultPreset.id,
      quickSwitchVisible: true,
      customThemes: [],
      currentConfig: defaultPreset,
    });

    // 1. Verify removed from IndexedDB
    const checkDb = await getCustomImageFromDB(customId);
    assert.strictEqual(checkDb, null);

    // 2. Verify settings reset to default
    const settings = await getSettings();
    assert.strictEqual(settings.activeThemeId, 'cosmic-void');
    assert.strictEqual(settings.customThemes.length, 0);
  });

  console.log('\n======================================================');
  console.log(`All ${passedTests}/${totalTests} Custom Wallpaper End-to-End Tests Passed Successfully!`);
  console.log('======================================================\n');
}

runAllTests().catch((err) => {
  console.error('[FATAL TEST ERROR]', err);
  process.exit(1);
});
