# Arquitetura para SaaS de Gestao de Pedidos

## Avaliacao de Contexto

Antes de recomendar qualquer pattern, vamos mapear o cenario:

| Dimensao | Seu Projeto | Classificacao |
|----------|------------|---------------|
| **Escala** | ~15 features (clientes, produtos, pedidos, faturamento, relatorios, notificacoes, dashboard) | Media (5-20 features, 2-4 dominios) |
| **Integracoes externas** | Email (notificacoes), possivelmente gateway de pagamento no faturamento | Poucas a moderadas |
| **Volatilidade de providers** | Email provider pode mudar, mas nao e critico; DB estavel | Baixa a moderada |
| **Tamanho do time** | 4 devs | Medio |
| **Complexidade de dominio** | CRUD com regras moderadas — pedidos tem workflow (criado > aprovado > faturado > entregue), faturamento tem regras fiscais, relatorios agregam dados | Moderada |

## Recomendacao: Vertical Slice Architecture

**Por que Vertical Slice e nao outra coisa:**

- **Simple Modular seria pouco.** Com 15 features e 4 devs, uma estrutura flat de `modules/` com services chamando services vai virar espaguete rapido. Voce vai ter `pedidos.service.ts` com 800 linhas fazendo tudo.
- **Clean Architecture seria demais.** Voce nao tem integracao pesada com multiplos providers, nao tem volatilidade alta de infraestrutura, e nao tem dominio complexo o suficiente pra justificar camadas de domain/application/infrastructure/presentation. Seria boilerplate sem retorno.
- **Vertical Slice encaixa.** Features isoladas, cada dev pode trabalhar numa feature sem pisar no codigo do outro, crescimento organico, e a complexidade fica proporcional ao que cada feature realmente precisa.

## Estrutura Proposta

```
src/
  features/
    clientes/
      criar-cliente/
        criar-cliente.handler.ts
        criar-cliente.http.ts
        criar-cliente.schema.ts
        criar-cliente.spec.ts
      listar-clientes/
        listar-clientes.handler.ts
        listar-clientes.http.ts
        listar-clientes.schema.ts
      buscar-cliente/
        ...
      contracts/
        cliente-lookup.ts          # contrato para outras features consumirem

    produtos/
      criar-produto/
        criar-produto.handler.ts
        criar-produto.http.ts
        criar-produto.schema.ts
        criar-produto.spec.ts
      listar-produtos/
        ...
      atualizar-produto/
        ...
      contracts/
        produto-reader.ts          # contrato para pedidos/relatorios consumirem

    pedidos/
      criar-pedido/
        criar-pedido.handler.ts
        criar-pedido.http.ts
        criar-pedido.schema.ts
        criar-pedido.spec.ts
      aprovar-pedido/
        aprovar-pedido.handler.ts
        aprovar-pedido.http.ts
        aprovar-pedido.spec.ts
      cancelar-pedido/
        ...
      listar-pedidos/
        ...
      contracts/
        pedido-reader.ts           # contrato para faturamento/relatorios
        pedido-status-checker.ts   # contrato para quem precisa checar status

    faturamento/
      gerar-fatura/
        gerar-fatura.handler.ts
        gerar-fatura.http.ts
        gerar-fatura.schema.ts
        gerar-fatura.spec.ts
      listar-faturas/
        ...
      contracts/
        fatura-reader.ts

    notificacoes/
      enviar-notificacao-email/
        enviar-notificacao-email.handler.ts
        enviar-notificacao-email.http.ts    # se tiver endpoint manual
        enviar-notificacao-email.spec.ts
      contracts/
        notificacao-sender.ts      # contrato para outras features dispararem notificacao

    relatorios/
      gerar-relatorio-vendas/
        gerar-relatorio-vendas.handler.ts
        gerar-relatorio-vendas.http.ts
        gerar-relatorio-vendas.spec.ts
      gerar-relatorio-clientes/
        ...

    dashboard/
      obter-resumo-dashboard/
        obter-resumo-dashboard.handler.ts
        obter-resumo-dashboard.http.ts
        obter-resumo-dashboard.spec.ts

  shared/
    database.ts                    # conexao com o banco (Prisma/Knex/etc)
    logger.ts                      # logger padronizado
    errors.ts                      # tipos de erro da aplicacao
    auth/
      auth.middleware.ts           # middleware de autenticacao Fastify
      auth.helpers.ts
    http/
      register-routes.ts           # auto-discovery de rotas ou registro centralizado

  app.ts                           # bootstrap do Fastify
  server.ts                        # start do servidor
```

