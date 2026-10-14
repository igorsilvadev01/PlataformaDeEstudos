import { courses } from './courses.mjs';

export const STORAGE_KEY = 'codiva-progress';
export const initialProgress = { name: 'Aprendiz', goal: 10, done: [], dates: [], todayMinutes: 0 };
export const lessonKey = (course, index) => course.lessons[index]?.id || `${course.id}-${index}`;
export const completedCount = (course, progress) => course.lessons.filter((_, i) => progress.done.includes(lessonKey(course, i))).length;
export const dateKey = (date = new Date()) => date.toLocaleDateString('sv-SE');
export const foundationLessons = course => {
  const moduleIds = new Set((course.modules || []).slice(0, 2).map(module => module.id));
  return course.lessons.filter(lesson => moduleIds.size === 0 || moduleIds.has(lesson.module));
};
export const foundationCount = (course, progress) => foundationLessons(course).filter(lesson => progress.done.includes(lesson.id)).length;
export const foundationComplete = (course, progress) => foundationCount(course, progress) === foundationLessons(course).length;
export const developmentUnlocked = progress => courses.some(course => foundationComplete(course, progress));

export function restoreProgress(value) {
  if (!value || typeof value !== 'object') return { ...initialProgress };
  const validKeys = new Set(courses.flatMap(c => c.lessons.map((_, i) => lessonKey(c, i))));
  return {
    name: typeof value.name === 'string' && value.name.trim() ? value.name.trim().slice(0, 30) : initialProgress.name,
    goal: [5, 10, 15, 20].includes(value.goal) ? value.goal : initialProgress.goal,
    done: Array.isArray(value.done) ? [...new Set(value.done.filter(k => validKeys.has(k)))] : [],
    dates: Array.isArray(value.dates) ? [...new Set(value.dates.filter(d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)))] : [],
    todayMinutes: Number.isFinite(value.todayMinutes) && value.todayMinutes >= 0 ? value.todayMinutes : 0,
  };
}

export function completeLesson(progress, course, index, today = dateKey()) {
  if (!course.lessons[index]) return progress;
  const key = lessonKey(course, index);
  if (progress.done.includes(key)) return progress;
  const sameDay = progress.dates.includes(today);
  return {
    ...progress,
    done: [...progress.done, key],
    dates: sameDay ? progress.dates : [...progress.dates, today],
    todayMinutes: (sameDay ? progress.todayMinutes : 0) + 3,
  };
}

export function studyStreak(progress, now = new Date()) {
  let count = 0;
  const date = new Date(now);
  if (!progress.dates.includes(dateKey(date))) date.setDate(date.getDate() - 1);
  while (progress.dates.includes(dateKey(date))) {
    count++;
    date.setDate(date.getDate() - 1);
  }
  return count;
}
