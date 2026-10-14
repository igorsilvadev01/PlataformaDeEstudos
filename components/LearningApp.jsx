'use client';

import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import HtmlLessonDialog from './HtmlLessonDialog.jsx';
import CourseDetail from './CourseDetail.jsx';
import { courses } from '../lib/courses.mjs';
import { STORAGE_KEY, initialProgress, restoreProgress, lessonKey, completedCount, completeLesson, dateKey, studyStreak, foundationLessons, foundationCount, foundationComplete, developmentUnlocked } from '../lib/progress.mjs';

const navigation = [
  { id: 'inicio', icon: '◫', label: 'Meu aprendizado', mobile: 'Aprender' },
  { id: 'trilhas', icon: '⌘', label: 'Explorar trilhas', mobile: 'Trilhas' },
  { id: 'pratica', icon: '⌨', label: 'Praticar', mobile: 'Praticar' },
  { id: 'desenvolvimento', icon: '</>', label: 'Desenvolvimento', mobile: 'Criar' },
  { id: 'conquistas', icon: '♧', label: 'Conquistas', mobile: 'Conquistas' },
];

function ProgressBar({ value }) {
  return <div className="progress" role="progressbar" aria-label="Progresso" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${Math.min(value, 100)}%` }} /></div>;
}

function CourseCard({ course, progress, onOpen }) {
  const done = completedCount(course, progress);
  const percent = done / course.lessons.length * 100;
  return <button className="course" onClick={() => onOpen(course)}>
    <div className="course-top"><span className={`course-icon ${course.id}`}>{course.icon}</span><span className="badge">Iniciante</span></div>
    <h3>{course.name}</h3><p>{course.desc}</p><ProgressBar value={percent} />
    <div className="course-bottom"><span>{done} de {course.lessons.length} lições</span><span>{Math.round(percent)}%</span></div>
  </button>;
}

function Dashboard({ progress, onNavigate, onOpen, onStart }) {
  const total = progress.done.length;
  const next = courses.find(c => completedCount(c, progress) < c.lessons.length) || courses[0];
  const index = Math.max(0, next.lessons.findIndex((_, i) => !progress.done.includes(lessonKey(next, i))));
  const minutes = progress.dates.includes(dateKey()) ? progress.todayMinutes : 0;
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (day.getDay() + 6) % 7 + i);
    return { key: dateKey(day), label: ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][i], done: progress.dates.includes(dateKey(day)) };
  });
  return <>
    <div className="greeting"><div><div className="eyebrow">CADA LINHA É UM NOVO COMEÇO</div><h1>Olá, {progress.name} <span style={{ fontSize: 25 }}>✌️</span></h1><p className="intro">Que tal dar mais um passo na sua jornada hoje?</p></div><span className="datepill">No seu ritmo, todos os dias</span></div>
    <div className="columns"><div>
      <section className="hero"><div className="hero-content"><div className="eyebrow">{total ? 'CONTINUE DE ONDE PAROU' : 'SUA JORNADA COMEÇA AQUI'}</div><h2>Pequenos passos.<br />Grandes possibilidades.</h2><p>Aprenda programação em português, uma lição de cada vez. Você não precisa saber nada para começar.</p><button className="primary" onClick={() => onStart(next, index)}>{total ? 'Continuar aprendendo' : 'Começar a aprender'} <span>→</span></button></div><div className="hero-art" aria-hidden="true"><div className="orb" /><div className="code-window"><div className="dots">•••</div><pre>{'<h1>\n  Olá, mundo!\n</h1>'}</pre></div><div className="floating-code">{'</>'}</div></div></section>
      <div className="section-head"><h2>Um caminho para cada ideia</h2><button className="text-button" onClick={() => onNavigate('trilhas')}>Ver todas as trilhas →</button></div>
      <div className="course-grid">{courses.map(c => <CourseCard key={c.id} course={c} progress={progress} onOpen={onOpen} />)}</div>
      <section className="learning-roadmap" aria-labelledby="roadmap-title"><div className="roadmap-heading"><div><div className="eyebrow">SUA JORNADA</div><h2 id="roadmap-title">Do primeiro conceito ao seu projeto</h2></div><button className="text-button" onClick={() => onNavigate('desenvolvimento')}>Ver jornada →</button></div><div className="roadmap-steps"><div className="roadmap-step active"><span>1</span><div><strong>Fundamentos</strong><small>Conclua os 2 primeiros módulos de uma trilha.</small></div></div><div className={`roadmap-line ${developmentUnlocked(progress) ? 'complete' : ''}`} /><div className={`roadmap-step ${developmentUnlocked(progress) ? 'active' : 'locked'}`}><span>{developmentUnlocked(progress) ? '✓' : '2'}</span><div><strong>Desenvolvimento</strong><small>{developmentUnlocked(progress) ? 'Liberado: avance para projetos maiores.' : 'Será liberado automaticamente.'}</small></div></div></div></section>
      <section className="challenge"><div className="challenge-icon">⌨</div><div><h3>Sua dose diária de código</h3><p>Um desafio rápido para colocar a cabeça para funcionar.</p></div><button className="outline" onClick={() => onNavigate('pratica')}>Praticar agora →</button></section>
    </div><div className="right-col">
      <section className="panel"><div className="panel-title"><h3>Sua meta diária</h3><span className="target">◎</span></div><p>Consistência vale mais que pressa.</p><div className="ring-wrap"><div className="ring" style={{ '--angle': `${Math.min(minutes / progress.goal, 1) * 360}deg` }}><span>{Math.min(Math.round(minutes / progress.goal * 100), 100)}%</span></div><div className="ring-info"><strong>{minutes} de {progress.goal} min</strong><p>Tempo estimado pelas lições</p></div></div><div className="days">{days.map(d => <div key={d.key} className={`day ${d.done ? 'done' : ''}`}><span>{d.done ? '✓' : '·'}</span>{d.label}</div>)}</div></section>
      <section className="panel"><div className="panel-title"><h3>Pequenas vitórias</h3><span style={{ color: '#e1b96c' }}>✦</span></div><p style={{ margin: '17px 0' }}><strong style={{ fontSize: 25, color: 'var(--ink)' }}>{total * 20}</strong> XP conquistados</p><ProgressBar value={total * 20} /><p style={{ marginTop: 10 }}>{Math.max(100 - total * 20, 0)} XP para sua conquista de 100 XP</p></section>
      <section className="panel tip"><div className="eyebrow">UMA IDEIA PARA LEVAR COM VOCÊ</div><h3>Todo programador já escreveu seu primeiro “Olá, mundo!”.</h3><p>Errar faz parte. Testar de novo também. O importante é continuar curioso.</p><div className="tip-code">{'console.log("Eu consigo!");'}</div></section>
    </div></div>
  </>;
}

function Catalog({ progress, onOpen }) {
  const [filter, setFilter] = useState('Todas');
  return <><div className="eyebrow">ENCONTRE SEU PRÓXIMO PASSO</div><h1>O que você quer criar?</h1><p className="intro">Escolha uma trilha e aprenda na prática. Todas começam do zero.</p><div className="filter">{['Todas', 'Web', 'Dados', 'Fundamentos'].map(f => <button key={f} className={filter === f ? 'active' : ''} aria-pressed={filter === f} onClick={() => setFilter(f)}>{f}</button>)}</div><div className="course-grid">{courses.filter(c => filter === 'Todas' || c.type === filter).map(c => <CourseCard key={c.id} course={c} progress={progress} onOpen={onOpen} />)}</div></>;
}


function Practice({ progress, onStart }) {
  return <><div className="eyebrow">APRENDER. TESTAR. REPETIR.</div><h1>Coloque suas ideias em prática.</h1><p className="intro">Revise um conceito rápido. Você pode repetir os exercícios quantas vezes quiser.</p><div className="section-head"><h2>Escolha seu desafio</h2></div><div className="course-grid">{courses.map(c => <button className="course" key={c.id} onClick={() => onStart(c, Math.max(0, c.lessons.findIndex((_, i) => !progress.done.includes(lessonKey(c, i)))))}><span className={`course-icon ${c.id}`}>{c.icon}</span><h3>{c.name}</h3><p>Um exercício guiado · cerca de 3 minutos</p><span className="text-button">Resolver desafio →</span></button>)}</div></>;
}

function Development({ progress, onOpen }) {
  const unlocked = developmentUnlocked(progress);
  const completedFoundations = courses.filter(course => foundationComplete(course, progress));
  return <><div className="eyebrow">FASE 2 · DESENVOLVIMENTO</div><h1>Transforme fundamentos em projetos.</h1><p className="intro">Escolha uma tecnologia, avance pelos módulos aplicados e termine com um projeto completo.</p>
    <section className={`development-gate ${unlocked ? 'unlocked' : ''}`} aria-labelledby="development-status"><span className="gate-icon" aria-hidden="true">{unlocked ? '✓' : '◇'}</span><div><div className="eyebrow">{unlocked ? 'NOVA FASE LIBERADA' : 'COMO DESBLOQUEAR'}</div><h2 id="development-status">{unlocked ? `Fundamentos de ${completedFoundations.map(course => course.name).join(', ')} concluídos` : 'Conclua os fundamentos de uma trilha'}</h2><p>{unlocked ? 'Você já pode avançar. As outras tecnologias continuam disponíveis para estudar no seu ritmo.' : 'Finalize os dois primeiros módulos de HTML & CSS, JavaScript, Python ou Lógica. São 8 lições na trilha que você escolher.'}</p></div></section>
    <div className="section-head"><h2>{unlocked ? 'Escolha seu próximo caminho' : 'Seu progresso nos fundamentos'}</h2></div>
    <div className="development-grid">{courses.map(course => {
      const basics = foundationLessons(course);
      const done = foundationCount(course, progress);
      const ready = foundationComplete(course, progress);
      const advancedCount = course.lessons.length - basics.length;
      return <article className={`development-card ${ready ? 'ready' : ''}`} key={course.id}><div className="development-card-top"><span className={`course-icon ${course.id}`}>{course.icon}</span><span className={`badge ${ready ? 'ready-badge' : ''}`}>{ready ? 'Pronto para avançar' : `${done}/${basics.length} fundamentos`}</span></div><h3>{course.name}</h3><p>{ready ? `${advancedCount} lições aplicadas, do nível básico ao projeto final.` : `Faltam ${basics.length - done} lições para liberar o desenvolvimento desta trilha.`}</p><ProgressBar value={done / basics.length * 100} /><button className={ready ? 'primary' : 'outline'} onClick={() => onOpen(course)}>{ready ? 'Continuar desenvolvendo →' : done ? 'Continuar fundamentos →' : 'Começar fundamentos →'}</button></article>;
    })}</div>
  </>;
}

function Achievements({ progress }) {
  const total = progress.done.length;
  const achievements = [
    { title: 'Primeira linha', text: 'Conclua sua primeira lição.', ok: total > 0, icon: '✦' },
    { title: 'Pronto para criar', text: 'Desbloqueie a fase de desenvolvimento.', ok: developmentUnlocked(progress), icon: '</>' },
    { title: 'Trilha completa', text: 'Conclua todas as lições de uma trilha.', ok: courses.some(c => completedCount(c, progress) === c.lessons.length), icon: '⚑' },
    { title: 'Curiosidade sem limites', text: 'Acumule 100 XP estudando.', ok: total >= 5, icon: '♧' },
  ];
  return <><div className="eyebrow">CELEBRE CADA PASSO</div><h1>Seu esforço vira conquista.</h1><p className="intro">{total} lições concluídas · {total * 20} XP · {studyStreak(progress)} dias seguidos</p><div className="achievements">{achievements.map(a => <div key={a.title} className={`achievement ${a.ok ? '' : 'locked'}`}><div className="medal">{a.icon}</div><h3>{a.title}</h3><p>{a.text}</p><span className="badge">{a.ok ? 'Conquistada ✓' : 'Em construção'}</span></div>)}</div></>;
}

function Profile({ progress, onSave }) {
  const [name, setName] = useState(progress.name);
  const [goal, setGoal] = useState(progress.goal);
  const [saved, setSaved] = useState(false);
  return <><div className="eyebrow">NO SEU RITMO</div><h1>Vamos deixar com a sua cara.</h1><p className="intro">Seus dados e progresso ficam salvos neste navegador.</p><form className="empty-card settings" onSubmit={e => { e.preventDefault(); onSave({ name: name.trim() || 'Aprendiz', goal }); setSaved(true); }}><label htmlFor="name">Como podemos chamar você?</label><input id="name" maxLength={30} required value={name} onChange={e => { setName(e.target.value); setSaved(false); }} /><label htmlFor="goal">Sua meta diária</label><select id="goal" value={goal} onChange={e => { setGoal(Number(e.target.value)); setSaved(false); }}>{[5, 10, 15, 20].map(n => <option key={n} value={n}>{n} minutos por dia</option>)}</select><button className="primary">Salvar preferências</button><p className="save-message" aria-live="polite">{saved ? 'Preferências atualizadas!' : ''}</p></form></>;
}

function LessonDialog({ lessonState, onClose, onStart, onComplete, progress }) {
  const dialog = useRef(null);
  const [selection, setSelection] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [checked, setChecked] = useState(false);
  const [finished, setFinished] = useState(false);
  const [fresh, setFresh] = useState(false);
  const { course, index } = lessonState;
  const lesson = course.lessons[index];
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => { if (element.open) element.close(); };
  }, []);
  function verify() {
    if (checked) {
      setFresh(!progress.done.includes(lessonKey(course, index)));
      onComplete(course, index);
      setFinished(true);
    } else if (selection === null) setFeedback('Selecione uma resposta para continuar.');
    else if (selection === lesson.answer) { setChecked(true); setFeedback(lesson.explain); }
    else setFeedback('Ainda não! Leia a explicação e tente outra alternativa. Errar faz parte.');
  }
  return <dialog ref={dialog} onCancel={onClose} aria-labelledby="lesson-title"><div className="lesson-head"><span className="lesson-step">{finished ? 'PEQUENA VITÓRIA, GRANDE PASSO' : `${course.name.toUpperCase()} · LIÇÃO ${index + 1} DE ${course.lessons.length}`}</span><button className="close" onClick={onClose} aria-label="Fechar lição">×</button></div>
    {finished ? <div className="success"><div className="success-icon">✦</div><h2 id="lesson-title">{fresh ? 'Mais uma conquista!' : 'Revisão concluída!'}</h2><p style={{ color: 'var(--muted)' }}>{fresh ? 'Você ganhou 20 XP. Continue construindo seu futuro, uma linha por vez.' : 'Revisar ajuda a fixar. O XP desta lição já foi conquistado.'}</p><button className="primary" onClick={index < course.lessons.length - 1 ? () => onStart(course, index + 1) : onClose}>{index < course.lessons.length - 1 ? 'Próxima lição →' : 'Voltar ao aprendizado'}</button></div> : <><h2 id="lesson-title">{lesson.title}</h2><p style={{ color: 'var(--muted)', fontSize: 13 }}>{lesson.intro}</p><pre className="lesson-code">{lesson.code}</pre><strong>{lesson.question}</strong><div className="answers">{lesson.options.map((option, i) => <button key={i} className={`answer ${selection === i ? 'selected' : ''}`} aria-pressed={selection === i} disabled={checked} onClick={() => { setSelection(i); setFeedback(''); }}>{option}</button>)}</div><div aria-live="polite">{feedback && <div className={`feedback ${checked ? 'correct' : 'incorrect'}`}>{feedback}</div>}</div><button className="primary" onClick={verify}>{checked ? 'Concluir lição ✓' : 'Verificar resposta →'}</button></>}
  </dialog>;
}

export default function LearningApp() {
  const [progress, setProgress] = useState(initialProgress);
  const [loaded, setLoaded] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const [view, setView] = useState('inicio');
  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [today, setToday] = useState('');

  useEffect(() => {
    try { setProgress(restoreProgress(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'))); }
    catch { setStorageUnavailable(true); }
    setToday(dateKey());
    setLoaded(true);
    const timer = setInterval(() => setToday(dateKey()), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }
    catch { setStorageUnavailable(true); }
  }, [progress, loaded]);

  function changePage(update) {
    const commit = () => {
      flushSync(update);
      window.scrollTo(0, 0);
    };
    if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      commit();
      return;
    }
    document.startViewTransition(commit);
  }
  function navigate(next) {
    if (view === next && !course) return;
    changePage(() => { setView(next); setCourse(null); });
  }
  function openCourse(next) {
    changePage(() => { setView('trilhas'); setCourse(next); });
  }
  function closeCourse() { changePage(() => setCourse(null)); }
  function startLesson(next, index) { setLesson({ course: next, index }); }
  const LessonComponent = lesson?.course.lessons[lesson.index].practice ? HtmlLessonDialog : LessonDialog;
  const initial = progress.name[0]?.toUpperCase() || 'A';
  const title = course ? `Explorar trilhas / ${course.name}` : navigation.find(n => n.id === view)?.label || 'Meu perfil';

  return <>
    <aside className="sidebar"><a className="brand" href="#inicio" onClick={event => { event.preventDefault(); navigate('inicio'); }}><span className="brandmark">{'</>'}</span> codiva<span className="branddot">.</span></a><div className="workspace">SEU ESPAÇO DE APRENDIZADO</div><nav aria-label="Principal">{navigation.map(n => <button key={n.id} className={`nav ${view === n.id ? 'active' : ''}`} aria-current={view === n.id ? 'page' : undefined} onClick={() => navigate(n.id)}><span>{n.icon}</span>{n.label}{n.id === 'desenvolvimento' && !developmentUnlocked(progress) && <small className="nav-lock" aria-label="Bloqueado">◇</small>}</button>)}</nav><div className="sidebar-bottom"><div className="small-code">{'{ você consegue }'}</div><h3>Um pouco todo dia.<br />Um futuro inteiro pela frente.</h3><p>Sua próxima conquista começa com uma linha de código.</p><span className="prototype">VERSÃO INICIAL · PROTÓTIPO</span></div><button className="profile" onClick={() => navigate('perfil')}><span className="avatar">{initial}</span><span><strong>{progress.name}</strong><small>{developmentUnlocked(progress) ? 'Fase de desenvolvimento' : 'Construindo fundamentos'}</small></span><span>⌄</span></button></aside>
    <div className="app"><header><span>{title}</span><div className="header-right"><span className="language">🇧🇷 Português</span><span className="divider" /><span title="Dias de estudo" className="streak">♨ <b>{loaded ? studyStreak(progress) : 0}</b></span><span className="xp">✦ <b>{progress.done.length * 20}</b> XP</span><button className="avatar mini" onClick={() => navigate('perfil')} aria-label="Abrir meu perfil">{initial}</button></div></header>
    <main><div className="page-content" key={course ? `course-${course.id}` : view}>{!loaded ? <div className="empty-card" role="status">Preparando seu aprendizado…</div> : <>
      {storageUnavailable && <p className="feedback incorrect" role="status">O armazenamento deste navegador está indisponível. Seu progresso continuará nesta sessão.</p>}
      {view === 'inicio' && <Dashboard key={today} progress={progress} onNavigate={navigate} onOpen={openCourse} onStart={startLesson} />}
      {view === 'trilhas' && (course ? <CourseDetail course={course} progress={progress} onBack={closeCourse} onStart={startLesson} /> : <Catalog progress={progress} onOpen={openCourse} />)}
      {view === 'pratica' && <Practice progress={progress} onStart={startLesson} />}
      {view === 'desenvolvimento' && <Development progress={progress} onOpen={openCourse} />}
      {view === 'conquistas' && <Achievements progress={progress} />}
      {view === 'perfil' && <Profile progress={progress} onSave={values => setProgress(p => ({ ...p, ...values }))} />}
    </>}</div></main><footer>Feito para quem está começando. Feito em português.<span>codiva · primeiro esboço</span></footer></div>
    <nav className="mobile-nav" aria-label="Navegação móvel">{navigation.map(n => <button key={n.id} className={view === n.id ? 'active' : ''} aria-current={view === n.id ? 'page' : undefined} onClick={() => navigate(n.id)}>{n.icon}<small>{n.mobile}</small></button>)}<button className={view === 'perfil' ? 'active' : ''} aria-current={view === 'perfil' ? 'page' : undefined} onClick={() => navigate('perfil')}>◉<small>Perfil</small></button></nav>
    {lesson && <LessonComponent key={lessonKey(lesson.course, lesson.index)} lessonState={lesson} progress={progress} onClose={() => setLesson(null)} onStart={startLesson} onComplete={(c, i) => setProgress(p => completeLesson(p, c, i))} />}
  </>;
}