## Como Cada Camada Funciona

### Arquivo `.http.ts` (Endpoint - Thin)

O endpoint Fastify deve ser fino. Ele recebe, valida, delega, e responde.

```ts
// features/pedidos/criar-pedido/criar-pedido.http.ts
import { FastifyInstance } from 'fastify'
import { criarPedidoSchema } from './criar-pedido.schema'
import { CriarPedidoHandler } from './criar-pedido.handler'

export async function criarPedidoRoute(app: FastifyInstance) {
  const handler = new CriarPedidoHandler(/* dependencias injetadas */)

  app.post('/pedidos', {
    schema: criarPedidoSchema,
    handler: async (request, reply) => {
      const resultado = await handler.execute(request.body)
      return reply.status(201).send(resultado)
    }
  })
}
```

**Regra:** Nenhuma logica de negocio aqui. Nenhum acesso a banco. Nenhuma chamada a provider externo.

### Arquivo `.handler.ts` (Logica de Negocio)

O handler e o coracao do slice. Ele orquestra a logica de negocio.

```ts
// features/pedidos/criar-pedido/criar-pedido.handler.ts
import { ClienteLookup } from '../../clientes/contracts/cliente-lookup'
import { ProdutoReader } from '../../produtos/contracts/produto-reader'

interface CriarPedidoInput {
  clienteId: string
  itens: Array<{ produtoId: string; quantidade: number }>
}

interface CriarPedidoOutput {
  pedidoId: string
  total: number
  status: string
}

export class CriarPedidoHandler {
  constructor(
    private readonly clienteLookup: ClienteLookup,
    private readonly produtoReader: ProdutoReader,
    private readonly pedidoRepository: PedidoRepository
  ) {}

  async execute(input: CriarPedidoInput): Promise<CriarPedidoOutput> {
    // Valida que o cliente existe (via contrato, nao via import direto)
    const clienteExiste = await this.clienteLookup.existsById(input.clienteId)
    if (!clienteExiste) {
      throw new Error('Cliente nao encontrado')
    }

    // Busca produtos e calcula total
    const produtos = await this.produtoReader.findByIds(
      input.itens.map(i => i.produtoId)
    )

    const total = input.itens.reduce((acc, item) => {
      const produto = produtos.find(p => p.id === item.produtoId)
      if (!produto) throw new Error(`Produto ${item.produtoId} nao encontrado`)
      return acc + produto.preco * item.quantidade
    }, 0)

    // Persiste o pedido
    const pedido = await this.pedidoRepository.create({
      clienteId: input.clienteId,
      itens: input.itens,
      total,
      status: 'criado'
    })

    return {
      pedidoId: pedido.id,
      total: pedido.total,
      status: pedido.status
    }
  }
}
```

**Note:** O handler recebe **dados** e retorna **dados**. Ele nao sabe nada sobre HTTP, Fastify, request ou response.

### Arquivo `.schema.ts` (Validacao)

```ts
// features/pedidos/criar-pedido/criar-pedido.schema.ts
export const criarPedidoSchema = {
  body: {
    type: 'object',
    required: ['clienteId', 'itens'],
    properties: {
      clienteId: { type: 'string', format: 'uuid' },
      itens: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['produtoId', 'quantidade'],
          properties: {
            produtoId: { type: 'string', format: 'uuid' },
            quantidade: { type: 'integer', minimum: 1 }
          }
        }
      }
    }
  }
}
```

A validacao de schema fica no Fastify (que ja faz isso nativamente com Ajv). Validacoes de **negocio** ficam no handler.

### Contracts (Comunicacao Entre Features)

Essa e a parte mais importante para manter features isoladas.

```ts
// features/clientes/contracts/cliente-lookup.ts
// Definido por quem CONSOME (pedidos, faturamento, etc.)
export interface ClienteLookup {
  existsById(clienteId: string): Promise<boolean>
  findById(clienteId: string): Promise<{ id: string; nome: string } | null>
}
```

```ts
// features/produtos/contracts/produto-reader.ts
export interface ProdutoReader {
  findByIds(ids: string[]): Promise<Array<{ id: string; nome: string; preco: number }>>
}
```

