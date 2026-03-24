# Arquitetura para Plataforma E-Commerce Multi-Provider

## Avaliacao de Contexto

Antes de recomendar qualquer pattern, vamos mapear o cenario que voce descreveu:

| Dimensao | Classificacao | Justificativa |
|----------|--------------|---------------|
| **Escala** | Grande (20+ features) | E-commerce completo: catalogo, carrinho, checkout, pagamentos, perfil, pedidos, notificacoes, upload de imagens, descricoes com IA, gestao de estoque, etc. |
| **Integracoes externas** | Pesada (5+ providers) | Stripe, MercadoPago, PagSeguro, OpenAI/Claude, SendGrid, AWS S3 -- sao 6 providers concretos |
| **Volatilidade de providers** | Alta | 3 gateways com fallback implica estrategia multi-provider ativa; IA com 2 opcoes (OpenAI ou Claude) implica possibilidade de troca |
| **Tamanho do time** | Medio (6 devs) | Grande o suficiente para precisar de fronteiras claras, pequeno o suficiente para nao precisar de microservicos |
| **Complexidade de dominio** | Moderada a complexa | Pagamentos com fallback, regras de negocio de e-commerce (estoque, precos, descontos, estados de pedido) |

## Recomendacao: Combined Strategy (Vertical Slice + Clean Principles)

Para o seu caso, a **estrategia combinada** e a escolha certa. Veja por que -- e por que as alternativas nao se encaixam:

**Por que nao Simple Modular?** Com 6 providers externos, fallback entre gateways, e 6 devs, uma estrutura simples vai rapidamente virar uma pasta `services/` com 40 arquivos onde todo mundo importa SDK de todo mundo. Voce ja esta alem do ponto onde isso funciona.

**Por que nao Clean Architecture pura?** Funcionaria, mas vai gerar overhead desnecessario nos slices simples (CRUD de categorias, listagem de produtos sem IA). Com Clean puro, voce forçaria 4 camadas ate para um endpoint que so le do banco e retorna JSON. Para 6 devs, isso cria mais burocracia do que valor.

**Por que Combined?** Porque voce tem dois tipos claros de features: (1) features simples que sao basicamente CRUD e (2) features complexas que integram com providers externos. A estrategia combinada permite que cada slice tenha a complexidade que precisa -- sem forcar um padrao uniforme.

## Estrutura Proposta

```
src/
  features/
    products/
      create-product/
        create-product.handler.ts
        create-product.http.ts
        create-product.schema.ts
        create-product.spec.ts
      update-product/
        ...
      generate-product-description/
        generate-product-description.handler.ts
        generate-product-description.http.ts
        generate-product-description.schema.ts
        product-description-generator.ts            # contrato de negocio
        ai-product-description-generator.ts         # adapter negocio -> tecnico
        generate-product-description.spec.ts
      upload-product-image/
        upload-product-image.handler.ts
        upload-product-image.http.ts
        product-image-storage.ts                    # contrato de negocio
        s3-product-image-storage.ts                 # adapter negocio -> tecnico
      contracts/
        product-reader.ts                           # contrato cross-feature

    orders/
      place-order/
        place-order.handler.ts
        place-order.http.ts
        place-order.schema.ts
        place-order.spec.ts
      cancel-order/
        ...
      contracts/
        order-lookup.ts

    checkout/
      process-payment/
        process-payment.handler.ts
        process-payment.http.ts
        process-payment.schema.ts
        payment-processor.ts                        # contrato de negocio
        gateway-payment-processor.ts                # adapter negocio -> tecnico
        process-payment.spec.ts
      contracts/
        payment-status-reader.ts

    notifications/
      send-order-confirmation/
        send-order-confirmation.handler.ts
        order-confirmation-sender.ts                # contrato de negocio
        email-order-confirmation-sender.ts          # adapter negocio -> tecnico

    users/
      create-user/
        ...
      get-user-profile/
        ...

    cart/
      add-to-cart/
        ...
      get-cart/
        ...

  technical/
    payment/
      contracts/
        payment-gateway-client.ts                   # contrato tecnico
      adapters/
        stripe-payment-client.ts
        mercadopago-payment-client.ts
        pagseguro-payment-client.ts
        fallback-payment-client.ts                  # orquestra fallback entre os 3
      policies/
        payment-fallback-policy.ts                  # regras de quando fazer fallback
        payment-provider-health.ts                  # health check / circuit breaker
      errors/
        payment-provider-error.ts

    ai/
      contracts/
        text-generation-client.ts                   # contrato tecnico
      adapters/
        openai-text-generation-client.ts
        claude-text-generation-client.ts
        fallback-text-generation-client.ts
      errors/
        ai-provider-error.ts

    email/
      contracts/
        email-client.ts                             # contrato tecnico
      adapters/
        sendgrid-email-client.ts
      errors/
        email-provider-error.ts

    storage/
      contracts/
        file-storage-client.ts                      # contrato tecnico
      adapters/
        s3-file-storage-client.ts
      errors/
        storage-provider-error.ts

  shared/
    database.ts
    logger.ts
    errors.ts
    auth/
      auth.middleware.ts
      token.ts
    http/
      error-handler.middleware.ts
      request-context.ts

  composition/
    register-dependencies.ts
```

