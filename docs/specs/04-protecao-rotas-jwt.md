# Proteção de rotas com JWT no users-service

## Objetivo

Exigir autenticação por JWT em todas as rotas do `users-service`, exceto nas rotas explicitamente públicas, aproveitando os tokens já emitidos por `POST /auth/login`.

## Requisitos funcionais

1. O serviço deve possuir uma `JwtStrategy` do Passport que obtenha o token exclusivamente do header `Authorization` no formato `Bearer <token>`.
2. A estratégia deve validar a assinatura do token com o segredo JWT configurado para o serviço e rejeitar tokens expirados.
3. Para um token válido, a estratégia deve disponibilizar um objeto de usuário com exatamente `id`, `email` e `role`, extraídos respectivamente das claims `sub`, `email` e `role` do JWT emitido pelo login. Esse objeto deve ficar disponível em `req.user` durante o processamento de cada rota protegida.
4. O serviço deve possuir um `JwtAuthGuard` baseado no `AuthGuard` do Passport. Antes de exigir autenticação, ele deve verificar o metadata `isPublic` da rota.
5. Uma rota marcada como pública deve permitir a requisição sem token. Nas demais rotas, o guard deve exigir um JWT válido.
6. O `JwtAuthGuard` deve ser registrado globalmente por meio de `APP_GUARD`, para que toda rota atual ou futura do `users-service` seja protegida por padrão.
7. O serviço deve possuir um decorator `@Public()` que marque uma rota como pública por meio do metadata `isPublic` do NestJS, reconhecido pelo guard.
8. As rotas existentes `POST /auth/register` e `POST /auth/login` devem ser marcadas com `@Public()` e continuar acessíveis sem JWT.

## Fluxo esperado de uma requisição

1. A requisição chega a uma rota do `users-service` e passa pelo `JwtAuthGuard` global.
2. O guard verifica se a rota possui o metadata `isPublic`. Se possuir, libera a requisição sem exigir token.
3. Caso contrário, a `JwtStrategy` extrai o token Bearer do header `Authorization` e valida sua assinatura e expiração.
4. Com token válido, os dados `id`, `email` e `role` são disponibilizados em `req.user`, e o controller processa a requisição.
5. Sem token válido, a requisição termina com HTTP 401 antes de chegar ao controller.

## Respostas esperadas para rotas protegidas

| Condição | Resultado |
| --- | --- |
| Header `Authorization` ausente ou sem token Bearer | HTTP 401 Unauthorized. |
| Token expirado | HTTP 401 Unauthorized. |
| Token com assinatura inválida | HTTP 401 Unauthorized. |
| Token válido | A requisição chega ao controller, com `req.user` preenchido; a resposta normal depende da rota. |

## Critérios de aceite

1. `POST /auth/register` e `POST /auth/login` permanecem acessíveis sem header `Authorization` e preservam seus comportamentos já especificados.
2. Qualquer rota do `users-service` sem `@Public()` exige autenticação automaticamente, sem registro individual do guard na rota ou no controller.
3. Em uma rota protegida, a ausência do header `Authorization` ou a ausência de um token no formato `Bearer <token>` resulta em HTTP 401, sem executar o controller.
4. Em uma rota protegida, um JWT expirado ou assinado com segredo diferente do configurado resulta em HTTP 401, sem executar o controller.
5. Em uma rota protegida, um JWT válido emitido por `POST /auth/login` permite que o controller execute e encontre em `req.user` o `id` igual à claim `sub`, além de `email` e `role` iguais às claims correspondentes.
6. O objeto `req.user` de uma rota protegida contém somente `id`, `email` e `role`; não contém senha, hash nem o token.
7. Uma rota marcada com `@Public()` permite acesso sem JWT, enquanto uma rota equivalente sem a marcação exige um JWT válido.

## Fora do escopo

`RoleGuard`, `SessionGuard`, novos endpoints, autorização por papel, refresh tokens e revogação de tokens.
