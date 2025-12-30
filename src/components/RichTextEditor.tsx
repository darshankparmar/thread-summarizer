'use client';

import React, { useRef, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your content...",
  className = "",
  minHeight = "200px"
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync the editor content with the value prop
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle common keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          document.execCommand('bold');
          handleInput();
          break;
        case 'i':
          e.preventDefault();
          document.execCommand('italic');
          handleInput();
          break;
        case 'u':
          e.preventDefault();
          document.execCommand('underline');
          handleInput();
          break;
      }
    }
  };

  const formatText = (command: string, value?: string) => {
    if (!editorRef.current) return;
    
    // Focus the editor first
    editorRef.current.focus();
    
    // Execute the command
    document.execCommand(command, false, value);
    
    // Update the content
    handleInput();
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      formatText('createLink', url);
    }
  };

  const insertList = (ordered: boolean) => {
    if (ordered) {
      formatText('insertOrderedList');
    } else {
      formatText('insertUnorderedList');
    }
  };

  const formatBlock = (tag: string) => {
    formatText('formatBlock', tag);
  };

  return (
    <Card className={`${className}`}>
      <div className="border-b border-gray-200 dark:border-gray-700 p-2">
        <div className="flex gap-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText('bold')}
            className="h-8 w-8 p-0 cursor-pointer flex-shrink-0"
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText('italic')}
            className="h-8 w-8 p-0 cursor-pointer flex-shrink-0"
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatText('underline')}
            className="h-8 w-8 p-0 cursor-pointer flex-shrink-0"
            title="Underline (Ctrl+U)"
          >
            <u>U</u>
          </Button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 flex-shrink-0" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertList(false)}
            className="h-8 px-2 cursor-pointer flex-shrink-0"
            title="Bullet List"
          >
            •
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertList(true)}
            className="h-8 px-2 cursor-pointer flex-shrink-0"
            title="Numbered List"
          >
            1.
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={insertLink}
            className="h-8 px-2 cursor-pointer flex-shrink-0"
            title="Insert Link"
          >
            🔗
          </Button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 flex-shrink-0" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatBlock('h3')}
            className="h-8 px-2 cursor-pointer flex-shrink-0"
            title="Heading"
          >
            H
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => formatBlock('blockquote')}
            className="h-8 px-2 cursor-pointer flex-shrink-0"
            title="Quote"
          >
            &quot;
          </Button>
        </div>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className={`
          p-4 outline-none overflow-x-auto overflow-y-auto
          prose prose-sm max-w-none
          dark:prose-invert
          prose-headings:text-orange-900 dark:prose-headings:text-orange-100
          prose-links:text-orange-600 dark:prose-links:text-orange-400
          whitespace-pre-wrap
        `}
        style={{ minHeight, maxHeight: '400px' }}
        data-placeholder={placeholder}
      />
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        
        /* Custom scrollbar styles */
        .scrollbar-thin {
          scrollbar-width: thin;
        }
        
        .scrollbar-thumb-gray-300::-webkit-scrollbar {
          height: 6px;
        }
        
        .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 3px;
        }
        
        .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb:hover {
          background-color: #9ca3af;
        }
        
        .dark .scrollbar-thumb-gray-600::-webkit-scrollbar-thumb {
          background-color: #4b5563;
        }
        
        .dark .scrollbar-thumb-gray-600::-webkit-scrollbar-thumb:hover {
          background-color: #6b7280;
        }
      `}</style>
    </Card>
  );
}