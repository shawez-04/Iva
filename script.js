// --- Configuration ---
const API_BASE_URL = 'https://ivaai-backend.onrender.com';
// --- DOM Elements ---
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
const headerUserName = document.getElementById('header-user-name'); // Target for the greeting

// --- State ---
let jwtToken = localStorage.getItem('iva_token');
let userEmail = localStorage.getItem('iva_email');
let userFullName = localStorage.getItem('iva_name'); // Grab the name from storage
let currentChatId = null;

// --- Theme Management ---
themeToggle.addEventListener('click', () => {
    body.dataset.theme = body.dataset.theme === 'light' ? '' : 'light';
    localStorage.setItem('theme', body.dataset.theme || 'dark');
    themeToggle.querySelector('i').className = body.dataset.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
});

// --- Profile Dropdown Logic ---
profileToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileMenu.classList.toggle('hidden');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (profileMenu && !profileToggleBtn.contains(e.target) && !profileMenu.contains(e.target)) {
        profileMenu.classList.add('hidden');
    }
});

// --- UI Helpers ---
function updateUIGreeting(name) {
    if (headerUserName && name) {
        const firstName = name.split(' ')[0]; // Gets just the first name
        headerUserName.textContent = `Hi, ${firstName} 👋`;
    }
}

function addMessage(text, role) {
    const el = document.createElement('div');
    el.className = `message ${role === 'model' ? 'model' : 'user'}`;
    el.innerHTML = `<div class="bubble">${text}</div>`;
    chatMessages.appendChild(el);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// --- Auth State Check ---
async function checkAuthState() {
    if (jwtToken) {
        authSection.classList.add('hidden');
        appSection.classList.remove('hidden');

        if (dropdownEmail) dropdownEmail.textContent = userEmail || 'User';

        // This triggers the greeting to show up in the header
        updateUIGreeting(userFullName);

        await loadHistorySidebar();
        startNewChat();
    } else {
        authSection.classList.remove('hidden');
        appSection.classList.add('hidden');
    }
}

document.getElementById('logout-btn').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('iva_token');
    localStorage.removeItem('iva_email');
    localStorage.removeItem('iva_name');
    jwtToken = null;
    userEmail = null;
    userFullName = null;
    checkAuthState();
    if (profileMenu) profileMenu.classList.add('hidden');
});

