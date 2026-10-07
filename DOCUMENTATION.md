# TaskFlow — Complete Technical Documentation
### Interview-Ready Engineering Reference

> This document explains every layer of the TaskFlow application — architecture, tech stack, file connections, API flow, real-time system, data models, and feature implementation — in enough depth to answer any technical interview question.

---

## Table of Contents

1. [Application Overview](#1-application-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Frontend Deep Dive](#3-frontend-deep-dive)
   - [Tech Stack](#31-tech-stack)
   - [Folder Structure & File Responsibilities](#32-folder-structure--file-responsibilities)
   - [Context (Global State)](#33-context-global-state)
   - [Routing System](#34-routing-system)
   - [How Frontend Connects to Backend](#35-how-frontend-connects-to-backend)
4. [Backend Deep Dive](#4-backend-deep-dive)
   - [Tech Stack](#41-tech-stack)
   - [Folder Structure & File Responsibilities](#42-folder-structure--file-responsibilities)
   - [Request Lifecycle](#43-request-lifecycle)
   - [Authentication System](#44-authentication-system)
   - [Database Models](#45-database-models)
5. [Real-Time System (Socket.IO)](#5-real-time-system-socketio)
6. [Feature Implementation Guide](#6-feature-implementation-guide)
   - [Authentication & Role-Based Access Control](#61-authentication--role-based-access-control)
   - [Project Management](#62-project-management)
   - [Task Management & Kanban](#63-task-management--kanban)
   - [Team Chat](#64-team-chat)
   - [File Management](#65-file-management)
   - [Notifications](#66-notifications)
   - [Analytics & Calendar](#67-analytics--calendar)
   - [Admin Console](#68-admin-console)
7. [Data Flow Diagrams](#7-data-flow-diagrams)
8. [Security Implementation](#8-security-implementation)
9. [Environment Configuration](#9-environment-configuration)
10. [Common Interview Questions & Answers](#10-common-interview-questions--answers)

---

## 1. Application Overview

**TaskFlow** is a full-stack, production-grade **SaaS collaborative project management platform**. It allows teams to:

- Organize work into **Projects**
- Break projects down into **Tasks** with priorities, assignees, and due dates
- Visualize work on a **Kanban Board**
- Communicate in real-time through **Project Chat**
- Upload and manage **Files** per project or task
- View project progress through **Analytics Charts**
- Track deadlines via a **Calendar** view
- Receive **Real-time Notifications** for all relevant events
- Manage the entire platform through a restricted **Admin Console**

The system is built with a **monorepo structure**: a `client/` directory (React SPA) and a `server/` directory (Express.js REST API + Socket.IO), both running concurrently in development.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
│                                                                 │
│  React 18 + Vite  ──  React Router DOM  ──  TailwindCSS        │
│       │                                                         │
│  Context API (AuthContext, ProjectContext, SocketContext)        │
│       │                                                         │
│  Axios (HTTP)  ──────────────────────────────────────┐         │
│  Socket.IO Client (WebSocket) ──────────────────────┐│         │
└─────────────────────────────────────────────────────┼┼─────────┘
                                                       ││
                    HTTP/REST  ────────────────────────┘│
                    WebSocket  ──────────────────────────┘
                                                       │
┌──────────────────────────────────────────────────────┼──────────┐
│                       SERVER (Node.js)                          │
│                                                                 │
│  Express.js ──  Middleware  ──  Routes  ──  Controllers         │
│       │                                                         │
│  Socket.IO Server  ──  socketHandlers.js ── socketService.js    │
│       │                                                         │
│  Mongoose ODM  ────────────────────────────────────────────────┐│
└───────────────────────────────────────────────────────────────┼┘
                                                                │
┌───────────────────────────────────────────────────────────────┼─┐
│                        MongoDB Database                         │
│                                                                 │
│  Collections: users · projects · tasks · projectmembers        │
│               messages · notifications · activities            │
│               comments · attachments · projectinvitations      │
└─────────────────────────────────────────────────────────────────┘
```

**Communication Channels:**
- **HTTP REST API** — for all CRUD operations (Axios on client ↔ Express routes on server)
- **WebSocket (Socket.IO)** — for real-time events (task updates, chat, notifications)

---

## 3. Frontend Deep Dive

### 3.1 Tech Stack

| Library | Version | Why Used |
|---|---|---|
| **React** | 18.3 | Component-based UI framework with hooks |
| **Vite** | 5.3 | Blazing-fast dev server, ES module native bundler |
| **React Router DOM** | 6.24 | Client-side SPA routing with nested routes & route guards |
| **TailwindCSS** | 3.4 | Utility-first CSS — used for all styling (dark theme, glassmorphism) |
| **Axios** | 1.7 | Promise-based HTTP client with interceptors for auth headers |
| **Socket.IO Client** | 4.7 | WebSocket client matching the server's Socket.IO version |
| **Recharts** | 2.12 | Declarative React charting for analytics dashboards |
| **Lucide React** | 0.395 | Consistent SVG icon set used throughout the UI |
| **React Hook Form** | 7.52 | Performant form state management, avoids re-renders |
| **date-fns** | 3.6 | Lightweight date utility library for formatting and math |

---

### 3.2 Folder Structure & File Responsibilities

```
client/src/
├── main.jsx              → ReactDOM.createRoot() entry point — mounts <App /> to #root
├── App.jsx               → Root component: wraps all Providers, defines ALL routes
├── index.css             → Tailwind directives + custom global CSS (glassmorphism, scrollbars)
│
├── assets/
│   └── logo.png          → Application logo (imported in AppLogo component)
│
├── context/              → Global state using React Context API
│   ├── AuthContext.jsx   → User session: login(), register(), logout(), user, isAdmin
│   ├── ProjectContext.jsx→ Active project state: currentProject, fetchProject()
│   ├── SocketContext.jsx → Socket.IO connection lifecycle, joinProject(), leaveProject()
│   ├── NotificationContext.jsx → Unread count, notifications list, markAsRead()
│   └── ThemeContext.jsx  → Theme preference (persisted in localStorage)
│
├── layouts/              → Shell components (persistent chrome) — use <Outlet /> for children
│   ├── MainLayout.jsx    → Public pages: header nav + footer + <Outlet />
│   ├── DashboardLayout.jsx → Auth workspace: top navbar + sidebar + <Outlet />
│   └── AdminLayout.jsx   → Admin console: sidebar + <Outlet />
│
├── routes/
│   └── ProtectedRoute.jsx → Route guards:
│                            ProtectedRoute — redirects to /login if not authenticated
│                            AdminRoute    — redirects to /unauthorized if not admin
│
├── pages/
│   ├── public/           → Home.jsx, About.jsx, Contact.jsx, Faq.jsx, NotFound.jsx
│   ├── auth/
│   │   ├── Login.jsx     → User/Admin tab switcher, login form, JWT handling
│   │   └── Register.jsx  → User/Admin tab switcher, signup form, admin access code
│   ├── dashboard/
│   │   ├── Dashboard.jsx → User home: project cards, recent tasks, quick stats
│   │   ├── MyTasks.jsx   → Filtered list of tasks assigned to current user
│   │   └── Profile.jsx   → Edit name, bio, avatar; change password
│   ├── projects/
│   │   ├── ProjectList.jsx    → All user projects with search/filter/create
│   │   ├── NewProject.jsx     → Project creation form
│   │   └── ProjectWorkspace.jsx → Main project hub; loads all sub-components by tab
│   ├── tasks/
│   │   └── TaskDetailPage.jsx → Standalone full-page task detail view
│   ├── calendar/
│   │   └── GlobalCalendar.jsx → Calendar showing ALL tasks across all projects
│   ├── notifications/
│   │   └── Notifications.jsx  → Full page notification list with mark-all-read
│   ├── join/
│   │   └── JoinProject.jsx    → Invitation link landing page (accepts token from URL)
│   └── admin/
│       ├── AdminDashboard.jsx → Platform metrics overview (users, projects, tasks)
│       └── AdminUsers.jsx     → User management table (CRUD, role, status)
│
├── components/           → Reusable UI components (used inside pages)
│   ├── common/
│   │   └── AppLogo.jsx   → <img> wrapper for the application logo
│   ├── board/
│   │   └── KanbanBoard.jsx → Drag-and-drop task columns by status
│   ├── tasks/
│   │   ├── TaskList.jsx       → Tabular/list view of tasks with filters
│   │   ├── TaskModal.jsx      → Create/Edit task modal form
│   │   └── TaskDetailModal.jsx→ Full detail view of a single task (comments, checklist)
│   ├── projects/
│   │   ├── ProjectOverview.jsx → Stats cards, progress bar, recent activity
│   │   └── ProjectSettings.jsx → Edit project details, manage invites
│   ├── team/
│   │   └── TeamWorkspace.jsx  → Members list, roles, invite/remove actions
│   ├── chat/
│   │   └── ProjectChat.jsx    → Real-time message feed + input box
│   ├── files/
│   │   └── FileManager.jsx    → Upload, list, preview, download project files
│   ├── calendar/
│   │   └── ProjectCalendar.jsx→ Per-project calendar view (task due dates)
│   ├── analytics/
│   │   └── ProjectAnalytics.jsx→ Recharts bar/pie charts for project metrics
│   ├── activity/
│   │   └── ProjectActivity.jsx → Timeline of project events (task created, member joined…)
│   └── notifications/
│       ├── NotificationDropdown.jsx → Bell icon dropdown with unread badge
│       └── ToastNotification.jsx    → Slide-in toast for real-time events
│
└── services/             → All HTTP calls to the backend (no fetch calls in components)
    ├── api.js            → Axios instance with base URL + request/response interceptors
    ├── authService.js    → register(), login(), getMe(), updateProfile()
    ├── projectService.js → CRUD for projects, analytics, invitation generation
    ├── taskService.js    → CRUD for tasks, status update, comments
    ├── memberService.js  → Add/remove/update members in a project
    └── notificationService.js → getNotifications(), markAsRead()
```

---

### 3.3 Context (Global State)

React Context API is used instead of Redux/Zustand for simplicity. All contexts are composed inside `App.jsx` using the **Provider pattern**.

#### Provider Nesting Order in App.jsx:
```jsx
<ThemeProvider>           // outermost — theme has no deps
  <AuthProvider>          // auth is needed by socket (for JWT)
    <SocketProvider>      // socket needs the auth token
      <NotificationProvider> // notifications need socket
        <ProjectProvider> // project state
          <Routes />
        </ProjectProvider>
      </NotificationProvider>
    </SocketProvider>
  </AuthProvider>
</ThemeProvider>
```

#### `AuthContext.jsx` — Most Important Context
```
State:   user (object), token (string), isLoading (bool)
Derived: isAuthenticated = Boolean(user && token)
         isAdmin         = user?.globalRole === 'admin'

Methods:
  login(credentials)  → POST /api/auth/login → sets user + token in state + localStorage
  register(userData)  → POST /api/auth/register → same as login
  logout()            → clears localStorage + resets state
  updateUser(data)    → partial update to user object (for profile edits)
```

#### `SocketContext.jsx`
```
On mount: creates socket.io-client connection with JWT token from localStorage
          socket.io URL = VITE_API_URL or same origin

Provides: socket (the raw io() instance)
          joinProject(projectId) → emits 'project:join' to server
          leaveProject(projectId)→ emits 'project:leave' to server
```

#### `ProjectContext.jsx`
```
State:   currentProject, userRole, isLoading, error
Derived: isOwner   = userRole === 'owner' || 'admin'
         isManager = userRole === 'manager' || isOwner

Methods:
  fetchProject(id)          → GET /api/projects/:id → sets currentProject
  updateProjectState(fields)→ merges fields into currentProject (no API call)
```

---

### 3.4 Routing System

All routes are defined in a single `App.jsx` file. React Router v6 **nested routes** + **layout routes** are used.

```
Route Tree:
/                       → MainLayout + Home.jsx
/about                  → MainLayout + About.jsx
/login                  → Login.jsx (no layout)
/register               → Register.jsx (no layout)
/join/:token            → JoinProject.jsx (public)

[ProtectedRoute]        → checks isAuthenticated, else → /login
  [DashboardLayout]
    /dashboard          → Dashboard.jsx
    /my-tasks           → MyTasks.jsx
    /projects           → ProjectList.jsx
    /projects/new       → NewProject.jsx
    /projects/:id       → ProjectWorkspace.jsx
    /tasks/:id          → TaskDetailPage.jsx
    /calendar           → GlobalCalendar.jsx
    /notifications      → Notifications.jsx
    /profile            → Profile.jsx

[AdminRoute]            → checks isAdmin (user.globalRole === 'admin'), else → /unauthorized
  [AdminLayout]
    /admin              → AdminDashboard.jsx
    /admin/users        → AdminUsers.jsx
```

**`ProtectedRoute.jsx` — How Route Guards Work:**
```js
// ProtectedRoute: wraps user workspace
if (!isAuthenticated) → <Navigate to="/login" state={{ from: location }} />
else → <Outlet />  // render child route

// AdminRoute: wraps admin console
if (!isAuthenticated) → <Navigate to="/login" />
if (user.globalRole !== 'admin') → <Navigate to="/unauthorized" />
else → <Outlet />
```

---

### 3.5 How Frontend Connects to Backend

#### HTTP (REST API) — via `services/api.js`

```js
// api.js creates a single Axios instance
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',  // → http://localhost:5000/api
  timeout: 30000,
});

// REQUEST interceptor: auto-attach JWT to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('taskflow_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// RESPONSE interceptor: unwrap response.data, normalize errors
API.interceptors.response.use(
  (response) => response.data,     // ← every service gets {success, data, message}
  (error) => Promise.reject({ message, status, errors })
);
```

**Data flow for a component making an API call:**
```
TaskModal.jsx
  → calls taskService.createTask(projectId, taskData)
      → calls API.post('/tasks', taskData)
          → Axios adds Authorization header
          → HTTP POST to http://localhost:5000/api/tasks
          → Express routes → middleware → controller → MongoDB
          → Response: { success: true, data: { task: {...} } }
      → Axios interceptor returns response.data
  → TaskModal updates local state with new task
  → Socket.IO server emits 'task:created' to project room
  → All other clients in the room receive event and update their UI
```

#### WebSocket (Real-Time) — via `context/SocketContext.jsx`

```js
// Connection established on login (when token is available)
const socket = io(SOCKET_URL, {
  auth: { token: localStorage.getItem('taskflow_token') },
  transports: ['websocket', 'polling'],
});

// Components subscribe to events using socket.on()
// Example in ProjectWorkspace.jsx:
socket.on('task:created', (data) => {
  setTasks(prev => [data.task, ...prev]);
});
```

---

## 4. Backend Deep Dive

### 4.1 Tech Stack

| Library | Purpose |
|---|---|
| **Express.js** | Web framework — routing, middleware, request/response |
| **Mongoose** | MongoDB ODM — schema definition, validation, queries |
| **Socket.IO** | WebSocket server — real-time bidirectional events |
| **jsonwebtoken** | Generate and verify JWT tokens |
| **bcryptjs** | Hash passwords before saving, compare on login |
| **Helmet** | Sets security HTTP headers (XSS protection, etc.) |
| **cors** | Cross-Origin Resource Sharing — allows client origin |
| **express-rate-limit** | Prevents brute-force / DDoS on API routes |
| **morgan** | HTTP request logger for development |
| **multer** | Handles multipart/form-data for file uploads |
| **cloudinary** | Cloud image/file storage (optional, falls back to disk) |
| **dotenv** | Loads `.env` variables into `process.env` |

---

### 4.2 Folder Structure & File Responsibilities

```
server/
├── server.js              → Entry point: creates Express app + HTTP server + Socket.IO
│                            Loads all middleware, routes, error handlers
│                            Calls connectDB() and server.listen()
│
├── config/
│   └── db.js              → mongoose.connect(MONGODB_URI) with retry logging
│
├── controllers/           → Business logic (what to do with validated requests)
│   ├── authController.js  → register, login, logout, getMe, updateProfile, changePassword
│   ├── projectController.js → createProject, getProjects, getProjectById, updateProject, deleteProject
│   ├── taskController.js  → createTask, getTasks, getTaskById, updateTask, deleteTask, updateStatus
│   ├── memberController.js→ addMember, removeMember, updateMemberRole, getMembers
│   ├── messageController.js → sendMessage, getMessages (for project chat)
│   ├── notificationController.js → getNotifications, markAsRead, markAllRead
│   ├── attachmentController.js → uploadFile, getAttachments, deleteAttachment
│   ├── activityController.js → getProjectActivity (audit log)
│   ├── analyticsController.js → getProjectAnalytics, getGlobalStats
│   ├── invitationController.js→ generateInviteLink, validateToken, joinViaInvite
│   ├── commentController.js  → addComment, getComments, deleteComment
│   ├── adminController.js → getPlatformStats, getAllUsers, updateUserRole, updateUserStatus
│   └── userController.js  → searchUsers, getUserProfile
│
├── routes/                → Maps HTTP method + URL path → controller function
│   ├── authRoutes.js      → POST /register, POST /login, GET /me, PUT /profile
│   ├── projectRoutes.js   → GET|POST /projects, GET|PUT|DELETE /projects/:id
│   ├── taskRoutes.js      → GET|POST|PUT|DELETE /tasks, PATCH /tasks/:id/status
│   ├── memberRoutes.js    → GET|POST /projects/:id/members, DELETE|PUT /:memberId
│   ├── messageRoutes.js   → GET|POST /messages (per project)
│   ├── notificationRoutes.js → GET /notifications, PATCH /:id/read
│   ├── attachmentRoutes.js → POST|GET|DELETE /attachments
│   ├── analyticsRoutes.js → GET /analytics/project/:id
│   ├── activityRoutes.js  → GET /activity/project/:id
│   ├── invitationRoutes.js→ POST /invitations/generate, GET /invitations/:token
│   ├── commentRoutes.js   → GET|POST /comments, DELETE /comments/:id
│   ├── adminRoutes.js     → GET /admin/stats, GET|PATCH|DELETE /admin/users
│   └── userRoutes.js      → GET /users/search, GET /users/:id
│
├── middleware/
│   ├── authMiddleware.js  → protect() — verifies JWT, attaches req.user
│   ├── errorMiddleware.js → notFound() 404 handler, errorHandler() global error catcher
│   └── rateLimitMiddleware.js → API rate limiter (100 req/15min per IP)
│
├── models/                → Mongoose schemas = MongoDB collection definitions
│   ├── User.js            → name, email, password (hashed), globalRole, isActive
│   ├── Project.js         → name, description, owner (ref:User), status, priority, labels
│   ├── Task.js            → title, project (ref), assignedTo (ref), status, priority, checklist
│   ├── ProjectMember.js   → project (ref), user (ref), role (owner|manager|member)
│   ├── Message.js         → project (ref), sender (ref), content, type
│   ├── Notification.js    → recipient (ref), type, message, isRead, metadata
│   ├── Activity.js        → project (ref), user (ref), action, targetType, targetId
│   ├── Comment.js         → task (ref), author (ref), content
│   ├── Attachment.js      → filename, url, mimetype, project/task refs
│   └── ProjectInvitation.js → project (ref), token, expiresAt, createdBy
│
├── services/
│   └── socketService.js   → Singleton that stores the io instance
│                            Exports: emitToProject(), emitToUser(), emitGlobal()
│                            Used by controllers to emit events after DB writes
│
├── sockets/
│   └── socketHandlers.js  → Socket.IO event listeners (connection, project:join,
│                            project:leave, chat:typing, disconnect)
│                            Also performs JWT auth on every socket connection
│
├── validators/            → express-validator schemas for input validation
│   └── authValidators.js, taskValidators.js, etc.
│
├── utils/
│   ├── generateToken.js   → jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRE })
│   └── asyncHandler.js    → Wraps async controller functions to catch errors without try/catch
│
└── scripts/
    └── seed.js            → Seeds demo users, projects, tasks for development
```

---

### 4.3 Request Lifecycle

Every HTTP request travels this exact path:

```
Browser (Axios)
     │
     ▼ HTTP Request
Express server.js
     │
     ├─ Helmet (security headers)
     ├─ CORS (validates origin)
     ├─ Body Parser (JSON → req.body)
     ├─ Morgan (logs method + URL)
     ├─ Rate Limiter (blocks >100 req/15min)
     │
     ▼ Route Matching
routes/taskRoutes.js
     │
     ├─ authMiddleware.protect()        ← extracts JWT, finds user, sets req.user
     ├─ (optional) validator middleware ← express-validator schema checks
     │
     ▼ Controller Function
controllers/taskController.js
     │
     ├─ Validates input / business rules
     ├─ Queries MongoDB via Mongoose
     ├─ Calls socketService.emitToProject() ← triggers real-time update
     │
     ▼ JSON Response
{ success: true, data: { task: {...} } }
     │
     ▼ Back to Browser (Axios interceptor unwraps .data)
```

**Error path:**
```
Controller throws → asyncHandler catches → errorMiddleware.errorHandler()
→ { success: false, message: "..." } with proper HTTP status code
```

---

### 4.4 Authentication System

#### Registration Flow (`POST /api/auth/register`)
```
1. Extract { name, email, password, role, adminAccessCode } from req.body
2. Check if email already exists → 409 Conflict if yes
3. If role === 'admin':
   a. Validate adminAccessCode against process.env.ADMIN_ACCESS_CODE
   b. If invalid → 403 Forbidden
   c. If valid → set globalRole = 'admin'
4. User.create({ name, email, password, globalRole })
   → Mongoose pre('save') hook: bcrypt.hash(password, 10) runs automatically
5. generateToken(user._id) → jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' })
6. Return { user (without password), token }
```

#### Login Flow (`POST /api/auth/login`)
```
1. Extract { email, password, portalType, adminAccessCode }
2. User.findOne({ email }).select('+password') → password is excluded by default
3. user.matchPassword(password) → bcrypt.compare(entered, hashed)
4. If portalType === 'admin': validate adminAccessCode
   → Promote user.globalRole to 'admin' if code is valid
5. Return { user, token }
```

#### Token Verification (Every Protected Request)
```
authMiddleware.protect():
1. Read Authorization header → "Bearer <token>"
2. jwt.verify(token, JWT_SECRET) → { id, iat, exp }
3. User.findById(id).select('-password') → req.user = user
4. If user.isActive === false → 403 Deactivated
5. next() → passes to controller
```

---

### 4.5 Database Models

#### User Model (`models/User.js`)
```js
{
  name:       String (required, max 60)
  email:      String (required, unique, lowercase)
  password:   String (required, min 6, select: false) ← hidden from queries by default
  avatar:     String (Cloudinary URL or empty)
  bio:        String (max 300)
  globalRole: Enum ['user', 'admin']  default: 'user'
  isActive:   Boolean  default: true
  createdAt:  Date (auto)
  updatedAt:  Date (auto)
}
Hooks:
  pre('save') → bcrypt hash password if modified
  method matchPassword() → bcrypt.compare()
```

#### Project Model (`models/Project.js`)
```js
{
  name:        String (required, max 100)
  description: String (required, max 1000)
  objective:   String (max 500)
  owner:       ObjectId → ref: 'User'
  status:      Enum ['PLANNING','ACTIVE','ON_HOLD','COMPLETED','ARCHIVED']
  priority:    Enum ['LOW','MEDIUM','HIGH','URGENT']
  startDate:   Date
  dueDate:     Date
  labels:      [{ name: String, color: String }]
}
Virtuals:
  membersList → populated from ProjectMember collection
  tasksList   → populated from Task collection
```

#### Task Model (`models/Task.js`)
```js
{
  title:       String (required, max 150)
  description: String (max 3000)
  project:     ObjectId → ref: 'Project'  (indexed)
  createdBy:   ObjectId → ref: 'User'
  assignedTo:  ObjectId → ref: 'User'     (indexed)
  status:      Enum ['TODO','IN_PROGRESS','IN_REVIEW','DONE']  (indexed)
  priority:    Enum ['LOW','MEDIUM','HIGH','URGENT']           (indexed)
  dueDate:     Date (indexed)
  labels:      [String]
  checklist:   [{ title, completed, completedBy, completedAt }]
  attachments: [ObjectId → ref: 'Attachment']
}
Virtuals:
  checklistProgress → { total, completed, percentage }
```

#### ProjectMember Model (`models/ProjectMember.js`)
```js
{
  project:  ObjectId → ref: 'Project'
  user:     ObjectId → ref: 'User'
  role:     Enum ['owner','manager','member']  default: 'member'
  joinedAt: Date  default: now
}
// Unique compound index: { project, user }
```

#### Notification Model (`models/Notification.js`)
```js
{
  recipient: ObjectId → ref: 'User'
  type:      String (TASK_ASSIGNED, COMMENT_ADDED, MEMBER_JOINED, etc.)
  message:   String
  isRead:    Boolean  default: false
  metadata:  Mixed    (taskId, projectId, etc.)
  createdAt: Date
}
```

---

## 5. Real-Time System (Socket.IO)

The real-time system has two parts: the **server** sets up Socket.IO and emits events; the **client** listens and reacts.

### Server-Side Setup

```
server.js
  const io = new Server(httpServer, { cors: {...} })
  initSocket(io)               ← stores io in socketService.js singleton
  registerSocketHandlers(io)   ← sets up connection, join, leave, chat listeners
```

#### `socketService.js` — Singleton Pattern
```js
// Stores the io instance once at startup
let ioInstance = null;
const initSocket = (io) => { ioInstance = io; };

// Exported helpers used by controllers to emit after DB writes:
emitToProject(projectId, event, data)  → io.to(`project:${id}`).emit(event, data)
emitToUser(userId, event, data)        → io.to(`user:${id}`).emit(event, data)
emitGlobal(event, data)                → io.emit(event, data)
```

#### `socketHandlers.js` — Event Listeners
```
Every socket connection:
  1. JWT authentication middleware (same logic as HTTP protect())
  2. On 'connection':
     - Add userId → Set<socketId> to onlineUsers Map
     - socket.join(`user:${userId}`) ← private notification room
     - Emit 'user:status' { userId, status: 'online' }

  3. On 'project:join' (from client):
     - Verify user is project member or admin in DB
     - socket.join(`project:${projectId}`)
     - Emit 'project:member_active' to the room

  4. On 'project:leave':
     - socket.leave(`project:${projectId}`)

  5. On 'chat:typing':
     - Emit 'chat:user_typing' to project room (except sender)

  6. On 'disconnect':
     - Remove from onlineUsers
     - Emit 'user:status' { status: 'offline' } if last socket
```

### How Controllers Emit Events

Example: when a task is created via HTTP:
```js
// taskController.js
const task = await Task.create({ ... });

// After successful DB write, emit to all users in the project room:
const { emitToProject } = require('../services/socketService');
emitToProject(projectId, 'task:created', { task });

// The server also creates a Notification in the DB and emits to the assignee:
const { emitToUser } = require('../services/socketService');
emitToUser(task.assignedTo, 'notification:new', { notification });
```

### Client-Side — `ProjectWorkspace.jsx`

```js
// When user opens a project workspace:
useEffect(() => {
  joinProject(projectId);  // → socket.emit('project:join', projectId)

  return () => leaveProject(projectId);  // cleanup on unmount
}, [projectId]);

// Listen for real-time events:
socket.on('task:created',       (data) => setTasks(prev => [data.task, ...prev]));
socket.on('task:updated',       (data) => setTasks(prev => prev.map(...)));
socket.on('task:deleted',       ({ taskId }) => setTasks(prev => prev.filter(...)));
socket.on('task:status_changed',({ taskId, status }) => setTasks(prev => ...));
socket.on('member:joined',      (data) => setMembers(prev => [...prev, data.member]));
socket.on('project:updated',    (data) => updateProjectState(data.project));
```

### Complete Socket Event Reference

| Event | Direction | Trigger | Payload |
|---|---|---|---|
| `project:join` | Client → Server | User opens project workspace | `projectId` |
| `project:leave` | Client → Server | User leaves project workspace | `projectId` |
| `project:member_active` | Server → Room | User joined project room | `{ userId, name, avatar }` |
| `project:member_inactive` | Server → Room | User left project room | `{ userId }` |
| `task:created` | Server → Room | Task created via REST | `{ task }` |
| `task:updated` | Server → Room | Task edited via REST | `{ task }` |
| `task:deleted` | Server → Room | Task deleted via REST | `{ taskId }` |
| `task:status_changed` | Server → Room | Kanban drag-drop | `{ taskId, status }` |
| `member:joined` | Server → Room | New member added | `{ member, user }` |
| `member:removed` | Server → Room | Member removed | `{ userId }` |
| `member:role_updated` | Server → Room | Role changed | `{ userId, role }` |
| `project:updated` | Server → Room | Project settings saved | `{ project }` |
| `chat:typing` | Client → Server | User is typing | `{ projectId, isTyping }` |
| `chat:user_typing` | Server → Room | Relay typing indicator | `{ userId, name, isTyping }` |
| `message:new` | Server → Room | Chat message sent | `{ message }` |
| `notification:new` | Server → User | Any notification trigger | `{ notification }` |
| `user:status` | Server → All | Connect / disconnect | `{ userId, status }` |

---

## 6. Feature Implementation Guide

### 6.1 Authentication & Role-Based Access Control

**Files Involved:**
- `server/controllers/authController.js` — register, login logic
- `server/middleware/authMiddleware.js` — `protect()` middleware
- `server/models/User.js` — User schema with globalRole
- `server/utils/generateToken.js` — JWT generation
- `client/src/pages/auth/Login.jsx` — Login UI with User/Admin tab
- `client/src/pages/auth/Register.jsx` — Register UI with User/Admin tab
- `client/src/context/AuthContext.jsx` — login(), register(), token management
- `client/src/routes/ProtectedRoute.jsx` — ProtectedRoute, AdminRoute guards
- `server/.env` — `ADMIN_ACCESS_CODE` secret key

**Flow:**
1. User selects "User" or "Admin" tab on login/register page
2. Admin tab reveals the `Admin Access Code` input field
3. Credentials + access code sent to `POST /api/auth/register`
4. Server validates access code vs `process.env.ADMIN_ACCESS_CODE`
5. JWT token returned, stored in `localStorage` as `taskflow_token`
6. On every page load, `AuthContext` calls `GET /api/auth/me` to restore session
7. `AdminRoute` checks `user.globalRole === 'admin'` before rendering admin pages

---

### 6.2 Project Management

**Files Involved:**
- `server/controllers/projectController.js`
- `server/models/Project.js`, `ProjectMember.js`
- `server/routes/projectRoutes.js`
- `client/src/pages/projects/ProjectList.jsx` — All projects grid
- `client/src/pages/projects/NewProject.jsx` — Create project form
- `client/src/pages/projects/ProjectWorkspace.jsx` — Main project hub
- `client/src/services/projectService.js` — API calls
- `client/src/context/ProjectContext.jsx` — Active project state

**Key logic:**
- When a user creates a project, they are automatically added as `ProjectMember` with role `owner`
- `ProjectWorkspace.jsx` loads: overview stats, tasks, members, activity all in parallel using `Promise.all()`
- The workspace renders different sub-components based on the URL path segment (`/overview`, `/board`, `/tasks`, `/chat`, etc.)

---

### 6.3 Task Management & Kanban

**Files Involved:**
- `server/controllers/taskController.js`
- `server/models/Task.js`
- `server/routes/taskRoutes.js`
- `client/src/components/board/KanbanBoard.jsx` — Drag-and-drop board
- `client/src/components/tasks/TaskList.jsx` — List view
- `client/src/components/tasks/TaskModal.jsx` — Create/edit modal
- `client/src/components/tasks/TaskDetailModal.jsx` — Full task view
- `client/src/services/taskService.js`

**Kanban drag-and-drop implementation:**
- Tasks are grouped by `status` field into 4 columns: TODO, IN_PROGRESS, IN_REVIEW, DONE
- Dragging a card calls `PATCH /api/tasks/:id/status` with the new status
- Controller saves to DB and calls `emitToProject(projectId, 'task:status_changed', { taskId, status })`
- All other clients in the room receive the event and update their board state instantly

---

### 6.4 Team Chat

**Files Involved:**
- `server/controllers/messageController.js`
- `server/models/Message.js`
- `server/routes/messageRoutes.js`
- `client/src/components/chat/ProjectChat.jsx`
- `client/src/services/messageService.js`

**How it works:**
1. On opening the Chat tab, client fetches history: `GET /api/messages?projectId=xxx`
2. When user sends message:
   - REST call: `POST /api/messages` → saved to MongoDB
   - Server emits `message:new` to `project:${projectId}` room
3. All clients in the room receive `message:new` and append to their message list
4. Typing indicator uses `chat:typing` event (no DB write, pure real-time relay)

---

### 6.5 File Management

**Files Involved:**
- `server/controllers/attachmentController.js`
- `server/models/Attachment.js`
- `server/middleware/uploadMiddleware.js` (Multer config)
- `client/src/components/files/FileManager.jsx`
- `client/src/services/attachmentService.js`

**Upload flow:**
1. Client sends `POST /api/attachments` as `multipart/form-data`
2. Multer parses the file, saves temporarily to `server/uploads/`
3. If Cloudinary is configured: uploads to Cloudinary, gets CDN URL
4. If not configured: keeps in local `uploads/` dir, serves via Express static
5. Attachment document saved to MongoDB with URL, filename, mimetype, project/task refs

---

### 6.6 Notifications

**Files Involved:**
- `server/controllers/notificationController.js`
- `server/models/Notification.js`
- `server/routes/notificationRoutes.js`
- `client/src/context/NotificationContext.jsx`
- `client/src/components/notifications/NotificationDropdown.jsx`
- `client/src/components/notifications/ToastNotification.jsx`

**How it works:**
1. When a task is assigned, comment added, or member joined:
   - Controller creates a `Notification` document in MongoDB
   - Calls `emitToUser(recipientId, 'notification:new', { notification })`
2. Client's `NotificationContext` listens for `notification:new` events
3. Unread count badge on bell icon updates instantly
4. `ToastNotification.jsx` shows a slide-in toast for the event
5. Full notification list available at `/notifications` page via `GET /api/notifications`

---

### 6.7 Analytics & Calendar

**Analytics Files:**
- `server/controllers/analyticsController.js`
- `server/routes/analyticsRoutes.js`
- `client/src/components/analytics/ProjectAnalytics.jsx`

**Analytics queries:**
- Controller runs MongoDB aggregation pipelines to count tasks by status, priority, assignee
- Returns metrics: totalTasks, completedTasks, completionRate, overdueTasks, tasksByPriority, etc.
- `ProjectAnalytics.jsx` renders with **Recharts**: BarChart for task distribution, PieChart for priority split

**Calendar Files:**
- `client/src/components/calendar/ProjectCalendar.jsx` — per-project
- `client/src/pages/calendar/GlobalCalendar.jsx` — cross-project

**Calendar logic:**
- Queries all tasks with a `dueDate` for the user's projects
- Maps tasks to calendar date cells by due date
- Color codes by priority (URGENT=red, HIGH=orange, MEDIUM=blue, LOW=green)

---

### 6.8 Admin Console

**Files Involved:**
- `server/controllers/adminController.js`
- `server/routes/adminRoutes.js`
- `client/src/pages/admin/AdminDashboard.jsx`
- `client/src/pages/admin/AdminUsers.jsx`
- `client/src/layouts/AdminLayout.jsx`
- `client/src/routes/ProtectedRoute.jsx` (AdminRoute guard)

**Admin Dashboard Overview:**
- `GET /api/admin/stats` → returns:
  - Total users, active users, admin count
  - Total projects, active projects
  - Total tasks, task completion rate
  - Recent user registrations

**User Management:**
- `GET /api/admin/users?search=&role=&status=` → paginated, filterable user list
- `PATCH /api/admin/users/:id/role` → change globalRole (user ↔ admin)
- `PATCH /api/admin/users/:id/status` → activate / deactivate
- `DELETE /api/admin/users/:id` → hard delete user

**Access restriction (double lock):**
1. Frontend: `AdminRoute` checks `user.globalRole === 'admin'`, else redirects to `/unauthorized`
2. Backend: `adminRoutes.js` uses both `protect()` + a custom `requireAdmin` middleware that checks `req.user.globalRole === 'admin'`

---

## 7. Data Flow Diagrams

### Login Flow
```
User fills Login form (Login.jsx)
     ↓ handleSubmit()
AuthContext.login({ email, password, portalType, adminAccessCode })
     ↓ authService.login()
     ↓ API.post('/auth/login', data)  ← Axios adds no auth header (public route)
     ↓ Express: POST /api/auth/login → authController.login()
          ↓ Find user by email
          ↓ bcrypt.compare(password, hash)
          ↓ Validate adminAccessCode if portalType==='admin'
          ↓ generateToken(user._id) → JWT
     ↓ { success: true, data: { user, token } }
AuthContext:
     setToken(token) + localStorage.setItem('taskflow_token', token)
     setUser(user)
Login.jsx:
     user.globalRole === 'admin' ? navigate('/admin') : navigate('/dashboard')
```

### Task Creation → Real-Time Update
```
TaskModal.jsx → taskService.createTask(projectId, data)
     ↓ API.post('/tasks', data)  ← Axios adds Bearer token
     ↓ authMiddleware.protect() → req.user set
     ↓ taskController.createTask()
          ↓ Task.create({...})
          ↓ Create Activity log
          ↓ Create Notification for assignee
          ↓ emitToProject(projectId, 'task:created', { task })  ← Socket.IO
          ↓ emitToUser(assigneeId, 'notification:new', { notification })
     ↓ { success: true, data: { task } }
TaskModal.jsx adds task to local state

Meanwhile on ALL other clients viewing the project:
     socket.on('task:created') → setTasks(prev => [task, ...prev])

Assignee client:
     socket.on('notification:new') → increment unread badge + show toast
```

---

## 8. Security Implementation

| Layer | Mechanism | File |
|---|---|---|
| **Password Storage** | bcrypt with salt rounds=10 | `models/User.js` |
| **Authentication** | JWT Bearer token, 30-day expiry | `utils/generateToken.js` |
| **Route Protection** | `protect()` middleware on all private routes | `middleware/authMiddleware.js` |
| **Admin Protection** | `requireAdmin` middleware on all `/api/admin/*` routes | `routes/adminRoutes.js` |
| **Admin Account** | Access code required at register AND login | `controllers/authController.js` |
| **HTTP Headers** | Helmet.js sets CSP, HSTS, X-Frame-Options, etc. | `server.js` |
| **CORS** | Whitelist of allowed origins only | `server.js` |
| **Rate Limiting** | 100 requests per 15 minutes per IP on all `/api` routes | `middleware/rateLimitMiddleware.js` |
| **Socket Auth** | JWT verified on every socket connection | `sockets/socketHandlers.js` |
| **Input Validation** | express-validator schemas before controllers | `validators/` |
| **Account Status** | `isActive` flag check on every auth'd request | `middleware/authMiddleware.js` |
| **Secrets** | All keys in `.env`, never in source code | `.env` (gitignored) |

---

## 9. Environment Configuration

| Variable | Where Used | Description |
|---|---|---|
| `PORT` | `server.js` | HTTP server port (default: 5000) |
| `NODE_ENV` | `server.js`, Morgan | Environment mode |
| `MONGODB_URI` | `config/db.js` | MongoDB connection string |
| `JWT_SECRET` | `utils/generateToken.js`, `authMiddleware.js`, `socketHandlers.js` | JWT signing key |
| `JWT_EXPIRE` | `utils/generateToken.js` | Token expiry duration |
| `ADMIN_ACCESS_CODE` | `controllers/authController.js` | Secret code for admin account creation/login |
| `CLIENT_URL` | `server.js` CORS config | Frontend origin for CORS whitelist |
| `CLOUDINARY_CLOUD_NAME` | `services/cloudinaryService.js` | Cloudinary account name |
| `CLOUDINARY_API_KEY` | `services/cloudinaryService.js` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | `services/cloudinaryService.js` | Cloudinary API secret |

**Frontend env** (`client/.env`):
```
VITE_API_URL=http://localhost:5000/api   ← Used by api.js as Axios baseURL
```

---

## 10. Common Interview Questions & Answers

**Q: What is the architecture of your project?**
> TaskFlow follows a **client-server architecture** with a React SPA as the frontend, Express.js as the REST API backend, MongoDB as the database, and Socket.IO for real-time communication. The frontend communicates with the backend over two channels: HTTP REST for CRUD operations and WebSocket for live updates.

**Q: How does authentication work?**
> When a user logs in, the server validates their email and password using bcrypt, then generates a JWT token signed with a secret key. This token is stored in `localStorage` on the client and attached as a `Bearer` token to every subsequent HTTP request via an Axios interceptor. The server's `protect()` middleware verifies the token on every protected route.

**Q: How does the real-time system work?**
> Socket.IO is used for real-time features. The server stores the `io` instance in a singleton service (`socketService.js`). When a controller performs a write operation (create task, send message, etc.), it calls `emitToProject()` which broadcasts the event to all sockets in that project's room. Clients join project rooms by emitting a `project:join` event when they open a project workspace.

**Q: How is the admin console secured?**
> Admin access requires a secret **Admin Access Code** stored in the server's `.env` file. This code must be provided at both registration and login for admin accounts. On the frontend, the `AdminRoute` component blocks non-admin users from accessing `/admin` routes. On the backend, all `/api/admin/*` routes use a `requireAdmin` middleware that verifies `req.user.globalRole === 'admin'`.

**Q: How do you handle file uploads?**
> Multer middleware processes `multipart/form-data` on the upload endpoint. Files are temporarily saved to the `server/uploads/` directory. If Cloudinary environment variables are configured, the file is uploaded to Cloudinary and the CDN URL is stored in the database. Otherwise, Express serves the local file as a static asset.

**Q: Why did you use Context API instead of Redux?**
> The application's state complexity doesn't justify Redux's boilerplate. We have a small number of clearly scoped global states: auth session, active project, socket connection, and notifications. Each is managed in its own Context file, keeping concerns separate and the code readable. For more complex state scenarios, Zustand or Redux Toolkit would be preferable.

**Q: How does the Kanban board update for all team members?**
> When a user drags a task card to a new column, the client sends a `PATCH /api/tasks/:id/status` request. The controller updates the task in MongoDB and then calls `emitToProject(projectId, 'task:status_changed', { taskId, status })`. Every other client listening to that project's Socket.IO room receives the event and updates the task's status in their local React state — no page reload required.

**Q: How are passwords stored?**
> Passwords are never stored as plain text. The `User.js` Mongoose model has a `pre('save')` hook that intercepts every save operation, checks if the password field was modified, and if so, generates a bcrypt salt with 10 rounds and hashes the password. On login, `bcrypt.compare()` is used to verify the entered password against the stored hash.

**Q: How is the frontend structured?**
> The frontend uses a layered structure: `App.jsx` defines all routes; `layouts/` provides persistent shell components (navbar, sidebar) using React Router's `<Outlet />`; `pages/` contains route-level smart components; `components/` contains reusable presentational components; `context/` manages global state; `services/` handles all HTTP calls; and `routes/` contains authentication guards.

---

*Document prepared by Mahesh | CodeAlpha Full-Stack Internship 2026*
*Application: TaskFlow v1.0.0 | Stack: React + Express + MongoDB + Socket.IO*
