# Project Camp Backend

Project Camp is a RESTful backend API for collaborative project management. It provides authentication, project/member management, tasks, subtasks, project notes, file attachments, validation, role-based authorization, and email-based verification/password recovery.

## Tech Stack

- Node.js
- Express.js 5
- MongoDB + Mongoose
- JWT
- bcrypt
- express-validator
- Nodemailer + Mailgen
- Multer
- Cookie-based authentication
- REST API architecture

## Features

### Authentication

- User registration with email verification
- Password hashing with bcrypt
- JWT access and refresh tokens
- HTTP-only cookies
- Bearer access-token support
- Login/logout
- Current-user endpoint
- Change password
- Email verification and resend flow
- Forgot-password/reset-password flow
- SHA-256 hashed temporary tokens with expiry
- Refresh-token rotation and revocation

### Project Management

- Create, list, view, update, and delete projects
- Automatic creator membership as `admin`
- Project member listing
- Add existing users to projects
- Update member roles
- Remove members
- Prevent removal/demotion of the final project administrator
- Unassign removed members from their tasks
- Cascade cleanup of members, tasks, subtasks, notes, and task attachment files when a project is deleted

### Roles

Roles are scoped per project:

| Role | Permissions |
| --- | --- |
| `admin` | Full project administration, member management, tasks, subtasks, and notes |
| `project_admin` | Tasks and subtasks |
| `member` | View project content and update subtask completion status |

### Tasks

- Create, list, view, update, and delete tasks
- Assign tasks only to project members
- Statuses: `todo`, `in_progress`, `done`
- Multiple attachments per task
- Up to 5 attachments per upload request
- 5 MB maximum per attachment
- Supported types: JPEG, PNG, WebP, PDF, plain text
- Attachment cleanup when tasks/projects are deleted

### Subtasks

- Create, update, and delete subtasks
- Admin/project-admin management
- Members can update only `isCompleted`

### Project Notes

- Create, list, view, update, and delete notes
- All project members can view notes
- Only the project `admin` can create, update, or delete notes

### API Infrastructure

- Centralized error handling
- Consistent API response/error format
- Request validation
- Authentication middleware
- Project-level authorization middleware
- CORS configuration
- Health check endpoint
- Static attachment serving
- Safe MongoDB/Mongoose error handling

## API Endpoints

Base path:

```text
/api/v1
```

### Authentication

```text
POST /auth/register
POST /auth/login
POST /auth/logout
GET  /auth/current-user
POST /auth/change-password
POST /auth/refresh-token
GET  /auth/verify-email/:verificationToken
POST /auth/forgot-password
POST /auth/reset-password/:resetToken
POST /auth/resend-email-verification
```

### Projects

```text
GET    /projects
POST   /projects
GET    /projects/:projectId
PUT    /projects/:projectId
DELETE /projects/:projectId

GET    /projects/:projectId/members
POST   /projects/:projectId/members
PUT    /projects/:projectId/members/:userId
DELETE /projects/:projectId/members/:userId
```

### Tasks

```text
GET    /tasks/:projectId
POST   /tasks/:projectId
GET    /tasks/:projectId/t/:taskId
PUT    /tasks/:projectId/t/:taskId
DELETE /tasks/:projectId/t/:taskId

POST   /tasks/:projectId/t/:taskId/subtasks
PUT    /tasks/:projectId/st/:subTaskId
DELETE /tasks/:projectId/st/:subTaskId
```

Task create/update requests use `multipart/form-data` when uploading attachments.

### Notes

```text
GET    /notes/:projectId
POST   /notes/:projectId
GET    /notes/:projectId/n/:noteId
PUT    /notes/:projectId/n/:noteId
DELETE /notes/:projectId/n/:noteId
```

### Health

```text
GET /healthcheck/
```

### Root

```text
GET /
```

## Permission Matrix

| Feature | Admin | Project Admin | Member |
| --- | :---: | :---: | :---: |
| Create project | Yes | No | No |
| Update/delete project | Yes | No | No |
| Manage project members | Yes | No | No |
| View tasks | Yes | Yes | Yes |
| Create/update/delete tasks | Yes | Yes | No |
| Create/delete subtasks | Yes | Yes | No |
| Update subtask title/status | Yes | Yes | No |
| Update subtask completion | Yes | Yes | Yes |
| View notes | Yes | Yes | Yes |
| Create/update/delete notes | Yes | No | No |

## Project Structure

```text
src/
├── controllers/
│   ├── auth.controllers.js
│   ├── healthcheck.controllers.js
│   ├── note.controllers.js
│   ├── project.controllers.js
│   └── task.controllers.js
├── db/
│   └── index.js
├── middlewares/
│   ├── auth.middleware.js
│   ├── multer.middleware.js
│   └── validator.middleware.js
├── models/
│   ├── note.models.js
│   ├── project.models.js
│   ├── projectmember.models.js
│   ├── subtask.models.js
│   ├── task.models.js
│   └── user.models.js
├── routes/
│   ├── auth.routes.js
│   ├── healthcheck.routes.js
│   ├── note.routes.js
│   ├── project.routes.js
│   └── task.routes.js
├── utils/
│   ├── api-error.js
│   ├── api-response.js
│   ├── async-handler.js
│   ├── constants.js
│   └── mail.js
├── validators/
│   └── index.js
├── app.js
└── index.js
```

## Environment Variables

Copy `.env.example` to `.env` and configure the values for your environment.

Important variables include:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/project-camp

ACCESS_TOKEN_SECRET=your-access-token-secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRY=7d

CORS_ORIGIN=http://localhost:5173
API_PUBLIC_URL=http://localhost:3000
FORGOT_PASSWORD_REDIRECT_URL=http://localhost:5173/reset-password

COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
```

SMTP/Mailtrap variables are also required for registration verification and password-reset emails.

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

On Windows, create `.env` manually by copying `.env.example`.

Set valid MongoDB and SMTP credentials in `.env`.

### 3. Start development server

```bash
npm run dev
```

### 4. Start normally

```bash
npm start
```

The API uses port `3000` by default.

## Testing / Verification

The JavaScript source tree has been checked with Node.js syntax validation successfully.

Full end-to-end verification requires:

- Running MongoDB
- Valid SMTP/Mailtrap credentials
- A client such as Postman/Thunder Client/frontend to exercise authenticated flows

Recommended manual flow:

1. Register a user.
2. Verify the email from the verification message.
3. Login and obtain authentication cookies.
4. Create a project.
5. Add project members with different roles.
6. Test task/subtask permissions for each role.
7. Test note permissions.
8. Test attachments and project/task deletion cleanup.
9. Test refresh-token, logout, change-password, and forgot-password flows.

## Production Notes

Before deploying to production:

- Use strong random JWT secrets.
- Set `COOKIE_SECURE=true` when using HTTPS.
- Configure an appropriate `COOKIE_SAME_SITE` value for the frontend deployment.
- Restrict `CORS_ORIGIN` to trusted frontend origins.
- Use a real SMTP provider instead of development credentials.
- Set `API_PUBLIC_URL` to the public API origin so attachment links and verification links are correct.
- Do not commit `.env` or real credentials.

## Portfolio Focus

This project demonstrates practical backend development concepts:

- REST API design
- JWT authentication and refresh tokens
- Password hashing and secure temporary tokens
- Role-based project authorization
- MongoDB/Mongoose data modelling
- Project/member/task/subtask/note relationships
- Request validation
- Middleware architecture
- File upload handling
- Centralized error handling
- Transactional-style email workflows
