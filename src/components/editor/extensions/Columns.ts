import { Extension } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    columns: {
      setColumns: (columns: number) => ReturnType;
    };
  }
}

export const Columns = Extension.create({
  name: 'columns',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          columns: {
            default: 1,
            parseHTML: (element) => {
              const style = element.style.columnCount;
              return style ? parseInt(style, 10) : 1;
            },
            renderHTML: (attributes) => {
              if (!attributes.columns || attributes.columns === 1) {
                return {};
              }
              return {
                style: `column-count: ${attributes.columns}; column-gap: 2rem;`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setColumns:
        (columns) =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                columns,
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
