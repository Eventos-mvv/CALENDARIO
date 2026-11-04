# Calendário Oficial de Eventos MVV 2027

Site de consulta do calendário anual de eventos do Ministério Verbo da Vida, mantido pela Coordenação de Eventos.

Feito em React + TypeScript com Vite. Sem banco de dados nesta versão: os eventos ficam em um único arquivo de dados.

## Rodar no computador

```bash
npm install
npm run dev        # abre em http://localhost:5173
npm test           # confere datas, dias da semana, indicadores e filtros
npm run build      # gera a pasta dist/ pronta para publicar
```

## Publicar no GitHub Pages

1. Crie um repositório (ex.: `Eventos-mvv/calendario-2027`) e envie estes arquivos.
2. No GitHub: **Settings → Pages → Source: GitHub Actions**.
3. A cada envio para a branch `main`, o arquivo `.github/workflows/deploy.yml` roda os testes, gera o site e publica.

O build usa caminhos relativos, então funciona em qualquer subpasta.

## Como editar um evento

Todos os eventos estão em **`src/data/events.2027.ts`**. Cada registro tem:

| Campo | Exemplo | Observação |
|---|---|---|
| `id` | `'rpd'` | Usado no link de compartilhamento (`#evento-rpd`). Não altere depois de divulgado. |
| `acronym` | `'RPD'` | Sigla exibida no calendário. |
| `name` | `'Reunião de Pastores e Diretorias'` | Nome completo. |
| `type` | `'reuniao'` | Um dos tipos de `src/data/eventTypes.ts`. |
| `start` / `end` | `'2027-03-18'` | Formato AAAA-MM-DD. Evento de um dia: `end` igual a `start`. |
| `color` | `'#1F3F78'` | Cor de identificação (#RRGGBB). |
| `status` | `'confirmado'` ou `'a-confirmar'` | `a-confirmar` mostra a etiqueta "Informações a confirmar". |
| `location`, `responsible`, `schedule`, `description`, `notes` | opcionais | Aparecem no painel de detalhes; vazios mostram "A definir". |
| `pendingFields` | `['Local', 'Horário']` | Lista do que ainda falta confirmar. |

Exemplo — confirmar o nome da formatura e o local:

```ts
{
  id: 'formatura',
  acronym: 'FORMATURA',
  name: 'Formatura <nome confirmado>',
  ...
  status: 'confirmado',
  location: '<local confirmado>',
  pendingFields: undefined,
}
```

Indicadores, legenda, agenda, impressão e PDF se atualizam sozinhos a partir desses dados. Um registro inválido (data inexistente, término antes do início, cor fora do padrão) é ignorado e o motivo aparece no console do navegador.

## Identidade visual

Bordô `#7a1c30` sobre branco, tipografia Archivo (condensada nos números e siglas). Para trocar o bordô, altere `--navy` e `--accent` em `src/styles/tokens.css`.

## Fotos dos eventos

As fotos de cada evento ficam em **`src/data/media.json`**: são de edições anteriores publicadas em verbodavida.org.br, com o link da matéria de origem (usado no crédito). Para trocar uma foto, substitua o endereço.

Por padrão o site carrega as imagens direto do site da instituição. Para não depender disso, rode uma vez:

```bash
npm run fotos      # baixa tudo para public/fotos/ e ativa as cópias locais
npm run build
```

Se uma foto não carregar, o carrossel mostra o fundo na cor do evento no lugar dela.

## Estrutura

```
src/
  config.ts                 ano, textos institucionais, recursos ativos
  data/                     eventos e tipos (fonte única dos dados)
  domain/                   regras puras: datas, indicadores, filtros, validação, layout das barras
  services/eventRepository  acesso aos dados (hoje estático; amanhã API/banco)
  hooks/                    carregamento de eventos, rotas por âncora, media queries
  three/heroScene.ts        topo 3D: o ano em partículas e o anel dos 365 dias
  components/               interface (topo, eventos do ano, faixa do ano, indicadores, visões, agenda, painel, impressão)
  styles/                   tokens de design, estilos da tela e folha de impressão A4
```

## Painel administrativo (próxima etapa)

A interface só conversa com `EventRepository` (`src/services/eventRepository.ts`), que já define `list`, `create`, `update` e `remove`, com validação em `src/domain/validation.ts`. Para ligar a um banco (Firebase, Supabase ou API própria):

1. Crie uma classe que implemente `EventRepository` usando o banco escolhido.
2. Troque a instância exportada no fim de `eventRepository.ts`.
3. Construa as telas de cadastro usando `validateEvent` para mostrar os erros no formulário.

Os campos de local, responsável, horários, descrição, observações e cor já existem no modelo (`src/domain/types.ts`). Eventos simultâneos já são exibidos em faixas separadas no calendário e sinalizados no painel de detalhes.

## Links úteis

- `#ano` — visão anual
- `#mes-07` — visão mensal de julho
- `#evento-cmne` — abre os detalhes da CMNE

## Imprimir e PDF

- **Imprimir** usa a impressão do navegador com uma folha própria em A4 paisagem: página 1 com os 12 meses e página 2 com a agenda em tabela.
- **Baixar PDF** entrega o arquivo `public/calendario-mvv-2027.pdf`, já gerado com essa mesma folha e com título e autor preenchidos. Depois de mudar datas ou cores, gere de novo: `npm run build`, `npx vite preview --port 4173` e, em outro terminal, `node scripts/gerar-pdf.mjs` (precisa do Playwright).

## Cores dos eventos

As cores de `src/data/events.2027.ts` foram escolhidas e validadas para quem tem daltonismo (eventos vizinhos no calendário nunca se confundem) e para manter contraste com o número branco que fica por cima. Se trocar uma cor, prefira tons de luminosidade média e evite colocar duas cores parecidas em eventos seguidos.

## Versão incorporada

`npm run build:embed` gera `dist-embed/calendario-mvv-2027.html`, um arquivo único usado para a pré-visualização publicada pelo Claude. Nessa versão os botões de imprimir e baixar ficam ocultos, porque aquele ambiente bloqueia essas ações.
