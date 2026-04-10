"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { useRef, useCallback } from "react";
import { uploadImage } from "@/lib/upload";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

function RichTextEditor({
  content,
  onChange,
  placeholder = "Bir şeyler yazın...",
  minHeight = 150,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      }),
      Image.configure({
        HTMLAttributes: { class: "editor-image" },
      }),
      Placeholder.configure({ placeholder }),
      Underline,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor",
        style: `min-height: ${minHeight}px; outline: none;`,
      },
    },
  });

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editor) return;

      try {
        const url = await uploadImage(file);
        if (url) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : "Yükleme başarısız");
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [editor]
  );

  const handleLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Bağlantı URL'si:", previousUrl || "https://");

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="rounded-lg border border-[#1e293b] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 bg-[#1a2130] border-b border-[#1e293b] px-2 py-1">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Kalın"
        >
          B
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="İtalik"
        >
          <span className="italic">I</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="Altı Çizili"
        >
          <span className="underline">U</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="Üstü Çizili"
        >
          <span className="line-through">S</span>
        </ToolbarButton>

        <Separator />

        <ToolbarButton onClick={handleLink} active={editor.isActive("link")} title="Bağlantı">
          <span role="img" aria-label="link">🔗</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          active={false}
          title="Resim"
        >
          <span role="img" aria-label="image">📷</span>
        </ToolbarButton>

        <Separator />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Alıntı"
        >
          &#10077;
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
          title="Kod Bloğu"
        >
          &lt;/&gt;
        </ToolbarButton>

        <Separator />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Madde İşaretli Liste"
        >
          &bull;
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Numaralı Liste"
        >
          1.
        </ToolbarButton>
      </div>

      {/* Editor */}
      <div className="bg-[#0d1017] focus-within:border-accent-green">
        <div className="p-4">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleImageUpload}
      />

      <style jsx global>{`
        .tiptap-editor p {
          margin-bottom: 0.75em;
        }
        .tiptap-editor strong {
          font-weight: 700;
        }
        .tiptap-editor em {
          font-style: italic;
        }
        .tiptap-editor a {
          color: #1f844e;
          text-decoration: underline;
        }
        .tiptap-editor blockquote {
          border-left: 2px solid #1e293b;
          padding-left: 12px;
          color: #94a3b8;
          margin: 8px 0;
        }
        .tiptap-editor pre {
          background: #1a2130;
          border-radius: 6px;
          padding: 12px;
          margin: 8px 0;
          overflow-x: auto;
        }
        .tiptap-editor pre code {
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
          font-size: 0.875rem;
          color: #e2e8f0;
          background: none;
          padding: 0;
        }
        .tiptap-editor code {
          background: #1a2130;
          border-radius: 4px;
          padding: 2px 6px;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
          font-size: 0.875rem;
        }
        .tiptap-editor ul,
        .tiptap-editor ol {
          padding-left: 1.5em;
          margin: 8px 0;
        }
        .tiptap-editor ul {
          list-style-type: disc;
        }
        .tiptap-editor ol {
          list-style-type: decimal;
        }
        .tiptap-editor img,
        .tiptap-editor .editor-image {
          max-width: 100%;
          border-radius: 8px;
          margin: 8px 0;
        }
        .tiptap-editor p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #475569;
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-8 h-8 rounded flex items-center justify-center text-xs transition-colors ${
        active
          ? "bg-accent-green/15 text-accent-green"
          : "text-[#64748b] hover:bg-[#1e2738] hover:text-[#e2e8f0]"
      }`}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div className="w-px h-5 bg-[#1e293b] mx-1" />;
}

export { RichTextEditor };
