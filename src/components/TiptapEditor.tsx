'use client';

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Quote, 
  Link as LinkIcon,
  Heading1,
  Heading2
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Tooltip } from '@/shared/components/ui/tooltip';

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function TiptapEditor({
  value,
  onChange,
  placeholder = "Write your content...",
  className = "",
  minHeight = "200px"
}: TiptapEditorProps) {
  // Force update state to trigger re-renders
  const [forceUpdate, setForceUpdate] = React.useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Placeholder.configure({
        placeholder
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary hover:text-primary/80 underline'
        }
      })
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    onSelectionUpdate: () => {
      setForceUpdate(prev => prev + 1);
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none p-4 text-text-primary`,
        style: `min-height: ${minHeight}`
      }
    }
  });

  // Sync external value changes
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  // Use forceUpdate to ensure toolbar reactivity
  React.useEffect(() => {
    // This effect runs when forceUpdate changes, ensuring toolbar re-renders
  }, [forceUpdate]);

  if (!editor) {
    return null;
  }

  const toggleBold = () => editor.chain().focus().toggleBold().run();
  const toggleItalic = () => editor.chain().focus().toggleItalic().run();
  const toggleUnderline = () => editor.chain().focus().toggleUnderline().run();
  const toggleBulletList = () => editor.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor.chain().focus().toggleOrderedList().run();
  const toggleBlockquote = () => editor.chain().focus().toggleBlockquote().run();
  const toggleHeading1 = () => editor.chain().focus().toggleHeading({ level: 1 }).run();
  const toggleHeading2 = () => editor.chain().focus().toggleHeading({ level: 2 }).run();

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <Card className={`border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-2 flex flex-wrap gap-1 bg-surface/50">
        <Tooltip content="Bold (Ctrl+B)">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleBold}
            className={`h-8 w-8 p-0 ${
              editor.isActive('bold') 
                ? 'bg-[#794739] text-white' 
                : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          >
            <Bold className="h-4 w-4" />
          </Button>
        </Tooltip>

        <Tooltip content="Italic (Ctrl+I)">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleItalic}
            className={`h-8 w-8 p-0 ${
              editor.isActive('italic') 
                ? 'bg-[#794739] text-white' 
                : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          >
            <Italic className="h-4 w-4" />
          </Button>
        </Tooltip>

        <Tooltip content="Underline (Ctrl+U)">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleUnderline}
            className={`h-8 w-8 p-0 ${
              editor.isActive('underline') 
                ? 'bg-[#794739] text-white' 
                : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          >
            <Underline className="h-4 w-4" />
          </Button>
        </Tooltip>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        <Tooltip content="Heading 1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleHeading1}
            className={`h-8 w-8 p-0 ${
              editor.isActive('heading', { level: 1 }) 
                ? 'bg-[#794739] text-white' 
                : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
        </Tooltip>

        <Tooltip content="Heading 2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleHeading2}
            className={`h-8 w-8 p-0 ${
              editor.isActive('heading', { level: 2 }) 
                ? 'bg-[#794739] text-white' 
                : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
        </Tooltip>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        <Tooltip content="Bullet List">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleBulletList}
            className={`h-8 w-8 p-0 ${
              editor.isActive('bulletList') 
                ? 'bg-[#794739] text-white' 
                : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          >
            <List className="h-4 w-4" />
          </Button>
        </Tooltip>

        <Tooltip content="Numbered List">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleOrderedList}
            className={`h-8 w-8 p-0 ${
              editor.isActive('orderedList') 
                ? 'bg-[#794739] text-white' 
                : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </Tooltip>

        <Tooltip content="Quote">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleBlockquote}
            className={`h-8 w-8 p-0 ${
              editor.isActive('blockquote') 
                ? 'bg-[#794739] text-white' 
                : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          >
            <Quote className="h-4 w-4" />
          </Button>
        </Tooltip>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        <Tooltip content="Add Link">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addLink}
            className={`h-8 w-8 p-0 ${
              editor.isActive('link') 
                ? 'bg-[#794739] text-white' 
                : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        </Tooltip>
      </div>

      {/* Editor Content */}
      <div 
        className="bg-background overflow-y-auto"
        style={{ maxHeight: minHeight }}
      >
        <EditorContent 
          editor={editor} 
          className="tiptap-editor"
        />
      </div>
    </Card>
  );
}