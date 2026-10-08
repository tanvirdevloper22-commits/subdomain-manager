# Subdomain Manager

Create and delete subdomains of your own domain from a simple web form.
It uses the Vercel DNS API, needs no database, and is free to run.

## Setup (about 10 minutes)

1. **Create a Vercel token:** vercel.com -> Settings -> Tokens -> Create Token
   (pick the account or team that owns the domain).
2. Push this folder to a new GitHub repository and import it in Vercel
   (**Add New -> Project**).
3. In the project's **Settings -> Environment Variables**, add:
   - `VERCEL_TOKEN`: the token from step 1
   - `DOMAIN`: your domain, e.g. `example.com` (its DNS must be on Vercel)
   - `ADMIN_PASSWORD`: a long, random password
   - `VERCEL_TEAM_ID`: only if the domain belongs to a Vercel team
4. Deploy, then give the tool its own address, e.g. `admin.example.com`
   (Project -> Settings -> Domains).
5. Open it, sign in with `ADMIN_PASSWORD`, and create subdomains.

To run it locally: copy `.env.example` to `.env.local`, fill it in, then run
`npm install && npm run dev`.

## How it works

- **Creating a subdomain:** enter a name, a type (A / AAAA / CNAME / TXT) and a value.
  The record is created in Vercel DNS.
- **Serving a site on Vercel:** use the "Vercel project" quick fill, then add the same
  subdomain under that project's Settings -> Domains.
- **Safety:**
  - Only records created by this tool can be deleted (they carry a marker comment).
    Records from Resend, Brevo or your website show as "Protected".
  - Reserved names (`mail`, `send`, `www`, `smtp`, `resend`, `brevo`, and more) are blocked.
    Add your own with `EXTRA_RESERVED`.
  - A duplicate A / AAAA / CNAME on the same name is rejected.

## If Vercel asks you to verify the domain

When a project adds a domain that lives in another Vercel account, Vercel asks for a TXT record
at `_vercel.yourdomain.com`. Click **Vercel domain verification** in this tool, paste the value
Vercel shows (it starts with `vc-domain-verify=`), and create it. You can delete it afterwards.

For this to work, `VERCEL_TOKEN` must belong to the account (or team) that owns the domain's DNS.
The tool itself can be deployed from any account.

## Notes

- Keep `ADMIN_PASSWORD` private, and never put `VERCEL_TOKEN` in the frontend or in GitHub.
- This tool is for your own use. Offering free subdomains to the public would need user
  sign-in, per-user limits and a database on top of this.
- Wildcard (`*`) records are intentionally blocked so one mistake cannot route everything
  to a single app. Add one from the Vercel dashboard if you really want it.
