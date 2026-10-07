# Codiva · Next.js

Plataforma de estudo de programação em português, construída com Next.js 16, React 19 e App Router. Interface responsiva para desktop e celular, com 12 lições introdutórias.

## Rodar localmente

Requer Node.js 20.9 ou superior e npm. Execute os comandos na pasta `codiva`:

```sh
npm install
npm run dev
```

Abra http://localhost:3000.

## Verificar e gerar a versão de produção

```sh
npm test
npm run build
```

O build exporta o site estático para `out/`, conforme `output: "export"` em `next.config.mjs`. Essa pasta pode ser servida por um servidor HTTP estático. O projeto não usa `next start`, que exige uma implantação com servidor Next.js.

## Estrutura

- `app/layout.jsx`: documento, metadados e CSS global.
- `app/page.jsx`: entrada do App Router.
- `components/LearningApp.jsx`: componentes React do painel, catálogo, perfil, conquistas e lições.
- `lib/courses.mjs`: conteúdo das quatro trilhas e suas 12 lições.
- `lib/progress.mjs`: validação, conclusão de lições, sequência diária e compatibilidade com o progresso anterior.
- `tests/progress.test.mjs`: testes de migração, XP, revisão e metas diárias.
- `.openai/hosting.json`: identidade do Site existente e diretório de publicação `out`.

## Comportamento

O progresso mantém a chave `codiva-progress` do protótipo anterior. O navegador recupera os dados depois da montagem dos componentes; não há acesso a `localStorage` durante a renderização no servidor. O primeiro acerto concluído concede 20 XP, e revisões não concedem XP adicional. A meta estima três minutos por lição nova. Nome e meta são editáveis também pelo menu móvel.

## Próximas etapas

Expandir as aulas, adicionar editor de código com execução isolada, contas e banco de dados, e preparar instalação como PWA ou aplicativo Android. A versão atual não inclui autenticação, sincronização, backend nem APK. Recursos de servidor exigirão rever a configuração de exportação estática.
