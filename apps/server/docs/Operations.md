# Ohmic operations: recover superadmin password

Use when the superadmin forgets their password. Runs against the production DB from your own PC (Render free instances have no Shell tab, and you don't need one).

Script: `resetSuperadminPassword.js` (same folder as the seed runner). npm script: `reset:superadmin` in `server/package.json`.

## Steps

1. Atlas > Network Access: add your current IP.
2. From the repo root, in PowerShell:

```powershell
$env:MONGO_URI="<prod Atlas URI from password manager>"; $env:RESET_EMAIL="<superadmin email>"; $env:RESET_PASSWORD="<temp password, 8+ chars>"; npm run reset:superadmin -w server
```

3. Log in with the temp password. You are forced to the change-password page and must set a new one.
4. Close the terminal so the production URI doesn't linger in the session.
5. Atlas > Network Access: remove the IP you added.

## Notes

- The env var name must match what `config/db.js` reads (assumed `MONGO_URI`).
- Test against the local DB first (leave `MONGO_URI` unset to use your local `.env`).
- Never store the real Atlas URI or a real password in this file or in the repo.
- Resetting also sets `passwordChangedAt`, so any old session for that superadmin stops working.

## Related: resetting an org admin's password

Superadmin resets an org admin from Postman: `PATCH /api/users/<adminId>/reset-password` with `{ "newPassword": "..." }` (add the `x-org-id` header if needed). The admin is forced to change it on next login. Confirm the admin's identity first, for example by calling the phone number on file.