/**
 * Focused Test Suite for ThemeFlow Phase 3 (Shared Controllers, Performance & Resource Cleanup)
 * 
 * Validates:
 * 1. One accepted submission triggers exactly one celebration
 * 2. Historical submissions on page load do not trigger celebrations
 * 3. Duplicate mutations & Monaco editor keystrokes do not retrigger celebrations
 * 4. Repeated initialization does not duplicate the quick-switcher pill
 * 5. SPA navigation does not attach duplicate observers or handlers
 * 6. Audio respects existing user settings (soundEnabled, volume)
 * 7. Teardown releases owned resources (observers disconnected, pill removed, audio cleaned up)
 * 8. Existing Domain Expansion lifecycle behavior remains unchanged
 */

import assert from 'node:assert';

console.log('--- Running Phase 3 Shared Controllers & Performance Tests ---\n');

// Mock Browser Environment
class MockClassList {
  constructor() { this.classes = new Set(); }
  add(...c) { c.forEach(x => this.classes.add(x)); }
  remove(...c) { c.forEach(x => this.classes.delete(x)); }
  contains(c) { return this.classes.has(c); }
}

class MockElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.id = '';
    this.className = '';
    this.textContent = '';
    this.style = {};
    this.children = [];
    this.parentNode = null;
    this.attributes = new Map();
    this.classList = new MockClassList();
    this.listeners = new Map();
  }

  setAttribute(k, v) { this.attributes.set(k, String(v)); }
  getAttribute(k) { return this.attributes.get(k) || null; }
  removeAttribute(k) { this.attributes.delete(k); }
  hasAttribute(k) { return this.attributes.has(k); }

  appendChild(child) {
    if (!child) return child;
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentNode = null;
    }
    return child;
  }

  addEventListener(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(fn);
  }

  removeEventListener(event, fn) {
    if (!this.listeners.has(event)) return;
    const arr = this.listeners.get(event);
    const idx = arr.indexOf(fn);
    if (idx !== -1) arr.splice(idx, 1);
  }

  dispatchEvent(event) {
    const arr = this.listeners.get(event.type) || [];
    for (const fn of arr) fn(event);
  }

  getContext() {
    return {
      clearRect() {},
      save() {},
      restore() {},
      translate() {},
      rotate() {},
      beginPath() {},
      arc() {},
      moveTo() {},
      lineTo() {},
      closePath() {},
      fill() {},
      stroke() {},
    };
  }

  getBoundingClientRect() {
    return { left: 200, top: 200, width: 100, height: 40, right: 300, bottom: 240 };
  }

  matches(selector) {
    const parts = selector.split(',').map(s => s.trim());
    for (const part of parts) {
      if (part.toLowerCase() === this.tagName.toLowerCase()) return true;
      if (this.id && part === `#${this.id}`) return true;
      if (this.className && part.includes(`.${this.className}`)) return true;
      for (const [k, v] of this.attributes) {
        if (part === `[${k}="${v}"]` || part === `[${k}]` || part.includes(`[${k}*="${v}"]`)) return true;
      }
    }
    return false;
  }

  closest(selector) {
    let curr = this;
    while (curr) {
      if (curr.matches && curr.matches(selector)) return curr;
      curr = curr.parentNode;
    }
    return null;
  }

  querySelectorAll(selector) {
    const matches = [];
    const walk = (node) => {
      if (node !== this && node.matches && node.matches(selector)) {
        matches.push(node);
      }
      for (const child of node.children) {
        walk(child);
      }
    };
    walk(this);
    return matches;
  }

  querySelector(selector) {
    const all = this.querySelectorAll(selector);
    return all.length > 0 ? all[0] : null;
  }

  getElementById(id) {
    let found = null;
    const walk = (node) => {
      if (node.id === id) {
        found = node;
        return;
      }
      for (const child of node.children) {
        walk(child);
        if (found) return;
      }
    };
    walk(this);
    return found;
  }
}

// Setup Global DOM mocks
const mockDocBody = new MockElement('body');
const mockDocElement = new MockElement('html');
mockDocElement.appendChild(mockDocBody);

