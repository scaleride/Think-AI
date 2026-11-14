# Comet backend (keeps your Gemini key private)

1. In Google Cloud Console, create or pick a project and enable **Cloud Functions**, **Cloud Build** and **Secret Manager**.
2. Store your key as a secret (paste it when prompted, then press Ctrl+D):
   `gcloud secrets create comet-gemini-key --data-file=-`
3. From this `backend` folder, deploy:
   ```
   gcloud functions deploy comet-chat --gen2 --runtime=nodejs20 --region=asia-south1 \
     --source=. --entry-point=cometChat --trigger-http --allow-unauthenticated \
     --set-secrets=GEMINI_API_KEY=comet-gemini-key:latest
   ```
4. Copy the URL the deploy prints (it ends in `comet-chat-...run.app` or `cloudfunctions.net/comet-chat`).
5. Paste it into `script.js` in place of `https://YOUR-FUNCTION-URL-HERE`, then redeploy the site.

Never put the key itself in the site files, the repo, or the APK.