**Regra fundamental: o consumidor define o contrato.** Pedidos precisa saber se o cliente existe, entao o contrato `ClienteLookup` e definido semanticamente para o que Pedidos precisa. A feature Clientes implementa esse contrato, mas Pedidos nao depende da implementacao de Clientes.

## Comunicacao Entre Features: Mapa de Dependencias

Para um SaaS de pedidos, as dependencias tipicas sao:

```
Pedidos  --usa-->  ClienteLookup (definido em pedidos/contracts/)
Pedidos  --usa-->  ProdutoReader (definido em pedidos/contracts/)
Faturamento --usa--> PedidoReader (definido em faturamento/contracts/)
Faturamento --usa--> NotificacaoSender (definido em faturamento/contracts/)
Relatorios --usa--> PedidoReader (definido em relatorios/contracts/)
Relatorios --usa--> ClienteReader (definido em relatorios/contracts/)
Relatorios --usa--> FaturaReader (definido em relatorios/contracts/)
Dashboard --usa--> PedidoReader, ClienteReader, FaturaReader
```

Cada seta e um contrato explicitamente definido. Nenhuma feature importa internals de outra.

## Isolamento de Providers Externos

Com poucas integracoes externas, voce nao precisa de uma camada inteira de adapters. Mas precisa de isolamento minimo.

### Email (Notificacoes)

```ts
// features/notificacoes/contracts/email-sender.ts
export interface EmailSender {
  send(to: string, subject: string, body: string): Promise<void>
}

// features/notificacoes/adapters/ses-email-sender.ts (ou sendgrid, ou resend)
import { SES } from '@aws-sdk/client-ses'
import { EmailSender } from '../contracts/email-sender'

export class SesEmailSender implements EmailSender {
  async send(to: string, subject: string, body: string): Promise<void> {
    // implementacao com SES
  }
}
```

**Por que isolar?** Porque email provider muda com frequencia (SES > SendGrid > Resend). Tendo o contrato, a troca e uma linha na composicao de dependencias.

### Banco de Dados

Com Node.js + Fastify, voce provavelmente vai usar Prisma ou Knex. Para o seu nivel de complexidade, **nao precisa abstrair o banco atras de interfaces**. Use o Prisma/Knex diretamente nos handlers ou em repositories locais ao slice.

```ts
// features/pedidos/criar-pedido/criar-pedido.handler.ts
export class CriarPedidoHandler {
  constructor(
    private readonly db: PrismaClient,  // direto, sem abstracoes
    private readonly clienteLookup: ClienteLookup
  ) {}
}
```

Isso e suficiente. Voce nao vai trocar de banco. Se um dia trocar, o refactor e localizado dentro de cada handler.

## Composicao de Dependencias

Centralize a montagem das dependencias em um ponto:

```ts
// shared/composition/register-dependencies.ts
import { PrismaClient } from '@prisma/client'
import { CriarPedidoHandler } from '../features/pedidos/criar-pedido/criar-pedido.handler'
import { ClienteLookupImpl } from '../features/clientes/implementations/cliente-lookup.impl'
import { ProdutoReaderImpl } from '../features/produtos/implementations/produto-reader.impl'

export function buildCriarPedidoHandler(db: PrismaClient) {
  return new CriarPedidoHandler(
    db,
    new ClienteLookupImpl(db),
    new ProdutoReaderImpl(db)
  )
}
```

Ou use o sistema de decorators do Fastify para registrar dependencias:

```ts
// app.ts
import Fastify from 'fastify'
import { PrismaClient } from '@prisma/client'

const app = Fastify()
const db = new PrismaClient()

app.decorate('db', db)

// Registra rotas por feature
app.register(import('./features/clientes/criar-cliente/criar-cliente.http'))
app.register(import('./features/pedidos/criar-pedido/criar-pedido.http'))
// ...
```

## Estrategia de Testes

### Unit Tests (Handler)

