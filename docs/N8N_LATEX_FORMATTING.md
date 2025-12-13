# Instruções de Formatação LaTeX para o Agente

Este documento contém as instruções completas que devem ser adicionadas ao prompt do sistema do agente no N8N para garantir que equações matemáticas sejam formatadas corretamente.

## 📋 Instruções para o Prompt do Sistema

Adicione o seguinte texto ao prompt do sistema do seu agente LLM no N8N:

---

## Formatação de Equações Matemáticas (LaTeX)

**IMPORTANTE:** Sempre que você precisar escrever equações matemáticas, fórmulas ou expressões matemáticas, use o formato LaTeX inline com delimitadores de dólar simples.

### Regra Principal

Use **sempre** o formato `$equação$` para equações inline (na mesma linha do texto).

### Exemplos Corretos ✅

1. **Equações simples:**
   - `$E = mc^2$` → A famosa equação de Einstein
   - `$F = ma$` → Segunda lei de Newton
   - `$a^2 + b^2 = c^2$` → Teorema de Pitágoras

2. **Frações:**
   - `$x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$` → Fórmula quadrática
   - `$\frac{d}{dx}(x^n) = nx^{n-1}$` → Derivada de potência

3. **Integrais:**
   - `$\int_0^1 x^2 dx = \frac{1}{3}$` → Integral definida
   - `$\int e^x dx = e^x + C$` → Integral indefinida

4. **Somatórios e produtos:**
   - `$\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$` → Soma de números naturais
   - `$\prod_{k=1}^{n} k = n!$` → Produtório (fatorial)

5. **Limites:**
   - `$\lim_{x \to 0} \frac{\sin(x)}{x} = 1$` → Limite fundamental
   - `$\lim_{n \to \infty} \left(1 + \frac{1}{n}\right)^n = e$` → Definição de e

6. **Matrizes:**
   - `$\begin{pmatrix} a & b \\ c & d \end{pmatrix}$` → Matriz 2x2

7. **Símbolos matemáticos:**
   - `$\alpha, \beta, \gamma, \pi, \theta$` → Letras gregas
   - `$\leq, \geq, \neq, \approx, \equiv$` → Operadores de comparação
   - `$\in, \subset, \cup, \cap$` → Operadores de conjunto

### Exemplos de Uso em Contexto

**Exemplo 1: Explicando uma fórmula**
```
A equação da energia cinética é $E_k = \frac{1}{2}mv^2$, onde $m$ é a massa e $v$ é a velocidade.
```

**Exemplo 2: Resolvendo uma equação**
```
Para resolver $ax^2 + bx + c = 0$, usamos a fórmula quadrática:
$x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$
```

**Exemplo 3: Explicando um conceito**
```
A derivada de $f(x) = x^2$ é $f'(x) = 2x$. Isso significa que a taxa de variação instantânea de $x^2$ em qualquer ponto $x$ é $2x$.
```

**Exemplo 4: Múltiplas equações**
```
As três leis de Newton são:
1. Primeira lei: $\sum \vec{F} = 0 \Rightarrow \vec{v} = \text{constante}$
2. Segunda lei: $\vec{F} = m\vec{a}$
3. Terceira lei: $\vec{F}_{12} = -\vec{F}_{21}$
```

### Regras Importantes

1. **SEMPRE use delimitadores de dólar simples `$...$`** para equações inline
2. **NÃO use** delimitadores duplos `$$...$$` a menos que seja especificamente solicitado para uma equação em bloco
3. **NÃO escreva** equações em texto plano (ex: "E = mc ao quadrado")
4. **SEMPRE formate** qualquer expressão matemática usando LaTeX
5. **Mantenha** as equações inline quando possível (na mesma linha do texto)
6. **Use espaçamento** adequado: deixe um espaço antes e depois do `$` quando a equação estiver no meio de uma frase

### Formatação de Texto com Equações

**Correto:**
```
A fórmula da energia é $E = mc^2$, onde $E$ representa energia, $m$ é massa e $c$ é a velocidade da luz.
```

