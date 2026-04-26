// Generates 300 unique access codes, inserts them into Supabase, and writes a printable .docx
// Run with DOCX_ONLY=1 to skip insert and just export the latest 300 codes.
const { createClient } = require("@supabase/supabase-js");
const {
  Document, Packer, Paragraph, TextRun,
  Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, VerticalAlign
} = require("docx");
const fs = require("fs");
const path = require("path");

const SUPABASE_URL = "https://ygnpdapnwuxtsyspguul.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnbnBkYXBud3V4dHN5c3BndXVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg3NTUyOCwiZXhwIjoyMDkwNDUxNTI4fQ.EftCX1agV4kgMqB7fNl0UwZoOOGJwT1APvqk8pPeljk";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomCode() {
  let c = "";
  for (let i = 0; i < 6; i++) c += CHARS[Math.floor(Math.random() * CHARS.length)];
  return c;
}

function buildDocx(codeList) {
  // A4: 11906 DXA wide, 1cm margin = 567 DXA → content = 10772 DXA
  // 6 columns: ~1795 DXA each
  const COL_W = 1795;
  const colWidths = [COL_W, COL_W, COL_W, COL_W, COL_W, COL_W + 2];
  const TABLE_W = COL_W * 6 + 2;

  const thinBorder = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
  const borders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

  const tableRows = [];
  const numRows = Math.ceil(codeList.length / 6);
  for (let r = 0; r < numRows; r++) {
    const cells = [];
    for (let c = 0; c < 6; c++) {
      const code = codeList[r * 6 + c] || "";
      cells.push(new TableCell({
        borders,
        width: { size: colWidths[c], type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 28, bottom: 28, left: 40, right: 40 },
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 0, line: 240 },
          children: [new TextRun({ text: code, font: "Courier New", size: 20, bold: true })]
        })]
      }));
    }
    tableRows.push(new TableRow({ children: cells }));
  }

  return new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 567, right: 567, bottom: 567, left: 567 }
        }
      },
      children: [
        new Table({
          width: { size: TABLE_W, type: WidthType.DXA },
          columnWidths: colWidths,
          rows: tableRows
        })
      ]
    }]
  });
}

async function main() {
  let codeList;

  if (process.env.DOCX_ONLY === "1") {
    // Just fetch the latest 300 codes from DB
    const { data, error } = await supabase
      .from("access_codes")
      .select("code, created_at")
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) { console.error(error.message); process.exit(1); }
    codeList = data.map(r => r.code).reverse();
    console.log(`Fetched ${codeList.length} codes from DB.`);
  } else {
    // Fetch existing codes to avoid duplicates
    const { data: existing, error: fetchErr } = await supabase
      .from("access_codes")
      .select("code");

    if (fetchErr) { console.error(fetchErr.message); process.exit(1); }

    const existingSet = new Set((existing || []).map(r => r.code));
    console.log(`Existing codes in DB: ${existingSet.size}`);

    // Generate 300 unique new codes
    const newCodes = new Set();
    let attempts = 0;
    while (newCodes.size < 300 && attempts < 100000) {
      const c = randomCode();
      if (!existingSet.has(c) && !newCodes.has(c)) newCodes.add(c);
      attempts++;
    }
    if (newCodes.size < 300) { console.error("Could not generate 300 unique codes."); process.exit(1); }

    codeList = [...newCodes];

    // Insert into Supabase
    const rows = codeList.map(code => ({ code, used: false }));
    const { error: insertErr } = await supabase.from("access_codes").insert(rows);
    if (insertErr) { console.error("Insert failed:", insertErr.message); process.exit(1); }
    console.log(`Inserted ${codeList.length} codes into Supabase.`);
  }

  // Build and save .docx
  const doc = buildDocx(codeList);
  const buf = await Packer.toBuffer(doc);
  const outPath = path.join(__dirname, "..", "access_codes_print.docx");
  fs.writeFileSync(outPath, buf);
  console.log(`Saved: ${outPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
