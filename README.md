# users-service

Scaffold do microserviço de usuários do marketplace, com NestJS, TypeORM e PostgreSQL 15.

## Executar localmente

Requisitos: Node.js, npm e Docker com Compose.

1. Instale as dependências: `npm ci`.
2. Inicie o banco: `docker compose up -d --wait users-db`.
3. Copie `.env.example` para `.env`, defina um valor secreto não vazio em `JWT_SECRET` e ajuste as demais variáveis, se necessário.
4. Inicie o serviço: `npm run start:dev`.

No PowerShell, use `Copy-Item .env.example .env` para copiar o arquivo. A configuração local usa HTTP na porta 3000 e PostgreSQL na porta 5433, com database `users_db` e usuário/senha `postgres`/`postgres`.

## Configuração

| Variável      | Finalidade                                | Valor local                                     |
| ------------- | ----------------------------------------- | ----------------------------------------------- |
| `PORT`        | Porta HTTP                                | `3000`                                          |
| `DB_HOST`     | Host do PostgreSQL                        | `localhost`                                     |
| `DB_PORT`     | Porta do PostgreSQL vista pelo serviço    | `5433`                                          |
| `DB_USERNAME` | Usuário do banco                          | `postgres`                                      |
| `DB_PASSWORD` | Senha do banco                            | `postgres`                                      |
| `DB_DATABASE` | Database                                  | `users_db`                                      |
| `JWT_SECRET`  | Segredo de assinatura dos tokens de login | Obrigatório; definir um valor próprio em `.env` |

O TypeORM sincroniza o esquema quando `NODE_ENV` não é `production`. Em produção, a sincronização fica desativada; esta etapa não inclui migrações.
Sem `JWT_SECRET`, o módulo de autenticação falha na inicialização e não emite tokens. Não inclua o segredo no código nem no controle de versão.

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

Entradas inválidas retornam **400** com `message`, uma lista de mensagens que identificam os campos inválidos. Um email já cadastrado retorna **409** com a mensagem `Email já cadastrado`, inclusive quando duas requisições tentam cadastrar o mesmo email ao mesmo tempo. As respostas não incluem o valor da senha recebida.

## Login

Envie `POST /auth/login` com JSON contendo email válido e senha de pelo menos 6 caracteres:

```json
{
  "email": "pessoa@example.com",
  "password": "senha-ilustrativa"
}
```

Uma conta `active` com credenciais corretas recebe **200** com `user` e `token`. `user` contém somente `id`, `email`, `firstName`, `lastName`, `role`, `status`, `createdAt` e `updatedAt`. O token JWT é assinado com `JWT_SECRET`, contém `sub` (UUID do usuário), `email` e `role`, e expira 24 horas após a emissão.

Email inexistente ou senha incorreta retornam **401** com `Credenciais inválidas`. Uma conta `inactive` com senha correta retorna **401** com `Conta inativa`; com senha incorreta, retorna `Credenciais inválidas`. Entrada inválida retorna **400** com mensagens que identificam os campos. Nenhum erro emite token ou expõe senha, hash ou segredo.

## Proteção de rotas

As rotas do `users-service` exigem autenticação por padrão. `POST /auth/register` e `POST /auth/login` são públicas e continuam acessíveis sem token. Para acessar uma rota protegida, envie o JWT recebido no login no header:

```http
Authorization: Bearer <token>
```

O serviço valida a assinatura e a expiração do token com `JWT_SECRET`. Uma rota protegida sem token Bearer, com token expirado ou com assinatura inválida retorna **401 Unauthorized** antes de executar o controller. Em uma requisição autenticada, `req.user` contém somente `id`, `email` e `role`, extraídos das claims `sub`, `email` e `role`.

Novas rotas ficam protegidas automaticamente. Use `@Public()` apenas nas rotas que devem aceitar requisições sem JWT.

## Consulta de usuários

As três consultas abaixo exigem `Authorization: Bearer <token>`. Um token ausente ou inválido retorna **401**. Cada usuário retornado contém somente `id`, `email`, `firstName`, `lastName`, `role`, `status`, `createdAt` e `updatedAt`; a senha e seu hash nunca são incluídos.

| Rota | Resultado |
| --- | --- |
| `GET /users/profile` | **200** com os dados atuais do usuário identificado pelo token. Retorna **404** se ele não existir mais. |
| `GET /users/sellers` | **200** com uma lista de vendedores `active`, possivelmente vazia. Qualquer cliente com JWT válido pode consultar. |
| `GET /users/:id` | **200** com o usuário do UUID informado, independentemente de papel ou status; **404** se não existir e **400** se o UUID for inválido. |

## Verificação

Execute `npm run build`, `npm run lint`, `npm test` e `npm run test:e2e`. O último comando inicia automaticamente um PostgreSQL de teste isolado, na porta 5436, e limpa os usuários criados pelos testes. Se essa porta estiver ocupada, defina `USERS_TEST_DB_PORT` antes de executar o comando; o Compose e os testes usarão o mesmo valor.
