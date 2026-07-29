# MediaFetch Deployment Guide (Railway)

This guide walks you through deploying both the Frontend and Backend of MediaFetch to Railway.

## 1. Preparation

Make sure your code is pushed to a single GitHub repository.

```bash
git init
git add .
git commit -m "Cleaned up and optimized for deployment"
git branch -M main
git remote add origin https://github.com/your-username/mediafetch.git
git push -u origin main
```

## 2. Deploy the Backend

1. Go to [Railway Dashboard](https://railway.app/dashboard) and click **New Project** → **Deploy from GitHub repo**.
2. Select your `mediafetch` repository.
3. Click **Add variables** and set:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `CORS_ORIGIN`: `*` *(You will update this later once the frontend is deployed)*
4. Go to the service **Settings** → **Build**:
   - **Build Command**: `npm run build`
   - **Root Directory**: `/backend`
5. Go to **Settings** → **Deploy**:
   - **Start Command**: `npm start`
6. Go to **Settings** → **Networking** and click **Generate Domain** (e.g., `mediafetch-backend.up.railway.app`).

Wait for the backend to deploy successfully. You can test it by visiting `https://your-backend-domain/health`.

## 3. Deploy the Frontend

1. In the same Railway Project, click **New** → **GitHub Repo** and select the same repository again.
2. Go to the new service's **Settings** → **General** and rename it to "Frontend".
3. Go to **Settings** → **Build**:
   - **Root Directory**: `/frontend`
4. Go to **Variables** and add:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend-domain.up.railway.app/api/analyze` (Replace with the domain generated in step 2.6)
   - `NEXT_PUBLIC_BACKEND_URL`: `https://your-backend-domain.up.railway.app`
5. Go to **Settings** → **Networking** and click **Generate Domain** for the frontend (e.g., `mediafetch.up.railway.app`).

Wait for the frontend to deploy successfully.

## 4. Final Configuration

1. Go back to your **Backend** service in Railway.
2. Update the `CORS_ORIGIN` variable to match your new frontend domain:
   - `CORS_ORIGIN`: `https://your-frontend-domain.up.railway.app`
3. The backend will automatically redeploy with the new environment variable.

## 5. Testing

Visit your frontend domain in the browser.
- Paste a URL (e.g., a YouTube link) and ensure the metadata loads correctly.
- Click the download button and ensure the video stream downloads properly without timing out.

## Troubleshooting

- **Large file downloads fail:** Railway has no request timeout, so this shouldn't happen. If it does, check the backend logs in Railway for `yt-dlp` errors.
- **Authentication errors:** Some platforms (like age-restricted YouTube videos) require cookies. You can export cookies using a browser extension (like Get cookies.txt) and upload `cookies.txt` to your backend server, but this requires a custom Dockerfile or volume mount in Railway.
- **CORS errors in the browser console:** Ensure `CORS_ORIGIN` in the backend exactly matches the frontend URL without a trailing slash.
