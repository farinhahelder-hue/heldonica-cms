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
import RichEditor from "@/components/RichEditor";
import MediaPickerButton from "@/components/MediaPickerButton";
import {
  ArrowLeft, Save, Globe, Tag, ChevronDown, ChevronUp, X, RefreshCw,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type ContentStatus = "draft" | "published" | "archived";

interface ArticleForm {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
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

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function estimateReadTime(html: string): number {
  return Math.max(1, Math.round(countWords(stripHtml(html)) / 200));
}

export default function ArticleEditor({ params }: { params?: { id?: string } }) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const articleId = params?.id ? parseInt(params.id) : null;
  const isNew = !articleId;

  const [seoOpen, setSeoOpen] = useState(false);
  const [slugManual, setSlugManual] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [tagInput, setTagInput] = useState("");
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [form, setForm] = useState<ArticleForm>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "",
    tags: [],
    metaTitle: "",
    metaDescription: "",
    ogImage: "",
    status: "draft",
  });

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
          tags: Array.isArray(article.tags) ? article.tags : (article.tags ? String(article.tags).split(",").map((t: string) => t.trim()).filter(Boolean) : []),
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
      setLastSaved(new Date());
      navigate(`/articles/edit/${data.id}`);
    },
    onError: (error: any) => toast.error(error.message || "Erreur lors de la création"),
  });

  const updateMutation = trpc.articles.update.useMutation({
    onSuccess: () => {
      setIsDirty(false);
      setLastSaved(new Date());
    },
    onError: (error: any) => toast.error(error.message || "Erreur lors de la sauvegarde"),
  });

  const updateField = useCallback(<K extends keyof ArticleForm>(key: K, value: ArticleForm[K]) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === "title" && !slugManual) next.slug = slugify(value as string);
      return next;
    });
    setIsDirty(true);
  }, [slugManual]);

  const handleSave = useCallback((status?: ContentStatus, silent = false) => {
    const saveStatus = status || form.status;
    if (!form.title.trim()) { if (!silent) toast.error("Le titre est obligatoire"); return; }
    if (!form.slug.trim()) { if (!silent) toast.error("Le slug est obligatoire"); return; }
    const payload = { ...form, status: saveStatus };
    if (isNew) {
      createMutation.mutate(payload);
    } else if (articleId) {
      const publishedAt = saveStatus === "published" && form.status !== "published" ? new Date() : undefined;
      updateMutation.mutate({ id: articleId, ...payload, publishedAt });
    }
    if (status) setForm(prev => ({ ...prev, status }));
    if (!silent) toast.success(saveStatus === "published" ? "Article publié !" : "Brouillon sauvegardé !");
  }, [form, isNew, articleId, createMutation, updateMutation]);

  // Autosave : déclenché 30s après la dernière modification si brouillon
  const formRef = useRef(form);
  formRef.current = form;
  useEffect(() => {
    if (!isDirty || isNew) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      if (formRef.current.title.trim() && formRef.current.slug.trim()) {
        handleSave(undefined, true);
      }
    }, 30_000);
    return () => { if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current); };
  }, [isDirty, isNew, handleSave]);

  // Gestion des tags
  const addTag = (value: string) => {
    const tag = value.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) {
      updateField("tags", [...form.tags, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    updateField("tags", form.tags.filter(t => t !== tag));
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const wordCount = countWords(stripHtml(form.content));
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
            {!isDirty && lastSaved && (
              <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
                <RefreshCw className="h-2.5 w-2.5" />
                Sauvegardé {lastSaved.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">
              {wordCount} mots · {readTime} min
            </span>
            <Badge variant={form.status === "published" ? "default" : "secondary"} className="text-xs">
              {form.status === "published" ? "Publié" : form.status === "archived" ? "Archivé" : "Brouillon"}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => handleSave("draft")} disabled={isPending}>
              <Save className="h-4 w-4 mr-1" />Brouillon
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
              <div>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => updateField("title", e.target.value)}
                  placeholder="Titre de l'article..."
                  className="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/40"
                />
              </div>

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

              {/* TipTap Rich Editor */}
              <RichEditor
                value={form.content}
                onChange={v => updateField("content", v)}
                placeholder="Commence à écrire... Utilise la barre d'outils ou Markdown."
              />

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
                        placeholder={form.title || "Titre SEO"}
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
                        placeholder={form.excerpt || "Description SEO"}
                        rows={2}
                        className="text-sm resize-none"
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
                        {form.metaDescription || form.excerpt || "Description qui apparaîtra dans Google..."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-72 border-l flex flex-col gap-4 p-4 overflow-y-auto shrink-0">
            {/* Publication */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Publication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" onClick={() => handleSave("published")} disabled={isPending}>
                  <Globe className="h-4 w-4 mr-2" />
                  {form.status === "published" ? "Mettre à jour" : "Publier"}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => handleSave("draft")} disabled={isPending}>
                  <Save className="h-4 w-4 mr-2" />Enregistrer le brouillon
                </Button>
                {form.status === "published" && (
                  <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => handleSave("draft")} disabled={isPending}>
                    Dépublier
                  </Button>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Statut</span>
                  <Badge variant={form.status === "published" ? "default" : "secondary"} className="text-xs">
                    {form.status === "published" ? "Publié" : form.status === "archived" ? "Archivé" : "Brouillon"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Mots</span><span>{wordCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Lecture</span><span>~{readTime} min</span>
                </div>
                {lastSaved && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Autosave</span>
                    <span className="flex items-center gap-1">
                      <RefreshCw className="h-2.5 w-2.5" />
                      {lastSaved.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Catégorie */}
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

            {/* Tags */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" /> Tags & mots-clés
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {form.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full"
                      >
                        #{tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="hover:text-destructive transition-colors"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <Input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                  onBlur={() => tagInput.trim() && addTag(tagInput)}
                  placeholder="Ajouter un tag + Entrée"
                  className="text-xs h-7"
                />
                <p className="text-xs text-muted-foreground">
                  Sépare par une virgule ou appuie sur Entrée
                </p>
              </CardContent>
            </Card>

            {/* Image à la une */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Image à la une</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {form.ogImage && (
                  <div className="relative rounded-lg overflow-hidden aspect-video bg-muted">
                    <img
                      src={form.ogImage}
                      alt="Image à la une"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => updateField("ogImage", "")}
                      className="absolute top-1 right-1 bg-background/80 hover:bg-background rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <MediaPickerButton
                  value={form.ogImage}
                  onChange={url => updateField("ogImage", url)}
                  label={form.ogImage ? "Changer l'image" : "Choisir une image"}
                  folder="articles"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
