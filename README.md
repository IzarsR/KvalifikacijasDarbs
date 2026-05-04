# Playlytic

Playlytic is a sports video analysis web app built for qualification work. Users can create accounts, open analysis sessions, attach a video (URL or uploaded file), create clips by time range, and manage all clips per session.

## Tech Stack

- Frontend: React, React Router
- Backend: Node.js, Express
- Database: MySQL
- Auth: JWT + bcrypt
- Uploads: Multer

## Project Structure

```
KvalifikacijasDarbs/
├── backend/
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   ├── uploads/
│   ├── server.js
│   ├── setup-database.js
│   └── package.json
└── frontend/
      ├── public/
      ├── src/
      │   ├── components/
      │   ├── context/
      │   ├── pages/
      │   ├── App.js
      │   └── index.js
      └── package.json
```

## Implemented Features

- User signup and login with password strength validation
- Protected dashboard route for authenticated users
- Session management in dashboard (create, rename, delete)
- Add video by URL for a session
- Upload video file for a session
- Remove session video
- Clip creation with start/end times
- Clip listing and deletion
- Session-level video and clips persisted in MySQL
- Responsive UI for desktop and mobile

## Setup Guide

### Prerequisites

- Node.js 18+
- MySQL 5.7+ (or MySQL via XAMPP)
- npm

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd KvalifikacijasDarbs
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Backend Environment

Create a `.env` file in `backend/`:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=playlytic
DB_PORT=3306
JWT_SECRET=replace_this_with_a_long_random_secret
```

### 3. Initialize Database

Option A (recommended for this project):

```bash
cd backend
node setup-database.js
```

Option B:

- Manually create database `playlytic` in MySQL
- Start backend once; required tables are created automatically by route schema checks

### 4. Run the Application

Backend terminal:

```bash
cd backend
npm start
```

Frontend terminal:

```bash
cd frontend
npm start
```

App URLs:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## API Overview

### Auth

- `POST /api/auth/signup`
   - Body: `{ username, email, password }`
   - Returns: `{ token, username }`
- `POST /api/auth/login`
   - Body: `{ email, password }`
   - Returns: `{ token, username }`

### Session Video (requires `Authorization: Bearer <token>`)

- `GET /api/videos/session/:sessionId`
   - Returns latest video for the session/user
- `POST /api/videos/session`
   - Body: `{ session_id, url, title? }`
   - Saves video URL for session
- `POST /api/videos/session/upload`
   - FormData: `session_id`, `title?`, `video`
   - Uploads video file and saves URL
- `DELETE /api/videos/session/:sessionId`
   - Removes session video and related clips

### Clips (requires `Authorization: Bearer <token>`)

- `GET /api/videos/session/:sessionId/clips`
   - Lists clips for session/user
- `POST /api/videos/session/:sessionId/clips`
   - Body: `{ label, start_time, end_time }`
   - Creates new clip
- `DELETE /api/videos/clips/:clipId`
   - Deletes one clip

### Legacy Basic Endpoints

- `GET /api/videos`
- `POST /api/videos`

These endpoints are kept for backward compatibility with older prototype flow.

## Testing and Final Check

Run before submission:

```bash
# frontend
cd frontend
npm run build

# backend syntax quick check
cd ../backend
node --check server.js
node --check routes/auth.js
node --check routes/videos.js
```

Manual flow checklist:

- Signup -> login -> logout
- Create session, rename session, delete session
- Add video URL to session
- Upload video file to session
- Create clip, jump to clip, delete clip

## Known Limitations

- No automated unit/integration test suite yet
- Frontend currently uses hardcoded localhost API URLs in page files
- Uploaded files are stored locally in `backend/uploads`
- No role-based access (all authenticated users use same feature set)
- No advanced analytics metrics yet (focus is clip/session workflow)

## Troubleshooting

### Backend does not start

- Ensure MySQL is running
- Verify `backend/.env` DB values
- Ensure port 5000 is available

### Frontend cannot call backend

- Ensure backend is running on http://localhost:5000
- Check browser console/network tab for request errors
- Verify JWT token exists after login

### Upload issues

- Confirm file is a video type
- Check file size (current limit: 500 MB)
- Ensure `backend/uploads` can be written

## License

Student project for qualification work.
