import test from 'node:test';
import assert from 'node:assert/strict';
import { courses } from '../lib/courses.mjs';
import { initialProgress, restoreProgress, completeLesson, completedCount, studyStreak } from '../lib/progress.mjs';

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
test('completing all lessons gives 240 XP and reviewing gives no additional credit', () => {
  let progress = { ...initialProgress };
  for (const course of courses) for (let i = 0; i < course.lessons.length; i++) progress = completeLesson(progress, course, i, '2026-10-07');
  assert.equal(progress.done.length * 20, 240);
  assert.equal(progress.todayMinutes, 36);
  assert.equal(completedCount(courses[0], progress), 3);
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
  assert.equal(courses.flatMap(c => c.lessons).length, 12);
  for (const course of courses) for (const lesson of course.lessons) {
    assert.ok(Number.isInteger(lesson.answer));
    assert.ok(lesson.answer >= 0 && lesson.answer < lesson.options.length);
    assert.ok(lesson.explain);
  }
});
