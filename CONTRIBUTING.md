# Contribuindo para 🤖 Template de Bot em TypeScript

Primeiramente, obrigado por considerar contribuir para o [🤖 Template de Bot em TypeScript]! 🎉
Aqui estão algumas diretrizes a seguir para garantir que sua contribuição seja efetiva e seja aceita mais rapidamente.

## Como contribuir

### Relatar Bugs

Relatar bugs é uma importante contribuição. Por favor, siga estas etapas:

1. Verifique se o bug já foi relatado.
2. Se você não encontrou um relatório de bug existente, crie um novo issue.
    - Use um título claro e descritivo.
    - Descreva em detalhe o problema, incluindo passos para reproduzir o bug.
    - Inclua qualquer informação adicional que possa ajudar na resolução do problema.

### Sugerir Melhorias

Novas ideias são sempre bem-vindas. Se você tem uma sugestão para melhorar o projeto, siga este processo:

1. Verifique se a sugestão já foi discutida.
2. Se não, abra um novo issue para discutir sua sugestão antes de começar a trabalhar nela.
    - Forneça um resumo claro e detalhado da melhoria sugerida.
    - Explique por que essa melhoria seria útil para o projeto.

### Pull Requests

Pull requests (PRs) são bem-vindos, mas devem seguir algumas diretrizes:

1. Faça fork do projeto e crie sua branch a partir da `main`.
2. Instale as dependências com `npm install`.
3. Antes de enviar, garanta que tudo passa localmente:
    ```bash
    npm run typecheck && npm run lint && npm run format:check && npm test && npm run build
    ```
    (`npm run format` corrige a formatação automaticamente.) O mesmo roda no CI.
4. Inclua testes (Vitest, arquivos `*.test.ts` ao lado do código) para lógica nova.
5. Atualize a documentação (README) se necessário.
6. Envie sua pull request com uma descrição detalhada das mudanças e o motivo delas.

## Perguntas?

Se você tiver alguma dúvida sobre como contribuir, sinta-se à vontade para perguntar no Discord ou abrir um issue.

Obrigado por contribuir para o [🤖 Template de Bot em TypeScript]! 🌟
