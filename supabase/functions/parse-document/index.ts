import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UnstructuredElement {
  type: string;
  text: string;
  metadata?: {
    text_as_html?: string;
  };
}

// Extract text and HTML from PDF/DOCX via Unstructured.io API
async function extractViaUnstructured(base64Content: string, fileName: string): Promise<UnstructuredElement[]> {
  const UNSTRUCTURED_API_KEY = Deno.env.get("UNSTRUCTURED_API_KEY");
  if (!UNSTRUCTURED_API_KEY) {
    throw new Error("UNSTRUCTURED_API_KEY not configured");
  }

  // Decode base64 to binary
  const binaryString = atob(base64Content);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const formData = new FormData();
  formData.append("files", new Blob([bytes]), fileName);
  formData.append("strategy", "hi_res");

  const response = await fetch("https://api.unstructured.io/general/v0/general", {
    method: "POST",
    headers: {
      "unstructured-api-key": UNSTRUCTURED_API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Unstructured API error:", response.status, errorText);
    throw new Error(`Document extraction failed (${response.status})`);
  }

  const elements: UnstructuredElement[] = await response.json();
  return elements;
}

// Convert Unstructured elements to plain text for AI clause parsing
function elementsToText(elements: UnstructuredElement[]): string {
  return elements.map(el => {
    switch (el.type) {
      case "Title":
        return `\n\n${el.text}\n`;
      case "ListItem":
        return `\n- ${el.text}`;
      case "NarrativeText":
      default:
        return `\n${el.text}`;
    }
  }).join("").trim();
}

// Convert Unstructured elements to HTML for template content
function elementsToHtml(elements: UnstructuredElement[]): string {
  const parts: string[] = [];
  let inList = false;

  for (const el of elements) {
    if (el.type === "ListItem") {
      if (!inList) {
        parts.push("<ul>");
        inList = true;
      }
      parts.push(`<li>${el.text}</li>`);
      continue;
    }

    // Close any open list
    if (inList) {
      parts.push("</ul>");
      inList = false;
    }

    switch (el.type) {
      case "Title":
        parts.push(`<h2>${el.text}</h2>`);
        break;
      case "Table":
        parts.push(el.metadata?.text_as_html || `<p>${el.text}</p>`);
        break;
      case "NarrativeText":
      default:
        parts.push(`<p>${el.text}</p>`);
        break;
    }
  }

  if (inList) {
    parts.push("</ul>");
  }

  return parts.join("\n");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileContent, fileName, fileType } = await req.json();

    if (!fileContent) {
      return new Response(
        JSON.stringify({ success: false, error: 'File content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Parsing document:", fileName, "Type:", fileType);

    let documentText = "";
    let extractedHtml: string | undefined;

    // Handle different file types
    if (fileType === 'text/plain' || fileType === 'text/rtf') {
      // Plain text - decode from base64
      const binaryString = atob(fileContent);
      documentText = binaryString;
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx') ||
      fileType === 'application/pdf' ||
      fileName.endsWith('.pdf')
    ) {
      // PDF and DOCX - extract via Unstructured.io
      try {
        const elements = await extractViaUnstructured(fileContent, fileName);
        documentText = elementsToText(elements);
        extractedHtml = elementsToHtml(elements);
      } catch (extractError) {
        console.error("Unstructured extraction error:", extractError);
        return new Response(
          JSON.stringify({ success: false, error: extractError instanceof Error ? extractError.message : 'Failed to extract document content.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (fileType === 'application/msword' || fileName.endsWith('.doc')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Legacy .doc format not supported. Please save as .docx and try again.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, error: `Unsupported file type: ${fileType}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!documentText || documentText.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Could not extract text from document' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Extracted text length:", documentText.length);

    const systemPrompt = `You are a legal document parser that extracts structured information from contracts and legal documents.

Your task is to:
1. Identify the document type (NDA, SaaS Agreement, Services Agreement, etc.)
2. Extract all clauses from the document
3. Categorize each clause (Confidentiality, Term, Termination, Liability, IP, etc.)
4. Assess risk level for each clause (low, medium, high)
5. Extract the main parties mentioned
6. Identify key terms and definitions

Return a JSON object with this exact structure:
{
  "documentType": "string - type of document",
  "suggestedName": "string - suggested template name based on content",
  "suggestedCategory": "Sales" | "Procurement" | "Employment" | "Services" | "Partnership",
  "parties": ["array of party names mentioned"],
  "effectiveDate": "string or null",
  "clauses": [
    {
      "id": "clause-1",
      "title": "string - clause title",
      "category": "string - clause category",
      "text": "string - full clause text",
      "riskLevel": "low" | "medium" | "high",
      "isStandard": true/false,
      "businessContext": "string - brief explanation of what this clause does"
    }
  ],
  "definitions": [
    {
      "term": "string",
      "definition": "string"
    }
  ],
  "summary": "string - brief summary of the document"
}

Be thorough in extracting ALL clauses from the document. Preserve the original text of each clause.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Parse the following document and extract structured clause information:\n\n${documentText}` }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI usage limit reached. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: 'Failed to parse document' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ success: false, error: 'No response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let parsedDocument;
    try {
      parsedDocument = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", e);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid AI response format' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Document parsed successfully:", parsedDocument.suggestedName);

    return new Response(
      JSON.stringify({ success: true, data: parsedDocument, extractedHtml }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error parsing document:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
