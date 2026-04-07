# Oh-My-Codex: Análise de Arquitetura de Orquestração de Agentes

**Resumo Executivo em Português**

## O que foi explorado?

Uma análise profunda do sistema **oh-my-codex (OMX)**, um framework de orquestração de agentes multi-modo construído sobre o Codex CLI.

## Principais descobertas

### 1. Gestão de Estado em `.omx/`

O sistema utiliza uma **hierarquia multi-escopo**:

```
.omx/
├── state/
│   ├── {mode}-state.json           (root scope)
│   ├── session.json
│   └── sessions/{session-id}/      (session scope)
│       └── {mode}-state.json
├── project-memory.json             (contexto persistente)
├── notepad.md                      (bloco de notas)
├── logs/
│   └── turns-*.jsonl              (eventos estruturados)
└── plans/
    └── prd-*.md                    (requisitos)
```

**Inovação**: Leitura com fallback (busca em session, depois root) permite isolamento com compatibilidade.

### 2. Cinco Servidores MCP

**Cada servidor fornece ferramentas via stdio**:

| Servidor | Responsabilidade |
|----------|-----------------|
| `omx-state` | Ler/escrever estado de modos |
| `omx-memory` | Memória de projeto + bloco de notas |
| `omx-code-intel` | Diagnósticos de código (tsc, ast-grep) |
| `omx-team` | Spawnar workers via tmux |
| `omx-trace` | Parse de logs de eventos |

**Padrão**: Não usam LSP (pesado), wrapper CLI wrappers (leve, pragmático).

### 3. Orquestração em Equipe

**Máquina de estados com 5 fases**:

```
team-plan → team-prd → team-exec → team-verify → team-fix (loop) → {complete|failed}
```

**Arquitetura leader-worker**:
- Leader (agente principal) em tmux pane
- N workers em panes separados
- Comunicação via mailbox (JSON files)
- Dispatch queue para tarefas (durável)
- Authority leasing previne líderes antigos

### 4. Pipeline Composável

Sequência de **estágios reutilizáveis**:

```
Context{task, artifacts} 
  ↓
[Stage 1: ralplan] → Plan artifact
  ↓
[Stage 2: team-exec] → Results artifact
  ↓
[Stage 3: ralph-verify] → Report artifact
  ↓
Result{status, artifacts, duration}
```

**Benefício**: Fácil adicionar novos estágios sem modificar os existentes.

### 5. Notificações Escaláveis

Após cada turn do agente:

```
Codex CLI turn complete
  ↓
notify hook dispara
  ├─ Dedup turn (evita duplicatas)
  ├─ Log para JSONL
  ├─ Update mode state
  ├─ Drain dispatch queue
  ├─ Detect staleness
  ├─ Inject tmux status
  └─ Update worker heartbeat
```

**Vantagem**: Acoplamento fraco, escalável para muitos modos.

## Padrões Arquiteturais Interessantes

### 1. Operações Atômicas com Arquivos Temporários

```typescript
const tmpPath = `${path}.tmp.${pid}.${timestamp}`;
await writeFile(tmpPath, data);
await rename(tmpPath, path);  // Quase atômico em filesystems modernos
```

Previne corrupção de dados em caso de crash.

### 2. Serialização por Caminho (não global)

```typescript
const stateWriteQueues = new Map<string, Promise<void>>();
// Cada arquivo tem sua fila própria → sem locks globais
// Permite concorrência + segurança
```

### 3. Resolução de Escopo com Fallback

```typescript
// Se tem session_id explícito → usa session dir
// Se tem session.json → tenta session dir, depois root
// Se não tem session → root dir
```

Suporta isolamento de sessão com backward compatibility.

### 4. Máquinas de Estado com Validação

```typescript
const TRANSITIONS: Record<TeamPhase, ValidPhases[]> = {
  'team-plan': ['team-prd'],
  'team-prd': ['team-exec'],
  // ...
};

function isValidTransition(from: TeamPhase, to: TeamPhase): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}
```

Type-safe em compile time, validado em runtime.

### 5. AsyncGenerator para Streaming

```typescript
async function* iterateLogEntries(dir: string): AsyncGenerator<Entry> {
  for (const file of files) {
    for await (const line of readLines(file)) {
      yield JSON.parse(line);
    }
  }
}
```

Processa logs gigantes sem carregar tudo em memória.

## Por Que Isso É Bom?

| Aspecto | Benefício |
|--------|----------|
| **Filesystem-first** | Sem dependências de DB, fácil debug |
| **Type-safe** | TypeScript + Zod previne bugs |
| **Atomic writes** | Sem corrupção parcial |
| **Per-path queues** | Concorrência sem global locks |
| **Pluggable stages** | Fácil estender pipeline |
| **Post-turn hooks** | Acoplamento fraco, escalável |
| **Authority leasing** | Previne split-brain em distribuído |

## Tecnologias Chave

- **Linguagem**: TypeScript + Node.js
- **Persistência**: JSON/JSONL em filesystem
- **IPC**: MCP (Model Context Protocol)
- **Sessions**: tmux para multi-workers
- **Integration**: Codex CLI notify hook
- **Runtime bridge**: Rust para autoridade distribuída

## Aplicabilidade

Padrões úteis para:
- Sistemas de coordenação multi-agente
- Engines de workflow com estado
- Frameworks de automação baseados em agentes
- Pipelines de verificação e testing
- Qualquer sistema que precise de state durável + concorrência

## Arquivos Gerados

1. **omx-state-mcp-team.md** (1.254 linhas)
   - Análise técnica completa
   - 30+ referências de código
   - 5 diagramas ASCII
   - Exemplos de TypeScript
   - Explicações de padrões

2. **README.md** (150 linhas)
   - Guia de navegação
   - Índice rápido
   - Resumo de insights
   - Links relacionados

## Conclusão

Oh-My-Codex é um **exemplo excelente** de como construir sistemas de orquestração de agentes em produção com:

1. **Simplicidade** (filesystem + JSON)
2. **Segurança** (operações atômicas + validação)
3. **Extensibilidade** (estágios + servidores plugáveis)
4. **Observabilidade** (logging + HUD)
5. **Escalabilidade** (hooks desacoplados)

Os padrões são **altamente reutilizáveis** em outros contextos de sistemas distribuídos e agent-based.

---

**Commit**: 1ca1f10 (documento principal)
**Analyzer**: Claude Sonnet 4.6
**Data**: 2026-04-01