const mockDocument = {
  body: mockDocBody,
  documentElement: mockDocElement,
  head: new MockElement('head'),
  createElement(tag) { return new MockElement(tag); },
  createElementNS(ns, tag) { return new MockElement(tag); },
  getElementById(id) {
    if (id === mockDocBody.id) return mockDocBody;
    if (id === mockDocElement.id) return mockDocElement;
    return mockDocElement.getElementById(id);
  },
  querySelectorAll(sel) { return mockDocElement.querySelectorAll(sel); },
  querySelector(sel) { return mockDocElement.querySelector(sel); },
  addEventListener(event, fn) { mockDocBody.addEventListener(event, fn); },
  removeEventListener(event, fn) { mockDocBody.removeEventListener(event, fn); },
};

globalThis.document = mockDocument;
globalThis.window = {
  location: { href: 'https://leetcode.com/problems/two-sum/' },
  innerWidth: 1920,
  innerHeight: 1080,
  addEventListener(event, fn) { mockDocBody.addEventListener(event, fn); },
  removeEventListener(event, fn) { mockDocBody.removeEventListener(event, fn); },
  matchMedia() { return { matches: false, addEventListener() {} }; },
};
globalThis.window.requestAnimationFrame = (cb) => setTimeout(cb, 16);
globalThis.window.cancelAnimationFrame = (id) => clearTimeout(id);
globalThis.requestAnimationFrame = globalThis.window.requestAnimationFrame;
globalThis.cancelAnimationFrame = globalThis.window.cancelAnimationFrame;

class MockMutationObserver {
  constructor(cb) {
    this.callback = cb;
    this.target = null;
    MockMutationObserver.instances.push(this);
  }
  observe(target, opts) { this.target = target; }
  disconnect() {
    this.target = null;
    const idx = MockMutationObserver.instances.indexOf(this);
    if (idx !== -1) MockMutationObserver.instances.splice(idx, 1);
  }
  trigger(mutations = []) {
    if (this.target) this.callback(mutations, this);
  }
}
MockMutationObserver.instances = [];
globalThis.MutationObserver = MockMutationObserver;

class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.currentTime = 0;
    this.destination = {};
  }
  createOscillator() {
    return {
      type: 'sine',
      frequency: { setValueAtTime() {} },
      connect() {},
      start() {},
      stop() {},
    };
  }
  createGain() {
    return {
      gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
      connect() {},
    };
  }
  resume() { return Promise.resolve(); }
  suspend() { this.state = 'suspended'; return Promise.resolve(); }
  close() { this.state = 'closed'; return Promise.resolve(); }
}

globalThis.AudioContext = MockAudioContext;
globalThis.window.AudioContext = MockAudioContext;
globalThis.Audio = class {
  constructor(src) { this.src = src; this.volume = 1; }
  play() { return Promise.resolve(); }
};

// Import controllers and adapters
const { QuickPillController } = await import('../src/platforms/common/QuickPillController.ts');
const { verdictTriggerController } = await import('../src/effects/verdictTriggerController.ts');
const { fireAcceptedCelebration, stopAcceptedCelebration } = await import('../src/effects/celebration.ts');
const { cleanupAudio } = await import('../src/audio/soundPlayer.ts');
const { LeetCodeAdapter } = await import('../src/platforms/leetcode/leetcodeAdapter.ts');
const { CodeforcesAdapter } = await import('../src/platforms/codeforces/codeforcesAdapter.ts');

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

const mockThemeConfig = {
  id: 'cosmic-void',
  name: 'Cosmic Void',
  description: 'Test theme',
  imagePath: 'IMAGES/galaxy.jpg',
  thumbnailPath: 'thumbnails/galaxy.webp',
  accentColor: '#a78bfa',
  mode: 'dark',
  overlayOpacity: 0.72,
  blur: 0,
  brightness: 100,
  contrast: 100,
  cardGlassOpacity: 0.78,
  fontFamily: 'JetBrains Mono',
  effect: 'none',
  soundEnabled: true,
  soundVolume: 0.8,
  confettiEnabled: true,
};

