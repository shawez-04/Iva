**🤖 Iva AI Companion**

Iva AI Companion is a full-stack AI-powered conversational assistant built with .NET 8 Web API, PostgreSQL, and Vanilla JavaScript.

The system provides secure authentication, persistent chat history, and contextual AI responses powered by Google Gemini. This project demonstrates production-grade backend architecture, scalable API design, AI integration, and modern deployment practices.

**🌐 Live Demo**

Frontend (GitHub Pages): https://shawez-04.github.io/IvaAI/

Backend API (Render): https://ivaai-backend.onrender.com

**🏗️ System Architecture**

The project follows a clean layered architecture that separates concerns across different layers.

Client (HTML/CSS/JS SPA)
        │
        ▼
.NET 8 Web API Controllers
        │
        ▼
Business Services
(JWT, Gemini, Chat Logic)
        │
        ▼
Entity Framework Core
        │
        ▼
PostgreSQL Database (Neon)


Design Principles

Separation of concerns

Stateless authentication

DTO-based API contracts

Centralized error handling

Rate limiting for abuse protection

Containerized deployment

**🧩 System Design Diagram**

                    ┌───────────────────────────┐
                    │        User Browser       │
                    │   (HTML / CSS / JS SPA)   │
                    └─────────────┬─────────────┘
                                  │
                                  │ HTTPS Requests
                                  ▼
                    ┌───────────────────────────┐
                    │        Frontend UI        │
                    │      GitHub Pages CDN     │
                    └─────────────┬─────────────┘
                                  │
                                  │ Fetch API Requests
                                  ▼
                    ┌───────────────────────────┐
                    │       .NET 8 Web API      │
                    │      (Hosted on Render)   │
                    └─────────────┬─────────────┘
                                  │
               ┌──────────────────┼──────────────────┐
               │                  │                  │
               ▼                  ▼                  ▼
      ┌───────────────┐  ┌─────────────────┐  ┌────────────────┐
      │ Auth Service  │  │  Chat Service   │  │ Gemini Service │
      │ JWT + BCrypt  │  │ Message Logic   │  │ AI Integration │
      └──────┬────────┘  └────────┬────────┘  └────────┬───────┘
             │                    │                    │
             ▼                    ▼                    ▼
      ┌────────────────────────────────────────────────────┐
      │                Entity Framework Core               │
      │                 Database Access Layer              │
      └───────────────────────────┬────────────────────────┘
                                  │
                                  ▼
                       ┌───────────────────────┐
                       │   PostgreSQL (Neon)   │
                       │ Users / Chats / Msgs  │
                       └───────────────────────┘


                           External AI Call
                                  │
                                  ▼
                       ┌───────────────────────┐
                       │   Google Gemini API   │
                       │     gemini-2.5-flash  │
                       └───────────────────────┘


**🔄 Message Request Lifecycle**

When a user sends a message, the system processes it as follows:

1️⃣ User Sends Message

Frontend calls: POST /api/messages/send

Request payload:

{
  "ChatId": "uuid",
  "Content": "UserMessage"
}


(Sent with JWT Token in Authorization header)

2️⃣ Authentication

Backend middleware validates the JWT token and extracts:

UserId

Email

FullName

3️⃣ Chat Handling

The API checks:

If ChatId exists → Load chat

If ChatId is null → Create new chat

4️⃣ Store User Message

The user message is saved in the database:

Table: Messages

Role: User

5️⃣ Load Conversation Context

Backend loads the Full chat history + New user message. This allows contextual AI responses.

6️⃣ Gemini API Call

The backend sends the conversation to the Google Gemini API (Model: gemini-2.5-flash) with system instructions defining the Iva AI persona.

7️⃣ Save AI Response

The AI response is stored in the database:

Table: Messages

Role: Assistant (Model)

8️⃣ Response Returned to Frontend

The API returns:

{
  "chatId": "uuid",
  "userMessage": "...",
  "aiResponse": "..."
}


The UI updates instantly.

**⚙️ Backend Features (.NET 8)**

**🔐 Authentication & Security**

Secure authentication is implemented using JWT tokens. Features include:

Secure registration and login

