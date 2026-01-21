/**
 * Moleskine - Markdown Module
 * Handles markdown parsing and rendering with KaTeX math support
 */

const Markdown = (function() {
    // Configure marked options
    const markedOptions = {
        gfm: true,
        breaks: true,
        headerIds: true,
        mangle: false
    };

    /**
     * Initialize marked with custom renderer
     */
    function init() {
        if (typeof marked === 'undefined') {
            console.error('marked.js is not loaded');
            return;
        }

        marked.setOptions(markedOptions);

        // Custom renderer for additional features
        const renderer = new marked.Renderer();

        // Add IDs to headings for linking
        renderer.heading = function(text, level) {
            const id = text.toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-');
            return `<h${level} id="${id}">${text}</h${level}>`;
        };

        // Handle task lists
        renderer.listitem = function(text, task, checked) {
            if (task) {
                return `<li class="task-list-item">
                    <input type="checkbox" ${checked ? 'checked' : ''} disabled>
                    ${text}
                </li>`;
            }
            return `<li>${text}</li>`;
        };

        marked.use({ renderer });
    }

    /**
     * Process math expressions in text
     * Supports $inline$ and $$block$$ syntax
     */
    function processMath(html) {
        if (typeof katex === 'undefined') {
            return html;
        }

        // Process block math ($$...$$)
        html = html.replace(/\$\$([^$]+)\$\$/g, (match, math) => {
            try {
                return katex.renderToString(math.trim(), {
                    displayMode: true,
                    throwOnError: false
                });
            } catch (e) {
                console.warn('KaTeX error:', e);
                return match;
            }
        });

        // Process inline math ($...$)
        html = html.replace(/\$([^$\n]+)\$/g, (match, math) => {
            try {
                return katex.renderToString(math.trim(), {
                    displayMode: false,
                    throwOnError: false
                });
            } catch (e) {
                console.warn('KaTeX error:', e);
                return match;
            }
        });

        return html;
    }

    /**
     * Apply syntax highlighting to code blocks
     */
    function highlightCode(container) {
        if (typeof Prism === 'undefined') {
            return;
        }

        const codeBlocks = container.querySelectorAll('pre code');
        codeBlocks.forEach(block => {
            Prism.highlightElement(block);
        });
    }

    /**
     * Parse markdown to HTML
     */
    function parse(markdown) {
        if (typeof marked === 'undefined') {
            return escapeHtml(markdown);
        }

        let html = marked.parse(markdown);
        html = processMath(html);
        return html;
    }

    /**
     * Render markdown into a container element
     */
    function render(markdown, container) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }

        if (!container) {
            console.error('Container not found');
            return;
        }

        container.innerHTML = parse(markdown);
        highlightCode(container);
    }

    /**
     * Extract title from markdown (first h1 or first line)
     */
    function extractTitle(markdown) {
        // Try to find first h1
        const h1Match = markdown.match(/^#\s+(.+)$/m);
        if (h1Match) {
            return h1Match[1].trim();
        }

        // Otherwise use first non-empty line
        const lines = markdown.split('\n').filter(l => l.trim());
        if (lines.length > 0) {
            return lines[0].replace(/^#+\s*/, '').trim().slice(0, 50);
        }

        return 'Untitled';
    }

    /**
     * Extract tags from markdown (looks for #tag format)
     */
    function extractTags(markdown) {
        const tagRegex = /(?:^|\s)#([a-zA-Z][a-zA-Z0-9_-]*)/g;
        const tags = new Set();
        let match;

        while ((match = tagRegex.exec(markdown)) !== null) {
            // Skip if it looks like a heading
            if (match.index === 0 || markdown[match.index - 1] === '\n') {
                continue;
            }
            tags.add(match[1].toLowerCase());
        }

        return Array.from(tags);
    }

    /**
     * Escape HTML characters
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Generate table of contents from markdown
     */
    function generateTOC(markdown) {
        const headingRegex = /^(#{1,6})\s+(.+)$/gm;
        const toc = [];
        let match;

        while ((match = headingRegex.exec(markdown)) !== null) {
            const level = match[1].length;
            const text = match[2].trim();
            const id = text.toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-');

            toc.push({ level, text, id });
        }

        return toc;
    }

    // Initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Public API
    return {
        init,
        parse,
        render,
        extractTitle,
        extractTags,
        generateTOC,
        escapeHtml
    };
})();
