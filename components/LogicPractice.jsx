import { useRef, useState } from 'react';
import { readLogicDraft } from '../lib/logic-practice.mjs';

export default function LogicPractice({ lesson, code, onEdit, results, showHint, onHint }) {
  const exercise = lesson.practice;
  const draft = readLogicDraft(code, exercise);
  const [announcement, setAnnouncement] = useState('');
  const controls = useRef({});
  function move(id, direction) {
    const index = draft.order.indexOf(id);
    const target = index + direction;
    if (target < 0 || target >= draft.order.length) return;
    const order = [...draft.order];
    [order[index], order[target]] = [order[target], order[index]];
    onEdit(JSON.stringify({ ...draft, order }));
    setAnnouncement(`Passo movido para a posição ${target + 1}.`);
    requestAnimationFrame(() => {
      const preferred = controls.current[`${id}-${direction}`];
      const alternative = controls.current[`${id}-${-direction}`];
      (preferred && !preferred.disabled ? preferred : alternative)?.focus();
    });
  }
  return <>
    <p className="practice-task">{exercise.task}</p>
    <div className="editor-toolbar"><span>Resolva um passo de cada vez. Depois, confira seus resultados.</span><div><button className="text-button" aria-expanded={showHint} onClick={onHint}>{showHint ? 'Ocultar dica' : 'Preciso de uma dica'}</button><button className="text-button" onClick={() => { onEdit(exercise.starter); setAnnouncement('Exercício reiniciado.'); }}>Recomeçar</button></div></div>
    {showHint && <p className="practice-hint">{exercise.hint}</p>}
    {exercise.steps.length > 0 && <section className="logic-section" aria-labelledby="order-title"><div className="logic-section-head"><span className="logic-section-icon" aria-hidden="true">↕</span><div><h3 id="order-title">Monte a sequência</h3><p>Use as setas para subir ou descer cada passo.</p></div></div><ol className="logic-steps">{draft.order.map((id, index) => {
      const step = exercise.steps.find(item => item.id === id);
      return <li key={id}><span className="logic-position">{index + 1}</span><span className="logic-step-text">{step.text}</span><div className="logic-move-controls"><button ref={node => { controls.current[`${id}--1`] = node; }} className="logic-move" disabled={index === 0} onClick={() => move(id, -1)} aria-label={`Subir: ${step.text}`}>↑</button><button ref={node => { controls.current[`${id}-1`] = node; }} className="logic-move" disabled={index === draft.order.length - 1} onClick={() => move(id, 1)} aria-label={`Descer: ${step.text}`}>↓</button></div></li>;
    })}</ol><p className="logic-announcement" role="status">{announcement}</p></section>}
    {exercise.fields.length > 0 && <section className="logic-section" aria-labelledby="scenario-title"><div className="logic-section-head"><span className="logic-section-icon" aria-hidden="true">?</span><div><h3 id="scenario-title">Teste seu raciocínio</h3><p>Preencha cada resultado usando a regra da lição.</p></div></div><div className="logic-fields">{exercise.fields.map((field, index) => {
      const answer = draft.answers[field.id];
      const current = typeof answer === 'string' || typeof answer === 'number' ? String(answer) : '';
      const update = value => onEdit(JSON.stringify({ ...draft, answers: { ...draft.answers, [field.id]: value } }));
      const props = { id: `logic-answer-${field.id}`, value: current, onChange: event => update(event.target.value), 'aria-describedby': `logic-answer-help-${field.id}` };
      return <div className="logic-field" key={field.id}><span className="logic-case-number">{String(index + 1).padStart(2, '0')}</span><div><label htmlFor={props.id}>{field.label}</label>{field.type === 'select' ? <select {...props}><option value="">Escolha o resultado</option>{field.options.map(option => <option key={option} value={option}>{option}</option>)}</select> : <input {...props} type="text" autoComplete="off" placeholder="Seu resultado" />}<small id={`logic-answer-help-${field.id}`}>{field.type === 'select' ? 'Escolha uma opção para este cenário.' : 'Informe um número. Use o sinal - para negativos.'}</small></div></div>;
    })}</div></section>}
    <ul className="requirements" aria-label="Objetivos do exercício">{exercise.checks.map((check, index) => <li key={check.label} className={results ? results[index].passed ? 'passed' : 'pending' : ''}><span aria-hidden="true">{results?.[index].passed ? '✓' : '○'}</span><div>{check.label}{results?.[index].error && <small className="check-error">{results[index].error}</small>}{results?.[index].hint && <small className="check-hint"><strong>Dica para corrigir:</strong> {results[index].hint}</small>}</div>{results && <span className="requirement-status">{results[index].passed ? 'Concluído' : 'Pendente'}</span>}</li>)}</ul>
  </>;
}
