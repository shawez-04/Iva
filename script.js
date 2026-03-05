// ELEMENTS
const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

const showRegister = document.getElementById("show-register");
const showLogin = document.getElementById("show-login");

const loginError = document.getElementById("login-error");
const registerError = document.getElementById("register-error");

const headerUserName = document.getElementById("header-user-name");
const dropdownEmail = document.getElementById("dropdown-email");

const logoutBtn = document.getElementById("logout-btn");
const clearChatsBtn = document.getElementById("clear-chats-btn");

const profileToggleBtn = document.getElementById("profile-toggle-btn");
const profileMenu = document.getElementById("profile-menu");

const newChatBtn = document.getElementById("new-chat-btn");
const historyList = document.getElementById("history-list");

const chatMessages = document.getElementById("chat-messages");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatTitleDisplay = document.getElementById("chat-title-display");

const themeToggle = document.getElementById("theme-toggle");

let currentUser = null;
let chats = [];
let currentChatId = null;



/* ---------------- AUTH SWITCH ---------------- */

showRegister.addEventListener("click", e => {
    e.preventDefault();
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
});

showLogin.addEventListener("click", e => {
    e.preventDefault();
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
});


/* ---------------- REGISTER ---------------- */

registerForm.addEventListener("submit", e => {
    e.preventDefault();

    const name = document.getElementById("register-name").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;

    let users = JSON.parse(localStorage.getItem("iva_users")) || [];

    const exists = users.find(u => u.email === email);

    if (exists) {
        registerError.textContent = "Account already exists.";
        registerError.classList.remove("hidden");
        return;
    }

    users.push({ name, email, password });

    localStorage.setItem("iva_users", JSON.stringify(users));

    registerError.classList.add("hidden");

    alert("Account created! Please login.");

    registerForm.reset();
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
});


/* ---------------- LOGIN ---------------- */

loginForm.addEventListener("submit", e => {
    e.preventDefault();

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    let users = JSON.parse(localStorage.getItem("iva_users")) || [];

    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        loginError.textContent = "Invalid email or password.";
        loginError.classList.remove("hidden");
        return;
    }

    loginError.classList.add("hidden");

    localStorage.setItem("iva_current_user", JSON.stringify(user));

    loadUser(user);
});


/* ---------------- LOAD USER ---------------- */

function loadUser(user) {

    currentUser = user;

    authSection.classList.add("hidden");
    appSection.classList.remove("hidden");

    headerUserName.textContent = `Hi, ${user.name}`;
    dropdownEmail.textContent = user.email;

    loadChats();
}


/* ---------------- LOGOUT ---------------- */

logoutBtn.addEventListener("click", e => {

    e.preventDefault();

    localStorage.removeItem("iva_current_user");

    location.reload();
});


/* ---------------- PROFILE MENU ---------------- */

profileToggleBtn.addEventListener("click", () => {

    profileMenu.classList.toggle("hidden");

});


document.addEventListener("click", e => {

    if (!profileToggleBtn.contains(e.target) && !profileMenu.contains(e.target)) {
        profileMenu.classList.add("hidden");
    }

});


/* ---------------- CHAT SYSTEM ---------------- */

function loadChats() {

    const key = `iva_chats_${currentUser.email}`;

    chats = JSON.parse(localStorage.getItem(key)) || [];

    renderHistory();

    if (chats.length > 0) {
        openChat(chats[0].id);
    } else {
        createNewChat();
    }
}


function saveChats() {

    const key = `iva_chats_${currentUser.email}`;

    localStorage.setItem(key, JSON.stringify(chats));
}


/* ---------------- NEW CHAT ---------------- */

newChatBtn.addEventListener("click", () => {

    createNewChat();

});


function createNewChat() {

    const id = Date.now();

    const chat = {
        id,
        title: "New Conversation",
        messages: []
    };

    chats.unshift(chat);

    saveChats();

    renderHistory();

    openChat(id);
}


/* ---------------- HISTORY ---------------- */

function renderHistory() {

    historyList.innerHTML = "";

    chats.forEach(chat => {

        const li = document.createElement("li");

        li.textContent = chat.title;

        li.addEventListener("click", () => openChat(chat.id));

        historyList.appendChild(li);

    });

}


/* ---------------- OPEN CHAT ---------------- */

function openChat(id) {

    currentChatId = id;

    const chat = chats.find(c => c.id === id);

    chatTitleDisplay.textContent = chat.title;

    chatMessages.innerHTML = "";

    chat.messages.forEach(msg => {

        addMessage(msg.text, msg.sender);

    });

}


/* ---------------- ADD MESSAGE ---------------- */

function addMessage(text, sender) {

    const div = document.createElement("div");

    div.className = `message ${sender}`;

    div.textContent = text;

    chatMessages.appendChild(div);

    chatMessages.scrollTop = chatMessages.scrollHeight;
}


/* ---------------- SEND MESSAGE ---------------- */

chatForm.addEventListener("submit", e => {

    e.preventDefault();

    const text = chatInput.value.trim();

    if (!text) return;

    const chat = chats.find(c => c.id === currentChatId);

    chat.messages.push({ sender: "user", text });

    addMessage(text, "user");

    chatInput.value = "";

    // fake AI response
    setTimeout(() => {

        const reply = "Iva is thinking... 🤖";

        chat.messages.push({ sender: "ai", text: reply });

        addMessage(reply, "ai");

        saveChats();

    }, 700);

    saveChats();
});


/* ---------------- CLEAR CHATS ---------------- */

clearChatsBtn.addEventListener("click", e => {

    e.preventDefault();

    if (!confirm("Clear all chats?")) return;

    chats = [];

    saveChats();

    renderHistory();

    chatMessages.innerHTML = "";

    chatTitleDisplay.textContent = "New Conversation";

});


/* ---------------- THEME TOGGLE ---------------- */

themeToggle.addEventListener("click", () => {

    const currentTheme = document.documentElement.getAttribute("data-theme");

    if (currentTheme === "light") {

        document.documentElement.removeAttribute("data-theme");

        localStorage.setItem("iva_theme", "dark");

    } else {

        document.documentElement.setAttribute("data-theme", "light");

        localStorage.setItem("iva_theme", "light");

    }

});


/* ---------------- LOAD THEME ---------------- */

function loadTheme() {

    const savedTheme = localStorage.getItem("iva_theme");

    if (savedTheme === "light") {
        document.documentElement.setAttribute("data-theme", "light");
    }

}


/* ---------------- AUTH CHECK ---------------- */

function checkAuth() {

    const user = JSON.parse(localStorage.getItem("iva_current_user"));

    if (user) {

        loadUser(user);

    }

}


/* ---------------- INIT ---------------- */

document.addEventListener("DOMContentLoaded", () => {

    loadTheme();

    checkAuth();

});