## Como os Dois Tipos de Contrato Funcionam

Este e o ponto mais importante da arquitetura. Existem **dois niveis de contrato** e um **adapter** que faz a ponte entre eles.

### 1. Contrato de Negocio (dentro da feature)

Fala a lingua do negocio. Definido pela feature que precisa da capacidade.

```ts
// features/checkout/process-payment/payment-processor.ts
export interface PaymentProcessor {
  process(input: {
    orderId: string
    amount: number
    currency: string
    customerEmail: string
    paymentMethod: PaymentMethodInfo
  }): Promise<{
    transactionId: string
    status: 'approved' | 'rejected' | 'pending'
    gatewayUsed: string
  }>
}
```

O handler depende disso -- e so disso:

```ts
// features/checkout/process-payment/process-payment.handler.ts
class ProcessPaymentHandler {
  constructor(private readonly processor: PaymentProcessor) {}

  async execute(input: ProcessPaymentInput) {
    // validacoes de negocio aqui
    const result = await this.processor.process({
      orderId: input.orderId,
      amount: input.amount,
      currency: input.currency,
      customerEmail: input.customerEmail,
      paymentMethod: input.paymentMethod,
    })

    if (result.status === 'rejected') {
      throw new PaymentRejectedError(result.transactionId)
    }

    return result
  }
}
```

O handler **nao sabe** que existem 3 gateways. Nao sabe de fallback. Nao sabe de Stripe, MercadoPago ou PagSeguro.

### 2. Contrato Tecnico (dentro do modulo tecnico)

Fala a lingua da tecnologia. Define a capacidade generica que os adapters implementam.

```ts
// technical/payment/contracts/payment-gateway-client.ts
export interface PaymentGatewayClient {
  charge(input: {
    amountInCents: number
    currency: string
    customerEmail: string
    paymentMethodToken: string
    metadata?: Record<string, string>
  }): Promise<{
    providerTransactionId: string
    status: 'success' | 'failed' | 'pending'
    providerName: string
  }>

  refund(transactionId: string, amountInCents?: number): Promise<void>
}
```

### 3. Adapter Negocio-Tecnico (dentro da feature)

Faz a ponte entre os dois mundos. Vive dentro da feature.

```ts
// features/checkout/process-payment/gateway-payment-processor.ts
class GatewayPaymentProcessor implements PaymentProcessor {
  constructor(private readonly client: PaymentGatewayClient) {}

  async process(input) {
    const result = await this.client.charge({
      amountInCents: Math.round(input.amount * 100),
      currency: input.currency,
      customerEmail: input.customerEmail,
      paymentMethodToken: input.paymentMethod.token,
      metadata: { orderId: input.orderId },
    })

    return {
      transactionId: result.providerTransactionId,
      status: result.status === 'success' ? 'approved'
            : result.status === 'failed' ? 'rejected'
            : 'pending',
      gatewayUsed: result.providerName,
    }
  }
}
```

### 4. Adapters Tecnicos e Fallback (dentro do modulo tecnico)

