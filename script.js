// ================= CONFIG =================
const API_BASE_URL = "https://ivaai-backend.onrender.com/api";

// ================= DOM ELEMENTS =================
const body = document.body;
const themeToggle = document.getElementById('theme-toggle');
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatForm = document.getElementById('chat-form');
const historyList = document.getElementById('history-list');
const chatTitleDisplay = document.getElementById('chat-title-display');

// Profile & Greeting DOM Elements
const profileToggleBtn = document.getElementById('profile-toggle-btn');
const profileMenu = document.getElementById('profile-menu');
const dropdownEmail = document.getElementById('dropdown-email');
const clearChatsBtn = document.getElementById('clear-chats-btn');
const headerUserName = document.getElementById('header-user-name');

// Mobile Responsiveness Elements
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

// ================= STATE =================
let jwtToken = localStorage.getItem('iva_token');
let userEmail = localStorage.getItem('iva_email');
let userFullName = localStorage.getItem('iva_name');
let currentChatId = null;

// ================= THEME MANAGEMENT =================
themeToggle.addEventListener('click', () => {
    body.dataset.theme = body.dataset.theme === 'light' ? '' : 'light';
    localStorage.setItem('theme', body.dataset.theme || 'dark');
    themeToggle.querySelector('i').className = body.dataset.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
});

// ================= MOBILE SIDEBAR LOGIC =================
function toggleSidebar(forceClose = false) {
    if (sidebar && sidebarOverlay) {
        if (forceClose) {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
        } else {
            sidebar.classList.toggle('open');
            sidebarOverlay.classList.toggle('active');
        }
    }
}

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => toggleSidebar());
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => toggleSidebar(true));
}

// ================= PROFILE DROPDOWN LOGIC =================
profileToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileMenu.classList.toggle('hidden');
});

document.addEventListener('click', (e) => {
    if (profileMenu && !profileToggleBtn.contains(e.target) && !profileMenu.contains(e.target)) {
        profileMenu.classList.add('hidden');
    }
});

// ================= UI HELPERS =================
function updateUIGreeting(name) {
    if (headerUserName && name) {
        const firstName = name.split(' ')[0];
        headerUserName.textContent = `Hi, ${firstName} 👋`;
    }
}

function addMessage(text, role) {
    const el = document.createElement('div');
    // Normalize role names for CSS compatibility
    const safeRole = (role === 'model' || role === 'ai' || role === 'assistant') ? 'model' : 'user';
    el.className = `message ${safeRole}`;
    // Wrap text in the bubble div to keep our CSS styling intact
    el.innerHTML = `<div class="bubble">${text}</div>`;
    chatMessages.appendChild(el);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to bottom
}

// ================= AUTH STATE & LOGOUT =================
async function checkAuthState() {
    if (jwtToken) {
        authSection.classList.add('hidden');
        appSection.classList.remove('hidden');

        if (dropdownEmail) dropdownEmail.textContent = userEmail || 'User';
        updateUIGreeting(userFullName);

        await loadHistorySidebar();
        if (!currentChatId) startNewChat();
    } else {
        authSection.classList.remove('hidden');
        appSection.classList.add('hidden');
    }
}

document.getElementById('logout-btn').addEventListener('click', (e) => {
    e.preventDefault();
    handleLogout();
});

function handleLogout() {
    localStorage.removeItem('iva_token');
    localStorage.removeItem('iva_email');
    localStorage.removeItem('iva_name');
    jwtToken = null;
    userEmail = null;
    userFullName = null;
    currentChatId = null;
    checkAuthState();
    if (profileMenu) profileMenu.classList.add('hidden');
}

// ================= HISTORY SIDEBAR (API) =================
async function loadHistorySidebar() {
    try {
        const res = await fetch(`${API_BASE_URL}/messages/history`, {
            headers: { 'Authorization': `Bearer ${jwtToken}` }
        });

        if (res.status === 401) return handleLogout(); // Auto-logout if token expired
        if (!res.ok) return;

        const chats = await res.json();
        historyList.innerHTML = '';

        chats.forEach(chat => {
            const li = document.createElement('li');
            li.className = 'history-item';
            if (currentChatId === chat.id) li.classList.add('active');

            // Keeps the beautiful FontAwesome icons and flexbox layout
            li.innerHTML = `
                <div class="chat-item-content">
                    <span class="chat-title-text">
                        <i class="far fa-comment-alt"></i> ${chat.title || "Conversation"}
                    </span>
                    <i class="fas fa-trash-alt delete-icon" title="Delete chat"></i>
                </div>
            `;

            li.onclick = (e) => {
                if (e.target.classList.contains('delete-icon')) {
                    e.stopPropagation();
                    deleteSingleChat(chat.id);
                } else {
                    loadChatSession(chat.id, chat.title);
                }
            };
            historyList.appendChild(li);
        });
    } catch (err) {
        console.error("Failed to load history", err);
    }
}

// ================= DELETE SINGLE CHAT (API) =================
async function deleteSingleChat(chatId) {
    if (!confirm("Are you sure you want to permanently delete this conversation?")) return;

    try {
        const res = await fetch(`${API_BASE_URL}/messages/${chatId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${jwtToken}` }
        });

        if (res.status === 401) return handleLogout();

        if (res.ok) {
            if (currentChatId === chatId) startNewChat();
            await loadHistorySidebar();
        } else {
            alert("Failed to delete chat.");
        }
    } catch (err) {
        console.error("Error deleting chat", err);
    }
}

