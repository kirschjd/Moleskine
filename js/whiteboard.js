/**
 * Moleskine - Whiteboard Module
 * Canvas-based drawing tool
 */

const Whiteboard = (function() {
    let canvas = null;
    let ctx = null;
    let isDrawing = false;
    let currentTool = 'pen';
    let currentColor = '#2c2c2c';
    let strokeWidth = 2;
    let startX = 0;
    let startY = 0;

    // Store drawing history for undo
    let history = [];
    let historyIndex = -1;
    const MAX_HISTORY = 50;

    /**
     * Initialize the whiteboard
     */
    function init() {
        canvas = document.getElementById('whiteboard-canvas');
        if (!canvas) return;

        ctx = canvas.getContext('2d');

        // Set canvas size
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Set up event listeners
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseUp);

        // Touch support
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd);

        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeydown);

        // Tool selection
        initToolbar();

        // Save initial state
        saveState();
    }

    /**
     * Resize canvas to fit container
     */
    function resizeCanvas() {
        if (!canvas) return;

        const container = canvas.parentElement;
        const rect = container.getBoundingClientRect();

        // Store current drawing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        canvas.width = rect.width;
        canvas.height = rect.height;

        // Set default styles
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = strokeWidth;

        // Restore drawing
        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Initialize toolbar event listeners
     */
    function initToolbar() {
        const toolbar = document.getElementById('whiteboard-toolbar');
        if (!toolbar) return;

        // Tool buttons
        toolbar.querySelectorAll('.whiteboard-tool').forEach(btn => {
            btn.addEventListener('click', () => {
                setTool(btn.dataset.tool);
                toolbar.querySelectorAll('.whiteboard-tool').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Color swatches
        const colorPicker = document.getElementById('color-picker');
        if (colorPicker) {
            colorPicker.querySelectorAll('.color-swatch').forEach(swatch => {
                swatch.addEventListener('click', () => {
                    setColor(swatch.dataset.color);
                    colorPicker.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
                    swatch.classList.add('active');
                });
            });
        }
    }

    /**
     * Set current tool
     */
    function setTool(tool) {
        currentTool = tool;
        canvas.style.cursor = tool === 'eraser' ? 'cell' : 'crosshair';
    }

    /**
     * Set current color
     */
    function setColor(color) {
        currentColor = color;
        ctx.strokeStyle = color;
    }

    /**
     * Get mouse/touch position relative to canvas
     */
    function getPosition(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    /**
     * Handle mouse down
     */
    function handleMouseDown(e) {
        isDrawing = true;
        const pos = getPosition(e);
        startX = pos.x;
        startY = pos.y;

        if (currentTool === 'pen' || currentTool === 'eraser') {
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);

            if (currentTool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.lineWidth = 20;
            } else {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = currentColor;
                ctx.lineWidth = strokeWidth;
            }
        }
    }

    /**
     * Handle mouse move
     */
    function handleMouseMove(e) {
        if (!isDrawing) return;

        const pos = getPosition(e);

        if (currentTool === 'pen' || currentTool === 'eraser') {
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        } else {
            // Preview shape
            redrawFromHistory();
            drawShape(startX, startY, pos.x, pos.y, false);
        }
    }

    /**
     * Handle mouse up
     */
    function handleMouseUp(e) {
        if (!isDrawing) return;
        isDrawing = false;

        const pos = getPosition(e);

        if (currentTool !== 'pen' && currentTool !== 'eraser') {
            redrawFromHistory();
            drawShape(startX, startY, pos.x, pos.y, true);
        }

        // Reset composite operation
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = strokeWidth;

        saveState();
    }

    /**
     * Draw a shape
     */
    function drawShape(x1, y1, x2, y2, save) {
        ctx.beginPath();
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = strokeWidth;

        switch (currentTool) {
            case 'line':
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                break;

            case 'rect':
                ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
                break;

            case 'circle':
                const radiusX = Math.abs(x2 - x1) / 2;
                const radiusY = Math.abs(y2 - y1) / 2;
                const centerX = Math.min(x1, x2) + radiusX;
                const centerY = Math.min(y1, y2) + radiusY;
                ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
                ctx.stroke();
                break;

            case 'arrow':
                // Draw line
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();

                // Draw arrowhead
                const angle = Math.atan2(y2 - y1, x2 - x1);
                const headLength = 15;
                ctx.beginPath();
                ctx.moveTo(x2, y2);
                ctx.lineTo(
                    x2 - headLength * Math.cos(angle - Math.PI / 6),
                    y2 - headLength * Math.sin(angle - Math.PI / 6)
                );
                ctx.moveTo(x2, y2);
                ctx.lineTo(
                    x2 - headLength * Math.cos(angle + Math.PI / 6),
                    y2 - headLength * Math.sin(angle + Math.PI / 6)
                );
                ctx.stroke();
                break;

            case 'text':
                const text = prompt('Enter text:');
                if (text) {
                    ctx.font = '16px sans-serif';
                    ctx.fillStyle = currentColor;
                    ctx.fillText(text, x1, y1);
                }
                break;
        }
    }

    /**
     * Touch event handlers
     */
    function handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
    }

    function handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    }

    function handleTouchEnd(e) {
        handleMouseUp(e);
    }

    /**
     * Handle keyboard shortcuts
     */
    function handleKeydown(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        redo();
                    } else {
                        undo();
                    }
                    break;
            }
        }
    }

    /**
     * Save current state to history
     */
    function saveState() {
        if (!canvas) return;

        // Remove any states after current index
        history = history.slice(0, historyIndex + 1);

        // Add current state
        history.push(canvas.toDataURL());
        historyIndex++;

        // Limit history size
        if (history.length > MAX_HISTORY) {
            history.shift();
            historyIndex--;
        }
    }

    /**
     * Redraw canvas from last saved state
     */
    function redrawFromHistory() {
        if (historyIndex < 0) return;

        const img = new Image();
        img.src = history[historyIndex];
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
    }

    /**
     * Undo last action
     */
    function undo() {
        if (historyIndex > 0) {
            historyIndex--;
            const img = new Image();
            img.src = history[historyIndex];
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
        }
    }

    /**
     * Redo last undone action
     */
    function redo() {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            const img = new Image();
            img.src = history[historyIndex];
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
        }
    }

    /**
     * Clear the canvas
     */
    function clear() {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        saveState();
    }

    /**
     * Export canvas as PNG
     */
    function exportPNG() {
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = 'whiteboard-' + Date.now() + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    /**
     * Export canvas as SVG (simplified - just creates a PNG embedded in SVG)
     */
    function exportSVG() {
        if (!canvas) return;

        const dataUrl = canvas.toDataURL('image/png');
        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${canvas.width}" height="${canvas.height}">
    <image xlink:href="${dataUrl}" width="${canvas.width}" height="${canvas.height}"/>
</svg>`;

        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'whiteboard-' + Date.now() + '.svg';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Copy canvas to clipboard as image
     */
    async function copyToClipboard() {
        if (!canvas) return;

        try {
            const blob = await new Promise(resolve => canvas.toBlob(resolve));
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            alert('Copied to clipboard');
        } catch (err) {
            console.error('Failed to copy:', err);
            alert('Failed to copy to clipboard');
        }
    }

    // Public API
    return {
        init,
        setTool,
        setColor,
        undo,
        redo,
        clear,
        exportPNG,
        exportSVG,
        copyToClipboard
    };
})();
