// Ye naam email/Resend/Brevo/infra ke liye hain, inhe tool se nahi chhedna.
const DEFAULT_RESERVED = [
  "@", "*", "www", "mail", "send", "resend", "brevo", "smtp", "imap", "pop", "pop3",
  "mx", "ns", "ns1", "ns2", "autodiscover", "autoconfig", "webmail", "email",
];

export function reservedSet() {
  const extra = (process.env.EXTRA_RESERVED || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...DEFAULT_RESERVED, ...extra]);
}

const LABEL = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const IPV6 = /^[0-9a-fA-F:]+$/;
const HOST = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}\.?$/i;

export const TYPES = ["A", "AAAA", "CNAME", "TXT"];

// Returns { ok, error, name, type, value }
export function validateInput({ name, type, value }) {
  name = String(name || "").trim().toLowerCase();
  type = String(type || "").trim().toUpperCase();
  value = String(value || "").trim();

  if (!name) return { ok: false, error: "Subdomain naam daalo" };
  const labels = name.split(".");
  if (labels.some((l) => !LABEL.test(l))) {
    return { ok: false, error: "Naam me sirf a-z, 0-9 aur '-' allowed hai (shuru/ant me '-' nahi)" };
  }
  if (name.length > 100) return { ok: false, error: "Naam bahut lamba hai" };
  const reserved = reservedSet();
  if (labels.some((l) => reserved.has(l))) {
    return { ok: false, error: `'${name}' reserved naam hai, doosra choose karo` };
  }

  if (!TYPES.includes(type)) return { ok: false, error: "Record type galat hai" };
  if (!value) return { ok: false, error: "Value daalo" };

  if (type === "A" && !IPV4.test(value)) return { ok: false, error: "A record ke liye valid IPv4 chahiye" };
  if (type === "AAAA" && !(IPV6.test(value) && value.includes(":"))) {
    return { ok: false, error: "AAAA record ke liye valid IPv6 chahiye" };
  }
  if (type === "CNAME" && !HOST.test(value)) {
    return { ok: false, error: "CNAME ke liye valid hostname chahiye (jaise cname.vercel-dns.com)" };
  }
  if (type === "TXT" && value.length > 2000) return { ok: false, error: "TXT value bahut lambi hai" };

  return { ok: true, name, type, value };
}
