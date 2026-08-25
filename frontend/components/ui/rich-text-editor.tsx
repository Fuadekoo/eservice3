"use client";

import * as React from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { isEmptyHtml, toEditorHtml } from "@/lib/rich-text";

type RichTextEditorProps = {
  value?: string | null;
  /** Receives HTML, or an empty string when the document is blank. */
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Minimum height of the writing area. */
  minHeight?: string;
};

/** One toolbar button. `active` drives the pressed state. */
function ToolbarButton({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      // The editor loses its selection when a button steals focus, so keep it.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-md",
        "text-muted-foreground transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:opacity-40",
        // Pressed state reads on both themes: a raised surface plus the accent
        // colour, rather than relying on a fixed grey.
        active &&
          "bg-background text-primary shadow-sm ring-1 ring-border dark:bg-input/60",
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}

function ToolbarDivider() {
  return <span className="mx-0.5 h-5 w-px shrink-0 bg-border" aria-hidden />;
}

function Toolbar({ editor, disabled }: { editor: Editor; disabled?: boolean }) {
  const { t } = useTranslation();

  const setLink = React.useCallback(() => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const input = window.prompt(t("Link URL"), previous ?? "https://");
    if (input === null) return;

    const url = input.trim();
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // A bare domain would otherwise be treated as a relative path.
    const href = /^(https?:|mailto:|tel:|\/|#)/i.test(url) ? url : `https://${url}`;
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  }, [editor, t]);

  return (
    <div
      className="flex flex-wrap items-center gap-0.5 border-b border-input bg-muted/50 px-2 py-1.5 dark:bg-input/20"
      role="toolbar"
      aria-label={t("Formatting")}
    >
      <ToolbarButton
        icon={Bold}
        label={t("Bold")}
        disabled={disabled}
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        icon={Italic}
        label={t("Italic")}
        disabled={disabled}
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        icon={UnderlineIcon}
        label={t("Underline")}
        disabled={disabled}
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <ToolbarButton
        icon={Strikethrough}
        label={t("Strikethrough")}
        disabled={disabled}
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />

      <ToolbarDivider />

      <ToolbarButton
        icon={Heading2}
        label={t("Heading")}
        disabled={disabled}
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        icon={Heading3}
        label={t("Subheading")}
        disabled={disabled}
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />

      <ToolbarDivider />

      <ToolbarButton
        icon={List}
        label={t("Bullet list")}
        disabled={disabled}
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        icon={ListOrdered}
        label={t("Numbered list")}
        disabled={disabled}
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        icon={Quote}
        label={t("Quote")}
        disabled={disabled}
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolbarButton
        icon={Code}
        label={t("Code")}
        disabled={disabled}
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      />
      <ToolbarButton
        icon={Minus}
        label={t("Divider")}
        disabled={disabled}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      />

      <ToolbarDivider />

      <ToolbarButton
        icon={Link2}
        label={t("Add link")}
        disabled={disabled}
        active={editor.isActive("link")}
        onClick={setLink}
      />
      <ToolbarButton
        icon={Link2Off}
        label={t("Remove link")}
        disabled={disabled || !editor.isActive("link")}
        onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}
      />
      <ToolbarButton
        icon={RemoveFormatting}
        label={t("Clear formatting")}
        disabled={disabled}
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
      />

      <ToolbarDivider />

      <ToolbarButton
        icon={Undo2}
        label={t("Undo")}
        disabled={disabled || !editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      />
      <ToolbarButton
        icon={Redo2}
        label={t("Redo")}
        disabled={disabled || !editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      />
    </div>
  );
}

/**
 * Rich-text editor for long-form content such as the about page sections.
 *
 * Emits HTML. Legacy plain-text values are converted to paragraphs on load, so
 * a section written before this editor existed opens looking the way it reads.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
  minHeight = "12rem",
}: RichTextEditorProps) {
  const { t } = useTranslation();

  const editor = useEditor({
    // Next.js renders this on the server first; letting TipTap render there too
    // produces a hydration mismatch.
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
        },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? t("Start writing…"),
      }),
    ],
    content: toEditorHtml(value),
    onUpdate: ({ editor: instance }) => {
      const html = instance.getHTML();
      // Report a blank document as "" so `required` checks and "no description
      // yet" placeholders behave, rather than seeing a stray "<p></p>".
      onChange(isEmptyHtml(html) ? "" : html);
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none",
      },
    },
  });

  // Re-sync when the form is reset or a different record is loaded. Comparing
  // against the current HTML first stops this from fighting the user's typing.
  React.useEffect(() => {
    if (!editor) return;
    const next = toEditorHtml(value);
    if (next === editor.getHTML()) return;
    if (isEmptyHtml(next) && isEmptyHtml(editor.getHTML())) return;
    editor.commands.setContent(next, { emitUpdate: false });
  }, [editor, value]);

  React.useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  if (!editor) {
    // Reserve the same box so the dialog does not jump when the editor mounts.
    return (
      <div
        className={cn(
          "animate-pulse rounded-md border border-input bg-muted/40",
          className,
        )}
        style={{ minHeight: `calc(${minHeight} + 2.75rem)` }}
      />
    );
  }

  return (
    <div
      className={cn(
        // Mirrors the Input component: transparent on light, a faint fill on
        // dark, with the same focus ring — so the editor sits in a form
        // without looking like a different control.
        "overflow-hidden rounded-md border border-input bg-transparent transition-colors",
        "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        "dark:bg-input/30",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
    >
      <Toolbar editor={editor} disabled={disabled} />
      <EditorContent
        editor={editor}
        onClick={() => editor.chain().focus().run()}
        className={cn(
          "cursor-text overflow-y-auto px-3 py-2.5 text-sm text-foreground",
          // Styling lives here rather than in a typography plugin the project
          // does not use. `tiptap-content` is shared with the read-only view.
          "tiptap-content",
        )}
        style={{ minHeight, maxHeight: "60vh" }}
      />
    </div>
  );
}
