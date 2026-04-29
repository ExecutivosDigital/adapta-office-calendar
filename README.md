# Adapta Office Calendar

Sistema de agendamento de salas para coworking, mobile-first, sem dependências externas. Backend simples direto no Next.js 15 (App Router) com persistência em arquivo JSON local.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** + shadcn/ui (Radix primitives)
- **Server Actions** para todas as mutações (sem REST API)
- **JSON file** (`data/db.json`) com mutex em memória — sem banco de dados
- **lucide-react** para ícones, **sonner** para toasts, **react-hook-form** + **zod** para validação

## Funcionalidades

- Agendamento de salas com slots de 1h, validação de capacidade e conflito
- Bloqueio de horários passados, dias fechados (configurável por env)
- Mostra quem reservou cada slot ocupado (vermelho com primeiro nome)
- Cancelamento pelo cliente (com confirmação) — libera o slot imediatamente
- Página `/reservas` lista as reservas do dispositivo (localStorage) com cancelamento
- Painel admin (`/admin/login`) com login por usuário + senha fixa compartilhada
- Dashboard admin com filtros por sala/data/status e métricas

## Setup

```bash
yarn install
cp .env.local.example .env.local
# Edite .env.local — ao menos defina ADMIN_PASSWORD
yarn dev
```

App em `http://localhost:3001`.

## Variáveis de ambiente

Todas em `.env.local` (não vai pro git):

| Var | Default | Descrição |
|---|---|---|
| `ADMIN_PASSWORD` | — | Senha compartilhada por todos os logins admin (obrigatória) |
| `NEXT_PUBLIC_OPENING_TIME` | `08:00` | Horário de abertura (HH:mm, 24h) |
| `NEXT_PUBLIC_CLOSING_TIME` | `18:00` | Horário de fechamento (HH:mm, 24h) |
| `NEXT_PUBLIC_SLOT_MINUTES` | `60` | Tamanho do slot em minutos |
| `NEXT_PUBLIC_OPEN_WEEKDAYS` | `1,2,3,4,5` | Dias abertos (0=domingo, 6=sábado) |
| `NEXT_PUBLIC_TIMEZONE` | `America/Sao_Paulo` | Timezone (informativo) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `5511999999999` | Número do WhatsApp da equipe (DDI + DDD + número) |

## Estrutura

```
src/
├── app/
│   ├── page.tsx               → home (lista de salas)
│   ├── reservas/              → reservas do dispositivo (localStorage)
│   ├── admin/                 → login + dashboard
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── mobile/                → componentes mobile-first (top-bar, hero, slots)
│   ├── reservation-flow.tsx   → orquestra o fluxo
│   ├── reservation-modal.tsx  → modal de confirmação
│   ├── success-state.tsx
│   └── ui/                    → shadcn primitives
├── lib/
│   ├── store.ts               → file store + mutex
│   ├── time-slots.ts          → geração e classificação de slots
│   ├── admin-auth.ts          → cookie httpOnly do admin
│   └── config.ts              → leitura de env
├── server/actions/            → server actions (reservas, salas, admin)
└── types/
data/
└── db.json                    → "banco de dados" (gitignored, criado on-demand)
public/
├── sala-principal.jpeg
└── sala-secundaria.jpeg
```

## Login admin

`/admin/login` — username livre (3+ caracteres) + senha definida em `ADMIN_PASSWORD`. Vários admins compartilham a mesma senha; o username é só para registrar quem cancelou cada reserva (`cancelled_by` na reserva).

## Regras de negócio

- Slots fixos de 1h gerados a partir do horário comercial configurado
- Não permite duas reservas confirmadas com mesma sala + data + horário (verificação atômica em `store.ts` sob mutex)
- Cancelar libera o slot
- Não permite datas/horários no passado
- Capacidade da sala validada antes da inserção
- Cancelamento de reserva por admin exige cookie; cancelamento por cliente requer apenas o `reservation_id` (UUID v4)

## Deploy

Funciona em qualquer host com **disco persistente** e processo Node:

- ✅ VPS (Hostinger KVM 2, DigitalOcean, Hetzner, Contabo, etc.)
- ✅ Railway / Fly.io / Render — com volume persistente
- ❌ **Vercel/Netlify** (filesystem read-only — `data/db.json` não pode ser escrito)

Em VPS:

```bash
yarn install
yarn build
echo 'ADMIN_PASSWORD=<sua-senha>' > .env.local
yarn start            # usa porta 3001 por padrão
# ou: pm2 start "yarn start" --name adapta && pm2 save && pm2 startup
```

Configure Nginx + Let's Encrypt como reverse proxy 443→3001.

**Importante:** faça backup do `data/db.json` periodicamente (ex.: cron diário copiando pra outro diretório). É o único lugar onde as reservas vivem.

## Scripts

| Comando | O que faz |
|---|---|
| `yarn dev` | Dev server na porta 3001 |
| `yarn build` | Build de produção |
| `yarn start` | Servidor de produção na porta 3001 |
| `yarn lint` | Lint |
| `yarn typecheck` | `tsc --noEmit` |
| `yarn tunnel` | Cria tunnel público via cloudflared (precisa cloudflared instalado) |
