import { readLogicDraft } from './logic-practice.mjs';

export function executionHint(error, language) {
  if (/indentação|indentar|IndentationError|TabError/i.test(error)) return 'Alinhe as instruções do mesmo bloco e use quatro espaços por nível. Depois de if, for, while ou def, termine a linha com : e indente o bloco seguinte.';
  if (/nomes das variáveis|is not defined|is not a function|name .* is not defined/i.test(error)) return 'Confira o nome indicado na mensagem: letras maiúsculas e minúsculas fazem diferença. Declare a variável ou função antes de usá-la.';
  if (/sintaxe|SyntaxError/i.test(error)) return language === 'python'
    ? 'Confira aspas e parênteses abertos. Instruções como if, for e def precisam terminar com : antes do bloco indentado.'
    : 'Confira se fechou as aspas, os parênteses e as chaves. Revise também os sinais usados nas declarações e expressões.';
  if (/tipos dos valores|TypeError|Cannot read properties/i.test(error)) return 'Confira o tipo de cada valor. Números entre aspas são textos; antes de fazer uma conta ou chamar uma função, verifique o valor usado.';
  if (/índice não existe/i.test(error)) return 'Os índices começam em 0. Em uma lista com três itens, os índices válidos são 0, 1 e 2. Confira o limite do seu laço.';
  if (/chave não existe/i.test(error)) return 'Confira se a chave está no dicionário e se foi escrita exatamente como na criação dele.';
  if (/código demorou demais/i.test(error)) return 'Verifique se a variável de controle muda a cada repetição e se a condição permite encerrar o laço.';
  return '';
}

const display = value => JSON.stringify(value).slice(0, 240);

export function practiceFeedback(source, exercise, run) {
  // Execution failures must be fixed before the objectives can be evaluated.
  if (run.error) return run.results;
  const draft = exercise.language === 'logic' ? readLogicDraft(source, exercise) : null;
  return run.results.map((result, index) => {
    if (result.passed) return result;
    const check = exercise.checks[index];
    let hint = result.hint;
    if (draft && check.type === 'order') {
      const position = draft.order.findIndex((id, i) => id !== check.expected[i]);
      const current = exercise.steps.find(step => step.id === draft.order[position]);
      hint = `Revise a posição ${position + 1}${current ? `: “${current.text}”` : ''}. Pense no que precisa acontecer antes desse passo. ${exercise.hint}`;
    } else if (draft) {
      const answer = String(draft.answers[check.field] ?? '').trim();
      hint = !answer ? 'Você ainda não respondeu este cenário. Preencha o resultado e verifique novamente.'
        : check.type === 'number' && !/^-?\d+(?:[.,]\d+)?$/.test(answer) ? 'Digite apenas um número, sem palavras ou unidades. Você pode usar vírgula ou ponto para decimais.'
        : `Sua resposta “${answer.slice(0, 120)}” ainda não atende à regra deste cenário. ${exercise.hint}`;
    } else if (result.error) {
      hint = executionHint(result.error, exercise.language) || `Revise a expressão que verifica este objetivo. ${exercise.hint}`;
    } else if (check.output) {
      const output = run.logs?.length ? run.logs.map(line => line.slice(0, 120)).slice(0, 6).join(' → ') : 'nenhuma mensagem';
      hint = `O console mostrou: ${output}. O esperado é: ${check.output.map(line => line.slice(0, 120)).join(' → ')}. Confira a ordem, os espaços e as mensagens extras; use ${exercise.language === 'python' ? 'print()' : 'console.log()'} para exibir o resultado.`;
    } else if (check.expression) {
      const simple = /^[A-Za-z_]\w*(?:\.\w+)*$/.test(check.expression);
      hint = simple ? `Confira o valor de ${check.expression}: o esperado é ${display(check.expected)}. ${exercise.hint}`
        : `Este objetivo ainda não foi atendido. Teste a regra para os diferentes valores pedidos. ${exercise.hint}`;
    }
    return { ...result, hint: hint || exercise.hint };
  });
}
