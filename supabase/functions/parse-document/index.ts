import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentContent, fileName } = await req.json();

    if (!documentContent) {
      return new Response(
        JSON.stringify({ success: false, error: 'Document content is required' }),
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

    console.log("Parsing document:", fileName);

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
      "number": "1",
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
          { role: "user", content: `Parse the following document and extract structured clause information:\n\n${documentContent}` }
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
      JSON.stringify({ success: true, data: parsedDocument }),
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
