export default function PracticeEditor({ language, lesson, code, onEdit, preview, logs, running, executionStatus, results, showHint, onHint }) {
  const isConsole = language !== 'HTML';
  const isPython = language === 'Python';
  function handleKey(event) {
    if (!isPython || event.key !== 'Enter' || event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault();
    const editor = event.currentTarget;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const line = code.slice(0, start).split('\n').at(-1);
    const indentation = line.match(/^ */)[0] + (line.trimEnd().endsWith(':') ? '    ' : '');
    const insertion = '\n' + indentation;
    onEdit(code.slice(0, start) + insertion + code.slice(end));
    requestAnimationFrame(() => editor.setSelectionRange(start + insertion.length, start + insertion.length));
  }
  return <>
    <p className="practice-task">{lesson.practice.task}</p>
    <div className="editor-toolbar"><span>{isConsole ? 'Escreva o código e execute para conferir o resultado.' : 'Escreva no editor e veja a prévia ao lado.'}</span><div><button className="text-button" aria-expanded={showHint} onClick={onHint}>{showHint ? 'Ocultar dica' : 'Preciso de uma dica'}</button><button className="text-button" onClick={() => onEdit(lesson.practice.starter)}>Recomeçar</button></div></div>
    {showHint && <p className="practice-hint">{lesson.practice.hint}</p>}
    <div className="practice-workspace"><div className="editor-pane"><label htmlFor="practice-editor">Seu código · {language}</label><textarea id="practice-editor" spellCheck={false} autoCapitalize="off" autoCorrect="off" value={code} onChange={event => onEdit(event.target.value)} onKeyDown={handleKey} aria-describedby="editor-help" /></div>
      {isConsole ? <div className="console-pane"><span className="preview-label">Console · Resultado da execução</span><div className="console-output" role="log" aria-live="polite" aria-label={`Saída do ${language}`}>{running ? <p className="console-placeholder">{executionStatus}</p> : logs === null ? <p className="console-placeholder">Use “Executar e verificar” para ver a saída aqui.</p> : logs.length ? logs.map((line, index) => <pre className="console-line" key={index}><span aria-hidden="true">›</span>{line}</pre>) : <p className="console-placeholder">Nenhuma mensagem. Use {isPython ? 'print()' : 'console.log'} para exibir valores.</p>}</div></div> : <div className="preview-pane"><span className="preview-label">Prévia da página</span><iframe title="Prévia do seu HTML" sandbox="" srcDoc={preview} /></div>}
    </div>
    <p id="editor-help" className="lesson-help">{isPython ? 'Cada execução começa do zero. Use print() para ver os resultados. O editor mantém a indentação ao pressionar Enter; use quatro espaços por nível. Os dados ficam no código, sem input() ou pacotes externos.' : isConsole ? 'Cada execução começa do zero. O console mostra seus console.log; os testes conferem os objetivos. Use JavaScript síncrono neste editor.' : 'A prévia mostra o conteúdo da página; title e meta ficam na aba e nas configurações. Links e envios são desativados neste exercício.'}</p>
    <ul className="requirements" aria-label="Objetivos do exercício">{lesson.practice.checks.map((check, index) => <li key={check.label} className={results ? results[index].passed ? 'passed' : 'pending' : ''}><span aria-hidden="true">{results?.[index].passed ? '✓' : '○'}</span><div>{check.label}{results?.[index].error && <small className="check-error">{results[index].error}</small>}{results?.[index].hint && <small className="check-hint"><strong>Dica para corrigir:</strong> {results[index].hint}</small>}</div>{results && <span className="requirement-status">{results[index].passed ? 'Concluído' : 'Pendente'}</span>}</li>)}</ul>
  </>;
}
