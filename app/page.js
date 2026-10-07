"use client";

import { useEffect, useState, useCallback } from "react";

const css = `
:root{--bg:#f6f7f9;--card:#fff;--text:#14171c;--muted:#5f6b7a;--line:#e3e7ec;--accent:#4f46e5;--accent-text:#fff;--danger:#c0392b;--ok:#1a7f4b}
@media (prefers-color-scheme:dark){:root{--bg:#0f1115;--card:#171a20;--text:#eef1f5;--muted:#9aa5b4;--line:#2a2f38;--accent:#7c78ff;--accent-text:#0f1115;--danger:#ff7a6b;--ok:#4cd08a}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
.wrap{max-width:860px;margin:0 auto;padding:24px 16px 64px}
h1{font-size:22px;margin:0 0 4px}
.sub{color:var(--muted);margin:0 0 20px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px;margin-bottom:18px}
label{display:block;font-size:13px;color:var(--muted);margin-bottom:4px}
input,select{width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--text);font:inherit}
input:focus,select:focus{outline:2px solid var(--accent);outline-offset:0}
.row{display:grid;gap:12px;grid-template-columns:1.2fr .8fr 1.6fr}
@media (max-width:640px){.row{grid-template-columns:1fr}}
.name-box{display:flex;align-items:center;gap:6px}
.suffix{color:var(--muted);white-space:nowrap}
button{font:inherit;cursor:pointer;border-radius:8px;border:1px solid var(--line);background:var(--card);color:var(--text);padding:9px 14px}
button.primary{background:var(--accent);color:var(--accent-text);border-color:var(--accent);font-weight:600}
button.danger{color:var(--danger)}
button:disabled{opacity:.5;cursor:default}
.actions{margin-top:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.msg{font-size:14px}.msg.err{color:var(--danger)}.msg.ok{color:var(--ok)}
.presets{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px}
.presets button{font-size:13px;padding:6px 10px}
table{width:100%;border-collapse:collapse}
th,td{text-align:left;padding:9px 6px;border-bottom:1px solid var(--line);font-size:14px;vertical-align:top}
th{color:var(--muted);font-weight:500;font-size:12px;text-transform:uppercase;letter-spacing:.04em}
td.val{word-break:break-all;max-width:320px}
.tag{font-size:11px;padding:2px 6px;border-radius:6px;border:1px solid var(--line);color:var(--muted)}
.tag.mine{color:var(--accent);border-color:var(--accent)}
.hint{color:var(--muted);font-size:13px;margin-top:10px}
.tablewrap{overflow-x:auto}
`;

export default function Page() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [domain, setDomain] = useState("");
  const [records, setRecords] = useState([]);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", type: "CNAME", value: "cname.vercel-dns.com" });

  const api = useCallback(
    async (method, body, pw) => {
      const res = await fetch("/api/records", {
        method,
        headers: { "Content-Type": "application/json", "x-admin-password": pw ?? password },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error");
      return data;
    },
    [password]
  );

  const load = useCallback(
    async (pw) => {
      const data = await api("GET", null, pw);
      setDomain(data.domain);
      setRecords(data.records);
    },
    [api]
  );

  useEffect(() => {
    const saved = sessionStorage.getItem("sm_pw");
    if (saved) {
      setPassword(saved);
      load(saved)
        .then(() => setAuthed(true))
        .catch(() => sessionStorage.removeItem("sm_pw"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(e) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      await load(password);
      sessionStorage.setItem("sm_pw", password);
      setAuthed(true);
    } catch (err) {
      setMsg({ t: "err", s: err.message });
    }
    setBusy(false);
  }

  async function add(e) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const r = await api("POST", form);
      setMsg({ t: "ok", s: `Ban gaya: ${r.fqdn}` });
      setForm({ ...form, name: "" });
      await load();
    } catch (err) {
      setMsg({ t: "err", s: err.message });
    }
    setBusy(false);
  }

  async function remove(rec) {
    if (!confirm(`${rec.name}.${domain} delete karna hai?`)) return;
    setMsg(null);
    setBusy(true);
    try {
      await api("DELETE", { id: rec.id });
      setMsg({ t: "ok", s: "Delete ho gaya" });
      await load();
    } catch (err) {
      setMsg({ t: "err", s: err.message });
    }
    setBusy(false);
  }

  function preset(type, value) {
    setForm((f) => ({ ...f, type, value }));
  }

  if (!authed) {
    return (
      <div className="wrap">
        <style>{css}</style>
        <h1>Subdomain Manager</h1>
        <p className="sub">Login karo</p>
        <form className="card" onSubmit={login}>
          <label>Admin password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
          <div className="actions">
            <button className="primary" disabled={busy || !password}>Login</button>
            {msg && <span className={`msg ${msg.t}`}>{msg.s}</span>}
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="wrap">
      <style>{css}</style>
      <h1>Subdomain Manager</h1>
      <p className="sub">{domain} ke subdomains</p>

      <form className="card" onSubmit={add}>
        <div className="presets">
          <button type="button" onClick={() => preset("CNAME", "cname.vercel-dns.com")}>Vercel project</button>
          <button type="button" onClick={() => preset("A", "76.76.21.21")}>Vercel (A record)</button>
          <button type="button" onClick={() => preset("CNAME", "")}>Doosri site (CNAME)</button>
          <button type="button" onClick={() => preset("A", "")}>Server IP (A)</button>
        </div>
        <div className="row">
          <div>
            <label>Subdomain</label>
            <div className="name-box">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="blog"
                autoCapitalize="none"
                required
              />
              <span className="suffix">.{domain}</span>
            </div>
          </div>
          <div>
            <label>Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option>A</option>
              <option>AAAA</option>
              <option>CNAME</option>
              <option>TXT</option>
            </select>
          </div>
          <div>
            <label>Value</label>
            <input
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              placeholder={form.type === "A" ? "1.2.3.4" : "target.example.com"}
              required
            />
          </div>
        </div>
        <div className="actions">
          <button className="primary" disabled={busy}>Subdomain banao</button>
          {msg && <span className={`msg ${msg.t}`}>{msg.s}</span>}
        </div>
        <p className="hint">
          Vercel par site chalane ke liye subdomain ko project me bhi add karo: Project → Settings → Domains.
        </p>
      </form>

      <div className="card">
        <div className="tablewrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Type</th><th>Value</th><th></th></tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}{" "}{r.managed && <span className="tag mine">tool</span>}</td>
                  <td>{r.type}</td>
                  <td className="val">{r.value}</td>
                  <td>
                    {r.managed ? (
                      <button className="danger" disabled={busy} onClick={() => remove(r)}>Delete</button>
                    ) : (
                      <span className="tag">protected</span>
                    )}
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan="4" style={{ color: "var(--muted)" }}>Koi record nahi</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="hint">
          "protected" records (Resend, Brevo, website) yahan se delete nahi hote, taaki galti se email ya site na tute.
        </p>
      </div>
    </div>
  );
}
