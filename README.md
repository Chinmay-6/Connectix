# TapHub Setup

To configure TapHub for a production deployment and fix the `auth/operation-not-allowed` error, please follow these steps:

1. **Enable Firebase Authentication (Email/Password)**
   - Go to the [Firebase Console](https://console.firebase.google.com/) for your project.
   - Click **Authentication** -> **Sign-in method**.
   - Enable the **Email/Password** provider.

2. **Add Your Firebase Config (Production)**
   Update the `.env` (or environment variables in your hosting provider like Vercel/Cloud Run) with your own Firebase keys. The application is now fully configured to use these variables if they exist.

   ```env
   # Firebase Client Config
   VITE_FIREBASE_API_KEY="..."
   VITE_FIREBASE_AUTH_DOMAIN="..."
   VITE_FIREBASE_PROJECT_ID="..."
   VITE_FIREBASE_STORAGE_BUCKET="..."
   VITE_FIREBASE_MESSAGING_SENDER_ID="..."
   VITE_FIREBASE_APP_ID="..."

   # Firebase Admin Config (DO NOT expose to client)
   FIREBASE_PROJECT_ID="..."
   FIREBASE_CLIENT_EMAIL="..."
   FIREBASE_PRIVATE_KEY="..."
   ```

   When the `FIREBASE_PRIVATE_KEY` is present, the app will automatically switch from the sandboxed database to your provided production database.

3. **Admin User Creation**
   Once Email/Password auth is enabled in your Firebase project, the server will automatically create the default admin user (`admin@connectix.com` / `Password@1234`) on the first boot if it doesn't already exist.
# Connectix
