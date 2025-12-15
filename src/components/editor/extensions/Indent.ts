import { Extension } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

export const Indent = Extension.create({
  name: 'indent',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
      indentUnit: 40, // pixels per indent level
      maxIndent: 200, // max 5 levels
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const marginLeft = element.style.marginLeft;
              if (marginLeft) {
                return parseInt(marginLeft, 10) || 0;
              }
              return 0;
            },
            renderHTML: (attributes) => {
              if (!attributes.indent || attributes.indent === 0) {
                return {};
              }
              return {
                style: `margin-left: ${attributes.indent}px`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0;
              const newIndent = Math.min(
                currentIndent + this.options.indentUnit,
                this.options.maxIndent
              );
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                indent: newIndent,
              });
            }
          });

          if (dispatch) {
            dispatch(tr);
          }

          return true;
        },

      outdent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0;
              const newIndent = Math.max(currentIndent - this.options.indentUnit, 0);
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                indent: newIndent,
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

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        this.editor.commands.indent();
        return true; // Prevent default tab behavior
      },
      'Shift-Tab': () => {
        this.editor.commands.outdent();
        return true;
      },
      'Mod-]': () => {
        this.editor.commands.indent();
        return true;
      },
      'Mod-[': () => {
        this.editor.commands.outdent();
        return true;
      },
    };
  },
});
