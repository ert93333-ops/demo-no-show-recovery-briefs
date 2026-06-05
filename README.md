# Demo No-Show Recovery Briefs

Static browser-local MVP for turning public-safe demo no-show notes into a respectful recovery brief, missing-context checklist, and buyer-safe reschedule outline.

## Public pages

- Landing: `https://ert93333-ops.github.io/demo-no-show-recovery-briefs/`
- Checklist: `https://ert93333-ops.github.io/demo-no-show-recovery-briefs/demo-no-show-follow-up-email-template.html`

## Scope

- No CRM, calendar, sales engagement, call recording, transcript, email, or support-ticket integration.
- No CRM export upload, calendar export upload, call recording upload, meeting transcript upload, customer PII storage, private buyer-data storage, credential handling, external database, backend services, or customer communication sending.
- No guilt-heavy language, fake urgency, pressure, unsupported claims, or deceptive reschedule copy.
- Shared marketing and notification credentials stay in the private root `.env` of the Hermes playbook, not in this public site directory.

## Verification

From the Hermes playbook root:

```powershell
npm run workflow:demo-no-show-recovery
```
