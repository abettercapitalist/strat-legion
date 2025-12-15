import { Extension } from '@tiptap/core';

export type EnumeratedListStyle = 'integrated-alpha' | 'integrated-numeric' | 'tabulated-alpha' | 'tabulated-numeric';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    enumeratedList: {
      setEnumeratedList: (style: string) => ReturnType;
    };
  }
}

// Enumerated list formats for inline and tabulated lists
// Inline: (a) item text (b) item text (c) item text
// Tabulated: 
//   (a) item text
//   (b) item text

export const EnumeratedList = Extension.create({
  name: 'enumeratedList',

  addOptions() {
    return {
      types: ['orderedList'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          enumStyle: {
            default: null,
            parseHTML: (element) => element.getAttribute('data-enum-style'),
            renderHTML: (attributes) => {
              if (!attributes.enumStyle) {
                return {};
              }
              
              const styleMap: Record<string, string> = {
                'integrated-alpha': 'list-style-type: lower-alpha; display: inline;',
                'integrated-numeric': 'list-style-type: decimal; display: inline;',
                'tabulated-alpha': 'list-style-type: lower-alpha;',
                'tabulated-numeric': 'list-style-type: decimal;',
              };

              return {
                'data-enum-style': attributes.enumStyle,
                style: styleMap[attributes.enumStyle] || '',
                class: attributes.enumStyle.startsWith('integrated') ? 'enum-integrated' : 'enum-tabulated',
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setEnumeratedList:
        (style) =>
        ({ chain }) => {
          return chain()
            .toggleOrderedList()
            .updateAttributes('orderedList', { enumStyle: style })
            .run();
        },
    };
  },
});
