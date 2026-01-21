# Markdown Guide

A quick reference for Markdown syntax supported in Moleskine.

## Text Formatting

| Syntax | Result |
|--------|--------|
| `**bold**` | **bold** |
| `*italic*` | *italic* |
| `~~strikethrough~~` | ~~strikethrough~~ |
| `` `code` `` | `code` |

## Headings

```markdown
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
```

## Links and Images

```markdown
[Link text](https://example.com)

![Alt text](image.png)
```

## Lists

### Unordered
```markdown
- Item 1
- Item 2
  - Nested item
```

- Item 1
- Item 2
  - Nested item

### Ordered
```markdown
1. First
2. Second
3. Third
```

1. First
2. Second
3. Third

### Task Lists
```markdown
- [x] Completed task
- [ ] Pending task
```

- [x] Completed task
- [ ] Pending task

## Code Blocks

Inline: `` `code` ``

Block with syntax highlighting:

````markdown
```javascript
const x = 42;
```
````

Result:
```javascript
const x = 42;
```

## Blockquotes

```markdown
> This is a quote
> It can span multiple lines
```

> This is a quote
> It can span multiple lines

## Tables

```markdown
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
```

| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |

## Horizontal Rule

```markdown
---
```

---

## Math (KaTeX)

### Inline Math
```markdown
The equation $E = mc^2$ is famous.
```

The equation $E = mc^2$ is famous.

### Block Math
```markdown
$$
\frac{-b \pm \sqrt{b^2-4ac}}{2a}
$$
```

$$
\frac{-b \pm \sqrt{b^2-4ac}}{2a}
$$

### Common Math Symbols

| Symbol | Syntax |
|--------|--------|
| $\alpha, \beta, \gamma$ | `\alpha, \beta, \gamma` |
| $\sum$ | `\sum` |
| $\int$ | `\int` |
| $\infty$ | `\infty` |
| $\sqrt{x}$ | `\sqrt{x}` |
| $\frac{a}{b}$ | `\frac{a}{b}` |
| $x^2$ | `x^2` |
| $x_i$ | `x_i` |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Bold |
| `Ctrl+I` | Italic |
| `Ctrl+K` | Insert link |
| `Ctrl+S` | Save draft |
| `Tab` | Indent |
