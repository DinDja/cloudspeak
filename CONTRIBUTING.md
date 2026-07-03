# Guia de Contribuição para o CloudSpeak

Olá! Ficamos felizes com seu interesse em contribuir para o CloudSpeak. Este é um projeto que visa transformar apresentações em experiências interativas e sua ajuda é muito bem-vinda.

Antes de começar, por favor, leia nosso Código de Conduta. Esperamos que todos os contribuidores sigam estas diretrizes para mantermos um ambiente respeitoso e colaborativo.

## Como Começar

1.  **Faça um Fork do Repositório:** Comece criando um fork do repositório principal para a sua conta do GitHub.
2.  **Clone seu Fork:** Clone o repositório para a sua máquina local.
    ```bash
    git clone https://github.com/SEU-USUARIO/cloudspeak.git
    ```
3.  **Configure o Ambiente:** Siga as instruções da seção "Primeiros passos" no nosso `README.md` para instalar as dependências e configurar as variáveis de ambiente.

## Fluxo de Trabalho

1.  **Crie uma Branch:** Para cada nova feature ou correção de bug, crie uma nova branch a partir da `main`. Use um nome descritivo.
    ```bash
    # Exemplo para uma nova feature
    git checkout -b feature/adicionar-novo-tipo-slide

    # Exemplo para uma correção de bug
    git checkout -b fix/corrigir-layout-mobile
    ```

2.  **Desenvolva e Faça Commits:** Faça suas alterações na nova branch. Tente fazer commits pequenos e atômicos com mensagens claras e descritivas, seguindo o padrão Conventional Commits.
    *   **feat:** para novas funcionalidades.
    *   **fix:** para correções de bugs.
    *   **docs:** para mudanças na documentação.
    *   **style:** para formatação de código, sem alteração de lógica.
    *   **refactor:** para refatorações que não corrigem bugs nem adicionam features.
    *   **chore:** para tarefas de manutenção (build, dependências, etc.).

3.  **Verifique seu Código:** Antes de submeter, rode o linter para garantir que o código segue os padrões do projeto.
    ```bash
    npm run lint
    ```

4.  **Abra um Pull Request (PR):** Quando suas alterações estiverem prontas, envie sua branch para o seu fork no GitHub e abra um Pull Request para a branch `main` do repositório original.
    *   Preencha o template do PR com uma descrição clara do que foi feito.
    *   Se o seu PR resolve uma issue existente, mencione-a na descrição (ex: `Resolve #123`).
    *   Peça a revisão de pelo menos um outro membro da equipe.

5.  **Revisão de Código:** A equipe irá revisar seu PR. Esteja aberto a feedbacks e discussões. Faça os ajustes necessários.

6.  **Merge:** Após a aprovação, seu PR será integrado à branch `main`. Parabéns e obrigado pela sua contribuição!

## Reportando Bugs e Sugerindo Melhorias

*   **Bugs:** Use a seção de "Issues" do GitHub para reportar bugs. Forneça o máximo de detalhes possível: passos para reproduzir, comportamento esperado, comportamento atual e capturas de tela, se aplicável.
*   **Sugestões:** Ideias são sempre bem-vindas! Abra uma "Issue" para descrever sua sugestão de melhoria ou nova funcionalidade.

Obrigado por ajudar a tornar o CloudSpeak ainda melhor!