# Vaga Clara

<p align="center">
  <img src="public/favicon.svg" width="88" alt="Símbolo do Vaga Clara" />
</p>

<p align="center">
  <strong>Compare uma vaga com evidências reais do currículo — com critérios visíveis, privacidade e sem inventar experiências.</strong>
</p>

<p align="center">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white" />
  <img alt="Vite 8" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" />
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-ESM-339933?logo=nodedotjs&logoColor=white" />
  <img alt="Licença MIT" src="https://img.shields.io/badge/licen%C3%A7a-MIT-22C55E" />
</p>

## Visão geral

O **Vaga Clara** transforma currículo e descrição de vaga em um diagnóstico estruturado de aderência. Em vez de entregar apenas uma porcentagem, a aplicação mostra os requisitos identificados, a evidência encontrada para cada um, os fatores que compõem a estimativa e as ações que podem fortalecer a candidatura.

O processamento é determinístico e executado pela própria aplicação. Não há dependência de modelos de linguagem, APIs pagas ou serviços externos para produzir a análise.

## Destaques técnicos

- **Evidência antes de palavra-chave:** cada requisito é classificado como comprovado, parcial ou ausente.
- **Score explicável:** compatibilidade, evidências, senioridade, palavras-chave e legibilidade têm pesos visíveis.
- **Diagnóstico de PDF:** avalia extração, seções, dados de contato, possível uso de colunas e legibilidade.
- **Análise orientada ao cargo:** perfis de função adaptam o foco das recomendações e da entrevista.
- **Escrita responsável:** sugestões usam somente informações encontradas e mantêm placeholders quando falta contexto real.
- **Privacidade por padrão:** o PDF é processado no navegador e o conteúdo não é persistido pela API.
- **Contrato validado:** o frontend rejeita respostas incompletas antes de renderizar os resultados.
- **Experiência acessível:** fluxo guiado, estados de carregamento e erro, foco gerenciado e layout responsivo.

## Fluxo da aplicação

```text
Currículo (texto ou PDF)
        │
        ├── diagnóstico estrutural no navegador
        │
        ▼
Descrição da vaga ──► API Node.js ──► análise heurística determinística
                                             │
                                             ▼
                           contrato de resposta validado no cliente
                                             │
                                             ▼
                    score explicado + matriz de evidências + entrevista
```

## Como a compatibilidade é calculada

A estimativa combina cinco dimensões. Os pesos são definidos em `src/lib/ats/scoring.js` e ficam disponíveis na interface:

| Dimensão | O que observa |
| --- | --- |
| Requisitos | Cobertura de itens obrigatórios e desejáveis |
| Evidências | Qualidade dos trechos que sustentam cada competência |
| Senioridade | Alinhamento entre o nível indicado pela vaga e pelo currículo |
| Palavras-chave | Competências detectadas nos dois textos |
| Legibilidade | Estrutura e qualidade de extração do documento |

> A pontuação é uma estimativa transparente para apoiar a revisão do currículo. Ela não reproduz um ATS específico, não prevê decisões de recrutadores e não deve ser interpretada como garantia de aprovação.

## Arquitetura

```text
src/
├── components/               # fluxo, entradas, resultados e preparação
├── lib/
│   ├── ats/                  # diagnóstico do documento e composição do score
│   ├── analysisApi.js        # chamada, timeout e tratamento da resposta
│   ├── analysisValidation.js # contrato de dados entre API e interface
│   └── pdfParser.js          # extração e leitura do PDF no navegador
├── styles/app.css            # sistema visual e responsividade
└── App.jsx                   # estado e navegação do fluxo principal

api/
├── analysis/                 # léxico utilizado na extração
├── data/                     # competências e perfis de cargo
├── shared/                   # HTTP e detecção de empresa
├── analisar-vaga.js          # endpoint POST /api/analisar-vaga
├── careerAgent.js            # motor determinístico de análise
├── validators.js             # limites e validação da entrada
└── server.js                 # API e arquivos estáticos em produção
```

### Decisões de engenharia

1. **Determinismo:** a mesma entrada produz uma análise reproduzível, adequada para testes e depuração.
2. **Separação de responsabilidades:** extração, validação, score, interface e transporte HTTP evoluem de forma independente.
3. **Falha segura:** timeout, limite de payload, JSON inválido e respostas incompletas geram mensagens controladas.
4. **Sem invenção de dados:** recomendações distinguem evidência real de lacunas e nunca completam fatos ausentes.
5. **Baixo custo operacional:** a solução funciona sem chaves secretas, banco de dados ou provedor de IA.

## Execução local

### Pré-requisitos

- Node.js 20.19 ou superior (ou 22.12+).
- npm 10 ou superior.

```bash
git clone https://github.com/leonardocalegare-spec/VagaClara.git
cd VagaClara
npm install
npm run dev
```

O ambiente de desenvolvimento fica disponível normalmente em `http://127.0.0.1:5173`. O Vite integra o endpoint local durante o desenvolvimento.

Para executar frontend e API em processos separados:

```bash
npm run dev
npm run dev:api
```

Para validar o build servido pela aplicação Node.js:

```bash
npm run build
npm run start
```

## API

### `POST /api/analisar-vaga`

```json
{
  "curriculo": "Texto extraído ou colado pelo usuário",
  "vaga": "Descrição completa da oportunidade"
}
```

A resposta contém análise da vaga, score detalhado, matriz de requisitos, sugestões de currículo, preparação para entrevista e metadados de confiança. O contrato consumido pela interface está documentado no próprio código em `src/lib/analysisValidation.js`.

## Qualidade e validação

```bash
npm run lint
npm test
npm run build
git diff --check
```

A suíte automatizada cobre validação de entrada, limites HTTP, classificação de perfis, cálculo ATS, senioridade, extração de requisitos e compromisso de não inventar evidências.

## Privacidade

- O texto do PDF é extraído no navegador.
- Currículo e vaga são enviados somente à API da própria aplicação durante a análise.
- A API não grava o conteúdo em banco de dados.
- O currículo só é mantido no `localStorage` quando o usuário ativa essa opção.
- Nenhum provedor externo recebe os textos.

## Limitações conhecidas

- A análise é heurística e depende da clareza dos textos fornecidos.
- PDFs digitalizados como imagem exigem OCR antes da importação.
- Formatações complexas ou múltiplas colunas podem reduzir a qualidade da extração.
- O sistema não consulta o mercado, a empresa ou dados externos sobre a vaga.

## Licença e autoria

Distribuído sob a [licença MIT](LICENSE).

Desenvolvido por **Leonardo Henrique**, sob a assinatura **Noumena Labs**.
