import { NextResponse } from "next/server";
import { isAuthed } from "../../../lib/auth";
import { listRecords, createRecord, deleteRecord, MARK } from "../../../lib/vercel";
import { validateInput } from "../../../lib/validate";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Password galat hai" }, { status: 401 });
}

function fail(e) {
  return NextResponse.json({ error: e.message || "Kuch gadbad hui" }, { status: e.status && e.status < 500 ? e.status : 500 });
}

export async function GET(request) {
  if (!isAuthed(request)) return unauthorized();
  try {
    const records = await listRecords();
    const rows = records
      .map((r) => ({
        id: r.id,
        name: r.name || "@",
        type: r.type,
        value: r.value,
        ttl: r.ttl,
        managed: r.comment === MARK,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ domain: process.env.DOMAIN, records: rows });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(request) {
  if (!isAuthed(request)) return unauthorized();
  try {
    const input = await request.json();
    const v = validateInput(input);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

    const existing = await listRecords();
    const clash = existing.find(
      (r) => (r.name || "@") === v.name && ["A", "AAAA", "CNAME"].includes(r.type) && ["A", "AAAA", "CNAME"].includes(v.type)
    );
    if (clash) {
      return NextResponse.json(
        { error: `'${v.name}' par pehle se ${clash.type} record hai. Pehle use delete karo.` },
        { status: 409 }
      );
    }
    if (v.type === "CNAME" && existing.some((r) => (r.name || "@") === v.name)) {
      return NextResponse.json({ error: `'${v.name}' par already record hai, CNAME ke saath nahi chalega` }, { status: 409 });
    }

    const created = await createRecord(v);
    return NextResponse.json({ ok: true, fqdn: `${v.name}.${process.env.DOMAIN}`, created });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(request) {
  if (!isAuthed(request)) return unauthorized();
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "id missing" }, { status: 400 });
    // Safety: sirf wahi records delete honge jo is tool ne banaye
    const existing = await listRecords();
    const rec = existing.find((r) => r.id === id);
    if (!rec) return NextResponse.json({ error: "Record nahi mila" }, { status: 404 });
    if (rec.comment !== MARK) {
      return NextResponse.json(
        { error: "Ye record is tool ne nahi banaya (Resend/Brevo/website ka ho sakta hai). Vercel dashboard se hi delete karo." },
        { status: 403 }
      );
    }
    await deleteRecord(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
