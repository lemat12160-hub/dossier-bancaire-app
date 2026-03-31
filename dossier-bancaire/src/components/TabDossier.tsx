import { useState } from 'react'
import { FolderOpen, ClipboardCheck } from 'lucide-react'
import BankFileStepper from './BankFileStepper'
import DossierChecklist from './DossierChecklist'

export default function TabDossier() {
  const [tab, setTab] = useState<'constructeur' | 'checklist'>('constructeur')

  const tabStyle = (active: boolean) => ({
    display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem',
    borderRadius: '0.4rem', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
    fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.15s',
    background: active ? 'hsl(222 20% 13%)' : 'transparent',
    color: active ? 'hsl(210 90% 60%)' : 'hsl(215 15% 55%)',
    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
  } as React.CSSProperties)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', gap: '0.25rem', background: 'hsl(222 15% 18%)', padding: '0.25rem', borderRadius: '0.5rem', width: 'fit-content' }}>
        <button style={tabStyle(tab === 'constructeur')} onClick={() => setTab('constructeur')}>
          <FolderOpen size={14} /> Constructeur de dossier
        </button>
        <button style={tabStyle(tab === 'checklist')} onClick={() => setTab('checklist')}>
          <ClipboardCheck size={14} /> Checklist documents
        </button>
      </div>

      {tab === 'constructeur' ? <BankFileStepper /> : <DossierChecklist />}
    </div>
  )
}
