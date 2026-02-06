
# Admin Status Command Implementation Plan

## Problem Summary

You encountered two issues:
1. **Audio test failed** because you were in the `day_production` step, and the audio transcription hit a rate limit (429 error from Whisper API)
2. **RESTART command didn't work** - based on the logs, the last message logged was the audio at 21:25:42. The RESTART command should work from any state, so if it didn't respond, there might have been a logging/timing issue OR the message wasn't received by the webhook

## Current State
- Your wa_id is `34672953062` (confirmed as ADMIN_WA_ID)
- Current step: `day_failed` (Day 2, 25% score)
- Admin bypass IS configured and working (per memory and code review)

## Proposed Solution: Add Admin Status Command

Create an admin-only diagnostic command (`/admin` or `status`) that provides:
- Confirmation that admin mode is active
- Current bot state information
- System health check
- Quick actions (force reset, skip to any step)

---

## Implementation Details

### 1. Add I18N Keys for Admin Messages

Add new entries to the I18N dictionary:

```text
admin_status: Status diagnostico for admin showing:
- Admin status (active/inactive)
- Current wa_id
- Current step/state
- Subscription status
- Trial status
- Last N events summary
```

### 2. Add Admin Commands

Implement these admin-only commands in `processMessage()`:

| Command | Action |
|---------|--------|
| `/admin` or `ADMIN STATUS` | Show diagnostic info |
| `/reset` or `ADMIN RESET` | Force reset to welcome (no confirmation) |
| `/skip [step]` | Jump to specific step |
| `/setstep [step_name]` | Set arbitrary step |

### 3. Code Changes in whatsapp-webhook/index.ts

Location: After global commands section (around line 3258), add admin command handling:

```text
// ========== ADMIN COMMANDS (BEFORE OTHER COMMANDS) ==========

if (lower.startsWith("/admin") || lower.startsWith("admin ") || lower === "admin") {
  const accessStatus = getAccessStatus(user, waId);
  
  if (!accessStatus.isAdmin) {
    // Silently ignore for non-admins
    continue with normal flow
  }
  
  // Parse subcommand
  if (lower includes "status" or just "/admin") {
    -> Show full diagnostic
  } else if (lower includes "reset") {
    -> Force reset without confirmation
  } else if (lower includes "skip") {
    -> Parse target step and jump
  }
}
```

### 4. Admin Diagnostic Message Format

```text
🔧 *Admin Status*

✅ Admin Mode: ACTIVE
📱 wa_id: 34672***3062
📍 Current Step: day_failed
📊 Progress: Day 2, Exercise 4/4
💳 Subscription: paid (admin bypass)
⏰ Trial: N/A (admin)

*Recent Events (5):*
• 21:25 - audio_transcription_failed
• 21:25 - production_submitted
• 21:23 - exercise_answered
...

*Quick Actions:*
• /admin reset - Reset to welcome
• /admin step ready - Jump to ready
• /admin step day_intro - Jump to lesson
```

### 5. Force Reset Command

Add an admin-only instant reset:
- Command: `/admin reset` or `ADMIN RESET`
- Action: Immediately reset to `welcome` step with empty data
- No confirmation needed (admin is trusted)
- Log event: `admin_reset_used`

### 6. Event Tracking

Add new event type to track admin command usage:
- `admin_command_used` with metadata: `{ command, subcommand, result }`

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/whatsapp-webhook/index.ts` | Add admin command handling, I18N keys, and helper functions |

---

## Technical Notes

1. **Security**: Admin commands only execute if `getAccessStatus().isAdmin === true`
2. **Non-intrusive**: Non-admin users who type `/admin` just get normal flow
3. **Logging**: All admin commands are tracked in `wa_events`
4. **Language**: Admin messages will use the user's preferred language

---

## Testing Plan

After implementation:
1. Send `/admin` from your admin wa_id -> Should show diagnostic
2. Send `/admin reset` -> Should immediately reset to welcome
3. Send `/admin` from a non-admin number -> Should be ignored
4. Verify `wa_events` logs the `admin_command_used` event
