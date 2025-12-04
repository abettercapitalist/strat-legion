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
  Type,
  Link2,
  ChevronDown,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  Highlighter,
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
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface EditorToolbarProps {
  editor: Editor;
}

// Professional fonts - Using web-safe alternatives with Concourse-like option
const FONTS = [
  { name: 'Georgia', value: 'Georgia, serif', type: 'serif' },
  { name: 'Equity Text', value: '"Equity Text B", Georgia, serif', type: 'serif' },
  { name: 'Equity Caps', value: '"Equity Caps B", Georgia, serif', type: 'serif' },
  { name: 'Concourse Text', value: '"Source Sans 3", "Inter", -apple-system, sans-serif', type: 'sans' },
  { name: 'System Sans', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', type: 'sans' },
  { name: 'separator', value: '', type: 'separator' },
  { name: 'Custom Fonts...', value: 'custom', type: 'action' },
];

// Standard font sizes
const FONT_SIZES = [
  { label: '10', value: '10px' },
  { label: '11', value: '11px' },
  { label: '12', value: '12px' },
  { label: '14', value: '14px' },
  { label: '16', value: '16px' },
  { label: '18', value: '18px' },
  { label: '20', value: '20px' },
  { label: '24', value: '24px' },
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

// Formatting styles for the Formatting dropdown
const FORMATTING_STYLES = [
  { name: 'Title', value: 'title', description: '1.5x size, capitalized' },
  { name: 'Body text', value: 'body', description: 'Standard paragraph' },
  { name: 'MSCD Sections', value: 'mscd-alpha', description: '1, (a), (i), (A)' },
  { name: 'MSCD Articles', value: 'mscd-digital', description: '1, 1.1, 1.1.a' },
  { name: 'Articles', value: 'article', description: 'Article I, Section 1' },
  { name: 'Section text', value: 'section-text', description: 'Indented body text' },
];

const ENUMERATED_LIST_STYLES = [
  { name: 'Inline (a), (b), (c)', value: 'inline-alpha' },
  { name: 'Inline (1), (2), (3)', value: 'inline-numeric' },
  { name: 'Tabulated (a)', value: 'tabulated-alpha' },
  { name: 'Tabulated (1)', value: 'tabulated-numeric' },
];

// Custom Line Spacing Icon - lines with vertical bidirectional arrow
function LineSpacingIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      {/* Three horizontal lines */}
      <line x1="9" y1="6" x2="21" y2="6" />
      <line x1="9" y1="12" x2="21" y2="12" />
      <line x1="9" y1="18" x2="21" y2="18" />
      {/* Bidirectional vertical arrow */}
      <line x1="4" y1="5" x2="4" y2="19" />
      <polyline points="2,7 4,5 6,7" />
      <polyline points="2,17 4,19 6,17" />
    </svg>
  );
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [activeHighlight, setActiveHighlight] = useState(HIGHLIGHT_COLORS[0].value);
  const [crossRefContext, setCrossRefContext] = useState<'full' | 'none'>('full');
  const [lastFormattingStyle, setLastFormattingStyle] = useState<string>('body');

  const isInTable = editor.isActive('table');

  // Get current font size from editor
  const currentFontSize = editor.getAttributes('textStyle').fontSize || '16px';

  // Apply formatting style
  const applyFormattingStyle = (style: string) => {
    setLastFormattingStyle(style);
    
    switch (style) {
      case 'title':
        // Title: 1.5x size (24px if base is 16px), capitalized font
        editor.chain().focus()
          .setFontFamily('"Source Sans 3", "Inter", -apple-system, sans-serif')
          .run();
        // Apply title formatting via section numbering extension
        editor.chain().focus().setSectionNumbering('none').run();
        break;
      case 'body':
        // Body text: standard paragraph
        editor.chain().focus().setSectionNumbering('none').run();
        break;
      case 'section-text':
        // Section text: indented body text
        editor.chain().focus().setSectionNumbering('none').run();
        break;
      case 'mscd-alpha':
      case 'mscd-digital':
      case 'article':
        editor.chain().focus().setSectionNumbering(style).run();
        break;
      default:
        break;
    }
  };

  // Smart defaults: Listen for Enter key after heading styles
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        // Check if current style is a heading style
        const headingStyles = ['mscd-alpha', 'mscd-digital', 'article'];
        if (headingStyles.includes(lastFormattingStyle)) {
          // After a slight delay, switch to section-text
          setTimeout(() => {
            setLastFormattingStyle('section-text');
          }, 50);
        }
      }
    };

    const editorElement = document.querySelector('.ProseMirror');
    editorElement?.addEventListener('keydown', handleKeyDown);
    
    return () => {
      editorElement?.removeEventListener('keydown', handleKeyDown);
    };
  }, [lastFormattingStyle]);

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

      {/* Font Size Selector */}
      <Select
        value={currentFontSize}
        onValueChange={(value) => {
          editor.chain().focus().setMark('textStyle', { fontSize: value }).run();
        }}
      >
        <SelectTrigger className="w-[70px] h-8 text-xs">
          <SelectValue placeholder="Size" />
        </SelectTrigger>
        <SelectContent>
          {FONT_SIZES.map((size) => (
            <SelectItem key={size.value} value={size.value} className="text-xs">
              {size.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Formatting Dropdown - moved here after font size */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2 gap-1" title="Formatting">
            <Type className="h-4 w-4" />
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {FORMATTING_STYLES.map((style) => (
            <DropdownMenuItem
              key={style.value}
              onClick={() => applyFormattingStyle(style.value)}
              className={cn(lastFormattingStyle === style.value && 'bg-accent')}
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
            <span className="text-sm font-semibold">A</span>
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

      {/* Highlight - with highlighter icon inside the color box */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2 gap-1" title="Highlight">
            <div
              className="w-5 h-5 rounded border border-border flex items-center justify-center"
              style={{ backgroundColor: activeHighlight }}
            >
              <Highlighter className="h-3 w-3 text-gray-700" />
            </div>
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

      {/* Line Spacing - with custom icon */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Line Spacing">
            <LineSpacingIcon className="h-4 w-4" />
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

      {/* Bullets - moved next to Enumerated Lists */}
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8', editor.isActive('bulletList') && 'bg-accent')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </Button>

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
              Section 1 - Terms and conditions
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().insertCrossReference('2', crossRefContext).run()}
            >
              Section 2 - Definitions
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