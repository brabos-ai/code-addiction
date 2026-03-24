# Arquitetura Frontend -- Plataforma Bancaria Angular 17

## 1. Contexto Detectado

| Dimensao | Valor | Classificacao |
|----------|-------|---------------|
| **Framework** | Angular 17 | Alta opiniao -- modulos, DI, routing, forms ja definidos |
| **Escala** | 50+ telas, 8+ modulos de dominio | **Grande** |
| **Time** | 8 devs frontend | **Grande** |
| **Reuso de componentes** | 100+ componentes em shared module | **Pesado (e problematico)** |
| **Complexidade de dominio** | Regras bancarias por modulo (conta, cartao, investimentos, seguros, emprestimos, PIX, extratos, config) | **Pesada** |

## 2. Diagnostico do Problema Atual

O que voce descreve e o anti-pattern classico do Angular chamado **"God Module"** combinado com **shared module inflado**. Sinais claros:

- Um `SharedModule` com 100+ componentes que todo mundo importa de todo lugar
- Nenhuma fronteira real entre dominios -- qualquer modulo acessa qualquer coisa
- Acoplamento invisivel: mudar um componente "shared" quebra modulos que voce nem sabia que dependiam dele
- Dificuldade de onboarding -- devs novos nao sabem onde colocar coisas
- Build lento porque tudo depende de tudo

## 3. Padrao Recomendado: Feature-Sliced Design (FSD)

Para o seu contexto (8 devs, 50+ telas, dominios complexos e independentes), o padrao correto e **Feature-Sliced Design** adaptado ao Angular 17.

**Por que nao Feature-Based simples?** Feature-Based funciona bem ate ~30 telas com 3-5 devs. Com 8 devs e dominios bancarios pesados que interagem entre si (ex: PIX precisa acessar dados de conta corrente, emprestimo precisa de dados de seguros), voce precisa de **camadas com regras de dependencia estritas** para evitar que o caos volte.

**Por que nao manter o modelo atual com refactor leve?** Porque o shared module de 100+ componentes e um sintoma de ausencia de fronteiras arquiteturais. Reorganizar sem mudar a arquitetura apenas muda o caos de lugar.

## 4. Estrutura Proposta

```
src/app/
  app.component.ts
  app.config.ts
  app.routes.ts

  ──────────────────────────────────────
  CAMADA: pages/ (composicao de rota)
  ──────────────────────────────────────
  pages/
    dashboard/
      dashboard-page.component.ts
    conta-corrente/
      conta-corrente-page.component.ts
      extrato-page.component.ts
    cartao/
      cartao-page.component.ts
      fatura-page.component.ts
    investimentos/
      investimentos-page.component.ts
      detalhes-investimento-page.component.ts
    seguros/
      seguros-page.component.ts
    emprestimos/
      emprestimos-page.component.ts
      simulacao-page.component.ts
    pix/
      pix-page.component.ts
      pix-historico-page.component.ts
    configuracoes/
      configuracoes-page.component.ts

  ──────────────────────────────────────
  CAMADA: widgets/ (blocos complexos de UI que combinam features)
  ──────────────────────────────────────
  widgets/
    resumo-financeiro/
      ui/
        resumo-financeiro.component.ts
      model/
        resumo-financeiro.service.ts
      index.ts
    header-bancario/
      ui/
        header-bancario.component.ts
        notificacoes-dropdown.component.ts
      index.ts

  ──────────────────────────────────────
  CAMADA: features/ (interacoes do usuario, logica de negocio)
  ──────────────────────────────────────
  features/
    conta-corrente/
      components/
        saldo-card.component.ts
        transferencia-form.component.ts
        extrato-table.component.ts
        extrato-filters.component.ts
      services/
        conta-corrente.service.ts
        extrato.service.ts
      models/
        conta.model.ts
        transacao.model.ts
      guards/
        conta-ativa.guard.ts
      conta-corrente.routes.ts
      index.ts                          <-- API publica da feature

    cartao-credito/
      components/
        cartao-card.component.ts
        fatura-detail.component.ts
        limite-progress.component.ts
        parcelamento-form.component.ts
      services/
        cartao.service.ts
        fatura.service.ts
      models/
        cartao.model.ts
        fatura.model.ts
      cartao.routes.ts
      index.ts

    investimentos/
      components/
        portfolio-chart.component.ts
        investimento-card.component.ts
        aplicacao-form.component.ts
        resgate-form.component.ts
      services/
        investimento.service.ts
        rentabilidade.service.ts
      models/
        investimento.model.ts
      investimentos.routes.ts
      index.ts

    seguros/
      components/
        apolice-card.component.ts
        contratacao-wizard.component.ts
        sinistro-form.component.ts
      services/
        seguro.service.ts
      models/
        apolice.model.ts
      seguros.routes.ts
      index.ts

    emprestimos/
      components/
        simulador.component.ts
        contrato-detail.component.ts
        parcelas-table.component.ts
      services/
        emprestimo.service.ts
        simulacao.service.ts
      models/
        emprestimo.model.ts
      emprestimos.routes.ts
      index.ts

    pix/
      components/
        pix-form.component.ts
        chaves-pix-list.component.ts
        pix-comprovante.component.ts
        pix-agendamento-form.component.ts
      services/
        pix.service.ts
        chaves-pix.service.ts
      models/
        pix.model.ts
      pix.routes.ts
      index.ts

    configuracoes/
      components/
        perfil-form.component.ts
        seguranca-settings.component.ts
        notificacoes-settings.component.ts
      services/
        configuracoes.service.ts
      configuracoes.routes.ts
      index.ts

  ──────────────────────────────────────
  CAMADA: entities/ (objetos de negocio reutilizaveis entre features)
  ──────────────────────────────────────
  entities/
    usuario/
      models/
        usuario.model.ts
      services/
        usuario.service.ts
      index.ts
    conta/
      models/
        conta.model.ts
      index.ts
    transacao/
      models/
        transacao-base.model.ts
      ui/
        valor-transacao.component.ts    <-- exibe valor com cor (positivo/negativo)
        status-badge.component.ts
      index.ts

  ──────────────────────────────────────
  CAMADA: shared/ (infraestrutura, UI kit, zero logica de negocio)
  ──────────────────────────────────────
  shared/
    components/
      ui/
        button.component.ts
        input.component.ts
        select.component.ts
        modal.component.ts
        table.component.ts
        card.component.ts
        skeleton.component.ts
        toast.component.ts
        stepper.component.ts
        tabs.component.ts
        badge.component.ts
        progress-bar.component.ts
        empty-state.component.ts
      layout/
        page-wrapper.component.ts
        sidebar.component.ts
        breadcrumbs.component.ts
    services/
      api.service.ts
      notification.service.ts
      loading.service.ts
    interceptors/
      auth.interceptor.ts
      error.interceptor.ts
      loading.interceptor.ts
    pipes/
      format-currency.pipe.ts
      format-date.pipe.ts
      format-cpf.pipe.ts
      format-agencia-conta.pipe.ts
    guards/
      auth.guard.ts
    models/
      api-response.model.ts
      pagination.model.ts
```

