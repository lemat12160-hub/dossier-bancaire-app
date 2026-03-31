import { useState } from 'react'
import SimCard from './SimCard'
import { FolderOpen, User, Wallet, Landmark, FileText, CheckCircle2, Circle } from 'lucide-react'
import { motion } from 'framer-motion'

interface DocItem { id: string; label: string; detail?: string }
interface DocCategory { title: string; icon: React.ReactNode; items: DocItem[] }

const CATEGORIES: DocCategory[] = [
  {
    title: 'Identité', icon: <User size={16} />,
    items: [
      { id: 'cni', label: "Carte nationale d'identité (CNI)", detail: 'Recto/verso, en cours de validité' },
      { id: 'livret', label: 'Livret de famille', detail: 'Copie intégrale' },
      { id: 'domicile', label: 'Justificatif de domicile', detail: 'Moins de 3 mois (EDF, eau, téléphone)' },
    ],
  },
  {
    title: 'Revenus', icon: <Wallet size={16} />,
    items: [
      { id: 'bulletins', label: '3 derniers bulletins de salaire', detail: 'Mois complets' },
      { id: 'avis_imposition', label: "2 derniers avis d'imposition", detail: 'DICP (PF) ou DGFiP (France)' },
      { id: 'contrat_travail', label: 'Contrat de travail', detail: 'CDI, CDD ou attestation employeur' },
    ],
  },
  {
    title: 'Finances', icon: <Landmark size={16} />,
    items: [
      { id: 'releves', label: '3 derniers relevés bancaires', detail: 'Sans découvert — tous comptes courants' },
      { id: 'apport', label: "Justificatif d'apport personnel", detail: 'Relevé épargne, donation, vente…' },
      { id: 'amortissement', label: "Tableaux d'amortissement crédits en cours", detail: 'Si crédit(s) existant(s)' },
    ],
  },
  {
    title: 'Projet', icon: <FileText size={16} />,
    items: [
      { id: 'compromis', label: 'Compromis de vente signé', detail: 'Ou promesse de vente' },
      { id: 'valeur_locative', label: 'Attestation de valeur locative', detail: 'Estimation agence ou comparable' },
      { id: 'devis_travaux', label: 'Devis travaux détaillés', detail: 'Par corps de métier si possible' },
    ],
  },
]

const ALL_IDS = CATEGORIES.flatMap(c => c.items.map(i => i.id))

export default function DossierChecklist() {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const toggle = (id: string) => setChecked(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const total = ALL_IDS.length
  const done = checked.size
  const pct = Math.round((done / total) * 100)
  const pctLabel = pct === 100 ? '🎉 Dossier complet !' : pct >= 75 ? 'Presque prêt' : pct >= 50 ? 'En bonne voie' : 'À compléter'
  const barColor = pct === 100 ? 'hsl(152 60% 48%)' : pct >= 60 ? 'hsl(210 90% 60%)' : pct >= 30 ? 'hsl(38 92% 58%)' : 'hsl(0 72% 58%)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        style={{
          borderRadius: '0.75rem',
          border: `2px solid ${pct === 100 ? 'hsl(152 60% 48% / 0.4)' : 'hsl(222 15% 22%)'}`,
          background: pct === 100 ? 'hsl(152 60% 48% / 0.05)' : 'hsl(222 20% 13%)',
          padding: '1.25rem',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FolderOpen size={18} style={{ color: pct === 100 ? 'hsl(152 60% 48%)' : 'hsl(210 90% 60%)' }} />
            <span style={{ fontWeight: 600, color: 'hsl(210 20% 92%)', fontFamily: 'DM Sans' }}>Complétude du dossier</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: pct === 100 ? 'hsl(152 60% 48%)' : 'hsl(210 90% 60%)' }}>{pct}%</span>
            <p style={{ fontSize: '0.7rem', color: 'hsl(215 15% 55%)' }}>{done}/{total} documents</p>
          </div>
        </div>
        <div style={{ width: '100%', background: 'hsl(222 15% 22%)', borderRadius: '9999px', height: '10px', overflow: 'hidden' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }}
            style={{ height: '100%', borderRadius: '9999px', background: barColor }} />
        </div>
        <p style={{ fontSize: '0.75rem', color: 'hsl(215 15% 55%)', marginTop: '0.5rem' }}>{pctLabel}</p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {CATEGORIES.map(cat => {
          const catDone = cat.items.filter(i => checked.has(i.id)).length
          return (
            <SimCard key={cat.title} title={`${cat.title} (${catDone}/${cat.items.length})`} icon={cat.icon}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {cat.items.map(item => {
                  const isChecked = checked.has(item.id)
                  return (
                    <button key={item.id} onClick={() => toggle(item.id)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                        borderRadius: '0.5rem', padding: '0.6rem 0.75rem', textAlign: 'left',
                        background: isChecked ? 'hsl(152 60% 48% / 0.07)' : 'transparent',
                        border: 'none', cursor: 'pointer', width: '100%',
                        transition: 'background 0.15s',
                      }}>
                      {isChecked
                        ? <CheckCircle2 size={16} style={{ color: 'hsl(152 60% 48%)', marginTop: 2, flexShrink: 0 }} />
                        : <Circle size={16} style={{ color: 'hsl(215 15% 55%)', marginTop: 2, flexShrink: 0 }} />}
                      <div>
                        <p style={{ fontSize: '0.82rem', fontWeight: 500, color: isChecked ? 'hsl(152 60% 48%)' : 'hsl(210 20% 92%)', textDecoration: isChecked ? 'line-through' : 'none' }}>
                          {item.label}
                        </p>
                        {item.detail && <p style={{ fontSize: '0.7rem', color: 'hsl(215 15% 55%)', marginTop: '0.15rem' }}>{item.detail}</p>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </SimCard>
          )
        })}
      </div>
    </div>
  )
}
