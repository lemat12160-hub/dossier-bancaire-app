import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface Props {
  title: string
  icon?: ReactNode
  children: ReactNode
  className?: string
}

const SimCard = ({ title, icon, children, className = '' }: Props) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={className}
    style={{
      borderRadius: '0.75rem',
      border: '1px solid hsl(222 15% 22%)',
      background: 'hsl(222 20% 13%)',
      padding: '1.25rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    }}
  >
    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {icon && <span style={{ color: 'hsl(210 90% 60%)' }}>{icon}</span>}
      <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem', fontWeight: 600, color: 'hsl(210 20% 92%)' }}>
        {title}
      </h3>
    </div>
    {children}
  </motion.div>
)

export default SimCard
