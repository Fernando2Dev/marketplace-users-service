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

## Registro de usuários

Envie `POST /auth/register` com JSON contendo somente os cinco campos abaixo:

```json
{
  "email": "pessoa@example.com",
  "password": "senha-ilustrativa",
  "firstName": "Ana",
  "lastName": "Silva",
  "role": "buyer"
}
```

`role` aceita `buyer` ou `seller`. A senha deve ter pelo menos 6 caracteres. Nome e sobrenome devem conter caracteres além de espaços e ter no máximo 100 caracteres. O serviço rejeita campos adicionais.

O sucesso retorna **201** com `id`, `email`, `firstName`, `lastName`, `role`, `status` (`active`), `createdAt` e `updatedAt`. A senha não integra a resposta e é armazenada como hash bcrypt com custo 10.

Entradas inválidas retornam **400** com `errors`, uma lista de objetos `{ "field": "nomeDoCampo", "message": "restrição violada" }`. Um email já cadastrado retorna **409** com a mensagem `Email já cadastrado`, inclusive quando duas requisições tentam cadastrar o mesmo email ao mesmo tempo. As respostas não incluem o valor da senha recebida.

## Verificação

Execute `npm run build`, `npm run lint`, `npm test` e `npm run test:e2e`. O último comando inicia automaticamente um PostgreSQL de teste isolado, na porta 5436, e limpa os usuários criados pelos testes. Se essa porta estiver ocupada, defina `USERS_TEST_DB_PORT` antes de executar o comando; o Compose e os testes usarão o mesmo valor.
