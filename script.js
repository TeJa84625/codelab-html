// --- Default File Content ---
const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Project</title>
    <!-- This file will be auto-injected by CodeLab -->
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <h1>Hello, CodeLab - HTML!</h1>
    <p>Edit index.html, styles.css, and script.js to build your project.</p>
    <p>Try clicking this: <a href="about.html">Go to About Page</a></p>
    
    <!-- This file will be auto-injected by CodeLab -->
    <script src="script.js"><\/script>
</body>
</html>`;

const DEFAULT_CSS = `body {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: #f0f4f8;
    color: #333;
    padding: 2rem;
}

h1 {
    color: #007bff;
}

/* Example for dark mode */
.dark body {
    background-color: #1a202c;
    color: #e2e8f0;
}
.dark h1 {
    color: #63b3ed;
}`;

// UPDATED: Removed the redundant DOMContentLoaded listener
const DEFAULT_JS = `console.log("Hello from script.js!");

// DOM is guaranteed to be ready since this script is injected at the end.
const h1 = document.querySelector('h1');
if (h1) {
    h1.textContent += " 👋";
}
`;

// --- NEW DEFAULT FILE FOR NAVIGATION ---
const DEFAULT_ABOUT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About Page</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <h1>About This Project</h1>
    <p>This is a test page to show multi-page navigation.</p>
    <p><a href="index.html">Go back home</a></p>
</body>
</html>`;


// --- Application State ---
let appState = {
    files: [
        { id: '1', name: 'index.html', lang: 'html', content: DEFAULT_HTML },
        { id: '2', name: 'styles.css', lang: 'css', content: DEFAULT_CSS },
        { id: '3', name: 'script.js', lang: 'javascript', content: DEFAULT_JS },
        { id: '4', name: 'about.html', lang: 'html', content: DEFAULT_ABOUT_HTML }, // Added for testing navigation
    ],
    activeFileId: '1',
    theme: 'light',
    editorFont: "'JetBrains Mono', monospace",
    onConfirm: null, 
    newTabHandle: null,
    codeMirrorInstance: null,
    runMode: 'local',
    pendingImportFile: null, 
};

// --- DOM Element References ---
// We define this object *outside* of any function so it can be populated
// as soon as the script runs, even if init() is delayed.
const dom = {};

/**
 * Populates the dom object. Called once the DOM is ready.
 */
function populateDomRefs() {
    dom.codeEditor = document.getElementById('code-editor');
    dom.previewFrame = document.getElementById('preview-frame');
    dom.mainContainer = document.getElementById('main-container');
    dom.leftPanel = document.getElementById('left-panel');
    dom.rightPanel = document.getElementById('right-panel');
    dom.resizeGutter = document.getElementById('resize-gutter');
    dom.fileTabsContainer = document.getElementById('file-tabs-container');
    dom.currentFileName = document.getElementById('current-file-name');

    // Buttons
    dom.runCodeBtn = document.getElementById('run-code-btn');
    dom.runNewTabBtn = document.getElementById('run-new-tab-btn');
    dom.addFileBtn = document.getElementById('add-file-btn');
    dom.renameFileBtn = document.getElementById('rename-file-btn');
    dom.deleteFileBtn = document.getElementById('delete-file-btn');
    dom.themeToggleBtn = document.getElementById('theme-toggle-btn'); 
    dom.downloadProjectBtn = document.getElementById('download-project-btn');
    dom.settingsBtn = document.getElementById('settings-btn'); 
    dom.developerBtn = document.getElementById('developer-btn');
    dom.updateNewTabBtn = document.getElementById('update-new-tab-btn');

    // Theme Icons
    dom.themeIconMoon = document.getElementById('theme-icon-moon');
    dom.themeIconSun = document.getElementById('theme-icon-sun');

    // Modals
    dom.modalBackdrop = document.getElementById('modal-backdrop');
    dom.addFileModal = document.getElementById('add-file-modal');
    dom.renameFileModal = document.getElementById('rename-file-modal');
    dom.downloadProjectModal = document.getElementById('download-project-modal');
    dom.confirmModal = document.getElementById('confirm-modal');
    dom.settingsModal = document.getElementById('settings-modal'); 
    dom.developerModal = document.getElementById('developer-modal');
    dom.importRenameModal = document.getElementById('import-rename-modal');
    dom.confirmTitle = document.getElementById('confirm-title');
    dom.confirmMessage = document.getElementById('confirm-message');

    // Modal Inputs
    dom.newFileNameInput = document.getElementById('new-file-name');
    dom.newFileExtension = document.getElementById('new-file-extension'); 
    dom.renameFileNameInput = document.getElementById('rename-file-name');
    dom.renameFileExtension = document.getElementById('rename-file-extension'); 
    dom.projectFolderNameInput = document.getElementById('project-folder-name');
    dom.fontSelect = document.getElementById('font-select');
    
    // Developer Modal Inputs
    dom.bulkFileNamesInput = document.getElementById('bulk-file-names-input');
    dom.importFileBtn = document.getElementById('import-file-btn');
    dom.importFileInput = document.getElementById('import-file-input');

    // Import Rename Modal Inputs
    dom.importConflictMessage = document.getElementById('import-conflict-message');
    dom.importRenameName = document.getElementById('import-rename-name');
    dom.importRenameExtension = document.getElementById('import-rename-extension');

    // Modal Confirm Buttons
    dom.createFileConfirmBtn = document.getElementById('create-file-confirm-btn');
    dom.renameFileConfirmBtn = document.getElementById('rename-file-confirm-btn');
    dom.downloadProjectConfirmBtn = document.getElementById('download-project-confirm-btn');
    dom.confirmConfirmBtn = document.getElementById('confirm-confirm-btn');
    dom.confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    dom.bulkCreateBtn = document.getElementById('bulk-create-btn');
    dom.importRenameConfirmBtn = document.getElementById('import-rename-confirm-btn');

    // UI Feedback
    dom.newTabMessagePanel = document.getElementById('new-tab-message-panel');
}

