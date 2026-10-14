import { copyFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const source = dirname(require.resolve('pyodide/package.json'));
const target = fileURLToPath(new URL('../public/python-runtime/', import.meta.url));
await mkdir(target, { recursive: true });
for (const name of ['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']) {
  await copyFile(join(source, name), join(target, name));
}
console.log('Interpretador Python preparado para desenvolvimento e exportação.');
