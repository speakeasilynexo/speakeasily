
## Stripe Integration & Security Hardening — COMPLETED

### What was done

1. **`stripe-webhook` (NEW)** — Handles `checkout.session.completed`:
   - Verifies Stripe signature with `STRIPE_WEBHOOK_SECRET`
   - Extracts `plan` + `wa_id` from session metadata
   - Calculates `expires_at` (30/90/180 days)
   - Idempotency via `stripe_session_id` unique index
   - Updates `wa_users`: `is_subscribed=true`, `subscription_status='active'`, `expires_at`, etc.
   - Logs `subscription_activated` in `wa_events`
   - Also logs `payment_intent.succeeded` (no action)

2. **`activate-subscription` SECURED**:
   - Requires `x-internal-token` header (403 without it)
   - CORS restricted to official domains only

3. **`create-checkout` SECURED**:
   - CORS restricted to official domains only

4. **`whatsapp-webhook` ACCESS CONTROL updated**:
   - `UserData` includes `expires_at`
   - All `select()` queries include `expires_at`
   - `getAccessStatus()`: if subscribed but `expires_at < now()`, treats as NOT subscribed
   - `isTrialExpired()`: returns `subscription_expired` when subscription expired
   - `sendPaywallMessage()`: shows renewal message for expired subscriptions
   - New i18n key `subscription_expired` in pt/es/en

5. **Database migration** (already applied):
   - Added `subscription_started_at`, `expires_at`, `stripe_session_id`, `stripe_payment_intent_id` to `wa_users`
   - Unique index on `stripe_session_id` for idempotency

### CORS Allowed Origins
- `https://speakeasilynexo-digitalapp.lovable.app`
- `https://speakeasily.nexo-digital.app`
- `https://id-preview--7e6cd3f6-c3cb-4553-8264-e3614eec45bc.lovable.app`

### Pending: Stripe Dashboard Config
The user needs to configure the webhook endpoint in Stripe Dashboard:
- URL: `https://njaylytxqksoibyiijms.supabase.co/functions/v1/stripe-webhook`
- Events: `checkout.session.completed`, `payment_intent.succeeded`