```ts
// features/pedidos/criar-pedido/criar-pedido.spec.ts
describe('CriarPedidoHandler', () => {
  it('deve criar pedido com total calculado', async () => {
    const clienteLookup = { existsById: async () => true }
    const produtoReader = {
      findByIds: async () => [{ id: '1', nome: 'Camiseta', preco: 50 }]
    }
    const db = mockPrisma()

    const handler = new CriarPedidoHandler(db, clienteLookup, produtoReader)
    const result = await handler.execute({
      clienteId: 'cliente-1',
      itens: [{ produtoId: '1', quantidade: 2 }]
    })

    expect(result.total).toBe(100)
    expect(result.status).toBe('criado')
  })

  it('deve rejeitar se cliente nao existe', async () => {
    const clienteLookup = { existsById: async () => false }
    // ...
    await expect(handler.execute(input)).rejects.toThrow('Cliente nao encontrado')
  })
})
```

**Note:** Testamos o handler diretamente, sem subir Fastify, sem banco real. Mocks apenas para dependencias externas ao slice.

### Integration Tests (HTTP)

```ts
describe('POST /pedidos', () => {
  it('deve retornar 201 com pedido criado', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/pedidos',
      payload: { clienteId: '...', itens: [...] }
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toHaveProperty('pedidoId')
  })
})
```

Fastify tem `app.inject()` nativo para testes de integracao sem subir servidor HTTP real.

## Distribuicao de Trabalho (4 Devs)

Com Vertical Slice, a distribuicao e natural por feature:

| Dev | Features | Justificativa |
|-----|----------|---------------|
| Dev 1 | Clientes + Produtos | CRUD mais simples, bom para estabelecer patterns iniciais |
| Dev 2 | Pedidos | Feature mais complexa (workflow de estados), precisa de mais foco |
| Dev 3 | Faturamento + Notificacoes | Faturamento depende de pedidos, notificacoes sao transversais |
| Dev 4 | Relatorios + Dashboard | Ambos sao leitura/agregacao, dependem de contracts das outras features |

**Cada dev trabalha em seu diretorio de features.** Conflitos de merge sao raros porque as features sao isoladas. Os unicos pontos de contato sao os contracts, que devem ser definidos cedo e estabilizados.

## Sinais de Alerta Durante o Desenvolvimento

### Sinal de que esta funcionando:
- Cada feature pode ser entendida isoladamente
- Testes unitarios nao precisam de setup complexo
- Novos slices seguem o mesmo pattern sem duvidas
- Code reviews sao rapidos porque o escopo e claro

### Sinal de que precisa ajustar:
- Muitos contracts entre features (pode indicar dominios mal definidos)
- Handlers com mais de 100 linhas (talvez precise quebrar em slices menores)
- `shared/` crescendo com logica de negocio (deve permanecer infraestrutura pura)
- Features importando internals de outras features (viola o isolamento)

### Sinal de que precisa mais estrutura:
- Se o faturamento crescer para lidar com multiplos gateways de pagamento, considere aplicar Clean Architecture **apenas no faturamento** (adapters, contracts formais). O resto pode continuar Vertical Slice.
- Se notificacoes ganharem multiplos canais (email, SMS, push, webhook), considere um modulo tecnico de notificacoes com adapter pattern.

## Resumo da Decisao

| Aspecto | Decisao | Motivo |
|---------|---------|--------|
| **Pattern** | Vertical Slice Architecture | 15 features, complexidade moderada, 4 devs — feature cohesion sem over-engineering |
| **Organizacao** | `features/` com slices por use case | Cada operacao de negocio isolada e testavel |
| **Cross-feature** | Contracts (consumer owns the interface) | Isolamento sem acoplamento lateral |
| **Providers externos** | Contrato + adapter apenas para email | Unica integracao volatil; banco fica direto |
| **DB access** | Prisma/Knex direto no handler | Sem abstracoes desnecessarias para provider estavel |
| **Testes** | Unit no handler, integration no HTTP | Logica testada sem infra, transport testado com `app.inject()` |
| **Shared** | DB connection, logger, auth, errors | Apenas infraestrutura verdadeira |

**Clean Architecture seria over-engineering** para o seu caso. Voce nao tem dominio rico o suficiente para justificar entities, value objects, e a separacao domain/application/infrastructure. Vertical Slice da o isolamento que voce precisa com uma fracao da complexidade.

Se num futuro o faturamento ganhar complexidade pesada (multiplos gateways, regras fiscais complexas, emissao de NF-e), voce pode aplicar Clean Architecture **apenas nessa feature**, sem mexer no resto. Essa e a vantagem do Vertical Slice: cada feature pode evoluir independentemente.
