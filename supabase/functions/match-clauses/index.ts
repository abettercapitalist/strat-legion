import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ClauseInput {
  id: string;
  title: string;
  category: string;
  text: string;
}

interface ClauseBlock {
  title: string;
  text: string;
  index: number;
}

interface MatchResult {
  blockIndex: number;
  blockTitle: string;
  blockText: string;
  matches: Array<{
    clauseId: string;
    clauseTitle: string;
    clauseCategory: string;
    similarity: number;
    semanticMatch: boolean;
    reasoning?: string;
  }>;
  suggestedAction: 'use_existing' | 'add_as_alternative' | 'add_as_new';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { blocks, clauses } = await req.json() as {
      blocks: ClauseBlock[];
      clauses: ClauseInput[];
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const results: MatchResult[] = [];

    // Process each block
    for (const block of blocks) {
      // First, do text similarity matching (quick filter)
      const textMatches = clauses.map(clause => {
        const similarity = calculateTextSimilarity(block.text, clause.text);
        return { clause, similarity };
      }).filter(m => m.similarity >= 50)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5); // Top 5 candidates

      if (textMatches.length === 0 || textMatches[0].similarity < 75) {
        // Use AI to check if there's a semantic match
        const aiResult = await checkSemanticMatch(
          block,
          clauses.slice(0, 10), // Check against top 10 by category similarity
          LOVABLE_API_KEY
        );

        results.push({
          blockIndex: block.index,
          blockTitle: block.title,
          blockText: block.text,
          matches: aiResult.matches,
          suggestedAction: aiResult.matches.length > 0 && aiResult.matches[0].similarity >= 75
            ? 'add_as_alternative'
            : 'add_as_new',
        });
      } else {
        // We have text matches, verify with AI for close matches
        const topMatch = textMatches[0];
        
        if (topMatch.similarity === 100) {
          results.push({
            blockIndex: block.index,
            blockTitle: block.title,
            blockText: block.text,
            matches: [{
              clauseId: topMatch.clause.id,
              clauseTitle: topMatch.clause.title,
              clauseCategory: topMatch.clause.category,
              similarity: 100,
              semanticMatch: true,
            }],
            suggestedAction: 'use_existing',
          });
        } else {
          // Verify close matches with AI
          const candidateClauses = textMatches.map(m => m.clause);
          const aiResult = await checkSemanticMatch(block, candidateClauses, LOVABLE_API_KEY);
          
          results.push({
            blockIndex: block.index,
            blockTitle: block.title,
            blockText: block.text,
            matches: aiResult.matches,
            suggestedAction: aiResult.matches[0]?.similarity >= 90
              ? 'use_existing'
              : aiResult.matches[0]?.similarity >= 75
                ? 'add_as_alternative'
                : 'add_as_new',
          });
        }
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in match-clauses:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function calculateTextSimilarity(text1: string, text2: string): number {
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const norm1 = normalize(text1);
  const norm2 = normalize(text2);
  
  if (norm1 === norm2) return 100;
  if (!norm1 || !norm2) return 0;
  
  // Use word-based Jaccard similarity for efficiency
  const words1 = new Set(norm1.split(' '));
  const words2 = new Set(norm2.split(' '));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return Math.round((intersection.size / union.size) * 100);
}

async function checkSemanticMatch(
  block: ClauseBlock,
  candidateClauses: ClauseInput[],
  apiKey: string
): Promise<{ matches: MatchResult['matches'] }> {
  const systemPrompt = `You are a legal contract clause analyzer. Compare the given clause text with candidate clauses from a clause library and determine semantic similarity.

For each candidate, provide:
1. A similarity score (0-100) based on legal meaning and intent, not just word overlap
2. Whether it's a semantic match (same legal meaning even if different wording)
3. Brief reasoning

Return JSON in this exact format:
{
  "matches": [
    {
      "clauseId": "id",
      "similarity": 85,
      "semanticMatch": true,
      "reasoning": "Both clauses address confidentiality obligations with similar scope"
    }
  ]
}`;

  const userPrompt = `Clause from document:
Title: ${block.title}
Text: ${block.text}

Candidate clauses from library:
${candidateClauses.map((c, i) => `
${i + 1}. ID: ${c.id}
   Title: ${c.title}
   Category: ${c.category}
   Text: ${c.text}
`).join('\n')}

Analyze semantic similarity and return matches with similarity >= 50.`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      // Fallback to text similarity only
      return {
        matches: candidateClauses.map(c => ({
          clauseId: c.id,
          clauseTitle: c.title,
          clauseCategory: c.category,
          similarity: calculateTextSimilarity(block.text, c.text),
          semanticMatch: false,
        })).filter(m => m.similarity >= 50),
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        matches: (parsed.matches || []).map((m: any) => ({
          clauseId: m.clauseId,
          clauseTitle: candidateClauses.find(c => c.id === m.clauseId)?.title || '',
          clauseCategory: candidateClauses.find(c => c.id === m.clauseId)?.category || '',
          similarity: m.similarity,
          semanticMatch: m.semanticMatch,
          reasoning: m.reasoning,
        })),
      };
    }
    
    return { matches: [] };
  } catch (error) {
    console.error("AI matching error:", error);
    return { matches: [] };
  }
}
