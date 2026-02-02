# Playlytic Backend

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Database
1. Make sure MySQL is installed and running
2. Copy `.env.example` to `.env` and update with your database credentials
3. Run the SQL schema:
   ```bash
   mysql -u root -p < database/schema.sql
   ```

### 3. Start the Server
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server will run on http://localhost:5000

## API Endpoints

- `GET /api/videos` - Get all videos
- `POST /api/videos` - Add a new video (requires `title` in request body)
