import { loadPyodide } from './python-runtime/pyodide.mjs';
import { PYTHON_HARNESS } from './python-harness.mjs';

self.onmessage = async ({ data: { id, source, checks } }) => {
  try {
    const python = await loadPyodide({ indexURL: new URL('./python-runtime/', import.meta.url).href });
    // Runtime assets are loaded locally before disabling network/storage APIs.
    for (const name of ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'Worker', 'SharedWorker', 'importScripts', 'indexedDB', 'caches']) {
      Object.defineProperty(globalThis, name, { value: undefined, writable: false, configurable: false });
    }
    python.globals.set('_codiva_payload', JSON.stringify({ source, checks }));
    self.postMessage({ id, phase: 'ready' });
    const result = JSON.parse(python.runPython(PYTHON_HARNESS));
    self.postMessage({ id, ...result });
  } catch (error) {
    self.postMessage({ id, logs: [], results: checks.map(check => ({ label: check.label, passed: false })), error: `Não foi possível preparar Python. Atualize a página e tente novamente. ${error.message}` });
  }
};
