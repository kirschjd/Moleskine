# Welcome to Moleskine

Your personal digital notebook for thoughts, ideas, and creativity.

## Getting Started

Moleskine is designed to be simple and focused. Here's what you can do:

### Write Notes

Use the **Editor** to create and edit markdown notes. Your notes support:

- **Rich formatting** with Markdown
- `Code blocks` with syntax highlighting
- Math equations like $E = mc^2$
- Task lists and tables

### Draw and Diagram

The **Whiteboard** gives you a canvas for:

- Freehand sketches
- Simple shapes (rectangles, circles, arrows)
- Diagrams and flowcharts
- Export your drawings as PNG

### Organize Everything

Notes are organized in the sidebar. You can:

- Browse by category
- Filter by tags
- Search across all notes

## Workflow

### Viewing Notes

Click any notebook in the sidebar to view it. The markdown is rendered with full support for code highlighting and math.

### Creating Notes

1. Click **New Note** in the sidebar
2. Write your content in Markdown
3. See the live preview on the right
4. Export when ready

### Adding Permanent Notes

To add notes that persist in the repository:

1. Create a `.md` file in the `notebooks/` folder
2. Add an entry to `_index.json`
3. Commit and push to GitHub

## Example: Math Equations

Inline math: $\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$

Block math:

$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$

## Example: Code

```javascript
function greet(name) {
    return `Hello, ${name}!`;
}

console.log(greet('Moleskine'));
```

## Example: Task List

- [x] Set up the notebook
- [x] Explore the editor
- [ ] Create your first note
- [ ] Try the whiteboard

## Tips

1. **Keyboard shortcuts**: Use `Ctrl+B` for bold, `Ctrl+I` for italic, `Ctrl+K` for links
2. **Auto-save**: Drafts are automatically saved to your browser's local storage
3. **Dark mode**: Toggle the theme with the sun/moon icon in the sidebar

---

Happy writing!
