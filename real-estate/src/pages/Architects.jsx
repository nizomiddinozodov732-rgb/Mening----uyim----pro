import { useState, useEffect } from 'react'
import { Search, Filter, Star, Briefcase, Phone, Mail, Award, CheckCircle2, MessageSquare, Zap, ExternalLink, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Chat from '../components/Chat'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function Architects() {
  const { user } = useAuth()
  const [architects, setArchitects] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSpecialization, setFilterSpecialization] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [hoverRating, setHoverRating] = useState({})
  const [activeChat, setActiveChat] = useState(null)

  useEffect(() => {
    fetchArchitects()
  }, [])

  const fetchArchitects = async () => {
    try {
      const response = await fetch(`${API_URL}/architects`)
      if (response.ok) {
        const data = await response.json()
        setArchitects(data)
      }
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching architects:', error)
      setIsLoading(false)
    }
  }

  const handleRating = async (id, rating) => {
    if (!user) {
      alert('Reyting qoldirish uchun tizimga kiring')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/architects/${id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating })
      })

      if (response.ok) {
        alert('Rahmat! Reytingingiz qabul qilindi.')
        fetchArchitects()
      }
    } catch (error) {
      console.error('Rating error:', error)
    }
  }

  const filteredArchitects = architects.filter(arch => {
    const matchesSearch = arch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         arch.specialization.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSpec = !filterSpecialization || arch.specialization === filterSpecialization
    return matchesSearch && matchesSpec
  })

  const specializations = [...new Set(architects.map(arch => arch.specialization))]

  const getSkills = (spec) => {
    const skillMap = {
      'Interyer dizayner': ['AutoCAD', '3ds Max', 'Corona', 'Photoshop'],
      'Landshaft arxitektori': ['SketchUp', 'Lumion', 'Revit', 'Planos'],
      'Arxitektor': ['Revit', 'ArchiCAD', 'BIM', 'V-Ray'],
      'Eksteryer dizayner': ['3ds Max', 'Lumion', 'Photoshop', 'Enscape']
    }
    return skillMap[spec] || ['AutoCAD', 'SketchUp', 'Revit']
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 pb-24 transition-colors duration-300">
      {/* Hero Section with Animated Background */}
      <div className="relative bg-[#0f172a] dark:bg-slate-950 py-24 overflow-hidden transition-colors duration-300">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-bold mb-8 animate-fade-in-up">
            <ShieldCheck className="h-4 w-4" />
            Tasdiqlangan mutaxassislar
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Professional <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Arxitektorlar</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Orzuingizdagi uyni loyihalash va interyerini yaratish uchun eng tajribali mutaxassislarni shu yerdan toping
          </p>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl shadow-2xl p-4 md:p-8 transition-colors duration-300">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Ism yoki yo'nalish bo'yicha qidiruv..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-lg font-medium dark:text-white"
              />
            </div>
            <div className="md:w-72">
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                <select
                  value={filterSpecialization}
                  onChange={(e) => setFilterSpecialization(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none appearance-none transition-all text-lg font-medium cursor-pointer dark:text-white"
                >
                  <option value="">Barcha yo'nalishlar</option>
                  {specializations.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="mt-6 text-slate-500 font-bold tracking-widest uppercase text-sm animate-pulse">Yuklanmoqda...</p>
          </div>
        ) : filteredArchitects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredArchitects.map(arch => (
              <div key={arch.id} className="group relative bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col">
                {/* Image Section */}
                <div className="relative h-72 overflow-hidden">
                  <img
                    src={arch.image || 'https://images.unsplash.com/photo-1581291417007-a3d1209355dc?auto=format&fit=crop&q=80'}
                    alt={arch.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Floating Badges */}
                  <div className="absolute top-4 left-4">
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 border border-white/50 dark:border-white/10">
                      <Zap className="h-3 w-3 text-blue-500 fill-blue-500" />
                      Mashhur
                    </div>
                  </div>
                  
                  <div className="absolute top-4 right-4">
                    <div className="bg-blue-600 text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg border border-blue-500">
                      <Star className="h-4 w-4 fill-white" />
                      <span className="text-sm font-bold">{arch.rating?.toFixed(1) || '5.0'}</span>
                    </div>
                  </div>
                </div>

                {/* Info Section */}
                <div className="p-8 flex-grow">
                  <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-[0.2em] mb-3">
                    <Briefcase className="h-4 w-4" />
                    {arch.specialization}
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">{arch.name}</h3>
                  
                  {/* Skills Tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {getSkills(arch.specialization).map(skill => (
                      <span key={skill} className="px-3 py-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-slate-100 dark:border-slate-700">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-3 mb-8 italic">
                    "{arch.bio || 'Professional arxitektor va dizayner. Ko\'p yillik tajribaga ega mutaxassis.'}"
                  </p>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:border-blue-100 dark:group-hover:border-blue-900/30 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <Award className="h-4 w-4 text-blue-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tajriba</span>
                      </div>
                      <p className="text-lg font-black text-slate-900 dark:text-white">{arch.experience || 5} yil</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20 group-hover:border-purple-100 dark:group-hover:border-purple-900/30 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="h-4 w-4 text-purple-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Loyihalar</span>
                      </div>
                      <p className="text-lg font-black text-slate-900 dark:text-white">{arch.projectsCount || 20}+</p>
                    </div>
                  </div>

                  {/* Star Rating Interactive */}
                  <div className="flex items-center justify-between p-4 bg-slate-900 dark:bg-slate-800 rounded-2xl mb-8">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Baholash</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onMouseEnter={() => setHoverRating({ ...hoverRating, [arch.id]: star })}
                          onMouseLeave={() => setHoverRating({ ...hoverRating, [arch.id]: 0 })}
                          onClick={() => handleRating(arch.id, star)}
                          className="focus:outline-none transition-transform hover:scale-125 active:scale-90"
                        >
                          <Star
                            className={`h-5 w-5 transition-colors ${
                              star <= (hoverRating[arch.id] || arch.rating)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-slate-700 dark:text-slate-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 pt-0 mt-auto">
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => setActiveChat({ id: arch.id, name: arch.name })}
                      className="flex items-center justify-center gap-2 w-full bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl hover:shadow-slate-200 dark:hover:shadow-blue-900/20"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Konsultatsiya
                    </button>
                    <div className="flex gap-3">
                      <a
                        href={`tel:${arch.phone}`}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-xs transition-all shadow-lg hover:shadow-blue-200"
                      >
                        <Phone className="h-3 w-3" />
                        Aloqa
                      </a>
                      <div className="flex-1 flex items-center justify-center gap-2 border-2 border-slate-100 dark:border-slate-800 text-slate-400 py-3 rounded-xl font-bold text-xs cursor-default">
                        <MessageSquare className="h-3 w-3" />
                        Chat orqali
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white dark:bg-slate-900 rounded-[3rem] border-4 border-dashed border-slate-50 dark:border-slate-800">
            <div className="bg-slate-50 dark:bg-slate-800 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-10 w-10 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Arxitektorlar topilmadi</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">Siz qidirgan kriteriyalar bo'yicha mutaxassislar mavjud emas. Iltimos, boshqa shartlarni sinab ko'ring.</p>
          </div>
        )}
      </div>

      {/* Active Chat Modal */}
      {activeChat && (
        <Chat
          sellerId={activeChat.id}
          sellerName={activeChat.name}
          onClose={() => setActiveChat(null)}
        />
      )}
    </div>
  )
}

