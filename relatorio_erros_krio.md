# Relatório de Análise de Interface e UX - Agência Krio

Este documento detalha os problemas de interface, sobreposições e erros técnicos encontrados no arquivo `index.html` da Agência Krio, juntamente com as soluções recomendadas para cada item.

---

## 1. Sobreposição Crítica no Hero (Destaque Principal)

### O Problema
No cabeçalho principal (Hero), o título "Krio" e a frase de impacto "TRANSFORME SUA EXPERTISE EM INFLUÊNCIA DIGITAL" estão sobrepondo a imagem à direita em resoluções de tela médias (tablets e laptops pequenos).

*   **Onde está no código:** Linhas 519-543 (CSS das classes `.hero h1` e `.hero-statement`).
*   **Causa:** O uso de `clamp(5rem, 14vw, 15rem)` no tamanho da fonte e um grid com colunas muito rígidas (`minmax(26rem, 1.12fr)` na linha 487).

### Como Arrumar
1.  **Ajustar o Grid:** Mudar o `grid-template-columns` para ser mais flexível ou empilhar os elementos mais cedo em telas menores.
2.  **Reduzir o Clamp:** Diminuir o valor máximo e o multiplicador de viewport do título.
3.  **Correção Sugerida:**
    ```css
    .hero-grid {
        grid-template-columns: 1fr; /* Empilhar em mobile */
    }
    @media (min-width: 1024px) {
        .hero-grid {
            grid-template-columns: 1.2fr 0.8fr; /* Proporção mais segura */
        }
    }
    .hero h1 {
        font-size: clamp(4rem, 10vw, 12rem); /* Tamanho mais controlado */
    }
    ```

---

## 2. Badge "Foco" Saindo da Tela

### O Problema
O elemento `.hero-badge` (Foco: Agenda, Autoridade, Receita) utiliza um posicionamento negativo que o joga para fora da área visível ou sobre o texto em telas menores.

*   **Onde está no código:** Linhas 597-607.
*   **Causa:** `left: -2.2rem;` empurra o elemento para fora do container.

### Como Arrumar
Remover o valor negativo de `left` em telas menores e usar um posicionamento relativo ou alinhado ao container.
```css
.hero-badge {
    left: 0; /* Resetar em telas menores */
    position: relative;
    margin-top: 1rem;
}
@media (min-width: 1200px) {
    .hero-badge {
        position: absolute;
        left: -1rem; /* Valor negativo menor e apenas em telas grandes */
    }
}
```

---

## 3. Cards de "Dores" com Margens Fixas (Layout Quebrado)

### O Problema
Os itens da seção de "Dores" (`.pain-item`) possuem margens superiores manuais que criam um efeito de "escada", mas que resultam em grandes espaços vazios ou sobreposições confusas em dispositivos móveis.

*   **Onde está no código:** Linhas 724-730.
*   **Causa:** `margin-top: 4.5rem;` e `margin-top: -1.5rem;` aplicados de forma fixa.

### Como Arrumar
Encapsular esses offsets em um Media Query para que só funcionem em Desktop.
```css
@media (min-width: 1024px) {
    .pain-item:nth-child(2) { margin-top: 4.5rem; }
    .pain-item:nth-child(3) { margin-top: -1.5rem; }
}
/* Em mobile, as margens devem ser resetadas para manter o fluxo vertical */
```

---

## 4. Seção "Social Fan" Não Responsiva

### O Problema
Os cards que mostram Instagram, Reels, etc., no final da página, usam posicionamento absoluto com porcentagens fixas (`left: 10%`, `left: 28%`, etc.), o que faz com que eles se amontoem ou sumam da tela em celulares.

*   **Onde está no código:** Linhas 2086-2100.
*   **Causa:** Estilos inline de posicionamento e rotação.

### Como Arrumar
Transformar essa seção em um carrossel horizontal simples ou uma lista vertical em dispositivos móveis.
```css
.social-fan {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    position: static; /* Remover o position relative do container */
}
.social-card {
    position: static !important; /* Resetar o posicionamento absoluto */
    transform: none !important; /* Remover a rotação em mobile */
    margin: 0.5rem;
}
```

---

## 5. Contraste e Acessibilidade

### O Problema
Várias partes do texto usam `color-mix` com 72% a 76% de transparência, o que dificulta a leitura para pessoas com baixa visão ou em ambientes muito iluminados.

*   **Onde está no código:** Linhas 503, 548, 697, 747.
*   **Causa:** Uso excessivo de transparência para criar um visual "minimalista".

### Como Arrumar
Aumentar a opacidade para pelo menos 85% ou usar cores sólidas de cinza escuro.
```css
.body-copy, .hero-copy, .lead-copy {
    color: color-mix(in srgb, currentColor 90%, transparent); /* Mais legível */
}
```

---

## 6. Erro de Placeholders no Markdown/JS

### O Problema
Alguns números aparecem como "0" antes do carregamento do JavaScript (como visto no diagnóstico de etapas e frentes). Se o usuário estiver com uma conexão lenta ou JS desativado, ele verá informações incompletas.

*   **Onde está no código:** Elementos com `data-count`.

### Como Arrumar
Coloque o valor real no HTML e use o JavaScript para "animar" a partir do zero, em vez de deixar o HTML com zero.
```html
<!-- De: -->
<span data-count="6">0</span>
<!-- Para: -->
<span data-count="6">06</span> 
```

---

## Resumo Técnico de Melhorias
1.  **Mobile First:** O CSS atual parece focado em Desktop. Recomenda-se reescrever as seções críticas usando `flex-direction: column` como padrão.
2.  **Z-Index:** O efeito de grão (`body::after`) está no `z-index: 60`. Embora tenha `pointer-events: none`, ele pode dificultar a depuração visual. Considere movê-lo para trás do menu.
3.  **Overflow:** O `overflow-x: hidden` no `html` e `body` está escondendo problemas de layout em vez de resolvê-los. O ideal é que nenhum elemento exceda a largura da viewport.
