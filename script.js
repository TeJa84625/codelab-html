// --- Default File Content ---
const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <title>Codelab - HTML Template</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <h1>Hello, CodeLab - HTML!</h1>
    <p>Edit index.html, styles.css, and script.js to build your project.</p>
    <p>Try clicking this: <a href="about.html">Go to About Page</a></p>
    
    <div id="output">Loading JSON...</div>

    <div class="button-container">
        <button id="open-editor-btn" onclick="openEditor()">Open Empty Code Editor</button>
    </div>

    <script src="script.js"> </script>
</body>
</html>
`;

const DEFAULT_CSS = `body {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    color: #333;
    padding: 2rem;
}

h1 {
    color: #007bff;
}

/* Example for dark mode */
.dark body {
    background-color: #000000ff;
    color: #e2e8f0;
}

/* Styling for the JSON output example */
#output {
    background-color: #f4f4f4;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1rem;
    margin-top: 1rem;
}

.dark #output {
    background-color: #1a202c;
    border-color: #4a5568;
}

#open-editor-btn {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
    border-radius: 5px;
    transition: background-color 0.3s ease;
}

#open-editor-btn:hover {
    background-color: #0056b3; 
}

.button-container {
    display: flex;
    justify-content: center;
    margin-top: 20px;
}`;

const DEFAULT_JS = `console.log("Hello from script.js!");

const h1 = document.querySelector('h1');
if (h1) {
    h1.textContent += " ♾️";
}

