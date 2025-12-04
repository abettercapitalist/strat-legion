import { Extension } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    crossReference: {
      insertCrossReference: (sectionId: string, context: 'full' | 'none') => ReturnType;
    };
  }
}

// Cross-reference system for linking to sections and enumerated items
// Full context: "Section 1.5(a)" - includes all parent section numbers
// No context: "(a)" - only the specific subsection/item reference

export const CrossReference = Extension.create({
  name: 'crossReference',

  addCommands() {
    return {
      insertCrossReference:
        (sectionId, context) =>
        ({ chain, editor }) => {
          // In a real implementation, this would look up the section
          // and generate the appropriate reference text based on the numbering style
          
          const fullRef = `Section ${sectionId}`;
          const shortRef = sectionId.split('.').pop() || sectionId;
          
          const refText = context === 'full' ? fullRef : shortRef;
          
          return chain()
            .insertContent({
              type: 'text',
              text: refText,
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: `#section-${sectionId}`,
                    class: 'cross-reference',
                    'data-section-ref': sectionId,
                  },
                },
              ],
            })
            .run();
        },
    };
  },
});
