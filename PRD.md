# Project Camp Backend — Product Requirements

## Overview

Project Camp is a RESTful backend for collaborative project management. Authenticated users can create projects, manage project members and roles, organize tasks and subtasks, maintain project notes, and use email-based account recovery and verification.

## Roles

- `admin`: full project administration, including project/member management and task/subtask/note administration
- `project_admin`: manages tasks and subtasks
- `member`: views project content and can update subtask completion status

Roles are scoped per project through the `ProjectMember` model.

## Authentication

- Registration with email verification
- Login/logout with JWT access and refresh tokens
- HTTP-only cookies
- Bearer-token support for API clients
- Current-user endpoint
- Password change
- Forgot/reset password
- Temporary token hashing and expiry
- Verification-email resend
- Refresh-token rotation
- Refresh-token revocation on logout/password change/reset

## Project Management

- Create, list, view, update, and delete projects
- Automatic creator membership as project `admin`
- Project member listing
- Add existing users to projects
- Update project member roles
- Remove members
- Prevent removal/demotion of the final project administrator
- Unassign a removed member from their tasks
- Cascade cleanup when a project is deleted, including subtasks, notes, members, and task attachment files

## Task Management

- Create, list, view, update, and delete tasks
- Assign tasks only to project members
- Task statuses: `todo`, `in_progress`, `done`
- Multiple task attachments
- Maximum 5 attachments per request
- Maximum 5 MB per attachment
- Allowed attachment types: JPEG, PNG, WebP, PDF, and plain text
- Attachment cleanup when tasks/projects are deleted

## Subtasks

- Create subtasks
- Update subtasks
- Delete subtasks
- Admin/project-admin management
- Members can update only completion status

## Notes

- Create/list/view/update/delete project notes
- Note creation/update/delete restricted to project `admin`
- All project members can view notes

## API Endpoints

### Auth — `/api/v1/auth`

- `POST /register`
- `POST /login`
- `POST /logout`
- `GET /current-user`
- `POST /change-password`
- `POST /refresh-token`
- `GET /verify-email/:verificationToken`
- `POST /forgot-password`
- `POST /reset-password/:resetToken`
- `POST /resend-email-verification`

### Projects — `/api/v1/projects`

- `GET /`
- `POST /`
- `GET /:projectId`
- `PUT /:projectId`
- `DELETE /:projectId`
- `GET /:projectId/members`
- `POST /:projectId/members`
- `PUT /:projectId/members/:userId`
- `DELETE /:projectId/members/:userId`

### Tasks — `/api/v1/tasks`

- `GET /:projectId`
- `POST /:projectId`
- `GET /:projectId/t/:taskId`
- `PUT /:projectId/t/:taskId`
- `DELETE /:projectId/t/:taskId`
- `POST /:projectId/t/:taskId/subtasks`
- `PUT /:projectId/st/:subTaskId`
- `DELETE /:projectId/st/:subTaskId`

### Notes — `/api/v1/notes`

- `GET /:projectId`
- `POST /:projectId`
- `GET /:projectId/n/:noteId`
- `PUT /:projectId/n/:noteId`
- `DELETE /:projectId/n/:noteId`

### Health — `/api/v1/healthcheck`

- `GET /`

### Root

- `GET /`

## Security Requirements

- Password hashing with bcrypt
- JWT access/refresh token verification
- HTTP-only authentication cookies
- Optional Bearer access-token authentication
- Project-level authorization middleware
- Input validation with `express-validator`
- Temporary-token hashing and expiry
- File type and size validation
- CORS configuration with credentials support
- Centralized error handling
- Generic forgot-password response to reduce account enumeration
- Sensitive user/token fields excluded from authenticated user responses
- Refresh-token revocation when the password changes or is reset

## Completion Status

The API described above is implemented in the current source tree. JavaScript source syntax has been checked successfully. Full database-backed authentication, email delivery, and end-to-end API testing require valid MongoDB and SMTP credentials.
