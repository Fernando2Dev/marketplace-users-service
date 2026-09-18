# Scaffold do users-service

## Objetivo

Preparar o microserviço de usuários do marketplace com NestJS, TypeORM e PostgreSQL 15. O serviço deve rodar localmente na porta 3000 e possuir apenas a estrutura necessária para futuras funcionalidades de usuários.

## Requisitos funcionais

1. O projeto deve ser um aplicativo NestJS independente, em TypeScript, seguindo a organização e os scripts básicos dos demais serviços. Deve incluir as dependências necessárias para NestJS, TypeORM, PostgreSQL, configuração por ambiente e validação: `@nestjs/typeorm`, `typeorm`, `pg`, `@nestjs/config`, `class-validator` e `class-transformer`.
2. O serviço deve ter um Docker Compose próprio com PostgreSQL 15. Em desenvolvimento local, o banco deve estar acessível pela porta 5433 do host e conter o database `users_db`.
3. A conexão TypeORM com PostgreSQL deve usar as variáveis de ambiente listadas abaixo. O serviço deve iniciar na porta indicada por `PORT`, com 3000 como valor local esperado.
4. O aplicativo deve carregar um módulo básico de usuários e reconhecer a entidade `User` na configuração de persistência. Nesta etapa, o módulo não deve expor endpoints nem executar lógica de negócio.
5. O aplicativo deve habilitar `ValidationPipe` global para as validações de entrada que forem adicionadas em funcionalidades futuras.

## Estrutura de dados

### Entidade `User`

| Campo | Tipo e restrição | Comportamento |
| --- | --- | --- |
| `id` | UUID, chave primária | Gerado automaticamente. |
| `email` | String, obrigatório e único | Não pode repetir o valor de outro usuário. |
| `password` | String, obrigatório | Armazena o hash da senha. |
| `firstName` | String, obrigatório | Nome do usuário. |
| `lastName` | String, obrigatório | Sobrenome do usuário. |
| `role` | Enum, obrigatório: `seller` ou `buyer` | Papel do usuário no marketplace. |
| `status` | Enum: `active` ou `inactive` | Valor padrão: `active`. |
| `createdAt` | Timestamp | Preenchido automaticamente na criação. |
| `updatedAt` | Timestamp | Atualizado automaticamente quando o registro é alterado. |

A entidade deve conter somente esses campos. A definição do armazenamento do hash não inclui, nesta etapa, fluxo de cadastro ou geração de senha.

## Variáveis de ambiente

| Variável | Finalidade | Valor para desenvolvimento local |
| --- | --- | --- |
| `PORT` | Porta HTTP do serviço. | `3000` |
| `DB_HOST` | Host do PostgreSQL. | `localhost` |
| `DB_PORT` | Porta do PostgreSQL acessível ao serviço. | `5433` |
| `DB_USERNAME` | Usuário do banco. | Mesmo usuário configurado no Docker Compose. |
| `DB_PASSWORD` | Senha do banco. | Mesma senha configurada no Docker Compose. |
| `DB_DATABASE` | Nome do database. | `users_db` |

## Critérios de aceite

1. O projeto `users-service` possui estrutura NestJS independente, instala suas dependências e conclui a compilação sem erros.
2. O Docker Compose do serviço inicia um PostgreSQL 15, disponibiliza a porta 5433 do host e cria o database `users_db`.
3. Com as variáveis de ambiente válidas, o serviço inicia na porta 3000 e estabelece conexão com o PostgreSQL. Alterar os valores de conexão faz o serviço usar os novos valores.
4. A entidade `User` é reconhecida pelo TypeORM com exatamente os nove campos, tipos, valores de enum, restrição de unicidade e preenchimentos automáticos descritos acima.
5. A estrutura de banco impede dois usuários com o mesmo `email` e atribui `active` a `status` quando nenhum valor é informado.
6. O módulo de usuários está carregado pelo aplicativo e o `ValidationPipe` está registrado globalmente.
7. O scaffold não expõe endpoints nem inclui autenticação ou lógica de negócio.

## Fora do escopo

Endpoints, autenticação, autorização, cadastro, geração ou verificação de hash e regras de negócio serão definidos em specs futuras.

## Commits

Faça sempre um commit após cada implementação dessa spec
