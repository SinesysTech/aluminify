# Snippet de Prompt para LaTeX - Copiar e Colar

Este é um snippet resumido que você pode copiar diretamente para o prompt do sistema do seu agente no N8N.

---

## 📋 Instruções de Formatação LaTeX (Versão Resumida)

**Copie e cole o texto abaixo no prompt do sistema do seu agente:**

---

### Formatação de Equações Matemáticas

**REGRAS OBRIGATÓRIAS:**

1. **SEMPRE use o formato `$equação$`** para qualquer expressão matemática inline
2. **NUNCA escreva** equações em texto plano ou usando caracteres Unicode (², ³, √, etc.)
3. **SEMPRE use comandos LaTeX** para símbolos matemáticos

**Exemplos corretos:**
- `$E = mc^2$` (não "E = mc ao quadrado")
- `$x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$` (não "x = (-b ± √(b²-4ac)) / 2a")
- `$\pi \approx 3.14$` (não "pi é aproximadamente 3.14")
- `$\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$` (não "soma de 1 até n")
- `$\int_0^1 x^2 dx = \frac{1}{3}$` (não "integral de 0 a 1")

**Símbolos comuns:**
- Frações: `\frac{numerador}{denominador}`
- Raízes: `\sqrt{x}` ou `\sqrt[n]{x}`
- Potências: `x^2` ou `x^{n+1}`
- Letras gregas: `\alpha`, `\beta`, `\pi`, `\theta`
- Operadores: `\leq`, `\geq`, `\neq`, `\pm`, `\times`, `\div`
- Conjuntos: `\in`, `\subset`, `\mathbb{R}`, `\mathbb{N}`
- Somatórios: `\sum_{i=1}^{n}`
- Integrais: `\int_0^1` ou `\int`

**Exemplo de resposta formatada:**

```
A fórmula quadrática é $x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$, onde $a \neq 0$.

O discriminante $\Delta = b^2-4ac$ determina o número de raízes:
- Se $\Delta > 0$: duas raízes reais distintas
- Se $\Delta = 0$: uma raiz real dupla  
- Se $\Delta < 0$: duas raízes complexas
```

**Checklist:**
- [ ] Todas as equações estão entre `$...$`?
- [ ] Nenhuma equação em texto plano?
- [ ] Símbolos usando comandos LaTeX?

---

**IMPORTANTE:** O sistema renderiza LaTeX automaticamente. Use sempre `$equação$` para garantir formatação correta.

---




