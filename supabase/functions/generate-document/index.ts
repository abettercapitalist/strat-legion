import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, LevelFormat, convertInchesToTwip } from "https://esm.sh/docx@9.1.1";
import * as cheerio from "https://esm.sh/cheerio@1.0.0";

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
}

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let documentId: string | null = null;

  try {
    const { workstream_id, step_id, template_id, document_type, title } =
      (await req.json()) as GenerateDocumentRequest;

    if (!workstream_id || !template_id || !document_type || !title) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // 4. Call AI to merge template with workstream data
    const systemPrompt = `You are a document generation assistant. You receive an HTML template and workstream data. Your job is to merge the data into the template by replacing all placeholder fields, variables, and example values with the actual workstream data provided.

Rules:
- Replace placeholder text like [Company Name], {{counterparty}}, [DATE], etc. with actual values from the data
- Replace any obviously placeholder or example values with real data
- If the template has fields that don't have corresponding data, leave them as reasonable defaults or mark as "TBD"
- Preserve all HTML structure (headings, tables, lists, formatting)
- Return ONLY the final HTML with no explanation or markdown wrapping
- Do not add any new sections or content not in the original template
- Keep the document professional and properly formatted`;

    const userContent = `TEMPLATE HTML:
${template.content}

WORKSTREAM DATA:
${JSON.stringify({
      workstream_name: workstream.name,
      annual_value: workstream.annual_value,
      tier: workstream.tier,
      stage: workstream.stage,
      business_objective: workstream.business_objective,
      expected_close_date: workstream.expected_close_date,
      counterparty_name: workstream.counterparty?.name,
      counterparty_type: workstream.counterparty?.counterparty_type,
      counterparty_entity_type: workstream.counterparty?.entity_type,
      counterparty_contact_name: workstream.counterparty?.primary_contact_name,
      counterparty_contact_email: workstream.counterparty?.primary_contact_email,
      counterparty_address: workstream.counterparty?.address,
      counterparty_state: workstream.counterparty?.state_of_formation,
      workstream_type: workstream.workstream_type?.display_name || workstream.workstream_type?.name,
      document_type: document_type,
      current_date: new Date().toISOString().split("T")[0],
    }, null, 2)}

Merge this data into the template and return the final HTML.`;

    console.log("Calling AI gateway for template merge...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let mergedHtml = aiData.choices?.[0]?.message?.content || "";

    // Strip markdown code fences if the AI wrapped the response
    mergedHtml = mergedHtml.replace(/^```html?\n?/i, "").replace(/\n?```$/i, "").trim();

    if (!mergedHtml) {
      throw new Error("AI returned empty content");
    }

    console.log(`AI returned merged HTML (${mergedHtml.length} chars)`);

    // 5. Convert HTML to DOCX
    const doc = htmlToDocx(mergedHtml);
    const buffer = await Packer.toBuffer(doc);

    console.log(`Generated DOCX buffer (${buffer.byteLength} bytes)`);

    // 6. Upload to Supabase Storage
    const storagePath = `${workstream_id}/${documentId}.docx`;

    const { error: uploadError } = await supabase.storage
      .from("workstream-documents")
      .upload(storagePath, buffer, {
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    console.log(`Uploaded DOCX to storage: ${storagePath}`);

    // 7. Update document row to ready
    const { error: updateError } = await supabase
      .from("workstream_documents")
      .update({
        status: "ready",
        storage_path: storagePath,
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
