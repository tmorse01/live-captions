# Google Cloud Speech-to-Text Setup

## Prerequisites

- A Google Cloud account with billing enabled
- `pnpm` and Node.js installed locally

## Steps

### 1. Create or select a project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (e.g. `live-captions-dev`) or select an existing one
3. Note the **Project ID**

### 2. Enable billing

Speech-to-Text requires billing on the project. Enable billing under **Billing** in the console.

### 3. Enable the Speech-to-Text API

1. Navigate to **APIs & Services → Library**
2. Search for **Cloud Speech-to-Text API**
3. Click **Enable**

### 4. Create a service account

1. Go to **IAM & Admin → Service Accounts**
2. Click **Create Service Account**
3. Name: `live-captions-speech`
4. Grant role: **Cloud Speech Client** (`roles/speech.client`)
5. Click **Done**

### 5. Download credentials

1. Open the service account → **Keys** tab
2. **Add Key → Create new key → JSON**
3. Save the file locally (e.g. `./gcp-credentials.json`)
4. **Never commit this file to git**

### 6. Configure environment

Copy `.env.example` to `.env` and set:

```env
GCP_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./gcp-credentials.json
API_PORT=3001
VITE_API_WS_URL=ws://localhost:3001/ws
```

### 7. Run the spike

```bash
cd apps/api
pnpm speech-spike
# Or with a test WAV file:
pnpm speech-spike path/to/test.wav
```

### 8. Production (Railway)

Store the JSON key contents as a Railway secret variable. At startup, write it to a temp file and set `GOOGLE_APPLICATION_CREDENTIALS` to that path.

## Cost notes

Streaming recognition is billed per 15-second increment. Development usage with short test sessions is typically low cost. Monitor usage in the GCP console.
