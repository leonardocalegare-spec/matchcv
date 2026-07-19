# Vaga Clara

Vaga Clara é uma ferramenta gratuita para comparar uma vaga com evidências reais do currículo. Ela organiza requisitos, mostra o que já está claro, aponta o que merece atenção e ajuda na preparação para a entrevista sem inventar experiências.

O projeto funciona sem serviços pagos, chaves de API, modelos de linguagem ou consultas externas.

## O que a aplicação faz

- Importa currículos em PDF ou aceita texto colado.
- Identifica requisitos obrigatórios, desejáveis, senioridade e competências na descrição da vaga.
- Relaciona cada requisito a uma evidência encontrada no currículo.
- Classifica a evidência como comprovada, parcial ou ausente.
- Avalia clareza, estrutura, contato, seções e extração do documento.
- Explica a composição da compatibilidade com fatores e pesos visíveis.
- Sugere prioridades e perguntas para a entrevista em linguagem natural.
- Mantém alertas de honestidade para evitar informações inventadas.

## Stack atual

- React 19 e React DOM 19.
- Vite 8 com plugin oficial React.
- JavaScript com ES Modules no frontend e backend.
- Node.js HTTP para API, autenticação e servidor de produção.
- `pdfjs-dist` para leitura e diagnóstico de PDFs no navegador.
- `lucide-react` para iconografia.
- Oxlint para análise estática.
- Node Test Runner para testes automatizados.

## Como rodar

```bash
npm install
npm run dev
```

O Vite normalmente abre o frontend em `http://127.0.0.1:5173/`. Para executar a API local separadamente:

```bash
npm run dev:api
```

Para testar a distribuição completa no mesmo processo:

```bash
npm run build
npm run start
```

## Scripts

```bash
npm run dev       # frontend em desenvolvimento
npm run dev:api   # API local em desenvolvimento
npm run lint      # análise estática
npm test          # testes automatizados
npm run build     # build de produção
npm run preview   # prévia do build pelo Vite
npm run start     # build e API no mesmo servidor Node.js
```

## Arquitetura

- `src/App.jsx`: controla o fluxo currículo → vaga → resultado.
- `src/components/`: entradas, boas-vindas, resultados e preparação para entrevista.
- `src/styles/app.css`: estilos e comportamento responsivo da interface.
- `src/lib/analysisApi.js`: comunicação com o endpoint e composição da leitura final.
- `src/lib/analysisValidation.js`: valida o contrato devolvido pela API.
- `src/lib/ats/documentDiagnostics.js`: analisa a clareza técnica do documento.
- `src/lib/ats/scoring.js`: calcula e explica a compatibilidade.
- `api/analisar-vaga.js`: endpoint `POST /api/analisar-vaga`.
- `api/careerAgent.js`: extração determinística, evidências e recomendações.
- `api/analysis/`: léxico e perfis usados por diferentes famílias de cargos.
- `api/auth.js` e `api/shared/`: autenticação e utilitários compartilhados.
- `api/server.js`: entrega o build e a API no mesmo processo.
- `test/`: testes executados pelo Node Test Runner.

## Privacidade

O PDF é lido no navegador. Durante a análise, o texto do currículo e da vaga é enviado somente à API da própria aplicação e não é persistido em banco de dados. O currículo só fica no `localStorage` quando o usuário marca essa opção. Nenhum provedor externo recebe os textos.

## Como interpretar a compatibilidade

A porcentagem é uma leitura explicada da relação entre o documento e a vaga. Ela combina clareza do arquivo, requisitos encontrados, qualidade das evidências, senioridade e palavras-chave.

Ela não simula um produto específico de ATS, não prevê decisões de recrutadores e não representa uma pontuação universal. Os fatores e pesos ficam visíveis para que o usuário entenda de onde o resultado veio.

## Validação

Antes de publicar uma mudança, execute:

```bash
npm run lint
npm test
npm run build
git diff --check
```

## Autoria

Noumena Labs — Leonardo Henrique
