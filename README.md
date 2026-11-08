# CRM Backend

REST API for a contact management system: contacts, notes, follow-up reminders and tags.
Built with Node.js, Express and MongoDB (Mongoose). No SQL.

## Requirements
- Node.js 18 or newer
- MongoDB running locally, or a MongoDB Atlas connection string

## Setup
```bash
cd backend
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm run dev                 # auto-restart on changes. Use `npm start` for production
```
You should see `API running on http://localhost:5000`.

## Environment variables (`.env`)
| Name | Default | Description |
|------|---------|-------------|
| `PORT` | `5000` | Port the API listens on |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/crm` | MongoDB connection string |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Frontend URL allowed by CORS |

MongoDB Atlas example:
```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/crm?retryWrites=true&w=majority
```
URL-encode special characters in the password, and allow your IP in Atlas under Network Access.

## Project structure
```
backend/
├── models/Contact.js    Mongoose schema
├── routes/api.js        All endpoints
├── server.js            Express app and MongoDB connection
├── package.json
└── .env.example
```

## Data model
A single `contacts` collection. Notes and reminders are embedded sub-documents, so one query loads a whole contact.
```
Contact {
  name (required), email, phone, company,
  tags: [String]                              lowercase, de-duplicated
  notes: [{ text, createdAt }]
  reminders: [{ title, dueDate, done }]
  createdAt, updatedAt
}
```

## API endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/contacts?search=&tag=` | List contacts, optionally searched or filtered by tag |
| POST | `/api/contacts` | Create a contact |
| GET | `/api/contacts/:id` | Get a contact with notes and reminders |
| PUT | `/api/contacts/:id` | Update name, email, phone, company, tags |
| DELETE | `/api/contacts/:id` | Delete a contact |
| POST | `/api/contacts/:id/notes` | Add a note: `{ "text": "..." }` |
| DELETE | `/api/contacts/:id/notes/:noteId` | Delete a note |
| POST | `/api/contacts/:id/reminders` | Add a reminder: `{ "title": "...", "dueDate": "2026-11-01" }` |
| PATCH | `/api/contacts/:id/reminders/:rid` | Update a reminder, e.g. `{ "done": true }` |
| DELETE | `/api/contacts/:id/reminders/:rid` | Delete a reminder |
| GET | `/api/reminders?within=7` | Pending reminders across all contacts, soonest first. Overdue are always included |
| GET | `/api/tags` | All tags with usage counts |

Errors return JSON: `{ "error": "message" }` with status 400 (validation), 404, or 500.

## Quick test
```bash
curl http://localhost:5000/api/tags

curl -X POST http://localhost:5000/api/contacts \
  -H "Content-Type: application/json" \
  -d '{"name":"Ayesha Rahman","email":"ayesha@example.com","tags":["lead","dhaka"]}'
```

## Troubleshooting
| Problem | Fix |
|---------|-----|
| `MongoDB connection failed` | Start MongoDB (Windows: start the "MongoDB Server" service) or correct `MONGODB_URI` |
| `EADDRINUSE` | Port is taken. Change `PORT` in `.env` and update the frontend `VITE_API_URL` |
| `Cannot find module` | Run `npm install` inside `backend` |
| Browser shows a CORS error | Make sure `CLIENT_ORIGIN` exactly matches the frontend URL, then restart |

## Not included
Authentication and per-user data. To add them, create a `User` model, issue JWTs on login, add a `user` field to `Contact`, and filter every query by it.
