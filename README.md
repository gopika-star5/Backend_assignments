# Backend Assignments

Three Node.js + Express + MongoDB projects, each in its own folder.

| Folder | Project | What it covers |
|---|---|---|
| `todo-api` | To-Do List REST API | Add, update, delete tasks. MongoDB storage, tested with Postman |
| `auth-api` | User Authentication API | Register and login routes, password encryption (bcrypt), JWT authentication |
| `notes-api` | Notes App Backend (Mini Project) | CRUD operations for notes, routes secured with JWT |

## Requirements
- Node.js 18 or newer
- MongoDB (local installation or a free MongoDB Atlas cluster)
- Postman for testing

## Run any project
```bash
cd todo-api          # or auth-api / notes-api
npm install
cp .env.example .env # on Windows: copy .env.example .env
npm start
```
Open `.env` and set your own values (`MONGO_URI`, and `JWT_SECRET` for auth-api and notes-api).

## Test with Postman

### todo-api (port 5000)
| Method | URL | Body (JSON) |
|---|---|---|
| POST | `/api/tasks` | `{ "title": "Buy books" }` |
| GET | `/api/tasks` | - |
| PUT | `/api/tasks/:id` | `{ "completed": true }` |
| DELETE | `/api/tasks/:id` | - |

### auth-api (port 5001)
| Method | URL | Body / Header |
|---|---|---|
| POST | `/api/auth/register` | `{ "name": "Gopika", "email": "a@b.com", "password": "secret123" }` |
| POST | `/api/auth/login` | `{ "email": "a@b.com", "password": "secret123" }` returns a token |
| GET | `/api/auth/me` | Header: `Authorization: Bearer <token>` |

### notes-api (port 5002)
Register and login work the same as auth-api. Then use the token in the `Authorization: Bearer <token>` header:

| Method | URL | Body (JSON) |
|---|---|---|
| POST | `/api/notes` | `{ "title": "Idea", "content": "My first note" }` |
| GET | `/api/notes` | - |
| PUT | `/api/notes/:id` | `{ "title": "Updated", "content": "New text" }` |
| DELETE | `/api/notes/:id` | - |

Without a valid token, the notes routes return `401`.

## Security notes
- Passwords are hashed with bcrypt and never stored as plain text.
- Never upload your `.env` file. The `.gitignore` already blocks it.
