# Taskboard – Full-Stack MERN Task Management App

A modern, responsive task management platform built with React, Vite, Node.js, Express, and MongoDB (with built-in zero-config embedded database fallback), featuring real-time WebSocket updates, deadline reminders, priority & category filtering, and dark/light mode.

---

## ✨ Features

- ⭐ **Mark as Important**: Star critical tasks for quick access and filter by important tasks.
- 📌 **Priority & Due Date Sorting**: Sort tasks by due date (earliest/latest), priority (high/medium/low), or alphabetically.
- 🔔 **Deadline Reminders & Overdue Highlighting**:
  - Visual badges for overdue, due-today, and upcoming tasks.
  - Interactive In-App Notification Center with one-click "Mark Done".
  - Desktop browser push notifications via the Notification API.
  - Top deadline warning banner.
- 🌙 **Dark & Light Mode**: Smooth theme toggling with persistent preferences.
- 📈 **Progress Chart & Analytics**: Real-time stats summary cards, status progress bar, priority distribution, and category counts.
- 🏷️ **Categories & Tags**: Built-in tags for `DSA`, `Study`, `Work`, `Personal`, `Health`, `Finance`, plus custom tag creation.
- 🔄 **Real-Time WebSockets**: Instant synchronization across multiple tabs and devices without refreshing.
- 💻 **Pre-Loaded DSA & Sample Tasks**: Integrated DSA and study tracking tasks ready to load with one click.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (tested on Node 26)
- MongoDB (local or MongoDB Atlas; automatically falls back to embedded SQLite if MongoDB is offline)

### 1. Backend Server
```bash
cd server
cp .env.example .env
npm install
npm run dev               # Runs on http://localhost:5000 (and ws://localhost:5000/ws)
```

### 2. Frontend Client
```bash
cd client
npm install
npm run dev               # Runs on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📡 API Endpoints

| Method | Route | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | No | Create an account & auto-seed initial tasks |
| `POST` | `/api/auth/login` | No | Log in and receive JWT token |
| `GET` | `/api/auth/me` | Yes | Get logged-in user details |
| `GET` | `/api/tasks` | Yes | Get tasks with optional `?status=`, `?priority=`, `?category=`, `?isImportant=`, `?search=`, `?sort=` |
| `GET` | `/api/tasks/stats` | Yes | Detailed counts by status, priority, category, overdue, and upcoming |
| `POST` | `/api/tasks` | Yes | Create a new task (broadcasts via WebSocket) |
| `POST` | `/api/tasks/seed` | Yes | Load/seed DSA and sample tasks |
| `PUT` | `/api/tasks/:id` | Yes | Update task properties (broadcasts via WebSocket) |
| `DELETE` | `/api/tasks/:id` | Yes | Delete task (broadcasts via WebSocket) |