// ================= CLEAR ALL CHATS (API) =================
clearChatsBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (profileMenu) profileMenu.classList.add('hidden');

    if (!confirm("Are you sure you want to permanently delete all your chats? This cannot be undone.")) return;

    try {
        const res = await fetch(`${API_BASE_URL}/messages/clear`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${jwtToken}` }
        });

        if (res.status === 401) return handleLogout();

        if (res.ok) {
            historyList.innerHTML = '';
            startNewChat();
            toggleSidebar(true); // Auto-close mobile sidebar after clearing
        } else {
            alert("Failed to clear chats.");
        }
    } catch (err) {
        console.error("Error clearing chats", err);
    }
});

// ================= LOAD SPECIFIC CHAT (API) =================
async function loadChatSession(chatId, title) {
    try {
        const res = await fetch(`${API_BASE_URL}/messages/${chatId}`, {
            headers: { 'Authorization': `Bearer ${jwtToken}` }
        });

        if (res.status === 401) return handleLogout();
        if (!res.ok) return;

        const data = await res.json();
        currentChatId = data.id;
        chatTitleDisplay.textContent = title || "Conversation";
        chatMessages.innerHTML = '';

        data.messages.forEach(m => addMessage(m.content, m.role));
        loadHistorySidebar();

        // Mobile UI fix: Auto-close sidebar when a chat is selected
        toggleSidebar(true);

    } catch (err) {
        console.error("Failed to load chat", err);
    }
}

// ================= START NEW CHAT =================
function startNewChat() {
    currentChatId = null;
    chatTitleDisplay.textContent = "New Conversation";
    chatMessages.innerHTML = '';

    const firstName = userFullName ? userFullName.split(' ')[0] : 'there';
    addMessage(`Hello ${firstName}! I am Iva, your intelligent assistant created by Mohd Shawez Khan. How can I help you today?`, 'model');

    document.querySelectorAll('.history-item').forEach(item => item.classList.remove('active'));

    // Mobile UI fix: Auto-close sidebar when starting a new chat
    toggleSidebar(true);

    if (chatInput) chatInput.focus();
}
document.getElementById('new-chat-btn').addEventListener('click', startNewChat);

// ================= SEND MESSAGE (API) =================
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    chatInput.value = '';

    // UI Robustness: Disable button and show loading state
    const btn = chatForm.querySelector('button');
    const originalBtnText = btn.textContent;
    btn.textContent = '...';
    btn.disabled = true;

    try {
        const payload = { chatId: currentChatId, content: text };

        const res = await fetch(`${API_BASE_URL}/messages/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` },
            body: JSON.stringify(payload)
        });

        if (res.status === 401) return handleLogout();
        if (!res.ok) throw new Error("Server error");

        const data = await res.json();

        if (!currentChatId) {
            currentChatId = data.chatId;
            await loadHistorySidebar();
        }

        addMessage(data.aiResponse, 'model');

    } catch (err) {
        addMessage("⚠️ Failed to communicate with the server. Please try again.", 'error');
    } finally {
        // Restore button state
        btn.textContent = originalBtnText;
        btn.disabled = false;
        chatInput.focus();
    }
});

// ================= AUTH FORMS SUBMISSIONS =================
document.getElementById('show-register').onclick = (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
};
document.getElementById('show-login').onclick = (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
};

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = loginForm.querySelector('button');
    btn.textContent = 'Logging in...'; // UI Loading state

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const loginError = document.getElementById('login-error');

    try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (res.ok) {
            const data = await res.json();
            jwtToken = data.token;
            userEmail = data.email;
            userFullName = data.fullName;

            localStorage.setItem('iva_token', jwtToken);
            localStorage.setItem('iva_email', userEmail);
            localStorage.setItem('iva_name', userFullName);

            loginForm.reset();
            loginError.classList.add('hidden');
            checkAuthState();
        } else {
            loginError.textContent = 'Invalid email or password.';
            loginError.classList.remove('hidden');
        }
    } catch (err) {
        loginError.textContent = 'Cannot reach server.';
        loginError.classList.remove('hidden');
    } finally {
        btn.textContent = 'Log In';
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = registerForm.querySelector('button');
    btn.textContent = 'Creating...'; // UI Loading state

    const fullName = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const registerError = document.getElementById('register-error');

    try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, email, password })
        });

        if (res.ok) {
            alert("Account created! Please log in.");
            document.getElementById('show-login').click();
            document.getElementById('login-email').value = email;
            registerForm.reset();
            registerError.classList.add('hidden');
        } else {
            const errorData = await res.json();
            registerError.textContent = errorData.message || 'Registration failed.';
            registerError.classList.remove('hidden');
        }
    } catch (err) {
        registerError.textContent = 'Cannot reach server.';
        registerError.classList.remove('hidden');
    } finally {
        btn.textContent = 'Sign Up';
    }
});

// ================= APP INITIALIZATION =================
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'light') body.dataset.theme = 'light';
    if (themeToggle) themeToggle.querySelector('i').className = body.dataset.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    checkAuthState();
});