# CTA Sections

Call-to-action final. A última chance de converter.

---

## 1. CTA Simples (Padrão)

Direto ao ponto. Funciona sempre.

```tsx
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASimple() {
  return (
    <section className="container px-4 py-16 md:py-24">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold">
          Pronto para transformar sua operação?
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Comece grátis hoje. Sem cartão de crédito, sem compromisso.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="text-lg px-8">
            Começar grátis
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8">
            Agendar demo
          </Button>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          ✓ 14 dias grátis ✓ Setup em 5 minutos ✓ Cancele quando quiser
        </p>
      </div>
    </section>
  );
}
```

**Quando usar:** Sempre funciona. Default seguro.

---

## 2. CTA com Background Gradiente

Mais impactante. Destaca do resto da página.

```tsx
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTAGradient() {
  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative container px-4 py-16 md:py-24 text-center text-primary-foreground">
        <h2 className="text-3xl md:text-4xl font-bold">
          Junte-se a +2.000 empresas
        </h2>
        <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
          Comece a automatizar seus processos hoje e economize horas por semana.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            variant="secondary"
            className="text-lg px-8 bg-white text-primary hover:bg-white/90"
          >
            Começar grátis
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-lg px-8 border-white text-white hover:bg-white/10"
          >
            Ver demo
          </Button>
        </div>
      </div>
    </section>
  );
}
```

**Quando usar:** Quer destaque forte, seção final impactante.

---

## 3. CTA com Email Capture

Captura email direto. Bom para lead generation.

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";

export function CTAEmailCapture() {
  return (
    <section className="container px-4 py-16 md:py-24">
      <div className="max-w-xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold">
          Comece grátis agora
        </h2>
        <p className="mt-4 text-muted-foreground">
          Digite seu email e crie sua conta em segundos
        </p>

        <form className="mt-8 flex flex-col sm:flex-row gap-3">
          <Input
            type="email"
            placeholder="seu@email.com"
            className="flex-1 h-12 text-base"
          />
          <Button size="lg" className="h-12 px-8">
            Criar conta
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          Grátis para sempre no plano Starter. Sem cartão de crédito.
        </p>
      </div>
    </section>
  );
}
```

**Quando usar:** Quer capturar lead rapidamente, signup simplificado.

---

## 4. CTA com Imagem/Mockup

Mostra o produto junto com o CTA. Reforça o valor.

```tsx
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

export function CTAWithImage() {
  return (
    <section className="container px-4 py-16 md:py-24">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Content */}
        <div>
          <h2 className="text-3xl md:text-4xl font-bold">
            Veja como é fácil começar
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Configure seu workspace em minutos e comece a ver resultados
            imediatamente.
          </p>

          <ul className="mt-6 space-y-3">
            {[
              "Importe dados de qualquer lugar",
              "Configure automações sem código",
              "Convide sua equipe em cliques",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="text-lg">
              Começar grátis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg">
              <Play className="mr-2 h-5 w-5" />
              Ver demo (2 min)
            </Button>
          </div>
        </div>

        {/* Image */}
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl blur-2xl" />
          <img
            src="/dashboard-preview.png"
            alt="Preview do dashboard"
            className="relative rounded-xl border shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
}
```

**Quando usar:** Produto visual, quer reforçar o que o cliente vai receber.

---

## 5. CTA Card (Compact)

Formato card. Bom para sidebar ou seções menores.

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export function CTACard() {
  return (
    <Card className="max-w-md mx-auto bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
      <CardHeader className="text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-xl font-bold">Pronto para começar?</h3>
        <p className="text-sm text-muted-foreground">
          Teste grátis por 14 dias
        </p>
      </CardHeader>
      <CardContent className="text-center">
        <div className="text-3xl font-bold">R$0</div>
        <div className="text-sm text-muted-foreground">
          para começar, depois R$97/mês
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Button className="w-full">Criar conta grátis</Button>
        <Button variant="ghost" className="w-full">
          Falar com vendas
        </Button>
      </CardFooter>
    </Card>
  );
}
```

**Quando usar:** Sidebar, pop-up, seção compacta.

---

## 6. CTA Sticky (Mobile)

Barra fixa no mobile. Sempre visível.

```tsx
import { Button } from "@/components/ui/button";

export function CTASticky() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-background/95 backdrop-blur border-t p-4">
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1">
            Ver demo
          </Button>
          <Button className="flex-1">Começar grátis</Button>
        </div>
      </div>
    </div>
  );
}
```

**Quando usar:** Sempre no mobile. Aumenta conversão significativamente.

---

## 7. Newsletter CTA

Para captura de leads não prontos para comprar.

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";

export function CTANewsletter() {
  return (
    <section className="bg-muted/50">
      <div className="container px-4 py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold">
            Receba dicas de produtividade
          </h2>
          <p className="mt-3 text-muted-foreground">
            Conteúdo semanal sobre como escalar operações. Sem spam.
          </p>

          <form className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="seu@email.com"
              className="flex-1"
            />
            <Button>Inscrever</Button>
          </form>

          <p className="mt-4 text-xs text-muted-foreground">
            +5.000 líderes já recebem. Cancele quando quiser.
          </p>
        </div>
      </div>
    </section>
  );
}
```

**Quando usar:** Topo de funil, conteúdo marketing, blog.

---

## Footer CTA (Final)

CTA dentro do footer. Última chance antes de sair.

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Footer() {
  return (
    <footer className="border-t">
      {/* CTA Section */}
      <div className="container px-4 py-12 border-b">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="text-xl font-bold">Pronto para começar?</h3>
            <p className="text-muted-foreground">
              Crie sua conta grátis em segundos
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">Falar com vendas</Button>
            <Button>Começar grátis</Button>
          </div>
        </div>
      </div>

      {/* Footer links */}
      <div className="container px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* ... footer links ... */}
        </div>
      </div>

      {/* Bottom */}
      <div className="container px-4 py-6 border-t">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 SeuSaaS. Todos os direitos reservados.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a href="/privacy" className="hover:text-foreground">
              Privacidade
            </a>
            <a href="/terms" className="hover:text-foreground">
              Termos
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

---

## Copy para CTAs

### Headlines
```markdown
- "Pronto para [resultado]?"
- "Comece a [benefício] hoje"
- "Junte-se a [número] [empresas/profissionais]"
- "Transforme sua [área] em [tempo]"
- "Não perca mais tempo com [dor]"
```

### Sub-headlines
```markdown
- "Comece grátis, escale quando precisar"
- "Sem cartão de crédito. Sem compromisso."
- "Configure em 5 minutos. Veja resultados em 1 semana."
- "Teste todas as funcionalidades por 14 dias"
```

### Botões
```markdown
# Alta intenção
- "Começar grátis"
- "Criar conta"
- "Testar agora"
- "Experimentar grátis"

# Baixa fricção
- "Ver demo"
- "Agendar conversa"
- "Saber mais"
- "Explorar recursos"
```

### Trust elements
```markdown
- "✓ 14 dias grátis"
- "✓ Sem cartão de crédito"
- "✓ Cancele quando quiser"
- "✓ Setup em 5 minutos"
- "✓ Suporte incluso"
- "✓ Dados protegidos (LGPD)"
```