// --- Core Application Logic ---

/**
 * Initializes the application, sets up listeners, and renders the initial state.
 */
function init() {
    // 1. Populate DOM references
    populateDomRefs();
    
    // 2. Setup CodeMirror Editor
    setupCodeMirror();

    // 3. Setup Theme
    const savedTheme = localStorage.getItem('codelab-theme') || 'light';
    setTheme(savedTheme);

    // 4. Setup Font
    const savedFont = localStorage.getItem('codelab-font') || appState.editorFont;
    setEditorFont(savedFont);

    // 5. Setup Event Listeners
    setupEventListeners();

    // 6. Render initial UI
    renderFileTabs();
    loadFileIntoEditor(appState.activeFileId);
    runCode();
    updateRunModeUI(); // Set initial button highlight
}

/**
 * Initializes the CodeMirror editor instance.
 */
function setupCodeMirror() {
    if (typeof CodeMirror === 'undefined') {
        console.error("CodeMirror is not loaded. Cannot initialize editor.");
        return;
    }
    appState.codeMirrorInstance = CodeMirror.fromTextArea(dom.codeEditor, {
        lineNumbers: true,
        mode: 'htmlmixed',
        theme: 'default',
        lineWrapping: true,
        autoCloseTags: true,
        autoCloseBrackets: true,
        extraKeys: {
            "Cmd-Enter": handleShortcutRun,
            "Cmd-S": handleShortcutRun,
            "Cmd-B": showsettings,
            "Ctrl-Enter": handleShortcutRun,
            "Ctrl-S": handleShortcutRun,
            "Ctrl-B": showsettings,
            "Cmd-/": "toggleComment",
            "Ctrl-/": "toggleComment"
        }
    });

    // Setup listener for saving content
    const debouncedSaveCurrentFile = debounce(saveCurrentFile, 250);
    appState.codeMirrorInstance.on('change', debouncedSaveCurrentFile);
}

function showsettings() {
    showModal(dom.settingsModal);
}

/**
 * Renders the file tabs based on the current appState.
 */
function renderFileTabs() {
    dom.fileTabsContainer.innerHTML = '';
    appState.files.forEach(file => {
        const isActive = file.id === appState.activeFileId;
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = `px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 dark-mode-transition ${isActive
                ? 'bg-white dark:bg-gray-900 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                : 'bg-gray-100 dark:bg-gray-800 border-transparent hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`;
        tab.textContent = file.name;
        tab.dataset.fileId = file.id;
        tab.addEventListener('click', () => switchFile(file.id));
        dom.fileTabsContainer.appendChild(tab);
    });
}

/**
 * Loads the content of a specific file into the code editor.
 * @param {string} fileId - The ID of the file to load.
 */
function loadFileIntoEditor(fileId) {
    addSpaceBetweenScriptTags();

    const file = appState.files.find(f => f.id === fileId);
    if (!file) return;

    appState.activeFileId = fileId;
    
    if (appState.codeMirrorInstance) {
        appState.codeMirrorInstance.setValue(file.content);
        
        let mode = 'xml'; // default
        if (file.lang === 'css') mode = 'css';
        else if (file.lang === 'javascript') mode = 'javascript';
        else if (file.lang === 'html') mode = 'htmlmixed';
        appState.codeMirrorInstance.setOption('mode', mode);
    }
    
    dom.currentFileName.textContent = file.name;

    // Update UI
    renderFileTabs();

    // Disable delete/rename for index.html
    const isLastFile = appState.files.length <= 1;
    const isIndexHtml = file.name.toLowerCase() === 'index.html';
    
    const canDelete = !isLastFile && !isIndexHtml;
    dom.deleteFileBtn.disabled = !canDelete;
    dom.deleteFileBtn.classList.toggle('opacity-50', !canDelete);
    dom.deleteFileBtn.classList.toggle('cursor-not-allowed', !canDelete);

    const canRename = !isIndexHtml;
    dom.renameFileBtn.disabled = !canRename;
    dom.renameFileBtn.classList.toggle('opacity-50', !canRename);
    dom.renameFileBtn.classList.toggle('cursor-not-allowed', !canRename);
}

