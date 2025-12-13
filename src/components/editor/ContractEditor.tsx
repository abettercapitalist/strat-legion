import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect, useRef, useCallback } from 'react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import FontFamily from '@tiptap/extension-font-family';
import { EditorToolbar } from './EditorToolbar';
import { FontWeight } from './extensions/FontWeight';
import { FontSize } from './extensions/FontSize';
import { Columns } from './extensions/Columns';
import { SectionNumbering } from './extensions/SectionNumbering';
import { EnumeratedList } from './extensions/EnumeratedList';
import { CrossReference } from './extensions/CrossReference';
import { LineHeight } from './extensions/LineHeight';
import { toast } from 'sonner';

interface ContractEditorProps {
  content?: string;
  onChange?: (content: string) => void;
}

const initialContent = `<h1 style="text-align: center">Agreement</h1>
<p>This agreement is between TestCo, Inc., a Utah corporation, and NewCo, Ltd., an English limited company.</p>
<p>The parties agree as follows:</p>
<p><strong>1. Terms and conditions</strong></p>
<p>The terms and conditions of this Agreement are as follows:</p>
<p><strong>2. Definitions</strong></p>
<p>"Effective Date" means the date this Agreement is executed by both parties.</p>
<p><strong>3. Effectiveness; date.</strong></p>
<p>This agreement will become effective when both parties have signed it. The date of this agreement is the date it is signed by the last party to sign it.</p>
<p>Each party is signing this agreement on the date associated with that party's signature.</p>
<table style="width: 100%; border: none;">
  <tr>
    <td style="width: 50%; vertical-align: top; border: none; padding-right: 24px;">
      <p><strong>TestCo, Inc.</strong></p>
      <p>Signature: _____________________</p>
      <p>Name: _____________________</p>
      <p>Title: _____________________</p>
      <p>Date: _____________________</p>
    </td>
    <td style="width: 50%; vertical-align: top; border: none; padding-left: 24px;">
      <p><strong>NewCo, Ltd.</strong></p>
      <p>Signature: _____________________</p>
      <p>Name: _____________________</p>
      <p>Title: _____________________</p>
      <p>Date: _____________________</p>
    </td>
  </tr>
</table>`;

export function ContractEditor({ content, onChange }: ContractEditorProps) {
  const isInitialMount = useRef(true);
  const lastExternalContent = useRef(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Color,
      TextStyle,
      FontFamily,
      FontWeight,
      FontSize,
      LineHeight,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      Columns,
      SectionNumbering,
      EnumeratedList,
      CrossReference,
    ],
    content: content || initialContent,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[600px] p-6',
      },
      handleDrop: (view, event) => {
        const data = event.dataTransfer?.getData('application/json');
        if (data) {
          event.preventDefault();
          try {
            const clause = JSON.parse(data);
            const clauseHtml = `<p><strong>${clause.title}</strong></p><p>${clause.text}</p>`;
            const { state } = view;
            const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
            if (pos) {
              const tr = state.tr.insertText(''); // Create transaction
              view.dispatch(tr);
              // Use editor commands after dispatch
              setTimeout(() => {
                const editorInstance = (view as any).editor;
                if (editorInstance) {
                  editorInstance.chain().focus().insertContent(clauseHtml).run();
                  toast.success(`Inserted "${clause.title}"`);
                }
              }, 0);
            }
            return true;
          } catch (err) {
            console.error('Failed to parse dropped clause:', err);
          }
        }
        return false;
      },
    },
  });

  // Sync content from prop when it changes externally
  useEffect(() => {
    if (!editor) return;
    
    // Skip initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Only update if content changed externally (not from editor typing)
    if (content !== undefined && content !== lastExternalContent.current) {
      lastExternalContent.current = content;
      const currentContent = editor.getHTML();
      if (content !== currentContent) {
        editor.commands.setContent(content, { emitUpdate: false });
      }
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-full border border-border rounded-lg bg-card overflow-hidden">
      <EditorToolbar editor={editor} />
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}
