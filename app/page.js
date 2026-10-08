"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";

export default function Page() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [domain, setDomain] = useState("");
  const [records, setRecords] = useState([]);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("mine");
  const [query, setQuery] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [form, setForm] = useState({ name: "", type: "CNAME", value: "cname.vercel-dns.com" });
  const nameRef = useRef(null);

  const api = useCallback(
    async (method, body, pw) => {
      const res = await fetch("/api/records", {
        method,
        headers: { "Content-Type": "application/json", "x-admin-password": pw ?? password },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data.error || "Something went wrong");
        err.field = data.field;
        throw err;
      }
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

  // "Saved" confirmation fades away by itself
  useEffect(() => {
    if (msg?.t !== "ok") return;
    const t = setTimeout(() => setMsg(null), 3500);
    return () => clearTimeout(t);
  }, [msg]);

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

  function logout() {
    sessionStorage.removeItem("sm_pw");
    setAuthed(false);
    setPassword("");
    setRecords([]);
    setMsg(null);
  }

  async function add(e) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const r = await api("POST", form);
      setMsg({ t: "ok", s: `Saved: ${r.fqdn}` });
      setForm((f) => ({ ...f, name: "" }));
      setTab("mine");
      await load();
      nameRef.current?.focus();
    } catch (err) {
      setMsg({ t: "err", s: err.message, field: err.field });
    }
    setBusy(false);
  }

  async function remove(rec) {
    setMsg(null);
    setBusy(true);
    try {
      await api("DELETE", { id: rec.id });
      setConfirmId(null);
      setMsg({ t: "ok", s: "Deleted" });
      await load();
    } catch (err) {
      setMsg({ t: "err", s: err.message });
    }
    setBusy(false);
  }

  const mineCount = useMemo(() => records.filter((r) => r.managed).length, [records]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records
      .filter((r) => (tab === "mine" ? r.managed : true))
      .filter((r) => !q || r.name.toLowerCase().includes(q) || String(r.value).toLowerCase().includes(q));
  }, [records, tab, query]);

  if (!authed) {
    return (
      <main className="login">
        <h1>Subdomain Manager</h1>
        <p className="mid" style={{ margin: "6px 0 0" }}>Manage the subdomains of your domain in one place.</p>
        <form className="card" onSubmit={login}>
          <div className="field">
            <label htmlFor="pw">Password</label>
            <input
              id="pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={msg?.t === "err"}
              autoFocus
              autoComplete="current-password"
            />
          </div>
          <button className="btn primary lg" disabled={busy || !password}>
            {busy ? "Checking..." : "Sign in"}
          </button>
          {msg?.t === "err" && (
            <div className="msg err" role="alert">
              <span className="dot bad" />
              {msg.s}
            </div>
          )}
        </form>
        <p className="credit">Subdomain Manager · private tool</p>
      </main>
    );
  }

  const isErr = msg?.t === "err";
  const badName = isErr && msg.field === "name";
  const badType = isErr && msg.field === "type";
  const badValue = isErr && msg.field === "value";

  return (
    <main className="wrap">
      <header className="head">
        <div>
          <h1>Subdomains</h1>
          <p className="mid">{domain}</p>
        </div>
        <button className="btn" onClick={logout}>Sign out</button>
      </header>

      <form className="card" onSubmit={add}>
        <div className="chips">
          <span className="label">Quick fill</span>
          <button type="button" className="btn" onClick={() => setForm((f) => ({ ...f, type: "CNAME", value: "cname.vercel-dns.com" }))}>
            Vercel project
          </button>
          <button type="button" className="btn" onClick={() => setForm((f) => ({ ...f, type: "A", value: "76.76.21.21" }))}>
            Vercel (A record)
          </button>
          <button type="button" className="btn" onClick={() => setForm((f) => ({ ...f, type: "CNAME", value: "" }))}>
            Other site
          </button>
          <button type="button" className="btn" onClick={() => setForm((f) => ({ ...f, type: "A", value: "" }))}>
            Server IP
          </button>
          <button type="button" className="btn" onClick={() => setForm({ name: "_vercel", type: "TXT", value: "" })}>
            Vercel domain verification
          </button>
        </div>

        <div className="fields">
          <div className="field">
            <label htmlFor="name">Subdomain</label>
            <div className="suffix-box">
              <input
                id="name"
                ref={nameRef}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="blog"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                aria-invalid={badName}
                required
              />
              <span className="suffix">.{domain}</span>
            </div>
          </div>
          <div className="field">
            <label htmlFor="type">Type</label>
            <select id="type" value={form.type} aria-invalid={badType} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option>A</option>
              <option>AAAA</option>
              <option>CNAME</option>
              <option>TXT</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="value">Value</label>
            <input
              id="value"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              placeholder={
                form.type === "A"
                  ? "1.2.3.4"
                  : form.type === "TXT"
                  ? "Paste the value Vercel shows, e.g. vc-domain-verify=..."
                  : "target.example.com"
              }
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-invalid={badValue}
              required
            />
          </div>
        </div>

        <div className="form-foot">
          <button className="btn primary lg" disabled={busy}>
            {busy ? "Saving..." : "Create subdomain"}
          </button>
          {msg && (
            <span className={`msg ${msg.t}`} role={isErr ? "alert" : "status"}>
              <span className={`dot ${isErr ? "bad" : "ok"}`} />
              {msg.s}
            </span>
          )}
        </div>
        <p className="hint">
          To serve a site on Vercel, also add this subdomain under your project's Settings, Domains.
          If Vercel asks you to verify ownership of the domain, use "Vercel domain verification" and paste the TXT value it shows.
        </p>
      </form>

      <section className="list-head" aria-label="Records">
        <div className="tabs" role="tablist">
          <button className="tab" role="tab" aria-selected={tab === "mine"} onClick={() => setTab("mine")}>
            Created here<span className="count">{mineCount}</span>
          </button>
          <button className="tab" role="tab" aria-selected={tab === "all"} onClick={() => setTab("all")}>
            All records<span className="count">{records.length}</span>
          </button>
        </div>

        {records.length > 6 && (
          <div className="search">
            <input
              type="search"
              placeholder="Search by name or value"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search records"
            />
          </div>
        )}

        {shown.length === 0 ? (
          <div className="empty">
            <h2>{query ? "No matches" : "No subdomains yet"}</h2>
            <p>
              {query
                ? "Try a different name or value."
                : "Create your first subdomain with the form above. It will appear here."}
            </p>
            {!query && (
              <button className="btn primary" onClick={() => nameRef.current?.focus()}>
                Create first subdomain
              </button>
            )}
          </div>
        ) : (
          <div role="list" className={tab === "all" ? "list has-status" : "list"}>
            {shown.map((r) => (
              <div className="row" role="listitem" key={r.id}>
                <div className="r-name">
                  {r.name}
                  <span className="base">.{domain}</span>
                </div>
                <div className="r-val">
                  <span className="t-inline">{r.type}</span>
                  {r.value}
                </div>
                {tab === "all" && (
                  <div className="r-status">
                    <span className={`dot ${r.managed ? "accent" : ""}`} />
                    {r.managed ? "Created here" : "Protected"}
                  </div>
                )}
                <div className="r-act">
                  {r.managed &&
                    (confirmId === r.id ? (
                      <>
                        <button className="btn" disabled={busy} onClick={() => setConfirmId(null)}>Cancel</button>
                        <button className="btn danger solid" disabled={busy} onClick={() => remove(r)}>Delete</button>
                      </>
                    ) : (
                      <button className="btn danger" disabled={busy} onClick={() => setConfirmId(r.id)}>Delete</button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {records.length > 0 && (
          <p className="summary">
            Protected records (Resend, Brevo, your website) cannot be deleted here, so your email and site stay safe.
          </p>
        )}
      </section>
    </main>
  );
}
