# users-service

Scaffold do microserviço de usuários do marketplace, com NestJS, TypeORM e PostgreSQL 15.

## Executar localmente

Requisitos: Node.js, npm e Docker com Compose.

1. Instale as dependências: `npm ci`.
2. Inicie o banco: `docker compose up -d --wait users-db`.
3. Copie `.env.example` para `.env` e ajuste as variáveis, se necessário.
4. Inicie o serviço: `npm run start:dev`.

No PowerShell, use `Copy-Item .env.example .env` para copiar o arquivo. A configuração local usa HTTP na porta 3000 e PostgreSQL na porta 5433, com database `users_db` e usuário/senha `postgres`/`postgres`.

## Configuração

| Variável | Finalidade | Valor local |
| --- | --- | --- |
| `PORT` | Porta HTTP | `3000` |
| `DB_HOST` | Host do PostgreSQL | `localhost` |
| `DB_PORT` | Porta do PostgreSQL vista pelo serviço | `5433` |
| `DB_USERNAME` | Usuário do banco | `postgres` |
| `DB_PASSWORD` | Senha do banco | `postgres` |
| `DB_DATABASE` | Database | `users_db` |

O TypeORM sincroniza o esquema quando `NODE_ENV` não é `production`. Em produção, a sincronização fica desativada; esta etapa não inclui migrações.

## Verificação

Execute `npm run build` para compilar e `npm run lint` para verificar o código. O aplicativo carrega o módulo de usuários e registra um `ValidationPipe` global, mas ainda não expõe endpoints.
