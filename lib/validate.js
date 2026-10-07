// Names used by email, Resend, Brevo and infrastructure. This tool never touches them.
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

// Returns { ok, error, field, name, type, value }
export function validateInput({ name, type, value }) {
  name = String(name || "").trim().toLowerCase();
  type = String(type || "").trim().toUpperCase();
  value = String(value || "").trim();

  if (!name) return { ok: false, field: "name", error: "Enter a subdomain name" };
  const labels = name.split(".");
  if (labels.some((l) => !LABEL.test(l))) {
    return { ok: false, field: "name", error: "Use only a-z, 0-9 and '-' (no '-' at the start or end)" };
  }
  if (name.length > 100) return { ok: false, field: "name", error: "That name is too long" };
  const reserved = reservedSet();
  if (labels.some((l) => reserved.has(l))) {
    return { ok: false, field: "name", error: `'${name}' is a reserved name, choose another` };
  }

  if (!TYPES.includes(type)) return { ok: false, field: "type", error: "Invalid record type" };
  if (!value) return { ok: false, field: "value", error: "Enter a value" };

  if (type === "A" && !IPV4.test(value)) return { ok: false, field: "value", error: "An A record needs a valid IPv4 address" };
  if (type === "AAAA" && !(IPV6.test(value) && value.includes(":"))) {
    return { ok: false, field: "value", error: "An AAAA record needs a valid IPv6 address" };
  }
  if (type === "CNAME" && !HOST.test(value)) {
    return { ok: false, field: "value", error: "A CNAME needs a valid hostname (for example cname.vercel-dns.com)" };
  }
  if (type === "TXT" && value.length > 2000) return { ok: false, field: "value", error: "That TXT value is too long" };

  return { ok: true, name, type, value };
}
