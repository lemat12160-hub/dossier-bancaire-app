import './index.css'
import TabDossier from '@/components/TabDossier'

export default function App() {
  return (
    <div className="min-h-screen" style={{ background: 'hsl(222 20% 10%)' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(210 90% 60%)' }}>
              <span className="text-white font-bold text-sm">DB</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'hsl(210 20% 92%)', fontFamily: 'DM Sans, sans-serif' }}>
              Dossier Bancaire Investisseur
            </h1>
          </div>
          <p style={{ color: 'hsl(215 15% 55%)', fontSize: '0.875rem' }}>
            Polynésie française — Montage de dossier crédit immobilier
          </p>
        </div>
        <TabDossier />
      </div>
    </div>
  )
}
