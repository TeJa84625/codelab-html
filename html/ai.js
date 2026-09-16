import * as webllm from "https://esm.run/@mlc-ai/web-llm";

let engine = null;
const MODEL_NAME = "Llama-3.2-1B-Instruct-q4f32_1-MLC";

const statusDiv = document.getElementById('status');
const initBtn = document.getElementById('init-btn');
const promptInput = document.getElementById('user-prompt');
const sendBtn = document.getElementById('send-btn');
const chatContainer = document.getElementById('chat-container');

// Initialize AI Event Listener
initBtn.addEventListener('click', async () => {
    initBtn.disabled = true;
    statusDiv.className = "status-box warning";
    statusDiv.innerText = "Downloading model weights into browser cache (~500MB). Please keep tab open...";

    try {
        engine = await webllm.CreateMLCEngine(
            MODEL_NAME,
            {
                initProgressCallback: (progress) => {
                    statusDiv.innerText = progress.text;
                }
            }
        );

        statusDiv.className = "status-box success";
        statusDiv.innerText = "AI Model Initialized Successfully! You can now generate code.";
        promptInput.disabled = false;
        sendBtn.disabled = false;
        initBtn.style.display = 'none';
    } catch (err) {
        statusDiv.className = "status-box error";
        statusDiv.innerText = "Initialization Error: " + err.message;
        initBtn.disabled = false;
    }
});

// Send Prompt Event Listener
sendBtn.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();
    if (!prompt || !engine) return;

    if (chatContainer.querySelector('div[style*="italic"]')) {
        chatContainer.innerHTML = '';
    }

    chatContainer.innerHTML += `<div class="chat-bubble user"><strong>You:</strong> ${escapeHtml(prompt)}</div>`;
    promptInput.value = "";
    chatContainer.scrollTop = chatContainer.scrollHeight;

    const msgId = "ai-msg-" + Date.now();
    chatContainer.innerHTML += `<div id="${msgId}" class="chat-bubble ai pulse"><strong>AI:</strong> Writing and optimizing code...</div>`;
    chatContainer.scrollTop = chatContainer.scrollHeight;

    const systemPrompt = "You are an expert frontend developer. Write clean, complete, standalone HTML code. Embed all CSS inside <style> tags and JavaScript inside <script> tags directly. Ensure all HTML elements referenced in JS (like form IDs) match correctly. Do NOT use external files. Output ONLY valid HTML inside a ```html ... ``` code block.";

    try {
        const chunks = await engine.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            stream: true,
        });

        let fullReply = "";
        for await (const chunk of chunks) {
            fullReply += chunk.choices[0]?.delta?.content || "";
        }

        document.getElementById(msgId).classList.remove('pulse');
        document.getElementById(msgId).innerHTML = `<strong>AI:</strong> Code build successful. Check preview panel!`;
        chatContainer.scrollTop = chatContainer.scrollHeight;

        const cleanHtml = parseHTMLOutput(fullReply);
        renderPreview(cleanHtml);

    } catch (err) {
        document.getElementById(msgId).classList.remove('pulse');
        document.getElementById(msgId).className = "chat-bubble ai";
        document.getElementById(msgId).innerHTML = `<strong>AI Error:</strong> <span style="color:#f87171;">${escapeHtml(err.message)}</span>`;
    }
});

function parseHTMLOutput(text) {
    const match = text.match(/```(?:html)?([\s\S]*?)```/i);
    if (match && match[1]) {
        return match[1].trim();
    }
    if (text.includes("<!DOCTYPE html>") || text.includes("<html")) {
        return text.trim();
    }
    return `<!DOCTYPE html><html><head><style>body{font-family:sans-serif;padding:20px;}</style></head><body>${text.replace(/\n/g, '<br>')}</body></html>`;
}

function renderPreview(html) {
    document.getElementById('html-preview').srcdoc = html;
    document.getElementById('html-code-display').textContent = html;
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Tab Switching logic
const previewWrapper = document.getElementById('preview-wrapper');
const codeWrapper = document.getElementById('code-wrapper');
const previewBtn = document.getElementById('tab-preview-btn');
const codeBtn = document.getElementById('tab-code-btn');

previewBtn.addEventListener('click', () => {
    previewWrapper.classList.remove('hidden');
    codeWrapper.classList.add('hidden');
    previewBtn.classList.add('active');
    codeBtn.classList.remove('active');
});

codeBtn.addEventListener('click', () => {
    previewWrapper.classList.add('hidden');
    codeWrapper.classList.remove('hidden');
    codeBtn.classList.add('active');
    previewBtn.classList.remove('active');
});