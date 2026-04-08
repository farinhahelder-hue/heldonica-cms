import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft, Save, Eye, Globe, FileText,
  Tag, Image, ChevronDown, ChevronUp,
  Bold, Italic, Link, List, ListOrdered, Quote, Heading2, Heading3, Code
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type EditorMode = "write" | "preview";
type ContentStatus = "draft" | "published" | "archived";

interface ArticleForm {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  status: ContentStatus;
}

const CATEGORIES = [
  "Slow Travel", "Voyage en couple", "Éco-responsable", "Hors sentiers battus",
  "Carnet de voyage", "Coulisses Heldonica", "Expert hôtelier", "Découvertes locales",
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, "<h3 class=\"text-lg font-semibold mt-6 mb-2\">$1</h3>")
    .replace(/^## (.+)$/gm, "<h2 class=\"text-xl font-bold mt-8 mb-3\">$1</h2>")
    .replace(/^# (.+)$/gm, "<h1 class=\"text-2xl font-bold mt-8 mb-4\">$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code class=\"bg-muted px-1 py-0.5 rounded text-sm font-mono\">$1</code>")
    .replace(/^> (.+)$/gm, "<blockquote class=\"border-l-4 border-primary pl-4 italic text-muted-foreground my-4\">$1</blockquote>")
    .replace(/^- (.+)$/gm, "<li class=\"ml-4 list-disc\">$1</li>")
    .replace(/^\d+\. (.+)$/gm, "<li class=\"ml-4 list-decimal\">$1</li>")
    .replace(/\[(.+?)\]\((.+?)\)/g, "<a href=\"$2\" class=\"text-primary underline\">$1</a>")
    .replace(/\n\n/g, "</p><p class=\"mb-4\">")
    .replace(/^(?!<[h|b|p|l|c])/gm, "<p class=\"mb-4\">")
    .replace(/(?<![>])$/gm, "</p>");
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function estimateReadTime(text: string): number {
  return Math.max(1, Math.round(countWords(text) / 200));
}

export default function ArticleEditor({ params }: { params?: { id?: string } }) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const articleId = params?.id ? parseInt(params.id) : null;
  const isNew = !articleId;

  const [mode, setMode] = useState<EditorMode>("write");
  const [seoOpen, setSeoOpen] = useState(false);
  const [slugManual, setSlugManual] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [form, setForm] = useState<ArticleForm>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "",
    metaTitle: "",
    metaDescription: "",
    ogImage: "",
    status: "draft",
  });

  // Load existing article
  const { data: existingArticle } = trpc.articles.list.useQuery(
    { limit: 200 },
    { enabled: !isNew }
  );

  useEffect(() => {
    if (!isNew && existingArticle && articleId) {
      const article = existingArticle.find((a: any) => a.id === articleId);
      if (article) {
        setForm({
          title: article.title || "",
          slug: article.slug || "",
          excerpt: article.excerpt || "",
          content: article.content || "",
          category: article.category || "",
          metaTitle: article.metaTitle || "",
          metaDescription: article.metaDescription || "",
          ogImage: article.ogImage || "",
          status: article.status as ContentStatus || "draft",
        });
        setSlugManual(true);
      }
    }
  }, [existingArticle, articleId, isNew]);

  const createMutation = trpc.articles.create.useMutation({
    onSuccess: (data: any) => {
      toast.success("Article créé avec succès !");
      setIsDirty(false);
      navigate(`/articles/edit/${data.id}`);
    },
    onError: (error: any) => toast.error(error.message || "Erreur lors de la création"),
  });

  const updateMutation = trpc.articles.update.useMutation({
    onSuccess: () => {
      toast.success("Article sauvegardé !");
      setIsDirty(false);
    },
    onError: (error: any) => toast.error(error.message || "Erreur lors de la sauvegarde"),
  });

  const updateField = useCallback(<K extends keyof ArticleForm>(key: K, value: ArticleForm[K]) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === "title" && !slugManual) {
        next.slug = slugify(value as string);
      }
      return next;
    });
    setIsDirty(true);
  }, [slugManual]);

  const handleSave = (status?: ContentStatus) => {
    const saveStatus = status || form.status;
    if (!form.title.trim()) { toast.error("Le titre est obligatoire"); return; }
    if (!form.slug.trim()) { toast.error("Le slug est obligatoire"); return; }

    const payload = { ...form, status: saveStatus };

    if (isNew) {
      createMutation.mutate(payload);
    } else if (articleId) {
      const publishedAt = saveStatus === "published" && form.status !== "published"
        ? new Date() : undefined;
      updateMutation.mutate({ id: articleId, ...payload, publishedAt });
    }
    if (status) setForm(prev => ({ ...prev, status }));
  };

  // Toolbar insert helpers
  const insertMarkdown = (before: string, after: string = "", placeholder: string = "texte") => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = form.content.substring(start, end) || placeholder;
    const newContent =
      form.content.substring(0, start) + before + selected + after + form.content.substring(end);
    updateField("content", newContent);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  const insertBlock = (prefix: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = form.content.lastIndexOf("\n", start - 1) + 1;
    const newContent = form.content.substring(0, lineStart) + prefix + form.content.substring(lineStart);
    updateField("content", newContent);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length); }, 0);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const wordCount = countWords(form.content);
  const readTime = estimateReadTime(form.content);
  const metaTitleLeft = 60 - (form.metaTitle || form.title).length;
  const metaDescLeft = 160 - (form.metaDescription || form.excerpt).length;

  if (user?.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Accès réservé aux administrateurs.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-background sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/articles")}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Articles
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <span className="text-sm text-muted-foreground">
              {isNew ? "Nouvel article" : "Modifier l'article"}
            </span>
            {isDirty && <Badge variant="outline" className="text-xs">Non sauvegardé</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">
              {wordCount} mots · {readTime} min de lecture
            </span>
            <Badge
              variant={form.status === "published" ? "default" : "secondary"}
              className="text-xs"
            >
              {form.status === "published" ? "Publié" : form.status === "archived" ? "Archivé" : "Brouillon"}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => handleSave("draft")} disabled={isPending}>
              <Save className="h-4 w-4 mr-1" />
              Brouillon
            </Button>
            <Button size="sm" onClick={() => handleSave("published")} disabled={isPending}>
              <Globe className="h-4 w-4 mr-1" />
              {form.status === "published" ? "Mettre à jour" : "Publier"}
            </Button>
          </div>
        </div>

        {/* Main layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Editor area */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <div className="max-w-3xl mx-auto w-full px-6 py-8 space-y-6">
              {/* Title */}
              <div>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => updateField("title", e.target.value)}
                  placeholder="Titre de l'article..."
                  className="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/40 resize-none"
                />
              </div>

              {/* Slug */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">heldonica.fr/blog/</span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => { setSlugManual(true); updateField("slug", e.target.value); }}
                  placeholder="mon-article-slug"
                  className="flex-1 bg-transparent border-b border-dashed border-border outline-none text-muted-foreground hover:border-primary focus:border-primary transition-colors"
                />
              </div>

              {/* Excerpt */}
              <div>
                <Textarea
                  value={form.excerpt}
                  onChange={e => updateField("excerpt", e.target.value)}
                  placeholder="Accroche — le résumé qui donne envie de lire (2-3 phrases)..."
                  rows={2}
                  className="resize-none border-0 border-b rounded-none bg-transparent px-0 text-base focus-visible:ring-0 placeholder:text-muted-foreground/40"
                />
              </div>

              <Separator />

              {/* Editor toolbar */}
              <div className="flex items-center gap-1 flex-wrap">
                <div className="flex items-center gap-0.5 border rounded-md p-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertBlock("## ")} title="Titre H2">
                    <Heading2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertBlock("### ")} title="Titre H3">
                    <Heading3 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-0.5 border rounded-md p-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertMarkdown("**", "**", "texte en gras")} title="Gras">
                    <Bold className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertMarkdown("*", "*", "texte en italique")} title="Italique">
                    <Italic className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertMarkdown("`", "`", "code")} title="Code inline">
                    <Code className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-0.5 border rounded-md p-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertBlock("- ")} title="Liste à puces">
                    <List className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertBlock("1. ")} title="Liste numérotée">
                    <ListOrdered className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertBlock("> ")} title="Citation">
                    <Quote className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-0.5 border rounded-md p-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => insertMarkdown("[", "](https://)", "texte du lien")} title="Lien">
                    <Link className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <Button
                    variant={mode === "write" ? "default" : "ghost"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setMode("write")}
                  >
                    <FileText className="h-3 w-3 mr-1" />Écrire
                  </Button>
                  <Button
                    variant={mode === "preview" ? "default" : "ghost"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setMode("preview")}
                  >
                    <Eye className="h-3 w-3 mr-1" />Aperçu
                  </Button>
                </div>
              </div>

              {/* Content area */}
              {mode === "write" ? (
                <Textarea
                  ref={textareaRef}
                  value={form.content}
                  onChange={e => updateField("content", e.target.value)}
                  placeholder="Commence à écrire... Utilise le Markdown pour formatter ton contenu.\n\n## Titre de section\n\nTon texte ici..."
                  className="min-h-[500px] font-mono text-sm resize-y border-0 bg-muted/20 rounded-lg p-4 focus-visible:ring-1"
                />
              ) : (
                <div
                  className="min-h-[500px] prose prose-sm max-w-none p-4 bg-muted/20 rounded-lg border"
                  dangerouslySetInnerHTML={{
                    __html: form.content
                      ? markdownToHtml(form.content)
                      : "<p class='text-muted-foreground italic'>Rien à afficher. Commence à écrire dans l'onglet Écrire.</p>"
                  }}
                />
              )}

              {/* SEO section */}
              <div className="border rounded-xl overflow-hidden">
                <button
                  className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
                  onClick={() => setSeoOpen(!seoOpen)}
                >
                  <span className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    SEO & Métadonnées
                  </span>
                  {seoOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {seoOpen && (
                  <div className="px-4 pb-4 space-y-4 border-t bg-muted/10">
                    <div className="space-y-1 pt-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Meta Title</Label>
                        <span className={`text-xs ${metaTitleLeft < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          {metaTitleLeft} caractères restants
                        </span>
                      </div>
                      <Input
                        value={form.metaTitle}
                        onChange={e => updateField("metaTitle", e.target.value)}
                        placeholder={form.title || "Titre SEO (défaut : titre de l'article)"}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Meta Description</Label>
                        <span className={`text-xs ${metaDescLeft < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          {metaDescLeft} caractères restants
                        </span>
                      </div>
                      <Textarea
                        value={form.metaDescription}
                        onChange={e => updateField("metaDescription", e.target.value)}
                        placeholder={form.excerpt || "Description SEO (défaut : extrait de l'article)"}
                        rows={2}
                        className="text-sm resize-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1"><Image className="h-3 w-3" /> Image OG (URL)</Label>
                      <Input
                        value={form.ogImage}
                        onChange={e => updateField("ogImage", e.target.value)}
                        placeholder="https://heldonica.fr/images/mon-image.jpg"
                        className="text-sm"
                      />
                    </div>
                    {/* SERP Preview */}
                    <div className="rounded-lg border bg-background p-3 space-y-1">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">Aperçu Google</p>
                      <p className="text-blue-600 text-sm font-medium truncate">
                        {form.metaTitle || form.title || "Titre de l'article"}
                      </p>
                      <p className="text-green-700 text-xs">heldonica.fr/blog/{form.slug || "mon-slug"}</p>
                      <p className="text-muted-foreground text-xs line-clamp-2">
                        {form.metaDescription || form.excerpt || "Description de l'article qui apparaîtra dans les résultats Google..."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-72 border-l flex flex-col gap-4 p-4 overflow-y-auto shrink-0">
            {/* Publish block */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Publication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col gap-2">
                  <Button
                    className="w-full"
                    onClick={() => handleSave("published")}
                    disabled={isPending}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    {form.status === "published" ? "Mettre à jour" : "Publier"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleSave("draft")}
                    disabled={isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer le brouillon
                  </Button>
                  {form.status === "published" && (
                    <Button
                      variant="ghost"
                      className="w-full text-muted-foreground"
                      onClick={() => handleSave("draft")}
                      disabled={isPending}
                    >
                      Dépublier
                    </Button>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Statut</span>
                  <Badge variant={form.status === "published" ? "default" : "secondary"} className="text-xs">
                    {form.status === "published" ? "Publié" : form.status === "archived" ? "Archivé" : "Brouillon"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Mots</span>
                  <span>{wordCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Lecture</span>
                  <span>~{readTime} min</span>
                </div>
              </CardContent>
            </Card>

            {/* Category */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" /> Catégorie
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => updateField("category", form.category === cat ? "" : cat)}
                      className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                        form.category === cat
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted border-border"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <Input
                  value={form.category}
                  onChange={e => updateField("category", e.target.value)}
                  placeholder="Ou saisir manuellement..."
                  className="text-xs h-7"
                />
              </CardContent>
            </Card>

            {/* Image à la une */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1">
                  <Image className="h-3.5 w-3.5" /> Image à la une
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {form.ogImage && (
                  <div className="rounded-md overflow-hidden aspect-video bg-muted">
                    <img
                      src={form.ogImage}
                      alt="Image à la une"
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                )}
                <Input
                  value={form.ogImage}
                  onChange={e => updateField("ogImage", e.target.value)}
                  placeholder="URL de l'image..."
                  className="text-xs h-7"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
