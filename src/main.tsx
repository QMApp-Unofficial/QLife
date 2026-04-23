import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/700.css';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderFatal(message: string) {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  rootElement.innerHTML = `
    <div style="display:flex;min-height:100vh;align-items:center;justify-content:center;padding:16px;background:#0a090a;color:#f6ecda;font-family:Manrope,sans-serif;">
      <div style="max-width:720px;width:100%;border:1px solid rgba(255,255,255,0.08);background:rgba(12,11,12,0.78);backdrop-filter:blur(24px);border-radius:28px;padding:24px;box-shadow:0 24px 60px rgba(5,4,4,0.45);">
        <div style="font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:rgba(220,200,163,.62);">QLife startup error</div>
        <h1 style="margin:12px 0 0;font-family:'Cormorant Garamond',serif;font-size:48px;line-height:.94;color:#fff2df;">The activity failed to boot</h1>
        <p style="margin:14px 0 0;font-size:14px;line-height:1.9;color:rgba(228,211,184,.8);">
          QLife hit a runtime error before the game shell could render. The message below is the exact startup failure reported by the client.
        </p>
        <pre style="margin:18px 0 0;overflow:auto;white-space:pre-wrap;word-break:break-word;border-radius:24px;border:1px solid rgba(255,255,255,0.08);background:rgba(0,0,0,.24);padding:16px;font-size:12px;line-height:1.7;color:rgba(240,223,194,.9);">${escapeHtml(message)}</pre>
      </div>
    </div>
  `;
}

window.addEventListener('error', (event) => {
  const message = event.error instanceof Error ? event.error.stack ?? event.error.message : event.message;
  renderFatal(message || 'Unknown window error');
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const message =
    reason instanceof Error
      ? reason.stack ?? reason.message
      : typeof reason === 'string'
        ? reason
        : JSON.stringify(reason);
  renderFatal(message || 'Unhandled promise rejection');
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Missing root element.');
}

const root = createRoot(rootElement);
root.render(
  <div className="flex h-screen items-center justify-center bg-midnight-900 text-[#f6ecda]">
    <div className="panel-shell px-5 py-4">
      <div className="text-[11px] uppercase tracking-[0.28em] text-[#dcc8a3]/58">QLife</div>
      <div className="mt-1 font-display text-3xl">Booting the city</div>
    </div>
  </div>,
);

void import('./App')
  .then(({ default: App }) => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  })
  .catch((error) => {
    renderFatal(error instanceof Error ? error.stack ?? error.message : String(error));
  });
