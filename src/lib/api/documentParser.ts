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
  error?: string;
}

export async function parseDocument(documentContent: string, fileName: string): Promise<ParseDocumentResponse> {
  const { data, error } = await supabase.functions.invoke('parse-document', {
    body: { documentContent, fileName },
  });

  if (error) {
    console.error('Error invoking parse-document:', error);
    return { success: false, error: error.message };
  }

  return data;
}

export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve(event.target?.result as string || '');
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsText(file);
  });
}
