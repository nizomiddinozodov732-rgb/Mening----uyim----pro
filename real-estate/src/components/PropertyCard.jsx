import { Link } from 'react-router-dom'
import { Bed, Bath, Maximize, MapPin, Star, Heart, MessageCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const BASE_URL = API_URL.replace('/api', '')

export default function PropertyCard({ property, onChat }) {
  const { user } = useAuth()
  const [hoverRating, setHoverRating] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    setIsFavorite(favorites.includes(property.id))
  }, [property.id])

  const toggleFavorite = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    if (isFavorite) {
      const newFavorites = favorites.filter(id => id !== property.id)
      localStorage.setItem('favorites', JSON.stringify(newFavorites))
      setIsFavorite(false)
    } else {
      favorites.push(property.id)
      localStorage.setItem('favorites', JSON.stringify(favorites))
      setIsFavorite(true)
    }
  }

  // Handle both image (old format) and images (new format from backend)
  let imageUrl = property.image || (property.images ? property.images.split(',')[0] : 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800')
  
  // If it's a relative path (from our backend), prefix it with the base URL
  if (imageUrl.startsWith('/uploads/')) {
    imageUrl = `${BASE_URL}${imageUrl}`
  }

  const handleRating = async (e, rating) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      alert('Reyting qoldirish uchun tizimga kiring')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/properties/${property.id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating })
      })

      if (response.ok) {
        alert('Rahmat! Reytingingiz qabul qilindi.')
        // In a real app, we would trigger a refresh of the properties list
        window.location.reload() 
      }
    } catch (error) {
      console.error('Rating error:', error)
    }
  }

  return (
    <Link to={`/property/${property.id}`} className="block group">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-slate-100 dark:border-slate-800">
        <div className="relative h-48 sm:h-64 overflow-hidden">
          <img 
            src={imageUrl} 
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="bg-blue-600/90 backdrop-blur-md text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg">
              {property.type === 'sale' ? 'Sotuv' : 'Ijara'}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (onChat) onChat(property)
            }}
            className="absolute top-4 right-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-2 rounded-xl flex items-center justify-center shadow-lg border border-white/20 dark:border-white/5 hover:scale-110 active:scale-95 transition-all z-10"
          >
            <MessageCircle className="h-4 w-4 text-blue-600" />
          </button>
          <button
            onClick={toggleFavorite}
            className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-2 rounded-xl flex items-center justify-center shadow-lg border border-white/20 dark:border-white/5 hover:scale-110 active:scale-95 transition-all z-10"
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400'}`} />
          </button>
          <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg border border-white/20 dark:border-white/5">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-black text-gray-900 dark:text-white">{property.rating?.toFixed(1) || '0.0'}</span>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs font-bold mb-3 uppercase tracking-wider">
            <MapPin className="h-4 w-4 mr-2 text-blue-500" />
            <span className="truncate">{property.location}</span>
          </div>
          
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 leading-tight">{property.title}</h3>
          
          <div className="flex items-center gap-1.5 mb-6 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl w-fit">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={(e) => handleRating(e, star)}
                className="focus:outline-none transition-transform active:scale-90 hover:scale-125"
              >
                <Star
                  className={`h-4 w-4 transition-colors ${
                    star <= (hoverRating || property.rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300 dark:text-slate-700'
                  }`}
                />
              </button>
            ))}
            {property.ratingCount > 0 && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold ml-1 uppercase tracking-tighter">({property.ratingCount})</span>
            )}
          </div>

          <div className="flex items-baseline gap-1 mb-6">
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {property.price.toLocaleString()}
            </p>
            <span className="text-[10px] font-black text-blue-600/60 dark:text-blue-400/60 uppercase tracking-widest">so'm</span>
          </div>
          
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-black border-t dark:border-slate-800 pt-5 uppercase tracking-widest">
            <div className="flex items-center gap-1.5">
              <Bed className="h-4 w-4 text-blue-500/60" />
              <span>{property.bedrooms}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bath className="h-4 w-4 text-blue-500/60" />
              <span>{property.bathrooms}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Maximize className="h-4 w-4 text-blue-500/60" />
              <span>{property.area} m²</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
