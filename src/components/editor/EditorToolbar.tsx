import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Table,
  Columns2,
  Highlighter,
  Type,
  Link2,
  ChevronDown,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface EditorToolbarProps {
  editor: Editor;
}

// Professional fonts - Using web-safe alternatives
// Note: Concourse and Equity from practicaltypography.com require licensing
// Using Georgia (serif) and system sans-serif as fallbacks
const FONTS = [
  { name: 'Georgia', value: 'Georgia, serif', type: 'serif' },
  { name: 'Equity Text', value: '"Equity Text B", Georgia, serif', type: 'serif' },
  { name: 'Equity Caps', value: '"Equity Caps B", Georgia, serif', type: 'serif' },
  { name: 'System Sans', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', type: 'sans' },
  { name: 'Concourse Text', value: '"Concourse Text", -apple-system, sans-serif', type: 'sans' },
  { name: 'Concourse Capital', value: '"Concourse Capital", -apple-system, sans-serif', type: 'sans' },
  { name: 'separator', value: '', type: 'separator' },
  { name: 'Custom Fonts...', value: 'custom', type: 'action' },
];

const FONT_WEIGHTS = [
  { label: '1', value: '300' },
  { label: '2', value: '400' },
  { label: '3', value: '500' },
  { label: '4', value: '600' },
  { label: '5', value: '700' },
];

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: '#fef08a' },
  { name: 'Green', value: '#bbf7d0' },
  { name: 'Blue', value: '#bfdbfe' },
  { name: 'Pink', value: '#fbcfe8' },
  { name: 'Orange', value: '#fed7aa' },
];

