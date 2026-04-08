/**
 * RichEditor — éditeur TipTap avec barre d'outils complète
 * Supporte : H1/H2/H3, gras, italique, lien, liste, blockquote, code, image via upload S3
 */
import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Bold, Italic, Link2, Image as ImageIcon,
  List, ListOrdered, Quote, Code2, Minus,
  Heading1, Heading2, Heading3, Undo, Redo,
} from "lucide-react";

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichEditor({ value, onChange, placeholder = "Commence à écrire...", className = "" }: RichEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const presign = trpc.upload.presign.useMutation();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: "language-" } },
      }),
      Image.configure({ allowBase64: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: "prose prose-stone max-w-none focus:outline-none min-h-[300px] px-4 py-3" },
    },
  });

  // Sync external value changes (e.g. loading saved content)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current && value !== undefined) {
      editor.commands.setContent(value || "", false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value === "" ? value : undefined]);

  const handleImageUpload = async (file: File) => {
    try {
      const { uploadUrl, publicUrl } = await presign.mutateAsync({
        filename: file.name,
        contentType: file.type,
        folder: "articles",
      });
      await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      editor?.chain().focus().setImage({ src: publicUrl, alt: file.name }).run();
    } catch {
      // Fallback: base64 si S3 non configuré
      const reader = new FileReader();
      reader.onload = e => {
        const src = e.target?.result as string;
        editor?.chain().focus().setImage({ src, alt: file.name }).run();
      };
      reader.readAsDataURL(file);
    }
  };

  const setLink = () => {
    const url = window.prompt("URL du lien :", editor?.getAttributes('link').href ?? "");
    if (url === null) return;
    if (url === "") { editor?.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  if (!editor) return null;

  const ToolBtn = ({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: React.ReactNode; title: string }) => (
    <Button
      type="button" variant={active ? "secondary" : "ghost"} size="sm"
      className="h-8 w-8 p-0" onClick={onClick} title={title}
    >
      {children}
    </Button>
  );

  return (
    <div className={`border rounded-lg overflow-hidden bg-background ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b bg-muted/30">
        <ToolBtn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Titre 1">
          <Heading1 className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Titre 2">
          <Heading2 className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Titre 3">
          <Heading3 className="h-3.5 w-3.5" />
        </ToolBtn>
        <div className="w-px h-6 bg-border mx-1" />
        <ToolBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Gras">
          <Bold className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italique">
          <Italic className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive('link')} onClick={setLink} title="Lien">
          <Link2 className="h-3.5 w-3.5" />
        </ToolBtn>
        <div className="w-px h-6 bg-border mx-1" />
        <ToolBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Liste à puces">
          <List className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Liste numérotée">
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Citation">
          <Quote className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} title="Code inline">
          <Code2 className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Séparateur">
          <Minus className="h-3.5 w-3.5" />
        </ToolBtn>
        <div className="w-px h-6 bg-border mx-1" />
        <ToolBtn active={false} onClick={() => fileRef.current?.click()} title="Insérer une image">
          <ImageIcon className="h-3.5 w-3.5" />
        </ToolBtn>
        <input
          ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ""; }}
        />
        <div className="flex-1" />
        <ToolBtn active={false} onClick={() => editor.chain().focus().undo().run()} title="Annuler">
          <Undo className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={false} onClick={() => editor.chain().focus().redo().run()} title="Rétablir">
          <Redo className="h-3.5 w-3.5" />
        </ToolBtn>
      </div>

      {/* Bubble menu — apparaît sur sélection */}
      <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
        <div className="flex items-center gap-0.5 bg-popover border rounded-md shadow-md p-1">
          <ToolBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Gras"><Bold className="h-3 w-3" /></ToolBtn>
          <ToolBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italique"><Italic className="h-3 w-3" /></ToolBtn>
          <ToolBtn active={editor.isActive('link')} onClick={setLink} title="Lien"><Link2 className="h-3 w-3" /></ToolBtn>
        </div>
      </BubbleMenu>

      {/* Zone d'édition */}
      <EditorContent editor={editor} />
    </div>
  );
}
