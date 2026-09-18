# Plano de execução revisado — registro de usuários

Referência: [spec de registro](../specs/02-register.md).

## Objetivo e contrato

Implementar `POST /auth/register` no `users-service`. A entrada contém `email`, `password`, `firstName`, `lastName` e `role`. A resposta 201 contém somente `id`, `email`, `firstName`, `lastName`, `role`, `status`, `createdAt` e `updatedAt`. Erros de validação retornam 400 com uma lista de `{ field, message }`; email duplicado retorna 409. Nenhuma resposta contém a senha recebida.

## Etapas e commits

1. **Cadastro e validação:** adicionar bcrypt e tipos, criar `AuthModule` com controller, service e DTO e registrá-lo no aplicativo. Validar presença, tipos, limites, nomes só com espaços e campos extras. Consultar o email antes da gravação, salvar apenas o hash bcrypt com 10 rounds, definir `active` e projetar explicitamente a resposta. Quando a inserção violar unicidade, consultar novamente o email para decidir entre 409 e a falha original. Fazer um commit dessa entrega.
2. **Testes:** usar um PostgreSQL de teste separado na porta 5436, configurável por `USERS_TEST_DB_PORT`. Testar a rota e o banco, inclusive dados persistidos, hash, lista de erros, ausência da senha, email existente e duas requisições concorrentes. Testar no service a violação de unicidade ocorrida durante a gravação. Fazer um commit dos testes e da infraestrutura de teste.
3. **Documentação:** atualizar o README com entrada, respostas e comandos de verificação. Substituir o plano anterior por esta versão. Fazer um commit da documentação.

O `users-service` é um repositório Git próprio dentro do workspace. Preparar para cada commit somente os arquivos pertinentes à entrega; preservar alterações anteriores não relacionadas à implementação.

## Verificação final

Executar `npm run build`, `npm run lint`, `npm test` e `npm run test:e2e`. Confirmar que os testes de 400 não inserem usuários e que os testes de 409 deixam exatamente um registro para o email, mesmo sob concorrência.

## Premissas

Usar a entidade `User` existente e sua restrição única de email, sem alterar o esquema ou criar migração. O banco de teste é isolado do banco local de desenvolvimento. Login, tokens e autorização permanecem fora do escopo.