const TEXT_COLORS = [
  { name: 'Default', value: 'inherit' },
  { name: 'Black', value: '#111827' },
  { name: 'Gray', value: '#6b7280' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Green', value: '#16a34a' },
];

const LINE_SPACING = [
  { label: 'Single', value: '1' },
  { label: '1.15', value: '1.15' },
  { label: '1.5', value: '1.5' },
  { label: 'Double', value: '2' },
];

const SECTION_NUMBERING_STYLES = [
  { name: 'None', value: 'none' },
  { name: 'MSCD Alphanumeric', value: 'mscd-alpha', description: '1, (a), (i), (A)' },
  { name: 'MSCD Digital', value: 'mscd-digital', description: '1, 1.1, 1.1.a' },
  { name: 'Article', value: 'article', description: 'Article I, Section 1' },
  { name: 'Decimal', value: 'decimal', description: '1.0, 1.1, 1.1.1' },
];

const ENUMERATED_LIST_STYLES = [
  { name: 'Inline (a), (b), (c)', value: 'inline-alpha' },
  { name: 'Inline (1), (2), (3)', value: 'inline-numeric' },
  { name: 'Tabulated (a)', value: 'tabulated-alpha' },
  { name: 'Tabulated (1)', value: 'tabulated-numeric' },
];

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [activeHighlight, setActiveHighlight] = useState(HIGHLIGHT_COLORS[0].value);
  const [crossRefContext, setCrossRefContext] = useState<'full' | 'none'>('full');

  const isInTable = editor.isActive('table');

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/30">
      {/* Font Family Selector */}
      <Select
        value={editor.getAttributes('textStyle').fontFamily || FONTS[0].value}
        onValueChange={(value) => {
          if (value !== 'custom') {
            editor.chain().focus().setFontFamily(value).run();
          }
        }}
      >
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <SelectValue placeholder="Font" />
        </SelectTrigger>
        <SelectContent>
          {FONTS.map((font) =>
            font.type === 'separator' ? (
              <DropdownMenuSeparator key="sep" />
            ) : (
              <SelectItem
                key={font.name}
                value={font.value}
                className="text-xs"
                style={{ fontFamily: font.value }}
              >
                {font.name}
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>

      {/* Font Weight Selector */}
      <Select
        value={editor.getAttributes('textStyle').fontWeight || '400'}
        onValueChange={(value) => {
          editor.chain().focus().setFontWeight(value).run();
        }}
      >
        <SelectTrigger className="w-[60px] h-8 text-xs">
          <SelectValue placeholder="Wt" />
        </SelectTrigger>
        <SelectContent>
          {FONT_WEIGHTS.map((weight) => (
            <SelectItem key={weight.value} value={weight.value} className="text-xs">
              {weight.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Bold */}
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8', editor.isActive('bold') && 'bg-accent')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>

      {/* Italic */}
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8', editor.isActive('italic') && 'bg-accent')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>

      {/* Text Color */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Text Color">
            <Type className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="grid grid-cols-3 gap-1">
            {TEXT_COLORS.map((color) => (
              <button
                key={color.name}
                className="w-6 h-6 rounded border border-border hover:ring-2 ring-primary"
                style={{ backgroundColor: color.value === 'inherit' ? 'transparent' : color.value }}
                onClick={() => editor.chain().focus().setColor(color.value).run()}
                title={color.name}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Highlight */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2 gap-1" title="Highlight">
            <div
              className="w-4 h-4 rounded border border-border"
              style={{ backgroundColor: activeHighlight }}
            />
            <ChevronDown className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="flex gap-1">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color.name}
                className={cn(
                  'w-6 h-6 rounded border border-border hover:ring-2 ring-primary',
                  activeHighlight === color.value && 'ring-2 ring-primary'
                )}
                style={{ backgroundColor: color.value }}
                onClick={() => {
                  setActiveHighlight(color.value);
                  editor.chain().focus().toggleHighlight({ color: color.value }).run();
                }}
                title={color.name}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Text Alignment */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Alignment">
            <AlignLeft className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel className="text-xs">Horizontal</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign('left').run()}>
            <AlignLeft className="h-4 w-4 mr-2" /> Left
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign('center').run()}>
            <AlignCenter className="h-4 w-4 mr-2" /> Center
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign('right').run()}>
            <AlignRight className="h-4 w-4 mr-2" /> Right
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
            <AlignJustify className="h-4 w-4 mr-2" /> Justify
          </DropdownMenuItem>
          {isInTable && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs">Vertical (Table)</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => editor.chain().focus().setCellAttribute('verticalAlign', 'top').run()}>
                <AlignVerticalJustifyStart className="h-4 w-4 mr-2" /> Top
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().setCellAttribute('verticalAlign', 'middle').run()}>
                <AlignVerticalJustifyCenter className="h-4 w-4 mr-2" /> Middle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().setCellAttribute('verticalAlign', 'bottom').run()}>
                <AlignVerticalJustifyEnd className="h-4 w-4 mr-2" /> Bottom
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Line Spacing */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Line Spacing">
            <Highlighter className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {LINE_SPACING.map((spacing) => (
            <DropdownMenuItem
              key={spacing.value}
              onClick={() => editor.chain().focus().setLineHeight(spacing.value).run()}
            >
              {spacing.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Bullets */}
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8', editor.isActive('bulletList') && 'bg-accent')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </Button>

      {/* Section Numbering */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2 gap-1" title="Section Numbering">
            <span className="text-xs font-mono">§</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {SECTION_NUMBERING_STYLES.map((style) => (
            <DropdownMenuItem
              key={style.value}
              onClick={() => editor.chain().focus().setSectionNumbering(style.value).run()}
            >
              <div className="flex flex-col">
                <span>{style.name}</span>
                {style.description && (
                  <span className="text-xs text-muted-foreground">{style.description}</span>
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Enumerated Lists */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Enumerated List">
            <ListOrdered className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {ENUMERATED_LIST_STYLES.map((style) => (
            <DropdownMenuItem
              key={style.value}
              onClick={() => editor.chain().focus().setEnumeratedList(style.value).run()}
            >
              {style.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Cross-References */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Cross-Reference">
            <Link2 className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64">
          <DropdownMenuLabel className="text-xs">Context Mode</DropdownMenuLabel>
          <DropdownMenuItem
            className={cn(crossRefContext === 'full' && 'bg-accent')}
            onClick={() => setCrossRefContext('full')}
          >
            Full context (e.g., "Section 1.5(a)")
          </DropdownMenuItem>
          <DropdownMenuItem
            className={cn(crossRefContext === 'none' && 'bg-accent')}
            onClick={() => setCrossRefContext('none')}
          >
            No context (e.g., "(a)" only)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs">Available Sections</DropdownMenuLabel>
          <div className="max-h-48 overflow-y-auto">
            <DropdownMenuItem
              onClick={() => editor.chain().focus().insertCrossReference('1', crossRefContext).run()}
            >
              Section 1 - Definitions
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().insertCrossReference('2', crossRefContext).run()}
            >
              Section 2 - Terms and Conditions
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Columns */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Columns">
            <Columns2 className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => editor.chain().focus().setColumns(1).run()}>
            Single Column
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().setColumns(2).run()}>
            Two Columns
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Tables */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Insert Table">
            <Table className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel className="text-xs">Insert Table</DropdownMenuLabel>
          <div className="grid grid-cols-5 gap-1 p-2">
            {[1, 2, 3, 4, 5].map((rows) =>
              [1, 2, 3, 4, 5].map((cols) => (
                <button
                  key={`${rows}-${cols}`}
                  className="w-4 h-4 border border-border hover:bg-primary hover:border-primary"
                  onClick={() =>
                    editor
                      .chain()
                      .focus()
                      .insertTable({ rows, cols, withHeaderRow: true })
                      .run()
                  }
                  title={`${cols}×${rows}`}
                />
              ))
            )}
          </div>
          <div className="px-2 pb-2 text-xs text-muted-foreground text-center">
            Select size
          </div>
          {isInTable && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => editor.chain().focus().addColumnBefore().run()}>
                Add column before
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}>
                Add column after
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()}>
                Delete column
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => editor.chain().focus().addRowBefore().run()}>
                Add row before
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}>
                Add row after
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()}>
                Delete row
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => editor.chain().focus().deleteTable().run()}>
                Delete table
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
