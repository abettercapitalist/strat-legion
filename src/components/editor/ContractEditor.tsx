import { useEditor, EditorContent } from '@tiptap/react';
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
import { Columns } from './extensions/Columns';
import { SectionNumbering } from './extensions/SectionNumbering';
import { EnumeratedList } from './extensions/EnumeratedList';
import { CrossReference } from './extensions/CrossReference';
import { LineHeight } from './extensions/LineHeight';

interface ContractEditorProps {
  content?: string;
  onChange?: (content: string) => void;
}

const initialContent = `<h1>AGREEMENT</h1>
<p>This Agreement ("Agreement") is entered into as of the Effective Date by and between the parties identified below.</p>
<h2>1. DEFINITIONS</h2>
<p>"Effective Date" means the date this Agreement is executed by both parties.</p>
<h2>2. TERMS AND CONDITIONS</h2>
<p>The terms and conditions of this Agreement are as follows:</p>`;

export function ContractEditor({ content, onChange }: ContractEditorProps) {
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
    },
  });

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
