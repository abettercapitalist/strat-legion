import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, LevelFormat, convertInchesToTwip } from "npm:docx@9.1.1";
import * as cheerio from "npm:cheerio@1.0.0";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExportTemplateRequest {
  html: string;
  format: "docx" | "pdf";
  filename: string;
}

// ---------------------------------------------------------------------------
// HTML -> DOCX conversion (same as generate-document)
// ---------------------------------------------------------------------------

const headingMap: Record<string, typeof HeadingLevel[keyof typeof HeadingLevel]> = {
  h1: HeadingLevel.HEADING_1,
  h2: HeadingLevel.HEADING_2,
  h3: HeadingLevel.HEADING_3,
  h4: HeadingLevel.HEADING_4,
  h5: HeadingLevel.HEADING_5,
  h6: HeadingLevel.HEADING_6,
};

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

function convertElementToParagraphs(
  $: cheerio.CheerioAPI,
  el: cheerio.Cheerio<cheerio.AnyNode>,
  tagName: string
): (Paragraph | Table)[] {
  const results: (Paragraph | Table)[] = [];

  if (headingMap[tagName]) {
    results.push(new Paragraph({
      heading: headingMap[tagName],
      children: extractInlineRuns($, el),
    }));
    return results;
  }

  if (tagName === "p") {
    results.push(new Paragraph({
      children: extractInlineRuns($, el),
    }));
    return results;
  }

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

  if (tagName === "div" || tagName === "section" || tagName === "article" || tagName === "blockquote") {
    el.children().each((_, child) => {
      const childTag = (child as cheerio.Element).tagName?.toLowerCase();
      if (childTag) {
        results.push(...convertElementToParagraphs($, $(child), childTag));
      }
    });
    return results;
  }

  const text = el.text().trim();
  if (text) {
    results.push(new Paragraph({
      children: [new TextRun({ text })],
    }));
  }

  return results;
}

function htmlToDocx(html: string): Document {
  const $ = cheerio.load(html);
  const children: (Paragraph | Table)[] = [];

  const body = $("body");
  const root = body.length > 0 ? body : $.root();

  root.children().each((_, el) => {
    const tagName = (el as cheerio.Element).tagName?.toLowerCase();
    if (tagName) {
      children.push(...convertElementToParagraphs($, $(el), tagName));
    }
  });

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
// HTML -> PDF conversion via pdf-lib (same as generate-document)
// ---------------------------------------------------------------------------

const PDF_MARGIN = 50;
const PDF_PAGE_WIDTH = 595.28;
const PDF_PAGE_HEIGHT = 841.89;
const PDF_CONTENT_WIDTH = PDF_PAGE_WIDTH - PDF_MARGIN * 2;
const PDF_LINE_HEIGHT = 14;
const PDF_HEADING_SIZES: Record<string, number> = {
  h1: 24, h2: 20, h3: 16, h4: 14, h5: 12, h6: 11,
};
const PDF_BODY_SIZE = 11;

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
    if (PDF_HEADING_SIZES[tagName]) {
      const size = PDF_HEADING_SIZES[tagName];
      y -= size * 0.5;
      drawTextBlock(el.text().trim(), size, true);
      y -= size * 0.3;
      return;
    }

    if (tagName === "p") {
      const text = el.text().trim();
      if (text) {
        drawTextBlock(text, PDF_BODY_SIZE, false);
        y -= PDF_LINE_HEIGHT * 0.5;
      }
      return;
    }

    if (tagName === "ul" || tagName === "ol") {
      el.children("li").each((i, li) => {
        const text = $(li).text().trim();
        const prefix = tagName === "ol" ? `${i + 1}. ` : "\u2022 ";
        drawTextBlock(prefix + text, PDF_BODY_SIZE, false, 20);
      });
      y -= PDF_LINE_HEIGHT * 0.3;
      return;
    }

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

    if (tagName === "div" || tagName === "section" || tagName === "article" || tagName === "blockquote") {
      el.children().each((_, child) => {
        const childTag = (child as cheerio.Element).tagName?.toLowerCase();
        if (childTag) {
          processElement($(child), childTag);
        }
      });
      return;
    }

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

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { html, format, filename } = (await req.json()) as ExportTemplateRequest;

    if (!html || !format) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: html, format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let fileBuffer: Uint8Array;
    let contentType: string;
    let fileExtension: string;

    if (format === "pdf") {
      fileBuffer = await htmlToPdf(html);
      contentType = "application/pdf";
      fileExtension = "pdf";
    } else {
      const doc = htmlToDocx(html);
      const buf = await Packer.toBuffer(doc);
      fileBuffer = new Uint8Array(buf);
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      fileExtension = "docx";
    }

    const baseName = (filename || "template").replace(/\.[^/.]+$/, "");
    const outputFilename = `${baseName}.${fileExtension}`;

    console.log(`Exported ${fileExtension.toUpperCase()} (${fileBuffer.byteLength} bytes): ${outputFilename}`);

    return new Response(
      JSON.stringify({
        data: uint8ArrayToBase64(fileBuffer),
        filename: outputFilename,
        content_type: contentType,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error exporting template:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
