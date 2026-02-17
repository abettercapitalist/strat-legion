import { createClient } from "npm:@supabase/supabase-js@2";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, LevelFormat, convertInchesToTwip } from "npm:docx@9.1.1";
import * as cheerio from "npm:cheerio@1.0.0";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateDocumentRequest {
  workstream_id: string;
  step_id: string;
  template_id: string;
  document_type: string;
  title: string;
  collected_data?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Template variable substitution (replaces AI merge)
// ---------------------------------------------------------------------------

/** Traverse a nested object by dot-separated path, e.g. "counterparty.name" */
function getNestedField(obj: Record<string, unknown>, dotPath: string): unknown {
  const parts = dotPath.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * Replace all {{placeholder}} tokens in the template HTML with values from
 * the data context. Unmatched placeholders become "[TBD]".
 *
 * Supported patterns:
 *   {{workstream.name}}           → workstream fields
 *   {{counterparty.name}}         → counterparty fields
 *   {{previous_output.deal_amount}} → upstream brick outputs (collected_data)
 *   {{deal_amount}}               → searches: collected_data → workstream → counterparty
 *   {{current_date}}              → today's date
 */
function substituteTemplateVariables(
  html: string,
  dataContext: {
    workstream: Record<string, unknown>;
    counterparty: Record<string, unknown>;
    collected_data: Record<string, unknown>;
    current_date: string;
  },
): string {
  return html.replace(/\{\{([^}]+)\}\}/g, (_match, rawKey: string) => {
    const key = rawKey.trim();

    // Built-in field: current_date
    if (key === "current_date") {
      return dataContext.current_date;
    }

    const dotIndex = key.indexOf(".");
    if (dotIndex > 0) {
      const namespace = key.slice(0, dotIndex);
      const fieldPath = key.slice(dotIndex + 1);

      if (namespace === "workstream") {
        const val = getNestedField(dataContext.workstream, fieldPath);
        if (val != null) return String(val);
      }

      if (namespace === "counterparty") {
        const val = getNestedField(dataContext.counterparty, fieldPath);
        if (val != null) return String(val);
      }

      if (namespace === "previous_output") {
        const val = getNestedField(dataContext.collected_data, fieldPath);
        if (val != null) return String(val);
      }

      // Generic dotted path — try all contexts
      const wsVal = getNestedField(dataContext.workstream, key);
      if (wsVal != null) return String(wsVal);
    } else {
      // Bare name — search collected_data → workstream → counterparty
      if (dataContext.collected_data[key] != null) {
        return String(dataContext.collected_data[key]);
      }
      if (dataContext.workstream[key] != null) {
        return String(dataContext.workstream[key]);
      }
      if (dataContext.counterparty[key] != null) {
        return String(dataContext.counterparty[key]);
      }
    }

    return "[TBD]";
  });
}

// ---------------------------------------------------------------------------
// HTML → DOCX conversion (unchanged)
// ---------------------------------------------------------------------------

// Map HTML heading tags to docx HeadingLevel
const headingMap: Record<string, typeof HeadingLevel[keyof typeof HeadingLevel]> = {
  h1: HeadingLevel.HEADING_1,
  h2: HeadingLevel.HEADING_2,
  h3: HeadingLevel.HEADING_3,
  h4: HeadingLevel.HEADING_4,
  h5: HeadingLevel.HEADING_5,
  h6: HeadingLevel.HEADING_6,
};

// Extract inline runs from an element (handles bold, italic, underline)
function extractInlineRuns($: cheerio.CheerioAPI, el: cheerio.Cheerio<cheerio.AnyNode>): TextRun[] {
  const runs: TextRun[] = [];

  el.contents().each((_, node) => {
    if (node.type === "text") {
      const text = $(node).text();
      if (text.trim() || text === " ") {
        runs.push(new TextRun({ text }));
      }
    } else if (node.type === "tag") {
      const tagName = (node as cheerio.Element).tagName?.toLowerCase();
      const childEl = $(node);
      const text = childEl.text();

      if (!text.trim()) return;

      const bold = tagName === "strong" || tagName === "b" || childEl.closest("strong, b").length > 0;
      const italic = tagName === "em" || tagName === "i" || childEl.closest("em, i").length > 0;
      const underline = tagName === "u" || childEl.closest("u").length > 0;

      runs.push(new TextRun({
        text,
        bold: bold || undefined,
        italics: italic || undefined,
        underline: underline ? {} : undefined,
      }));
    }
  });

  return runs.length > 0 ? runs : [new TextRun({ text: "" })];
}

// Convert a single HTML element to docx paragraphs
function convertElementToParagraphs(
  $: cheerio.CheerioAPI,
  el: cheerio.Cheerio<cheerio.AnyNode>,
  tagName: string
): (Paragraph | Table)[] {
  const results: (Paragraph | Table)[] = [];

  // Headings
  if (headingMap[tagName]) {
    results.push(new Paragraph({
      heading: headingMap[tagName],
      children: extractInlineRuns($, el),
    }));
    return results;
  }

  // Paragraphs
  if (tagName === "p") {
    results.push(new Paragraph({
      children: extractInlineRuns($, el),
    }));
    return results;
  }

  // Lists
  if (tagName === "ul" || tagName === "ol") {
    el.children("li").each((i, li) => {
      const liEl = $(li);
      results.push(new Paragraph({
        children: extractInlineRuns($, liEl),
        bullet: tagName === "ul" ? { level: 0 } : undefined,
        numbering: tagName === "ol" ? { reference: "default-numbering", level: 0 } : undefined,
      }));
    });
    return results;
  }

  // Tables
  if (tagName === "table") {
    const rows: TableRow[] = [];

    el.find("tr").each((_, tr) => {
      const cells: TableCell[] = [];
      $(tr).find("td, th").each((_, td) => {
        const cellEl = $(td);
        const isHeader = (td as cheerio.Element).tagName?.toLowerCase() === "th";
        cells.push(new TableCell({
          children: [new Paragraph({
            children: extractInlineRuns($, cellEl).map(run => {
              if (isHeader) {
                return new TextRun({ ...run, bold: true } as any);
              }
              return run;
            }),
          })],
          width: { size: 100 / Math.max($(tr).find("td, th").length, 1), type: WidthType.PERCENTAGE },
        }));
      });

      if (cells.length > 0) {
        rows.push(new TableRow({ children: cells }));
      }
    });

    if (rows.length > 0) {
      results.push(new Table({
        rows,
        width: { size: 100, type: WidthType.PERCENTAGE },
      }));
    }
    return results;
  }

  // Divs and other block elements — recurse into children
  if (tagName === "div" || tagName === "section" || tagName === "article" || tagName === "blockquote") {
    el.children().each((_, child) => {
      const childTag = (child as cheerio.Element).tagName?.toLowerCase();
      if (childTag) {
        results.push(...convertElementToParagraphs($, $(child), childTag));
      }
    });
    return results;
  }

  // Fallback: treat as paragraph if it has text
  const text = el.text().trim();
  if (text) {
    results.push(new Paragraph({
      children: [new TextRun({ text })],
    }));
  }

  return results;
}

// Convert full HTML string to docx Document
function htmlToDocx(html: string): Document {
  const $ = cheerio.load(html);
  const children: (Paragraph | Table)[] = [];

  // Process top-level body children
  const body = $("body");
  const root = body.length > 0 ? body : $.root();

  root.children().each((_, el) => {
    const tagName = (el as cheerio.Element).tagName?.toLowerCase();
    if (tagName) {
      children.push(...convertElementToParagraphs($, $(el), tagName));
    }
  });

  // If no structured elements found, try parsing the whole thing as text
  if (children.length === 0) {
    const fullText = $.text().trim();
    if (fullText) {
      children.push(new Paragraph({
        children: [new TextRun({ text: fullText })],
      }));
    }
  }

  return new Document({
    numbering: {
      config: [{
        reference: "default-numbering",
        levels: [{
          level: 0,
          format: LevelFormat.DECIMAL,
          text: "%1.",
          alignment: AlignmentType.START,
          style: {
            paragraph: {
              indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) },
            },
          },
        }],
      }],
    },
    sections: [{
      children,
    }],
  });
}

