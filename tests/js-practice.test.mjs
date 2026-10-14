import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import { jsCourse } from '../lib/js-course.mjs';
import { initialProgress, restoreProgress, completedCount, lessonKey, completeLesson } from '../lib/progress.mjs';

const worker = fs.readFileSync(new URL('../public/js-runner-worker.js', import.meta.url), 'utf8');
export const projectSolution = 'function planejarEstudo(aulas, metaDiaria) {\n  if (metaDiaria <= 0) return null;\n  let minutos = 0;\n  for (const aula of aulas) minutos += aula.minutos;\n  return { minutos, dias: Math.ceil(minutos / metaDiaria) };\n}\nconst aulas = [{ minutos: 10 }, { minutos: 25 }];\nconsole.log(planejarEstudo(aulas, 10));';
const solutions = {
  'js-console': 'console.log("Olá, JavaScript!");',
  'js-switch': 'const dia = "terça"; switch (dia) { case "terça": console.log("Estudar JavaScript"); break; default: console.log("Revisar"); }',
  'js-projeto-final': projectSolution,
};

function execute(source, checks) {
  let result;
  const context = vm.createContext({ self: { postMessage: value => { result = value; } }, input: { source, checks, id: 'test' } });
  vm.runInContext(worker, context, { timeout: 500 });
  vm.runInContext('self.onmessage({ data: input })', context, { timeout: 500 });
  return JSON.parse(JSON.stringify(result));
}

test('every JavaScript lesson has a working solution and requires changing its starter', () => {
  for (const lesson of jsCourse.lessons) {
    const solution = execute(solutions[lesson.id] || lesson.code, lesson.practice.checks);
    assert.equal(solution.error, null, lesson.id);
    assert.ok(solution.results.every(result => result.passed), `${lesson.id}: ${JSON.stringify(solution.results)}`);
    const starter = execute(lesson.practice.starter, lesson.practice.checks);
    assert.ok(!starter.results.every(result => result.passed), `${lesson.id} must require work`);
  }
});
test('functions must work for more than the displayed example', () => {
  const checks = jsCourse.lessons.find(lesson => lesson.id === 'js-2').practice.checks;
  const result = execute('function dobro(numero) { return 8; } console.log(dobro(4));', checks);
  assert.equal(result.results[0].passed, true);
  assert.equal(result.results[1].passed, false);
  assert.equal(result.results[2].passed, false);
});
test('runtime errors and missing variables produce useful feedback without completion', () => {
  const lesson = jsCourse.lessons[0];
  for (const source of ['const = 1;', 'console.log(naoExiste);', 'throw new Error("Tente novamente");']) {
    const result = execute(source, lesson.practice.checks);
    assert.ok(result.error);
    assert.ok(result.results.every(check => !check.passed));
  }
});
test('worker has no document and disables network and persistent storage APIs', () => {
  const checks = [{ label: 'No page APIs', expression: '[typeof document, typeof localStorage, typeof fetch, typeof indexedDB, typeof Worker, typeof importScripts]', expected: Array(6).fill('undefined') }];
  assert.equal(execute('', checks).results[0].passed, true);
});
test('test probes do not pollute the learner console, and object key order is accepted', () => {
  const checks = [{ label: 'Function result', expression: 'somar(2, 3)', expected: 5 }, { label: 'Output', output: ['{"minutos":35,"dias":4}'] }];
  const result = execute('function somar(a,b) { console.log("probe"); return a+b; } console.log({dias:4,minutos:35});', checks);
  assert.deepEqual(result.logs, ['{"dias":4,"minutos":35}']);
  assert.ok(result.results.every(check => check.passed));
});
test('JavaScript expands to six modules while preserving all three old lesson IDs', () => {
  assert.equal(jsCourse.lessons.length, 24);
  for (const module of jsCourse.modules) assert.equal(jsCourse.lessons.filter(lesson => lesson.module === module.id).length, 4);
  const old = restoreProgress({ ...initialProgress, done: ['js-0', 'js-1', 'js-2'] });
  assert.equal(completedCount(jsCourse, old), 3);
  assert.deepEqual(jsCourse.lessons.filter(lesson => old.done.includes(lesson.id)).map(lesson => lesson.title), ['Guardando informações', 'Tomando decisões', 'Sua primeira função']);
  assert.equal(lessonKey(jsCourse, 0), 'js-console');
  assert.strictEqual(completeLesson(old, jsCourse, jsCourse.lessons.findIndex(l => l.id === 'js-2')), old);
});
