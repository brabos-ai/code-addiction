# Arquitetura para API REST de Blog Pessoal

## Avaliacao do Contexto

Antes de recomendar qualquer padrao, vamos mapear o seu projeto:

| Criterio | Sua situacao | Classificacao |
|----------|-------------|---------------|
| **Escala** | 3 features (posts, categorias, comentarios), dominio unico | Pequena (1-5 features) |
| **Integracoes externas** | Apenas PostgreSQL | Nenhuma/poucas |
| **Volatilidade de providers** | Banco de dados estavel, sem previsao de troca | Estavel |
| **Tamanho do time** | Solo (so voce) | Pequeno |
| **Complexidade do dominio** | CRUD basico com relacionamentos simples | CRUD simples |

## Recomendacao: Simple Modular

A arquitetura recomendada para o seu caso e **Simple Modular** -- organizar por modulo/feature, com cada modulo contendo suas rotas, servico e acesso a dados.

### Por que Simple Modular?

Seu projeto tem 3 features, um unico desenvolvedor, nenhuma integracao externa alem do banco, e logica de negocio simples (CRUD). Qualquer coisa alem de Simple Modular seria over-engineering:

- **Vertical Slice** adicionaria separacao por caso de uso (create-post, list-posts, update-post...) que, para CRUD simples, cria muitos arquivos pequenos sem beneficio real. Voce teria 4-5 pastas dentro de `posts/` para operacoes que sao basicamente uma funcao cada.
- **Clean Architecture** adicionaria camadas de domain, application, infrastructure e presentation com ports e adapters -- para um blog pessoal com um banco so, isso significaria interfaces com uma unica implementacao, value objects para dados simples, e mais arquivos de infraestrutura do que de logica de negocio.
- **Combined (VSA + Clean)** e para projetos medio-grandes com integracoes externas volateis. Nada disso se aplica aqui.

### Sinais de over-engineering que voce deve evitar

Para o seu caso especifico:

- Nao crie interfaces/contracts para o acesso ao banco -- voce tem um unico banco e nao vai trocar
- Nao separe em multiplos projetos/pacotes -- e uma API de 3 recursos
- Nao crie uma camada de "domain entities" separada -- seus modelos do ORM ja servem
- Nao crie uma pasta `shared/` maior que as pastas dos modulos

## Estrutura de Pastas Recomendada

```
src/
  modules/
    posts/
      posts.routes.ts        # Rotas HTTP (thin endpoints)
      posts.service.ts        # Logica de negocio e regras
      posts.repository.ts     # Queries ao banco (PostgreSQL)
      posts.schema.ts         # Validacao de input (create, update)
      posts.spec.ts           # Testes unitarios do service
    categories/
      categories.routes.ts
      categories.service.ts
      categories.repository.ts
      categories.schema.ts
      categories.spec.ts
    comments/
      comments.routes.ts
      comments.service.ts
      comments.repository.ts
      comments.schema.ts
      comments.spec.ts
  shared/
    database.ts               # Conexao e config do PostgreSQL
    errors.ts                 # Tipos de erro padronizados
    middleware.ts              # Middleware comum (error handler, logging)
  app.ts                      # Setup do servidor, registro de rotas
  server.ts                   # Entry point
```

### Explicacao de cada camada dentro do modulo

**routes** (thin endpoint) -- Recebe o request, valida o input usando o schema, delega para o service, retorna o response. Nunca coloque logica de negocio aqui.

```ts
// posts.routes.ts
router.post('/posts', async (req, res) => {
  const data = createPostSchema.parse(req.body);   // validacao
  const post = await postsService.create(data);      // delega
  res.status(201).json(post);                        // responde
});
```

**service** -- Contem a logica de negocio. Recebe dados puros, processa, retorna dados puros. Nao conhece HTTP (sem req/res), nao conhece SQL diretamente.

```ts
// posts.service.ts
async function create(data: CreatePostInput) {
  // regra de negocio: gerar slug a partir do titulo
  const slug = generateSlug(data.title);
  return postsRepository.insert({ ...data, slug });
}
```

**repository** -- Acesso ao banco. Encapsula queries SQL ou chamadas ao ORM. Isso nao e por abstraction purity -- e porque isolar queries facilita testes e manutencao.

```ts
// posts.repository.ts
async function insert(data: PostData) {
  return db('posts').insert(data).returning('*');
}
```

**schema** -- Validacao de input (com zod, joi, ou similar). Define o shape dos dados aceitos pela API.

**spec** -- Testes unitarios focados no service. Mock apenas o repository.

### O que vai na pasta shared/

Apenas infraestrutura genuinamente transversal:

- `database.ts` -- pool de conexao com PostgreSQL, configuracao
- `errors.ts` -- classes de erro padronizadas (NotFoundError, ValidationError)
- `middleware.ts` -- error handler global, logging

**Nao coloque** logica de negocio no shared. Se algo parece "compartilhado" mas tem significado de negocio (ex: uma funcao de formatacao de post que comments tambem usa), coloque no modulo de posts e importe explicitamente.

## Comunicacao entre Modulos

No seu caso, os modulos tem relacionamentos naturais:

- Um **post** pertence a uma **categoria**
- Um **comentario** pertence a um **post**

Na escala Simple Modular, chamadas diretas entre services sao aceitaveis:

```ts
// comments.service.ts
async function create(data: CreateCommentInput) {
  // Verifica se o post existe antes de criar o comentario
  const post = await postsService.findById(data.postId);
  if (!post) throw new NotFoundError('Post not found');
  return commentsRepository.insert(data);
}
```

Isso e simples, direto e facil de entender. Nao precisa de eventos, mediators ou contracts para 3 modulos.

## Estrategia de Testes

- **Testes unitarios**: teste os services diretamente, mockando os repositories. Aqui mora a logica de negocio (mesmo que simples).
- **Testes de integracao**: teste as rotas HTTP end-to-end com um banco de teste. Como os endpoints sao thin, nao precisa de muitos -- foque nos fluxos principais (criar post, listar posts com paginacao, criar comentario em post existente).
- Nao crie testes de contrato -- voce nao tem providers externos para validar.

## Quando Repensar essa Arquitetura

Fique atento a estes sinais de que o projeto cresceu alem do Simple Modular:

- Voce adicionou autenticacao com um provider externo (OAuth, Auth0) e quer poder trocar de provider
- A logica de negocio dos posts ficou complexa (workflows de publicacao, agendamento, revisao)
- Voce adicionou 5+ modulos e servicos comecaram a chamar servicos que chamam servicos
- Voce quer adicionar integracao com servico de email, storage de imagens, ou AI para sugestoes

Se isso acontecer, o proximo passo natural seria **Vertical Slice Architecture**, onde cada caso de uso vira uma unidade independente. Mas nao antecipe -- migrar de Simple Modular para VSA e uma refatoracao simples quando (e se) for necessario.

## Resumo

| Decisao | Escolha | Motivo |
|---------|---------|--------|
| Arquitetura | Simple Modular | 3 features, CRUD simples, solo dev, sem integracoes externas |
| Organizacao | Por modulo (posts, categories, comments) | Feature over layer -- encontrar codigo por dominio, nao por tipo tecnico |
| Comunicacao | Chamadas diretas entre services | Escala pequena, acoplamento lateral e gerenciavel |
| Abstracoes | Nenhuma alem do repository | Sem providers externos para isolar |
| Testes | Unit nos services, integracao nas rotas | Testar logica isolada + fluxos HTTP principais |
