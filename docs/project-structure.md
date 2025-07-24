
> open-give-backend@0.0.1 tree
> tree -I 'node_modules|dist|.git|.husky|generated|backup.*|structure.txt|*.log|.env*' -L 10

.
├── README.md
├── docs
│   ├── DB.md
│   ├── ERROR.md
│   ├── GIT_WORKFLOW.md
│   ├── ISSUE_WSL.md
│   ├── NestJS.md
│   ├── PRISMA.MD
│   ├── TIP.md
│   ├── auth-module.md
│   ├── auth-system-test-scenarios.md
│   ├── format-code-before-commit.md
│   ├── migrations-db.md
│   ├── nestjs-coding-convention.md
│   ├── prisma-errors.md
│   └── project-structure.md
├── eslint.config.mjs
├── nest-cli.json
├── package-lock.json
├── package.json
├── pnpm-lock.yaml
├── prisma
│   ├── migrations
│   │   ├── 20250714172835_initial_setup_with_fixed_refresh_token
│   │   │   └── migration.sql
│   │   ├── 20250720101151_init_with_2fa
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   └── schema.prisma
├── src
│   ├── app.controller.spec.ts
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   ├── config
│   │   ├── auth.config.ts
│   │   ├── config.schema.ts
│   │   └── database-validation.ts
│   ├── core
│   │   ├── notification
│   │   │   ├── email
│   │   │   │   └── email.service.ts
│   │   │   ├── interfaces
│   │   │   │   └── notification.interface.ts
│   │   │   ├── notification
│   │   │   │   └── notification.service.ts
│   │   │   ├── notification.controller.ts
│   │   │   ├── notification.module.ts
│   │   │   └── sms
│   │   │       └── sms.service.ts
│   │   ├── prisma
│   │   │   └── prisma.service.ts
│   │   └── security
│   │       └── hash
│   │           └── hash.service.ts
│   ├── main.ts
│   ├── modules
│   │   ├── auth
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── constants.ts
│   │   │   ├── decorators
│   │   │   │   ├── get-user.decorator.ts
│   │   │   │   └── public.decorator.ts
│   │   │   ├── dto
│   │   │   │   ├── login.dto.ts
│   │   │   │   ├── register.dto.ts
│   │   │   │   ├── two-factor.dto.ts
│   │   │   │   └── user-profile-dto.ts
│   │   │   ├── guards
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   └── jwt-refresh.guard.ts
│   │   │   ├── interfaces
│   │   │   │   └── jwt-payload.interface.ts
│   │   │   ├── repositories
│   │   │   │   └── auth.repository.ts
│   │   │   ├── services
│   │   │   │   └── two-factor.service.ts
│   │   │   └── strategies
│   │   │       ├── jwt-refresh.strategy.ts
│   │   │       └── jwt.strategy.ts
│   │   └── users
│   │       ├── dto
│   │       │   ├── create-user.dto.ts
│   │       │   ├── update-user.dto.ts
│   │       │   └── user-profile-dto.ts
│   │       ├── entities
│   │       │   └── user.entity.ts
│   │       ├── users.controller.ts
│   │       ├── users.module.ts
│   │       └── users.service.ts
│   └── utils
│       └── check-env-file.ts
├── test
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── tsconfig.build.json
└── tsconfig.json

31 directories, 69 files
