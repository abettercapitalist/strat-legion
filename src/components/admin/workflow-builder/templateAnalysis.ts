import type { UpstreamOutput } from './outputSchemas';

export interface TemplateVariable {
  raw: string;
  namespace: string | null;
  fieldPath: string;
}

export interface AnalyzedVariable extends TemplateVariable {
  status: 'resolved' | 'unresolved';
  sourceLabel: string;
}

/** Well-known namespaces that are always available at runtime */
const ALWAYS_AVAILABLE_NAMESPACES = ['workstream', 'user', 'play_config'] as const;

/**
 * Extract {{variable}} placeholders from template content.
 * Uses the same regex as the brick engine (`/\{\{([^}]+)\}\}/g`).
 */
export function extractTemplateVariables(content: string): TemplateVariable[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const seen = new Set<string>();
  const variables: TemplateVariable[] = [];

  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const raw = match[1].trim();
    if (seen.has(raw)) continue;
    seen.add(raw);

    const dotIndex = raw.indexOf('.');
    if (dotIndex > 0) {
      variables.push({
        raw,
        namespace: raw.slice(0, dotIndex),
        fieldPath: raw.slice(dotIndex + 1),
      });
    } else {
      variables.push({ raw, namespace: null, fieldPath: raw });
    }
  }

  return variables;
}

/**
 * Analyze each template variable against available upstream outputs.
 * Returns each variable with a `resolved` or `unresolved` status.
 */
export function analyzeTemplateCoverage(
  variables: TemplateVariable[],
  upstreamOutputs: UpstreamOutput[],
): AnalyzedVariable[] {
  // Build a set of field names available from upstream collection bricks
  const upstreamFieldMap = new Map<string, string>(); // fieldName → "NodeLabel > fieldName"
  for (const upstream of upstreamOutputs) {
    if (upstream.brickCategory === 'collection') {
      for (const field of upstream.fields) {
        upstreamFieldMap.set(field.name, `${upstream.nodeLabel} > ${field.name}`);
      }
    }
  }

  return variables.map((v): AnalyzedVariable => {
    // Always-available namespaces
    if (v.namespace && (ALWAYS_AVAILABLE_NAMESPACES as readonly string[]).includes(v.namespace)) {
      return { ...v, status: 'resolved', sourceLabel: `Always available (${v.namespace})` };
    }

    // previous_output.* — strip prefix and match against upstream fields
    if (v.namespace === 'previous_output') {
      const match = upstreamFieldMap.get(v.fieldPath);
      if (match) {
        return { ...v, status: 'resolved', sourceLabel: match };
      }
      return { ...v, status: 'unresolved', sourceLabel: 'No matching upstream field' };
    }

    // Bare names (no dot) — match directly against upstream field names
    if (v.namespace === null) {
      const match = upstreamFieldMap.get(v.fieldPath);
      if (match) {
        return { ...v, status: 'resolved', sourceLabel: match };
      }
      return { ...v, status: 'unresolved', sourceLabel: 'No matching upstream field' };
    }

    // Unknown namespace
    return { ...v, status: 'unresolved', sourceLabel: 'No matching upstream field' };
  });
}