/**
 * Saves the current editor content back to the appState.
 */
function saveCurrentFile() {
    const file = appState.files.find(f => f.id === appState.activeFileId);
    if (file && appState.codeMirrorInstance) {
        file.content = appState.codeMirrorInstance.getValue();
    }
}

/**
 * Switches the active file being edited.
 * @param {string} newFileId - The ID of the file to switch to.
 */
function switchFile(newFileId) {
    if (newFileId === appState.activeFileId) return;
    saveCurrentFile();
    loadFileIntoEditor(newFileId);
}

/**
 * Compiles all project files into a single HTML string for preview.
 * @returns {string} The compiled HTML string.
 */
function compileProjectHtml(entryHtmlFileName = 'index.html') {
    addSpaceBetweenScriptTags();

    // Find the entry file (e.g., index.html) to use as the "shell"
    let entryFile = appState.files.find(f => f.name.toLowerCase() === entryHtmlFileName.toLowerCase() && f.lang === 'html');
    if (!entryFile) {
        // Fallback to first available HTML file
        entryFile = appState.files.find(f => f.lang === 'html');
    }
    if (!entryFile) {
        return '<h1 style="color: red; font-family: sans-serif;">Error: No HTML file found.</h1>';
    }

    let finalHtml = entryFile.content;
    const allHtmlFiles = appState.files.filter(f => f.lang === 'html');
    const cssFiles = appState.files.filter(f => f.name.endsWith('.css'));
    const jsFiles = appState.files.filter(f => f.name.endsWith('.js'));

    // --- 1. Inject Theme Class ---
    const themeClass = appState.theme; // 'light' or 'dark'
    finalHtml = finalHtml.replace(/<html([^>]*)>/i, (match, existingAttributes) => {
        let newAttributes = existingAttributes || '';
        newAttributes = newAttributes.replace(/class="[^"]*"/i, '');
        return `<html class="${themeClass}" ${newAttributes.trim()}>`;
    });

    // --- 2. Inject CSS ---
    let cssInject = '';
    for (const file of cssFiles) {
        // We replace links OR just inject if no link is found (safer)
        const reg = new RegExp(`<link[^>]*href=["']${escapeRegExp(file.name)}["'][^>]*>`);
        if (finalHtml.match(reg)) {
            finalHtml = finalHtml.replace(reg, `<style data-filename="${file.name}">\n${file.content}\n</style>`);
        } else {
            cssInject += `<style data-filename="${file.name}">\n${file.content}\n</style>\n`;
        }
    }
    // Inject any remaining CSS into the head
    finalHtml = finalHtml.replace(/<\/head>/i, `${cssInject}\n</head>`);


    // --- 3. Inject JS ---
    let jsInject = '';
    for (const file of jsFiles) {
        // We replace scripts OR just inject if no script is found (safer)
        const reg = new RegExp(`<script[^>]*src=["']${escapeRegExp(file.name)}["'][^>]*><\/script>`);
        if (finalHtml.match(reg)) {
            finalHtml = finalHtml.replace(reg, `<script data-filename="${file.name}">\n${file.content}\n<\/script>`);
        } else {
            jsInject += `<script data-filename="${file.name}">\n${file.content}\n</script>\n`;
        }
    }

    // --- 4. NEW: Multi-page Navigation Logic ---
    // Combine all HTML bodies into one, controlled by CSS
    let newBodyContent = '';
    for (const file of allHtmlFiles) {
        const bodyMatch = file.content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        // Fallback to full content if body tag is missing
        const pageBody = bodyMatch ? bodyMatch[1] : `<!-- Invalid HTML: Could not extract body of ${file.name} -->`;
        // Show the entry file, hide others
        const isVisible = file.name.toLowerCase() === entryFile.name.toLowerCase();
        newBodyContent += `<div data-page="${file.name}" class="codelab-page" style="display: ${isVisible ? 'block' : 'none'};">${pageBody}</div>\n`;
    }
    
    // Replace the original body content with our new multi-page structure
    const originalBodyMatch = finalHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (originalBodyMatch) {
        finalHtml = finalHtml.replace(originalBodyMatch[0], `<body>\n${newBodyContent}\n</body>`);
    } else {
        // Failsafe if no <body> tag was in the entry file
        finalHtml += `<body>\n${newBodyContent}\n</body>`;
    }

    // --- 5. Inject Navigation Script & Remaining JS ---
    const navigationScript = `
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            // This function handles showing/hiding the correct page div
            const showCodelabPage = (pageName) => {
                // Normalize pageName (e.g., ./contact.html -> contact.html)
                const targetPage = pageName.split('/').pop();
                
                let found = false;
                document.querySelectorAll('.codelab-page').forEach(page => {
                    if (page.dataset.page.toLowerCase() === targetPage.toLowerCase()) {
                        page.style.display = 'block';
                        found = true;
                    } else {
                        page.style.display = 'none';
                    }
                });
                
                if (!found) {
                    console.warn(\`CodeLab Navigation: Page "\${targetPage}" not found.\`);
                    // As a failsafe, show the first page
                    const firstPage = document.querySelector('.codelab-page');
                    if(firstPage) firstPage.style.display = 'block';
                }
            };

            // Intercept all link clicks
            document.addEventListener('click', e => {
                const link = e.target.closest('a');
                if (!link) return;

                const href = link.getAttribute('href'); // Get the raw href attribute
                if (href) {
                    // Check if it's a local HTML link
                    const isLocalHtml = !href.startsWith('#') && 
                                        !href.startsWith('http') && 
                                        !href.startsWith('mailto:') &&
                                        href.endsWith('.html');
                                        
                    if (isLocalHtml) {
                        e.preventDefault(); // Stop the browser from trying to navigate
                        showCodelabPage(href); // Use our function to show the page
                    }
                }
            });
        });
    <\/script>
    `;
    
    // Inject the navigation script and any non-linked JS files before closing body
    finalHtml = finalHtml.replace(/<\/body>/i, `${jsInject}\n${navigationScript}\n</body>`);

    return finalHtml;
}


