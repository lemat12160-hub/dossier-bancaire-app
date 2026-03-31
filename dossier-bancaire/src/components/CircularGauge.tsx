interface Props {
  value: number
  max: number
  label: string
  unit?: string
  size?: number
  color: string
  sublabel?: string
}

const CircularGauge = ({ value, max, label, unit = '%', size = 140, color, sublabel }: Props) => {
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clampedValue = Math.min(Math.max(value, 0), max)
  const progress = (clampedValue / max) * circumference

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="hsl(222 15% 22%)" strokeWidth={strokeWidth} />
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circumference} strokeDashoffset={circumference - progress}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.7s ease-out' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'hsl(210 20% 92%)', fontFamily: 'DM Sans' }}>
            {value.toFixed(0)}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'hsl(215 15% 55%)' }}>{unit}</span>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '0.8rem', fontWeight: 500, color: 'hsl(210 20% 92%)' }}>{label}</p>
        {sublabel && <p style={{ fontSize: '0.7rem', color: 'hsl(215 15% 55%)' }}>{sublabel}</p>}
      </div>
    </div>
  )
}

export default CircularGauge
