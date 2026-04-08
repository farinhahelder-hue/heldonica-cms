/**
 * MediaPickerButton — bouton qui ouvre une modale de sélection/upload de médias
 * S'intègre dans ArticleEditor, PageEditor, Destinations pour choisir une image
 */
import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload, Image as ImageIcon, Check, Loader2 } from "lucide-react";

interface MediaPickerButtonProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  folder?: string;
}

export default function MediaPickerButton({ value, onChange, label = "Choisir une image", folder = "media" }: MediaPickerButtonProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: mediaList, refetch } = trpc.media.list.useQuery({ limit: 40 }, { enabled: open });
  const presignMutation = trpc.upload.presign.useMutation();
  const uploadMediaMutation = trpc.media.upload.useMutation();

  const handleFileUpload = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const { uploadUrl, publicUrl, key } = await presignMutation.mutateAsync({
        filename: file.name,
        contentType: file.type,
        folder,
      });
      const res = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!res.ok) throw new Error("Upload échoué");
      await uploadMediaMutation.mutateAsync({
        filename: file.name,
        url: publicUrl,
        fileKey: key,
        mimeType: file.type,
        size: file.size,
      });
      onChange(publicUrl);
      toast.success("Image uploadée !");
      setOpen(false);
      refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur upload");
    } finally {
      setUploading(false);
    }
  }, [presignMutation, uploadMediaMutation, onChange, folder, refetch]);

  return (
    <>
      <div className="flex gap-2 items-center">
        {value && (
          <div className="w-12 h-12 rounded-md overflow-hidden border bg-muted shrink-0">
            <img src={value} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
          {label}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Médiathèque</DialogTitle>
          </DialogHeader>

          {/* Upload zone */}
          <div
            className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) handleFileUpload(file);
            }}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Upload en cours...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Glisse une image ici ou <span className="text-primary underline">clique pour uploader</span></p>
                <p className="text-xs text-muted-foreground">JPG, PNG, WebP, GIF — max 10 Mo</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = "";
              }}
            />
          </div>

          {/* URL manuelle */}
          <div className="flex gap-2">
            <Input
              placeholder="Ou coller une URL directement..."
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              className="text-sm"
            />
            <Button
              type="button"
              size="sm"
              disabled={!urlInput.trim()}
              onClick={() => { onChange(urlInput.trim()); setOpen(false); setUrlInput(""); }}
            >
              Utiliser
            </Button>
          </div>

          {/* Grille médias existants */}
          {mediaList && mediaList.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Médias existants ({mediaList.length})</p>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {mediaList.map((m: any) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:border-primary ${
                      value === m.url ? "border-primary ring-2 ring-primary/30" : "border-transparent"
                    }`}
                    onClick={() => { onChange(m.url); setOpen(false); }}
                  >
                    <img src={m.url} alt={m.filename} className="w-full h-full object-cover" />
                    {value === m.url && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