/**
 * Compiles the project files and runs the code in the preview iframe.
 * Also handles live-reloading the external tab if it's open.
 */
function runCode(entryHtmlFileName = 'index.html') {
    saveCurrentFile(); 
    // Pass the entry file name to the compiler
    const compiledHtml = compileProjectHtml(entryHtmlFileName);
    
    dom.previewFrame.srcdoc = compiledHtml;

    try {
        if (appState.newTabHandle && !appState.newTabHandle.closed) {
            const blob = new Blob([compiledHtml], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            appState.newTabHandle.location.href = url;
        } else if (appState.newTabHandle && appState.newTabHandle.closed) {
            appState.newTabHandle = null; 
        }
    } catch (e) {
        appState.newTabHandle = null; 
    }
}

function addSpaceBetweenScriptTags() {
    appState.files.forEach(file => {
        if (file.content.includes('></script>')) {
            if (file.lang === 'html') {
                file.content = file.content.replace(/<\/script>/g, ' </script>');
            }
        }
    });
}

/**
 * Click handler for the "Run" button.
 */
function handleRunClick() {
    addSpaceBetweenScriptTags();
    appState.runMode = 'local';
    updateRunModeUI();
    runCode('index.html');
}

/**
 * Opens the compiled code in a new tab.
 * @param {string} finalHtml - The compiled HTML string to open.
 */
function openNewTab(finalHtml) {
    try {
        const blob = new Blob([finalHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        appState.newTabHandle = window.open(url, '_blank');
    } catch (e) {
        console.error("Error opening in new tab:", e);
        appState.newTabHandle = null;
    }
}

/**
 * Click handler for the "Run in New Tab" button.
 */
function handleRunInNewTab() {
    saveCurrentFile(); 

    // Always start from index.html
    const finalHtml = compileProjectHtml('index.html');
    if (finalHtml.startsWith('<h1 style="color: red')) {
        console.error("Cannot open in new tab: No index.html file found.");
        return;
    }

    openNewTab(finalHtml);
    appState.runMode = 'newTab';
    updateRunModeUI();
}

/**
 * NEW: Handles the Ctrl+Enter / Cmd+Enter shortcut.
 */
function handleShortcutRun() {
    if (appState.runMode === 'newTab') {
        // If in new tab mode, just update the tab, don't switch UI
        runCode('index.html');
    } else {
        // If in local mode, run locally
        handleRunClick();
    }
}

/**
 * Updates the UI elements based on the current run mode.
 */
function updateRunModeUI() {
    if (appState.runMode === 'newTab') {
        // NEW: Hide "Run in New Tab" button, show "Run"
        dom.runCodeBtn.classList.remove('hidden');
        dom.runNewTabBtn.classList.add('hidden');
        // Remove highlighting from "Run" button
        dom.runCodeBtn.classList.remove('ring-2', 'ring-offset-2', 'ring-blue-400', 'dark:ring-blue-500');

        // Minimize preview panel and show message
        dom.mainContainer.style.gridTemplateColumns = `1fr auto 200px`; 
        dom.previewFrame.classList.add('hidden');
        dom.newTabMessagePanel.classList.remove('hidden');
    } else { // 'local'
        // NEW: Show both buttons
        dom.runCodeBtn.classList.remove('hidden');
        dom.runNewTabBtn.classList.remove('hidden');

        // Highlight "Run" button, de-highlight "New Tab"
        dom.runCodeBtn.classList.add('ring-2', 'ring-offset-2', 'ring-blue-400', 'dark:ring-blue-500');
        dom.runNewTabBtn.classList.remove('ring-2', 'ring-offset-2', 'ring-gray-400', 'dark:ring-gray-500');
        
        // Restore preview panel and hide message
        dom.mainContainer.style.gridTemplateColumns = '1fr auto 1fr'; 
        dom.previewFrame.classList.remove('hidden');
        dom.newTabMessagePanel.classList.add('hidden');
    }
}


/**
 * Sets the color theme (light/dark).
 * @param {string} theme - 'light' or 'dark'.
 */
function setTheme(theme) {
    appState.theme = theme;
    localStorage.setItem('codelab-theme', theme);
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        dom.themeIconMoon.classList.add('hidden');
        dom.themeIconSun.classList.remove('hidden');
        appState.codeMirrorInstance?.setOption('theme', 'material-darker'); 
    } else {
        document.documentElement.classList.remove('dark');
        dom.themeIconMoon.classList.remove('hidden');
        dom.themeIconSun.classList.add('hidden');
        appState.codeMirrorInstance?.setOption('theme', 'default'); 
    }
}

/**
 * Toggles the current color theme.
 */
function toggleTheme() {
    const newTheme = appState.theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    runCode(); // Re-run the code to update the iframe theme
}

/**
 * Sets the editor font.
 * @param {string} fontFamily - The font-family string (e.g., "'Fira Code', monospace").
 */
function setEditorFont(fontFamily) {
    appState.editorFont = fontFamily;
    localStorage.setItem('codelab-font', fontFamily);
    dom.fontSelect.value = fontFamily;
    
    if (appState.codeMirrorInstance) {
        const cmElement = appState.codeMirrorInstance.getWrapperElement();
        cmElement.style.fontFamily = fontFamily;
        appState.codeMirrorInstance.refresh(); 
    }
}


// --- Modal Handling ---

/**
 * Shows a custom confirmation modal.
 * @param {string} title - The title for the modal.
 * @param {string} message - The confirmation message.
 * @param {function} onConfirmCallback - The function to call if confirmed.
 * @param {boolean} [isInfoModal=false] - If true, shows as an "OK" info modal.
 */
function showConfirmModal(title, message, onConfirmCallback, isInfoModal = false) {
    dom.confirmTitle.textContent = title;
    dom.confirmMessage.textContent = message;

    if (isInfoModal) {
        dom.confirmCancelBtn.classList.add('hidden');
        dom.confirmConfirmBtn.textContent = 'OK';
        dom.confirmConfirmBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
        dom.confirmConfirmBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
        appState.onConfirm = null; // No callback, just close
    } else {
        dom.confirmCancelBtn.classList.remove('hidden');
        dom.confirmConfirmBtn.textContent = 'Confirm';
        dom.confirmConfirmBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        dom.confirmConfirmBtn.classList.add('bg-red-600', 'hover:bg-red-700');
        appState.onConfirm = onConfirmCallback;
    }

    showModal(dom.confirmModal);
}

let activeModal = null;
function showModal(modalElement) {
    activeModal = modalElement;
    dom.modalBackdrop.classList.remove('hidden');
    modalElement.classList.remove('hidden');
}

function hideActiveModal() {
    if (activeModal) {
        activeModal.classList.add('hidden');
        activeModal = null;
    }
    dom.modalBackdrop.classList.add('hidden');
    appState.onConfirm = null; // Clear any pending confirmation
    appState.pendingImportFile = null; // Clear pending import
}

// --- Event Handlers ---

/**
 * OPTIMIZED: Reusable function to create a file in appState.
 * @param {string} name - The full name of the file (e.g., "app.js").
 * @param {string | null} [initialContent=null] - The content for the file.
 * @returns {object} The new file object.
 */
function createFile(name, initialContent = null) {
    let lang = 'html';
    let content = initialContent;

    if (name.endsWith('.css')) lang = 'css';
    else if (name.endsWith('.js')) lang = 'javascript';
    
    if (content === null) {
        if (lang === 'css') content = '/* New CSS File */';
        else if (lang === 'javascript') content = '// New JavaScript File';
        else content = '<!-- New File -->';
    }

    const newFile = {
        id: Date.now().toString() + Math.random().toString(16).slice(2),
        name,
        lang,
        content,
    };

    appState.files.push(newFile);
    return newFile;
}

/**
 * OPTIMIZED: Validates a file name.
 * @param {string} baseName - The name without extension.
 * @param {string} extension - The extension (e.g., ".html").
 * @param {string | null} [fileIdToIgnore=null] - A file ID to ignore during duplicate checks (for renaming).
 * @returns {{isValid: boolean, error: string | null, fullName: string | null}}
 */
function validateFileName(baseName, extension, fileIdToIgnore = null) {
    const trimmedBase = baseName.trim().replace(/\./g, '');
    
    if (!trimmedBase) {
        return { isValid: false, error: 'File name cannot be empty.', fullName: null };
    }

    const fullName = trimmedBase + extension;
    
    const duplicate = appState.files.find(f => 
        f.name.toLowerCase() === fullName.toLowerCase() && 
        f.id !== fileIdToIgnore
    );

    if (duplicate) {
        return { isValid: false, error: `A file named "${fullName}" already exists.`, fullName: null };
    }

    return { isValid: true, error: null, fullName: fullName };
}


function handleAddNewFile() {
    dom.newFileNameInput.value = '';
    dom.newFileExtension.value = '.html';
    showModal(dom.addFileModal);
    dom.newFileNameInput.focus();
}

/**
 * OPTIMIZED: Uses validateFileName helper.
 */
function handleCreateFileConfirm() {
    const validation = validateFileName(dom.newFileNameInput.value, dom.newFileExtension.value);
        
    if (!validation.isValid) {
        showConfirmModal('Invalid Name', validation.error, null, true);
        return;
    }

    const newFile = createFile(validation.fullName);
    hideActiveModal();
    renderFileTabs();
    switchFile(newFile.id);
}

function handleRenameFile() {
    if (dom.renameFileBtn.disabled) return;
    const file = appState.files.find(f => f.id === appState.activeFileId);
    if (!file) return;

    const [baseName, extension] = splitFileName(file.name);
    
    dom.renameFileNameInput.value = baseName;
    dom.renameFileExtension.value = extension;
    showModal(dom.renameFileModal);
    dom.renameFileNameInput.focus();
}

/**
 * OPTIMIZED: Uses validateFileName helper.
 */
function handleRenameFileConfirm() {
    const file = appState.files.find(f => f.id === appState.activeFileId);
    if (!file) return;
    
    const extension = dom.renameFileExtension.value;
    const validation = validateFileName(dom.renameFileNameInput.value, extension, file.id);

    if (!validation.isValid) {
        showConfirmModal('Invalid Name', validation.error, null, true);
        return;
    }

    file.name = validation.fullName;
    
    if (extension === '.css') file.lang = 'css';
    else if (extension === '.js') file.lang = 'javascript';
    else if (extension === '.html') file.lang = 'html';

    hideActiveModal();
    renderFileTabs();
    dom.currentFileName.textContent = validation.fullName;
    loadFileIntoEditor(file.id);
}

function handleDeleteFile() {
    if (dom.deleteFileBtn.disabled) return;
    const fileToDelete = appState.files.find(f => f.id === appState.activeFileId);
    if (!fileToDelete) return;

    if (fileToDelete.name.toLowerCase() === 'index.html') {
        showConfirmModal( 'Action Not Allowed', 'The "index.html" file is essential and cannot be deleted.', null, true);
        return;
    }

    showConfirmModal(
        'Delete File',
        `Are you sure you want to delete "${fileToDelete.name}"? This action cannot be undone.`,
        () => {
            const fileIdToDelete = appState.activeFileId;
            appState.files = appState.files.filter(f => f.id !== fileIdToDelete);
            let newActiveFileId = appState.files.find(f => f.name === 'index.html')?.id;
            if (!newActiveFileId) {
                 newActiveFileId = appState.files[0]?.id || null;
            }
            if (newActiveFileId) {
                loadFileIntoEditor(newActiveFileId);
            } else {
                console.error("All files were deleted.");
            }
            renderFileTabs();
        }
    );
}

function handleDownloadProject() {
    dom.projectFolderNameInput.value = 'my-codelab-project';
    showModal(dom.downloadProjectModal);
}

function handleDownloadProjectConfirm() {
    saveCurrentFile(); 

    const folderName = dom.projectFolderNameInput.value.trim() || 'codelab-project';
    const zip = new JSZip();
    const folder = zip.folder(folderName);

    appState.files.forEach(file => {
        folder.file(file.name, file.content);
    });

    zip.generateAsync({ type: 'blob' })
        .then(blob => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `${folderName}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
            hideActiveModal();
        })
        .catch(err => {
            console.error("Failed to create zip file:", err);
            showConfirmModal('Error', 'Failed to create zip file. See console for details.', null, true);
        });
}

/**
 * Handles bulk file creation from the developer modal.
 */
function handleBulkCreate() {
    const namesString = dom.bulkFileNamesInput.value;
    if (!namesString.trim()) {
        showConfirmModal('No Input', 'Please enter one or more file names.', null, true);
        return;
    }
    
    const names = namesString.split(',').map(name => name.trim()).filter(name => name);
    const validExtensions = ['.html', '.css', '.js'];
    let createdCount = 0;
    
    for (const name of names) {
        const hasValidExtension = validExtensions.some(ext => name.endsWith(ext));
        
        if (!hasValidExtension) {
            console.warn(`Skipping "${name}": Invalid or missing extension.`);
            continue;
        }

        const alreadyExists = appState.files.find(f => f.name.toLowerCase() === name.toLowerCase());
        
        if (!alreadyExists) {
            createFile(name);
            createdCount++;
        }
    }
    
    dom.bulkFileNamesInput.value = ''; // Clear input
    hideActiveModal();
    renderFileTabs();
    showConfirmModal(
        'Bulk Create Complete',
        `${createdCount} new file(s) created. Files that already existed were skipped.`,
        null,
        true
    );
}

/**
 * Handles the file input change event for importing.
 * @param {Event} e - The change event.
 */
function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = file.name;

    // Reset the input so the user can import the same file again
    dom.importFileInput.value = null;

    const alreadyExists = appState.files.find(f => f.name.toLowerCase() === fileName.toLowerCase());

    if (alreadyExists) {
        // Conflict! Show the rename import modal.
        appState.pendingImportFile = file;
        dom.importConflictMessage.textContent = `A file named "${fileName}" already exists. Please provide a new name to import.`;
        
        const [baseName, extension] = splitFileName(fileName);
        dom.importRenameName.value = baseName;
        dom.importRenameExtension.value = extension;
        
        hideActiveModal(); // Hide developer modal
        showModal(dom.importRenameModal);
    } else {
        // No conflict, read and add the file.
        readFileAndAdd(file);
    }
}

/**
 * Reads a file and adds it to the app state.
 * @param {File} file - The file object to read.
 * @param {string | null} [newName=null] - An optional new name for the file.
 */
function readFileAndAdd(file, newName = null) {
    const fileName = newName || file.name;
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const content = e.target.result;
        const newFile = createFile(fileName, content);
        
        hideActiveModal(); // Hide whichever modal was open
        renderFileTabs();
        switchFile(newFile.id); // Switch to the new file
    };
    
    reader.onerror = () => {
        showConfirmModal('Import Error', `Failed to read the file: ${file.name}`, null, true);
    };
    
    reader.readAsText(file);
}

/**
 * OPTIMIZED: Handles the confirmation from the import-rename modal.
 */
function handleImportRenameConfirm() {
    const file = appState.pendingImportFile;
    if (!file) return;

    const validation = validateFileName(dom.importRenameName.value, dom.importRenameExtension.value);

    if (!validation.isValid) {
        showConfirmModal('Invalid Name', validation.error, null, true);
        return; // Keep the modal open
    }
    
    readFileAndAdd(file, validation.fullName);
    // appState.pendingImportFile is cleared in hideActiveModal(), which is called by readFileAndAdd
}


// --- OPTIMIZED: Refactored Resizing Logic ---
let isResizing = false;
const minWidth = 350; // Min panel width
const touchMinWidth = 100; // Smaller min for touch

/**
 * Handles the start of a resize (mouse or touch).
 */
function onResizeStart(e) {
    if (e.type === 'mousedown' && e.button !== 0) return; 
    e.preventDefault();
    isResizing = true;

    // Add listeners for both move and end events
    document.addEventListener('mousemove', onResizeMove);
    document.addEventListener('touchmove', onResizeMove, { passive: false });
    document.addEventListener('mouseup', onResizeEnd);
    document.addEventListener('touchend', onResizeEnd);

    // Style changes
    document.body.style.cursor = 'col-resize';
    dom.leftPanel.style.pointerEvents = 'none';
    dom.rightPanel.style.pointerEvents = 'none';
    if (dom.previewFrame) dom.previewFrame.style.pointerEvents = 'none';
}

/**
 * Handles the move event (mouse or touch).
 */
function onResizeMove(e) {
    if (!isResizing) return;
    if (appState.runMode === 'newTab') return; // Don't resize if panel is minimized

    // Prevent scrolling on touch
    if (e.type === 'touchmove') {
        e.preventDefault();
    }
    
    // Get clientX from mouse or touch event
    let clientX = 0;
    if (e.type === 'touchmove') {
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
        } else {
            return; // No touch data
        }
    } else {
        clientX = e.clientX;
    }

    const mainRect = dom.mainContainer.getBoundingClientRect();
    const gutterWidth = dom.resizeGutter.offsetWidth;
    let newLeftWidth = clientX - mainRect.left - (gutterWidth / 2);
    
    // Use different min width for touch
    const currentMinWidth = (e.type === 'touchmove') ? touchMinWidth : minWidth;
    const maxWidth = mainRect.width - currentMinWidth - gutterWidth;

    newLeftWidth = Math.max(currentMinWidth, Math.min(newLeftWidth, maxWidth));
    dom.mainContainer.style.gridTemplateColumns = `${newLeftWidth}px ${gutterWidth}px 1fr`;
}

/**
 * Handles the end of a resize (mouse or touch).
 */
function onResizeEnd() {
    isResizing = false;

    // Remove all listeners
    document.removeEventListener('mousemove', onResizeMove);
    document.removeEventListener('touchmove', onResizeMove);
    document.removeEventListener('mouseup', onResizeEnd);
    document.removeEventListener('touchend', onResizeEnd);

    // Restore styles
    document.body.style.cursor = '';
    dom.leftPanel.style.pointerEvents = '';
    dom.rightPanel.style.pointerEvents = '';
    if (dom.previewFrame) dom.previewFrame.style.pointerEvents = '';
}

/**
 * Sets up the resizable gutter functionality.
 */
function setupResizing() {
    const gutter = dom.resizeGutter;
    if (!gutter || !dom.mainContainer || !dom.leftPanel || !dom.rightPanel) {
        console.warn("Resize elements not found, skipping.");
        return;
    }

    // Add the start listeners
    gutter.addEventListener('mousedown', onResizeStart);
    gutter.addEventListener('touchstart', onResizeStart, { passive: false });
}

/**
 * Sets up all global event listeners for the application.
 */
function setupEventListeners() {
    // Top Bar
    dom.downloadProjectBtn.addEventListener('click', handleDownloadProject);
    dom.settingsBtn.addEventListener('click', () => showModal(dom.settingsModal)); 
    dom.developerBtn.addEventListener('click', () => showModal(dom.developerModal)); 

    // Settings Modal Listeners
    dom.themeToggleBtn.addEventListener('click', toggleTheme); 
    dom.fontSelect.addEventListener('change', (e) => setEditorFont(e.target.value)); 

    // File Actions
    dom.addFileBtn.addEventListener('click', handleAddNewFile);
    dom.renameFileBtn.addEventListener('click', handleRenameFile);
    dom.deleteFileBtn.addEventListener('click', handleDeleteFile);

    // Preview Actions
    dom.runCodeBtn.addEventListener('click', handleRunClick);
    dom.runNewTabBtn.addEventListener('click', handleRunInNewTab);
    let rotationDegree = 0;

    dom.updateNewTabBtn.addEventListener('click', () => {
        const icon = document.getElementById('update-icon');
    
        rotationDegree += 180;
        icon.style.transform = `rotate(${rotationDegree}deg)`;

        runCode('index.html');
    });



    // Modal Actions
    dom.modalBackdrop.addEventListener('click', (e) => {
        // Use .closest to handle clicks on icons inside buttons
        if (e.target.closest('.modal-cancel-btn')) {
            hideActiveModal();
        }
    });
    dom.createFileConfirmBtn.addEventListener('click', handleCreateFileConfirm);
    dom.renameFileConfirmBtn.addEventListener('click', handleRenameFileConfirm);
    dom.downloadProjectConfirmBtn.addEventListener('click', handleDownloadProjectConfirm);
    
    // Developer/Import Modal Listeners
    dom.bulkCreateBtn.addEventListener('click', handleBulkCreate);
    dom.importFileBtn.addEventListener('click', () => dom.importFileInput.click());
    dom.importFileInput.addEventListener('change', handleFileImport);
    dom.importRenameConfirmBtn.addEventListener('click', handleImportRenameConfirm);

    // Handle the custom confirm modal
    dom.confirmConfirmBtn.addEventListener('click', () => {
        if (typeof appState.onConfirm === 'function') {
            appState.onConfirm();
        }
        hideActiveModal();
    });

    // Add real-time dot stripping from file name inputs
    const stripDots = (e) => { e.target.value = e.target.value.replace(/\./g, ''); };
    dom.newFileNameInput.addEventListener('input', stripDots);
    dom.renameFileNameInput.addEventListener('input', stripDots);
    dom.importRenameName.addEventListener('input', stripDots); 

    // Trap focus in modal
    dom.modalBackdrop.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' && activeModal) {
            const focusable = activeModal.querySelectorAll('button, input, select');
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                last.focus();
                e.preventDefault();
            } else if (!e.shiftKey && document.activeElement === last) {
                first.focus();
                e.preventDefault();
            }
        }
        if (e.key === 'Escape') {
            hideActiveModal();
        }
    });

    setupResizing();
}

// --- Utility Functions ---

/**
 * Escapes a string for use in a regular expression.
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds.
 * @param {function} func The function to debounce.
 * @param {number} wait The number of milliseconds to delay.
 *@returns {function} Returns the new debounced function.
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

/**
 * Splits a file name into its base and extension.
 * @param {string} fileName - The full file name.
 * @returns {[string, string]} An array [baseName, extension].
 */
function splitFileName(fileName) {
    let baseName = fileName;
    let extension = '.html'; // default

    if (fileName.endsWith('.css')) {
        baseName = fileName.substring(0, fileName.length - 4);
        extension = '.css';
    } else if (fileName.endsWith('.js')) {
        baseName = fileName.substring(0, fileName.length - 3);
        extension = '.js';
    } else if (fileName.endsWith('.html')) {
        baseName = fileName.substring(0, fileName.length - 5);
        extension = '.html';
    }
    return [baseName, extension];
}

// --- Start the App ---

/**
 * UPDATED: Robust app starter.
 * This function is now called from codelab.html AFTER CodeMirror is loaded.
 */
function startApp() {
    if (typeof CodeMirror !== 'undefined') {
        // CodeMirror is loaded, we can init the app
        console.log("CodeMirror loaded, initializing app.");
        init();
    } else {
        // This should no longer happen, but as a fallback, we'll log an error.
        console.error("startApp was called but CodeMirror is still not defined. This indicates a script loading error in codelab.html.");
    }
}