import test from 'node:test';
import assert from 'node:assert/strict';
import { courses } from '../lib/courses.mjs';
import { initialProgress, restoreProgress, completeLesson, completedCount, studyStreak, lessonKey, foundationLessons, foundationCount, foundationComplete, developmentUnlocked } from '../lib/progress.mjs';

test('restores the original prototype storage without losing progress', () => {
  const old = { name: 'Igor', goal: 15, done: ['html-0', 'js-1'], dates: ['2026-10-07'], todayMinutes: 6 };
  assert.deepEqual(restoreProgress(old), old);
});
test('sanitizes stale or malformed persisted progress', () => {
  const progress = restoreProgress({ name: 12, goal: -1, done: ['html-0', 'html-0', 'invalid'], dates: [null], todayMinutes: -1 });
  assert.equal(progress.name, 'Aprendiz');
  assert.equal(progress.goal, 10);
  assert.deepEqual(progress.done, ['html-0']);
  assert.deepEqual(progress.dates, []);
  assert.equal(progress.todayMinutes, 0);
});
test('completing all lessons awards XP once and reviewing gives no additional credit', () => {
  let progress = { ...initialProgress };
  for (const course of courses) for (let i = 0; i < course.lessons.length; i++) progress = completeLesson(progress, course, i, '2026-10-07');
  const total = courses.reduce((sum, course) => sum + course.lessons.length, 0);
  assert.equal(progress.done.length * 20, total * 20);
  assert.equal(progress.todayMinutes, total * 3);
  assert.equal(completedCount(courses[0], progress), courses[0].lessons.length);
  assert.strictEqual(completeLesson(progress, courses[0], 0, '2026-10-08'), progress);
});
test('new study day resets daily minutes while preserving previous days', () => {
  const first = completeLesson(initialProgress, courses[0], 0, '2026-10-07');
  const next = completeLesson(first, courses[0], 1, '2026-10-08');
  assert.equal(next.todayMinutes, 3);
  assert.deepEqual(next.dates, ['2026-10-07', '2026-10-08']);
  assert.equal(studyStreak(next, new Date(2026, 9, 8, 12)), 2);
  assert.equal(studyStreak(next, new Date(2026, 9, 9, 12)), 2);
  assert.equal(studyStreak(next, new Date(2026, 9, 10, 12)), 0);
});
test('every lesson has a valid answer and stable storage key', () => {
  const keys = courses.flatMap(c => c.lessons.map((_, index) => lessonKey(c, index)));
  assert.equal(new Set(keys).size, keys.length);
  for (const course of courses) for (const lesson of course.lessons) {
    assert.ok(Number.isInteger(lesson.answer));
    assert.ok(lesson.answer >= 0 && lesson.answer < lesson.options.length);
    assert.ok(lesson.explain);
  }
});

test('development unlocks after the first two modules of any chosen course', () => {
  const course = courses[0];
  const basics = foundationLessons(course);
  assert.equal(basics.length, 8);
  let progress = { ...initialProgress };
  for (let index = 0; index < basics.length - 1; index++) progress = completeLesson(progress, course, index, '2026-10-07');
  assert.equal(foundationCount(course, progress), 7);
  assert.equal(foundationComplete(course, progress), false);
  assert.equal(developmentUnlocked(progress), false);
  progress = completeLesson(progress, course, basics.length - 1, '2026-10-07');
  assert.equal(foundationComplete(course, progress), true);
  assert.equal(developmentUnlocked(progress), true);
});

test('expanded HTML preserves the original title, CSS and link lesson completions', () => {
  const html = courses.find(course => course.id === 'html');
  const old = restoreProgress({ ...initialProgress, done: ['html-0', 'html-1', 'html-2'] });
  assert.equal(completedCount(html, old), 3);
  const oldLessons = html.lessons.filter(lesson => old.done.includes(lesson.id));
  assert.deepEqual(oldLessons.map(lesson => lesson.title), ['Seu primeiro HTML', 'Conectando páginas', 'Um toque de cor']);
  assert.equal(lessonKey(html, 1), 'html-paragrafos');
  const cssIndex = html.lessons.findIndex(lesson => lesson.id === 'html-1');
  assert.strictEqual(completeLesson(old, html, cssIndex), old);
});

test('HTML has six progressive modules with practice objectives for every lesson', () => {
  const html = courses.find(course => course.id === 'html');
  assert.equal(html.lessons.length, 24);
  assert.equal(html.modules.length, 6);
  for (const module of html.modules) {
    assert.equal(html.lessons.filter(lesson => lesson.module === module.id).length, 4);
  }
  for (const lesson of html.lessons) {
    assert.ok(lesson.notes.length);
    assert.ok(lesson.practice.task);
    assert.ok(lesson.practice.hint);
    assert.ok(lesson.practice.checks.length);
    assert.equal(typeof lesson.practice.starter, 'string');
  }
});