```ts
// technical/payment/adapters/stripe-payment-client.ts
class StripePaymentClient implements PaymentGatewayClient {
  async charge(input) {
    // chama SDK do Stripe, traduz resposta para o contrato tecnico
  }
}

// technical/payment/adapters/mercadopago-payment-client.ts
class MercadoPagoPaymentClient implements PaymentGatewayClient {
  async charge(input) {
    // chama SDK do MercadoPago
  }
}

// technical/payment/adapters/pagseguro-payment-client.ts
class PagSeguroPaymentClient implements PaymentGatewayClient {
  async charge(input) {
    // chama SDK do PagSeguro
  }
}
```

O fallback e um adapter tecnico que orquestra os outros:

```ts
// technical/payment/adapters/fallback-payment-client.ts
class FallbackPaymentClient implements PaymentGatewayClient {
  constructor(
    private readonly providers: PaymentGatewayClient[],
    private readonly policy: PaymentFallbackPolicy,
  ) {}

  async charge(input) {
    for (const provider of this.providers) {
      try {
        return await provider.charge(input)
      } catch (error) {
        if (!this.policy.shouldFallback(error)) throw error
        // log e tenta proximo
      }
    }
    throw new AllPaymentProvidersFailedError()
  }
}
```

A policy define as regras de fallback:

```ts
// technical/payment/policies/payment-fallback-policy.ts
class PaymentFallbackPolicy {
  shouldFallback(error: unknown): boolean {
    // Fallback em timeout ou 5xx
    // NAO fazer fallback em erro de validacao (cartao invalido, saldo insuficiente)
    // NAO fazer fallback em erro de fraude
  }
}
```

## Aplicando o Mesmo Padrao para IA

```ts
// technical/ai/contracts/text-generation-client.ts
export interface TextGenerationClient {
  generate(input: {
    systemPrompt: string
    userPrompt: string
  }): Promise<{ text: string }>
}

// technical/ai/adapters/openai-text-generation-client.ts
class OpenAITextGenerationClient implements TextGenerationClient { ... }

// technical/ai/adapters/claude-text-generation-client.ts
class ClaudeTextGenerationClient implements TextGenerationClient { ... }

// features/products/generate-product-description/product-description-generator.ts
export interface ProductDescriptionGenerator {
  generate(input: {
    title: string
    category: string
    attributes: string[]
  }): Promise<{ description: string }>
}

// features/products/generate-product-description/ai-product-description-generator.ts
class AiProductDescriptionGenerator implements ProductDescriptionGenerator {
  constructor(private readonly client: TextGenerationClient) {}

  async generate(input) {
    const result = await this.client.generate({
      systemPrompt: 'Voce escreve descricoes de produtos persuasivas e otimizadas para SEO.',
      userPrompt: `Produto: ${input.title}, Categoria: ${input.category}, Atributos: ${input.attributes.join(', ')}`,
    })
    return { description: result.text }
  }
}
```

O prompt de IA vive no adapter da feature (porque e uma decisao de negocio), nao no modulo tecnico.

## Composition Root -- Onde Tudo se Conecta

```ts
// composition/register-dependencies.ts

// --- Payment ---
const stripe = new StripePaymentClient(config.stripe)
const mercadopago = new MercadoPagoPaymentClient(config.mercadopago)
const pagseguro = new PagSeguroPaymentClient(config.pagseguro)
const fallbackPolicy = new PaymentFallbackPolicy()
const paymentClient = new FallbackPaymentClient(
  [stripe, mercadopago, pagseguro],
  fallbackPolicy,
)

// --- AI ---
const openai = new OpenAITextGenerationClient(config.openai)
const claude = new ClaudeTextGenerationClient(config.claude)
const aiClient = new FallbackTextGenerationClient(openai, claude)

// --- Email ---
const emailClient = new SendGridEmailClient(config.sendgrid)

// --- Storage ---
const storageClient = new S3FileStorageClient(config.s3)

// --- Features ---
const processPayment = new ProcessPaymentHandler(
  new GatewayPaymentProcessor(paymentClient)
)

const generateDescription = new GenerateProductDescriptionHandler(
  new AiProductDescriptionGenerator(aiClient)
)

const uploadProductImage = new UploadProductImageHandler(
  new S3ProductImageStorage(storageClient)
)

const sendOrderConfirmation = new SendOrderConfirmationHandler(
  new EmailOrderConfirmationSender(emailClient)
)
```

