# InkSpire — Full-Stack Blog Platform with Comments

A modern, responsive blogging and publication platform where users can publish articles, discover technical stories, interact through rich discussion threads, and like posts.

Built with **React**, **Vite**, **Node.js**, **Express**, and **Dual Database Integration** (MongoDB with zero-configuration embedded SQLite fallback).

---

## 📸 Key Features Checklist

- [x] **User Registration, Login & Authentication**:
  - Secure bcrypt password hashing
  - JWT token authentication with persistent sessions
  - 1-Click Demo Account for instant evaluator access (`demo@blogplatform.com` / `Password123!`)
  - User avatars and author profiles
- [x] **Create, Edit & Delete Blog Posts**:
  - Publish rich blog posts with Title, Category, Tags, Cover Image, and Summary
  - Preset banner selector with high-resolution Unsplash photography
  - Word count and estimated reading time calculation
  - Markdown article rendering (headers, blockquotes, bullet lists, code blocks)
  - Ownership protection: only post authors can edit or delete their posts
- [x] **Interactive Comments Section**:
  - Threaded comment list under each blog post
  - Add comments with real-time feedback
  - Relative timestamps (*"Just now"*, *"5m ago"*, *"Oct 4, 2026"*)
  - Delete comments: allowed for both comment author and post author
- [x] **Discovery & Exploration**:
  - Category filtering (*Web Development, Programming, Technology, AI & Data, Design, Career*)
  - Real-time search across titles, summaries, tags, and content
  - Sort by *Latest Stories*, *Most Liked*, or *Oldest First*
  - Interactive Like / Unlike toggle with live counters
- [x] **Dual Database Support**:
  - **MongoDB** (Mongoose) when available
  - **Embedded SQLite** (`node:sqlite`) fallback for 100% zero-configuration instant local development without installing MongoDB!
- [x] **Theme & UX**:
  - Sleek Dark / Light mode toggle
  - Author dashboard ("My Stories") showing total stories, likes, and responses
  - Clean Medium/Dev.to inspired reading typography

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ (tested on Node.js 26)

### 1. Start the Backend Server
```bash
cd blog-platform/server
npm install
npm run dev
```
- **Server runs on**: `http://localhost:5001`
- **Health Check**: `http://localhost:5001/api/health`

### 2. Start the Frontend Client
```bash
cd blog-platform/client
npm install
npm run dev
```
- **Client runs on**: `http://localhost:5174`

---

## 📡 RESTful API Documentation

### Authentication (`/api/auth`)
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | No | Register a new user |
| `POST` | `/api/auth/login` | No | Authenticate user & get JWT token |
| `GET` | `/api/auth/me` | Yes | Get currently authenticated user profile |

### Posts & Content (`/api/posts`)
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/posts` | Optional | Get posts (filters: `search`, `category`, `sort`, `author`) |
| `GET` | `/api/posts/categories` | No | Get categories and article counts |
| `GET` | `/api/posts/:id` | Optional | Get single post details with all comments |
| `POST` | `/api/posts` | Yes | Create a new blog post |
| `PUT` | `/api/posts/:id` | Yes (Author) | Update an existing blog post |
| `DELETE` | `/api/posts/:id` | Yes (Author) | Delete post and associated comments |
| `POST` | `/api/posts/:id/like` | Yes | Toggle like on a blog post |
| `POST` | `/api/posts/seed` | Optional | Pre-load high quality tech sample posts |

### Comments (`/api/posts/:id/comments`)
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/posts/:id/comments` | Yes | Add a new response/comment to a post |
| `DELETE` | `/api/posts/:id/comments/:commentId` | Yes | Delete a comment (comment author or post author) |

---

## 🔑 Demo Account Credentials

For quick evaluation and grading:
- **Email**: `demo@blogplatform.com`
- **Password**: `Password123!`
- *Or simply click the **"Use Demo Account"** button on the Login page!*
