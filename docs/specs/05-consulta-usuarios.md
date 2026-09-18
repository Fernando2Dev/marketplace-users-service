# Consulta de usuários no users-service

## Objetivo

Disponibilizar as três consultas de usuários necessárias ao marketplace: perfil do usuário autenticado, vendedores ativos e usuário por ID.

## Requisitos funcionais

1. O `UsersController` deve disponibilizar somente os endpoints de consulta `GET /users/profile`, `GET /users/sellers` e `GET /users/:id`.
2. Os três endpoints devem exigir um JWT válido, conforme a proteção global já existente. Nenhum deles deve ser público.
3. O `UsersService` deve oferecer as consultas necessárias aos três endpoints, e o `UsersController` deve ser registrado no `UsersModule`.
4. As rotas estáticas `/users/profile` e `/users/sellers` devem ser declaradas antes da rota dinâmica `/users/:id`, para que seus nomes não sejam interpretados como IDs.
5. Nenhuma resposta desses endpoints deve conter `password` ou o hash da senha, inclusive nos itens de uma lista.

### GET /users/profile

1. Deve buscar no banco de dados o usuário cujo ID é `req.user.id`, disponibilizado após a validação do JWT.
2. Deve retornar os dados atuais armazenados no banco, mesmo que algum dado do usuário tenha mudado desde a emissão do token.
3. Não deve usar um ID informado pelo cliente nem retornar apenas os dados presentes no token.

### GET /users/sellers

1. Deve retornar todos os usuários que tenham simultaneamente `role` igual a `seller` e `status` igual a `active`.
2. A resposta deve ser uma lista, inclusive quando não houver vendedores correspondentes; nesse caso, deve ser uma lista vazia.
3. A consulta deve estar disponível para clientes autenticados, incluindo o frontend e o products-service quando apresentarem um JWT válido.

### GET /users/:id

1. Deve buscar no banco de dados o usuário identificado pelo UUID informado no caminho.
2. Deve retornar os dados do usuário encontrado, independentemente de seu `role` ou `status`.
3. Deve retornar HTTP 404 quando não existir usuário com o ID informado.

## Dados retornados

Cada usuário retornado, tanto individualmente quanto na lista de vendedores, deve conter os seguintes campos da entidade `User`:

| Campo | Conteúdo |
| --- | --- |
| `id` | UUID do usuário. |
| `email` | Email cadastrado. |
| `firstName` | Nome cadastrado. |
| `lastName` | Sobrenome cadastrado. |
| `role` | `seller` ou `buyer`. |
| `status` | `active` ou `inactive`. |
| `createdAt` | Data e hora de criação. |
| `updatedAt` | Data e hora da última atualização. |

O campo `password` não deve fazer parte de nenhum objeto de resposta.

## Respostas esperadas

| Endpoint | HTTP | Condição | Resposta |
| --- | --- | --- | --- |
| `GET /users/profile` | 200 OK | JWT válido e usuário consultado pelo ID do token. | Objeto com os dados atuais do usuário, sem `password`. |
| `GET /users/sellers` | 200 OK | JWT válido. | Lista de vendedores ativos, possivelmente vazia, sem `password` em nenhum item. |
| `GET /users/:id` | 200 OK | JWT válido e usuário existente. | Objeto do usuário solicitado, sem `password`. |
| Qualquer um dos três | 401 Unauthorized | Token ausente ou inválido. | Rejeição automática pelo `JwtAuthGuard` global. |
| `GET /users/:id` | 404 Not Found | Usuário não encontrado. | Indicação de que o usuário não existe. |

## Critérios de aceite

1. Com JWT válido, `GET /users/profile` retorna HTTP 200 e os dados do usuário correspondente a `req.user.id` consultados no banco; uma alteração posterior à emissão do token aparece na resposta.
2. `GET /users/profile` não permite consultar outro usuário por meio de dados enviados pelo cliente.
3. Com JWT válido, `GET /users/sellers` retorna HTTP 200 com todos e somente os usuários que sejam `seller` e `active`; exclui `buyer` e `seller` `inactive`.
4. Sem vendedores ativos, `GET /users/sellers` retorna HTTP 200 com uma lista vazia.
5. Com JWT válido e UUID de um usuário existente, `GET /users/:id` retorna HTTP 200 com os dados desse usuário, seja ele vendedor ou comprador, ativo ou inativo.
6. Com JWT válido e UUID sem usuário correspondente, `GET /users/:id` retorna HTTP 404.
7. `GET /users/profile` e `GET /users/sellers` chegam às consultas previstas, sem serem tratados como valores de `:id`.
8. Cada objeto de usuário nas respostas contém os oito campos listados em “Dados retornados” e não contém `password` nem hash de senha.
9. Em qualquer um dos três endpoints, uma requisição sem token ou com token inválido retorna HTTP 401 antes da consulta.
10. O `UsersController` está registrado no `UsersModule` e usa as consultas disponibilizadas pelo `UsersService`.

## Fora do escopo

Atualização, exclusão, listagem geral ou paginada de usuários, alteração de senha e outros endpoints de CRUD.
