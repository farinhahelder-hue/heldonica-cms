/**
 * RichEditor — TipTap (déjà installé dans package.json)
 * Extensions : StarterKit + Link + Image + Placeholder + CharacterCount
 * Upload image intégré via presign tRPC → S3/R2
 */
import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Bold, Italic, Strikethrough, Heading2, Heading3,
  List, ListOrdered, Quote, Link as LinkIcon,
  Image as ImageIcon, Minus, Code, Undo, Redo,
} from "lucide-react";

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichEditor({ value, onChange, placeholder, className }: RichEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const presignMutation = trpc.upload.presign.useMutation();
  const uploadMediaMutation = trpc.media.upload.useMutation();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline" } }),
      Image.configure({ inline: false, HTMLAttributes: { class: "rounded-lg max-w-full my-4" } }),
      Placeholder.configure({ placeholder: placeholder ?? "Commence à écrire..." }),
      CharacterCount,
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4",
      },
    },
  });

  // Sync external value (load existing article)
  const lastValue = useRef(value);
  useEffect(() => {
    if (!editor) return;
    if (value !== lastValue.current && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
      lastValue.current = value;
    }
  }, [editor, value]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href ?? "";
    const url = window.prompt("URL du lien :", previous);
    if (url === null) return;
    if (url === "") { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return;
    try {
      const { uploadUrl, publicUrl, key } = await presignMutation.mutateAsync({
        filename: file.name,
        contentType: file.type,
        folder: "media",
      });
      const res = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!res.ok) throw new Error("Upload failed");
      await uploadMediaMutation.mutateAsync({
        filename: file.name,
        url: publicUrl,
        fileKey: key,
        mimeType: file.type,
        size: file.size,
      });
      editor.chain().focus().setImage({ src: publicUrl, alt: file.name }).run();
      toast.success("Image insérée !");
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur upload image");
    }
  }, [editor, presignMutation, uploadMediaMutation]);

  if (!editor) return null;

  const words = editor.storage.characterCount.words();
  const chars = editor.storage.characterCount.characters();
  // Estimation temps de lecture (200 mots/min)
  const readingTime = Math.max(1, Math.ceil(words / 200));

  const ToolbarBtn = ({ onClick, active, title, children }: {
    onClick: () => void; active?: boolean; title: string; children: React.ReactNode;
  }) => (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="sm"
      className="h-7 w-7 p-0"
      onClick={onClick}
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <div className={`border rounded-xl overflow-hidden bg-background ${className ?? ""}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 flex-wrap px-2 py-1.5 border-b bg-muted/30">
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} title="Annuler">
          <Undo className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} title="Rétablir">
          <Redo className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <div className="w-px h-4 bg-border mx-1" />
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Titre H2"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          title="Titre H3"
        >
          <Heading3 className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <div className="w-px h-4 bg-border mx-1" />
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Gras"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italique"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="Barré"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
          title="Code inline"
        >
          <Code className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <div className="w-px h-4 bg-border mx-1" />
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Liste à puces"
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Liste numérotée"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Citation"
        >
          <Quote className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Séparateur"
        >
          <Minus className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <div className="w-px h-4 bg-border mx-1" />
        <ToolbarBtn onClick={addLink} active={editor.isActive("link")} title="Ajouter un lien">
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => fileInputRef.current?.click()}
          title="Insérer une image"
        >
          <ImageIcon className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
            e.target.value = "";
          }}
        />
      </div>

      {/* Bubble menu (selection) */}
      <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
        <div className="flex items-center gap-0.5 bg-popover border rounded-lg shadow-md px-1 py-0.5">
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Gras">
            <Bold className="h-3 w-3" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italique">
            <Italic className="h-3 w-3" />
          </ToolbarBtn>
          <ToolbarBtn onClick={addLink} active={editor.isActive("link")} title="Lien">
            <LinkIcon className="h-3 w-3" />
          </ToolbarBtn>
        </div>
      </BubbleMenu>

      {/* Editor content */}
      <EditorContent editor={editor} />

      {/* Footer — compteur de mots / caractères / temps de lecture */}
      <div className="flex items-center justify-end gap-3 px-4 py-1.5 border-t bg-muted/20">
        <span className="text-xs text-muted-foreground">
          {words} mot{words !== 1 ? "s" : ""}
        </span>
        <span className="text-xs text-muted-foreground/50">·</span>
        <span className="text-xs text-muted-foreground">
          {chars} caractère{chars !== 1 ? "s" : ""}
        </span>
        <span className="text-xs text-muted-foreground/50">·</span>
        <span className="text-xs text-muted-foreground">
          ~{readingTime} min de lecture
        </span>
      </div>
    </div>
  );
}
