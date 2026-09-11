/**
 * rich-text-editor.tsx
 *
 * A lightweight rich text editor based on the browser's native `contenteditable`
 * API — no external dependency.  It outputs and accepts raw HTML strings,
 * matching the shape that the backend stores for `ckeditor` fields.
 *
 * Intentional trade-off (Plan B §4 / B1.5):
 *  - We deliberately avoid a heavy editor library (tiptap, quill, ckeditor5)
 *    to keep the bundle lean during the transition.
 *  - Basic formatting (bold, italic, underline, links) is available through the
 *    browser's built-in `execCommand` API and the toolbar below.
 *  - If a fuller editing experience is later required, this component can be
 *    swapped for a library-backed one without changing the parent interface.
 *
 * Contract: HTML string in → `onChange(htmlString)` out, same as a plain
 * textarea.  The value round-trips cleanly; no sanitisation is performed here
 * (the backend is responsible for that on save).
 */

import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

export interface RichTextEditorProps {
  id?: string;
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  'aria-invalid'?: boolean;
  className?: string;
}

type ExecCommandName = 'bold' | 'italic' | 'underline' | 'insertUnorderedList' | 'insertOrderedList';

const TOOLBAR_ACTIONS: { label: string; command: ExecCommandName; icon: string }[] = [
  { label: 'Bold', command: 'bold', icon: 'B' },
  { label: 'Italic', command: 'italic', icon: 'I' },
  { label: 'Underline', command: 'underline', icon: 'U' },
  { label: 'Bullet list', command: 'insertUnorderedList', icon: '•' },
  { label: 'Numbered list', command: 'insertOrderedList', icon: '1.' },
];

export function RichTextEditor({ id, value, onChange, disabled = false, 'aria-invalid': ariaInvalid, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync external value into the DOM only when it differs (prevents caret jump).
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== value) {
      el.innerHTML = value;
    }
  }, [value]);

  function handleInput() {
    const el = editorRef.current;
    if (el) {
      onChange(el.innerHTML);
    }
  }

  function handleToolbarAction(command: ExecCommandName) {
    if (disabled) return;
    editorRef.current?.focus();
    // execCommand is deprecated but remains the only zero-dependency way to
    // implement inline formatting in a contenteditable without a library.
    document.execCommand(command, false);
    handleInput();
  }

  return (
    <div className={cn('rounded-md border', ariaInvalid && 'border-destructive', className)}>
      {/* Toolbar */}
      {!disabled && (
        <div className="flex gap-1 border-b px-2 py-1" role="toolbar" aria-label="Text formatting">
          {TOOLBAR_ACTIONS.map(({ label, command, icon }) => (
            <button
              key={command}
              type="button"
              aria-label={label}
              title={label}
              onMouseDown={(e) => {
                // Prevent blur on the editor before execCommand fires.
                e.preventDefault();
                handleToolbarAction(command);
              }}
              className="hover:bg-muted rounded px-1.5 py-0.5 text-sm font-medium"
            >
              {icon}
            </button>
          ))}
        </div>
      )}

      {/* Editable content area */}
      <div
        ref={editorRef}
        id={id}
        role="textbox"
        aria-multiline="true"
        aria-invalid={ariaInvalid}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={handleInput}
        className={cn('min-h-[120px] px-3 py-2 text-sm outline-none', disabled && 'cursor-not-allowed opacity-50')}
      />
    </div>
  );
}

export default RichTextEditor;
