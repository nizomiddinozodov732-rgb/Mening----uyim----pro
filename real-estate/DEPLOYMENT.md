# Deployment Guide

This guide explains how to deploy the House Shop real estate application to production.

## Architecture

This is a full-stack application with separate frontend and backend:
- **Frontend**: React + Vite (deployed to Vercel)
- **Backend**: Node.js + Express + SQLite (deployed to Railway/Render)

## Prerequisites

- GitHub account
- Vercel account
- Railway or Render account (for backend)
- **Windows Users**: If you get a PowerShell execution policy error when running `npm`, run this command in PowerShell as Administrator:
  ```powershell
  Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

## Step 1: Deploy Backend (Railway or Render)

### Option A: Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `House__shop` repository
4. Railway will detect it as a Node.js project
5. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
6. Add Environment Variables:
   - `JWT_SECRET`: Generate a strong random string
   - `PORT`: `5000`
7. Click "Deploy"
8. Wait for deployment to complete
9. Copy the production URL (e.g., `https://your-app.railway.app`)

### Option B: Render

1. Go to [render.com](https://render.com) and sign in with GitHub
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Add Environment Variables:
   - `JWT_SECRET`: Generate a strong random string
   - `PORT`: `5000`
6. Click "Deploy Web Service"
7. Wait for deployment to complete
8. Copy the production URL (e.g., `https://your-app.onrender.com`)

**Note**: SQLite is used for development. For production, consider migrating to PostgreSQL for better performance and reliability.

## Step 2: Deploy Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New" → "Project"
3. Select your `House__shop` repository
4. Vercel will auto-detect Vite configuration
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `real-estate`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add Environment Variable:
   - `VITE_API_URL`: Your backend URL from Step 1 (e.g., `https://your-app.railway.app/api`)
7. Click "Deploy"
8. Wait for deployment to complete
9. Copy the production URL (e.g., `https://your-app.vercel.app`)

## Step 3: Verify Deployment

1. Visit your frontend URL
2. Test user registration and login
3. Test property listing and search
4. Test admin dashboard
5. Test chat and video call features

## Environment Variables Summary

### Frontend (.env)
```
VITE_API_URL=https://your-backend-url.com/api
```

### Backend (.env)
```
JWT_SECRET=your-secret-key
PORT=5000
DATABASE_URL=sqlite:./database.sqlite
ALLOWED_ORIGINS=https://your-frontend-url.vercel.app,http://localhost:3000
NODE_ENV=production
```

## Important Notes

1. **Database**: SQLite is used for simplicity. For production, consider:
   - PostgreSQL (recommended for Railway/Render)
   - MongoDB
   - Update `backend/server.js` to use your production database

2. **File Uploads**: The current implementation uses local file storage. For production:
   - Use cloud storage (AWS S3, Cloudinary, etc.)
   - Update `backend/server.js` upload configuration

3. **Video Calls**: WebRTC is implemented but requires:
   - STUN/TURN servers for production
   - Consider using services like Twilio or Agora for better reliability

4. **Security**:
   - Use strong `JWT_SECRET`
   - Enable HTTPS (automatic on Vercel/Railway/Render)
   - Implement rate limiting
   - Add CORS configuration if needed

## Troubleshooting

### Build Fails on Vercel
- Check that `node_modules` is in `.gitignore`
- Verify `vercel.json` configuration
- Check build logs for specific errors

### API Calls Fail
- Verify `VITE_API_URL` is set correctly in Vercel
- Check backend is running and accessible
- Ensure CORS is configured if needed

### Database Issues
- SQLite works for development but not ideal for production
- Consider migrating to PostgreSQL
- Ensure database file is in persistent storage

## Local Development

To run locally:

```bash
# Frontend
cd real-estate
npm install
npm run dev

# Backend
cd backend
npm install
node server.js
```

Create `.env` files:
- `real-estate/.env`: `VITE_API_URL=http://localhost:5000/api`
- `backend/.env`: `JWT_SECRET=your-secret`, `PORT=5000`
