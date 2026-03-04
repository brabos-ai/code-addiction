# Technical Style

Estilo para documentação técnica: planos de implementação, specs de arquitetura, configs.

**Usar em:** plan.md, changelog.md, architecture docs, configs

---

## Princípio

Máxima densidade de informação. JSON compacto para specs, texto mínimo para contexto.

---

## Estrutura Obrigatória

```markdown
# [Título]

[Contexto em 2-3 linhas - O QUE será feito e POR QUE]

---

## Spec

### [Seção]
{"key":"value","nested":{"a":"b"}}

### [Seção]
[{"item":"X","path":"..."},{"item":"Y","path":"..."}]
```

---

## Formatos por Tipo de Conteúdo

### Paths e Arquivos
```
{"files":{"create":["path/file.ts"],"modify":["path/existing.ts"]}}
```

### Dependências
```
{"deps":{"npm":["package@version"],"internal":["@add/domain"]}}
```

### Configurações
```
{"config":{"env":["VAR_NAME"],"files":["path/config.ts"]}}
```

### Fluxos de Execução
```
step1 → step2 → step3 → result
```

### Tasks/Checklist
```
{"tasks":[{"id":1,"desc":"Criar entity","status":"pending"},{"id":2,"desc":"Criar repository","status":"pending"}]}
```

---

## Exemplos

### plan.md
```markdown
# Plan: User Notifications

Implementar sistema de notificações push para usuários. Integração com Firebase Cloud Messaging.

---

## Spec

### Context
{"feature":"F0012-user-notifications","branch":"feature/F0012-user-notifications","deps":["firebase-admin@12.0"]}

### Files
{"create":["apps/backend/src/api/modules/notifications/notifications.module.ts","apps/backend/src/api/modules/notifications/notifications.service.ts","apps/backend/src/api/modules/notifications/notifications.controller.ts","libs/domain/src/entities/Notification.ts"],"modify":["apps/backend/src/api/api.module.ts","libs/app-database/src/types/Database.ts"]}

### Tasks
[{"id":1,"task":"Criar entity Notification","estimate":"S"},{"id":2,"task":"Criar migration","estimate":"S"},{"id":3,"task":"Criar NotificationsModule","estimate":"M"},{"id":4,"task":"Implementar FCM integration","estimate":"L"},{"id":5,"task":"Criar endpoints REST","estimate":"M"}]

### Flow
request → validate → queue job → FCM send → update status → webhook callback
```

### changelog.md
```markdown
# Changelog: User Notifications

Registro do que foi implementado na feature F0012.

---

## Summary
Sistema de notificações push com FCM implementado.

## Files Changed
[{"file":"libs/domain/src/entities/Notification.ts","action":"created"},{"file":"apps/backend/src/api/modules/notifications/","action":"created"}]

### Pending
[{"task":"FCM integration","blocker":"Aguardando credenciais Firebase"}]

### Issues Found
[{"issue":"Rate limit FCM","solution":"Implementar batching","file":"notifications.service.ts:45"}]
```

---

## Anti-Patterns

| Errado | Correto |
|--------|---------|
| "Vários arquivos serão criados" | `{"create":["path/a.ts","path/b.ts"]}` |
| "Configurar variáveis de ambiente" | `{"env":["FCM_KEY","FCM_PROJECT_ID"]}` |
| Parágrafos explicando estrutura | JSON com paths explícitos |
| Tasks sem estimate | `{"task":"X","estimate":"S/M/L"}` |

---

## Checklist

- [ ] Contexto em máximo 3 linhas
- [ ] Todos os paths são verificáveis
- [ ] JSON em uma linha (minificado)
- [ ] Zero redundância com outros docs
- [ ] Tasks com estimates (S/M/L)