Este e o **unico lugar** que conhece as implementacoes concretas. Se amanha voce quiser trocar a ordem do fallback de pagamento (MercadoPago primeiro, Stripe segundo), muda **uma linha** aqui. Se quiser trocar OpenAI por Claude como primario, muda **uma linha** aqui. Nenhuma feature precisa saber.

## Calibrando a Complexidade por Slice

Nem todo slice precisa de contrato + adapter. Use a complexidade proporcional:

| Tipo de slice | Abordagem | Exemplo |
|---------------|-----------|---------|
| CRUD simples | Handler + acesso direto ao banco | `create-product`, `list-categories`, `get-user-profile` |
| Provider estavel e unico | Wrapper fino, interface opcional | `upload-product-image` (S3 provavelmente nao vai mudar) |
| Provider que pode trocar | Contrato de negocio + adapter | `generate-product-description` (OpenAI ou Claude) |
| Multi-provider com fallback | Contrato completo + modulo tecnico + adapter | `process-payment` (3 gateways) |
| Dependencia cross-feature | Contrato definido pelo consumidor | Orders precisando de dados de Products |

Um slice de `list-categories` com 3 arquivos (handler, http, spec) convive perfeitamente ao lado de um slice de `process-payment` com 6 arquivos. Isso e intencional, nao inconsistencia.

## Comunicacao Cross-Feature

Com 6 devs, features vao precisar se comunicar. A regra: **o consumidor define o contrato**.

```ts
// features/checkout/contracts/product-price-reader.ts
// Checkout precisa saber o preco -- define o que precisa
export interface ProductPriceReader {
  getPrice(productId: string): Promise<{ price: number; currency: string }>
}

// Quem implementa? O modulo de Products, na composition root
```

Features nunca importam handlers de outras features. Se `checkout` precisa de dados de `products`, define um contrato em `checkout/contracts/` e `products` fornece a implementacao.

## Estrategia de Testes

| Camada | O que testar | Como |
|--------|-------------|------|
| **Handlers** | Logica de negocio | Mock dos contratos de negocio. Teste direto, sem HTTP. |
| **Adapters negocio-tecnico** | Traducao de dados | Teste unitario da transformacao (ex: centavos -> reais, status mapping) |
| **Adapters tecnicos** | Integracao com providers | Teste de integracao com sandbox (Stripe test mode, etc.) |
| **Fallback policies** | Regras de fallback | Teste unitario -- quais erros fazem fallback, quais nao |
| **HTTP endpoints** | Fluxo HTTP | Teste de integracao fino. Nao duplique testes de negocio aqui. |
| **Composition** | Wiring funciona | Smoke test -- instancia tudo e verifica que nao explode |

## Sinais de que a Arquitetura Precisa Ajuste

Fique atento durante o desenvolvimento:

**Sinais de over-engineering (simplificar):**
- Todo slice novo exige criar 5+ arquivos antes de escrever uma linha de logica
- A pasta `shared/` esta maior que qualquer feature
- Contratos com uma unica implementacao e sem plano de ter mais
- Devs novos levam mais de 1 dia para entender onde colocar codigo

**Sinais de under-engineering (adicionar estrutura):**
- SDKs de providers importados diretamente nos handlers
- Feature A acessando internals de Feature B
- Logica de negocio espalhada em controllers/routes
- Impossivel testar logica de negocio sem subir o servidor inteiro

## Resumo Executivo

| Decisao | Escolha | Motivo |
|---------|---------|--------|
| Pattern geral | Combined (VSA + Clean) | Features com autonomia, providers com isolamento |
| Organizacao de features | Vertical Slice (por use case) | Cada feature auto-contida, facil de navegar |
| Providers externos | Modulos tecnicos com contratos | 6 providers, fallback, alta volatilidade |
| Fallback de pagamento | Adapter tecnico + policy | Logica complexa isolada do negocio |
| IA | Contrato tecnico + adapter por feature | Prompt e decisao de negocio, SDK e tecnico |
| Email (SendGrid) | Contrato tecnico simples | Provider unico, mas ainda vale isolar |
| Storage (S3) | Contrato tecnico simples | Provider unico, estavel, isolamento basico |
| Cross-feature | Contrato definido pelo consumidor | Evita acoplamento entre features |
| Composition | Arquivo unico de wiring | Unico ponto que conhece concretos |
