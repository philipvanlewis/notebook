"use client";

import { useCallback, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import { debounce, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  ListTodo,
  MoreHorizontal,
  Pin,
  Quote,
  Redo,
  Save,
  Strikethrough,
  Undo,
} from "lucide-react";
import type { Note, UpdateNoteInput } from "@/lib/api";

interface NoteEditorProps {
  note: Note;
  onUpdate: (updates: UpdateNoteInput) => void;
}

export function NoteEditor({ note, onUpdate }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [isSaving, setIsSaving] = useState(false);

  // Debounced save for content
  const debouncedSave = useCallback(
    debounce((content: string) => {
      setIsSaving(true);
      onUpdate({ content });
      setTimeout(() => setIsSaving(false), 500);
    }, 500),
    [onUpdate]
  );

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing... Use / for commands",
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2",
        },
      }),
    ],
    content: note.content,
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[calc(100vh-12rem)]",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      debouncedSave(html);
    },
  });

  // Handle title change
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    onUpdate({ title: newTitle });
  };

  if (!editor) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          Loading editor...
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-1">
          <ToolbarButton
            icon={Bold}
            isActive={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            tooltip="Bold (Cmd+B)"
          />
          <ToolbarButton
            icon={Italic}
            isActive={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            tooltip="Italic (Cmd+I)"
          />
          <ToolbarButton
            icon={Strikethrough}
            isActive={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            tooltip="Strikethrough"
          />
          <ToolbarButton
            icon={Code}
            isActive={editor.isActive("code")}
            onClick={() => editor.chain().focus().toggleCode().run()}
            tooltip="Code (Cmd+E)"
          />

          <div className="w-px h-4 bg-border mx-1" />

          <ToolbarButton
            icon={Heading1}
            isActive={editor.isActive("heading", { level: 1 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            tooltip="Heading 1"
          />
          <ToolbarButton
            icon={Heading2}
            isActive={editor.isActive("heading", { level: 2 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            tooltip="Heading 2"
          />

          <div className="w-px h-4 bg-border mx-1" />

          <ToolbarButton
            icon={List}
            isActive={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            tooltip="Bullet List"
          />
          <ToolbarButton
            icon={ListOrdered}
            isActive={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            tooltip="Numbered List"
          />
          <ToolbarButton
            icon={ListTodo}
            isActive={editor.isActive("taskList")}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            tooltip="Task List"
          />
          <ToolbarButton
            icon={Quote}
            isActive={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            tooltip="Quote"
          />

          <div className="w-px h-4 bg-border mx-1" />

          <ToolbarButton
            icon={Undo}
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            tooltip="Undo (Cmd+Z)"
          />
          <ToolbarButton
            icon={Redo}
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            tooltip="Redo (Cmd+Shift+Z)"
          />
        </div>

        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Save className="h-3 w-3" />
              Saving...
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onUpdate({ is_pinned: !note.is_pinned })}
          >
            <Pin
              className={cn("h-4 w-4", note.is_pinned && "fill-current text-primary")}
            />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-8 py-6">
          {/* Title input */}
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled"
            className="text-3xl font-bold border-none px-0 h-auto py-2 focus-visible:ring-0 bg-transparent"
          />

          {/* Editor */}
          <div className="mt-4">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}

interface ToolbarButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  isActive?: boolean;
  disabled?: boolean;
  onClick: () => void;
  tooltip: string;
}

function ToolbarButton({
  icon: Icon,
  isActive,
  disabled,
  onClick,
  tooltip,
}: ToolbarButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "h-8 w-8",
        isActive && "bg-muted text-primary"
      )}
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
