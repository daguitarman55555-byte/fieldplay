import './styles.css';
import { forceContextCycle, runWebGLDiagnostics } from './webglDiagnostics';
import { getLivelySnapshot, subscribeToLively } from './livelyAdapter';

const root = document.querySelector('#gate0');
const canvas = document.createElement('canvas');
canvas.className = 'probe-canvas';

const runtime = {
  launchedAt: performance.timeOrigin,
  visibility: document.visibilityState,
  contextLossCount: 0,
  contextRecoveryMs: null,
  resizeEvents: 0,
  frameSamples: [],
  fps: 0,
  lively: getLivelySnapshot()
};

let diagnostics;
let contextLostAt = null;
let frameHandle;
let lastFrame = performance.now();
let lastRender = 0;

function environment() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: navigator.deviceMemory || null,
    language: navigator.language,
    online: navigator.onLine,
    cssWidth: window.innerWidth,
    cssHeight: window.innerHeight,
    backingWidth: canvas.width,
    backingHeight: canvas.height,
    devicePixelRatio: window.devicePixelRatio,
    screenWidth: screen.width,
    screenHeight: screen.height,
    colorDepth: screen.colorDepth,
    orientation: screen.orientation?.type || null
  };
}

function makeReport() {
  const tests = diagnostics?.tests || [];
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    environment: environment(),
    renderer: diagnostics?.renderer || {},
    capabilities: diagnostics?.extensions || {},
    limits: diagnostics?.limits || {},
    tests,
    summary: {
      hardPass: tests.filter(test => test.required).every(test => test.pass),
      requiredPassed: tests.filter(test => test.required && test.pass).length,
      requiredTotal: tests.filter(test => test.required).length,
      optionalAvailable: tests.filter(test => !test.required && test.pass).length
    },
    runtime: { ...runtime, frameSamples: runtime.frameSamples.slice(-120) },
    lively: runtime.lively
  };
}

function statusClass(test) {
  if (test.pass) return 'pass';
  return test.required ? 'fail' : 'soft';
}

function testMarkup(test) {
  const label = test.pass ? 'Pass' : test.required ? 'Fail' : 'Unavailable';
  return `<li class="test-row">
    <span class="status-dot ${statusClass(test)}" aria-hidden="true"></span>
    <span class="test-copy"><strong>${test.label}</strong><small>${test.details}</small></span>
    <span class="test-state ${statusClass(test)}">${label}</span>
  </li>`;
}

function render() {
  const report = makeReport();
  const hardPass = report.summary.hardPass;
  const gpu = runtime.lively.system?.CurrentGpu3D;
  const cpu = runtime.lively.system?.CurrentCpu;

  root.innerHTML = `
    <div class="ambient"></div>
    <section class="shell">
      <header class="masthead">
        <div>
          <p class="product">FIELDPLAY / PLATFORM PROBE</p>
          <h1>Gate 0</h1>
          <p class="lede">WebGL2, HDR accumulation, lifecycle, and Lively host diagnostics.</p>
        </div>
        <div class="verdict ${hardPass ? 'pass' : 'fail'}">
          <span>${hardPass ? 'READY' : 'BLOCKED'}</span>
          <strong>${report.summary.requiredPassed}/${report.summary.requiredTotal}</strong>
          <small>required checks</small>
        </div>
      </header>

      <div class="metric-strip">
        <article><span>FPS</span><strong>${runtime.fps || '—'}</strong><small>browser delivery</small></article>
        <article><span>GPU 3D</span><strong>${Number.isFinite(gpu) ? `${gpu.toFixed(0)}%` : '—'}</strong><small>${runtime.lively.detected ? 'Lively feed' : 'awaiting Lively'}</small></article>
        <article><span>CPU</span><strong>${Number.isFinite(cpu) ? `${cpu.toFixed(0)}%` : '—'}</strong><small>${runtime.lively.detected ? 'system pressure' : 'awaiting Lively'}</small></article>
        <article><span>DPR</span><strong>${window.devicePixelRatio.toFixed(2)}</strong><small>${window.innerWidth} × ${window.innerHeight} CSS</small></article>
      </div>

      <div class="grid">
        <section class="panel tests-panel">
          <div class="panel-heading"><h2>Capability tests</h2><span>${diagnostics?.durationMs.toFixed(1) || '—'} ms</span></div>
          <ul class="test-list">${(diagnostics?.tests || []).map(testMarkup).join('')}</ul>
        </section>

        <aside class="rail">
          <section class="panel">
            <div class="panel-heading"><h2>Renderer</h2></div>
            <dl class="facts">
              <div><dt>GPU</dt><dd>${diagnostics?.renderer.unmaskedRenderer || diagnostics?.renderer.renderer || 'Unavailable'}</dd></div>
              <div><dt>WebGL</dt><dd>${diagnostics?.renderer.version || 'Unavailable'}</dd></div>
              <div><dt>Texture ceiling</dt><dd>${diagnostics?.limits.MAX_TEXTURE_SIZE || '—'} px</dd></div>
              <div><dt>Draw buffers</dt><dd>${diagnostics?.limits.MAX_DRAW_BUFFERS ?? '—'}</dd></div>
            </dl>
          </section>
          <section class="panel">
            <div class="panel-heading"><h2>Runtime</h2><span class="live">LIVE</span></div>
            <dl class="facts">
              <div><dt>Visibility</dt><dd>${runtime.visibility}</dd></div>
              <div><dt>Lively</dt><dd>${runtime.lively.detected ? (runtime.lively.paused ? 'paused' : 'connected') : 'not detected'}</dd></div>
              <div><dt>Resize events</dt><dd>${runtime.resizeEvents}</dd></div>
              <div><dt>Context losses</dt><dd>${runtime.contextLossCount}</dd></div>
              <div><dt>Recovery</dt><dd>${runtime.contextRecoveryMs == null ? 'not tested' : `${runtime.contextRecoveryMs.toFixed(0)} ms`}</dd></div>
            </dl>
          </section>
        </aside>
      </div>

      <footer class="actions">
        <button class="primary" id="download-report">Download diagnostic report</button>
        <button id="copy-report">Copy JSON</button>
        <button id="context-cycle" ${diagnostics?.extensions.WEBGL_lose_context ? '' : 'disabled'}>Test context recovery</button>
        <button id="rerun">Run again</button>
        <a href="./index.html">Open original FieldPlay</a>
      </footer>
      <p id="notice" class="notice" role="status"></p>
    </section>`;

  document.querySelector('#download-report').onclick = downloadReport;
  document.querySelector('#copy-report').onclick = copyReport;
  document.querySelector('#rerun').onclick = run;
  document.querySelector('#context-cycle').onclick = testContextRecovery;
}

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(window.innerWidth * dpr));
  canvas.height = Math.max(1, Math.round(window.innerHeight * dpr));
}

