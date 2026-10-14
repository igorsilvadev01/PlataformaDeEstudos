'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { lessonKey } from '../lib/progress.mjs';
import { checkPractice, previewDocument } from '../lib/html-practice.mjs';
import PracticeEditor from './PracticeEditor.jsx';
import { runJavaScript } from '../lib/js-practice.mjs';
import { runPython } from '../lib/python-practice.mjs';
import { checkLogicPractice } from '../lib/logic-practice.mjs';
import LogicPractice from './LogicPractice.jsx';
import { executionHint, practiceFeedback } from '../lib/practice-feedback.mjs';

export default function HtmlLessonDialog({ lessonState, onClose, onStart, onComplete, progress }) {
  const dialog = useRef(null);
  const content = useRef(null);
  const execution = useRef(null);
  const { course, index } = lessonState;
  const lesson = course.lessons[index];
  const isJavaScript = lesson.practice.language === 'javascript';
  const isPython = lesson.practice.language === 'python';
  const isLogic = lesson.practice.language === 'logic';
  const isConsole = isJavaScript || isPython;
  const module = course.modules.find(m => m.id === lesson.module);
  const draftKey = `codiva-draft-${lessonKey(course, index)}`;
  const [step, setStep] = useState(0);
  const [selection, setSelection] = useState(null);
  const [quizCorrect, setQuizCorrect] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [code, setCode] = useState(lesson.practice.starter);
  const [results, setResults] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [finished, setFinished] = useState(false);
  const [fresh, setFresh] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [logs, setLogs] = useState(null);
  const [running, setRunning] = useState(false);
  const [executionStatus, setExecutionStatus] = useState('Executando...');
  const deferredCode = useDeferredValue(code);
  const preview = useMemo(() => isConsole || isLogic ? '' : previewDocument(deferredCode), [deferredCode, isConsole, isLogic]);

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    try { const saved = localStorage.getItem(draftKey); if (saved !== null) setCode(saved); } catch { /* Progress remains usable without storage. */ }
    setDraftReady(true);
    return () => { execution.current?.abort(); if (element.open) element.close(); };
  }, [draftKey]);
  useEffect(() => {
    if (draftReady) { try { localStorage.setItem(draftKey, code); } catch { /* Session-only draft. */ } }
  }, [code, draftKey, draftReady]);
  useEffect(() => {
    content.current?.scrollTo(0, 0);
    content.current?.focus();
  }, [step, finished]);

  function verifyQuiz() {
    if (selection === null) { setFeedback('Escolha uma alternativa para verificar.'); return; }
    if (selection === lesson.answer) { setQuizCorrect(true); setFeedback(lesson.explain); }
    else setFeedback(`A alternativa “${lesson.options[selection]}” não corresponde ao conceito. Dica: ${lesson.explain} Tente escolher novamente.`);
  }
  function editCode(next) {
    execution.current?.abort();
    setRunning(false);
    setCode(next);
    setResults(null);
    setLogs(null);
    setFeedback('');
  }
  async function verifyCode(conclude = false) {
    execution.current?.abort();
    const controller = new AbortController();
    execution.current = controller;
    setExecutionStatus(isPython ? 'Preparando Python...' : 'Executando...');
    setRunning(true);
    const run = isLogic
      ? checkLogicPractice(code, lesson.practice)
      : isPython
      ? await runPython(code, lesson.practice.checks, { signal: controller.signal, onStatus: setExecutionStatus })
      : isJavaScript
      ? await runJavaScript(code, lesson.practice.checks, { signal: controller.signal })
      : { results: checkPractice(code, lesson.practice.checks), error: null };
    if (controller.signal.aborted) return;
    setRunning(false);
    setResults(practiceFeedback(code, lesson.practice, run));
    if (isConsole) setLogs(run.logs);
    const success = !run.error && run.results.every(result => result.passed);
    const correction = run.error && executionHint(run.error, lesson.practice.language);
    setFeedback(run.error ? `${run.error}${correction ? ` Dica: ${correction}` : ''}` : success ? 'Tudo certo! Sua solução atende aos objetivos. Você já pode concluir a lição.' : 'Veja a dica em cada objetivo pendente, ajuste sua solução e verifique novamente.');
    // Execute again on completion, and discard responses after edits or closing.
    if (conclude && quizCorrect && success) {
      setFresh(!progress.done.includes(lessonKey(course, index)));
      onComplete(course, index);
      setFinished(true);
    }
  }
  const passed = results?.every(result => result.passed);
  return <dialog className="html-dialog" ref={dialog} onCancel={onClose} aria-labelledby="html-lesson-title">
    <div className="lesson-head"><div><span className="lesson-step">{module.title} · {index + 1}/{course.lessons.length}</span><p className="lesson-level">{module.level} · 20 XP na primeira conclusão</p></div><button className="close" onClick={onClose} aria-label="Fechar lição">×</button></div>
    {!finished && <nav className="lesson-tabs" aria-label="Etapas da lição">{['Entenda', 'Responda', 'Pratique'].map((label, i) => <button key={label} className={step === i ? 'active' : ''} aria-current={step === i ? 'step' : undefined} disabled={running || i === 2 && !quizCorrect} onClick={() => { setStep(i); setFeedback(''); }}><span>{i + 1}</span>{label}{i === 1 && quizCorrect ? ' ✓' : ''}</button>)}</nav>}
    <div className="html-lesson-content" ref={content} tabIndex={-1}>
      {finished ? <div className="success"><div className="success-icon">✦</div><h2 id="html-lesson-title">{fresh ? 'Você construiu mais um passo!' : 'Revisão concluída!'}</h2><p>{fresh ? '+20 XP · Seu progresso foi atualizado.' : 'Conceito revisado e código praticado. Seu XP foi mantido.'}</p><div className="finished-next">{index < course.lessons.length - 1 ? <><small>PRÓXIMO PASSO</small><strong>{course.lessons[index + 1].title}</strong></> : <><strong>Trilha completa!</strong><p>{course.completionMessage || "Você começou com um título e terminou construindo uma página."}</p></>}</div><div className="success-actions">{index < course.lessons.length - 1 && <button className="primary" onClick={() => onStart(course, index + 1)}>Próxima lição →</button>}<button className="outline" onClick={onClose}>Voltar à trilha</button></div></div> : <>
        <div className="lesson-title-row"><div className="eyebrow">{['UM CONCEITO DE CADA VEZ', 'CONFIRA O QUE ENTENDEU', 'AGORA É COM VOCÊ'][step]}</div><h2 id="html-lesson-title">{lesson.title}</h2></div>
        {step === 0 && <><p className="lesson-intro">{lesson.intro}</p><ul className="concept-notes">{lesson.notes.map(note => <li key={note}>{note}</li>)}</ul><div className="example-label">VEJA UM EXEMPLO</div><pre className="lesson-code">{lesson.code}</pre><p className="lesson-help">Não precisa decorar. Você pode voltar a este exemplo durante o exercício.</p></>}
        {step === 1 && <><p className="lesson-intro">Escolha uma resposta. Se errar, tente novamente ou volte à explicação.</p><h3 className="quiz-question">{lesson.question}</h3><div className="answers">{lesson.options.map((option, i) => <button key={option} className={`answer ${selection === i ? 'selected' : ''}`} aria-pressed={selection === i} disabled={quizCorrect} onClick={() => { setSelection(i); setFeedback(''); }}><span className="option-letter">{String.fromCharCode(65 + i)}</span>{option}</button>)}</div></>}
        {step === 2 && (isLogic ? <LogicPractice lesson={lesson} code={code} onEdit={editCode} results={results} showHint={showHint} onHint={() => setShowHint(!showHint)} /> : <PracticeEditor language={isPython ? 'Python' : isJavaScript ? 'JavaScript' : 'HTML'} lesson={lesson} code={code} onEdit={editCode} preview={preview} logs={logs} running={running} executionStatus={executionStatus} results={results} showHint={showHint} onHint={() => setShowHint(!showHint)} />)}

        <div aria-live="polite">{feedback && <p className={`feedback ${step === 1 && quizCorrect || step === 2 && passed ? 'correct' : 'incorrect'}`}>{feedback}</p>}</div>
      </>}
    </div>
    {!finished && <div className="lesson-actions"><button className="text-button" disabled={step === 0 || running} onClick={() => { setStep(step - 1); setFeedback(''); }}>← {step === 2 ? 'Pergunta' : 'Conceito'}</button><button className="primary" disabled={running} onClick={step === 0 ? () => { setStep(1); setFeedback(''); } : step === 1 ? quizCorrect ? () => { setStep(2); setFeedback(''); } : verifyQuiz : () => verifyCode(Boolean(passed))}>{running ? executionStatus : step === 0 ? 'Entendi, vamos testar →' : step === 1 ? quizCorrect ? isLogic ? 'Praticar o raciocínio →' : 'Praticar com código →' : 'Verificar resposta' : passed ? 'Concluir lição ✓' : isLogic ? 'Verificar minha solução' : isConsole ? 'Executar e verificar' : 'Verificar meu código'}</button></div>}
  </dialog>;
}
