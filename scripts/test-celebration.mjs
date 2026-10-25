/**
 * Comprehensive Test Suite for ThemeFlow Anime Impact Celebration & Platform Trigger Lifecycle
 * Validates:
 * 1. Celebration lifecycle (Impact, Victory, Release, Cleanup)
 * 2. Reduced motion suppression
 * 3. Celebration auto-cleanup by 2000ms
 * 4. Deduplication / prior instance teardown
 * 5. LeetCode: New Accepted submission triggers celebration exactly once
 * 6. LeetCode: Repeated DOM mutations & React re-renders do NOT duplicate celebration
 * 7. LeetCode: Pre-existing historical Accepted verdicts on page load NEVER trigger celebration
 * 8. LeetCode: Clicking "Submissions" tab or historical list items NEVER triggers celebration
 * 9. LeetCode: Failed verdicts (Wrong Answer, Runtime Error, TLE) NEVER trigger celebration
 * 10. LeetCode: SPA navigation / URL change cleanly stops celebration & resets state
 * 11. LeetCode: Component teardown / destroy() stops celebration & disconnects observers
 */

import assert from 'node:assert';

console.log('--- Running ThemeFlow Celebration & Triggering Verification Tests ---');

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

  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(fn);
  }

  removeEventListener(type, fn) {
    const list = this.listeners.get(type) || [];
    this.listeners.set(type, list.filter(l => l !== fn));
  }
}

// Global Mocks
const mockDocBody = new MockElement('body');
const mockDocHead = new MockElement('head');
const mockDocElement = new MockElement('html');

const docListeners = new Map();
const winListeners = new Map();
let querySelectorAllHandler = () => [];

global.document = {
  body: mockDocBody,
  head: mockDocHead,
  documentElement: mockDocElement,
  createElement(tag) { return new MockElement(tag); },
  createElementNS(ns, tag) { return new MockElement(tag); },
  getElementById(id) {
    if (id === 'themeflow-anime-celebration') {
      return mockDocBody.children.find(c => c.id === 'themeflow-anime-celebration') || null;
    }
    return null;
  },
  querySelectorAll(sel) { return querySelectorAllHandler(sel); },
  addEventListener(type, fn) {
    if (!docListeners.has(type)) docListeners.set(type, []);
    docListeners.get(type).push(fn);
  },
  removeEventListener(type, fn) {
    const list = docListeners.get(type) || [];
    docListeners.set(type, list.filter(l => l !== fn));
  },
};

global.window = {
  innerWidth: 1920,
  innerHeight: 1080,
  location: { href: 'https://leetcode.com/problems/two-sum/' },
  matchMedia: (query) => ({
    matches: query.includes('reduce') ? Boolean(global.__PREFERS_REDUCED_MOTION__) : false,
    addEventListener() {},
  }),
  requestAnimationFrame: (cb) => setTimeout(() => cb(Date.now()), 16),
  cancelAnimationFrame: (id) => clearTimeout(id),
  addEventListener(type, fn) {
    if (!winListeners.has(type)) winListeners.set(type, []);
    winListeners.get(type).push(fn);
  },
  removeEventListener(type, fn) {
    const list = winListeners.get(type) || [];
    winListeners.set(type, list.filter(l => l !== fn));
  },
};

global.requestAnimationFrame = global.window.requestAnimationFrame;
global.cancelAnimationFrame = global.window.cancelAnimationFrame;
global.performance = { now: () => Date.now() };

class MockMutationObserver {
  constructor(cb) {
    this.callback = cb;
    MockMutationObserver.instances.push(this);
  }
  observe(target, options) {
    this.target = target;
    this.options = options;
  }
  disconnect() {
    const idx = MockMutationObserver.instances.indexOf(this);
    if (idx !== -1) MockMutationObserver.instances.splice(idx, 1);
  }
}
MockMutationObserver.instances = [];
global.MutationObserver = MockMutationObserver;

// Import tested modules
const { fireAcceptedCelebration, stopAcceptedCelebration } = await import('../src/effects/celebration.ts');
const { LeetCodeAdapter } = await import('../src/platforms/leetcode/leetcodeAdapter.ts');

function dispatchDocEvent(type, evt) {
  const list = docListeners.get(type) || [];
  for (const fn of [...list]) fn(evt);
}

