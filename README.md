# Class Management System

Repository layout:

- `frontend/` React app (current working application)
- `backend/` Backend service folder (reserved for API/server code)

## Frontend

```bash
cd frontend
npm install
npm start
```

Build:

```bash
cd frontend
npm run build
```

Test:

```bash
cd frontend
npm test -- --watchAll=false
```

## Backend

Setup:

```bash
cd backend
npm install
copy .env.example .env
npm start
```

Environment variables:

- `TELEGRAM_BOT_TOKEN` Telegram bot token
- `TELEGRAM_ADMIN_CHAT_ID` Target Admin Center chat/group ID

Implemented endpoint:

- `POST /api/attendance/telegram-report` (multipart)
  - `file`: attendance excel file (`.xls`/`.xlsx`)
  - `caption`: optional message text
- `GET /api/telegram/chat-id-candidates`
  - Returns discovered chat IDs from bot `getUpdates`
