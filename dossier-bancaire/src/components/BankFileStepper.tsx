import { useState, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2, User, Wallet, FileText, Building2, FileDown,
  ChevronRight, ChevronLeft, AlertTriangle, Upload, X, Briefcase,
  Landmark, Home, Sparkles, Loader2, TrendingUp, Shield, Award,
  Info, Plus, Trash2
} from 'lucide-react'
import SimCard from './SimCard'
import CircularGauge from './CircularGauge'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ── Types ──────────────────────────────────────────────
interface PersonalInfo {
  nomComplet: string; dateNaissance: string; situationFamiliale: string; enfantsACharge: string
  adresse: string; telephone: string; email: string; profession: string; anciennete: string
  revenuNet: string; revenusComplementaires: string
}
interface FinancialInfo {
  epargneDisponible: string; epargnePrecaution: boolean; creditsEnCours: boolean; mensualiteCredits: string
}
interface OwnedProperty {
  id: string; nom: string; valeur: string; capitalRestant: string; mensualite: string
  loyer: string; localisation: string; structure: string
}
interface ProjectInfo {
  typeBien: string; localisationBien: string; surface: string; prixAcquisition: string
  fraisNotaire: string; fraisNotaireManuel: boolean; travauxOui: boolean; montantTravaux: string
  financementType: string; dureeCredit: string; modeLocation: string; loyerEstime: string
  structureJuridique: string; storytelling: string
}
interface UploadedFile { file: File; name: string }

// ── Constantes ──────────────────────────────────────────
const TAUX_INTERET = 0.035
const ACCEPTED = '.pdf,.jpg,.jpeg,.png'
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const fmt = (n: number) => n.toLocaleString('fr-FR')

const DOC_CATEGORIES = [
  { id: 'identite', title: 'Identité', icon: <User size={16} />, items: [
    { id: 'piece_identite', label: "Pièce d'identité (CNI / passeport)", required: true },
    { id: 'justif_domicile', label: 'Justificatif de domicile (< 3 mois)', required: true },
  ]},
  { id: 'revenus', title: 'Revenus', icon: <Briefcase size={16} />, items: [
    { id: 'bulletins_salaire', label: '3 derniers bulletins de salaire', required: true },
    { id: 'avis_imposition', label: "2 derniers avis d'imposition", required: true },
    { id: 'contrat_travail', label: 'Contrat de travail', required: true },
  ]},
  { id: 'finances', title: 'Finances', icon: <Landmark size={16} />, items: [
    { id: 'releves_bancaires', label: '3 derniers relevés bancaires', required: true },
    { id: 'justif_epargne', label: "Justificatifs d'épargne", required: true },
    { id: 'tableau_amortissement', label: "Tableau d'amortissement crédits en cours", required: false },
  ]},
  { id: 'projet', title: 'Projet immobilier', icon: <Home size={16} />, items: [
    { id: 'compromis_vente', label: 'Compromis / promesse de vente', required: true },
    { id: 'plans_bien', label: 'Plans du bien', required: true },
    { id: 'devis_travaux', label: 'Devis travaux', required: false },
    { id: 'attestation_locative', label: 'Attestation de valeur locative', required: true },
    { id: 'diagnostics_dpe', label: 'Diagnostics DPE', required: true },
  ]},
]
const ALL_REQUIRED_IDS = DOC_CATEGORIES.flatMap(c => c.items.filter(i => i.required).map(i => i.id))
const ALL_SLOT_IDS = DOC_CATEGORIES.flatMap(c => c.items.map(i => i.id))

const STEPS = [
  { label: 'Informations personnelles', icon: User },
  { label: 'Situation financière', icon: Wallet },
  { label: 'Documents', icon: FileText },
  { label: 'Présentation du projet', icon: Building2 },
  { label: 'Génération du dossier', icon: FileDown },
]

// ── Styles utilitaires ──────────────────────────────────
const S = {
  input: {
    width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
    border: '1px solid hsl(222 15% 22%)', background: 'hsl(222 15% 18%)',
    color: 'hsl(210 20% 92%)', fontSize: '0.875rem', outline: 'none',
    fontFamily: 'DM Sans, sans-serif',
  } as React.CSSProperties,
  select: {
    width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
    border: '1px solid hsl(222 15% 22%)', background: 'hsl(222 15% 18%)',
    color: 'hsl(210 20% 92%)', fontSize: '0.875rem', outline: 'none',
    fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
    appearance: 'none' as const,
  } as React.CSSProperties,
  label: { fontSize: '0.8rem', fontWeight: 500, color: 'hsl(215 15% 70%)', display: 'block', marginBottom: '0.35rem' } as React.CSSProperties,
  field: { display: 'flex', flexDirection: 'column' as const },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' } as React.CSSProperties,
  btn: (primary = true) => ({
    display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.1rem',
    borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
    border: primary ? 'none' : '1px solid hsl(222 15% 22%)',
    background: primary ? 'hsl(210 90% 60%)' : 'hsl(222 15% 18%)',
    color: primary ? 'hsl(0 0% 100%)' : 'hsl(210 20% 92%)',
    fontFamily: 'DM Sans, sans-serif', transition: 'opacity 0.15s',
  } as React.CSSProperties),
  card: (color?: string) => ({
    borderRadius: '0.75rem', padding: '1rem',
    border: `1px solid ${color ? color + '33' : 'hsl(222 15% 22%)'}`,
    background: color ? color + '0d' : 'hsl(222 20% 13%)',
  } as React.CSSProperties),
  pill: (bg: string, text: string) => ({
    display: 'inline-block', padding: '0.15rem 0.6rem', borderRadius: '9999px',
    fontSize: '0.7rem', fontWeight: 600, background: bg + '1a', color: bg,
  } as React.CSSProperties),
}

const emptyProperty = (): OwnedProperty => ({
  id: crypto.randomUUID(), nom: '', valeur: '', capitalRestant: '', mensualite: '', loyer: '', localisation: 'polynesie', structure: 'nom_propre',
})