Password hashing using BCrypt.Net-Next

JWT token-based stateless authentication

Claims-based authorization

[Authorize] protection for endpoints

JWT tokens contain: UserId, Email, FullName

**🧠 AI Integration (Google Gemini)**

The AI functionality is powered by gemini-2.5-flash. A dedicated GeminiService handles:

API communication

Prompt engineering

Conversation memory

Response formatting

AI Persona: The assistant behaves as Iva AI Companion and acknowledges Mohd Shawez Khan as its creator.

💬 Stateful Conversation Memory

To maintain context, every AI request sends the Complete chat history + Current user message. This enables multi-turn conversations.

**🗄️ Database Design**

The system uses PostgreSQL (Neon) with Entity Framework Core.

Entities

User: Id, FullName, Email, PasswordHash, CreatedAt

Chat: Id, UserId, Title, CreatedAt

Message: Id, ChatId, Role, Content, CreatedAt

Relationships

User 1 ─── N Chat

Chat 1 ─── N Message

Cascade deletion ensures:

Deleting a User removes all their chats.

Deleting a Chat removes all its messages.

**🚀 Smart Message Endpoint**

Instead of two calls (Create Chat & Send Message), the backend performs everything through a single endpoint: POST /api/messages/send.

This endpoint:

Creates a chat if necessary

Saves user message

Calls Gemini API

Saves AI response

Returns result

Benefits: Reduced latency, fewer network requests, and better UX.

**🛡️ API Reliability**

Global Exception Handling

Custom middleware (ExceptionMiddleware) provides:

Clean controllers (no repeated try-catches)

Standardized error responses (ProblemDetails JSON format)

Easier debugging

Rate Limiting

A fixed-window rate limiter prevents abuse.
Strategy: Rate limit per UserId, with a fallback to IP address if unauthenticated.

**🌐 Frontend Features**

The frontend is a lightweight SPA using vanilla JavaScript.
Benefits: Fast loading, minimal dependencies, simple architecture.

**🔑 Authentication State**

Authentication data is securely stored in localStorage (jwtToken, userEmail, userFullName).

Auto Login: Users automatically bypass login if a valid token exists.

Auto Logout: If the API returns 401 Unauthorized, the system logs out automatically.

**💬 Chat Interface**

Real-time chat rendering & Auto scrolling

User vs AI message bubbles

Loading indicator during AI responses

**📜 Chat History**

Sidebar displays previous conversations. Users can load past chats, delete individual chats, or clear all chats.

🎨 UI / UX Features

Dynamic Theming

Supports Light Mode & Dark Mode. Theme preference is saved in localStorage.

Enterprise Style UI

Profile dropdown menu

Click-outside-to-close behavior

FontAwesome icons

Colored chat bubbles

📱 Mobile Responsiveness

Slide-in sidebar drawer

Hamburger menu navigation

Background overlay blur

Auto-close sidebar on chat selection

**🐳 DevOps & Deployment**

Docker

Backend containerized using a multi-stage Docker build.
Benefits: Smaller image size, clean builds, easy deployment.

**🌍 Deployment**

Backend: Hosted on Render (Container hosting, Auto deployment, Production API hosting).

Frontend: Hosted on GitHub Pages (Static hosting, Global CDN, Fast loading).

**📡 API Endpoints**

_Authentication_

POST /api/auth/register

POST /api/auth/login

_Chats_

GET /api/chats

DELETE /api/chats/{chatId}

DELETE /api/chats/clear

_Messages_

POST /api/messages/send

GET /api/messages/{chatId}

**🛠️ Tech Stack**

_Backend_

.NET 8 Web API

Entity Framework Core

PostgreSQL (Neon)

JWT Authentication

BCrypt.Net-Next

Google Gemini API

_Frontend_

HTML5

CSS3

Vanilla JavaScript

FontAwesome

_DevOps & Deployment_

Docker

Render

GitHub Pages

**👨‍💻 Author**

Mohd Shawez Khan Electronics & Communication Engineering | Full-Stack & Backend Developer

GitHub: https://github.com/shawez-04

LinkedIn: https://www.linkedin.com/in/mohd-shawez-khan

