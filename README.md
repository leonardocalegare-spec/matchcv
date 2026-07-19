# Vaga Clara

Vaga Clara é uma ferramenta gratuita para entender uma oportunidade, estimar a compatibilidade ATS, comparar exigências com evidências do currículo e preparar uma candidatura mais clara e honesta.

A extração do PDF e a correspondência semântica são executadas no navegador e não exigem chave de API. Consultas públicas de empresa e mercado são opcionais e só acontecem com autorização explícita na interface.

## Destaques

- Compatibilidade ATS estimada com fatores e pesos explicados.
- Diagnóstico técnico do PDF: texto pesquisável, seções, contato, fragmentação e possíveis colunas.
- Análise semântica gratuita no navegador com Transformers.js e modelo multilíngue quantizado.
- Score de match com recomendação: `CANDIDATAR`, `CONSIDERAR` ou `FORTALECER`.
- Extracao de requisitos obrigatorios, desejaveis, senioridade e skills.
- Curriculo otimizado com resumo sugerido, bullets para adaptar, evidencias e alertas de honestidade.
- Dicas para entrevista baseadas nos gaps e pontos fortes detectados.
- Upload de curriculo em PDF com extracao de texto via `pdfjs-dist`.
- Assinatura visual: Noumena Labs - Leonardo Henrique.

## Stack

- React 19 e React DOM 19.
- Vite 8 com plugin oficial React.
- JavaScript ES Modules no frontend e backend.
- Node.js HTTP para o servidor local e de produção.
- `pdfjs-dist` para extração e diagnóstico de PDFs.
- Transformers.js (`@huggingface/transformers`) em Web Worker para análise semântica no navegador.
- Ollama opcional para uma única complementação local por LLM.
- Google Programmable Search opcional, Wikipédia e DuckDuckGo para contexto público da empresa.
- `lucide-react` para iconografia.
- Oxlint para análise estática e Node Test Runner para testes automatizados.

## Como rodar

```bash
npm install
npm run dev
```

Acesse o endereco exibido pelo Vite, normalmente:

```bash
http://127.0.0.1:5173/
```

## Scripts

```bash
npm run dev
npm run dev:api
npm run lint
npm test
npm run build
npm run preview
npm run start
```

## Arquitetura

- `src/App.jsx`: orquestra o fluxo currículo → vaga → resultado.
- `src/components/`: componentes ativos de entrada, onboarding, ATS e entrevista.
- `src/styles/app.css`: estilos da aplicação; `src/index.css` é o ponto de entrada.
- `src/lib/analysisApi.js`: cliente HTTP e composição da análise ATS no navegador.
- `src/lib/analysisValidation.js`: contrato obrigatório da resposta da API.
- `src/lib/ats/`: diagnóstico do documento, correspondência semântica e score ATS.
- `src/workers/semanticAnalysis.worker.js`: execução isolada do modelo semântico.
- `api/analisar-vaga.js`: endpoint `POST /api/analisar-vaga`.
- `api/analysisOrchestrator.js`: sequência determinística de coleta e análise.
- `api/careerAgent.js`: regras de aderência, evidências e recomendações.
- `api/analysis/lexicon.js`: skills, marcadores textuais e níveis de senioridade.
- `api/deterministicPipeline.js`: contexto público, prompt e chamada única ao Ollama.
- `api/shared/`: utilitários HTTP e detecção compartilhada de empresa.
- `api/server.js`: entrega o build e a API no mesmo processo Node.js.
- `test/`: testes automatizados executados pelo Node Test Runner.

## Privacidade

Vaga Clara foi desenhado para ser privado por padrão. O currículo só é salvo no `localStorage` quando o usuário ativa essa opção. O PDF e o modelo semântico são processados no navegador. A API da aplicação recebe o texto necessário para o agente determinístico, mas não possui persistência de currículos ou vagas. A pesquisa pública recebe somente o nome da empresa, nunca o currículo.

## Compatibilidade ATS estimada

Não existe uma pontuação universal compartilhada por todos os sistemas ATS. A estimativa do Vaga Clara combina leitura técnica do documento, requisitos, correspondência semântica, qualidade das evidências, senioridade e palavras-chave. A confiança é exibida separadamente da nota.

O modelo `Xenova/paraphrase-multilingual-MiniLM-L12-v2` é baixado no primeiro uso, executado em um Web Worker e reutilizado pelo cache do navegador. Se o download ou o dispositivo falhar, a análise determinística continua disponível.

## Pipeline com Ollama local

Opcionalmente, o Vaga Clara extrai dados da vaga localmente, consulta contexto público quando disponível e realiza uma única chamada ao Ollama instalado na máquina. Sem Ollama, o projeto mantém a análise determinística local.

```bash
ollama pull llama3.2:3b
ollama serve
```

Use `.env.example` para alterar o modelo ou a URL local do Ollama. Falhas nas consultas públicas não interrompem a análise: o prompt final recebe a instrução para não especular sobre o contexto indisponível.

Para testar a distribuição completa, execute `npm run build` e depois `npm run start`. Esse servidor entrega o front-end compilado e o endpoint local no mesmo endereço.

## Pesquisa pública da empresa

Quando autorizada na interface, a pesquisa usa somente o nome da empresa. As fontes são tentadas nesta ordem:

1. Google Programmable Search, apenas quando `GOOGLE_SEARCH_API_KEY` e `GOOGLE_SEARCH_ENGINE_ID` estão configurados por um cliente existente.
2. Wikipédia em português, sem chave.
3. DuckDuckGo Instant Answer, como fallback sem chave.

A fonte efetivamente utilizada é identificada na interface. O Google Programmable Search não está disponível para novos clientes e sua API JSON será descontinuada em 2027; por isso ele não é uma dependência obrigatória do projeto.

## Validacao

```bash
npm run lint
npm test
npm run build
```

## Roadmap

- Historico local das ultimas analises.
- Botao para copiar resumo, bullets e dicas de entrevista.
- Exportacao em Markdown/PDF.
- OCR opcional para currículos escaneados.

## Autoria

Noumena Labs - Leonardo Henrique