// ---------------------------------------------------------------------------
// HTML → PDF conversion via pdf-lib
// ---------------------------------------------------------------------------

const PDF_MARGIN = 50;
const PDF_PAGE_WIDTH = 595.28;  // A4
const PDF_PAGE_HEIGHT = 841.89; // A4
const PDF_CONTENT_WIDTH = PDF_PAGE_WIDTH - PDF_MARGIN * 2;
const PDF_LINE_HEIGHT = 14;
const PDF_HEADING_SIZES: Record<string, number> = {
  h1: 24, h2: 20, h3: 16, h4: 14, h5: 12, h6: 11,
};
const PDF_BODY_SIZE = 11;

/** Wrap text to fit within maxWidth, returning an array of lines. */
function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  if (words.length === 0) return [""];
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const candidate = currentLine + " " + words[i];
    const width = font.widthOfTextAtSize(candidate, fontSize);
    if (width <= maxWidth) {
      currentLine = candidate;
    } else {
      lines.push(currentLine);
      currentLine = words[i];
    }
  }
  lines.push(currentLine);
  return lines;
}

async function htmlToPdf(html: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  let page = pdfDoc.addPage([PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT]);
  let y = PDF_PAGE_HEIGHT - PDF_MARGIN;

  function ensureSpace(needed: number) {
    if (y - needed < PDF_MARGIN) {
      page = pdfDoc.addPage([PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT]);
      y = PDF_PAGE_HEIGHT - PDF_MARGIN;
    }
  }

  function drawTextBlock(text: string, fontSize: number, useBold: boolean, indent = 0) {
    const activeFont = useBold ? boldFont : font;
    const lines = wrapText(text, activeFont, fontSize, PDF_CONTENT_WIDTH - indent);
    const lineHeight = fontSize * 1.3;

    for (const line of lines) {
      ensureSpace(lineHeight);
      page.drawText(line, {
        x: PDF_MARGIN + indent,
        y,
        size: fontSize,
        font: activeFont,
        color: rgb(0, 0, 0),
      });
      y -= lineHeight;
    }
  }

  const $ = cheerio.load(html);
  const body = $("body");
  const root = body.length > 0 ? body : $.root();

  function processElement(el: cheerio.Cheerio<cheerio.AnyNode>, tagName: string) {
    // Headings
    if (PDF_HEADING_SIZES[tagName]) {
      const size = PDF_HEADING_SIZES[tagName];
      y -= size * 0.5; // spacing before heading
      drawTextBlock(el.text().trim(), size, true);
      y -= size * 0.3; // spacing after heading
      return;
    }

    // Paragraphs
    if (tagName === "p") {
      const text = el.text().trim();
      if (text) {
        drawTextBlock(text, PDF_BODY_SIZE, false);
        y -= PDF_LINE_HEIGHT * 0.5;
      }
      return;
    }

    // Lists
    if (tagName === "ul" || tagName === "ol") {
      el.children("li").each((i, li) => {
        const text = $(li).text().trim();
        const prefix = tagName === "ol" ? `${i + 1}. ` : "\u2022 ";
        drawTextBlock(prefix + text, PDF_BODY_SIZE, false, 20);
      });
      y -= PDF_LINE_HEIGHT * 0.3;
      return;
    }

    // Tables — render as rows of text
    if (tagName === "table") {
      el.find("tr").each((_, tr) => {
        const cellTexts: string[] = [];
        $(tr).find("td, th").each((_, td) => {
          cellTexts.push($(td).text().trim());
        });
        if (cellTexts.length > 0) {
          drawTextBlock(cellTexts.join("  |  "), PDF_BODY_SIZE, false);
        }
      });
      y -= PDF_LINE_HEIGHT * 0.3;
      return;
    }

    // Block containers — recurse
    if (tagName === "div" || tagName === "section" || tagName === "article" || tagName === "blockquote") {
      el.children().each((_, child) => {
        const childTag = (child as cheerio.Element).tagName?.toLowerCase();
        if (childTag) {
          processElement($(child), childTag);
        }
      });
      return;
    }

    // Fallback
    const text = el.text().trim();
    if (text) {
      drawTextBlock(text, PDF_BODY_SIZE, false);
      y -= PDF_LINE_HEIGHT * 0.3;
    }
  }

  root.children().each((_, el) => {
    const tagName = (el as cheerio.Element).tagName?.toLowerCase();
    if (tagName) {
      processElement($(el), tagName);
    }
  });

  return await pdfDoc.save();
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let documentId: string | null = null;

  try {
    const { workstream_id, step_id, template_id, document_type, title, collected_data } =
      (await req.json()) as GenerateDocumentRequest;

    if (!workstream_id || !template_id || !document_type || !title) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Insert workstream_documents row with status: generating
    const { data: docRow, error: insertError } = await supabase
      .from("workstream_documents")
      .insert({
        workstream_id,
        step_id: step_id || null,
        template_id,
        document_type,
        title,
        status: "generating",
      })
      .select("id")
      .single();

    if (insertError || !docRow) {
      console.error("Error inserting document row:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create document record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    documentId = docRow.id;
    console.log(`Created document record ${documentId} for workstream ${workstream_id}`);

    // 2. Fetch template HTML
    const { data: template, error: templateError } = await supabase
      .from("templates")
      .select("content, name")
      .eq("id", template_id)
      .single();

    if (templateError || !template?.content) {
      throw new Error(`Template not found or empty: ${templateError?.message || "no content"}`);
    }

    console.log(`Fetched template: ${template.name}`);

    // 3. Fetch workstream context
    const { data: workstream, error: wsError } = await supabase
      .from("workstreams")
      .select(`
        *,
        counterparty:counterparties(name, counterparty_type, entity_type, relationship_status, primary_contact_name, primary_contact_email, address, state_of_formation),
        workstream_type:workstream_types(name, display_name)
      `)
      .eq("id", workstream_id)
      .single();

    if (wsError || !workstream) {
      throw new Error(`Workstream not found: ${wsError?.message}`);
    }

    console.log(`Fetched workstream context: ${workstream.name}`);

    // 4. Build data context and substitute template variables
    const { counterparty, workstream_type, ...workstreamFields } = workstream;
    const counterpartyData = (counterparty as Record<string, unknown>) || {};

    // Flatten workstream_type into workstream fields for convenience
    if (workstream_type) {
      (workstreamFields as Record<string, unknown>).workstream_type_name =
        (workstream_type as any).display_name || (workstream_type as any).name;
    }

    const dataContext = {
      workstream: workstreamFields as Record<string, unknown>,
      counterparty: counterpartyData,
      collected_data: (collected_data || {}) as Record<string, unknown>,
      current_date: new Date().toISOString().split("T")[0],
    };

    const mergedHtml = substituteTemplateVariables(template.content, dataContext);

    console.log(`Substituted template variables (${mergedHtml.length} chars)`);

    // 5. Convert to output format
    let fileBuffer: Uint8Array;
    let fileExtension: string;
    let contentType: string;

    if (document_type === "pdf") {
      fileBuffer = await htmlToPdf(mergedHtml);
      fileExtension = "pdf";
      contentType = "application/pdf";
    } else {
      // Default: DOCX
      const doc = htmlToDocx(mergedHtml);
      const buf = await Packer.toBuffer(doc);
      fileBuffer = new Uint8Array(buf);
      fileExtension = "docx";
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }

    console.log(`Generated ${fileExtension.toUpperCase()} (${fileBuffer.byteLength} bytes)`);

    // 6. Upload to Supabase Storage
    const storagePath = `${workstream_id}/${documentId}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from("workstream-documents")
      .upload(storagePath, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    console.log(`Uploaded ${fileExtension.toUpperCase()} to storage: ${storagePath}`);

    // 7. Update document row to ready
    const { error: updateError } = await supabase
      .from("workstream_documents")
      .update({
        status: "ready",
        storage_path: storagePath,
        file_format: fileExtension,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    if (updateError) {
      console.error("Error updating document status:", updateError);
    }

    console.log(`Document ${documentId} is ready`);

    return new Response(
      JSON.stringify({ success: true, document_id: documentId, storage_path: storagePath }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating document:", error);

    // Update document row with error status
    if (documentId) {
      await supabase
        .from("workstream_documents")
        .update({
          status: "error",
          error_message: error instanceof Error ? error.message : "Unknown error",
          updated_at: new Date().toISOString(),
        })
        .eq("id", documentId);
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
