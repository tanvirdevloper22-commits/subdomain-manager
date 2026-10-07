import crypto from "node:crypto";

function sha(s) {
  return crypto.createHash("sha256").update(String(s)).digest();
}

export function isAuthed(request) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const given = request.headers.get("x-admin-password") || "";
  return crypto.timingSafeEqual(sha(given), sha(expected));
}
