// Text similarity utilities for clause matching

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  
  return dp[m][n];
}

/**
 * Calculate text similarity percentage (0-100)
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
  // Normalize texts
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const norm1 = normalize(text1);
  const norm2 = normalize(text2);
  
  if (norm1 === norm2) return 100;
  if (!norm1 || !norm2) return 0;
  
  const maxLen = Math.max(norm1.length, norm2.length);
  if (maxLen === 0) return 100;
  
  const distance = levenshteinDistance(norm1, norm2);
  return Math.round((1 - distance / maxLen) * 100);
}

/**
 * Extract potential clause blocks from HTML content
 */
export function extractClauseBlocks(htmlContent: string): { title: string; text: string; index: number }[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const blocks: { title: string; text: string; index: number }[] = [];
  
  // Find section headers (bold text, headings, numbered sections)
  const elements = doc.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
  let currentTitle = '';
  let currentText = '';
  let blockIndex = 0;
  
  elements.forEach((el, idx) => {
    const text = el.textContent?.trim() || '';
    
    // Check if this looks like a section header
    const isHeader = el.tagName.startsWith('H') || 
      el.querySelector('strong, b') !== null ||
      /^\d+\.?\s+\w/.test(text) ||
      /^[A-Z][A-Z\s]+$/.test(text);
    
    if (isHeader && text.length > 3 && text.length < 100) {
      // Save previous block if exists
      if (currentTitle && currentText) {
        blocks.push({ title: currentTitle, text: currentText.trim(), index: blockIndex++ });
      }
      currentTitle = text.replace(/^\d+\.?\s*/, '');
      currentText = '';
    } else if (currentTitle && text) {
      currentText += (currentText ? ' ' : '') + text;
    }
  });
  
  // Don't forget last block
  if (currentTitle && currentText) {
    blocks.push({ title: currentTitle, text: currentText.trim(), index: blockIndex });
  }
  
  return blocks;
}

export interface ClauseMatch {
  clauseId: string;
  clauseTitle: string;
  clauseCategory: string;
  clauseText: string;
  similarity: number;
  matchType: 'exact' | 'high' | 'medium' | 'low' | 'none';
}

export interface ClauseBlock {
  title: string;
  text: string;
  index: number;
  matches?: ClauseMatch[];
  selectedMatch?: ClauseMatch;
  isNew?: boolean;
}

/**
 * Find matching clauses for a text block
 */
export function findClauseMatches(
  blockText: string,
  clauses: Array<{ id: string; title: string; category: string; text: string }>,
  threshold: number = 75
): ClauseMatch[] {
  const matches: ClauseMatch[] = [];
  
  for (const clause of clauses) {
    const similarity = calculateTextSimilarity(blockText, clause.text);
    
    let matchType: ClauseMatch['matchType'];
    if (similarity === 100) {
      matchType = 'exact';
    } else if (similarity >= 90) {
      matchType = 'high';
    } else if (similarity >= threshold) {
      matchType = 'medium';
    } else if (similarity >= 50) {
      matchType = 'low';
    } else {
      matchType = 'none';
    }
    
    if (similarity >= threshold || matchType !== 'none') {
      matches.push({
        clauseId: clause.id,
        clauseTitle: clause.title,
        clauseCategory: clause.category,
        clauseText: clause.text,
        similarity,
        matchType,
      });
    }
  }
  
  // Sort by similarity descending
  return matches.sort((a, b) => b.similarity - a.similarity);
}
