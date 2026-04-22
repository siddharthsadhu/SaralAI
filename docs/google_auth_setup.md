# Google OAuth Setup Guide for SaralAI

To fully enable the "Sign in with Google" feature you just requested, you'll need to set up a Google Cloud Project and get your OAuth credentials.

Follow these exactly to get it running:

## Part 1: Setting up Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new Project (or select an existing one). Let's name it **SaralAI Auth**.
3. In the left sidebar, navigate to **APIs & Services** > **OAuth consent screen**.
4. Choose **External** (or Internal if you have a Google Workspace) and click **Create**.
5. Fill out the application details:
   - **App name**: SaralAI
   - **User support email**: (Your email)
   - **Developer contact information**: (Your email)
6. Click **Save and Continue** through the Scopes and Test Users screens (you can add your own email as a test user if the app will remain in "Testing" mode).

## Part 2: Creating Credentials
1. Still under **APIs & Services**, go to **Credentials** in the left sidebar.
2. Click **+ CREATE CREDENTIALS** at the top and select **OAuth client ID**.
3. For the **Application type**, choose **Web application**.
4. Name it something like "SaralAI Vite Client".
5. Under **Authorized JavaScript origins**, click **+ ADD URI** and add:
   - `http://localhost:5173`
   - `http://localhost:3000` (if you use this port)
   - *(You'll also add your production Vercel/Railway URL here when you deploy)*
6. **Important:** You do NOT need to add anything under "Authorized redirect URIs" for the Google Identity Services popup flow.
7. Click **Create**.
8. A modal will appear with your **Client ID** and **Client Secret**. Copy the **Client ID**.

## Part 3: Environment Setup
Now that you have your credentials, you need to add them to your environment variables.

### Frontend
1. Open `.env.local` in the root of the project (`c:\Users\siddh\Desktop\SaralAI`).
2. Add your Client ID:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
   ```

### Backend
1. Open `backend/.env`.
2. Add your Client ID to `GOOGLE_CLIENT_ID`:
   ```env
   GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
   ```
3. Modify your `JWT_SECRET` in `backend/.env` to a strong random string (for token signing).

## Part 4: Restart the Servers
Because you modified environment variables, you need to restart both servers:
1. **Frontend:** Cancel the `npm run dev` and restart it.
2. **Backend:** Cancel the `python -m uvicorn main:app --reload` and restart it.

Your "Sign in with Google" flow is now fully operational!
