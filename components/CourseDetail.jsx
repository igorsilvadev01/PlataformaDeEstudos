import { completedCount, lessonKey, foundationLessons, foundationComplete } from '../lib/progress.mjs';

export default function CourseDetail({ course, progress, onBack, onStart }) {
  const done = completedCount(course, progress);
  const nextIndex = course.lessons.findIndex((_, i) => !progress.done.includes(lessonKey(course, i)));
  const groups = course.modules || [{ id: 'all', title: 'Sua jornada', level: 'Iniciante', desc: 'Um passo de cada vez.' }];
  const foundationSize = foundationLessons(course).length;
  const developmentReady = foundationComplete(course, progress);
  return <>
    <button className="text-button back" onClick={onBack}>← Voltar às trilhas</button>
    <div className="course-banner"><div><div className="eyebrow">APRENDA FAZENDO · NO SEU RITMO</div><h1>{course.name}</h1><p className="intro">{course.desc}</p><p className="detail-meta">{course.lessons.length} lições · {course.modules ? course.modules.length + ' etapas do iniciante ao intermediário' : 'Fundamentos para começar'}</p></div><span className={`course-icon ${course.id}`}>{course.icon}</span></div>
    <section className="journey-summary"><div><strong>{done} de {course.lessons.length} lições concluídas</strong><div className="progress" role="progressbar" aria-label="Progresso da trilha" aria-valuenow={Math.round(done / course.lessons.length * 100)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${done / course.lessons.length * 100}%` }} /></div><p>{nextIndex < 0 ? 'Trilha concluída! Revise qualquer lição para fixar.' : `Seu próximo passo: ${course.lessons[nextIndex].title}`}</p></div><button className="primary" onClick={() => onStart(course, Math.max(0, nextIndex))}>{nextIndex < 0 ? 'Revisar a trilha' : done ? 'Continuar aprendendo →' : 'Começar do zero →'}</button></section>
    {course.modules && <p className="journey-tip">Cada lição tem uma explicação, uma pergunta e um exercício com {course.id === 'logic' ? 'passos e cenários' : ['js', 'py'].includes(course.id) ? 'execução no console' : 'prévia'}. Siga a ordem sugerida ou revise quando quiser.</p>}
    <div className="module-list">{groups.map((group, moduleIndex) => {
      const entries = course.lessons.map((lesson, index) => ({ lesson, index })).filter(({ lesson }) => !course.modules || lesson.module === group.id);
      const completed = entries.filter(({ index }) => progress.done.includes(lessonKey(course, index))).length;
      const moduleLocked = moduleIndex >= 2 && !developmentReady;
      return <section className={`lesson-module ${moduleLocked ? 'module-locked' : ''}`} key={group.id} aria-labelledby={`module-${group.id}`}><div className="module-head"><span className="module-number">{moduleLocked ? '◇' : String(moduleIndex + 1).padStart(2, '0')}</span><div><div className="module-heading"><h2 id={`module-${group.id}`}>{group.title}</h2><span className="badge">{moduleLocked ? 'Bloqueado' : group.level}</span></div><p>{moduleLocked ? `Conclua as ${foundationSize} lições dos dois primeiros módulos para liberar esta etapa.` : group.desc}</p></div><span className="module-count">{completed}/{entries.length}</span></div><div className="lesson-list">{entries.map(({ lesson, index }) => {
        const complete = progress.done.includes(lessonKey(course, index));
        const recommended = index === nextIndex;
        const locked = index >= foundationSize && !developmentReady && !complete;
        return <div className={`lesson-row ${complete ? 'is-complete' : ''} ${recommended && !locked ? 'is-next' : ''} ${locked ? 'is-locked' : ''}`} key={lessonKey(course, index)}><span className="lesson-number">{complete ? '✓' : locked ? '◇' : index + 1}</span><div className="lesson-row-content"><h3>{lesson.title}{recommended && !locked && <span className="next-label">Próximo passo</span>}</h3><p>{locked ? 'Disponível na fase de desenvolvimento' : lesson.practice?.language === 'logic' ? 'Conceito + pergunta + raciocínio · 20 XP' : lesson.practice ? 'Conceito + pergunta + código · 20 XP' : 'Explicação + exercício · 20 XP'}</p></div><button className="outline" disabled={locked} onClick={() => onStart(course, index)} aria-label={locked ? `${lesson.title}: bloqueada até concluir os fundamentos` : `${complete ? 'Revisar' : 'Começar'}: ${lesson.title}`}>{locked ? 'Bloqueada' : complete ? 'Revisar →' : 'Começar →'}</button></div>;
      })}</div></section>;
    })}</div>
    {course.references && <aside className="learning-references"><h2>Para continuar explorando</h2><p>Referências gratuitas que inspiraram a sequência desta trilha.</p>{course.references.map(reference => <a key={reference.url} href={reference.url} target="_blank" rel="noreferrer">{reference.name} ↗</a>)}</aside>}
  </>;
}
