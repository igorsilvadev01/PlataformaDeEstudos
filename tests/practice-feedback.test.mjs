import test from 'node:test';
import assert from 'node:assert/strict';
import { executionHint, practiceFeedback } from '../lib/practice-feedback.mjs';
import { logicCourse } from '../lib/logic-course.mjs';
import { checkLogicPractice } from '../lib/logic-practice.mjs';
import { jsCourse } from '../lib/js-course.mjs';

test('logic feedback distinguishes missing, invalid and incorrect numeric answers', () => {
  const exercise = logicCourse.lessons.find(lesson => lesson.id === 'logic-variaveis').practice;
  for (const [answer, message] of [['', /ainda não respondeu/], ['abc', /apenas um número/], ['999', /Sua resposta “999”/]]) {
    const source = JSON.stringify({ answers: { b: answer } });
    const results = practiceFeedback(source, exercise, checkLogicPractice(source, exercise));
    assert.match(results[1].hint, message);
  }
});

test('ordering feedback identifies the first misplaced step and disappears after correction', () => {
  const exercise = logicCourse.lessons[0].practice;
  const results = practiceFeedback(exercise.starter, exercise, checkLogicPractice(exercise.starter, exercise));
  assert.match(results[0].hint, /posição 1/);
  const source = JSON.stringify({ order: exercise.checks[0].expected, answers: {} });
  const corrected = practiceFeedback(source, exercise, checkLogicPractice(source, exercise));
  assert.equal(corrected[0].passed, true);
  assert.equal(corrected[0].hint, undefined);
});

test('console feedback compares the actual output with the expected message', () => {
  const exercise = jsCourse.lessons[0].practice;
  const results = practiceFeedback('', exercise, { results: [{ passed: false }], logs: ['Olá, mundo!'], error: null });
  assert.match(results[0].hint, /O console mostrou: Olá, mundo!/);
  assert.match(results[0].hint, /O esperado é: Olá, JavaScript!/);
  assert.match(results[0].hint, /console.log/);
});

test('execution errors take priority over unverified objectives', () => {
  const exercise = jsCourse.lessons[0].practice;
  const run = { results: [{ passed: false }], error: 'Confira a sintaxe: Unexpected token' };
  assert.equal(practiceFeedback('', exercise, run), run.results);
  assert.match(executionHint(run.error, 'javascript'), /parênteses e as chaves/);
  assert.match(executionHint('Confira a indentação (linha 3)', 'python'), /quatro espaços/);
  assert.match(executionHint('Confira os nomes das variáveis: pontos is not defined', 'javascript'), /Declare a variável/);
  assert.equal(executionHint('Não foi possível carregar Python. Atualize a página.', 'python'), '');
});

test('per-objective runtime errors and existing HTML diagnostics are preserved', () => {
  const exercise = jsCourse.lessons[1].practice;
  const results = practiceFeedback('', exercise, { results: [{ passed: false, error: 'pontos is not defined' }, { passed: true }], error: null });
  assert.match(results[0].hint, /Declare a variável/);
  assert.equal(results[1].hint, undefined);
  const html = practiceFeedback('', { checks: [{}], hint: 'Dica geral' }, { results: [{ passed: false, hint: 'Adicione um h1.' }], error: null });
  assert.equal(html[0].hint, 'Adicione um h1.');
});
