/**
 * Moleskine - Editor Module
 * Split-pane markdown editor with live preview
 */

const Editor = (function() {
    let textarea = null;
    let previewContainer = null;
    let currentDraftId = null;
    let autoSaveTimer = null;
    const AUTO_SAVE_DELAY = 1000; // 1 second

    /**
     * Initialize the editor
     */
    function init() {
        textarea = document.getElementById('editor-textarea');
        previewContainer = document.getElementById('preview-content');

        if (!textarea || !previewContainer) {
            return;
        }

        // Set up event listeners
        textarea.addEventListener('input', handleInput);
        textarea.addEventListener('keydown', handleKeydown);

        // Set up toolbar
        initToolbar();

        // Load last draft if exists
        loadLastDraft();
    }

    /**
     * Initialize toolbar buttons
     */
    function initToolbar() {
        const toolbar = document.getElementById('editor-toolbar');
        if (!toolbar) return;

        toolbar.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;

            e.preventDefault();
            const action = btn.dataset.action;
            executeAction(action);
        });
    }

    /**
     * Execute a toolbar action
     */
    function executeAction(action) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);

        let newText = '';
        let cursorOffset = 0;

        switch (action) {
            case 'bold':
                newText = `**${selectedText || 'bold text'}**`;
                cursorOffset = selectedText ? newText.length : 2;
                break;

            case 'italic':
                newText = `*${selectedText || 'italic text'}*`;
                cursorOffset = selectedText ? newText.length : 1;
                break;

            case 'heading':
                // Add heading at line start
                const lineStart = text.lastIndexOf('\n', start - 1) + 1;
                const lineText = text.substring(lineStart, end);
                const headingMatch = lineText.match(/^(#{1,6})\s/);

                if (headingMatch) {
                    // Cycle through heading levels
                    const level = headingMatch[1].length;
                    if (level < 6) {
                        newText = '#' + lineText;
                    } else {
                        newText = lineText.replace(/^#{1,6}\s/, '');
                    }
                } else {
                    newText = '## ' + lineText;
                }

                textarea.setSelectionRange(lineStart, end);
                insertText(newText);
                return;

            case 'link':
                if (selectedText) {
                    newText = `[${selectedText}](url)`;
                    cursorOffset = newText.length - 4;
                } else {
                    newText = '[link text](url)';
                    cursorOffset = 1;
                }
                break;

            case 'code':
                if (selectedText.includes('\n')) {
                    newText = '```\n' + selectedText + '\n```';
                } else {
                    newText = '`' + (selectedText || 'code') + '`';
                }
                cursorOffset = selectedText ? newText.length : 1;
                break;

            case 'list':
                const lines = selectedText.split('\n');
                newText = lines.map(line => '- ' + line).join('\n');
                if (!selectedText) {
                    newText = '- list item';
                }
                cursorOffset = newText.length;
                break;

            case 'math':
                if (selectedText) {
                    newText = selectedText.includes('\n')
                        ? `$$\n${selectedText}\n$$`
                        : `$${selectedText}$`;
                } else {
                    newText = '$expression$';
                    cursorOffset = 1;
                }
                break;

            default:
                return;
        }

        insertText(newText);

        // Set cursor position
        const newPos = start + cursorOffset;
        textarea.setSelectionRange(newPos, newPos);
        textarea.focus();
    }

    /**
     * Insert text at cursor position
     */
    function insertText(text) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = textarea.value.substring(0, start);
        const after = textarea.value.substring(end);

        textarea.value = before + text + after;
        handleInput();
    }

    /**
     * Handle input events (update preview, auto-save)
     */
    function handleInput() {
        // Update preview
        updatePreview();

        // Schedule auto-save
        if (autoSaveTimer) {
            clearTimeout(autoSaveTimer);
        }
        autoSaveTimer = setTimeout(saveDraft, AUTO_SAVE_DELAY);
    }

    /**
     * Handle keyboard shortcuts
     */
    function handleKeydown(e) {
        // Ctrl/Cmd + key shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'b':
                    e.preventDefault();
                    executeAction('bold');
                    break;
                case 'i':
                    e.preventDefault();
                    executeAction('italic');
                    break;
                case 'k':
                    e.preventDefault();
                    executeAction('link');
                    break;
                case 's':
                    e.preventDefault();
                    saveDraft();
                    showSaveNotification();
                    break;
            }
        }

        // Tab key for indentation
        if (e.key === 'Tab') {
            e.preventDefault();
            insertText('    ');
        }
    }

    /**
     * Update the preview pane
     */
    function updatePreview() {
        if (!previewContainer) return;
        Markdown.render(textarea.value, previewContainer);
    }

    /**
     * Save current draft
     */
    function saveDraft() {
        if (!textarea) return;

        const content = textarea.value;
        if (!content.trim()) return;

        const title = Markdown.extractTitle(content);

        if (!currentDraftId) {
            currentDraftId = 'draft_' + Date.now();
        }

        Storage.saveDraft(currentDraftId, content, title);
    }

    /**
     * Load a draft
     */
    function loadDraft(id) {
        const draft = Storage.getDraft(id);
        if (draft && textarea) {
            currentDraftId = id;
            textarea.value = draft.content;
            updatePreview();
        }
    }

    /**
     * Load the most recent draft
     */
    function loadLastDraft() {
        const drafts = Storage.getDrafts();
        const draftIds = Object.keys(drafts);

        if (draftIds.length > 0) {
            // Sort by updated time and get most recent
            draftIds.sort((a, b) => {
                const timeA = new Date(drafts[a].updatedAt).getTime();
                const timeB = new Date(drafts[b].updatedAt).getTime();
                return timeB - timeA;
            });
            loadDraft(draftIds[0]);
        }
    }

    /**
     * Create a new draft
     */
    function newDraft() {
        currentDraftId = null;
        if (textarea) {
            textarea.value = '';
            updatePreview();
        }
    }

    /**
     * Get current content
     */
    function getContent() {
        return textarea ? textarea.value : '';
    }

    /**
     * Set content
     */
    function setContent(content) {
        if (textarea) {
            textarea.value = content;
            updatePreview();
        }
    }

    /**
     * Export content as markdown file
     */
    function exportMarkdown() {
        const content = getContent();
        if (!content.trim()) {
            alert('Nothing to export');
            return;
        }

        const title = Markdown.extractTitle(content);
        const filename = title.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-') + '.md';

        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Show save notification
     */
    function showSaveNotification() {
        // Simple notification - could be enhanced
        const existing = document.querySelector('.save-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = 'save-notification';
        notification.textContent = 'Saved';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 8px 16px;
            background: var(--color-success);
            color: white;
            border-radius: 4px;
            font-size: 14px;
            z-index: 1000;
            animation: fadeInOut 2s forwards;
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    }

    // Public API
    return {
        init,
        loadDraft,
        newDraft,
        getContent,
        setContent,
        exportMarkdown,
        saveDraft
    };
})();
