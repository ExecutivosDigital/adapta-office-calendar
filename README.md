# Adapta Office Calendar

Interface web mobile-first para agendamento das salas da Adapta Offices.

O sistema atual é dividido em dois projetos:

- `adapta-office-calendar`: frontend Next.js 16, na porta `3001`.
- `adapta-office-api`: API Express + Prisma, na porta `3002`.
- PostgreSQL: fonte de verdade para salas, usuários e reservas.

O frontend não usa mais `data/db.json`. Todas as informações exibidas vêm da
API definida em `NEXT_PUBLIC_API_URL`.

## Pré-requisitos

- Node.js 22 ou superior.
- PostgreSQL acessível pela `DATABASE_URL` da API.

## Como rodar localmente

### 1. API e banco

Em um terminal:

```bash
cd ../adapta-office-api
npm install
cp .env.example .env
```

Revise no `.env` pelo menos:

```dotenv
DATABASE_URL=postgresql://user:password@localhost:5432/adapta_calendar
PORT=3002
ADMIN_PASSWORD=uma-senha-local
AUTH_SECRET=um-segredo-longo-e-aleatorio
CORS_ORIGIN=*
```

Com a `DATABASE_URL` apontando para um banco local:

```bash
npm run db:migrate:dev
npm run db:seed
npm run dev
```

A API estará em `http://localhost:3002`. Verifique com:

```bash
curl http://localhost:3002/health
curl http://localhost:3002/rooms
```

O seed é idempotente e garante as salas `Sala Principal` e `Sala Secundária`
sem apagar reservas existentes.

### 2. Frontend

Em outro terminal:

```bash
cd ../adapta-office-calendar
npm install
cp .env.local.example .env.local
npm run dev
```

Confirme que `.env.local` contém:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3002
```

Abra:

- Aplicação: `http://localhost:3001`
- Administração: `http://localhost:3001/admin/login`

O redirecionamento para `/login` ao abrir a home sem uma conta autenticada é
esperado. Qualquer pessoa pode criar uma conta informando nome completo, CPF,
empresa e uma senha de pelo menos oito caracteres.

### URLs administrativas

- Dashboard de reservas: `http://localhost:3001/admin/dashboard`
- Usuários, busca e redefinição de senha: `http://localhost:3001/admin/usuarios`
- Histórico individual paginado: `http://localhost:3001/admin/usuarios/<ID_DO_USUARIO>`
- Relatório de utilização e KPIs: `http://localhost:3001/admin/relatorios/uso`

Na lista de usuários, clique no nome ou em **Ver histórico** para consultar as
reservas daquele usuário. O histórico aceita filtro por status e paginação.
O painel mostra CPF/login, empresa, quem criou/cancelou, quantidade de seleções
e minutos utilizados. Senhas não são exibidas; o botão **Redefinir senha** cria
uma nova senha administrativa.

## Regras de agendamento

- Cada horário-base tem 30 minutos.
- O usuário pode escolher um horário ou até dois horários consecutivos.
- O bloco atual continua disponível até seu encerramento. Por exemplo, às
  `12:43`, o bloco que termina às `13:00` aparece como `12:43 — 13:00`.
- O início do bloco atual é atualizado a cada minuto.
- Uma reserva de dois blocos ocupa ambos e qualquer sobreposição é recusada
  pela API.
- Um horário ocupado mostra o primeiro nome de quem reservou e sua empresa.
- Nome e empresa são lidos da conta autenticada, não do formulário de reserva.

## Configuração de horários

As configurações precisam concordar entre API e frontend:

| API (`.env`) | Frontend (`.env.local`) | Uso |
|---|---|---|
| `OPENING_TIME` | `NEXT_PUBLIC_OPENING_TIME` | Horário de abertura |
| `CLOSING_TIME` | `NEXT_PUBLIC_CLOSING_TIME` | Horário de fechamento |
| `SLOT_MINUTES` | `NEXT_PUBLIC_SLOT_MINUTES` | Duração do slot |
| `OPEN_WEEKDAYS` | `NEXT_PUBLIC_OPEN_WEEKDAYS` | Dias abertos |

No ambiente local atual, os slots são de 30 minutos, das 08:00 às 18:00, de
segunda a sexta.

## Comandos

### Frontend

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o Next.js em `localhost:3001` |
| `npm run build` | Gera o build de produção |
| `npm run start` | Inicia o build de produção em `localhost:3001` |
| `npm run typecheck` | Valida os tipos TypeScript |

### API

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia a API com recarga automática |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm run db:migrate:dev` | Aplica/gera migrations somente no banco local |
| `npm run db:migrate` | Aplica migrations versionadas no deploy |
| `npm run db:seed` | Garante os dados iniciais |
| `npm run db:studio` | Abre o Prisma Studio |

## Diagnóstico rápido

- `GET /rooms` retorna `data: []`: execute `npm run db:seed` na API.
- `DATABASE_URL` ausente: confirme que `adapta-office-api/.env` existe.
- Frontend mostra erro de conexão: confirme a API em `3002` e o valor de
  `NEXT_PUBLIC_API_URL`.
- Horários divergentes: compare as quatro variáveis da tabela acima nos dois
  projetos e reinicie os processos após alterar os arquivos de ambiente.
