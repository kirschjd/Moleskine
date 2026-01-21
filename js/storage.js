/**
 * Moleskine - Storage Module
 * Handles localStorage for drafts and settings
 */

const Storage = (function() {
    const DRAFTS_KEY = 'moleskine_drafts';
    const SETTINGS_KEY = 'moleskine_settings';
    const RECENT_KEY = 'moleskine_recent';

    /**
     * Get all drafts
     */
    function getDrafts() {
        try {
            return JSON.parse(localStorage.getItem(DRAFTS_KEY)) || {};
        } catch {
            return {};
        }
    }

    /**
     * Save a draft
     */
    function saveDraft(id, content, title = 'Untitled') {
        const drafts = getDrafts();
        drafts[id] = {
            content,
            title,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
    }

    /**
     * Get a specific draft
     */
    function getDraft(id) {
        const drafts = getDrafts();
        return drafts[id] || null;
    }

    /**
     * Delete a draft
     */
    function deleteDraft(id) {
        const drafts = getDrafts();
        delete drafts[id];
        localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
    }

    /**
     * Get settings
     */
    function getSettings() {
        try {
            return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {
                theme: 'light',
                fontSize: 16,
                editorMode: 'split'
            };
        } catch {
            return { theme: 'light', fontSize: 16, editorMode: 'split' };
        }
    }

    /**
     * Save settings
     */
    function saveSettings(settings) {
        const current = getSettings();
        const updated = { ...current, ...settings };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
        return updated;
    }

    /**
     * Get a single setting
     */
    function getSetting(key) {
        return getSettings()[key];
    }

    /**
     * Set a single setting
     */
    function setSetting(key, value) {
        return saveSettings({ [key]: value });
    }

    /**
     * Get recent notebooks
     */
    function getRecent() {
        try {
            return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
        } catch {
            return [];
        }
    }

    /**
     * Add to recent notebooks (max 10)
     */
    function addToRecent(notebook) {
        let recent = getRecent();
        // Remove if already exists
        recent = recent.filter(r => r.id !== notebook.id);
        // Add to front
        recent.unshift({
            id: notebook.id,
            title: notebook.title,
            accessedAt: new Date().toISOString()
        });
        // Keep only last 10
        recent = recent.slice(0, 10);
        localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
    }

    /**
     * Clear all storage (for testing/reset)
     */
    function clearAll() {
        localStorage.removeItem(DRAFTS_KEY);
        localStorage.removeItem(SETTINGS_KEY);
        localStorage.removeItem(RECENT_KEY);
    }

    // Public API
    return {
        getDrafts,
        saveDraft,
        getDraft,
        deleteDraft,
        getSettings,
        saveSettings,
        getSetting,
        setSetting,
        getRecent,
        addToRecent,
        clearAll
    };
})();
