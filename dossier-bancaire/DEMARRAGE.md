# 🏦 Dossier Bancaire Investisseur — Guide de démarrage

## 1. Créer le projet

Ouvre un terminal dans VS Code et tape :

```bash
npm create vite@latest dossier-bancaire -- --template react-ts
cd dossier-bancaire
npm install
```

## 2. Installer les dépendances

```bash
npm install framer-motion lucide-react jspdf jspdf-autotable tailwindcss @tailwindcss/vite clsx tailwind-merge
```

## 3. Configurer Tailwind

Remplace le contenu de `vite.config.ts` par le fichier fourni.
Remplace `src/index.css` par le fichier fourni.

## 4. Copier les fichiers sources

Copie tous les fichiers `.tsx` dans `src/components/` :
- SimCard.tsx
- CircularGauge.tsx
- DossierChecklist.tsx
- BankFileStepper.tsx
- TabDossier.tsx

Remplace `src/App.tsx` par le fichier fourni.

## 5. Clé API (IA) — à faire quand tu auras ta clé

Crée un fichier `.env` à la racine du projet :

```
VITE_AI_API_KEY=sk-ant-xxxxxxxxxxxxxxxx   # clé Anthropic
```

Pour obtenir une clé Anthropic : https://console.anthropic.com/
Coût estimé : < 0.01€ par génération de dossier.

## 6. Lancer l'application

```bash
npm run dev
```

Ouvre http://localhost:5173 dans ton navigateur.

## Notes

- Toutes les données restent en local (aucune base de données)
- Le PDF se télécharge directement dans ton dossier Téléchargements
- La génération IA fonctionne uniquement avec une clé valide dans `.env`
- Sans clé : tous les calculs, le score investisseur et le PDF fonctionnent quand même
