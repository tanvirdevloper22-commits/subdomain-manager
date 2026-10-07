# Subdomain Manager

Apne domain (jiska DNS Vercel par hai) ke subdomains form se banao aur delete karo.
Vercel DNS API use hoti hai, koi database nahi chahiye, free hai.

## Setup (10 minute)

1. **Vercel token banao**: vercel.com -> Settings -> Tokens -> Create (scope: aapka account/team).
2. Ye folder GitHub par push karo, Vercel me **Add New -> Project** se import karo.
3. Vercel project me **Settings -> Environment Variables** me ye daalo:
   - `VERCEL_TOKEN` = token
   - `DOMAIN` = abcde.com (apna asli domain)
   - `ADMIN_PASSWORD` = lamba random password
   - `VERCEL_TEAM_ID` = sirf agar domain team ke andar hai
4. Deploy karo. Fir is tool ko ek subdomain par lagao, jaise `admin.abcde.com`
   (Project -> Settings -> Domains).
5. Open karo, password daalo, subdomain banao.

Local chalane ke liye: `.env.example` ko `.env.local` naam se copy karke bharo, fir
`npm install && npm run dev`.

## Kaise kaam karta hai

- **Subdomain banana**: naam + type (A / AAAA / CNAME / TXT) + value daalo. Record Vercel DNS me ban jaata hai.
- **Vercel par site chalani ho**: preset "Vercel project" use karo, fir us project ke
  Settings -> Domains me wahi subdomain add karo.
- **Safety**:
  - Sirf wahi records delete ho sakte hain jo is tool ne banaye (comment marker se pehchaan).
    Resend/Brevo/website ke records "protected" dikhte hain.
  - Reserved names (`mail`, `send`, `www`, `smtp`, `resend`, `brevo`, etc.) block hain.
    Aur chahiye to `EXTRA_RESERVED` me add karo.
  - Same naam par duplicate A/AAAA/CNAME nahi banta.

## Dhyan

- `ADMIN_PASSWORD` kisi ko mat do, aur `VERCEL_TOKEN` kabhi frontend/GitHub me mat daalo.
- Ye tool sirf aapke liye hai. Public users ko dene ke liye login (Google/GitHub), per-user limit
  aur database alag se banana padega.
- Wildcard (`*`) ek record se saare subdomains ek app par bhej deta hai, lekin ye tool usse
  jaan-boojh kar block karta hai taaki galti se sab kuch na ghum jaaye. Chaaho to Vercel
  dashboard se khud daal lo.
