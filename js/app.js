/**
 * Moleskine - Main Application Controller
 */

const App = (function() {
    let currentView = 'reader';
    let currentNotebook = null;
    let notebooks = [];

    /**
     * Initialize the application
     */
    function init() {
        // Check authentication
        if (!Auth.requireAuth()) {
            return;
        }

        // Load settings
        applySettings();

        // Load notebooks
        loadNotebooks();

        // Initialize modules
        Markdown.init();
        Editor.init();
        Whiteboard.init();

        // Set up event listeners
        initEventListeners();

        // Show default view
        showView('reader');

        // Load welcome notebook or last viewed
        loadInitialContent();
    }

    /**
     * Apply saved settings
     */
    function applySettings() {
        const settings = Storage.getSettings();

        // Apply theme
        if (settings.theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }

    /**
     * Initialize event listeners
     */
    function initEventListeners() {
        // Navigation links
        document.querySelectorAll('[data-view]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                showView(link.dataset.view);
            });
        });

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => Auth.logout());
        }

        // Settings button
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', openSettings);
        }

        // Search input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', handleSearch);
        }

        // Notebook list clicks
        const notebookList = document.getElementById('notebook-list');
        if (notebookList) {
            notebookList.addEventListener('click', (e) => {
                const link = e.target.closest('.nav-link');
                if (link && link.dataset.notebook) {
                    e.preventDefault();
                    loadNotebook(link.dataset.notebook);
                }
            });
        }

        // Settings modal
        initSettingsModal();
    }

    /**
     * Show a specific view
     */
    function showView(viewName) {
        currentView = viewName;

        // Hide all views
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));

        // Show requested view
        const view = document.getElementById('view-' + viewName);
        if (view) {
            view.classList.remove('hidden');
        }

        // Update navigation
        document.querySelectorAll('[data-view]').forEach(link => {
            link.classList.toggle('active', link.dataset.view === viewName);
        });

        // Update header
        updateHeader(viewName);

        // Initialize view-specific functionality
        if (viewName === 'whiteboard') {
            Whiteboard.init();
        }
    }

    /**
     * Update header based on current view
     */
    function updateHeader(viewName) {
        const pageTitle = document.getElementById('page-title');
        const headerActions = document.getElementById('header-actions');

        if (!pageTitle || !headerActions) return;

        headerActions.innerHTML = '';

        switch (viewName) {
            case 'reader':
                pageTitle.textContent = currentNotebook ? currentNotebook.title : 'Welcome';
                break;

            case 'editor':
                pageTitle.textContent = 'Editor';
                const githubConfigured = GitHub.isConfigured();
                headerActions.innerHTML = `
                    <button class="btn btn-secondary" id="btn-new">New</button>
                    <button class="btn btn-secondary" id="btn-export">Export</button>
                    ${githubConfigured ? '<button class="btn btn-primary" id="btn-save-github">Save to GitHub</button>' : '<button class="btn btn-ghost" id="btn-setup-github">Setup GitHub Sync</button>'}
                `;
                document.getElementById('btn-new')?.addEventListener('click', () => Editor.newDraft());
                document.getElementById('btn-export')?.addEventListener('click', () => Editor.exportMarkdown());
                document.getElementById('btn-save-github')?.addEventListener('click', saveToGitHub);
                document.getElementById('btn-setup-github')?.addEventListener('click', openSettings);
                break;

            case 'whiteboard':
                pageTitle.textContent = 'Whiteboard';
                headerActions.innerHTML = `
                    <button class="btn btn-ghost" id="btn-undo">Undo</button>
                    <button class="btn btn-ghost" id="btn-redo">Redo</button>
                    <button class="btn btn-ghost" id="btn-clear">Clear</button>
                    <button class="btn btn-primary" id="btn-export-png">Export PNG</button>
                `;
                document.getElementById('btn-undo')?.addEventListener('click', () => Whiteboard.undo());
                document.getElementById('btn-redo')?.addEventListener('click', () => Whiteboard.redo());
                document.getElementById('btn-clear')?.addEventListener('click', () => {
                    if (confirm('Clear the whiteboard?')) {
                        Whiteboard.clear();
                    }
                });
                document.getElementById('btn-export-png')?.addEventListener('click', () => Whiteboard.exportPNG());
                break;

            case 'recent':
                pageTitle.textContent = 'Recent Notes';
                break;
        }
    }

    /**
     * Toggle dark/light theme
     */
    function toggleTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const newTheme = isDark ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        Storage.setSetting('theme', newTheme);
    }

    /**
     * Load notebooks from _index.json
     */
    async function loadNotebooks() {
        try {
            const response = await fetch('notebooks/_index.json');
            if (!response.ok) throw new Error('Failed to load notebook index');

            const data = await response.json();
            notebooks = data.notebooks || [];
            renderNotebookList();
            renderTagList(data.tags || []);
        } catch (err) {
            console.warn('Could not load notebooks:', err);
            notebooks = [];
            renderNotebookList();
        }
    }

    /**
     * Render the notebook list in sidebar
     */
    function renderNotebookList() {
        const list = document.getElementById('notebook-list');
        if (!list) return;

        if (notebooks.length === 0) {
            list.innerHTML = '<li class="nav-item"><span class="nav-link" style="color: var(--color-text-muted)">No notebooks yet</span></li>';
            return;
        }

        list.innerHTML = notebooks.map(nb => `
            <li class="nav-item">
                <a href="#" class="nav-link" data-notebook="${nb.id}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                    <span>${nb.title}</span>
                </a>
            </li>
        `).join('');
    }

    /**
     * Render the tag list in sidebar
     */
    function renderTagList(tags) {
        const list = document.getElementById('tag-list');
        if (!list) return;

        if (tags.length === 0) {
            list.innerHTML = '<li class="nav-item"><span class="nav-link" style="color: var(--color-text-muted)">No tags yet</span></li>';
            return;
        }

        list.innerHTML = tags.map(tag => `
            <li class="nav-item">
                <a href="#" class="nav-link" data-tag="${tag}">
                    <span style="color: var(--color-accent)">#</span>
                    <span>${tag}</span>
                </a>
            </li>
        `).join('');
    }

    /**
     * Load a specific notebook
     */
    async function loadNotebook(id) {
        try {
            const notebook = notebooks.find(nb => nb.id === id);
            if (!notebook) {
                console.error('Notebook not found:', id);
                return;
            }

            const response = await fetch(`notebooks/${id}.md`);
            if (!response.ok) throw new Error('Failed to load notebook');

            const content = await response.text();

            currentNotebook = { ...notebook, content };

            // Add to recent
            Storage.addToRecent(notebook);

            // Render markdown
            const container = document.getElementById('markdown-content');
            Markdown.render(content, container);

            // Update header
            showView('reader');

            // Update active state in nav
            document.querySelectorAll('[data-notebook]').forEach(link => {
                link.classList.toggle('active', link.dataset.notebook === id);
            });

        } catch (err) {
            console.error('Error loading notebook:', err);
        }
    }

    /**
     * Load initial content (welcome or last viewed)
     */
    function loadInitialContent() {
        // Try to load welcome notebook
        if (notebooks.some(nb => nb.id === 'welcome')) {
            loadNotebook('welcome');
        } else if (notebooks.length > 0) {
            loadNotebook(notebooks[0].id);
        } else {
            // Show placeholder content
            const container = document.getElementById('markdown-content');
            if (container) {
                container.innerHTML = `
                    <h1>Welcome to Moleskine</h1>
                    <p>Your personal digital notebook.</p>
                    <p>Get started by:</p>
                    <ul>
                        <li>Creating a new note in the <strong>Editor</strong></li>
                        <li>Drawing on the <strong>Whiteboard</strong></li>
                        <li>Adding <code>.md</code> files to the <code>notebooks/</code> folder</li>
                    </ul>
                `;
            }
        }
    }

    /**
     * Handle search input
     */
    function handleSearch(e) {
        const query = e.target.value.toLowerCase().trim();

        if (!query) {
            renderNotebookList();
            return;
        }

        const filtered = notebooks.filter(nb =>
            nb.title.toLowerCase().includes(query) ||
            (nb.tags && nb.tags.some(t => t.toLowerCase().includes(query)))
        );

        const list = document.getElementById('notebook-list');
        if (!list) return;

        if (filtered.length === 0) {
            list.innerHTML = '<li class="nav-item"><span class="nav-link" style="color: var(--color-text-muted)">No matches</span></li>';
        } else {
            list.innerHTML = filtered.map(nb => `
                <li class="nav-item">
                    <a href="#" class="nav-link" data-notebook="${nb.id}">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                        </svg>
                        <span>${nb.title}</span>
                    </a>
                </li>
            `).join('');
        }
    }

    /**
     * Initialize settings modal
     */
    function initSettingsModal() {
        const modal = document.getElementById('settings-modal');
        const closeBtn = document.getElementById('settings-close');
        const backdrop = modal?.querySelector('.modal-backdrop');
        const testBtn = document.getElementById('github-test');
        const saveBtn = document.getElementById('github-save');

        // Close modal handlers
        closeBtn?.addEventListener('click', closeSettings);
        backdrop?.addEventListener('click', closeSettings);

        // Test connection
        testBtn?.addEventListener('click', async () => {
            const statusEl = document.getElementById('github-status');
            const tokenInput = document.getElementById('github-token');
            const ownerInput = document.getElementById('github-owner');
            const repoInput = document.getElementById('github-repo');

            // Temporarily save for testing
            if (tokenInput.value) {
                GitHub.setToken(tokenInput.value);
            }
            if (ownerInput.value && repoInput.value) {
                GitHub.setRepoConfig(ownerInput.value, repoInput.value);
            }

            statusEl.className = 'settings-status info';
            statusEl.textContent = 'Testing connection...';

            const result = await GitHub.testConnection();
            if (result.success) {
                statusEl.className = 'settings-status success';
                statusEl.textContent = 'Connection successful!';
            } else {
                statusEl.className = 'settings-status error';
                statusEl.textContent = 'Connection failed: ' + result.error;
            }
        });

        // Save settings
        saveBtn?.addEventListener('click', () => {
            const tokenInput = document.getElementById('github-token');
            const ownerInput = document.getElementById('github-owner');
            const repoInput = document.getElementById('github-repo');
            const statusEl = document.getElementById('github-status');

            if (tokenInput.value) {
                GitHub.setToken(tokenInput.value);
            }
            if (ownerInput.value && repoInput.value) {
                GitHub.setRepoConfig(ownerInput.value, repoInput.value);
            }

            statusEl.className = 'settings-status success';
            statusEl.textContent = 'Settings saved!';

            // Refresh header to show GitHub button
            updateHeader(currentView);

            setTimeout(() => {
                closeSettings();
            }, 1000);
        });
    }

    /**
     * Open settings modal
     */
    function openSettings() {
        const modal = document.getElementById('settings-modal');
        const tokenInput = document.getElementById('github-token');
        const ownerInput = document.getElementById('github-owner');
        const repoInput = document.getElementById('github-repo');
        const statusEl = document.getElementById('github-status');

        // Load current values
        const config = GitHub.getRepoConfig();
        const token = GitHub.getToken();

        if (token) {
            tokenInput.value = token;
        }
        ownerInput.value = config.owner || '';
        repoInput.value = config.repo || '';
        statusEl.className = 'settings-status';
        statusEl.textContent = '';

        modal?.classList.remove('hidden');
    }

    /**
     * Close settings modal
     */
    function closeSettings() {
        const modal = document.getElementById('settings-modal');
        modal?.classList.add('hidden');
    }

    /**
     * Save current editor content to GitHub
     */
    async function saveToGitHub() {
        const content = Editor.getContent();
        if (!content.trim()) {
            alert('Nothing to save');
            return;
        }

        const title = Markdown.extractTitle(content);
        const id = title.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50) || 'untitled';

        const saveBtn = document.getElementById('btn-save-github');
        const originalText = saveBtn?.textContent;

        try {
            if (saveBtn) {
                saveBtn.textContent = 'Saving...';
                saveBtn.disabled = true;
            }

            await GitHub.saveNotebook(id, content, title, []);

            if (saveBtn) {
                saveBtn.textContent = 'Saved!';
                setTimeout(() => {
                    saveBtn.textContent = originalText;
                    saveBtn.disabled = false;
                }, 2000);
            }

            // Reload notebooks to show the new one
            await loadNotebooks();

        } catch (err) {
            console.error('Failed to save:', err);
            alert('Failed to save: ' + err.message);
            if (saveBtn) {
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
            }
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Public API
    return {
        showView,
        loadNotebook,
        loadNotebooks,
        toggleTheme,
        openSettings,
        saveToGitHub
    };
})();
