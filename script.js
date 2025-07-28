// Get references to our HTML elements
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const sendButton = chatForm.querySelector('button');
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const iconPlaceholder = document.getElementById('svg-icon-placeholder');

// --- Direct API Configuration ---
const API_KEY = "${{ secrets.MY_API_KEY }}"; 
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// --- Conversation History & Personality ---
let chatHistory = [
    {
        role: "user",
        parts: [{ text: "You are a helpful and friendly AI companion created by Mohd Shawez Khan. Your name is 'Iva'." }]
    },
    {
        role: "model",
        parts: [{ text: "Hello ! I am Iva, an AI companion created by Mohd Shawez Khan. How can I help you today?" }]
    }
];

/**
 * Creates and adds a message with the correct bubble structure to the chat window.
 * @param {string} text - The message content.
 * @param {string} type - The type of message ('user', 'ai', or 'error').
 */
function addMessage(text, type) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`; 
    
    const bubbleElement = document.createElement('div');
    bubbleElement.className = 'bubble';
    bubbleElement.textContent = text;
    
    messageElement.appendChild(bubbleElement);
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Updates the theme toggle icon based on the current theme.
 */
function updateThemeIcon() {
    const themeIcon = themeToggle.querySelector('i');
    if (body.dataset.theme === 'light') {
        themeIcon.className = 'fas fa-moon';
    } else {
        themeIcon.className = 'fas fa-sun';
    }
}

// --- Event Listeners ---

// On page load, check for saved theme and set initial state
document.addEventListener('DOMContentLoaded', () => {
    // Check for saved theme and set initial state
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        body.dataset.theme = 'light';
    }
    updateThemeIcon();
    
    // Display the AI's initial welcome message.
    addMessage(chatHistory[1].parts[0].text, 'ai');
});

// Handle theme toggle button click
themeToggle.addEventListener('click', () => {
    if (body.dataset.theme === 'light') {
        body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'dark');
    } else {
        body.dataset.theme = 'light';
        localStorage.setItem('theme', 'light');
    }
    updateThemeIcon();
});


// Handle the form submission
chatForm.addEventListener('submit', async (event) => {
    event.preventDefault(); 
    
    const userInput = chatInput.value.trim();
    if (!userInput) return; 
    
    addMessage(userInput, 'user');
    
    chatHistory.push({ role: "user", parts: [{ text: userInput }] });

    chatInput.value = '';
    sendButton.disabled = true;
    sendButton.textContent = '...';

    try {
        const payload = { contents: chatHistory };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status}. ${errorText}`);
        }

        const result = await response.json();
        
        if (result.candidates && result.candidates.length > 0) {
            const aiResponse = result.candidates[0].content.parts[0].text;
            addMessage(aiResponse, 'ai');
            chatHistory.push({ role: "model", parts: [{ text: aiResponse }] });
        } else {
            addMessage("Received an empty response from the API.", 'error');
        }

    } catch (error) {
        console.error("Error:", error);
        addMessage(error.message, 'error');
    } finally {
        sendButton.disabled = false;
        sendButton.textContent = 'Send';
    }
});

// --- Scroll Animation for Sections ---
// Select ALL sections that need to be animated
const sectionsToAnimate = document.querySelectorAll('#about, #features');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.1 
});

// Loop through each section and tell the observer to watch it
sectionsToAnimate.forEach(section => {
    observer.observe(section);
});

