import { Extension } from '@tiptap/core';

export type SectionNumberingStyle = 'none' | 'mscd-alpha' | 'mscd-digital' | 'article' | 'decimal';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    sectionNumbering: {
      setSectionNumbering: (style: string) => ReturnType;
    };
  }
}

// MSCD-compliant numbering formats:
// Alphanumeric: 1, (a), (i), (A) - max 4 levels
// Digital: 1, 1.1, 1.1.a - max 4 levels

const NUMBERING_FORMATS = {
  'mscd-alpha': {
    levels: [
      (n: number) => `${n}`,           // Level 1: 1, 2, 3
      (n: number) => `(${String.fromCharCode(96 + n)})`,  // Level 2: (a), (b), (c)
      (n: number) => `(${toRoman(n).toLowerCase()})`,     // Level 3: (i), (ii), (iii)
      (n: number) => `(${String.fromCharCode(64 + n)})`,  // Level 4: (A), (B), (C)
    ],
    maxLevel: 4,
  },
  'mscd-digital': {
    levels: [
      (n: number, parents: number[]) => `Section ${n}`,
      (n: number, parents: number[]) => `Section ${parents[0]}.${n}`,
      (n: number, parents: number[]) => `Section ${parents[0]}.${parents[1]}.${String.fromCharCode(96 + n)}`,
      (n: number, parents: number[]) => `Section ${parents[0]}.${parents[1]}.${String.fromCharCode(96 + parents[2])}.${n}`,
    ],
    maxLevel: 4,
  },
  article: {
    levels: [
      (n: number) => `Article ${toRoman(n)}`,
      (n: number) => `Section ${n}`,
      (n: number) => `${n}`,
      (n: number) => `(${String.fromCharCode(96 + n)})`,
    ],
    maxLevel: 4,
  },
  decimal: {
    levels: [
      (n: number) => `${n}.0`,
      (n: number, parents: number[]) => `${parents[0]}.${n}`,
      (n: number, parents: number[]) => `${parents[0]}.${parents[1]}.${n}`,
      (n: number, parents: number[]) => `${parents[0]}.${parents[1]}.${parents[2]}.${n}`,
    ],
    maxLevel: 4,
  },
};

function toRoman(num: number): string {
  const romanNumerals: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  
  let result = '';
  for (const [value, numeral] of romanNumerals) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return result;
}

export const SectionNumbering = Extension.create({
  name: 'sectionNumbering',

  addOptions() {
    return {
      types: ['heading', 'paragraph'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          sectionStyle: {
            default: 'none',
            parseHTML: (element) => element.getAttribute('data-section-style') || 'none',
            renderHTML: (attributes) => {
              if (!attributes.sectionStyle || attributes.sectionStyle === 'none') {
                return {};
              }
              return {
                'data-section-style': attributes.sectionStyle,
              };
            },
          },
          sectionLevel: {
            default: 1,
            parseHTML: (element) => parseInt(element.getAttribute('data-section-level') || '1', 10),
            renderHTML: (attributes) => {
              return {
                'data-section-level': attributes.sectionLevel,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setSectionNumbering:
        (style) =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                sectionStyle: style,
              });
            }
          });

          if (dispatch) {
            dispatch(tr);
          }

          return true;
        },
    };
  },
});

export { NUMBERING_FORMATS };
