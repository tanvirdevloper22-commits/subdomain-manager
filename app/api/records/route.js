import { NextResponse } from "next/server";
import { isAuthed } from "../../../lib/auth";
import { listRecords, createRecord, deleteRecord, MARK } from "../../../lib/vercel";
import { validateInput } from "../../../lib/validate";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
}

function fail(e) {
  return NextResponse.json({ error: e.message || "Something went wrong" }, { status: e.status && e.status < 500 ? e.status : 500 });
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
    if (!v.ok) return NextResponse.json({ error: v.error, field: v.field }, { status: 400 });

    const existing = await listRecords();
    const clash = existing.find(
      (r) => (r.name || "@") === v.name && ["A", "AAAA", "CNAME"].includes(r.type) && ["A", "AAAA", "CNAME"].includes(v.type)
    );
    if (clash) {
      return NextResponse.json(
        { error: `'${v.name}' already has a ${clash.type} record. Delete it first.`, field: "name" },
        { status: 409 }
      );
    }
    if (v.type === "CNAME" && existing.some((r) => (r.name || "@") === v.name)) {
      return NextResponse.json({ error: `'${v.name}' already has a record, so a CNAME cannot be added there`, field: "name" }, { status: 409 });
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
    // Safety: only records created by this tool can be deleted
    const existing = await listRecords();
    const rec = existing.find((r) => r.id === id);
    if (!rec) return NextResponse.json({ error: "Record not found" }, { status: 404 });
    if (rec.comment !== MARK) {
      return NextResponse.json(
        { error: "This record was not created by this tool (it may belong to Resend, Brevo or your website). Delete it from the Vercel dashboard instead." },
        { status: 403 }
      );
    }
    await deleteRecord(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
