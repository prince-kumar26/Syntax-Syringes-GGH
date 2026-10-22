# BloodLink AI — overnight hackathon starter

This is a demo prototype for the Syntax Syringes hackathon team. It uses fictional donor records.
It is NOT a real emergency service and must not be used for medical decisions or actual donor recruitment.

## Fastest setup (Windows)

Install Node.js LTS first if `node --version` does not work:
https://nodejs.org/

Open VS Code → File → Open Folder → select `BloodLinkAI_Prototype`.

### Terminal 1: backend
```powershell
cd server
npm install
copy .env.example .env
npm run dev
```
Backend runs at http://localhost:5000

### Terminal 2: frontend
Open a second VS Code terminal:
```powershell
cd client
npm install
npm run dev
```
Open the Local URL printed by Vite, usually http://localhost:5173

## Gemini API (optional but recommended)
1. Get an API key from Google AI Studio: https://aistudio.google.com/app/apikey
2. Put it in `server/.env` as `GEMINI_API_KEY=your_key_here`
3. Restart the backend terminal.
4. Use the “Parse with Gemini” button. If the key is absent or the API fails, the app uses a transparent demo parser so the core prototype still works.

Never put the API key in the client folder or commit `.env` to GitHub.

## Demo script (90 seconds)
1. Select/enter blood group, units, hospital/location, urgency, and a natural-language request.
2. Click **Parse with Gemini**. Show the extracted request and any missing fields.
3. Click **Find potential donors**. Explain the results use fictional sample data and simplified blood-group filtering.
4. Click **Simulate notification** to demonstrate the workflow. This does not send a real SMS or contact anyone.
5. If internet/API is unreliable, the demo parser still allows the rest of the workflow.

## Important limitations to state honestly
- Donor data is fictional.
- No real SMS, calls, hospitals, or blood-bank integrations.
- Location matching uses a simple demo locality field, not GPS distance.
- Blood-group filtering is illustrative only. Real transfusion compatibility and donor eligibility must be verified by qualified blood-bank/medical staff.
- Gemini output is assistive and must be checked by a human.
