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
- `INFOBIP_BASE_URL`
- `INFOBIP_API_KEY`
- `INFOBIP_SENDER`

Set these in Supabase Edge Function secrets for `mock-cashin-test`:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Payment flow note

In the current mock cash-in setup, the frontend calls the authenticated `mock-cashin-test` Supabase Edge Function. That function creates the payment intent, writes the payment event, verifies the intent, and credits the wallet through the secure RPC.
