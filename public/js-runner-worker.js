// Each run gets a disposable worker; no document or access to page storage.
for (const name of ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'Worker', 'SharedWorker', 'importScripts', 'indexedDB', 'caches']) {
  Object.defineProperty(globalThis, name, { value: undefined, writable: false, configurable: false });
}

function equal(a, b) {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every(key => Object.hasOwn(b, key) && equal(a[key], b[key]));
}
function line(value) {
  if (typeof value === 'string') return value;
  if (value === undefined) return 'undefined';
  try { return JSON.stringify(value) ?? String(value); } catch { return String(value); }
}
function equalOutput(a, b) {
  if (a === b) return true;
  try { return equal(JSON.parse(a), JSON.parse(b)); } catch { return false; }
}

self.onmessage = ({ data }) => {
  const { source, checks, id } = data;
  const logs = [];
  const capturedConsole = {};
  for (const name of ['log', 'info', 'warn', 'error']) capturedConsole[name] = (...args) => {
    if (logs.length >= 100) throw new Error('Muitas mensagens no console. Reduza as repetições.');
    logs.push(args.map(line).join(' ').slice(0, 4000));
  };
  try {
    const expressions = checks.map(check => check.expression
      ? `(() => { try { return { actual: (${check.expression}) }; } catch (error) { return { error: error.message }; } })()`
      : 'null');
    // Probes share the learner's lexical scope, including let/const declarations.
    // Snapshot logs before probes, so test calls do not change the displayed output.
    const execute = new Function('console', `"use strict";\n${source}\n;return { output: __codivaSnapshot(), values: [${expressions.join(',')}] };`);
    Object.defineProperty(globalThis, '__codivaSnapshot', { value: () => logs.slice() });
    const run = execute(capturedConsole);
    const results = checks.map((check, index) => ({
      label: check.label,
      passed: check.output
        ? run.output.length === check.output.length && run.output.every((text, i) => equalOutput(text, check.output[i]))
        : !run.values[index].error && equal(run.values[index].actual, check.expected),
      error: run.values[index]?.error,
    }));
    self.postMessage({ id, logs: run.output, results, error: null });
  } catch (error) {
    const prefix = error.name === 'SyntaxError' ? 'Confira a sintaxe' : error.name === 'ReferenceError' ? 'Confira os nomes das variáveis' : 'Não foi possível executar';
    self.postMessage({ id, logs, results: checks.map(check => ({ label: check.label, passed: false })), error: `${prefix}: ${error.message}` });
  }
};
