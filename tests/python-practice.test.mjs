import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPyodide } from 'pyodide';
import { PYTHON_HARNESS } from '../public/python-harness.mjs';
import { pythonCourse } from '../lib/python-course.mjs';
import { pythonSolutions } from './python-solutions.mjs';
import { initialProgress, restoreProgress, completedCount, completeLesson, lessonKey } from '../lib/progress.mjs';

const python = await loadPyodide();
function execute(source, checks) {
  python.globals.set('_codiva_payload', JSON.stringify({ source, checks }));
  return JSON.parse(python.runPython(PYTHON_HARNESS));
}

test('all 24 Python lessons have working solutions and incomplete starters', () => {
  for (const lesson of pythonCourse.lessons) {
    const solution = execute(pythonSolutions[lesson.id], lesson.practice.checks);
    assert.equal(solution.error, null, lesson.id);
    assert.ok(solution.results.every(result => result.passed), `${lesson.id}: ${JSON.stringify(solution.results)}`);
    const starter = execute(lesson.practice.starter, lesson.practice.checks);
    assert.ok(!starter.results.every(result => result.passed), `${lesson.id}: starter requires work`);
  }
});
test('Python functions must support different inputs and empty lists', () => {
  const checks = pythonCourse.lessons.find(l => l.id === 'py-funcao').practice.checks;
  const result = execute('def dobro(numero):\n    return 8\nprint(dobro(4))', checks);
  assert.deepEqual(result.results.map(r => r.passed), [true, false, false, true]);
});
test('indentation, syntax and unknown names produce actionable errors', () => {
  const checks = pythonCourse.lessons[0].practice.checks;
  for (const [source, expected] of [
    ['if True:\nprint("Olá")', /indentação.*linha 2/],
    ['print("Olá"', /sintaxe.*linha 1/],
    ['print(nao_existe)', /nomes das variáveis.*linha 1/],
    ['input("Nome")', /input\(\) não está disponível/],
  ]) {
    const result = execute(source, checks);
    assert.match(result.error, expected);
    assert.ok(result.results.every(r => !r.passed));
  }
});
test('each Python execution has fresh variables and tests do not pollute console output', () => {
  execute('nome = "Ana"', []);
  assert.match(execute('print(nome)', []).error, /nomes das variáveis/);
  const result = execute('def dobro(n):\n    print("teste")\n    return n * 2\nprint("pronto")', [{ label: 'Function', expression: 'dobro(4)', expected: 8 }, { label: 'Console', output: ['pronto'] }]);
  assert.deepEqual(result.logs, ['pronto']);
  assert.ok(result.results.every(r => r.passed));
});
test('console output is bounded and Python imports are unavailable in this beginner editor', () => {
  assert.match(execute('for i in range(200):\n    print(i)', []).error, /Muitas mensagens/);
  assert.match(execute('import js', []).error, /sem importação de pacotes/);
});
test('Python type comparisons distinguish True from 1 and allow dictionary key reordering', () => {
  assert.equal(execute('valor = 1', [{ label: 'Boolean', expression: 'valor', expected: true }]).results[0].passed, false);
  assert.equal(execute('valor = {"saldo": 10, "total": 40}', [{ label: 'Object', expression: 'valor', expected: { total: 40, saldo: 10 } }]).results[0].passed, true);
});
test('Python has six modules and retains original print, list and for completions', () => {
  assert.equal(pythonCourse.lessons.length, 24);
  for (const module of pythonCourse.modules) assert.equal(pythonCourse.lessons.filter(l => l.module === module.id).length, 4);
  const old = restoreProgress({ ...initialProgress, done: ['py-0', 'py-1', 'py-2'] });
  assert.equal(completedCount(pythonCourse, old), 3);
  assert.deepEqual(pythonCourse.lessons.filter(l => old.done.includes(l.id)).map(l => l.title), ['Olá, Python!', 'Trabalhando com listas', 'Repetindo com for']);
  assert.equal(lessonKey(pythonCourse, 1), 'py-variaveis');
  assert.strictEqual(completeLesson(old, pythonCourse, pythonCourse.lessons.findIndex(l => l.id === 'py-1')), old);
});