// --- API: Load History Sidebar ---
async function loadHistorySidebar() {
    try {
        const res = await fetch(`${API_BASE_URL}/messages/history`, {
            headers: { 'Authorization': `Bearer ${jwtToken}` }
        });
        if (res.ok) {
            const chats = await res.json();
            historyList.innerHTML = '';
            chats.forEach(chat => {
                const li = document.createElement('li');
                li.className = 'history-item';
                if (currentChatId === chat.id) li.classList.add('active');

                li.innerHTML = `
                    <div class="chat-item-content">
                        <span class="chat-title-text">
                            <i class="far fa-comment-alt"></i> ${chat.title}
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
        } else if (res.status === 401) {
            document.getElementById('logout-btn').click();
        }
    } catch (err) {
        console.error("Failed to load history", err);
    }
}

// --- API: Delete Single Chat ---
async function deleteSingleChat(chatId) {
    if (!confirm("Are you sure you want to permanently delete this conversation?")) return;

    try {
        const res = await fetch(`${API_BASE_URL}/messages/${chatId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${jwtToken}` }
        });

        if (res.ok) {
            if (currentChatId === chatId) startNewChat();
            await loadHistorySidebar();
        } else if (res.status === 401) {
            document.getElementById('logout-btn').click();
        } else {
            const data = await res.json();
            alert(data.message || "Failed to delete chat.");
        }
    } catch (err) {
        console.error("Error deleting chat", err);
        alert("Failed to communicate with the server.");
    }
}

// --- API: Load Specific Chat ---
async function loadChatSession(chatId, title) {
    try {
        const res = await fetch(`${API_BASE_URL}/messages/${chatId}`, {
            headers: { 'Authorization': `Bearer ${jwtToken}` }
        });
        if (res.ok) {
            const data = await res.json();
            currentChatId = data.id;
            chatTitleDisplay.textContent = title;
            chatMessages.innerHTML = '';

            data.messages.forEach(m => addMessage(m.content, m.role));
            loadHistorySidebar();
        }
    } catch (err) {
        console.error("Failed to load chat", err);
    }
}

// --- Start New Chat Flow ---
function startNewChat() {
    currentChatId = null;
    chatTitleDisplay.textContent = "New Conversation";
    chatMessages.innerHTML = '';

    // Personalized greeting from Iva
    const firstName = userFullName ? userFullName.split(' ')[0] : 'there';
    addMessage(`Hello ${firstName}! I am Iva, your intelligent assistant created by Mohd Shawez Khan. How can I help you today?`, 'model');

    document.querySelectorAll('.history-item').forEach(item => item.classList.remove('active'));
}
document.getElementById('new-chat-btn').addEventListener('click', startNewChat);

// --- API: Clear All Chats ---
clearChatsBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (profileMenu) profileMenu.classList.add('hidden');

    if (!confirm("Are you sure you want to permanently delete all your chats? This cannot be undone.")) {
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/messages/clear`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${jwtToken}` }
        });

        if (res.ok) {
            historyList.innerHTML = '';
            startNewChat();
            alert("All chats have been permanently cleared.");
        } else if (res.status === 401) {
            document.getElementById('logout-btn').click();
        } else {
            alert("Failed to clear chats.");
        }
    } catch (err) {
        console.error("Error clearing chats", err);
        alert("Failed to communicate with the server.");
    }
});

// --- API: Send Message ---
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    chatInput.value = '';
    const btn = chatForm.querySelector('button');
    btn.textContent = '...'; btn.disabled = true;

    try {
        const payload = { chatId: currentChatId, content: text };

        const res = await fetch(`${API_BASE_URL}/messages/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` },
            body: JSON.stringify(payload)
        });

        if (res.status === 401) {
            document.getElementById('logout-btn').click();
            return;
        }

        if (!res.ok) throw new Error("Server error");

        const data = await res.json();

        if (!currentChatId) {
            currentChatId = data.chatId;
            await loadHistorySidebar();
        }

        addMessage(data.aiResponse, 'model');

    } catch (err) {
        addMessage("Failed to communicate with the server.", 'error');
    } finally {
        btn.textContent = 'Send'; btn.disabled = false;
    }
});

// --- Auth Forms Submissions ---
document.getElementById('show-register').onclick = (e) => { e.preventDefault(); loginForm.classList.add('hidden'); registerForm.classList.remove('hidden'); };
document.getElementById('show-login').onclick = (e) => { e.preventDefault(); registerForm.classList.add('hidden'); loginForm.classList.remove('hidden'); };

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = loginForm.querySelector('button');
    btn.textContent = 'Logging in...';
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

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
            userFullName = data.fullName; // Critical: Save the name during login!

            localStorage.setItem('iva_token', jwtToken);
            localStorage.setItem('iva_email', userEmail);
            localStorage.setItem('iva_name', userFullName);

            document.getElementById('login-password').value = '';
            document.getElementById('login-error').classList.add('hidden');
            checkAuthState();
        } else {
            document.getElementById('login-error').textContent = 'Invalid email or password.';
            document.getElementById('login-error').classList.remove('hidden');
        }
    } catch (err) {
        document.getElementById('login-error').textContent = 'Cannot reach server.';
        document.getElementById('login-error').classList.remove('hidden');
    } finally {
        btn.textContent = 'Log In';
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = registerForm.querySelector('button');
    btn.textContent = 'Creating...';
    const fullName = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

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
            document.getElementById('register-password').value = '';
        } else {
            const errorData = await res.json();
            document.getElementById('register-error').textContent = errorData.message || 'Registration failed.';
            document.getElementById('register-error').classList.remove('hidden');
        }
    } catch (err) {
        document.getElementById('register-error').textContent = 'Cannot reach server.';
        document.getElementById('register-error').classList.remove('hidden');
    } finally {
        btn.textContent = 'Sign Up';
    }
});

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'light') body.dataset.theme = 'light';
    if (themeToggle) themeToggle.querySelector('i').className = body.dataset.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    checkAuthState();
});