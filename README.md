
# TaskFlow

### Collaborative Project Management & Team Workspace

**A full-stack SaaS platform for real-time task tracking, Kanban boards, team chat, file sharing, and project analytics.**

 🏆 Built as part of the **CodeAlpha Full-Stack Development Internship**


## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Role-Based Access Control](#-role-based-access-control)
- [Real-Time Features](#-real-time-features)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**TaskFlow** is a production-grade, full-stack collaborative project management platform that enables teams to plan, track, and deliver work efficiently. It provides real-time collaboration through WebSocket-powered updates, a beautiful dark-mode UI, and a secure role-based access system for both regular users and administrators.

---

## ✨ Features

### 🗂️ Project Management
- Create, edit, and archive projects with rich metadata (name, description, color, status)
- Project-level roles: **Owner**, **Manager**, **Member**
- Invite team members via shareable invite links
- Project analytics with completion rates, progress charts, and overdue tracking

### ✅ Task Management
- Full CRUD for tasks with priority levels (Low / Medium / High / Critical)
- Task statuses: **Todo → In Progress → In Review → Done**
- Due dates, assignees, labels, comments, and file attachments per task
- Task filtering, search, and bulk-status updates

### 📊 Kanban Board
- Drag-and-drop Kanban view for visual task management
- Column-based workflow mirroring task status
- Real-time card updates visible across all team members instantly

### 💬 Team Chat
- Per-project real-time chat powered by Socket.IO
- Message history persisted in MongoDB
- Online presence indicators

### 📁 File Manager
- Upload and manage project files and task attachments
- Cloudinary integration for cloud storage (falls back to local disk)
- File preview and download

### 📅 Calendar View
- Project-level calendar showing task due dates and milestones
- Monthly and weekly views

### 📈 Project Analytics
- Visual charts (Recharts) for task distribution, progress over time, and team workload
- Per-project metrics: total tasks, completed, in-progress, overdue, member count

### 🔔 Notifications
- Real-time in-app notifications for task assignments, comments, and project updates
- Unread badge count with dropdown panel

### 🛡️ Admin Console
- Secure Admin Dashboard with platform-wide **Overview** metrics
- **User Management**: view, activate/deactivate, and change roles of all users
- Admin access protected by a secret **Admin Access Code** (stored in `.env`)

### 🔐 Authentication & Security
- JWT-based authentication with 30-day token expiry
- Role-based sign-up and login (User / Admin portals)
- Admin accounts require a secret access code at both registration and login
- Rate limiting, Helmet security headers, and CORS protection
- Password hashing with bcrypt

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | 18.3 | UI Framework |
| **Vite** | 5.3 | Build Tool & Dev Server |
| **React Router DOM** | 6.24 | Client-side Routing |
| **TailwindCSS** | 3.4 | Utility-first Styling |
| **Socket.IO Client** | 4.7 | Real-time WebSocket Communication |
| **Axios** | 1.7 | HTTP Client |
| **Recharts** | 2.12 | Data Visualization / Charts |
| **Lucide React** | 0.395 | Icon Library |
| **React Hook Form** | 7.52 | Form State Management |
| **date-fns** | 3.6 | Date Formatting Utilities |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | ≥18.x | Runtime Environment |
| **Express.js** | 4.19 | Web Framework |
| **MongoDB** | Atlas / Local | Primary Database |
| **Mongoose** | 8.5 | ODM / Schema Modeling |
| **Socket.IO** | 4.7 | Real-time WebSockets |
| **JSON Web Token** | 9.0 | Authentication Tokens |
| **bcryptjs** | 2.4 | Password Hashing |
| **Cloudinary** | 1.41 | Cloud File Storage |
| **Multer** | 1.4 | File Upload Handling |
| **Helmet** | 7.1 | HTTP Security Headers |
| **express-rate-limit** | 7.3 | API Rate Limiting |
| **morgan** | 1.10 | HTTP Request Logging |
| **dotenv** | 16.4 | Environment Configuration |

---

## 📁 Project Structure

```
TaskFlow/
├── client/                          # React frontend (Vite)
│   ├── index.html
│   ├── src/
│   │   ├── assets/                  # Static assets (logo, images)
│   │   ├── components/
│   │   │   ├── activity/            # Activity feed
│   │   │   ├── analytics/           # Project charts & metrics
│   │   │   ├── board/               # Kanban board
│   │   │   ├── calendar/            # Calendar view
│   │   │   ├── chat/                # Real-time project chat
│   │   │   ├── common/              # Shared UI (AppLogo, etc.)
│   │   │   ├── files/               # File manager
│   │   │   ├── notifications/       # Notification dropdown & toasts
│   │   │   ├── projects/            # Project overview & settings
│   │   │   ├── tasks/               # Task list, modal, detail view
│   │   │   └── team/                # Team workspace
│   │   ├── context/
│   │   │   ├── AuthContext.jsx      # Authentication state
│   │   │   ├── ProjectContext.jsx   # Active project state
│   │   │   ├── SocketContext.jsx    # WebSocket connection
│   │   │   └── ThemeContext.jsx     # Theme management
│   │   ├── layouts/
│   │   │   ├── AdminLayout.jsx      # Admin console shell
│   │   │   ├── DashboardLayout.jsx  # User workspace shell
│   │   │   └── MainLayout.jsx       # Public pages shell
│   │   ├── pages/
│   │   │   ├── admin/               # AdminDashboard, AdminUsers
│   │   │   ├── auth/                # Login, Register
│   │   │   ├── dashboard/           # User Dashboard
│   │   │   ├── projects/            # ProjectList, ProjectWorkspace
│   │   │   ├── tasks/               # Task pages
│   │   │   └── public/              # Home, About, FAQ, Contact
│   │   ├── routes/
│   │   │   └── ProtectedRoute.jsx   # Auth & Admin guards
│   │   └── services/
│   │       ├── api.js               # Axios instance + interceptors
│   │       ├── authService.js
│   │       ├── projectService.js
│   │       ├── taskService.js
│   │       └── memberService.js
│   └── package.json
│
├── server/                          # Express.js backend
│   ├── server.js                    # Entry point, HTTP + Socket.IO init
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js        # Register, Login, Profile
│   │   ├── adminController.js       # Admin metrics & user management
│   │   ├── projectController.js
│   │   ├── taskController.js
│   │   ├── memberController.js
│   │   ├── messageController.js
│   │   ├── notificationController.js
│   │   └── fileController.js
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verification
│   │   └── errorMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── Task.js
│   │   ├── ProjectMember.js
│   │   ├── Message.js
│   │   ├── Notification.js
│   │   ├── Activity.js
│   │   ├── Comment.js
│   │   ├── Attachment.js
│   │   └── ProjectInvitation.js
│   ├── routes/
│   ├── sockets/                     # Socket.IO event handlers
│   ├── services/                    # Business logic services
│   ├── validators/                  # express-validator schemas
│   ├── utils/
│   ├── scripts/
│   │   └── seed.js                  # Database seeding script
│   ├── .env.example
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- **Node.js** v18 or higher — [Download](https://nodejs.org/)
- **npm** v9 or higher (comes with Node.js)
- **MongoDB** — [MongoDB Atlas](https://www.mongodb.com/atlas) (cloud, free tier) or [local install](https://www.mongodb.com/try/download/community)
- **Git** — [Download](https://git-scm.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/taskflow.git
cd taskflow
```

### 2. Setup the Server (Backend)

```bash
cd server
npm install
```

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

> See [Environment Variables](#-environment-variables) for a full description of each variable.

Start the development server:

```bash
npm run dev
```

The API will be available at **`http://localhost:5000`**

### 3. Setup the Client (Frontend)

Open a **new terminal**, then:

```bash
cd client
npm install
npm run dev
```

The frontend will be available at **`http://localhost:5173`**

### 4. (Optional) Seed the Database

To populate the database with sample data for testing:

```bash
cd server
npm run seed
```

---

## 🔐 Environment Variables

Create a `.env` file inside the `/server` directory based on `.env.example`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/taskflow
# or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/taskflow

# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=30d

# Admin Security
# Anyone who knows this code can register/login as an Admin
ADMIN_ACCESS_CODE=your_secret_admin_code_here

# CORS
CLIENT_URL=http://localhost:5173

# Cloudinary (Optional - falls back to local disk storage if not set)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

> ⚠️ **Never commit your `.env` file to version control.** It is already listed in `.gitignore`.

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user or admin | Public |
| `POST` | `/api/auth/login` | Login with email, password (+ admin code) | Public |
| `POST` | `/api/auth/logout` | Logout (client clears token) | Private |
| `GET` | `/api/auth/me` | Get current user profile | Private |
| `PUT` | `/api/auth/profile` | Update profile (name, bio, avatar) | Private |
| `PUT` | `/api/auth/change-password` | Change password | Private |

### Projects
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/projects` | List all projects for current user | Private |
| `POST` | `/api/projects` | Create a new project | Private |
| `GET` | `/api/projects/:id` | Get project details | Private |
| `PUT` | `/api/projects/:id` | Update project | Owner/Manager |
| `DELETE` | `/api/projects/:id` | Delete project | Owner |

### Tasks
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/projects/:id/tasks` | List tasks in a project | Member |
| `POST` | `/api/projects/:id/tasks` | Create a task | Member |
| `PUT` | `/api/tasks/:id` | Update task | Member |
| `DELETE` | `/api/tasks/:id` | Delete task | Member |
| `PATCH` | `/api/tasks/:id/status` | Update task status | Member |

### Admin
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/admin/stats` | Platform-wide overview metrics | Admin |
| `GET` | `/api/admin/users` | List all users with filters | Admin |
| `PATCH` | `/api/admin/users/:id/role` | Change a user's global role | Admin |
| `PATCH` | `/api/admin/users/:id/status` | Activate / deactivate a user | Admin |
| `DELETE` | `/api/admin/users/:id` | Delete a user account | Admin |

---

## 🛡️ Role-Based Access Control

TaskFlow implements a two-layer role system:

### Global Roles (Platform-level)
| Role | Description |
|---|---|
| `user` | Default role. Can create and manage their own projects. |
| `admin` | Full platform access. Can access the Admin Console. |

### Project Roles (Per-project level)
| Role | Permissions |
|---|---|
| `owner` | Full control: edit/delete project, manage all members and tasks |
| `manager` | Can edit project settings, assign tasks, manage members |
| `member` | Can create/edit/complete tasks. Cannot delete projects. |

### Admin Account Creation

To create an admin account:
1. Navigate to `/register`
2. Switch to the **Admin** tab
3. Provide **Name**, **Email**, **Password**, and the **Admin Access Code** (set in your `.env`)
4. On successful registration, you are automatically redirected to the **Admin Dashboard**

> The Admin Access Code is kept in `.env` and is **never exposed** in the UI or source code.

---

## ⚡ Real-Time Features

TaskFlow uses **Socket.IO** for bidirectional, event-driven communication. When you open a project workspace, your client automatically joins a Socket.IO room for that project.

### Emitted Events
| Event | Trigger |
|---|---|
| `task:created` | A new task is created |
| `task:updated` | A task's details are modified |
| `task:deleted` | A task is removed |
| `task:status_changed` | A task is moved between Kanban columns |
| `member:joined` | A new member joins the project |
| `member:removed` | A member is removed from the project |
| `project:updated` | Project settings are changed |
| `message:new` | A new chat message is sent |
| `notification:new` | A notification is triggered |

All team members viewing the same project see updates **instantly** — no page refresh required.

---

## 📸 Screenshots

> _Coming soon — run the app locally to see it in action!_

### Login / Register
- Clean dark-themed auth pages with User/Admin portal switcher
- Admin login requires Email + Password + Admin Access Code

### Project Dashboard
- Overview cards with live task metrics
- Kanban board with drag-and-drop
- Real-time team chat sidebar

### Admin Console
- Platform overview with total users, projects, tasks
- Full user management table with role/status controls

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. **Fork** the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a **Pull Request**

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by Mahesh** &nbsp;|&nbsp; CodeAlpha Full-Stack Internship 2026

<br/>

⭐ If you found this project helpful, please give it a **star**!

</div>
