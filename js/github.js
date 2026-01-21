/**
 * Moleskine - GitHub API Integration
 * Handles reading/writing files to GitHub repository
 */

const GitHub = (function() {
    const TOKEN_KEY = 'moleskine_github_token';
    const REPO_KEY = 'moleskine_github_repo';

    // Default repo info (can be overridden in settings)
    const DEFAULT_OWNER = 'kirschjd';
    const DEFAULT_REPO = 'Moleskine';
    const DEFAULT_BRANCH = 'main';

    /**
     * Get stored GitHub token
     */
    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    /**
     * Set GitHub token
     */
    function setToken(token) {
        if (token) {
            localStorage.setItem(TOKEN_KEY, token);
        } else {
            localStorage.removeItem(TOKEN_KEY);
        }
    }

    /**
     * Check if GitHub is configured
     */
    function isConfigured() {
        return !!getToken();
    }

    /**
     * Get repo configuration
     */
    function getRepoConfig() {
        try {
            const stored = localStorage.getItem(REPO_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {}
        return {
            owner: DEFAULT_OWNER,
            repo: DEFAULT_REPO,
            branch: DEFAULT_BRANCH
        };
    }

    /**
     * Set repo configuration
     */
    function setRepoConfig(owner, repo, branch = 'main') {
        localStorage.setItem(REPO_KEY, JSON.stringify({ owner, repo, branch }));
    }

    /**
     * Make authenticated GitHub API request
     */
    async function apiRequest(endpoint, options = {}) {
        const token = getToken();
        if (!token) {
            throw new Error('GitHub token not configured');
        }

        const response = await fetch(`https://api.github.com${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `GitHub API error: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Get file content from repo
     */
    async function getFile(path) {
        const { owner, repo, branch } = getRepoConfig();
        try {
            const data = await apiRequest(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
            return {
                content: atob(data.content),
                sha: data.sha,
                path: data.path
            };
        } catch (e) {
            if (e.message.includes('404')) {
                return null; // File doesn't exist
            }
            throw e;
        }
    }

    /**
     * Create or update file in repo
     */
    async function saveFile(path, content, message) {
        const { owner, repo, branch } = getRepoConfig();

        // Get current file SHA if it exists (needed for updates)
        let sha = null;
        try {
            const existing = await getFile(path);
            if (existing) {
                sha = existing.sha;
            }
        } catch (e) {
            // File doesn't exist, that's fine
        }

        const body = {
            message: message || `Update ${path}`,
            content: btoa(unescape(encodeURIComponent(content))), // Handle unicode
            branch: branch
        };

        if (sha) {
            body.sha = sha;
        }

        return apiRequest(`/repos/${owner}/${repo}/contents/${path}`, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    }

    /**
     * Delete file from repo
     */
    async function deleteFile(path, message) {
        const { owner, repo, branch } = getRepoConfig();

        const existing = await getFile(path);
        if (!existing) {
            throw new Error('File not found');
        }

        return apiRequest(`/repos/${owner}/${repo}/contents/${path}`, {
            method: 'DELETE',
            body: JSON.stringify({
                message: message || `Delete ${path}`,
                sha: existing.sha,
                branch: branch
            })
        });
    }

    /**
     * List files in a directory
     */
    async function listFiles(path = '') {
        const { owner, repo, branch } = getRepoConfig();
        return apiRequest(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
    }

    /**
     * Save a notebook (markdown file + update index)
     */
    async function saveNotebook(id, content, title, tags = []) {
        // Save the markdown file
        await saveFile(
            `notebooks/${id}.md`,
            content,
            `Update notebook: ${title}`
        );

        // Update the index
        await updateNotebookIndex(id, title, tags);

        return true;
    }

    /**
     * Update the notebooks index
     */
    async function updateNotebookIndex(id, title, tags = []) {
        const indexPath = 'notebooks/_index.json';
        let index = { notebooks: [], tags: [] };

        try {
            const existing = await getFile(indexPath);
            if (existing) {
                index = JSON.parse(existing.content);
            }
        } catch (e) {
            // Index doesn't exist, start fresh
        }

        // Find or create notebook entry
        const now = new Date().toISOString().split('T')[0];
        let notebook = index.notebooks.find(n => n.id === id);

        if (notebook) {
            notebook.title = title;
            notebook.tags = tags;
            notebook.updatedAt = now;
        } else {
            index.notebooks.push({
                id,
                title,
                tags,
                createdAt: now,
                updatedAt: now
            });
        }

        // Update tags list
        const allTags = new Set(index.tags || []);
        tags.forEach(t => allTags.add(t));
        index.tags = Array.from(allTags).sort();

        // Save updated index
        await saveFile(
            indexPath,
            JSON.stringify(index, null, 2),
            `Update notebook index`
        );

        return index;
    }

    /**
     * Create a new notebook
     */
    async function createNotebook(title, initialContent = '') {
        const id = title.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);

        const content = initialContent || `# ${title}\n\nStart writing here...\n`;

        await saveNotebook(id, content, title, []);

        return { id, title, content };
    }

    /**
     * Test the connection with current token
     */
    async function testConnection() {
        const { owner, repo } = getRepoConfig();
        try {
            await apiRequest(`/repos/${owner}/${repo}`);
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    // Public API
    return {
        getToken,
        setToken,
        isConfigured,
        getRepoConfig,
        setRepoConfig,
        getFile,
        saveFile,
        deleteFile,
        listFiles,
        saveNotebook,
        createNotebook,
        testConnection
    };
})();