### Regra de Dependencia (Estrita)

```
pages --> widgets --> features --> entities --> shared
```

Cada camada so importa das camadas **abaixo**. Nunca para cima.

- `pages/` importa de `widgets/`, `features/`, `entities/`, `shared/`
- `widgets/` importa de `features/`, `entities/`, `shared/`
- `features/` importa de `entities/` e `shared/`
- `entities/` importa apenas de `shared/`
- `shared/` nao importa de ninguem acima

**Feature A nunca importa diretamente de Feature B.** Se PIX precisa de dados de conta corrente, isso vai por:
1. Um service em `entities/conta/` que ambas as features consomem, ou
2. Um `widget/` que compoe as duas features, ou
3. Navegacao via Router (a feature de PIX redireciona para conta corrente)

## 5. Decisoes Tecnicas Especificas para Angular 17

### Standalone Components (Sim, migrem)

Com Angular 17, usem **standalone components** em vez de NgModules. Isso elimina a necessidade do SharedModule monolitico que e a raiz do problema atual. Cada componente declara explicitamente suas dependencias:

```typescript
@Component({
  selector: 'app-pix-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,      // de shared/
    InputComponent,       // de shared/
    ValorTransacaoComponent, // de entities/transacao/
  ],
  templateUrl: './pix-form.component.html',
})
export class PixFormComponent {
  private pixService = inject(PixService);
  // ...
}
```

Sem SharedModule, cada componente importa **so o que usa**. Tree-shaking funciona melhor. Dependencias ficam explicitas.

### Signals para Estado de UI, RxJS para Dados

```typescript
// Signals -- estado de filtros, UI local
@Injectable({ providedIn: 'root' })
export class ExtratoFilterService {
  readonly periodo = signal<'7d' | '30d' | '90d'>('30d');
  readonly tipo = signal<'todos' | 'entrada' | 'saida'>('todos');
  readonly busca = signal('');

  readonly filtrosAtivos = computed(() => ({
    periodo: this.periodo(),
    tipo: this.tipo(),
    busca: this.busca(),
  }));
}

// RxJS -- chamadas HTTP, streams de dados
@Injectable({ providedIn: 'root' })
export class ExtratoService {
  private http = inject(HttpClient);

  getExtrato(contaId: string, filtros: ExtratoFiltros): Observable<Transacao[]> {
    return this.http.get<Transacao[]>(`/api/contas/${contaId}/extrato`, {
      params: filtros as any,
    });
  }
}
```

### NgRx: Provavelmente Sim, mas Seletivo

