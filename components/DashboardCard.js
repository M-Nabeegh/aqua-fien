'use client'
import CircularProgress from './CircularProgress'

export default function DashboardCard({ 
  title, 
  value, 
  change, 
  changeType = 'positive', 
  icon, 
  color = '#3B82F6',
  showProgress = false,
  progressValue = 0,
  progressMax = 100,
  subtitle
}) {
  const changeColor = changeType === 'positive' ? 'text-green-600' : 'text-red-600'
  const changeIcon = changeType === 'positive' ? '↗' : '↘'

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="p-3 rounded-lg text-white text-xl"
            style={{ backgroundColor: color }}
          >
            {icon}
          </div>
          <div>
            <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
            {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
          </div>
        </div>
        
        {showProgress && (
          <CircularProgress 
            value={progressValue} 
            max={progressMax} 
            size={60} 
            strokeWidth={4}
            color={color}
          >
            <div className="text-xs font-bold" style={{ color }}>
              {Math.round((progressValue / progressMax) * 100)}%
            </div>
          </CircularProgress>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${changeColor}`}>
            <span>{changeIcon}</span>
            <span>{Math.abs(change)}%</span>
            <span className="text-gray-500">vs last month</span>
          </div>
        )}
      </div>
    </div>
  )
}
