import { Link } from 'react-router-dom'
import { Plus, Home, Heart, Settings, LogOut, MapPin, Bed, Bath, Maximize, Crown, Star, Wallet, CheckCircle, Clock, XCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function Dashboard() {
  const { user, logout, upgradeToPremium } = useAuth()
  const [userProperties, setUserProperties] = useState([])
  const [payments, setPayments] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      if (user.role === 'seller') {
        fetchUserProperties()
      } else {
        setIsLoading(false)
      }
      fetchPayments()
    } else {
      setIsLoading(false)
    }
  }, [user])

  const fetchUserProperties = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/user/properties`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setUserProperties(data)
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching user properties:', error)
      setIsLoading(false)
    }
  }

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/payments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setPayments(data)
    } catch (error) {
      console.error('Error fetching payments:', error)
    }
  }

  const deleteProperty = async (id) => {
    if (!window.confirm("Haqiqatdan ham ushbu e'lonni o'chirmoqchimisiz?")) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/properties/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        alert("E'lon muvaffaqiyatli o'chirildi")
        fetchUserProperties()
      } else {
        const data = await response.json()
        throw new Error(data.error || "O'chirishda xatolik yuz berdi")
      }
    } catch (error) {
      console.error('Error deleting property:', error)
      alert(error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Shaxsiy kabinet</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Xush kelibsiz, {user?.name}! 
                {user?.role === 'seller' && !user?.isPremium && ' • Uy Sotuvchi'}
                {user?.role === 'materials_seller' && ' • Qurilish Materiallari Sotuvchisi'}
                {user?.isPremium && ' • Premium Sotuvchi'}
              </p>
            </div>
            {(user?.role === 'seller' || user?.role === 'materials_seller') && (
              <div className="flex items-center gap-4">
                <Link 
                  to={user?.role === 'seller' ? '/add-property' : '/construction-materials'}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 text-sm sm:text-base touch-target btn-hover"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">{user?.role === 'seller' ? 'Yangi e\'lon' : 'Material qo\'shish'}</span>
                  <span className="sm:hidden">Qo'shish</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Premium Banner for Sellers */}
        {user?.role === 'seller' && !user?.isPremium && (
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-white p-2 sm:p-3 rounded-full">
                  <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-xl font-bold text-white">Premium sotuvchi bo'ling</h3>
                  <p className="text-yellow-100 text-xs sm:text-sm">E'lonlaringizni ko'proq ko'rish uchun premiumga o'ting</p>
                </div>
              </div>
              <button
                onClick={upgradeToPremium}
                className="bg-white hover:bg-gray-100 text-yellow-600 px-4 sm:px-6 py-3 rounded-lg font-semibold transition text-sm sm:text-base touch-target"
              >
                Premiumga o'tish
              </button>
            </div>
          </div>
        )}

        {/* Premium Badge */}
        {user?.isPremium && (
          <div className="bg-gradient-to-r from-purple-500 to-purple-700 rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-white p-2 sm:p-3 rounded-full">
                <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-xl font-bold text-white flex items-center gap-2">
                  <Star className="h-4 w-4 sm:h-5 sm:w-5" />
                  Premium Sotuvchi
                </h3>
                <p className="text-purple-100 text-xs sm:text-sm">Barcha premium imkoniyatlar faol</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        {user?.role === 'seller' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs sm:text-sm">E'lonlar</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{userProperties.length}</p>
                </div>
                <Home className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs sm:text-sm">Ko'rishlar</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">0</p>
                </div>
                <Heart className="h-10 w-10 sm:h-12 sm:w-12 text-red-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs sm:text-sm">Qo'ng'iroqlar</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">0</p>
                </div>
                <MapPin className="h-10 w-10 sm:h-12 sm:w-12 text-green-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs sm:text-sm">Saqlangan</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">0</p>
                </div>
                <Heart className="h-10 w-10 sm:h-12 sm:w-12 text-pink-500" />
              </div>
            </div>
          </div>
        ) : user?.role === 'materials_seller' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs sm:text-sm">Materiallar</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">0</p>
                </div>
                <Home className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs sm:text-sm">Buyurtmalar</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">0</p>
                </div>
                <Wallet className="h-10 w-10 sm:h-12 sm:w-12 text-green-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs sm:text-sm">Ko'rishlar</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">0</p>
                </div>
                <Heart className="h-10 w-10 sm:h-12 sm:w-12 text-red-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs sm:text-sm">Reyting</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">5.0</p>
                </div>
                <Star className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-500" />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs sm:text-sm">Ko'rilgan</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">0</p>
                </div>
                <Heart className="h-10 w-10 sm:h-12 sm:w-12 text-red-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs sm:text-sm">Saqlangan</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">0</p>
                </div>
                <Heart className="h-10 w-10 sm:h-12 sm:w-12 text-pink-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs sm:text-sm">So'rovlar</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">0</p>
                </div>
                <MapPin className="h-10 w-10 sm:h-12 sm:w-12 text-green-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs sm:text-sm">Xabarlar</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">0</p>
                </div>
                <Wallet className="h-10 w-10 sm:h-12 sm:w-12 text-blue-500" />
              </div>
            </div>
          </div>
        )}

        {/* Payment History */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <Wallet className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">To'lov tarixi</h2>
          </div>
          
          {payments.length > 0 ? (
            <div className="space-y-3">
              {payments.map(payment => (
                <div key={payment.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">
                          {payment.propertyTitle || 'Old to\'lov'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          payment.paymentStatus === 'completed' ? 'bg-green-100 text-green-700' :
                          payment.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {payment.paymentStatus === 'completed' ? 'Muvaffaqiyatli' :
                           payment.paymentStatus === 'pending' ? 'Kutilmoqda' : 'Rad etildi'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-gray-600 text-xs sm:text-sm">
                        <span>{payment.amount.toLocaleString()} so'm</span>
                        <span>•</span>
                        <span>{payment.paymentMethod}</span>
                        <span>•</span>
                        <span>{new Date(payment.createdAt).toLocaleDateString('uz-UZ')}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        ID: {payment.transactionId}
                      </div>
                    </div>
                    <div className="flex items-center justify-end">
                      {payment.paymentStatus === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : payment.paymentStatus === 'pending' ? (
                        <Clock className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 text-sm sm:text-base">Hozircha to'lovlar yo'q</p>
            </div>
          )}
        </div>

        {/* My Properties - Only for Sellers */}
        {user?.role === 'seller' && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Mening e'lonlarim</h2>
            
            {userProperties.length > 0 ? (
              <div className="space-y-4">
                {userProperties.map(property => (
                  <div key={property.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition">
                    <div className="flex flex-col gap-4">
                      <img 
                        src={property.images ? property.images.split(',')[0] : property.image} 
                        alt={property.title}
                        className="w-full h-40 sm:h-48 md:h-32 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">{property.title}</h3>
                            <div className="flex items-center text-gray-500 text-xs sm:text-sm mt-1">
                              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              {property.location}
                            </div>
                          </div>
                          <span className="bg-blue-600 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm w-fit">
                            {property.type}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 text-gray-600 text-xs sm:text-sm">
                          <div className="flex items-center">
                            <Bed className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            {property.bedrooms} xona
                          </div>
                          <div className="flex items-center">
                            <Bath className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            {property.bathrooms} vannaxona
                          </div>
                          <div className="flex items-center">
                            <Maximize className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            {property.area} m²
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
                          <p className="text-lg sm:text-xl font-bold text-blue-600">
                            {property.price.toLocaleString()} so'm
                          </p>
                          <div className="flex gap-2">
                            <button className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-xs sm:text-sm touch-target">
                              Tahrirlash
                            </button>
                            <button 
                              onClick={() => deleteProperty(property.id)}
                              className="px-3 sm:px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition text-xs sm:text-sm touch-target"
                            >
                              O'chirish
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <Home className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">E'lonlar yo'q</h3>
                <p className="text-gray-600 mb-4 text-sm sm:text-base">Hali hech qanday e'lon qo'shmadingiz</p>
                <Link 
                  to="/add-property"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-3 rounded-lg font-semibold transition text-sm sm:text-base touch-target btn-hover"
                >
                  Birinchi e'lonni qo'shing
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Saved Properties - For Customers */}
        {user?.role === 'customer' && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Saqlangan e'lonlar</h2>
            <div className="text-center py-8 sm:py-12">
              <Heart className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Hali hech narsa saqlanmagan</h3>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">Yoqqan mulklarni saqlang</p>
              <Link 
                to="/listings"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-3 rounded-lg font-semibold transition text-sm sm:text-base touch-target btn-hover"
              >
                E'lonlarni ko'rish
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {user?.role === 'seller' ? (
            <>
              <Link 
                to="/add-property"
                className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition flex items-center gap-3 sm:gap-4 card-hover"
              >
                <div className="bg-blue-100 p-2 sm:p-3 rounded-lg">
                  <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Yangi e'lon</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">Mulk qo'shish</p>
                </div>
              </Link>

              <Link 
                to="/listings"
                className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition flex items-center gap-3 sm:gap-4 card-hover"
              >
                <div className="bg-green-100 p-2 sm:p-3 rounded-lg">
                  <Home className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Barcha e'lonlar</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">Ko'rish</p>
                </div>
              </Link>

              <button className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition flex items-center gap-3 sm:gap-4 card-hover">
                <div className="bg-purple-100 p-2 sm:p-3 rounded-lg">
                  <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Sozlamalar</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">Profilni tahrirlash</p>
                </div>
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/listings"
                className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition flex items-center gap-3 sm:gap-4 card-hover"
              >
                <div className="bg-green-100 p-2 sm:p-3 rounded-lg">
                  <Home className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">E'lonlar qidiring</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">Uy-joy topish</p>
                </div>
              </Link>

              <button className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition flex items-center gap-3 sm:gap-4 card-hover">
                <div className="bg-red-100 p-2 sm:p-3 rounded-lg">
                  <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Saqlanganlar</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">Sevimli mulklar</p>
                </div>
              </button>

              <button className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition flex items-center gap-3 sm:gap-4 card-hover">
                <div className="bg-purple-100 p-2 sm:p-3 rounded-lg">
                  <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Sozlamalar</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">Profilni tahrirlash</p>
                </div>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
