export function readLogicDraft(source, exercise) {
  try {
    const draft = JSON.parse(source);
    const valid = exercise.steps.map(step => step.id);
    const order = Array.isArray(draft?.order) && draft.order.length === valid.length && new Set(draft.order).size === valid.length && draft.order.every(id => valid.includes(id)) ? draft.order : JSON.parse(exercise.starter).order;
    const answers = draft?.answers && typeof draft.answers === 'object' && !Array.isArray(draft.answers) ? draft.answers : {};
    return { order, answers };
  } catch { return JSON.parse(exercise.starter); }
}

export function checkLogicPractice(source, exercise) {
  const draft = readLogicDraft(source, exercise);
  const results = exercise.checks.map(check => {
    if (check.type === 'order') return { label: check.label, passed: draft.order.length === check.expected.length && draft.order.every((id, index) => id === check.expected[index]) };
    const answer = draft.answers[check.field];
    const text = typeof answer === 'string' || typeof answer === 'number' ? String(answer).trim() : '';
    const passed = check.type === 'number'
      ? /^-?\d+(?:[.,]\d+)?$/.test(text) && Number(text.replace(',', '.')) === check.expected
      : text === check.expected;
    return { label: check.label, passed };
  });
  return { results, error: null };
}
