/**
 * SeoScore — indicateur SEO temps réel basé sur le mot-clé focus
 * Score sur 100 : rouge < 40, orange 40–69, vert >= 70
 */
import { useMemo } from "react";

interface SeoScoreProps {
  title: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  slug: string;
  tags: string[];
  focusKeyword: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

interface Check {
  label: string;
  pass: boolean;
  tip: string;
  weight: number;
}

export function useSeoScore(props: SeoScoreProps) {
  const { title, excerpt, content, metaTitle, metaDescription, ogImage, slug, tags, focusKeyword } = props;

  return useMemo(() => {
    const plainContent = stripHtml(content);
    const wordCount = countWords(plainContent);
    const kw = focusKeyword.trim().toLowerCase();
    const hasKw = kw.length > 0;

    const inText = (text: string) => kw ? text.toLowerCase().includes(kw) : false;

    const kwDensity = hasKw && wordCount > 0
      ? ((plainContent.toLowerCase().split(kw).length - 1) / wordCount) * 100
      : 0;

    const checks: Check[] = [
      {
        label: "Mot-clé dans le titre",
        pass: hasKw ? inText(title) : !!title.trim(),
        tip: hasKw ? `Inclure "${kw}" dans le titre H1` : "Renseigner le titre",
        weight: 15,
      },
      {
        label: "Mot-clé dans la meta description",
        pass: hasKw ? inText(metaDescription || excerpt) : !!(metaDescription || excerpt).trim(),
        tip: hasKw ? `Inclure "${kw}" dans la meta description` : "Renseigner l'accroche ou la meta description",
        weight: 10,
      },
      {
        label: "Mot-clé dans le slug",
        pass: hasKw ? inText(slug) : !!slug.trim(),
        tip: hasKw ? `Inclure "${kw}" dans l'URL` : "Renseigner le slug",
        weight: 10,
      },
      {
        label: "Densité du mot-clé (1–3 %)",
        pass: hasKw ? kwDensity >= 1 && kwDensity <= 3 : wordCount > 0,
        tip: hasKw
          ? kwDensity < 1 ? `Utiliser "${kw}" plus souvent dans le contenu` : `Trop répétitif (${kwDensity.toFixed(1)} %) — réduire`
          : "Ajouter du contenu",
        weight: 15,
      },
      {
        label: "Longueur du titre (< 60 car.)",
        pass: title.length > 0 && title.length <= 60,
        tip: title.length > 60 ? `Titre trop long (${title.length} car.) — raccourcir` : "Renseigner un titre",
        weight: 10,
      },
      {
        label: "Meta description renseignée (< 160 car.)",
        pass: (metaDescription || excerpt).length > 50 && (metaDescription || excerpt).length <= 160,
        tip: "Écrire une meta description entre 50 et 160 caractères",
        weight: 10,
      },
      {
        label: "Contenu suffisant (> 300 mots)",
        pass: wordCount >= 300,
        tip: `Contenu actuel : ${wordCount} mots — viser au moins 300`,
        weight: 15,
      },
      {
        label: "Image à la une définie",
        pass: !!ogImage,
        tip: "Ajouter une image à la une (améliore le CTR sur Google)",
        weight: 10,
      },
      {
        label: "Tags / mots-clés renseignés",
        pass: tags.length > 0,
        tip: "Ajouter au moins un tag pour le SEO long tail",
        weight: 5,
      },
      {
        label: "Catégorie définie",
        pass: true, // évalué depuis le parent
        tip: "Sélectionner une catégorie",
        weight: 0, // géré séparément
      },
    ];

    const maxScore = checks.reduce((sum, c) => sum + c.weight, 0);
    const score = Math.round(
      checks.reduce((sum, c) => sum + (c.pass ? c.weight : 0), 0) / maxScore * 100
    );

    const color = score >= 70 ? "green" : score >= 40 ? "orange" : "red";
    const label = score >= 70 ? "Bon" : score >= 40 ? "À améliorer" : "Insuffisant";

    return { score, color, label, checks, wordCount, kwDensity };
  }, [title, excerpt, content, metaTitle, metaDescription, ogImage, slug, tags, focusKeyword]);
}

// ─── Composant visuel ─────────────────────────────────────────────────────────

export default function SeoScore(props: SeoScoreProps & { category: string }) {
  const { score, color, label, checks, wordCount, kwDensity } = useSeoScore(props);

  const colorClasses = {
    green: { ring: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30", dot: "bg-green-500", bar: "bg-green-500" },
    orange: { ring: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30", dot: "bg-orange-400", bar: "bg-orange-400" },
    red: { ring: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30", dot: "bg-red-500", bar: "bg-red-500" },
  }[color];

  const failing = checks.filter(c => !c.pass && c.weight > 0);

  return (
    <div className="space-y-3">
      {/* Score global */}
      <div className={`rounded-lg p-3 ${colorClasses.bg} flex items-center gap-3`}>
        <div className="relative w-10 h-10 shrink-0">
          <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/20" />
            <circle
              cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3"
              strokeDasharray={`${score * 0.942} 94.2`}
              strokeLinecap="round"
              className={colorClasses.ring}
            />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${colorClasses.ring}`}>
            {score}
          </span>
        </div>
        <div>
          <p className={`text-sm font-semibold ${colorClasses.ring}`}>SEO : {label}</p>
          <p className="text-xs text-muted-foreground">
            {wordCount} mots{props.focusKeyword && kwDensity > 0 ? ` · densité ${kwDensity.toFixed(1)} %` : ""}
          </p>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClasses.bar}`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Checklist */}
      <div className="space-y-1.5">
        {checks.filter(c => c.weight > 0).map((c, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${c.pass ? "bg-green-500" : "bg-red-400"}`} />
            <span className={c.pass ? "text-muted-foreground" : "text-foreground"}>
              {c.pass ? c.label : c.tip}
            </span>
          </div>
        ))}
      </div>

      {failing.length === 0 && (
        <p className="text-xs text-green-600 font-medium">✓ Tous les critères sont remplis !</p>
      )}
    </div>
  );
}
