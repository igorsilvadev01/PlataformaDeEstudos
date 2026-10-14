import test from 'node:test';
import assert from 'node:assert/strict';
import { logicCourse } from '../lib/logic-course.mjs';
import { checkLogicPractice, readLogicDraft } from '../lib/logic-practice.mjs';
import { initialProgress, restoreProgress, completedCount, lessonKey, completeLesson } from '../lib/progress.mjs';

const solution = exercise => JSON.stringify({ order: exercise.steps.map(step => step.id), answers: Object.fromEntries(exercise.fields.map(field => [field.id, String(field.expected)])) });

test('all 24 logic lessons require practice and accept their correct solutions', () => {
  assert.equal(logicCourse.lessons.length, 24);
  assert.equal(logicCourse.modules.length, 6);
  for (const module of logicCourse.modules) assert.equal(logicCourse.lessons.filter(l => l.module === module.id).length, 4);
  for (const lesson of logicCourse.lessons) {
    const exercise = lesson.practice;
    assert.ok(exercise.checks.length, lesson.id);
    assert.ok(!checkLogicPractice(exercise.starter, exercise).results.every(r => r.passed), `${lesson.id}: starter must require work`);
    assert.ok(checkLogicPractice(solution(exercise), exercise).results.every(r => r.passed), `${lesson.id}: valid solution`);
    assert.ok(lesson.notes.length);
    assert.ok(exercise.hint);
  }
});
test('empty numeric input does not count as zero and invalid numbers are rejected', () => {
  const exercise = logicCourse.lessons.find(l => l.id === 'logic-variaveis').practice;
  for (const answer of ['', ' ', null, [], false, 'abc', '0abc', 'Infinity', '1e4']) {
    const result = checkLogicPractice(JSON.stringify({ order: [], answers: { b: answer } }), exercise);
    assert.equal(result.results[1].passed, false, String(answer));
  }
  assert.equal(checkLogicPractice(JSON.stringify({ answers: { b: '0' } }), exercise).results[1].passed, true);
});
test('numeric fields accept surrounding whitespace, negatives and equivalent decimal formatting', () => {
  const exercise = logicCourse.lessons.find(l => l.id === 'logic-maior').practice;
  const result = checkLogicPractice(JSON.stringify({ answers: { a: ' 8 ', b: '-2', c: '4,0' } }), exercise);
  assert.ok(result.results.every(r => r.passed));
});
test('duplicate, unknown and malformed step IDs cannot satisfy the ordering exercise', () => {
  const exercise = logicCourse.lessons[0].practice;
  for (const order of [['step-0', 'step-0', 'step-2'], ['step-0', 'step-1', 'unknown'], ['step-0'], null]) {
    const result = checkLogicPractice(JSON.stringify({ order }), exercise);
    assert.equal(result.results[0].passed, false);
  }
  for (const malformed of ['{', 'null', '[]']) {
    assert.deepEqual(readLogicDraft(malformed, exercise), JSON.parse(exercise.starter));
  }
});
test('logic conditions distinguish greater-than from greater-than-or-equal', () => {
  const exercise = logicCourse.lessons.find(l => l.id === 'logic-comparacoes').practice;
  const valid = JSON.parse(solution(exercise));
  valid.answers.b = 'Verdadeiro';
  const result = checkLogicPractice(JSON.stringify(valid), exercise);
  assert.deepEqual(result.results.map(r => r.passed), [true, false, true, true]);
});
test('final project requires both its algorithm and all three scenarios', () => {
  const exercise = logicCourse.lessons.at(-1).practice;
  const valid = JSON.parse(solution(exercise));
  valid.order.reverse();
  assert.equal(checkLogicPractice(JSON.stringify(valid), exercise).results[0].passed, false);
  valid.order.reverse();
  delete valid.answers['c-total'];
  assert.ok(!checkLogicPractice(JSON.stringify(valid), exercise).results.every(r => r.passed));
});
test('original algorithm, truth and pattern completions keep their original meaning', () => {
  const old = restoreProgress({ ...initialProgress, done: ['logic-0', 'logic-1', 'logic-2'] });
  assert.equal(completedCount(logicCourse, old), 3);
  assert.deepEqual(logicCourse.lessons.filter(l => old.done.includes(l.id)).map(l => l.title), ['Passo a passo', 'Encontrando padrões', 'Verdadeiro ou falso']);
  assert.equal(lessonKey(logicCourse, 1), 'logic-entrada-saida');
  assert.strictEqual(completeLesson(old, logicCourse, logicCourse.lessons.findIndex(l => l.id === 'logic-1')), old);
});