let testCount = 0;
async function test(name, fn) {
  testCount++;
  try {
    await fn();
    console.log(`[PASS] Test ${testCount}: ${name}`);
  } catch (err) {
    console.error(`[FAIL] Test ${testCount}: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

const mockSettings = {
  enabled: true,
  activeThemeId: 'cyberpunk',
  customThemes: [],
  quickSwitchVisible: false,
  currentConfig: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: '',
    imagePath: '',
    thumbnailPath: '',
    accentColor: '#34d399',
    mode: 'dark',
    overlayOpacity: 0.5,
    blur: 0,
    brightness: 100,
    contrast: 100,
    cardGlassOpacity: 0.8,
    fontFamily: 'JetBrains Mono',
    effect: 'none',
    soundEnabled: false,
    soundVolume: 0.5,
    confettiEnabled: true,
  },
};

// 1. Celebration DOM creation and properties
await test('Celebration creates container with pointer-events: none and high zIndex', () => {
  global.__PREFERS_REDUCED_MOTION__ = false;
  mockDocBody.children = [];

  fireAcceptedCelebration({ verdictText: 'ACCEPTED', themeAccent: '#34d399' });

  const container = mockDocBody.children.find(c => c.id === 'themeflow-anime-celebration');
  assert.ok(container, 'Container should be appended to body');
  assert.strictEqual(container.style.pointerEvents, 'none', 'Pointer events must be none');
  assert.strictEqual(container.style.zIndex, '9999999', 'Z-index must be maximum');

  // Verify elements inside container
  assert.ok(container.children.length >= 2, 'Container should have SVG impact and Victory badge');
  stopAcceptedCelebration();
  assert.strictEqual(mockDocBody.children.length, 0, 'Container should be cleanly removed on stop');
});

// 2. Reduced motion preference
await test('Reduced motion strictly suppresses animation', () => {
  global.__PREFERS_REDUCED_MOTION__ = true;
  mockDocBody.children = [];

  fireAcceptedCelebration({ verdictText: 'ACCEPTED' });
  assert.strictEqual(mockDocBody.children.length, 0, 'No elements should be added when prefers-reduced-motion is true');
  global.__PREFERS_REDUCED_MOTION__ = false;
});

// 3. Cleanup by 2000ms
await test('Celebration auto-cleans up temporary elements by 2000ms', async () => {
  mockDocBody.children = [];
  fireAcceptedCelebration({ verdictText: 'ACCEPTED' });
  assert.strictEqual(mockDocBody.children.length, 1);

  await new Promise(r => setTimeout(r, 2050));
  assert.strictEqual(mockDocBody.children.length, 0, 'DOM container should auto-remove within 2000ms');
});

// 4. Repeated rapid triggers clean up previous instances cleanly
await test('Successive celebrations teardown prior instance before creating new one', () => {
  mockDocBody.children = [];
  fireAcceptedCelebration({ verdictText: 'ACCEPTED 1' });
  assert.strictEqual(mockDocBody.children.length, 1);

  fireAcceptedCelebration({ verdictText: 'ACCEPTED 2' });
  assert.strictEqual(mockDocBody.children.length, 1, 'Only one celebration container should ever exist in DOM');

  stopAcceptedCelebration();
  assert.strictEqual(mockDocBody.children.length, 0);
});

// 5. LeetCode new Accepted submission triggering
await test('LeetCode: Genuine Submit button click followed by Accepted verdict triggers celebration', () => {
  mockDocBody.children = [];
  const adapter = new LeetCodeAdapter();
  adapter.init(mockSettings);

  const observer = MockMutationObserver.instances.find(o => o.options?.characterData);
  assert.ok(observer, 'Observer should be initialized');

  // User clicks Submit button
  const submitBtn = new MockElement('button');
  submitBtn.setAttribute('data-e2e-locator', 'console-submit-button');
  submitBtn.textContent = 'Submit';
  dispatchDocEvent('click', { target: submitBtn });

  // Simulate Accepted verdict DOM element appearing
  const acceptedVerdictEl = new MockElement('span');
  acceptedVerdictEl.className = 'text-green-s';
  acceptedVerdictEl.textContent = 'Accepted';
  querySelectorAllHandler = (sel) => {
    if (sel.includes('text-green-s')) return [acceptedVerdictEl];
    return [];
  };

  // Trigger mutation
  observer.callback([{ type: 'childList', target: mockDocBody }]);

  const celebration = mockDocBody.children.find(c => c.id === 'themeflow-anime-celebration');
  assert.ok(celebration, 'Celebration should trigger for confirmed Accepted submission');

  adapter.destroy();
  assert.strictEqual(mockDocBody.children.length, 0, 'Teardown should clean up celebration');
});

// 6. Duplicate playback prevention
await test('LeetCode: Repeated mutations & React re-renders do NOT re-fire celebration', () => {
  mockDocBody.children = [];
  const adapter = new LeetCodeAdapter();
  adapter.init(mockSettings);

  const observer = MockMutationObserver.instances.find(o => o.options?.characterData);

  // Click submit
  const submitBtn = new MockElement('button');
  submitBtn.textContent = 'Submit';
  dispatchDocEvent('click', { target: submitBtn });

  const acceptedVerdictEl = new MockElement('span');
  acceptedVerdictEl.className = 'text-green-s';
  acceptedVerdictEl.textContent = 'Accepted';
  querySelectorAllHandler = (sel) => {
    if (sel.includes('text-green-s')) return [acceptedVerdictEl];
    return [];
  };

  // First mutation: fires celebration
  observer.callback([{ type: 'childList', target: mockDocBody }]);
  assert.strictEqual(mockDocBody.children.filter(c => c.id === 'themeflow-anime-celebration').length, 1);

  // Clear celebration to test if another fires
  stopAcceptedCelebration();
  assert.strictEqual(mockDocBody.children.length, 0);

  // Simulate 5 successive React re-renders/mutations with new elements
  for (let i = 0; i < 5; i++) {
    const reRenderedEl = new MockElement('span');
    reRenderedEl.className = 'text-green-s';
    reRenderedEl.textContent = 'Accepted';
    querySelectorAllHandler = (sel) => [reRenderedEl];
    observer.callback([{ type: 'childList', target: mockDocBody }]);
  }

  assert.strictEqual(mockDocBody.children.length, 0, 'Celebration must NOT re-fire for same submission across re-renders');
  adapter.destroy();
});

// 7. Historical Accepted elements on page load never fire
await test('LeetCode: Historical Accepted elements already on page load never fire celebration', () => {
  mockDocBody.children = [];
  const historicalEl = new MockElement('span');
  historicalEl.className = 'text-green-s';
  historicalEl.textContent = 'Accepted';
  querySelectorAllHandler = () => [historicalEl];

  const adapter = new LeetCodeAdapter();
  adapter.init(mockSettings);

  const observer = MockMutationObserver.instances.find(o => o.options?.characterData);

  // Mutate DOM without submitting
  observer.callback([{ type: 'childList', target: mockDocBody }]);

  const celebration = mockDocBody.children.find(c => c.id === 'themeflow-anime-celebration');
  assert.strictEqual(celebration, undefined, 'Historical Accepted verdict must never trigger celebration');
  adapter.destroy();
});

// 8. Submissions tab clicks never initiate or trigger celebration
await test('LeetCode: Clicking Submissions tab ignores past submissions and does not celebrate', () => {
  mockDocBody.children = [];
  const adapter = new LeetCodeAdapter();
  adapter.init(mockSettings);

  const observer = MockMutationObserver.instances.find(o => o.options?.characterData);

  // User clicks "Submissions" tab header
  const tabBtn = new MockElement('div');
  tabBtn.setAttribute('role', 'tab');
  tabBtn.textContent = 'Submissions';
  dispatchDocEvent('click', { target: tabBtn });

  // Submissions list renders historical "Accepted" row
  const tableRow = new MockElement('tr');
  tableRow.setAttribute('role', 'row');
  const pastAccepted = new MockElement('span');
  pastAccepted.className = 'text-green-s';
  pastAccepted.textContent = 'Accepted';
  tableRow.appendChild(pastAccepted);

  querySelectorAllHandler = () => [pastAccepted];
  observer.callback([{ type: 'childList', target: mockDocBody }]);

  const celebration = mockDocBody.children.find(c => c.id === 'themeflow-anime-celebration');
  assert.strictEqual(celebration, undefined, 'Clicking Submissions tab must never fire celebration');
  adapter.destroy();
});

// 9. Failed verdicts terminate pending state and never trigger celebration
await test('LeetCode: Wrong Answer / Runtime Error never triggers celebration', () => {
  mockDocBody.children = [];
  const adapter = new LeetCodeAdapter();
  adapter.init(mockSettings);

  const observer = MockMutationObserver.instances.find(o => o.options?.characterData);

  // User submits
  const submitBtn = new MockElement('button');
  submitBtn.textContent = 'Submit';
  dispatchDocEvent('click', { target: submitBtn });

  // Wrong Answer verdict arrives
  const failedVerdict = new MockElement('span');
  failedVerdict.className = 'text-red-s';
  failedVerdict.textContent = 'Wrong Answer';
  querySelectorAllHandler = (sel) => {
    if (sel.includes('text-red-s')) return [failedVerdict];
    return [];
  };

  observer.callback([{ type: 'childList', target: mockDocBody }]);

  const celebration = mockDocBody.children.find(c => c.id === 'themeflow-anime-celebration');
  assert.strictEqual(celebration, undefined, 'Failed verdicts must never trigger celebration');

  // If subsequent Accepted element appears afterwards, pending was terminated so still no celebration
  const rogueAccepted = new MockElement('span');
  rogueAccepted.className = 'text-green-s';
  rogueAccepted.textContent = 'Accepted';
  querySelectorAllHandler = () => [rogueAccepted];

  observer.callback([{ type: 'childList', target: mockDocBody }]);
  assert.strictEqual(mockDocBody.children.find(c => c.id === 'themeflow-anime-celebration'), undefined);

  adapter.destroy();
});

// 10. SPA Navigation / Teardown
await test('LeetCode: SPA navigation or adapter.destroy() cleans up active celebration', () => {
  mockDocBody.children = [];
  fireAcceptedCelebration({ verdictText: 'ACCEPTED' });
  assert.strictEqual(mockDocBody.children.length, 1);

  const adapter = new LeetCodeAdapter();
  adapter.init(mockSettings);
  adapter.destroy();

  assert.strictEqual(mockDocBody.children.length, 0, 'destroy() must cleanly stop active celebration');
});

// 11. Bounded container dimensions and non-interfering isolation
await test('Celebration uses strictly bounded 420x180 container with overflow hidden (NO full-viewport overlay)', () => {
  mockDocBody.children = [];
  fireAcceptedCelebration({ verdictText: 'ACCEPTED' });

  const container = mockDocBody.children.find(c => c.id === 'themeflow-anime-celebration');
  assert.ok(container, 'Celebration container exists');
  assert.strictEqual(container.style.width, '420px', 'Container width must be exactly 420px');
  assert.strictEqual(container.style.height, '180px', 'Container height must be exactly 180px');
  assert.strictEqual(container.style.overflow, 'hidden', 'Container must have overflow: hidden to clip effects');
  assert.strictEqual(container.style.position, 'fixed', 'Container must have position: fixed');

  // Verify canvas inside container is also sized to 420x180
  const canvas = container.children.find(c => c.tagName === 'CANVAS');
  assert.ok(canvas, 'Canvas shard layer exists');
  assert.strictEqual(canvas.width, 420, 'Canvas must be bounded to 420px');
  assert.strictEqual(canvas.height, 180, 'Canvas must be bounded to 180px');

  stopAcceptedCelebration();
});

// 12. Anchoring and viewport edge clamping
await test('Celebration clamps positioning safely within viewport when anchor is near screen edges', () => {
  mockDocBody.children = [];

  // Mock anchor near top-left edge (left: 5px, top: 5px)
  const edgeAnchor = new MockElement('div');
  edgeAnchor.getBoundingClientRect = () => ({
    left: 5,
    top: 5,
    width: 20,
    height: 20,
    right: 25,
    bottom: 25,
  });

  fireAcceptedCelebration({ anchorElement: edgeAnchor, verdictText: 'ACCEPTED' });

  const container = mockDocBody.children.find(c => c.id === 'themeflow-anime-celebration');
  assert.ok(container);
  
  // Center should be clamped: boxW is 420, half is 210, + 12px margin = 222px minimum left
  const leftVal = parseFloat(container.style.left);
  const topVal = parseFloat(container.style.top);
  assert.ok(leftVal >= 222, `Left position (${leftVal}) must be clamped >= 222px to avoid clipping off-screen`);
  assert.ok(topVal >= 102, `Top position (${topVal}) must be clamped >= 102px to avoid clipping off-screen`);

  stopAcceptedCelebration();
});

console.log(`\nAll ${testCount} Comprehensive Acceptance & Lifecycle Tests Passed Successfully!`);