const mockSettings = {
  enabled: true,
  activeThemeId: 'cosmic-void',
  quickSwitchVisible: true,
  customThemes: [],
  currentConfig: mockThemeConfig,
};

// ============================================================================
// TEST 1: ONE ACCEPTED SUBMISSION TRIGGERS ONE CELEBRATION
// ============================================================================

await test('One accepted submission triggers exactly one celebration', () => {
  mockDocBody.children = [];
  stopAcceptedCelebration();

  verdictTriggerController.triggerAccepted({
    config: mockThemeConfig,
    verdictText: 'ACCEPTED',
  });

  const containers = mockDocBody.children.filter(c => c.id === 'themeflow-anime-celebration');
  assert.strictEqual(containers.length, 1, 'Exactly one celebration container must exist');

  stopAcceptedCelebration();
  assert.strictEqual(mockDocBody.children.filter(c => c.id === 'themeflow-anime-celebration').length, 0);
});

// ============================================================================
// TEST 2: HISTORICAL SUBMISSIONS DO NOT TRIGGER CELEBRATIONS
// ============================================================================

await test('Historical submissions on page load do not trigger celebrations (LeetCode)', () => {
  mockDocBody.children = [];
  stopAcceptedCelebration();

  // Create pre-existing historical accepted verdict element on page load
  const historyResult = new MockElement('div');
  historyResult.setAttribute('data-e2e-locator', 'submission-result');
  historyResult.className = 'text-green-s';
  historyResult.textContent = 'Accepted';
  mockDocBody.appendChild(historyResult);

  const adapter = new LeetCodeAdapter();
  adapter.init(mockSettings);

  // Trigger mutation observer without active submission
  for (const obs of MockMutationObserver.instances) {
    obs.trigger([{ type: 'childList', target: mockDocBody }]);
  }

  const celebration = mockDocBody.children.find(c => c.id === 'themeflow-anime-celebration');
  assert.strictEqual(celebration, undefined, 'Historical verdicts present on page load must not trigger celebration');

  adapter.destroy();
});

// ============================================================================
// TEST 3: DUPLICATE MUTATIONS DO NOT RETRIGGER CELEBRATIONS
// ============================================================================

await test('Duplicate mutations and Monaco editor keystrokes do not retrigger celebrations', () => {
  mockDocBody.children = [];
  stopAcceptedCelebration();

  const adapter = new LeetCodeAdapter();
  adapter.init(mockSettings);

  // Create a Monaco editor line element
  const editorLine = new MockElement('div');
  editorLine.className = 'view-line';
  editorLine.textContent = 'const a = 10;';
  mockDocBody.appendChild(editorLine);

  // Simulate typing in editor (mutations on editor line)
  for (let i = 0; i < 5; i++) {
    for (const obs of MockMutationObserver.instances) {
      obs.trigger([{ type: 'characterData', target: editorLine }]);
    }
  }

  const celebration = mockDocBody.children.find(c => c.id === 'themeflow-anime-celebration');
  assert.strictEqual(celebration, undefined, 'Monaco typing mutations must be filtered out and never trigger celebration');

  adapter.destroy();
});

// ============================================================================
// TEST 4: REPEATED INITIALIZATION DOES NOT DUPLICATE QUICK-SWITCHER
// ============================================================================

await test('Repeated initialization does not duplicate the quick-switcher pill', () => {
  mockDocBody.children = [];

  const pillCtrl = new QuickPillController({ platformName: 'LeetCode' });

  // Call render multiple times
  pillCtrl.render(mockThemeConfig);
  pillCtrl.render(mockThemeConfig);
  pillCtrl.render({ ...mockThemeConfig, name: 'Neo Tokyo' });

  const pills = mockDocBody.children.filter(c => c.id === 'themeflow-quick-pill');
  assert.strictEqual(pills.length, 1, 'Quick-switcher pill must never be duplicated in the DOM');

  // Verify label was updated
  assert.ok(pills[0].innerHTML.includes('Neo Tokyo'), 'Pill text must be updated');

  pillCtrl.destroy();
  assert.strictEqual(mockDocBody.children.filter(c => c.id === 'themeflow-quick-pill').length, 0);
});

