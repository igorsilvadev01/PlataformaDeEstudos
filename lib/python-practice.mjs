export function runPython(source, checks, { signal, timeout = 1500, loadTimeout = 30000, onStatus } = {}) {
  const failed = error => ({ logs: [], results: checks.map(check => ({ label: check.label, passed: false })), error });
  if (source.length > 20000) return Promise.resolve(failed('Use até 20.000 caracteres neste exercício.'));
  if (signal?.aborted) return Promise.resolve(failed('Execução cancelada.'));
  return new Promise(resolve => {
    let worker;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    try { worker = new Worker(`${basePath}/python-runner-worker.mjs`, { type: 'module' }); }
    catch { resolve(failed('Não foi possível abrir o interpretador. Atualize a página e tente novamente.')); return; }
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
      if (done || data.id !== id) return;
      if (data.phase === 'ready') {
        clearTimeout(timer);
        onStatus?.('Executando...');
        timer = setTimeout(() => finish(failed('O código demorou demais. Confira se seu laço tem uma condição de parada.')), timeout);
      } else if (Array.isArray(data.logs) && Array.isArray(data.results)) finish(data);
    };
    worker.onerror = event => { event.preventDefault(); finish(failed('Não foi possível carregar Python. Atualize a página e tente novamente.')); };
    onStatus?.('Preparando Python...');
    timer = setTimeout(() => finish(failed('Python demorou para carregar. Confira sua conexão com o site e tente novamente.')), loadTimeout);
    worker.postMessage({ id, source, checks });
  });
}
