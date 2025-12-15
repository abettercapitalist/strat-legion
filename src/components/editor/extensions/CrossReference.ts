import { Extension } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    crossReference: {
      insertCrossReference: (sectionId: string, context: 'full' | 'none', enumeratedItem?: string) => ReturnType;
    };
  }
}

// Cross-reference system for linking to sections and enumerated items
// Full context: "Section 1.5(a)" - includes parent section numbers + enumerated list item
// No context: "(a)" - only the specific enumerated item reference

export const CrossReference = Extension.create({
  name: 'crossReference',

  addCommands() {
    return {
      insertCrossReference:
        (sectionId, context, enumeratedItem) =>
        ({ chain }) => {
          // Build the reference text based on context mode
          let refText: string;
          
          if (context === 'full') {
            // Full context includes section number and any enumerated item
            refText = `Section ${sectionId}`;
            if (enumeratedItem) {
              refText += enumeratedItem; // e.g., "Section 2.1(a)"
            }
          } else {
            // No context - just the most specific reference
            if (enumeratedItem) {
              refText = enumeratedItem; // e.g., "(a)"
            } else {
              refText = sectionId.split('.').pop() || sectionId;
            }
          }
          
          // Create a unique href combining section and enumerated item
          const hrefId = enumeratedItem 
            ? `section-${sectionId}-${enumeratedItem.replace(/[()]/g, '')}`
            : `section-${sectionId}`;
          
          return chain()
            .insertContent({
              type: 'text',
              text: refText,
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: `#${hrefId}`,
                    class: 'cross-reference',
                    'data-section-ref': sectionId,
                    'data-enumerated-ref': enumeratedItem || null,
                  },
                },
              ],
            })
            .run();
        },
    };
  },
});
