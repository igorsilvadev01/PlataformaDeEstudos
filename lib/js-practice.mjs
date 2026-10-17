export function runJavaScript(source, checks, { signal, timeout = 1500 } = {}) {
  const failed = message => ({ logs: [], results: checks.map(check => ({ label: check.label, passed: false })), error: message });
  if (source.length > 20000) return Promise.resolve(failed('Use até 20.000 caracteres neste exercício.'));
  if (signal?.aborted) return Promise.resolve(failed('Execução cancelada.'));
  return new Promise(resolve => {
    let worker;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    try { worker = new Worker(`${basePath}/js-runner-worker.js`); }
    catch { resolve(failed('Não foi possível abrir o executor. Atualize a página e tente novamente.')); return; }
    const id = crypto.randomUUID();
    let done = false;
    let timer;
    function finish(result) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      worker.terminate();
      resolve(result);
    }
    const abort = () => finish(failed('Execução cancelada.'));
    signal?.addEventListener('abort', abort, { once: true });
    worker.onmessage = ({ data }) => {
      if (data.id === id && Array.isArray(data.logs) && Array.isArray(data.results)) finish(data);
    };
    worker.onerror = event => { event.preventDefault(); finish(failed('O executor encontrou um erro. Confira o código e tente novamente.')); };
    timer = setTimeout(() => finish(failed('O código demorou demais. Confira se seu laço tem uma condição de parada.')), timeout);
    worker.postMessage({ id, source, checks });
  });
}
