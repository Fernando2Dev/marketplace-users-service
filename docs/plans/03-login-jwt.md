# Plano de execução — login com JWT

Referência: [spec de login](../specs/03-login-jwt.md).

## Objetivo e contrato

Implementar `POST /auth/login` no `users-service`. O endpoint recebe `email` e `password`, valida o DTO e devolve HTTP 200 com **somente** `user` e `token` para uma conta `active` com senha correta. `user` contém `id`, `email`, `firstName`, `lastName`, `role`, `status`, `createdAt` e `updatedAt`. O JWT contém `sub`, `email`, `role` e expiração de 24 horas. A senha, seu hash e `JWT_SECRET` não aparecem em respostas nem no payload do token.

| Condição | Resultado |
| --- | --- |
| Entrada ausente, nula, de tipo incorreto ou fora das restrições do DTO | 400, com identificação dos campos inválidos |
| Email inexistente ou senha incorreta | 401, mensagem exata `Credenciais inválidas` |
| Conta `inactive` com senha correta | 401, mensagem exata `Conta inativa` |
| Conta `active` com senha correta | 200, com `user` e `token` |
| `JWT_SECRET` ausente ou vazio | Falha de configuração antes de emitir qualquer token |

## Condições observadas na preparação

- Reaproveitar `AuthModule`, `AuthController`, `AuthService`, `UsersService` e a entidade `User`. A entidade já possui os campos, papéis e status necessários; não há alteração de esquema prevista.
- O cadastro grava hashes com `bcrypt`, enquanto esta spec pede comparação com `bcryptjs`. Os testes e2e do login confirmam a compatibilidade com hashes gerados pelo cadastro existente; o cadastro continua usando `bcrypt`.
- Havia alterações locais em andamento na base de usuários. A base foi concluída em commit separado, preservando esse trabalho.
- A aplicação e os testes foram alinhados ao `ValidationPipe` padrão do Nest. O helper de validação antigo foi removido, conforme a edição local feita durante a implementação.

## Etapas de implementação e commits

1. **Dependências e configuração:** adicionar `bcryptjs` e a integração JWT da stack NestJS; atualizar o lockfile. Ler `JWT_SECRET` da configuração e exigir um valor não vazio na inicialização do componente que assina tokens. Incluir a variável, sem segredo real, em `.env.example` e documentar sua definição local. Fazer um commit desta etapa.
2. **Entrada HTTP:** criar `LoginDto` com `email` obrigatório, string e formato de email válido, e `password` obrigatória, string e comprimento mínimo de 6. Adicionar `POST /auth/login` ao controller existente, usando o fluxo de validação global. Manter o formato de 400 coerente com a aplicação. Fazer um commit desta etapa.
3. **Autenticação e resposta:** buscar o usuário pelo email; comparar a senha informada com o hash por `bcryptjs`. Se o usuário não existir ou a comparação falhar, lançar 401 `Credenciais inválidas`. Só após confirmar a senha, verificar `status`; se for `inactive`, lançar 401 `Conta inativa`. Para conta ativa, assinar o JWT com `sub = user.id`, `email`, `role` e validade de 24 horas. Construir explicitamente o objeto público `user` e retornar `{ user, token }`, sem serializar a entidade inteira. Fazer um commit desta etapa.
4. **Testes:** criar testes do endpoint com o PostgreSQL de teste já configurado. Cobrir conta ativa nos dois papéis, conteúdo e assinatura do JWT, diferença entre segredos, `exp - iat = 86400` segundos, email inexistente, senha incorreta, conta inativa com senha correta e incorreta, e entrada inválida ou ausente. Verificar as chaves exatas da resposta de sucesso, a ausência de token nos erros e a ausência de senha, hash e segredo em respostas e payload. Cobrir a falta de `JWT_SECRET` em teste de configuração isolado. Fazer um commit dos testes.
5. **Documentação:** atualizar o README com exemplo de requisição, respostas, configuração obrigatória de `JWT_SECRET` e comandos de verificação. Fazer um commit da documentação.

## Verificação final

Executar, dentro de `users-service`, `npm run build`, `npm run lint`, `npm test` e `npm run test:e2e`. O teste e2e já dispõe de PostgreSQL isolado, iniciado pelo script `pretest:e2e`. Confirmar que as respostas 400 e 401 não emitem token e que o token de sucesso valida apenas com o segredo configurado. Conferir o diff e o escopo de cada commit antes de concluí-lo.

Na implementação, build e lint passaram; os testes unitários passaram (4) e os testes e2e passaram (46).

## Limites

Este plano cobre somente a emissão do token no login. Guards, proteção de rotas, validação de tokens em outras requisições, sessions, refresh tokens e revogação ficam fora do escopo.