// ── Composant principal ─────────────────────────────────
export default function BankFileStepper() {
  const [step, setStep] = useState(0)
  const [step3Error, setStep3Error] = useState<string[] | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [dossierAiLoading, setDossierAiLoading] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  const [personal, setPersonal] = useState<PersonalInfo>({
    nomComplet: '', dateNaissance: '', situationFamiliale: '', enfantsACharge: '0',
    adresse: '', telephone: '', email: '', profession: '', anciennete: '',
    revenuNet: '', revenusComplementaires: '',
  })
  const [financial, setFinancial] = useState<FinancialInfo>({
    epargneDisponible: '', epargnePrecaution: false, creditsEnCours: false, mensualiteCredits: '',
  })
  const [ownedProperties, setOwnedProperties] = useState<OwnedProperty[]>([])
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedFile[]>>({})
  const [project, setProject] = useState<ProjectInfo>({
    typeBien: '', localisationBien: '', surface: '', prixAcquisition: '', fraisNotaire: '',
    fraisNotaireManuel: false, travauxOui: false, montantTravaux: '', financementType: 'credit_total',
    dureeCredit: '20', modeLocation: '', loyerEstime: '', structureJuridique: '', storytelling: '',
  })
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null)

  const notify = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 3500)
  }

  const up = (key: keyof PersonalInfo, val: string) => setPersonal(p => ({ ...p, [key]: val }))
  const upP = (key: keyof ProjectInfo, val: string | boolean) => setProject(p => ({ ...p, [key]: val }))
  const updateProperty = (id: string, key: keyof OwnedProperty, val: string) =>
    setOwnedProperties(ps => ps.map(p => p.id === id ? { ...p, [key]: val } : p))

  // ── File handling ──
  const addFiles = useCallback((slotId: string, files: FileList | File[]) => {
    const valid = Array.from(files).filter(f => ACCEPTED_TYPES.includes(f.type))
    if (valid.length === 0) return
    setUploadedDocs(prev => ({ ...prev, [slotId]: [...(prev[slotId] || []), ...valid.map(f => ({ file: f, name: f.name }))] }))
    setStep3Error(null)
  }, [])

  const removeFile = useCallback((slotId: string, index: number) => {
    setUploadedDocs(prev => { const arr = [...(prev[slotId] || [])]; arr.splice(index, 1); return { ...prev, [slotId]: arr } })
  }, [])

  const hasDoc = (slotId: string) => (uploadedDocs[slotId]?.length || 0) > 0

  const globalStats = useMemo(() => {
    const filled = ALL_SLOT_IDS.filter(id => hasDoc(id)).length
    return { filled, total: ALL_SLOT_IDS.length, pct: Math.round((filled / ALL_SLOT_IDS.length) * 100) }
  }, [uploadedDocs])

  const missingRequired = useMemo(() => ALL_REQUIRED_IDS.filter(id => !hasDoc(id)), [uploadedDocs])

  // ── Calculs financiers ──
  const totalRevenus = useMemo(() => (Number(personal.revenuNet) || 0) + (Number(personal.revenusComplementaires) || 0), [personal.revenuNet, personal.revenusComplementaires])
  const mensualiteCreditsNum = useMemo(() => financial.creditsEnCours ? (Number(financial.mensualiteCredits) || 0) : 0, [financial.creditsEnCours, financial.mensualiteCredits])
  const totalLoyersPercus = useMemo(() => ownedProperties.reduce((s, p) => s + (Number(p.loyer) || 0), 0), [ownedProperties])
  const totalMensualitesPatrimoine = useMemo(() => ownedProperties.reduce((s, p) => s + (Number(p.mensualite) || 0), 0), [ownedProperties])
  const patrimoineBrut = useMemo(() => ownedProperties.reduce((s, p) => s + (Number(p.valeur) || 0), 0), [ownedProperties])
  const dettesImmo = useMemo(() => ownedProperties.reduce((s, p) => s + (Number(p.capitalRestant) || 0), 0), [ownedProperties])
  const patrimoineNet = patrimoineBrut - dettesImmo
  const cashFlowLocatifGlobal = totalLoyersPercus - totalMensualitesPatrimoine
  const chargesTotal = mensualiteCreditsNum + totalMensualitesPatrimoine
  const tauxEndettementBrut = useMemo(() => totalRevenus <= 0 ? 0 : Math.round((chargesTotal / totalRevenus) * 100), [totalRevenus, chargesTotal])
  const tauxEndettementAjuste = useMemo(() => {
    if (totalRevenus <= 0) return 0
    return Math.round((Math.max(0, chargesTotal - totalLoyersPercus) / totalRevenus) * 100)
  }, [totalRevenus, chargesTotal, totalLoyersPercus])
  const resteAVivre = totalRevenus - chargesTotal + totalLoyersPercus
  const isCouple = ['marie', 'pacse', 'couple'].includes(personal.situationFamiliale)
  const resteAVivreOk = resteAVivre >= (isCouple ? 200000 : 120000)

  // ── Calculs projet ──
  const prixAchat = Number(project.prixAcquisition) || 0
  const isVEFA = project.typeBien === 'vefa'
  const fraisNotaireAuto = useMemo(() => Math.round(prixAchat * (isVEFA ? 0.08 : 0.12)), [prixAchat, isVEFA])
  const fraisNotaire = project.fraisNotaireManuel ? (Number(project.fraisNotaire) || 0) : fraisNotaireAuto
  const montantTravaux = project.travauxOui ? (Number(project.montantTravaux) || 0) : 0
  const coutTotal = prixAchat + fraisNotaire + montantTravaux
  const loyerMensuel = Number(project.loyerEstime) || 0
  const loyerAnnuel = loyerMensuel * 12
  const rentaBrute = useMemo(() => coutTotal > 0 ? ((loyerAnnuel / coutTotal) * 100) : 0, [loyerAnnuel, coutTotal])
  const dureeAns = Number(project.dureeCredit) || 20
  const nbMois = dureeAns * 12
  const tauxMensuel = TAUX_INTERET / 12
  const mensualiteCredit = useMemo(() => {
    if (coutTotal <= 0) return 0
    const montant = project.financementType === 'avec_apport' ? Math.max(0, coutTotal - (Number(financial.epargneDisponible) || 0)) : coutTotal
    if (montant <= 0) return 0
    return Math.round(montant * (tauxMensuel * Math.pow(1 + tauxMensuel, nbMois)) / (Math.pow(1 + tauxMensuel, nbMois) - 1))
  }, [coutTotal, project.financementType, financial.epargneDisponible, tauxMensuel, nbMois])

  const endettementProjete = useMemo(() => {
    if (totalRevenus <= 0) return 0
    return Math.round((Math.max(0, chargesTotal + mensualiteCredit - totalLoyersPercus - loyerMensuel) / totalRevenus) * 100)
  }, [totalRevenus, chargesTotal, mensualiteCredit, totalLoyersPercus, loyerMensuel])

  // ── Score investisseur ──
  const investorScore = useMemo(() => {
    let score = 0
    if (cashFlowLocatifGlobal >= 0) score += 30; else if (cashFlowLocatifGlobal > -50000) score += 15
    if (patrimoineNet > 0) score += 20
    if (tauxEndettementAjuste < 35) score += 20; else if (tauxEndettementAjuste < 45) score += 10
    if (financial.epargnePrecaution) score += 15
    if (globalStats.pct === 100) score += 15; else if (globalStats.pct >= 80) score += 8
    return Math.min(score, 100)
  }, [cashFlowLocatifGlobal, patrimoineNet, tauxEndettementAjuste, financial.epargnePrecaution, globalStats.pct])

  const scoreColor = investorScore >= 80 ? 'hsl(152 60% 48%)' : investorScore >= 60 ? 'hsl(210 90% 60%)' : 'hsl(38 92% 58%)'
  const scoreLabel = investorScore >= 80 ? '🏆 Dossier Investisseur Solide' : investorScore >= 60 ? '✅ Bon dossier — quelques points à renforcer' : '⚠️ Dossier à compléter avant présentation'

  const ajusteColor = tauxEndettementAjuste < 25 ? 'hsl(152 60% 48%)' : tauxEndettementAjuste <= 35 ? 'hsl(210 90% 60%)' : tauxEndettementAjuste <= 45 ? 'hsl(38 92% 58%)' : 'hsl(0 72% 58%)'

  // ── Navigation ──
  const handleNext = () => {
    if (step === 2) {
      const missing = missingRequired
      if (missing.length > 0) {
        const labelMap = new Map<string, string>()
        DOC_CATEGORIES.forEach(c => c.items.forEach(i => labelMap.set(i.id, i.label)))
        setStep3Error(missing.map(id => labelMap.get(id) || id))
        return
      }
    }
    setStep3Error(null)
    setStep(s => s + 1)
  }

  // ── Génération IA ──
  const generatePitch = async () => {
    const apiKey = import.meta.env.VITE_AI_API_KEY
    if (!apiKey) { notify('Clé API manquante — ajoutez VITE_AI_API_KEY dans .env', 'err'); return }
    setAiLoading(true)
    try {
      const prompt = `Tu es un expert en montage de dossiers bancaires pour l'investissement immobilier en Polynésie française.
Rédige une accroche professionnelle et convaincante (maximum 150 mots, pas de titre) pour ce profil :
- Emprunteur : ${personal.nomComplet || 'Non renseigné'}, ${personal.profession || ''}, ${personal.anciennete || '?'} ans d'ancienneté
- Revenus mensuels : ${fmt(Number(personal.revenuNet) || 0)} XPF
- Épargne : ${fmt(Number(financial.epargneDisponible) || 0)} XPF
- Projet : ${project.typeBien} à ${project.localisationBien || 'Polynésie'}, ${fmt(prixAchat)} XPF
- Loyer estimé : ${fmt(loyerMensuel)} XPF/mois — ${project.modeLocation || ''}
- Structure : ${project.structureJuridique || 'non renseigné'}`

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 400, messages: [{ role: 'user', content: prompt }] }),
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || ''
      upP('storytelling', text)
      notify('Accroche générée ✅')
    } catch {
      notify('Erreur lors de la génération IA', 'err')
    }
    setAiLoading(false)
  }

  const generateDossierAI = async () => {
    const apiKey = import.meta.env.VITE_AI_API_KEY
    if (!apiKey) { notify('Clé API manquante — ajoutez VITE_AI_API_KEY dans .env', 'err'); return }
    setDossierAiLoading(true)
    try {
      const prompt = `Tu es un expert en financement immobilier en Polynésie française.
L'emprunteur est résident fiscal en Polynésie française. Ne mentionne JAMAIS l'IR national, TMI, prélèvements sociaux 17,2%, LMNP ou Micro-BIC.
Ne présente JAMAIS le taux d'endettement brut comme négatif. Mets en avant le patrimoine net et le cash-flow.
Monnaie : XPF. Maximum 1200 mots. Ton professionnel et rassurant pour le banquier.

Données :
- Emprunteur : ${personal.nomComplet}, ${personal.profession}, ${personal.anciennete} ans, ${personal.situationFamiliale}, ${personal.enfantsACharge} enfant(s)
- Revenus : ${fmt(totalRevenus)} XPF/mois
- Épargne : ${fmt(Number(financial.epargneDisponible) || 0)} XPF ${financial.epargnePrecaution ? '(précaution ✓)' : ''}
- Patrimoine net : ${fmt(patrimoineNet)} XPF — Cash-flow locatif : ${fmt(cashFlowLocatifGlobal)} XPF/mois
- Taux endettement ajusté actuel : ${tauxEndettementAjuste}%
- Projet : ${project.typeBien} à ${project.localisationBien}, ${fmt(coutTotal)} XPF total
- Loyer estimé : ${fmt(loyerMensuel)} XPF/mois — Rentabilité brute : ${rentaBrute.toFixed(1)}%
- Mensualité crédit : ${fmt(mensualiteCredit)} XPF — Taux endettement projeté ajusté : ${endettementProjete}%
- Structure : ${project.structureJuridique} — Durée : ${dureeAns} ans
${project.storytelling ? `\nPitch de l'emprunteur : "${project.storytelling}"` : ''}
${ownedProperties.length > 0 ? `\nBiens détenus : ${ownedProperties.length} bien(s), patrimoine brut ${fmt(patrimoineBrut)} XPF` : ''}

Rédige le dossier avec ces sections :
1) PAGE DE PRÉSENTATION — accroche percutante
2) PRÉSENTATION DE L'INVESTISSEUR — profil, stabilité, expérience
3) ANALYSE FINANCIÈRE — revenus, épargne, taux ajusté, cash-flow, patrimoine net (tous montants en XPF)
4) DESCRIPTION DU PROJET — bien, localisation, stratégie locative
5) PLAN DE FINANCEMENT — montant, durée, mensualité, structure juridique
6) CONCLUSION — message rassurant pour la banque`

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] }),
      })
      const data = await res.json()
      setGeneratedContent(data.content?.[0]?.text || '')
      notify('Dossier généré ✅')
    } catch {
      notify('Erreur lors de la génération IA', 'err')
    }
    setDossierAiLoading(false)
  }

  // ── Génération PDF ──
  const generatePDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', format: 'a4' })
    const W = doc.internal.pageSize.getWidth()
    let y = 0

    const addHeader = () => {
      doc.setFillColor(15, 82, 168)
      doc.rect(0, 0, W, 28, 'F')
      doc.setFontSize(14); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
      doc.text('DOSSIER BANCAIRE INVESTISSEUR', 14, 12)
      doc.setFontSize(9); doc.setFont('helvetica', 'normal')
      doc.text(`${personal.nomComplet || 'Emprunteur'} — ${new Date().toLocaleDateString('fr-FR')}`, 14, 22)
      doc.text('Polynésie française — XPF', W - 14, 22, { align: 'right' })
      return 36
    }

    const addSection = (title: string, yPos: number) => {
      doc.setFillColor(15, 82, 168); doc.setTextColor(255, 255, 255)
      doc.rect(14, yPos, W - 28, 7, 'F')
      doc.setFontSize(9); doc.setFont('helvetica', 'bold')
      doc.text(title.toUpperCase(), 16, yPos + 5)
      doc.setTextColor(0, 0, 0)
      return yPos + 11
    }

    const checkPage = (yPos: number) => {
      if (yPos > 265) { doc.addPage(); return addHeader() }
      return yPos
    }

    const addFooter = (pageNum: number) => {
      doc.setFontSize(8); doc.setTextColor(150, 150, 150); doc.setFont('helvetica', 'normal')
      doc.text(`Page ${pageNum}`, W / 2, 290, { align: 'center' })
      doc.text('Document confidentiel — Usage bancaire', 14, 290)
    }

    y = addHeader()

    if (generatedContent) {
      y = addSection('Dossier complet (généré par IA)', y)
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 30, 30)
      const lines = doc.splitTextToSize(generatedContent, W - 28)
      lines.forEach((line: string) => {
        y = checkPage(y)
        doc.text(line, 14, y); y += 5
      })
    } else {
      y = addSection('1. Profil emprunteur', y)
      autoTable(doc, { startY: y, head: [['Champ', 'Valeur']], body: [
        ['Nom complet', personal.nomComplet || '—'],
        ['Profession', personal.profession || '—'],
        ['Ancienneté', personal.anciennete ? `${personal.anciennete} ans` : '—'],
        ['Situation familiale', personal.situationFamiliale || '—'],
        ['Enfants à charge', personal.enfantsACharge || '0'],
        ['Adresse', personal.adresse || '—'],
        ['Email', personal.email || '—'],
        ['Téléphone', personal.telephone || '—'],
      ], theme: 'grid', styles: { fontSize: 9 }, headStyles: { fillColor: [15, 82, 168] } })
      y = (doc as any).lastAutoTable.finalY + 8

      y = checkPage(y); y = addSection('2. Situation financière', y)
      autoTable(doc, { startY: y, head: [['Indicateur', 'Valeur']], body: [
        ['Revenus nets mensuels', `${fmt(totalRevenus)} XPF`],
        ['Épargne disponible', `${fmt(Number(financial.epargneDisponible) || 0)} XPF`],
        ['Épargne de précaution', financial.epargnePrecaution ? 'Oui ✓' : 'Non'],
        ['Patrimoine brut', `${fmt(patrimoineBrut)} XPF`],
        ['Dettes immobilières', `${fmt(dettesImmo)} XPF`],
        ['Patrimoine net', `${fmt(patrimoineNet)} XPF`],
        ['Cash-flow locatif global', `${fmt(cashFlowLocatifGlobal)} XPF/mois`],
        ['Taux endettement brut', `${tauxEndettementBrut}%`],
        ['Taux endettement ajusté', `${tauxEndettementAjuste}%`],
        ['Reste à vivre', `${fmt(resteAVivre)} XPF`],
      ], theme: 'grid', styles: { fontSize: 9 }, headStyles: { fillColor: [15, 82, 168] } })
      y = (doc as any).lastAutoTable.finalY + 8

      y = checkPage(y); y = addSection('3. Le projet', y)
      autoTable(doc, { startY: y, head: [['Champ', 'Valeur']], body: [
        ['Type de bien', project.typeBien || '—'],
        ['Localisation', project.localisationBien || '—'],
        ['Surface', project.surface ? `${project.surface} m²` : '—'],
        ['Coût total acquisition', `${fmt(coutTotal)} XPF`],
        ['Loyer estimé', `${fmt(loyerMensuel)} XPF/mois`],
        ['Rentabilité brute', `${rentaBrute.toFixed(1)}%`],
        ['Mensualité crédit', `${fmt(mensualiteCredit)} XPF/mois`],
        ['Durée crédit', `${dureeAns} ans`],
        ['Endettement projeté ajusté', `${endettementProjete}%`],
        ['Structure juridique', project.structureJuridique || '—'],
        ['Mode de location', project.modeLocation || '—'],
      ], theme: 'grid', styles: { fontSize: 9 }, headStyles: { fillColor: [15, 82, 168] } })
      y = (doc as any).lastAutoTable.finalY + 8

      if (project.storytelling) {
        y = checkPage(y); y = addSection('4. Présentation personnelle', y)
        doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor(50, 50, 50)
        const lines = doc.splitTextToSize(`"${project.storytelling}"`, W - 28)
        lines.forEach((line: string) => { y = checkPage(y); doc.text(line, 14, y); y += 5 })
        y += 4
      }

      y = checkPage(y); y = addSection('5. Documents', y)
      const docRows: string[][] = []
      DOC_CATEGORIES.forEach(cat => cat.items.forEach(item => {
        const files = uploadedDocs[item.id] || []
        docRows.push([item.label, files.length > 0 ? `✓ ${files.map(f => f.name).join(', ')}` : '✗ Non fourni'])
      }))
      autoTable(doc, { startY: y, head: [['Document', 'Statut']], body: docRows, theme: 'grid', styles: { fontSize: 8 }, headStyles: { fillColor: [15, 82, 168] } })

      y = checkPage(y + 12); y = addSection('6. Score investisseur', y)
      doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 82, 168)
      doc.text(`Score : ${investorScore}/100 — ${scoreLabel}`, 14, y + 6)
    }

    addFooter(doc.internal.pages.length - 1)
    doc.save(`Dossier_Bancaire_${personal.nomComplet || 'Investisseur'}_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`)
    notify('PDF téléchargé ✅')
  }

  // ── DropZone ──
  const DropZone = ({ slotId, slotLabel, required }: { slotId: string; slotLabel: string; required: boolean }) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const files = uploadedDocs[slotId] || []
    const isDragOver = dragOverSlot === slotId
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 500, color: 'hsl(210 20% 92%)' }}>{slotLabel}</p>
          {required && <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'hsl(0 72% 58%)', background: 'hsl(0 72% 58% / 0.12)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>*</span>}
        </div>
        <div
          onDragOver={e => { e.preventDefault(); setDragOverSlot(slotId) }}
          onDragLeave={() => setDragOverSlot(null)}
          onDrop={e => { e.preventDefault(); setDragOverSlot(null); addFiles(slotId, e.dataTransfer.files) }}
          onClick={() => inputRef.current?.click()}
          style={{
            borderRadius: '0.5rem', border: `2px dashed ${isDragOver ? 'hsl(210 90% 60%)' : files.length > 0 ? 'hsl(152 60% 48% / 0.4)' : 'hsl(222 15% 28%)'}`,
            background: isDragOver ? 'hsl(210 90% 60% / 0.05)' : files.length > 0 ? 'hsl(152 60% 48% / 0.05)' : 'transparent',
            padding: '0.75rem', cursor: 'pointer', transition: 'all 0.15s',
          }}>
          <input ref={inputRef} type="file" accept={ACCEPTED} multiple style={{ display: 'none' }}
            onChange={e => { if (e.target.files) { addFiles(slotId, e.target.files); e.target.value = '' } }} />
          {files.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0' }}>
              <Upload size={18} style={{ color: 'hsl(215 15% 55%)' }} />
              <p style={{ fontSize: '0.72rem', color: 'hsl(215 15% 55%)' }}>Glisser ou <span style={{ color: 'hsl(210 90% 60%)' }}>cliquer</span></p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {files.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={13} style={{ color: 'hsl(152 60% 48%)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.72rem', color: 'hsl(210 20% 92%)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{f.name}</span>
                  <button onClick={e => { e.stopPropagation(); removeFile(slotId, i) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(215 15% 55%)', flexShrink: 0 }}>
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Render étapes ──
  const renderStep = () => {
    switch (step) {
      case 0: return (
        <div style={S.grid2}>
          {[
            { key: 'nomComplet', label: 'Nom complet *', placeholder: 'Jean Dupont' },
            { key: 'dateNaissance', label: 'Date de naissance *', type: 'date' },
            { key: 'adresse', label: 'Adresse actuelle', placeholder: 'Papeete, Tahiti' },
            { key: 'telephone', label: 'Téléphone', placeholder: '87 12 34 56' },
            { key: 'email', label: 'Email', type: 'email', placeholder: 'jean@email.pf' },
            { key: 'anciennete', label: 'Ancienneté (ans)', type: 'number', placeholder: '3' },
            { key: 'revenuNet', label: 'Revenus nets mensuels (XPF) *', type: 'number', placeholder: '350000' },
            { key: 'revenusComplementaires', label: 'Revenus complémentaires (XPF)', type: 'number', placeholder: '0' },
          ].map(({ key, label, type = 'text', placeholder }) => (
            <div key={key} style={S.field}>
              <label style={S.label}>{label}</label>
              <input style={S.input} type={type} value={personal[key as keyof PersonalInfo]} placeholder={placeholder}
                onChange={e => up(key as keyof PersonalInfo, e.target.value)} />
            </div>
          ))}
          <div style={S.field}>
            <label style={S.label}>Situation familiale *</label>
            <select style={S.select} value={personal.situationFamiliale} onChange={e => up('situationFamiliale', e.target.value)}>
              <option value="">Sélectionner</option>
              <option value="celibataire">Célibataire</option>
              <option value="couple">En couple</option>
              <option value="marie">Marié(e)</option>
              <option value="pacse">PACS</option>
            </select>
          </div>
          <div style={S.field}>
            <label style={S.label}>Profession *</label>
            <select style={S.select} value={personal.profession} onChange={e => up('profession', e.target.value)}>
              <option value="">Sélectionner</option>
              <option value="salarie_cdi">Salarié CDI</option>
              <option value="fonctionnaire">Fonctionnaire</option>
              <option value="independant">Indépendant</option>
              <option value="entrepreneur">Entrepreneur</option>
            </select>
          </div>
          <div style={S.field}>
            <label style={S.label}>Enfants à charge</label>
            <input style={S.input} type="number" min={0} value={personal.enfantsACharge} onChange={e => up('enfantsACharge', e.target.value)} />
          </div>
          {totalRevenus > 0 && (
            <div style={{ ...S.card('hsl(210 90% 60%)'), gridColumn: '1 / -1' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'hsl(210 20% 92%)' }}>
                Total revenus mensuels : <span style={{ color: 'hsl(210 90% 60%)' }}>{fmt(totalRevenus)} XPF</span>
              </p>
            </div>
          )}
        </div>
      )

      case 1: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={S.grid2}>
            <div style={S.field}>
              <label style={S.label}>Épargne disponible (XPF) *</label>
              <input style={S.input} type="number" min={0} value={financial.epargneDisponible} placeholder="2000000"
                onChange={e => setFinancial(f => ({ ...f, epargneDisponible: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid hsl(222 15% 22%)', background: 'hsl(222 15% 18%)' }}>
              <div>
                <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'hsl(210 20% 92%)' }}>Épargne de précaution (≥ 12 mois)</p>
                <p style={{ fontSize: '0.7rem', color: 'hsl(215 15% 55%)' }}>{financial.epargnePrecaution ? '✓ Épargne de sécurité constituée' : 'Recommandé par les banques'}</p>
              </div>
              <button onClick={() => setFinancial(f => ({ ...f, epargnePrecaution: !f.epargnePrecaution }))}
                style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: financial.epargnePrecaution ? 'hsl(210 90% 60%)' : 'hsl(222 15% 28%)' }} />
            </div>
          </div>

          <SimCard title="Autres crédits en cours (conso, auto…)" icon={<Wallet size={16} />}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <p style={{ fontSize: '0.82rem', color: 'hsl(210 20% 92%)' }}>Crédits autres qu'immobilier</p>
              <button onClick={() => setFinancial(f => ({ ...f, creditsEnCours: !f.creditsEnCours }))}
                style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: financial.creditsEnCours ? 'hsl(210 90% 60%)' : 'hsl(222 15% 28%)' }} />
            </div>
            {financial.creditsEnCours && (
              <div style={S.field}>
                <label style={S.label}>Mensualité totale autres crédits (XPF)</label>
                <input style={S.input} type="number" min={0} value={financial.mensualiteCredits} placeholder="85000"
                  onChange={e => setFinancial(f => ({ ...f, mensualiteCredits: e.target.value }))} />
              </div>
            )}
          </SimCard>

          <SimCard title="Patrimoine immobilier existant" icon={<Home size={16} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {ownedProperties.map((prop, idx) => (
                <div key={prop.id} style={{ padding: '1rem', borderRadius: '0.5rem', border: '1px solid hsl(222 15% 28%)', background: 'hsl(222 20% 10%)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'hsl(210 90% 60%)' }}>Bien #{idx + 1}</p>
                    <button onClick={() => setOwnedProperties(ps => ps.filter(p => p.id !== prop.id))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(0 72% 58%)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                    {[
                      { key: 'nom', label: 'Nom / Description', placeholder: 'Appart Papeete' },
                      { key: 'valeur', label: 'Valeur (XPF)', placeholder: '25000000', type: 'number' },
                      { key: 'capitalRestant', label: 'Capital restant dû (XPF)', placeholder: '12000000', type: 'number' },
                      { key: 'mensualite', label: 'Mensualité crédit (XPF)', placeholder: '95000', type: 'number' },
                      { key: 'loyer', label: 'Loyer mensuel (XPF)', placeholder: '120000', type: 'number' },
                    ].map(({ key, label, placeholder, type = 'text' }) => (
                      <div key={key} style={S.field}>
                        <label style={S.label}>{label}</label>
                        <input style={S.input} type={type} placeholder={placeholder}
                          value={prop[key as keyof OwnedProperty] as string}
                          onChange={e => updateProperty(prop.id, key as keyof OwnedProperty, e.target.value)} />
                      </div>
                    ))}
                    <div style={S.field}>
                      <label style={S.label}>Localisation</label>
                      <select style={S.select} value={prop.localisation} onChange={e => updateProperty(prop.id, 'localisation', e.target.value)}>
                        <option value="polynesie">Polynésie française</option>
                        <option value="france_metro">France métropolitaine</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                  </div>
                  {Number(prop.loyer) > 0 && Number(prop.mensualite) > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <span style={S.pill(Number(prop.loyer) >= Number(prop.mensualite) ? 'hsl(152 60% 48%)' : 'hsl(38 92% 58%)', '')}>
                        CF : {fmt(Number(prop.loyer) - Number(prop.mensualite))} XPF/mois
                      </span>
                    </div>
                  )}
                </div>
              ))}
              <button onClick={() => setOwnedProperties(ps => [...ps, emptyProperty()])} style={{ ...S.btn(false), justifyContent: 'center' }}>
                <Plus size={15} /> Ajouter un bien
              </button>
            </div>
            {ownedProperties.length > 0 && (
              <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {[
                  { label: 'Patrimoine net', value: `${fmt(patrimoineNet)} XPF`, color: patrimoineNet >= 0 ? 'hsl(152 60% 48%)' : 'hsl(0 72% 58%)' },
                  { label: 'Cash-flow global', value: `${fmt(cashFlowLocatifGlobal)} XPF/mois`, color: cashFlowLocatifGlobal >= 0 ? 'hsl(152 60% 48%)' : 'hsl(38 92% 58%)' },
                  { label: 'Taux ajusté', value: `${tauxEndettementAjuste}%`, color: ajusteColor },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ textAlign: 'center', padding: '0.75rem', borderRadius: '0.5rem', background: 'hsl(222 20% 10%)', border: '1px solid hsl(222 15% 22%)' }}>
                    <p style={{ fontSize: '0.7rem', color: 'hsl(215 15% 55%)', marginBottom: '0.25rem' }}>{label}</p>
                    <p style={{ fontSize: '1rem', fontWeight: 700, color }}>{value}</p>
                  </div>
                ))}
              </div>
            )}
          </SimCard>
        </div>
      )

      case 2: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'hsl(210 90% 60% / 0.08)', border: '1px solid hsl(210 90% 60% / 0.2)' }}>
            <p style={{ fontSize: '0.82rem', color: 'hsl(210 20% 92%)' }}>
              Complétude : <strong style={{ color: 'hsl(210 90% 60%)' }}>{globalStats.filled}/{globalStats.total} documents</strong>
            </p>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: globalStats.pct === 100 ? 'hsl(152 60% 48%)' : 'hsl(210 90% 60%)' }}>{globalStats.pct}%</span>
          </div>
          {DOC_CATEGORIES.map(cat => (
            <SimCard key={cat.id} title={cat.title} icon={cat.icon}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {cat.items.map(item => <DropZone key={item.id} slotId={item.id} slotLabel={item.label} required={item.required} />)}
              </div>
            </SimCard>
          ))}
          {step3Error && step3Error.length > 0 && (
            <div style={{ borderRadius: '0.5rem', border: '2px solid hsl(0 72% 58% / 0.4)', background: 'hsl(0 72% 58% / 0.07)', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <AlertTriangle size={16} style={{ color: 'hsl(0 72% 58%)' }} />
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'hsl(0 72% 58%)' }}>Documents obligatoires manquants</p>
              </div>
              <ul style={{ paddingLeft: '1.25rem' }}>
                {step3Error.map((l, i) => <li key={i} style={{ fontSize: '0.78rem', color: 'hsl(0 72% 58% / 0.8)' }}>{l}</li>)}
              </ul>
            </div>
          )}
        </div>
      )

      case 3: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <SimCard title="Le bien" icon={<Home size={16} />}>
            <div style={S.grid2}>
              <div style={S.field}>
                <label style={S.label}>Type de bien *</label>
                <select style={S.select} value={project.typeBien} onChange={e => upP('typeBien', e.target.value)}>
                  <option value="">Sélectionner</option>
                  <option value="appartement">Appartement</option>
                  <option value="maison">Maison</option>
                  <option value="immeuble">Immeuble de rapport</option>
                  <option value="vefa">VEFA (neuf)</option>
                </select>
              </div>
              <div style={S.field}>
                <label style={S.label}>Localisation *</label>
                <input style={S.input} value={project.localisationBien} placeholder="Papeete, Punaauia…" onChange={e => upP('localisationBien', e.target.value)} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Surface (m²)</label>
                <input style={S.input} type="number" value={project.surface} placeholder="65" onChange={e => upP('surface', e.target.value)} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Prix d'achat (XPF) *</label>
                <input style={S.input} type="number" value={project.prixAcquisition} placeholder="28000000" onChange={e => upP('prixAcquisition', e.target.value)} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Frais de notaire (XPF) — {isVEFA ? '8%' : '12%'} auto</label>
                <input style={S.input} type="number" value={project.fraisNotaireManuel ? project.fraisNotaire : fraisNotaireAuto}
                  readOnly={!project.fraisNotaireManuel} onChange={e => upP('fraisNotaire', e.target.value)} />
                <label style={{ ...S.label, marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={project.fraisNotaireManuel} onChange={e => upP('fraisNotaireManuel', e.target.checked)} />
                  Modifier manuellement
                </label>
              </div>
              <div style={S.field}>
                <label style={{ ...S.label, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  Travaux prévus
                  <button onClick={() => upP('travauxOui', !project.travauxOui)}
                    style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', background: project.travauxOui ? 'hsl(210 90% 60%)' : 'hsl(222 15% 28%)' }} />
                </label>
                {project.travauxOui && <input style={S.input} type="number" value={project.montantTravaux} placeholder="5000000" onChange={e => upP('montantTravaux', e.target.value)} />}
              </div>
              <div style={S.field}>
                <label style={S.label}>Type de financement</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[['credit_total', '100% crédit'], ['avec_apport', 'Avec apport']].map(([val, lbl]) => (
                    <button key={val} onClick={() => upP('financementType', val)}
                      style={{ flex: 1, padding: '0.5rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '0.8rem', fontWeight: 600,
                        background: project.financementType === val ? 'hsl(210 90% 60%)' : 'hsl(222 15% 22%)',
                        color: project.financementType === val ? 'white' : 'hsl(215 15% 55%)' }}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
              <div style={S.field}>
                <label style={S.label}>Durée crédit</label>
                <select style={S.select} value={project.dureeCredit} onChange={e => upP('dureeCredit', e.target.value)}>
                  {[15, 20, 25].map(n => <option key={n} value={n}>{n} ans</option>)}
                </select>
              </div>
              {coutTotal > 0 && (
                <div style={{ ...S.card('hsl(210 90% 60%)'), gridColumn: '1 / -1' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'hsl(210 20% 92%)' }}>
                    Coût total : <span style={{ color: 'hsl(210 90% 60%)' }}>{fmt(coutTotal)} XPF</span>
                  </p>
                  <p style={{ fontSize: '0.7rem', color: 'hsl(215 15% 55%)' }}>
                    {fmt(prixAchat)} achat + {fmt(fraisNotaire)} notaire{montantTravaux > 0 ? ` + ${fmt(montantTravaux)} travaux` : ''}
                  </p>
                </div>
              )}
            </div>
          </SimCard>

          <SimCard title="Stratégie locative" icon={<TrendingUp size={16} />}>
            <div style={S.grid2}>
              <div style={S.field}>
                <label style={S.label}>Mode de location *</label>
                <select style={S.select} value={project.modeLocation} onChange={e => upP('modeLocation', e.target.value)}>
                  <option value="">Sélectionner</option>
                  <option value="meublee_longue">Meublée longue durée</option>
                  <option value="nue">Location nue</option>
                  <option value="courte_duree">Courte durée (Airbnb)</option>
                  <option value="colocation">Colocation</option>
                </select>
              </div>
              <div style={S.field}>
                <label style={S.label}>Loyer mensuel estimé (XPF) *</label>
                <input style={S.input} type="number" value={project.loyerEstime} placeholder="120000" onChange={e => upP('loyerEstime', e.target.value)} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Structure juridique *</label>
                <select style={S.select} value={project.structureJuridique} onChange={e => upP('structureJuridique', e.target.value)}>
                  <option value="">Sélectionner</option>
                  <option value="nom_propre">Nom propre</option>
                  <option value="sci_is">SCI à l'IS</option>
                  <option value="sci_ir">SCI à l'IR</option>
                </select>
              </div>
              {coutTotal > 0 && loyerMensuel > 0 && (
                <div style={{ ...S.card(rentaBrute >= 7 ? 'hsl(152 60% 48%)' : rentaBrute >= 5 ? 'hsl(210 90% 60%)' : 'hsl(38 92% 58%)'), display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'hsl(210 20% 92%)' }}>Rentabilité brute</p>
                  <span style={{ fontSize: '1.4rem', fontWeight: 700, color: rentaBrute >= 7 ? 'hsl(152 60% 48%)' : rentaBrute >= 5 ? 'hsl(210 90% 60%)' : 'hsl(38 92% 58%)' }}>
                    {rentaBrute.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </SimCard>

          <SimCard title="Votre pitch — Présentez votre projet" icon={<Sparkles size={16} />}>
            <p style={{ fontSize: '0.75rem', color: 'hsl(215 15% 55%)', marginBottom: '0.75rem' }}>
              Ce texte accompagnera votre dossier. Vous pouvez l'écrire ou le générer par IA.
            </p>
            <textarea
              value={project.storytelling}
              onChange={e => upP('storytelling', e.target.value)}
              rows={4}
              placeholder="Fort de X ans d'expérience, je développe un modèle d'investissement locatif à Papeete…"
              style={{ ...S.input, resize: 'vertical', minHeight: '100px', fontFamily: 'DM Sans, sans-serif' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'hsl(215 15% 55%)' }}>
                {project.storytelling.trim().split(/\s+/).filter(Boolean).length} mots
              </span>
              <button onClick={generatePitch} disabled={aiLoading} style={S.btn(false)}>
                {aiLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={14} />}
                {aiLoading ? 'Génération…' : 'Générer via IA'}
              </button>
            </div>
          </SimCard>

          {coutTotal > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
              {[
                { label: 'Coût total', value: fmt(coutTotal), sub: 'XPF' },
                { label: 'Loyer/mois', value: loyerMensuel > 0 ? fmt(loyerMensuel) : '—', sub: 'XPF' },
                { label: 'Rentabilité', value: rentaBrute > 0 ? `${rentaBrute.toFixed(1)}%` : '—', color: rentaBrute >= 7 ? 'hsl(152 60% 48%)' : 'hsl(210 90% 60%)' },
                { label: 'Mensualité', value: mensualiteCredit > 0 ? fmt(mensualiteCredit) : '—', sub: 'XPF' },
                { label: 'Endett. projeté', value: `${endettementProjete}%`, color: endettementProjete <= 35 ? 'hsl(152 60% 48%)' : endettementProjete <= 45 ? 'hsl(210 90% 60%)' : 'hsl(38 92% 58%)' },
              ].map(({ label, value, sub, color }) => (
                <div key={label} style={{ textAlign: 'center', padding: '0.75rem', borderRadius: '0.5rem', background: 'hsl(222 20% 13%)', border: '1px solid hsl(222 15% 22%)' }}>
                  <p style={{ fontSize: '0.65rem', color: 'hsl(215 15% 55%)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: color || 'hsl(210 20% 92%)' }}>{value}</p>
                  {sub && <p style={{ fontSize: '0.65rem', color: 'hsl(215 15% 55%)' }}>{sub}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )

      case 4: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Score investisseur */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ borderRadius: '0.75rem', border: `2px solid ${scoreColor}33`, background: `${scoreColor}0d`, padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={22} style={{ color: scoreColor }} />
                <div>
                  <p style={{ fontWeight: 700, color: 'hsl(210 20% 92%)', fontFamily: 'DM Sans' }}>Score investisseur</p>
                  <p style={{ fontSize: '0.78rem', fontWeight: 500, color: scoreColor }}>{scoreLabel}</p>
                </div>
              </div>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, color: scoreColor, fontFamily: 'DM Sans' }}>
                {investorScore}<span style={{ fontSize: '1rem' }}>/100</span>
              </span>
            </div>
            <div style={{ width: '100%', background: 'hsl(222 15% 22%)', borderRadius: '9999px', height: '10px', overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${investorScore}%` }} transition={{ duration: 0.7 }}
                style={{ height: '100%', borderRadius: '9999px', background: scoreColor }} />
            </div>
          </motion.div>

          {/* Jauges */}
          {totalRevenus > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1.5rem', padding: '1.25rem', borderRadius: '0.75rem', background: 'hsl(222 20% 13%)', border: '1px solid hsl(222 15% 22%)' }}>
              <CircularGauge value={tauxEndettementAjuste} max={70} label="Taux ajusté" color={ajusteColor} sublabel="Indicateur principal" />
              <CircularGauge value={endettementProjete} max={70} label="Projeté post-achat" color={endettementProjete <= 35 ? 'hsl(152 60% 48%)' : endettementProjete <= 45 ? 'hsl(210 90% 60%)' : 'hsl(38 92% 58%)'} />
              <CircularGauge value={globalStats.pct} max={100} unit="%" label="Docs complets" color={globalStats.pct === 100 ? 'hsl(152 60% 48%)' : 'hsl(210 90% 60%)'} />
            </div>
          )}

          {/* Récap */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <SimCard title="Profil emprunteur" icon={<User size={16} />}>
              {[
                ['Nom', personal.nomComplet || '—'],
                ['Profession', personal.profession || '—'],
                ['Ancienneté', personal.anciennete ? `${personal.anciennete} ans` : '—'],
                ['Revenus', `${fmt(totalRevenus)} XPF/mois`],
                ['Reste à vivre', `${fmt(resteAVivre)} XPF`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid hsl(222 15% 20%)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'hsl(215 15% 55%)' }}>{k}</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: k === 'Reste à vivre' ? (resteAVivreOk ? 'hsl(152 60% 48%)' : 'hsl(38 92% 58%)') : 'hsl(210 20% 92%)' }}>{v}</span>
                </div>
              ))}
            </SimCard>
            <SimCard title="Solidité du dossier" icon={<Shield size={16} />}>
              {[
                ['Patrimoine net', `${fmt(patrimoineNet)} XPF`, patrimoineNet >= 0 ? 'hsl(152 60% 48%)' : 'hsl(0 72% 58%)'],
                ['Cash-flow locatif', `${fmt(cashFlowLocatifGlobal)} XPF/mois`, cashFlowLocatifGlobal >= 0 ? 'hsl(152 60% 48%)' : 'hsl(38 92% 58%)'],
                ['Taux endett. brut', `${tauxEndettementBrut}%`, 'hsl(215 15% 55%)'],
                ['Taux endett. ajusté', `${tauxEndettementAjuste}%`, ajusteColor],
                ['Taux projeté', `${endettementProjete}%`, endettementProjete <= 35 ? 'hsl(152 60% 48%)' : 'hsl(38 92% 58%)'],
              ].map(([k, v, c]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid hsl(222 15% 20%)' }}>
                  <span style={{ fontSize: '0.78rem', color: 'hsl(215 15% 55%)' }}>{k}</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: c }}>{v}</span>
                </div>
              ))}
            </SimCard>
          </div>

          {/* Contenu IA généré */}
          {generatedContent && (
            <SimCard title="Dossier rédigé par IA" icon={<Sparkles size={16} />}>
              <div style={{ fontSize: '0.82rem', color: 'hsl(210 20% 85%)', lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 400, overflowY: 'auto', padding: '0.5rem', borderRadius: '0.4rem', background: 'hsl(222 20% 10%)' }}>
                {generatedContent}
              </div>
            </SimCard>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={generateDossierAI} disabled={dossierAiLoading} style={{ ...S.btn(false), flex: 1, justifyContent: 'center' }}>
              {dossierAiLoading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={15} />}
              {dossierAiLoading ? 'Génération dossier IA…' : 'Générer le dossier complet via IA'}
            </button>
            <button onClick={generatePDF} style={{ ...S.btn(true), flex: 1, justifyContent: 'center' }}>
              <FileDown size={15} /> Télécharger le PDF
            </button>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'hsl(215 15% 50%)', textAlign: 'center' }}>
            💡 Générez d'abord le dossier IA pour inclure le texte rédigé dans le PDF
          </p>
        </div>
      )
    }
  }

  // ── Stepper header ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: '1rem', right: '1rem', zIndex: 999,
              padding: '0.75rem 1.25rem', borderRadius: '0.5rem', fontFamily: 'DM Sans', fontSize: '0.875rem', fontWeight: 600,
              background: notification.type === 'ok' ? 'hsl(152 60% 48%)' : 'hsl(0 72% 58%)',
              color: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}>
            {notification.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Steps nav */}
      <div style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const isActive = i === step
          const isDone = i < step
          return (
            <button key={i} onClick={() => i < step && setStep(i)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', padding: '0.6rem 0.75rem', flex: '1 1 0', minWidth: 70,
                borderRadius: '0.5rem', border: `1px solid ${isActive ? 'hsl(210 90% 60%)' : isDone ? 'hsl(152 60% 48% / 0.3)' : 'hsl(222 15% 22%)'}`,
                background: isActive ? 'hsl(210 90% 60% / 0.1)' : isDone ? 'hsl(152 60% 48% / 0.05)' : 'hsl(222 20% 13%)',
                cursor: i < step ? 'pointer' : 'default' }}>
              <Icon size={16} style={{ color: isActive ? 'hsl(210 90% 60%)' : isDone ? 'hsl(152 60% 48%)' : 'hsl(215 15% 55%)' }} />
              <span style={{ fontSize: '0.65rem', fontWeight: isActive ? 700 : 500, color: isActive ? 'hsl(210 90% 60%)' : isDone ? 'hsl(152 60% 48%)' : 'hsl(215 15% 55%)', textAlign: 'center', lineHeight: 1.2 }}>
                {s.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Contenu étape */}
      <SimCard title={STEPS[step].label} icon={(() => { const Icon = STEPS[step].icon; return <Icon size={18} /> })()}>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </SimCard>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: step === 0 ? 'flex-end' : 'space-between' }}>
        {step > 0 && (
          <button onClick={() => { setStep3Error(null); setStep(s => s - 1) }} style={S.btn(false)}>
            <ChevronLeft size={16} /> Précédent
          </button>
        )}
        {step < 4 && (
          <button onClick={handleNext} style={S.btn(true)}>
            Suivant <ChevronRight size={16} />
          </button>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