fetch('data.json')
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(data => {
        const output = \`
            <h2>\${data.title}</h2>
            <p>\${data.description}</p>
            <ul>
                <li><strong>Name:</strong> \${data.user.name}</li>
                <li><strong>Age:</strong> \${data.user.age}</li>
                <li><strong>Email:</strong> \${data.user.email}</li>
            </ul>
        \`;
        document.getElementById('output').innerHTML = output;
    })
    .catch(error => {
        document.getElementById('output').innerText = 'Error loading JSON: ' + error;
    });

    function openEditor() {
            window.open('https://codelab-html.vercel.app?c=<!-- html -->', '_blank');
            window.close();
        }
`;

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
    files: [],
    activeFileId: null,
    theme: 'light',
    editorFont: "'JetBrains Mono', monospace",
    onConfirm: null, 
    newTabHandle: null,
    codeMirrorInstance: null,
    runMode: 'local',
    pendingImportFile: null, 
    leftPanelWidth: '1fr',
    modalStack: [],
    _previewBlobUrl: null,
};

// --- DOM Element References ---
const dom = {};
let globalResponseData = null; // For debugging
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxjLTjYLoigWASxzaqx1m0dBuWtazZ3syojUGNGuWiMH0OOZicPa31f7MUWk5WXCNb9/exec';

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
    dom.copyFileBtn = document.getElementById('copy-file-btn'); 
    dom.renameFileBtn = document.getElementById('rename-file-btn');
    dom.deleteFileBtn = document.getElementById('delete-file-btn');
    dom.themeToggleBtn = document.getElementById('theme-toggle-btn'); 
    dom.downloadProjectBtn = document.getElementById('download-project-btn');
    dom.settingsBtn = document.getElementById('settings-btn'); 
    dom.developerBtn = document.getElementById('developer-btn');
    dom.updateNewTabBtn = document.getElementById('update-new-tab-btn');
    dom.shareBtn = document.getElementById('share-btn'); 

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

/**
 * NEW: Adds a space to empty <script></script> tags to prevent browser issues.
 * @param {string} htmlContent The HTML content to process.
 * @returns {string} The processed HTML.
 */
function addSpaceBetweenScriptTags(htmlContent) {
    // Find <script></script> and replace with <script> <\/script>
    // This is more specific than the old logic.
    return htmlContent.replace(/><\/script>/g, '> <\/script>');
}

// --- Core Application Logic ---

/**
 * Sets up the default files for a new project.
 */
function setupDefaultFiles() {
    appState.files = []; // Clear any existing
    const index = createFile('index.html', DEFAULT_HTML);
    createFile('styles.css', DEFAULT_CSS);
    createFile('script.js', DEFAULT_JS);
    createFile('about.html', DEFAULT_ABOUT_HTML);
    // Create a default JSON file for the fetch example
    createFile('data.json', JSON.stringify({
        title: "Fetched Data",
        description: "This content was loaded from data.json!",
        user: {
            name: "Alex",
            age: 30,
            email: "alex@example.com"
        }
    }, null, 2));
    appState.activeFileId = index.id; // Set index.html as active
}

/**
 * *** NEW: Consoldiated fetch function ***
 * Fetches project data from the Google Script.
 * @param {string} id The 6-digit project ID.
 * @returns {Promise<string>} The project data string.
 */
async function fetchProjectData(id) {
    if (!id) {
        throw new Error("No project ID provided.");
    }
    // Uses the global GOOGLE_SCRIPT_URL defined at the top
    const url = GOOGLE_SCRIPT_URL + '?ID=' + encodeURIComponent(id);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Network response was not ok (status: ${response.status})`);
        }
        const data = await response.json();
        
        globalResponseData = data; // For debugging
        // console.log('Fetched Data:', data);

        if (data && data.Data) {
            return data.Data; // Resolve with the project string
        } else if (data && (data.status === "error" || !data.Data)) {
            // Handle cases where ID is not found or data is empty
            throw new Error(data.message || 'Project ID not found or data is empty.');
        } else {
            throw new Error('Invalid data format received from server.');
        }
    } catch (error) {
        // console.error('Error fetching data:', error);
        // Re-throw so the caller can handle it
        throw new Error(`Error fetching data from the server: ${error.message}`);
    }
}


/**
 * *** UPDATED: Now handles ?id=, ?data=, and ?c= ***
 * Checks URL for project data and loads it.
 * This is now robust against race conditions.
 */
async function handleUrlParameters() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const projectID = urlParams.get('id');
        // const projectDataString = urlParams.get('data');
        const legacyCodeString = urlParams.get('code') || urlParams.get('c');
        const empty = urlParams.has('empty') || urlParams.has('e');

        let projectLoaded = false; // Flag to skip default setup

        if (projectID) {
            // --- 1. Load from ?id=... ---
            showConfirmModal('Loading Project...', `Loading project ID: ${projectID}. Please wait.`, null, true);
            try {
                // Wait for the project data to be fetched
                const projectString = await fetchProjectData(projectID); 
                hideActiveModal();
                
                // Now load the project from the string
                const success = loadProjectFromString(projectString); 
                if (success) {
                    projectLoaded = true; // Mark as loaded
                } else {
                    throw new Error("Failed to parse project data from ID.");
                }
            } catch (e) {
                // Handle fetch or parse errors
                hideActiveModal();
                console.error("Failed to load from ID:", e);
                showConfirmModal('Error Loading Project', `Could not load project with ID: ${projectID}. ${e.message}. Loading default project.`, null, true);
                // Let it fall through to load defaults
            }

        // } else if (projectDataString) {
        //     // --- 2. Fallback: Load from ?data=... (Base64) ---
        //     const jsonString = atob(projectDataString);
        //     const projectData = JSON.parse(jsonString);
            
        //     appState.files = []; // Clear defaults
        //     let firstFileId = null;
            
        //     for (const fileName in projectData) {
        //         const newFile = createFile(fileName, projectData[fileName]);
        //         if (!firstFileId) firstFileId = newFile.id;
        //     }

        //     if (firstFileId) {
        //         appState.activeFileId = firstFileId;
        //         projectLoaded = true;
        //     }

        } else if (legacyCodeString) {
            // --- 3. Fallback: Load from ?c=... (Legacy HTML) ---
            const formattedCode = legacyCodeString.replace(/>/g, '>\n');
            appState.files = []; // Clear defaults
            const newIndex = createFile('index.html', formattedCode);
            createFile('styles.css', '/* CSS */ \n');
            createFile('script.js', '// JavaScript \n');
            createFile('data.json', '// Json \n');
            appState.activeFileId = newIndex.id;
            projectLoaded = true;
        }   else if (empty) {
            // --- 3. Fallback: Load from ?c=... (Legacy HTML) ---
            appState.files = []; // Clear defaults
            const newIndex = createFile('index.html', '<!-- Html --> \n');
            createFile('styles.css', '/* CSS */ \n');
            createFile('script.js', '// JavaScript \n');
            createFile('data.json', '// Json \n');
            appState.activeFileId = newIndex.id;
            projectLoaded = true;
        }

        

        // --- 4. No URL params or load failed: Load default project ---
        if (!projectLoaded) {
            setupDefaultFiles();
        }

        // Clean the URL bar after loading
        if (projectID || legacyCodeString) { //projectDataString
            window.history.replaceState({}, document.title, window.location.pathname);
        }

    } catch (e) {
        console.error("Failed to parse project data from URL:", e);
        showConfirmModal('Error Loading Project', `An error occurred while loading the project: ${e.message}. Loading default project.`, null, true);
        if (appState.files.length === 0) {
            setupDefaultFiles();
        }
    }
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
    const file = appState.files.find(f => f.id === fileId);
    if (!file) return;

    appState.activeFileId = fileId;
    
    if (appState.codeMirrorInstance) {
        appState.codeMirrorInstance.setValue(file.content);
        
        let mode = 'xml'; // default
        if (file.lang === 'css') mode = 'css';
        else if (file.lang === 'javascript') mode = 'javascript';
        else if (file.lang === 'html') mode = 'htmlmixed';
        else if (file.lang === 'json') mode = { name: "javascript", json: true }; 
        
        appState.codeMirrorInstance.setOption('mode', mode);
    }
    
    dom.currentFileName.textContent = file.name;
    renderFileTabs();

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
    
    dom.copyFileBtn.disabled = false;
    dom.copyFileBtn.classList.remove('opacity-50', 'cursor-not-allowed');
}

/**
 * Saves the current editor content back to the appState.
 */
function saveCurrentFile() {
    const file = appState.files.find(f => f.id === appState.activeFileId);
    if (file && appState.codeMirrorInstance) {
        let content = appState.codeMirrorInstance.getValue();
        if (file.lang === 'html') {
            content = addSpaceBetweenScriptTags(content);
        }
        file.content = content;
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
    let entryFile = appState.files.find(f => f.name.toLowerCase() === entryHtmlFileName.toLowerCase() && f.lang === 'html');
    if (!entryFile) {
        entryFile = appState.files.find(f => f.lang === 'html');
    }
    if (!entryFile) {
        return '<h1 style="color: red; font-family: sans-serif;">Error: No HTML file found.</h1>';
    }

    let finalHtml = entryFile.content;
    const allHtmlFiles = appState.files.filter(f => f.lang === 'html');
    const cssFiles = appState.files.filter(f => f.name.endsWith('.css'));
    const jsFiles = appState.files.filter(f => f.name.endsWith('.js'));
    const jsonFiles = appState.files.filter(f => f.lang === 'json'); 

    // --- 1. Inject Theme Class ---
    const themeClass = appState.theme; 
    finalHtml = finalHtml.replace(/<html([^>]*)>/i, (match, existingAttributes) => {
        let newAttributes = existingAttributes || '';
        newAttributes = newAttributes.replace(/class="[^"]*"/i, '');
        return `<html class="${themeClass}" ${newAttributes.trim()}>`;
    });

    // --- 2. Inject CSS ---
    let cssInject = '';
    for (const file of cssFiles) {
        const reg = new RegExp(`<link[^>]*href=["']${escapeRegExp(file.name)}["'][^>]*>`);
        if (finalHtml.match(reg)) {
            finalHtml = finalHtml.replace(reg, `<style data-filename="${file.name}">\n${file.content}\n</style>`);
        } else {
            cssInject += `<style data-filename="${file.name}">\n${file.content}\n</style>\n`;
        }
    }

    // --- 3. [NEW] Create JSON store and fetch interceptor ---
    let fetchInterceptorScript = '';
    if (jsonFiles.length > 0) {
        const jsonStore = {};
        for (const file of jsonFiles) {
            // Store the raw text content
            jsonStore[file.name] = file.content;
        }

        // Create a script to intercept fetch() calls
        fetchInterceptorScript = `
<script data-filename="fetch-interceptor">
    (function() {
        const jsonFileStore = ${JSON.stringify(jsonStore)};
        const originalFetch = window.fetch;

        window.fetch = function(resource, options) {
            let requestURL = resource;
            if (resource instanceof Request) {
                requestURL = resource.url;
            }

            // Clean up the URL to just the filename (basic implementation)
            const urlParts = requestURL.split('/');
            const fileName = urlParts[urlParts.length - 1];

            if (jsonFileStore.hasOwnProperty(fileName)) {
                // console.log('CodeLab: Intercepting fetch for "' + fileName + '"');
                
                // Return a Promise that resolves with a fake Response
                return new Promise((resolve, reject) => {
                    try {
                        // Validate JSON syntax before creating response
                        JSON.parse(jsonFileStore[fileName]);
                        
                        const responseBody = new Blob([jsonFileStore[fileName]], { type: 'application/json' });
                        const response = new Response(responseBody, {
                            status: 200,
                            statusText: 'OK',
                            headers: { 'Content-Type': 'application/json' }
                        });
                        
                        resolve(response);

                    } catch (e) {
                        // console.error('CodeLab: Invalid JSON in ' + fileName + ':', e);
                        reject(new TypeError('Failed to parse JSON: ' + e.message));
                    }
                });
            }

            // Not a local JSON file, use the real fetch
            return originalFetch.apply(this, arguments);
        };
    })();
<\/script>
`;
    }
    
    // Inject CSS and Fetch Interceptor into the head
    finalHtml = finalHtml.replace(/<\/head>/i, `${cssInject}\n${fetchInterceptorScript}\n</head>`);


    // --- 4. Inject JS ---
    let jsInject = '';
    for (const file of jsFiles) {
        const reg = new RegExp(`<script[^>]*src=["']${escapeRegExp(file.name)}["'][^>]*><\/script>`);
        if (finalHtml.match(reg)) {
            finalHtml = finalHtml.replace(reg, `<script data-filename="${file.name}">\n${file.content}\n<\/script>`);
        } else {
            jsInject += `<script data-filename="${file.name}">\n${file.content}\n</script>\n`;
        }
    }

    // --- 5. Multi-page Navigation Logic ---
    let newBodyContent = '';
    for (const file of allHtmlFiles) {
        const bodyMatch = file.content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        const pageBody = bodyMatch ? bodyMatch[1] : ``;
        newBodyContent += `<div data-page="${file.name}" class="codelab-page" style="display: none;">${pageBody}</div>\n`;
    }
    
    const originalBodyMatch = finalHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (originalBodyMatch) {
        finalHtml = finalHtml.replace(originalBodyMatch[0], `<body>\n${newBodyContent}\n</body>`);
    } else {
        finalHtml += `<body>\n${newBodyContent}\n</body>`;
    }

    // --- 6. Inject Navigation Script & Remaining JS ---
    const navigationScript = `
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const showCodelabPage = (pageName) => {
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
                
                if (found) {
                    sessionStorage.setItem('codelabActivePage', targetPage);
                } else {
                    console.warn(\`CodeLab Navigation: Page "\${targetPage}" not found.\`);
                    const firstPage = document.querySelector('.codelab-page');
                    if(firstPage) {
                        firstPage.style.display = 'block';
                        sessionStorage.setItem('codelabActivePage', firstPage.dataset.page);
                    }
                }
            };

            const savedPage = sessionStorage.getItem('codelabActivePage');
            const initialPage = savedPage || '${entryFile.name.toLowerCase()}' || 'index.html';
            showCodelabPage(initialPage);

            document.addEventListener('click', e => {
                const link = e.target.closest('a');
                if (!link) return;

                const href = link.getAttribute('href');
                if (href) {
                    const isLocalHtml = !href.startsWith('#') && 
                                        !href.startsWith('http') && 
                                        !href.startsWith('mailto:') &&
                                        href.endsWith('.html');
                                        
                    if (isLocalHtml) {
                        e.preventDefault(); 
                        showCodelabPage(href);
                    }
                }
            });
        });
    <\/script>
    `;
    
    finalHtml = finalHtml.replace(/<\/body>/i, `${jsInject}\n${navigationScript}\n</body>`);

    return finalHtml;
}


/**
 * Compiles the project files and runs the code in the preview iframe.
 */
function runCode(entryHtmlFileName = 'index.html') {
    saveCurrentFile(); 
    const compiledHtml = compileProjectHtml(entryHtmlFileName);

    if (appState._previewBlobUrl) {
        URL.revokeObjectURL(appState._previewBlobUrl);
    }
    const blob = new Blob([compiledHtml], { type: 'text/html; charset=utf-8' });
    appState._previewBlobUrl = URL.createObjectURL(blob);
    
    dom.previewFrame.src = appState._previewBlobUrl;

    try {
        if (appState.newTabHandle && !appState.newTabHandle.closed) {
            appState.newTabHandle.location.href = appState._previewBlobUrl;
        } else if (appState.newTabHandle && appState.newTabHandle.closed) {
            appState.newTabHandle = null; 
        }
    } catch (e) {
        appState.newTabHandle = null; 
    }
}

/**
 * Click handler for the "Run" button.
 */
function handleRunClick() {
    appState.runMode = 'local';
    updateRunModeUI();
    runCode('index.html');
}

/**
 * Opens the compiled code in a new tab.
 */
function openNewTab(finalHtml) {
    try {
        // **FIX:** Add charset=utf-8 here for emoji
        const blob = new Blob([finalHtml], { type: 'text/html; charset=utf-8' });
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

    const finalHtml = compileProjectHtml(); 
    if (finalHtml.startsWith('<h1 style="color: red')) {
        console.error("Cannot open in new tab: No index.html file found.");
        return;
    }

    openNewTab(finalHtml);
    appState.runMode = 'newTab';
    updateRunModeUI();
}

/**
 * Handles the Ctrl+Enter / Cmd+Enter shortcut.
 */
function handleShortcutRun() {
    runCode();
}

/**
 * Updates the UI elements based on the current run mode.
 */
function updateRunModeUI() {
    if (appState.runMode === 'newTab') {
        dom.runCodeBtn.classList.remove('hidden');
        dom.runNewTabBtn.classList.add('hidden');
        dom.runCodeBtn.classList.remove('ring-2', 'ring-offset-2', 'ring-blue-400', 'dark:ring-blue-500');

        dom.mainContainer.style.gridTemplateColumns = `1fr auto 200px`; 
        dom.previewFrame.classList.add('hidden');
        dom.newTabMessagePanel.classList.remove('hidden');
    } else { // 'local'
        dom.runCodeBtn.classList.remove('hidden');
        dom.runNewTabBtn.classList.remove('hidden');

        dom.runCodeBtn.classList.add('ring-2', 'ring-offset-2', 'ring-blue-400', 'dark:ring-blue-500');
        dom.runNewTabBtn.classList.remove('ring-2', 'ring-offset-2', 'ring-gray-400', 'dark:ring-gray-500');
        
        dom.mainContainer.style.gridTemplateColumns = `${appState.leftPanelWidth} auto 1fr`; 
        dom.previewFrame.classList.remove('hidden');
        dom.newTabMessagePanel.classList.add('hidden');
    }
}


/**
 * Sets the color theme (light/dark).
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
    runCode(); 
}

/**
 * Sets the editor font.
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
 */
function showConfirmModal(title, message, onConfirmCallback, isInfoModal = false) {
    dom.confirmTitle.textContent = title;
    dom.confirmMessage.textContent = message;

    const loadingBar = document.getElementById("confirm-loading-bar");
    const confirmButton = document.getElementById("confirm-confirm-btn");

    if (title === "Loading Project..." || title === "Share Code Files") {
        loadingBar.classList.remove('hidden');
        confirmButton.classList.add('hidden');
    } else {
        loadingBar.classList.add('hidden');
        confirmButton.classList.remove('hidden');
    }

    if (isInfoModal) {
        dom.confirmCancelBtn.classList.add('hidden');
        dom.confirmConfirmBtn.textContent = 'OK';
        dom.confirmConfirmBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
        dom.confirmConfirmBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
        appState.onConfirm = null; 
    } else {
        dom.confirmCancelBtn.classList.remove('hidden');
        dom.confirmConfirmBtn.textContent = 'Confirm';
        dom.confirmConfirmBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        dom.confirmConfirmBtn.classList.add('bg-red-600', 'hover:bg-red-700');
        appState.onConfirm = onConfirmCallback;
    }

    showModal(dom.confirmModal);
}

/**
 * Manages a stack of modals
 */
function showModal(modalElement) {
    appState.modalStack.push(modalElement);
    dom.modalBackdrop.classList.remove('hidden');
    modalElement.classList.remove('hidden');
}

/**
 * Hides the top-most modal from the stack
 */
function hideActiveModal() {
    const modalToHide = appState.modalStack.pop();
    
    if (modalToHide) {
        modalToHide.classList.add('hidden');
    }
    
    if (appState.modalStack.length === 0) {
        dom.modalBackdrop.classList.add('hidden');
    }
    
    appState.onConfirm = null; 
    appState.pendingImportFile = null; 
}

// --- Event Handlers ---

/**
 * Reusable function to create a file in appState.
 */
function createFile(name, initialContent = null) {
    let lang = 'html';
    let content = initialContent;

    if (name.endsWith('.css')) lang = 'css';
    else if (name.endsWith('.js')) lang = 'javascript';
    else if (name.endsWith('.json')) lang = 'json'; 
    
    if (content === null) {
        if (lang === 'css') content = '/* New CSS File */';
        else if (lang === 'javascript') content = '// New JavaScript File';
        else if (lang === 'json') content = '{\n    "key": "value"\n}'; 
        else content = '';
    }

    const newFile = {
        id: crypto.randomUUID(), 
        name,
        lang,
        content,
    };

    appState.files.push(newFile);
    return newFile;
}

/**
 * Validates a file name.
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

/**
 * Handles the "Copy File" button click
 */
function handleCopyFile() {
    if (dom.copyFileBtn.disabled) return;
    const fileToCopy = appState.files.find(f => f.id === appState.activeFileId);
    if (!fileToCopy) return;

    navigator.clipboard.writeText(fileToCopy.content)
        .then(() => {
            showConfirmModal('Copied!', `Content of "${fileToCopy.name}" copied to clipboard.`, null, true);
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
            showConfirmModal('Error', 'Could not copy content to clipboard. See console for details.', null, true);
        });
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
    else if (extension === '.json') file.lang = 'json'; 

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
                console.error("All files were deleted. This should not happen.");
                setupDefaultFiles(); 
                loadFileIntoEditor(appState.activeFileId);
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

// --- Google Script API Helpers ---

/**
 * Parses a project string in the ✴️start...✴️end format,
 * clears the current project, and loads the new one.
 * @param {string} projectString The string data to import.
 * @returns {boolean} True if parsing was successful, false otherwise.
 */
function loadProjectFromString(projectString) {
    if (!projectString || typeof projectString !== 'string') {
        return false;
    }
    
    const fileRegex = /✴️start:(.*?):([\s\S]*?)✴️end/g;
    let match;
    let loadedFiles = [];

    // First, parse all files from the string
    while ((match = fileRegex.exec(projectString)) !== null) {
        const fileName = match[1];
        const content = match[2];
        if (fileName) {
            loadedFiles.push({ name: fileName, content: content });
        }
    }

    // If no valid files were found, abort
    if (loadedFiles.length === 0) {
        return false;
    }

    // --- SUCESS: Clear old state and load new files ---
    appState.files = [];
    let firstFileId = null;

    for (const file of loadedFiles) {
        // Use addSpaceBetweenScriptTags for HTML files on import
        let fileContent = file.content;
        if (file.name.endsWith('.html')) {
            fileContent = addSpaceBetweenScriptTags(file.content);
        }

        const newFile = createFile(file.name, fileContent);
        if (!firstFileId) {
            firstFileId = newFile.id;
        }
    }
    
    // Try to set index.html as active first
    let activeFile = appState.files.find(f => f.name.toLowerCase() === 'index.html');
    if (activeFile) {
        appState.activeFileId = activeFile.id;
    } else if (firstFileId) {
        // Otherwise, set the first file as active
        appState.activeFileId = firstFileId;
    } else {
        // Failsafe
        setupDefaultFiles();
    }
    return true; // Indicate success
}


/**
 * Generates a random 6-digit string.
 * @returns {string}
 */
function generateRandom6DigitID() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * *** UPDATED: Re-uses fetchProjectData to find an available ID ***
 * Loops until it finds a 6-digit ID that is not in the database.
 * @returns {Promise<string>} A unique 6-digit ID.
 */
async function findValid6DigitID() {
    let attempts = 0;
    while (attempts < 10) { // Safety break to prevent infinite loops
        const id = generateRandom6DigitID();
        try {
            await fetchProjectData(id);
            // If this succeeds, the ID *exists*, so try again.
            // console.log(`ID ${id} already exists. Trying another.`);
        } catch (e) {
            // If this fails (e.g., "Project ID not found"),
            // then the ID is *available*!
            // console.log(`Found available ID: ${id}`);
            return id;
        }
        attempts++;
    }
    throw new Error("Could not find a valid unique ID after 10 attempts.");
}

// --- REPLACE your old handleShareProject function with this one ---

/**
 * *** UPDATED: Submits project to Google Form in the background ***
 * Handles the "Share Project" button click
 */
async function handleShareProject() {
    saveCurrentFile(); // Save latest changes
    // showConfirmModal('Sharing...', 'Generating unique project ID... Please wait.', null, true);
    showConfirmModal(
    'Share Code Files', 
    'Your code files are being shared publicly. Anyone with the link can access these files. Please wait while we generate a project link...', 
    null, true );


    try {
        // 1. Get a unique 6-digit ID (This part is unchanged)
        const validID = await findValid6DigitID();
        
        // 2. Format all code files into the ✴️...✴️ string (Unchanged)
        let projectString = '';
        appState.files.forEach(file => {
            projectString += `✴️start:${file.name}:${file.content}✴️end\n`;
        });
        const trimmedProjectString = projectString.trim();

        // 3. Construct the Google Form *submission* URL
        const Database = 'https://docs.google.com/forms/d/e/1FAIpQLScdr7Q8hrFtQJDyQaO8yJFpmPY2VzEms3tJqBkJ2rTzZmFkzw/formResponse'; //
        
        // 4. Create the form data
        const formData = new URLSearchParams();
        formData.append('entry.1033909975', validID);
        formData.append('entry.1524177429', trimmedProjectString);

        // 5. Submit the form in the background
        // We use 'no-cors' mode, which means we FIRE and FORGET.
        // We CANNOT check the response or know if it was successful.
        await fetch(Database, {
            method: 'POST',
            mode: 'no-cors', // This is required to submit to a cross-origin form
            body: formData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        // 6. Hide the "Sharing..." modal
        hideActiveModal();
        
        // 7. Show the generated code and the URL.
        // We are *assuming* the submission worked.
        const projectUrl = `${window.location.origin}${window.location.pathname}?id=${validID}`;
        navigator.clipboard.writeText(projectUrl); // Copy the link
        
        showConfirmModal(
            'Project Sent!', // Changed message
            `Your project link has been copied:\n${projectUrl}`, // Updated message
            null, 
            true
        );

    } catch (e) {
        // This catch will only trigger if findValid6DigitID() fails
        // or if the network request itself fails (e.g., no internet).
        // It will NOT catch a "404 Not Found" from the Google Form.
        console.error('Failed to create or send share link:', e);
        hideActiveModal();
        showConfirmModal('Error', `Could not share project: ${e.message}`, null, true);
    }
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
    const validExtensions = ['.html', '.css', '.js', '.json'];
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
    
    dom.bulkFileNamesInput.value = ''; 
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
 */
function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = file.name;
    dom.importFileInput.value = null;
    const alreadyExists = appState.files.find(f => f.name.toLowerCase() === fileName.toLowerCase());

    if (alreadyExists) {
        appState.pendingImportFile = file;
        dom.importConflictMessage.textContent = `A file named "${fileName}" already exists. Please provide a new name to import.`;
        
        const [baseName, extension] = splitFileName(fileName);
        dom.importRenameName.value = baseName;
        dom.importRenameExtension.value = extension;
        
        hideActiveModal(); 
        showModal(dom.importRenameModal);
    } else {
        readFileAndAdd(file);
    }
}

/**
 * Reads a file and adds it to the app state.
 */
function readFileAndAdd(file, newName = null) {
    const fileName = newName || file.name;
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const content = e.target.result;
        const newFile = createFile(fileName, content);
        
        hideActiveModal(); 
        renderFileTabs();
        switchFile(newFile.id); 
    };
    
    reader.onerror = () => {
        showConfirmModal('Import Error', `Failed to read the file: ${file.name}`, null, true);
    };
    
    reader.readAsText(file);
}

/**
 * Handles the confirmation from the import-rename modal.
 */
function handleImportRenameConfirm() {
    const file = appState.pendingImportFile;
    if (!file) return;

    const validation = validateFileName(dom.importRenameName.value, dom.importRenameExtension.value);

    if (!validation.isValid) {
        showConfirmModal('Invalid Name', validation.error, null, true);
        return; 
    }
    
    readFileAndAdd(file, validation.fullName);
}


// --- Resizing Logic ---
let isResizing = false;
const minWidth = 350; 
const touchMinWidth = 100; 

function onResizeStart(e) {
    if (e.type === 'mousedown' && e.button !== 0) return; 
    e.preventDefault();
    isResizing = true;

    document.addEventListener('mousemove', onResizeMove);
    document.addEventListener('touchmove', onResizeMove, { passive: false });
    document.addEventListener('mouseup', onResizeEnd);
    document.addEventListener('touchend', onResizeEnd);

    document.body.style.cursor = 'col-resize';
    dom.leftPanel.style.pointerEvents = 'none';
    dom.rightPanel.style.pointerEvents = 'none';
    if (dom.previewFrame) dom.previewFrame.style.pointerEvents = 'none';
}

function onResizeMove(e) {
    if (!isResizing) return;
    if (appState.runMode === 'newTab') return; 

    if (e.type === 'touchmove') {
        e.preventDefault();
    }
    
    let clientX = 0;
    if (e.type === 'touchmove') {
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
        } else {
            return; 
        }
    } else {
        clientX = e.clientX;
    }

    const mainRect = dom.mainContainer.getBoundingClientRect();
    const gutterWidth = dom.resizeGutter.offsetWidth;
    let newLeftWidth = clientX - mainRect.left - (gutterWidth / 2);
    
    const currentMinWidth = (e.type === 'touchmove') ? touchMinWidth : minWidth;
    const maxWidth = mainRect.width - currentMinWidth - gutterWidth;

    newLeftWidth = Math.max(currentMinWidth, Math.min(newLeftWidth, maxWidth));
    dom.mainContainer.style.gridTemplateColumns = `${newLeftWidth}px ${gutterWidth}px 1fr`;
}

function onResizeEnd() {
    isResizing = false;

    document.removeEventListener('mousemove', onResizeMove);
    document.removeEventListener('touchmove', onResizeMove);
    document.removeEventListener('mouseup', onResizeEnd);
    document.removeEventListener('touchend', onResizeEnd);

    document.body.style.cursor = '';
    dom.leftPanel.style.pointerEvents = '';
    dom.rightPanel.style.pointerEvents = '';
    if (dom.previewFrame) dom.previewFrame.style.pointerEvents = '';

    if (appState.runMode === 'local') {
        const currentGrid = dom.mainContainer.style.gridTemplateColumns;
        if (currentGrid && currentGrid.includes('px')) {
            const newWidth = currentGrid.split(' ')[0];
            appState.leftPanelWidth = newWidth;
            localStorage.setItem('codelab-panel-width', newWidth);
        }
    }
}

function setupResizing() {
    const gutter = dom.resizeGutter;
    if (!gutter || !dom.mainContainer || !dom.leftPanel || !dom.rightPanel) {
        console.warn("Resize elements not found, skipping.");
        return;
    }

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
    dom.copyFileBtn.addEventListener('click', handleCopyFile); 
    dom.renameFileBtn.addEventListener('click', handleRenameFile);
    dom.deleteFileBtn.addEventListener('click', handleDeleteFile);

    // Preview Actions
    dom.runCodeBtn.addEventListener('click', handleRunClick);
    dom.runNewTabBtn.addEventListener('click', handleRunInNewTab);
    dom.shareBtn.addEventListener('click', handleShareProject); 
    
    let rotationDegree = 0;
    dom.updateNewTabBtn.addEventListener('click', () => {
        const icon = document.getElementById('update-icon');
        rotationDegree += 180;
        icon.style.transform = `rotate(${rotationDegree}deg)`;
        runCode('index.html');
    });

    // Modal Actions
    dom.modalBackdrop.addEventListener('click', (e) => {
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
        if (e.key === 'Tab' && appState.modalStack.length > 0) {
            const currentModal = appState.modalStack[appState.modalStack.length - 1];
            const focusable = currentModal.querySelectorAll('button, input, select');
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
 */
function splitFileName(fileName) {
    const lastDotIndex = fileName.lastIndexOf('.');

    if (lastDotIndex <= 0) {
        return [fileName, '.html']; 
    }

    const baseName = fileName.substring(0, lastDotIndex);
    const extension = fileName.substring(lastDotIndex); 

    if (['.html', '.css', '.js', '.json'].includes(extension)) { 
        return [baseName, extension];
    }
    
    return [fileName, '.html'];
}


/**
 * UPDATED: Robust app starter, now async
 */
async function startApp() {
    if (typeof CodeMirror !== 'undefined') {
        console.log("CodeMirror loaded, initializing app.");
        
        // 1. Populate DOM refs FIRST. This is the critical fix.
        //    Now, dom.confirmTitle will exist.
        populateDomRefs();
        
        // 2. Setup CodeMirror (depends on populateDomRefs)
        setupCodeMirror();

        // 3. Now we can safely await the URL handler,
        //    which is allowed to show modals.
        await handleUrlParameters(); 
        
        // 4. Setup the rest of the UI
        const savedTheme = localStorage.getItem('codelab-theme') || 'light';
        setTheme(savedTheme);

        const savedFont = localStorage.getItem('codelab-font') || appState.editorFont;
        setEditorFont(savedFont);

        const savedWidth = localStorage.getItem('codelab-panel-width');
        if (savedWidth) {
            appState.leftPanelWidth = savedWidth;
            dom.mainContainer.style.gridTemplateColumns = `${savedWidth} auto 1fr`;
        }

        // 5. Setup event listeners
        setupEventListeners();

        // 6. Render the final state based on files loaded from URL
        renderFileTabs();
        if (appState.activeFileId) {
            loadFileIntoEditor(appState.activeFileId); 
        } else if (appState.files.length > 0) {
            // Failsafe if activeFileId wasn't set
            loadFileIntoEditor(appState.files[0].id);
        }
        
        runCode();
        updateRunModeUI(); 

    } else {
        console.error("startApp was called but CodeMirror is still not defined. This indicates a script loading error in codelab.html.");
    }
}
