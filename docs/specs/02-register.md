# Registro de usuários no users-service

## Objetivo

Permitir o cadastro de novos usuários do marketplace por meio do `users-service`, persistindo os dados na entidade `User` existente e protegendo a senha.

## Requisitos funcionais

1. O serviço deve possuir um `AuthModule`, com controller e service responsáveis pelo registro de usuários.
2. O endpoint `POST /auth/register` deve receber os dados definidos no DTO de criação, validar a entrada e cadastrar um usuário no banco de dados.
3. Antes do cadastro, o serviço deve verificar se o email informado já pertence a um usuário. Um email já cadastrado deve resultar em HTTP 409, sem criar outro usuário. A mesma resposta deve ser garantida se a duplicidade for detectada durante a persistência.
4. A senha persistida deve ser um hash bcrypt gerado com 10 salt rounds. A senha em texto plano não deve ser armazenada.
5. O `status` do novo usuário deve ser definido automaticamente como `active`. O cliente não deve informar esse campo.
6. O serviço deve gerar o `id` e registrar `createdAt` e `updatedAt` conforme a entidade `User` existente.
7. A resposta do endpoint nunca deve conter `password`, tanto em caso de sucesso quanto em caso de erro. Mensagens de erro também não devem reproduzir o valor da senha recebida.
8. Dados inválidos devem resultar em HTTP 400 com uma lista de erros de validação que identifique o campo e explique a restrição violada. Campos não previstos no DTO devem ser rejeitados.

## Estrutura de dados

### DTO de criação — corpo de `POST /auth/register`

| Campo | Obrigatório | Restrição |
| --- | --- | --- |
| `email` | Sim | String em formato de email válido. |
| `password` | Sim | String com pelo menos 6 caracteres. |
| `firstName` | Sim | String não vazia com no máximo 100 caracteres. |
| `lastName` | Sim | String não vazia com no máximo 100 caracteres. |
| `role` | Sim | Valor `seller` ou `buyer`. |

Valores ausentes, nulos ou de tipo incorreto são inválidos. `firstName` e `lastName` compostos apenas por espaços também são inválidos. `status`, `id`, `createdAt` e `updatedAt` não fazem parte da entrada.

### Dados do usuário retornados no sucesso

| Campo | Conteúdo |
| --- | --- |
| `id` | UUID do usuário criado. |
| `email` | Email cadastrado. |
| `firstName` | Nome cadastrado. |
| `lastName` | Sobrenome cadastrado. |
| `role` | `seller` ou `buyer`, conforme a entrada. |
| `status` | `active`. |
| `createdAt` | Data e hora de criação. |
| `updatedAt` | Data e hora da última atualização. |

O campo `password` não integra a estrutura de resposta.

## Respostas esperadas

| HTTP | Condição | Resposta |
| --- | --- | --- |
| 201 Created | Dados válidos e email ainda não cadastrado. | Dados do usuário criado, conforme a estrutura acima, sem `password`. |
| 400 Bad Request | Um ou mais campos ausentes, inválidos ou não previstos no DTO. | Lista de erros com o campo e uma mensagem clara para cada restrição violada; nenhum usuário é criado. |
| 409 Conflict | Email já cadastrado. | Erro que informa a duplicidade do email, sem `password`; nenhum usuário é criado. |

## Critérios de aceite

1. Ao enviar os cinco campos válidos para `POST /auth/register` com um email ainda não cadastrado, a resposta é 201 e existe exatamente um novo registro de usuário no banco.
2. O registro criado contém os dados informados, `status` igual a `active`, um UUID em `id` e valores preenchidos em `createdAt` e `updatedAt`.
3. A senha salva não é igual à senha enviada e corresponde a um hash bcrypt com 10 salt rounds. O valor original não é persistido em texto plano.
4. A resposta 201 contém somente os campos listados em “Dados do usuário retornados no sucesso”; `password` não aparece na resposta.
5. Ao repetir o cadastro com um email já existente, a resposta é 409 e a quantidade de usuários com esse email permanece igual a um, inclusive quando a duplicidade ocorrer em requisições concorrentes.
6. A ausência ou invalidade de cada campo obrigatório, senha com menos de 6 caracteres, nome ou sobrenome com mais de 100 caracteres, `role` fora de `seller` e `buyer`, ou campos extras produzem 400 com uma lista de erros que identifica os campos afetados. Nenhum usuário é criado nesses casos.
7. Nenhuma resposta 400 ou 409 inclui o campo `password` nem o valor da senha enviada.

## Fora do escopo

Login, JWT, emissão de tokens, autorização e quaisquer outros endpoints de autenticação ou usuários.

## Commits

Faça sempre um commit após cada implementação dessa spec
