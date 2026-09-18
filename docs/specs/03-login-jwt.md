# Login com JWT no users-service

## Objetivo

Permitir que um usuário cadastrado e ativo entre no `users-service` com email e senha e receba um token JWT válido por 24 horas.

## Requisitos funcionais

1. O endpoint `POST /auth/login` deve receber e validar o email e a senha conforme o DTO de login.
2. O serviço deve buscar no banco de dados o usuário correspondente ao email informado.
3. A senha informada deve ser comparada ao hash bcrypt armazenado para o usuário, usando a stack prevista com `bcryptjs`.
4. Email não encontrado ou senha incorreta devem resultar em HTTP 401 com a mesma mensagem exata: `Credenciais inválidas`. A resposta não deve indicar qual dos dois campos está incorreto.
5. Após validar as credenciais, o serviço deve permitir o login somente se o `status` do usuário for `active`. Uma conta `inactive` com senha correta deve resultar em HTTP 401 com a mensagem exata `Conta inativa`.
6. Para credenciais válidas de uma conta ativa, o serviço deve emitir um JWT assinado, com expiração de 24 horas e com os dados definidos na seção “Payload JWT”.
7. O segredo de assinatura do JWT deve vir da variável de ambiente `JWT_SECRET`. A emissão do token não deve usar um segredo fixo no projeto nem prosseguir sem um valor configurado.
8. O sucesso deve retornar HTTP 200 com um objeto `user` e uma string `token`. O objeto `user` deve conter os dados públicos definidos abaixo e nunca incluir `password` ou seu hash.
9. A implementação deve se limitar à emissão do JWT no login. Não deve introduzir proteção de rotas, guards, sessions, refresh tokens ou outros mecanismos de autenticação.

## Estrutura de dados

### DTO de login — corpo de `POST /auth/login`

| Campo | Obrigatório | Restrição |
| --- | --- | --- |
| `email` | Sim | String em formato de email válido. |
| `password` | Sim | String com pelo menos 6 caracteres. |

Valores ausentes, nulos ou de tipo incorreto são inválidos.

### Payload JWT

| Claim | Conteúdo |
| --- | --- |
| `sub` | UUID do usuário autenticado. |
| `email` | Email do usuário autenticado. |
| `role` | Papel do usuário autenticado: `seller` ou `buyer`. |

O token deve conter uma expiração equivalente a 24 horas após sua emissão. A senha e seu hash não devem aparecer no payload.

### Objeto `user` retornado no sucesso

| Campo | Conteúdo |
| --- | --- |
| `id` | UUID do usuário autenticado. |
| `email` | Email cadastrado. |
| `firstName` | Nome cadastrado. |
| `lastName` | Sobrenome cadastrado. |
| `role` | `seller` ou `buyer`. |
| `status` | `active`. |
| `createdAt` | Data e hora de criação do usuário. |
| `updatedAt` | Data e hora da última atualização do usuário. |

### Resposta de sucesso

| Campo | Tipo | Conteúdo |
| --- | --- | --- |
| `user` | Objeto | Exatamente os campos públicos listados acima, sem `password`. |
| `token` | String | JWT assinado com o payload e a validade definidos nesta spec. |

## Respostas esperadas

| HTTP | Condição | Resposta |
| --- | --- | --- |
| 200 OK | Email e senha corretos; conta `active`. | Objeto com `user` e `token`. |
| 400 Bad Request | Email ou senha ausente, nulo, de tipo incorreto ou fora das restrições do DTO. | Erros de validação que identifiquem os campos inválidos. |
| 401 Unauthorized | Email não encontrado ou senha incorreta. | Mensagem `Credenciais inválidas`. |
| 401 Unauthorized | Email e senha corretos; conta `inactive`. | Mensagem `Conta inativa`. |

Nenhuma resposta deve expor a senha fornecida, o hash armazenado ou o valor de `JWT_SECRET`.

## Critérios de aceite

1. Com email e senha corretos de um usuário `active`, `POST /auth/login` responde 200 com somente `user` e `token`; `user` contém os oito campos públicos especificados e não contém `password`.
2. O `token` retornado é um JWT assinado com o segredo configurado em `JWT_SECRET`, contém `sub` igual ao UUID, `email` e `role` do usuário autenticado e expira 24 horas após a emissão.
3. Alterar `JWT_SECRET` altera o segredo exigido para validar os novos tokens; sem `JWT_SECRET` configurado, o serviço não emite token.
4. Um email inexistente e uma senha incorreta para um email existente produzem, em ambos os casos, HTTP 401 e a mesma mensagem exata `Credenciais inválidas`.
5. Um usuário `inactive` com email e senha corretos recebe HTTP 401 e a mensagem exata `Conta inativa`; nenhum token é emitido.
6. Um usuário `inactive` com senha incorreta recebe HTTP 401 e a mensagem `Credenciais inválidas`; nenhum token é emitido.
7. Email ausente ou inválido e senha ausente ou com menos de 6 caracteres produzem HTTP 400 com indicação do campo inválido; nenhum token é emitido.
8. Nenhuma resposta ou payload JWT contém `password`, hash de senha ou `JWT_SECRET`.

## Fora do escopo

Proteção de rotas, guards, validação de tokens em requisições subsequentes, sessions, refresh tokens, revogação de tokens e outros fluxos de autenticação.

## Commits na implementação futura

A LLM que implementar esta spec deve fazer commits granulares: um commit após cada item inserido ou concluído no projeto, incluindo apenas as alterações daquele item. Não acumular vários itens independentes em um único commit.