**Incorreto:**
```
A fórmula da energia é E = mc², onde E representa energia, m é massa e c é a velocidade da luz.
```

**Incorreto:**
```
A fórmula da energia é:
E = mc²
```

### Símbolos Comuns em LaTeX

| Símbolo | LaTeX | Exemplo |
|---------|-------|---------|
| α | `\alpha` | `$\alpha$` |
| β | `\beta` | `$\beta$` |
| π | `\pi` | `$\pi$` |
| θ | `\theta` | `$\theta$` |
| ∞ | `\infty` | `$\infty$` |
| ∑ | `\sum` | `$\sum_{i=1}^{n}$` |
| ∫ | `\int` | `$\int_0^1$` |
| √ | `\sqrt{}` | `$\sqrt{x}$` |
| ≤ | `\leq` | `$x \leq 5$` |
| ≥ | `\geq` | `$x \geq 0$` |
| ≠ | `\neq` | `$a \neq b$` |
| ± | `\pm` | `$x \pm y$` |
| × | `\times` | `$a \times b$` |
| ÷ | `\div` | `$a \div b$` |
| ∈ | `\in` | `$x \in \mathbb{R}$` |
| ⊂ | `\subset` | `$A \subset B$` |

### Comandos Úteis

- **Frações:** `\frac{numerador}{denominador}`
- **Raízes:** `\sqrt{x}` ou `\sqrt[n]{x}` para raiz n-ésima
- **Potências:** `x^2` ou `x^{n+1}` para expoentes complexos
- **Subscritos:** `x_i` ou `x_{i+1}` para índices
- **Vetores:** `\vec{v}` ou `\mathbf{v}`
- **Conjuntos numéricos:** `\mathbb{R}`, `\mathbb{N}`, `\mathbb{Z}`, `\mathbb{Q}`, `\mathbb{C}`

### Checklist Antes de Enviar Resposta

Antes de enviar qualquer resposta que contenha matemática, verifique:

- [ ] Todas as equações estão entre `$...$`?
- [ ] Nenhuma equação está em texto plano?
- [ ] Os símbolos matemáticos estão usando comandos LaTeX apropriados?
- [ ] As frações, raízes e potências estão formatadas corretamente?
- [ ] Há espaçamento adequado ao redor das equações inline?

---

## 📝 Exemplo Completo de Resposta Formatada

**Pergunta do usuário:** "Me explique a fórmula quadrática"

**Resposta formatada corretamente:**

```
A fórmula quadrática é usada para resolver equações do segundo grau da forma $ax^2 + bx + c = 0$, onde $a \neq 0$.

A fórmula é:

$x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$

Onde:
- $a$, $b$ e $c$ são os coeficientes da equação
- $\pm$ indica que há duas soluções possíveis
- $b^2-4ac$ é chamado de discriminante, representado por $\Delta$

Se $\Delta > 0$, a equação tem duas raízes reais distintas.
Se $\Delta = 0$, a equação tem uma raiz real dupla.
Se $\Delta < 0$, a equação tem duas raízes complexas conjugadas.
```

---

## ⚠️ Erros Comuns a Evitar

1. **NÃO escreva:** "E igual mc ao quadrado"
   - **ESCREVA:** `$E = mc^2$`

2. **NÃO escreva:** "x = (-b ± √(b²-4ac)) / 2a"
   - **ESCREVA:** `$x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$`

3. **NÃO escreva:** "pi é aproximadamente 3.14"
   - **ESCREVA:** `$\pi$ é aproximadamente $3.14$` ou `$\pi \approx 3.14$`

4. **NÃO use** caracteres Unicode para símbolos matemáticos (², ³, √, etc.)
   - **USE** comandos LaTeX apropriados (`^2`, `^3`, `\sqrt{}`, etc.)

---

**Lembre-se:** O sistema de renderização está configurado para processar LaTeX. Sempre que você usar o formato `$equação$`, a equação será renderizada de forma bonita e profissional no chat.