function run() {
  resizeCanvas();
  diagnostics = runWebGLDiagnostics(canvas);
  render();
}

function showNotice(message) {
  const notice = document.querySelector('#notice');
  if (!notice) return;
  notice.textContent = message;
  window.setTimeout(() => { if (notice.textContent === message) notice.textContent = ''; }, 3500);
}

function downloadReport() {
  const blob = new Blob([JSON.stringify(makeReport(), null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `fieldplay-gate0-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  showNotice('Diagnostic report downloaded.');
}

async function copyReport() {
  try {
    await navigator.clipboard.writeText(JSON.stringify(makeReport(), null, 2));
    showNotice('Diagnostic JSON copied.');
  } catch {
    showNotice('Clipboard permission was denied. Use Download instead.');
  }
}

function testContextRecovery() {
  if (!diagnostics?.gl) return;
  const supported = forceContextCycle(diagnostics.gl, () => {
    contextLostAt = performance.now();
    runtime.contextLossCount += 1;
    render();
  }, () => {});
  if (!supported) showNotice('Context-loss extension is unavailable.');
}

canvas.addEventListener('webglcontextlost', event => {
  event.preventDefault();
});

canvas.addEventListener('webglcontextrestored', () => {
  runtime.contextRecoveryMs = contextLostAt == null ? null : performance.now() - contextLostAt;
  run();
  showNotice('WebGL context restored and diagnostics rerun.');
});

window.addEventListener('resize', () => {
  runtime.resizeEvents += 1;
  window.clearTimeout(window.__gate0ResizeTimer);
  window.__gate0ResizeTimer = window.setTimeout(run, 120);
});

window.addEventListener('fieldplay:lively-property', event => {
  if (event.detail?.name === 'runDiagnostics' && event.detail.value) run();
});

document.addEventListener('visibilitychange', () => {
  runtime.visibility = document.visibilityState;
  render();
});

subscribeToLively(value => {
  runtime.lively = value;
  render();
});

function sampleFrames(now) {
  const delta = now - lastFrame;
  lastFrame = now;
  if (delta > 0 && delta < 1000) runtime.frameSamples.push(delta);
  if (runtime.frameSamples.length > 240) runtime.frameSamples.shift();
  if (now - lastRender > 500) {
    const recent = runtime.frameSamples.slice(-30);
    runtime.fps = recent.length ? Math.round(1000 / (recent.reduce((a, b) => a + b, 0) / recent.length)) : 0;
    lastRender = now;
    render();
  }
  frameHandle = requestAnimationFrame(sampleFrames);
}

run();
frameHandle = requestAnimationFrame(sampleFrames);

window.addEventListener('beforeunload', () => cancelAnimationFrame(frameHandle));