Com 8 devs e dominios complexos que interagem, NgRx faz sentido para:
- **Estado de autenticacao/sessao** (global, multiplas features reagem)
- **Carrinho de operacoes** (se tiverem fluxos multi-step como contratacao de emprestimo + seguro)
- **Notificacoes em tempo real** (WebSocket de transacoes)

NgRx **NAO** faz sentido para:
- CRUD simples dentro de uma feature (use services + signals)
- Estado de formulario (use Reactive Forms)
- Estado de UI local (use signals no componente)

Regra pratica: se o estado vive e morre dentro de uma feature, use services. Se multiplas features reagem ao mesmo estado, use NgRx.

### Lazy Loading por Feature (Obrigatorio)

Com 50+ telas, lazy loading e critico para performance:

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'conta-corrente',
    loadChildren: () => import('./features/conta-corrente/conta-corrente.routes')
      .then(m => m.CONTA_CORRENTE_ROUTES),
    canActivate: [authGuard],
  },
  {
    path: 'cartao',
    loadChildren: () => import('./features/cartao-credito/cartao.routes')
      .then(m => m.CARTAO_ROUTES),
    canActivate: [authGuard],
  },
  {
    path: 'pix',
    loadChildren: () => import('./features/pix/pix.routes')
      .then(m => m.PIX_ROUTES),
    canActivate: [authGuard],
  },
  // ... demais features
];
```

Cada feature so carrega quando o usuario navega para ela. Um usuario que so quer ver o extrato nao baixa o codigo de investimentos.

## 6. Plano de Migracao (Do Caos ao FSD)

Nao migrem tudo de uma vez. Facam incremental:

**Fase 1 -- Criar a camada shared limpa (2-3 sprints)**
- Auditem os 100+ componentes do SharedModule atual
- Classifiquem cada um: e UI puro? E especifico de uma feature? E um layout?
- Movam os componentes genuinamente shared (buttons, inputs, modals, tables, pipes) para `shared/components/ui/`
- Componentes que sao especificos de um dominio ficam marcados para mover na Fase 2

**Fase 2 -- Extrair features uma a uma (1-2 sprints por feature)**
- Comecem pela feature mais isolada (provavelmente `configuracoes`)
- Criem a estrutura FSD para essa feature
- Movam components, services e models para dentro da feature
- Exponham apenas a API publica via `index.ts`
- Validem que nada externo importa arquivos internos da feature
- Repitam para cada feature, da menos acoplada para a mais acoplada

**Fase 3 -- Estabelecer entities (1 sprint)**
- Identifiquem modelos compartilhados entre features (usuario, conta, transacao)
- Movam para `entities/`
- Atualizem imports nas features

**Fase 4 -- Lint rules para proteger a arquitetura**
- Configurem ESLint (ou `eslint-plugin-boundaries`) para enforcar a regra de dependencia entre camadas
- Bloqueiem imports de features para dentro de outras features
- Isso previne que a arquitetura degrade com o tempo

**Ordem sugerida de migracao das features:**
1. `configuracoes` (menos acoplada)
2. `seguros` (dominio relativamente isolado)
3. `emprestimos`
4. `investimentos`
5. `cartao-credito`
6. `pix` (depende de conta corrente)
7. `conta-corrente` + `extratos` (mais acopladas, migrar juntas)

## 7. O que o Shared Module Atual Deve Virar

Dos 100+ componentes atuais, a distribuicao provavel e:

| Destino | Quantidade estimada | Exemplos |
|---------|-------------------|----------|
| `shared/components/ui/` | ~15-20 | Button, Input, Modal, Table, Card, Tabs, Badge |
| `shared/components/layout/` | ~5 | Header, Sidebar, PageWrapper, Breadcrumbs |
| `shared/pipes/` | ~5-8 | FormatCurrency, FormatDate, FormatCPF |
| `features/*/components/` | ~60-70 | A maioria! Components que so fazem sentido em um dominio |
| `entities/*/ui/` | ~5-10 | Components usados por 2+ features (ex: badge de status de transacao) |
| **Deletar** | ~5-10 | Components duplicados, wrappers inuteis, abstractions desnecessarias |

A chave e que **a maioria dos componentes "shared" nao e shared de verdade**. Sao componentes de feature que foram jogados no shared por falta de lugar melhor.

## Resumo

| Decisao | Escolha |
|---------|---------|
| Padrao arquitetural | Feature-Sliced Design |
| Modules vs Standalone | Standalone components (Angular 17) |
| State management | Signals + Services (default), NgRx (cross-feature) |
| Reatividade | Signals para UI, RxJS para HTTP/streams |
| Shared module | Desmontar em shared limpo + features isoladas |
| Loading strategy | Lazy loading por feature via router |
| Protecao arquitetural | eslint-plugin-boundaries |
| Migracao | Incremental, feature por feature, da menos acoplada para a mais |
