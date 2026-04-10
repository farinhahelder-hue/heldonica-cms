# Rapport Lighthouse — Avril 2026

## Statut — Sites non accessibles pour audit

### heldonica.fr
- **HTTP**: 307 (Redirect)
- **Problème**: Impossible de compléter le redirect pour effectuer l'audit
- **Action**: Vérifier la configuration DNS/redirect

### CMS Prod (work-1-rudccuswhhkkzlnh.prod-runtime.all-hands.dev)
- **HTTP**: 502 Bad Gateway
- **Problème**: Le serveur/backend ne répond pas
- **Action**: Redémarrer le conteneur de déploiement

---

## Actions prioritaires

### heldonica.fr
1. Vérifier la configuration CNAM et redirect vers la cible
2. Vérifier que SSL est bien configuré
3. Tester l'accès depuis autre région

### CMS Prod
1. Vérifier le déploiement Vercel : stato "Ready" ou "Failed"
2. Si failed : lire les logs d'erreur
3. Si ready mais 502 : redémarrer le conteneur
4. Relancer l'audit une fois le service accessible

---

*Rapport généré le 10 avril 2026. Les deux sites nécessitent une intervention avant audit Lighthouse.*