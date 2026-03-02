// Configuration
const API_BASE_URL = 'https://ivaai-backend.onrender.com';

// DOM Elements
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

const profileToggleBtn = document.getElementById('profile-toggle-btn');
const profileMenu = document.getElementById('profile-menu');
const dropdownEmail = document.getElementById('dropdown-email');
const clearChatsBtn = document.getElementById('clear-chats-btn');
const headerUserName = document.getElementById('header-user-name');

// State
let jwtToken = localStorage.getItem('iva_token');
let userEmail = localStorage.getItem('iva_email');
let userFullName = localStorage.getItem('iva_name');
let currentChatId = null;

// Helpers
function addMessage(text, role) {
    const el = document.createElement('div');
    el.className = `message ${role}`;
    el.innerHTML = `<div class="bubble">${text}</div>`;
    chatMessages.appendChild(el);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateUIGreeting(name) {
    if (headerUserName && name) {
        const firstName = name.split(' ')[0];
        headerUserName.textContent = `Hi, ${firstName} 👋`;
    }
}

// Auth State
async function checkAuthState() {
    if (jwtToken) {
        authSection.classList.add('hidden');
        appSection.classList.remove('hidden');
        dropdownEmail.textContent = userEmail;
        updateUIGreeting(userFullName);
        await loadHistorySidebar();
        startNewChat();
    } else {
        authSection.classList.remove('hidden');
        appSection.classList.add('hidden');
    }
}

// AUTH
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
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

        checkAuthState();
    } else {
        alert("Invalid login credentials");
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password })
    });

    if (res.ok) {
        alert("Account created. Please login.");
    } else {
        alert("Registration failed.");
    }
});

// CHAT
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    chatInput.value = '';

    const res = await fetch(`${API_BASE_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({ chatId: currentChatId, content: text })
    });

    if (!res.ok) {
        addMessage("Server error", "error");
        return;
    }

    const data = await res.json();
    if (!currentChatId) currentChatId = data.chatId;

    addMessage(data.aiResponse, 'model');
    loadHistorySidebar();
});

// HISTORY
async function loadHistorySidebar() {
    const res = await fetch(`${API_BASE_URL}/api/messages/history`, {
        headers: { 'Authorization': `Bearer ${jwtToken}` }
    });

    if (!res.ok) return;

    const chats = await res.json();
    historyList.innerHTML = '';

    chats.forEach(chat => {
        const li = document.createElement('li');
        li.textContent = chat.title;
        li.onclick = () => loadChatSession(chat.id, chat.title);
        historyList.appendChild(li);
    });
}

async function loadChatSession(chatId, title) {
    const res = await fetch(`${API_BASE_URL}/api/messages/${chatId}`, {
        headers: { 'Authorization': `Bearer ${jwtToken}` }
    });

    if (!res.ok) return;

    const data = await res.json();
    currentChatId = data.id;
    chatMessages.innerHTML = '';
    data.messages.forEach(m => addMessage(m.content, m.role));
}

// CLEAR ALL
clearChatsBtn.addEventListener('click', async () => {
    await fetch(`${API_BASE_URL}/api/messages/clear`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${jwtToken}` }
    });
    startNewChat();
});

// NEW CHAT
function startNewChat() {
    currentChatId = null;
    chatMessages.innerHTML = '';
}

// INIT 
document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
});