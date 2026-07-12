# MatchCV

MatchCV e uma ferramenta local-first para comparar um curriculo com uma descricao de vaga, estimar aderencia, sugerir melhorias honestas no curriculo e preparar o candidato para a entrevista.

O projeto roda 100% local: nao usa Gemini, nao exige chave de API e nao envia curriculo ou vaga para servicos externos.

## Destaques

- Analise local de aderencia entre curriculo e vaga.
- Score de match com recomendacao: `CANDIDATAR`, `CONSIDERAR` ou `PULAR`.
- Extracao de requisitos obrigatorios, desejaveis, senioridade e skills.
- Curriculo otimizado com resumo sugerido, bullets para adaptar, evidencias e alertas de honestidade.
- Dicas para entrevista baseadas nos gaps e pontos fortes detectados.
- Upload de curriculo em PDF com extracao de texto via `pdfjs-dist`.
- Assinatura visual: Noumena Labs - Leonardo Henrique.

## Stack

- React 19
- Vite 8
- JavaScript
- API local via middleware do Vite
- `pdfjs-dist` para leitura de PDF
- `lucide-react` para icones
- `oxlint` para lint

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
npm run lint
npm run build
npm run preview
```

## Arquitetura

- `src/App.jsx`: orquestra estado, inputs, erros e resultado.
- `src/components/`: componentes de entrada e apresentacao.
- `src/lib/analysisApi.js`: cliente da API local.
- `api/analisar-vaga.js`: endpoint local `POST /api/analisar-vaga`.
- `api/careerAgent.js`: agente local de analise de curriculo.
- `src/lib/pdfParser.js`: extracao de texto de PDF.

## Privacidade

MatchCV foi desenhado para ser privado por padrao. O curriculo e a descricao da vaga sao processados localmente durante o desenvolvimento, sem chamada para APIs externas. O curriculo base pode ser salvo no `localStorage` do navegador para conveniencia.

## Validacao

```bash
npm run lint
npm run build
```

## Roadmap

- Historico local das ultimas analises.
- Botao para copiar resumo, bullets e dicas de entrevista.
- Exportacao em Markdown/PDF.
- Indicador de confianca da analise.
- Dicionario de skills por area: frontend, backend, dados, suporte, produto e design.
- Testes unitarios para extracao de skills, score e gaps.

## Autoria

Noumena Labs - Leonardo Henrique
