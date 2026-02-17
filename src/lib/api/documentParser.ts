import { supabase } from '@/integrations/supabase/client';

export interface ParsedClause {
  id: string;
  number: string;
  title: string;
  category: string;
  text: string;
  riskLevel: 'low' | 'medium' | 'high';
  isStandard: boolean;
  businessContext: string;
}

export interface ParsedDefinition {
  term: string;
  definition: string;
}

export interface ParsedDocument {
  documentType: string;
  suggestedName: string;
  suggestedCategory: 'Sales' | 'Procurement' | 'Employment' | 'Services' | 'Partnership';
  parties: string[];
  effectiveDate: string | null;
  clauses: ParsedClause[];
  definitions: ParsedDefinition[];
  summary: string;
}

export interface ParseDocumentResponse {
  success: boolean;
  data?: ParsedDocument;
  extractedHtml?: string;
  error?: string;
}

export async function parseDocument(fileContent: string, fileName: string, fileType: string): Promise<ParseDocumentResponse> {
  const { data, error } = await supabase.functions.invoke('parse-document', {
    body: { fileContent, fileName, fileType },
  });

  if (error) {
    console.error('Error invoking parse-document:', error);
    return { success: false, error: error.message };
  }

  return data;
}

export async function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as ArrayBuffer;
      // Convert ArrayBuffer to base64
      const bytes = new Uint8Array(result);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      resolve(btoa(binary));
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsArrayBuffer(file);
  });
}
