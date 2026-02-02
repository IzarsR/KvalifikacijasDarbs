# Playlytic - Progress Version

A simple video management web application demonstrating basic CRUD functionality.

## Project Structure

```
KvalifikācijasDarbsRI/
├── backend/           # Node.js + Express backend
│   ├── config/       # Database configuration
│   ├── database/     # SQL schema
│   ├── routes/       # API routes
│   ├── server.js     # Main server file
│   └── package.json
│
└── frontend/         # React frontend
    ├── public/       # Static files
    ├── src/
    │   ├── components/  # React components
    │   ├── pages/       # Page components
    │   ├── App.js
    │   └── index.js
    └── package.json
```

## Technologies

- **Frontend**: React, React Router
- **Backend**: Node.js, Express
- **Database**: MySQL

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v5.7 or higher) **OR** XAMPP
- npm or yarn

### 1. Database Setup

#### Option A - Using XAMPP (Easiest for Windows) ⭐

1. **Download and Install XAMPP:**
   - Download from https://www.apachefriends.org/
   - Install XAMPP (you only need MySQL, but Apache+phpMyAdmin is useful)

2. **Start MySQL:**
   - Open XAMPP Control Panel
   - Click "Start" next to MySQL
   - Click "Start" next to Apache (optional, for phpMyAdmin)

3. **Create Database using phpMyAdmin:**
   - Open browser and go to http://localhost/phpmyadmin
   - Click "SQL" tab at the top
   - Open `backend/database/schema.sql` in a text editor
   - Copy all the SQL code
   - Paste it into the SQL query box
   - Click "Go" button
   - Done! The `playlytic` database and `videos` table are now created

#### Option B - Using MySQL Workbench

1. Open MySQL Workbench
2. Connect to your local MySQL server
3. Open `backend/database/schema.sql`
4. Click the lightning bolt icon to execute the script

#### Option C - Using MySQL Command Line

1. Open MySQL Command Line Client (search for it in Windows Start menu)
2. Enter your password when prompted
3. Copy and paste the contents of `backend/database/schema.sql`
4. Press Enter to execute

### 2. Backend Setup

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and update with your MySQL credentials (optional, defaults work for most local setups)
4. Start the server:
   ```bash
   npm start
   ```
   The backend will run on http://localhost:5000

### 3. Frontend Setup

1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
   The frontend will open automatically at http://localhost:3000

## Features

### Current Implementation
- ✅ Homepage with "Playlytic" branding
- ✅ Navigation bar (Home, Videos)
- ✅ Form to add video titles
- ✅ Save video titles to MySQL database
- ✅ Display list of saved videos
- ✅ Clean and responsive design

### Future Expansion
- Video file upload
- Video processing and cutting
- User authentication
- Advanced video management
- Playlists and categories

## API Endpoints

- `GET /api/videos` - Get all videos
- `POST /api/videos` - Add a new video (body: `{ "title": "Video Title" }`)

## Notes

- This is a basic prototype for demonstration purposes
- No authentication is implemented yet
- Video upload and processing features will be added later
- Database connection uses environment variables (see `.env.example`)

## Troubleshooting

**Backend won't start:**
- Check if MySQL is running
- Verify database credentials in `.env` file
- Ensure port 5000 is not in use

**Frontend can't connect to backend:**
- Make sure backend is running on port 5000
- Check browser console for CORS errors
- Verify API_URL in Videos.js points to http://localhost:5000

**Database errors:**
- Verify the database exists: `SHOW DATABASES;`
- Check if tables are created: `USE playlytic; SHOW TABLES;`
- Re-run the schema.sql file if needed

## License

This is a student project for qualification work.
