# KunThaiMoney Web

## Environment setup

Copy `.env.example` to `.env` for local development and fill in the real values.

Frontend variables used by Vite:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_FLW_PUBLIC_KEY`

Serverless API variables used by Vercel `api/send-sms.js`:

- `INFOBIP_BASE_URL`
- `INFOBIP_API_KEY`
- `INFOBIP_SENDER`

## Deployment checklist

Set these in Vercel before deploying the frontend:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_FLW_PUBLIC_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FLW_SECRET_KEY`
- `INFOBIP_BASE_URL`
- `INFOBIP_API_KEY`
- `INFOBIP_SENDER`

## Card Cash-In Flow

Card cash-in now uses Vercel API routes instead of a Supabase Edge Function:

- `POST /api/card-topup-intent` creates the payment intent after validating the signed-in Supabase user.
- Flutterwave checkout runs in the frontend with `VITE_FLW_PUBLIC_KEY`.
- `POST /api/card-topup-verify` verifies the successful Flutterwave transaction, writes the payment event, and calls `kuntai_credit_verified_payment_intent`.
