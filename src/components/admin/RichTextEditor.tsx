"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import { useEffect } from "react";

/**
 * Lightweight WYSIWYG editor (Tiptap) for News + Pages bodies. Output is HTML so
 * we can keep using `dangerouslySetInnerHTML` on the public side.
 *
 * Toolbar buttons: H2, H3, bold, italic, underline, lists, link, image-by-URL,
 * blockquote, clear formatting, undo/redo. Sized for the editor admin, not visitors.
 */
export default function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: false }),
    ],
    content: value,
    immediatelyRender: false, // important for Next.js SSR
    editorProps: {
      attributes: {
        class:
          "prose max-w-none min-h-[300px] rounded-b border border-t-0 bg-white px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Sync external value changes (e.g. when switching translation tabs)
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      // Tiptap 2.x signature: setContent(content, emitUpdate?: boolean)
      editor.commands.setContent(value, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="min-h-[300px] rounded border bg-white px-4 py-3 text-sm text-slate-400">
        Loading editor...
      </div>
    );
  }

  return (
    <div>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const btn = (active: boolean) =>
    `rounded px-2 py-1 text-xs ${
      active ? "bg-brand-500 text-white" : "bg-white text-slate-700 hover:bg-slate-100"
    }`;
  const div = "mx-1 h-5 w-px bg-slate-200";

  function promptLink() {
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("URL (empty to remove)", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function promptImage() {
    const url = window.prompt("Image URL");
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  }

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-t border border-b-0 bg-slate-50 p-1">
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive("heading", { level: 2 }))}>
        H2
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(editor.isActive("heading", { level: 3 }))}>
        H3
      </button>
      <span className={div} />
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive("bold"))}>
        <b>B</b>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive("italic"))}>
        <i>I</i>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn(editor.isActive("underline"))}>
        <u>U</u>
      </button>
      <span className={div} />
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive("bulletList"))}>
        • List
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive("orderedList"))}>
        1. List
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(editor.isActive("blockquote"))}>
        ❝
      </button>
      <span className={div} />
      <button type="button" onClick={promptLink} className={btn(editor.isActive("link"))}>
        🔗 Link
      </button>
      <button type="button" onClick={promptImage} className={btn(false)}>
        🖼 Image
      </button>
      <span className={div} />
      <button type="button" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} className={btn(false)}>
        Clear
      </button>
      <span className={div} />
      <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={btn(false) + " disabled:opacity-40"}>
        ↶
      </button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={btn(false) + " disabled:opacity-40"}>
        ↷
      </button>
    </div>
  );
}