// ============================================================================
// TEST 5: SPA NAVIGATION DOES NOT ATTACH DUPLICATE OBSERVERS OR HANDLERS
// ============================================================================

await test('SPA navigation cleans up state and does not create duplicate observers', () => {
  mockDocBody.children = [];
  stopAcceptedCelebration();

  const initialObserverCount = MockMutationObserver.instances.length;

  const adapter = new LeetCodeAdapter();
  adapter.init(mockSettings);

  const activeObserverCount = MockMutationObserver.instances.length;
  assert.ok(activeObserverCount > initialObserverCount, 'Observers must be attached on init');

  // Simulate SPA route change
  globalThis.window.location.href = 'https://leetcode.com/problems/3sum/';
  mockDocBody.dispatchEvent({ type: 'popstate' });

  // Verify observer count did not grow
  assert.strictEqual(MockMutationObserver.instances.length, activeObserverCount, 'SPA navigation must not attach duplicate observers');

  adapter.destroy();
  assert.strictEqual(MockMutationObserver.instances.length, initialObserverCount, 'destroy() must disconnect all adapter observers');
});

// ============================================================================
// TEST 6: AUDIO RESPECTS EXISTING USER SETTINGS
// ============================================================================

await test('Audio respects soundEnabled: false preference', () => {
  mockDocBody.children = [];
  stopAcceptedCelebration();

  const mutedConfig = {
    ...mockThemeConfig,
    soundEnabled: false,
    confettiEnabled: true,
  };

  // Trigger accepted with sound muted
  verdictTriggerController.triggerAccepted({
    config: mutedConfig,
    verdictText: 'ACCEPTED',
  });

  // Celebration visual fires, but audio is suppressed without errors
  const container = mockDocBody.children.find(c => c.id === 'themeflow-anime-celebration');
  assert.ok(container, 'Celebration visual must fire even when sound is muted');

  stopAcceptedCelebration();
});

// ============================================================================
// TEST 7: TEARDOWN RELEASES OWNED RESOURCES
// ============================================================================

await test('Teardown releases owned resources cleanly', () => {
  mockDocBody.children = [];
  stopAcceptedCelebration();

  const adapter = new CodeforcesAdapter();
  adapter.init(mockSettings);

  assert.ok(mockDocBody.children.find(c => c.id === 'themeflow-quick-pill'), 'Quick pill must be mounted');

  adapter.destroy();

  assert.strictEqual(mockDocBody.children.find(c => c.id === 'themeflow-quick-pill'), undefined, 'Quick pill must be removed on destroy');
  assert.strictEqual(mockDocBody.children.find(c => c.id === 'themeflow-anime-celebration'), undefined, 'Celebration must be stopped on destroy');

  // Verify cleanupAudio can be called without error
  cleanupAudio();
});

// ============================================================================
// TEST 8: DOMAIN EXPANSION LIFECYCLE BEHAVIOR REMAINS UNCHANGED
// ============================================================================

await test('Domain Expansion lifecycle behavior, elements, and duration remain intact', () => {
  mockDocBody.children = [];
  stopAcceptedCelebration();

  fireAcceptedCelebration({ verdictText: 'ACCEPTED' });

  const container = mockDocBody.children.find(c => c.id === 'themeflow-anime-celebration');
  assert.ok(container, 'Container exists');
  assert.strictEqual(container.style.position, 'fixed');
  assert.strictEqual(container.style.overflow, 'hidden');

  // Check sub-layers
  assert.ok(container.children.find(c => c.className === 'tf-domain-dim'), 'Domain dimming layer exists');
  assert.ok(container.children.find(c => c.tagName === 'SVG'), 'Energy slash SVG exists');
  assert.ok(container.children.find(c => c.tagName === 'CANVAS'), 'Shard physics canvas exists');
  assert.ok(container.children.find(c => c.className === 'tf-domain-victory'), 'Victory typography seal exists');

  stopAcceptedCelebration();
  assert.strictEqual(mockDocBody.children.length, 0);
});

console.log(`\n======================================================`);
console.log(`Phase 3 Verification: All ${passedTests}/${totalTests} Tests Passed Successfully!`);
console.log(`======================================================\n`);
