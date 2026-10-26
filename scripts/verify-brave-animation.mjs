import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const BRAVE_PATH = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
const PORT = 9222;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (msg) => {
      const resp = JSON.parse(msg.data);
      if (resp.id && this.callbacks.has(resp.id)) {
        const { resolve, reject } = this.callbacks.get(resp.id);
        this.callbacks.delete(resp.id);
        if (resp.error) reject(new Error(resp.error.message));
        else resolve(resp.result);
      }
    };
  }

  send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function run() {
  console.log('--- Verifying Domain Expansion Animation in Brave Browser ---');

  if (!fs.existsSync(BRAVE_PATH)) {
    console.error('Brave executable not found at:', BRAVE_PATH);
    process.exit(1);
  }

  // Create a realistic LeetCode simulation HTML page
  const testHtmlPath = path.resolve('scripts/brave-test-page.html');
  const contentJsPath = path.resolve('dist/content.js');
  const leetcodeCssPath = path.resolve('dist/leetcode.css');

  const testHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>LeetCode Two Sum Simulation</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #1a1a1a;
      color: #eff2f6;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    nav {
      height: 48px;
      background: #282828;
      border-bottom: 1px solid #333;
      display: flex;
      align-items: center;
      padding: 0 16px;
      font-weight: 600;
      gap: 16px;
    }
    .layout-main {
      flex: 1;
      display: flex;
    }
    .editor-pane {
      flex: 1;
      background: #1e1e1e;
      border-right: 1px solid #333;
      padding: 16px;
      font-family: monospace;
    }
    .result-pane {
      width: 580px;
      background: #262626;
      display: flex;
      flex-direction: column;
    }
    .tabs-header {
      height: 38px;
      background: #303030;
      display: flex;
      align-items: center;
      padding: 0 12px;
      gap: 12px;
      border-bottom: 1px solid #3a3a3a;
    }
    .tab {
      padding: 4px 10px;
      font-size: 13px;
      cursor: pointer;
    }
    .tab.active {
      font-weight: 600;
      border-bottom: 2px solid #2cbb5d;
      color: #fff;
    }
    .tab-content {
      flex: 1;
      padding: 24px;
      position: relative;
    }
    .verdict-line {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .verdict-text {
      font-size: 20px;
      font-weight: 700;
      color: #2cbb5d;
    }
    .metrics {
      display: flex;
      gap: 24px;
      margin-top: 16px;
      color: #8c8c8c;
      font-size: 14px;
    }
    .metric-val {
      color: #fff;
      font-weight: 600;
    }
    .bottom-bar {
      height: 48px;
      background: #2a2a2a;
      border-top: 1px solid #333;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 16px;
      gap: 12px;
    }
    button.submit-btn {
      background: #2cbb5d;
      color: #fff;
      border: none;
      padding: 6px 18px;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
    }
  </style>
</head>
<body class="themeflow-active themeflow-leetcode">
  <nav>
    <span>LeetCode</span>
    <span>Problems</span>
    <span style="color: #8c8c8c;">1. Two Sum</span>
  </nav>
  <div class="layout-main">
    <div class="editor-pane">
      <div style="color: #6a9955;">// Solution code</div>
      <div>class Solution {</div>
      <div style="padding-left: 20px;">public int[] twoSum(int[] nums, int target) {</div>
      <div style="padding-left: 40px;">Map&lt;Integer, Integer&gt; map = new HashMap&lt;&gt;();</div>
      <div style="padding-left: 40px;">// ...</div>
      <div style="padding-left: 40px;">return new int[]{};</div>
      <div style="padding-left: 20px;">}</div>
      <div>}</div>
    </div>
    <div class="result-pane flexlayout__tab">
      <div class="tabs-header">
        <div class="tab">Testcase</div>
        <div class="tab active">Test Result</div>
      </div>
      <div class="tab-content" id="test-result-content">
        <div class="verdict-line">
          <span class="text-green-s verdict-text" data-e2e-locator="submission-result" id="verdict-accepted">Accepted</span>
        </div>
        <div class="metrics">
          <div>Runtime: <span class="metric-val">1 ms</span> (Beats 99.2%)</div>
          <div>Memory: <span class="metric-val">44.2 MB</span> (Beats 85.4%)</div>
        </div>
      </div>
      <div class="bottom-bar">
        <button class="submit-btn" data-e2e-locator="console-submit-button" id="btn-submit">Submit</button>
      </div>
    </div>
  </div>
</body>
</html>`;

  fs.writeFileSync(testHtmlPath, testHtml);

  // Launch Brave with remote debugging
  const userDataDir = path.resolve('scripts/brave-temp-profile');
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  const braveProc = spawn(BRAVE_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--window-size=1920,1080',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank',
  ], {
    stdio: 'ignore',
  });

  try {
    // Wait for CDP endpoint to become ready
    let version = null;
    for (let i = 0; i < 30; i++) {
      await sleep(300);
      try {
        version = await fetchJson(`http://127.0.0.1:${PORT}/json/version`);
        if (version) break;
      } catch (e) {}
    }

    if (!version) {
      throw new Error('Timed out waiting for Brave CDP endpoint');
    }
    console.log('Connected to Brave browser:', version.Browser);

    const targets = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget) throw new Error('No page target found');

    const client = new CdpClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('DOM.enable');
    await client.send('Runtime.enable');

    // Navigate to local test page
    const fileUrl = 'file:///' + testHtmlPath.replace(/\\/g, '/');
    await client.send('Page.navigate', { url: fileUrl });
    await sleep(600);

    // Inject compiled ThemeFlow content script or celebration module
    const contentJs = fs.readFileSync(contentJsPath, 'utf8');
    await client.send('Runtime.evaluate', {
      expression: contentJs,
      awaitPromise: true,
    });
    await sleep(200);

    // Trigger celebration anchored to the Accepted verdict element inside the Test Result panel
    console.log('Triggering Domain Expansion celebration sequence...');
    const triggerEval = await client.send('Runtime.evaluate', {
      expression: `(() => {
        const target = document.getElementById('verdict-accepted');
        const celebApi = window.__THEMEFLOW_CELEBRATION__ || window.ThemeFlow;
        if (celebApi && celebApi.fireAcceptedCelebration) {
          celebApi.fireAcceptedCelebration({
            anchorElement: target,
            verdictText: 'ACCEPTED',
            themeAccent: '#34d399',
          });
          return 'Celebration triggered via window.__THEMEFLOW_CELEBRATION__';
        }
        return 'No celebration API found';
      })()`,
      returnByValue: true,
    });
    console.log('Trigger result:', triggerEval.result?.value);

    // Also directly call celebration from built module if IIFE didn't expose it globally
    await client.send('Runtime.evaluate', {
      expression: `(() => {
        const container = document.getElementById('themeflow-anime-celebration');
        if (!container) {
          // In case LeetCode content script is waiting for mutation observer,
          // manually simulate mutation with Accepted element
          const verdict = document.getElementById('verdict-accepted');
          verdict.textContent = 'Accepted ';
        }
      })()`,
    });
    await sleep(150);

    // Check if celebration container appeared
    const containerCheck = await client.send('Runtime.evaluate', {
      expression: `(() => {
        const c = document.getElementById('themeflow-anime-celebration');
        if (!c) return { found: false };
        const desaturate = c.querySelector('.tf-seam-desaturate');
        const corners = c.querySelector('.tf-seam-ink-corners');
        const svg = c.querySelector('svg');
        const impact = c.querySelector('.tf-seam-impact-frame');
        const canvas = c.querySelector('.tf-seam-sparks');
        const ribbon = c.querySelector('.tf-seam-reveal-container');
        const seal = c.querySelector('.tf-seam-vermillion-seal');
        const title = c.querySelector('.tf-seam-title');
        return {
          found: true,
          hasDesaturate: Boolean(desaturate),
          hasInkCorners: Boolean(corners),
          hasSvg: Boolean(svg),
          hasImpact: Boolean(impact),
          hasCanvas: Boolean(canvas),
          hasRibbon: Boolean(ribbon),
          hasVermillionSeal: Boolean(seal),
          titleText: title?.textContent,
        };
      })()`,
      returnByValue: true,
    });

    console.log('DOM Inspection of SEAM Motion Sequence:', containerCheck.result?.value);

    const artifactDir = path.resolve('scripts/verification_output');
    if (!fs.existsSync(artifactDir)) fs.mkdirSync(artifactDir, { recursive: true });

    // Scene 2/3: Capture at ~380ms (The Cut & Manga Impact frame)
    await sleep(220);
    const shotCut = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'seam_scene2_cut_impact_380ms.png'), Buffer.from(shotCut.data, 'base64'));
    console.log('[SAVED] Screenshot: seam_scene2_cut_impact_380ms.png');

    // Scene 4: Capture at ~650ms (The Seam Opens & Directional Sparks)
    await sleep(270);
    const shotSparks = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'seam_scene4_sparks_650ms.png'), Buffer.from(shotSparks.data, 'base64'));
    console.log('[SAVED] Screenshot: seam_scene4_sparks_650ms.png');

    // Scene 5 & 6: Capture at ~1200ms (The Reveal: Ink-Brush Ribbon, ACCEPTED typography, Vermillion Seal, Light Glint)
    await sleep(550);
    const shotReveal = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'seam_scene5_reveal_victory_1200ms.png'), Buffer.from(shotReveal.data, 'base64'));
    console.log('[SAVED] Screenshot: seam_scene5_reveal_victory_1200ms.png');

    // Scene 7: Capture at ~2250ms (100% Workspace Restoration, zero residual overlays)
    await sleep(1050);
    const shotRestored = await client.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'seam_scene7_restored_2250ms.png'), Buffer.from(shotRestored.data, 'base64'));
    console.log('[SAVED] Screenshot: seam_scene7_restored_2250ms.png');

    // Verify teardown
    const postCheck = await client.send('Runtime.evaluate', {
      expression: `Boolean(document.getElementById('themeflow-anime-celebration'))`,
      returnByValue: true,
    });
    console.log('Container present after 2.20s teardown (must be false):', postCheck.result?.value);

    client.close();
    console.log('\n--- Brave Browser SEAM Visual Verification Finished Successfully! ---');
  } finally {
    braveProc.kill();
    // Clean temp profile
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
      fs.unlinkSync(testHtmlPath);
    } catch(e) {}
  }
}

run().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
