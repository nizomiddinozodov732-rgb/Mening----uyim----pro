import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SellerRoute({ children }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Yuklanmoqda...</div>
  }

  if (!user || user.role !== 'seller') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
