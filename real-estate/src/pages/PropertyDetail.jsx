import { useParams, Link } from 'react-router-dom'
import { Bed, Bath, Maximize, MapPin, Phone, Mail, ArrowLeft, Check, Download, CreditCard, Smartphone, Wallet, Loader2, Star, MessageSquare } from 'lucide-react'
import PropertyMap from '../components/PropertyMap'
import Chat from '../components/Chat'
import PropertyCard from '../components/PropertyCard'
import { useState, useEffect } from 'react'
import { saveAs } from 'file-saver'
import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const BASE_URL = API_URL.replace('/api', '')

export default function PropertyDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [property, setProperty] = useState(null)
  const [allProperties, setAllProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)

  useEffect(() => {
    fetchProperty()
    fetchAllProperties()
    // Check if user has already rated this property (mocking for now)
    const savedRating = localStorage.getItem(`rating_${id}`)
    if (savedRating) setUserRating(parseInt(savedRating))
  }, [id])

  const handleRating = async (rating) => {
    if (!user) {
      alert('Reyting qoldirish uchun tizimga kiring')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/properties/${id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating })
      })

      if (response.ok) {
        const data = await response.json()
        setUserRating(rating)
        localStorage.setItem(`rating_${id}`, rating)
        alert('Rahmat! Reytingingiz qabul qilindi.')
        fetchProperty() // Refresh property data to get updated average rating
      } else {
        const data = await response.json()
        alert(data.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Rating error:', error)
      alert('Server bilan bog\'lanishda xatolik')
    }
  }

  const fetchProperty = async () => {
    try {
      const response = await fetch(`${API_URL}/properties/${id}`)
      if (!response.ok) {
        throw new Error('Property not found')
      }
      const data = await response.json()
      setProperty(data)
    } catch (error) {
      console.error('Error fetching property:', error)
      setProperty(null)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAllProperties = async () => {
    try {
      const response = await fetch(`${API_URL}/properties`)
      const data = await response.json()
      setAllProperties(data)
    } catch (error) {
      console.error('Error fetching properties:', error)
    }
  }

  const downloadImage = async (imageUrl, filename) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      saveAs(blob, filename)
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }

  const downloadVideo = async (videoUrl, filename) => {
    try {
      const response = await fetch(videoUrl)
      const blob = await response.blob()
      saveAs(blob, filename)
    } catch (error) {
      console.error('Error downloading video:', error)
    }
  }

  const handlePayment = async () => {
    if (!user) {
      alert('To\'lov uchun avval tizimga kiring')
      return
    }

    if (!paymentMethod) {
      alert('To\'lov usulini tanlang')
      return
    }

    setIsProcessingPayment(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          propertyId: property.id,
          amount: property.price * 0.01, // 1% advance payment
          paymentMethod: paymentMethod
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setPaymentStatus('completed')
        setTimeout(() => {
          setShowPaymentModal(false)
          setPaymentStatus(null)
          setIsProcessingPayment(false)
        }, 3000)
      } else {
        setPaymentStatus('failed')
        setIsProcessingPayment(false)
      }
    } catch (error) {
      console.error('Payment error:', error)
      setPaymentStatus('failed')
      setIsProcessingPayment(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">E'lon topilmadi</h2>
          <Link to="/listings" className="text-blue-600 hover:underline">
            E'lonlarga qaytish
          </Link>
        </div>
      </div>
    )
  }

  // Handle both image (old format) and images (new format from backend)
  let imageUrl = property.image || (property.images ? property.images.split(',')[0] : 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800')

  // If it's a relative path (from our backend), prefix it with the base URL
  if (imageUrl.startsWith('/uploads/')) {
    imageUrl = `${BASE_URL}${imageUrl}`
  }

  // Compute similar properties — same type, exclude current, limit to 3
  const similarProperties = allProperties
    .filter(p => p.id !== property.id && p.type === property.type)
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <Link 
            to="/listings"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            E'lonlarga qaytish
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Image */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden relative">
              <img 
                src={imageUrl} 
                alt={property.title}
                className="w-full h-64 sm:h-80 md:h-96 object-cover"
              />
              <button
                onClick={() => downloadImage(imageUrl, `${property.title}-rasm.jpg`)}
                className="absolute bottom-4 right-4 bg-white hover:bg-gray-100 text-gray-800 px-4 py-2 rounded-lg shadow-lg transition flex items-center gap-2 touch-target"
              >
                <Download className="h-4 w-4" />
                <span className="text-sm">Rasmni yuklab olish</span>
              </button>
            </div>

            {/* Video */}
            {property.video && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Video</h3>
                  <video 
                    controls 
                    className="w-full rounded-lg"
                    src={property.video.startsWith('http') ? property.video : `${BASE_URL}${property.video}`}
                  />
                  <button
                    onClick={() => downloadVideo(property.video.startsWith('http') ? property.video : `${BASE_URL}${property.video}`, `${property.title}-video.mp4`)}
                    className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition touch-target"
                  >
                    <Download className="h-4 w-4" />
                    <span className="text-sm">Videoni yuklab olish</span>
                  </button>
                </div>
              </div>
            )}

            {/* Property Info */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-semibold w-fit">
                  {property.type}
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                  {property.price.toLocaleString()} so'm
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{property.title}</h1>
              
              <div className="flex items-center text-gray-600 mb-6 text-sm sm:text-base">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                {property.location}
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg text-center">
                  <Bed className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-blue-600" />
                  <div className="font-semibold text-sm sm:text-base">{property.bedrooms}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Xona</div>
                </div>
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg text-center">
                  <Bath className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-blue-600" />
                  <div className="font-semibold text-sm sm:text-base">{property.bathrooms}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Vannaxona</div>
                </div>
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg text-center">
                  <Maximize className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-blue-600" />
                  <div className="font-semibold text-sm sm:text-base">{property.area}</div>
                  <div className="text-xs sm:text-sm text-gray-600">m²</div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Tavsif</h2>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{property.description}</p>
              </div>

              <div className="border-t pt-6 mt-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Reyting qoldiring</h2>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => handleRating(star)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= (hoverRating || userRating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-4 text-gray-600 font-medium">
                    {userRating > 0 ? `Sizning bahoingiz: ${userRating}` : 'Baholang'}
                  </span>
                </div>
              </div>

              <div className="border-t pt-6 mt-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Xususiyatlar</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {property.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mr-2" />
                      <span className="text-gray-700 text-sm sm:text-base">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Manzil xaritada</h2>
              <PropertyMap 
                coordinates={property.coordinates} 
                location={property.location}
                allProperties={allProperties}
                currentPropertyId={property.id}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 sticky top-20 sm:top-24">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Sotuvchi bilan bog'lanish</h2>
              
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-3 sm:mr-4 text-sm sm:text-base">
                    U
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm sm:text-base">Uy-Joy Savdosi</div>
                    <div className="text-xs sm:text-sm text-gray-600">Broker</div>
                  </div>
                </div>

                <a 
                  href="tel:+998901234567"
                  className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition text-sm sm:text-base touch-target btn-hover"
                >
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Qo'ng'iroq qilish
                </a>

                <div className="flex items-center justify-center w-full border border-blue-600 text-blue-600 py-3 rounded-lg transition text-sm sm:text-base cursor-default">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Chat orqali yozing
                </div>

                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex items-center justify-center w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition text-sm sm:text-base touch-target"
                >
                  <Wallet className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Online to'lov
                </button>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Ish vaqti</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">Dushanba - Shanba: 9:00 - 18:00</p>
                  <p className="text-gray-600 text-xs sm:text-sm">Yakshanba: Dam olish kuni</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Properties */}
      {similarProperties.length > 0 && (
        <div className="bg-gray-50 border-t py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">O'xshash e'lonlar</h2>
              <Link to="/listings" className="text-blue-600 hover:text-blue-800 font-semibold text-sm">
                Barchasini ko'rish &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarProperties.map(p => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Online to'lov</h2>
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setPaymentMethod('')
                  setPaymentStatus(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Mulq narxi:</p>
              <p className="text-2xl font-bold text-gray-900">{property.price.toLocaleString()} so'm</p>
              <p className="text-sm text-gray-600 mt-2">Old to'lov (1%):</p>
              <p className="text-xl font-bold text-blue-600">{(property.price * 0.01).toLocaleString()} so'm</p>
            </div>

            {paymentStatus === 'completed' && (
              <div className="mb-6 p-4 bg-green-50 rounded-lg text-center">
                <Check className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <p className="text-green-700 font-semibold">To'lov muvaffaqiyatli amalga oshdi!</p>
              </div>
            )}

            {paymentStatus === 'failed' && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg text-center">
                <p className="text-red-700 font-semibold">To'lov amalga oshmadi. Qaytadan urinib ko'ring.</p>
              </div>
            )}

            {!paymentStatus && (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">To'lov usulini tanlang</label>
                  <div className="space-y-3">
                    <button
                      onClick={() => setPaymentMethod('click')}
                      className={`w-full flex items-center p-4 border-2 rounded-lg transition ${
                        paymentMethod === 'click' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Smartphone className="h-6 w-6 mr-3 text-blue-600" />
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">Click</p>
                        <p className="text-xs text-gray-600">Mobil ilova orqali</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setPaymentMethod('payme')}
                      className={`w-full flex items-center p-4 border-2 rounded-lg transition ${
                        paymentMethod === 'payme' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <CreditCard className="h-6 w-6 mr-3 text-blue-600" />
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">Payme</p>
                        <p className="text-xs text-gray-600">Karta orqali</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setPaymentMethod('uzum')}
                      className={`w-full flex items-center p-4 border-2 rounded-lg transition ${
                        paymentMethod === 'uzum' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Wallet className="h-6 w-6 mr-3 text-blue-600" />
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">Uzum</p>
                        <p className="text-xs text-gray-600">Uzum Bank orqali</p>
                      </div>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={!paymentMethod || isProcessingPayment}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg transition flex items-center justify-center touch-target"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Qayta ishlamoqda...
                    </>
                  ) : (
                    <>
                      <Wallet className="h-5 w-5 mr-2" />
                      To'lovni amalga oshirish
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {property && (
        <Chat
          sellerId={property.userId}
          sellerName={property.sellerName || 'Sotuvchi'}
          propertyId={property.id}
          propertyTitle={property.title}
        />
      )}
    </div>
  )
}
