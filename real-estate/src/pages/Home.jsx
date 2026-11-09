import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Building2, TrendingUp, Shield, Users, Star, Palette, CheckCircle2, MessageCircle } from 'lucide-react'
import PropertyCard from '../components/PropertyCard'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function Home() {
  const [properties, setProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      const response = await fetch(`${API_URL}/properties`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setProperties(data)
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching properties:', error)
      setIsLoading(false)
    }
  }

  const featuredProperties = properties.slice(0, 3)

  return (
    <div className="bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-slate-900 dark:to-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
              O'zingizga mos uy-joy toping
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 dark:text-blue-200 opacity-90">
              O'zbekistondagi eng katta ko'chmas mulk platformasi
            </p>
            
            {/* Search Box */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 max-w-4xl mx-auto shadow-2xl border border-white/10">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Manzil qidiring..."
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div className="flex-1">
                  <select className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer">
                    <option value="">Xona soni</option>
                    <option value="1">1 xona</option>
                    <option value="2">2 xona</option>
                    <option value="3">3 xona</option>
                    <option value="4">4+ xona</option>
                  </select>
                </div>
                <div className="flex-1">
                  <select className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer">
                    <option value="">Turi</option>
                    <option value="sale">Sotuv</option>
                    <option value="rent">Ijara</option>
                  </select>
                </div>
                <Link 
                  to="/listings"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-xl font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  <Search className="h-5 w-5" />
                  Qidirish
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50 dark:bg-slate-900/50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <div className="text-center group">
              <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-4xl font-black text-gray-900 dark:text-white mb-2">5000+</div>
              <div className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs">E'lonlar</div>
            </div>
            <div className="text-center group">
              <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-4xl font-black text-gray-900 dark:text-white mb-2">10000+</div>
              <div className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs">Foydalanuvchilar</div>
            </div>
            <div className="text-center group">
              <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-4xl font-black text-gray-900 dark:text-white mb-2">98%</div>
              <div className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs">Muvaffaqiyatli savdo</div>
            </div>
            <div className="text-center group">
              <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Star className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-4xl font-black text-gray-900 dark:text-white mb-2">4.9</div>
              <div className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs">Reyting</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="text-left">
              <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">Tanlangan e'lonlar</h2>
              <p className="text-gray-500 dark:text-gray-400 text-lg">Eng yaxshi takliflarimiz bilan tanishing</p>
            </div>
            <Link 
              to="/listings"
              className="text-blue-600 dark:text-blue-400 font-black flex items-center gap-2 hover:gap-4 transition-all group"
            >
              Barchasini ko'rish
              <TrendingUp className="h-5 w-5" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {isLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-gray-100 dark:bg-slate-900 h-96 rounded-3xl animate-pulse"></div>
              ))
            ) : featuredProperties.length > 0 ? (
              featuredProperties.map(property => (
                <PropertyCard key={property.id} property={property} />
              ))
            ) : (
              <div className="col-span-full text-center py-24 bg-gray-50 dark:bg-slate-900 rounded-[3rem] border-4 border-dashed border-gray-100 dark:border-slate-800">
                <p className="text-gray-500 dark:text-gray-400 text-xl font-bold">Hozircha e'lonlar yo'q</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-5 py-2.5 rounded-full text-xs font-black tracking-widest mb-4">
              <CheckCircle2 className="h-4 w-4" />
              ODDIY QADAMLAR
            </div>
            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">Qanday ishlaydi?</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Uyingizni topish yoki sotish endi juda oson</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-1 bg-gradient-to-r from-blue-100 via-blue-500 to-blue-100 dark:from-slate-800 dark:via-blue-600 dark:to-slate-800 z-0"></div>
            
            <div className="relative z-10 text-center">
              <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-full border-8 border-blue-50 dark:border-slate-800 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/10">
                <Search className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-black mb-3 dark:text-white">1. Qidiring</h3>
              <p className="text-gray-500 dark:text-gray-400 font-medium">O'zingizga yoqqan hudud, narx va parametrlar bo'yicha uyni tanlang</p>
            </div>
            
            <div className="relative z-10 text-center">
              <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-full border-8 border-blue-50 dark:border-slate-800 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/10">
                <MessageCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-black mb-3 dark:text-white">2. Bog'laning</h3>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Sotuvchi bilan to'g'ridan-to'g'ri aloqaga chiqing va uchrashuv belgilang</p>
            </div>
            
            <div className="relative z-10 text-center">
              <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-full border-8 border-blue-50 dark:border-slate-800 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/10">
                <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-black mb-3 dark:text-white">3. Kelishuv</h3>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Ishonchli va xavfsiz tarzda hujjatlarni rasmiylashtiring</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-blue-600 dark:bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Mijozlarimiz fikri</h2>
            <p className="text-blue-100 dark:text-gray-400 text-lg">Biz orqali uy topganlarning taassurotlari</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/10 dark:bg-slate-800 backdrop-blur-md p-8 rounded-[2rem] border border-white/20 dark:border-slate-700 hover:-translate-y-2 transition-transform">
              <div className="flex text-yellow-400 mb-6">
                <Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" />
              </div>
              <p className="text-lg leading-relaxed mb-6 font-medium">"Sayt orqali o'zimga kerakli kvartirani atigi 2 kun ichida topdim. Qidiruv filtrlari juda qulay ishlangan!"</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center text-xl font-black">A</div>
                <div>
                  <h4 className="font-bold">Anvar M.</h4>
                  <p className="text-sm text-blue-200 dark:text-gray-400">Toshkent sh.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 dark:bg-slate-800 backdrop-blur-md p-8 rounded-[2rem] border border-white/20 dark:border-slate-700 hover:-translate-y-2 transition-transform">
              <div className="flex text-yellow-400 mb-6">
                <Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" />
              </div>
              <p className="text-lg leading-relaxed mb-6 font-medium">"Uyimni sotish uchun e'lon berdim va tez orada xaridor chiqdi. Barcha jarayon xavfsiz o'tdi."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-400 rounded-full flex items-center justify-center text-xl font-black">M</div>
                <div>
                  <h4 className="font-bold">Malika R.</h4>
                  <p className="text-sm text-blue-200 dark:text-gray-400">Samarqand sh.</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 dark:bg-slate-800 backdrop-blur-md p-8 rounded-[2rem] border border-white/20 dark:border-slate-700 hover:-translate-y-2 transition-transform">
              <div className="flex text-yellow-400 mb-6">
                <Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" />
              </div>
              <p className="text-lg leading-relaxed mb-6 font-medium">"Tizim dizayni juda chiroyli va qulay. Telefonimdan turib bemalol hamma uylarni ko'rib chiqdim."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center text-xl font-black">D</div>
                <div>
                  <h4 className="font-bold">Dilshod A.</h4>
                  <p className="text-sm text-blue-200 dark:text-gray-400">Buxoro sh.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">Nima uchun biz?</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Biz sizga eng yaxshi xizmatni taklif qilamiz</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 text-center hover:-translate-y-2 transition-all duration-300">
              <div className="h-20 w-20 bg-green-100 dark:bg-green-900/30 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <Shield className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-black mb-4 dark:text-white">Xavfsizlik</h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium">Barcha e'lonlar tekshirilgan va ishonchli mutaxassislar tomonidan joylangan</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 text-center hover:-translate-y-2 transition-all duration-300">
              <div className="h-20 w-20 bg-blue-100 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <TrendingUp className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-black mb-4 dark:text-white">Tezkor savdo</h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium">Ko'chmas mulkingizni qisqa vaqtda eng yaxshi bozor narxida sotish imkoniyati</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 text-center hover:-translate-y-2 transition-all duration-300">
              <div className="h-20 w-20 bg-purple-100 dark:bg-purple-900/30 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <Users className="h-10 w-10 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-2xl font-black mb-4 dark:text-white">Qo'llab-quvvatlash</h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium">Mutaxassislarimiz sizga 24/7 davomida har qanday savol bo'yicha yordam berishadi</p>
            </div>
          </div>
        </div>
      </section>

      {/* Architect Service Promo */}
      <section className="py-24 bg-white dark:bg-slate-950 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-50 dark:bg-slate-900/80 rounded-[3rem] overflow-hidden shadow-sm flex flex-col lg:flex-row items-center border border-blue-100/50 dark:border-blue-900/20">
            <div className="p-10 lg:p-20 flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-5 py-2.5 rounded-full text-xs font-black tracking-widest mb-8">
                <Palette className="h-4 w-4" />
                YANGI XIZMAT
              </div>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-8 leading-[1.1]">
                Orzuingizdagi uyni <br />
                <span className="text-blue-600 dark:text-blue-400">professional arxitektorlar</span> bilan birga loyihalang!
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-xl mb-12 leading-relaxed font-medium">
                Bizning platformamizda eng malakali arxitektorlarni topishingiz va uyingiz loyihasini noldan boshlab buyurtma qilishingiz mumkin.
              </p>
              <Link 
                to="/architects" 
                className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-[1.5rem] font-black text-lg transition-all shadow-xl shadow-blue-500/20 active:scale-95"
              >
                Mutaxassis topish
              </Link>
            </div>
            <div className="flex-1 w-full lg:h-[600px] p-6 lg:p-0">
              <img 
                src="https://images.unsplash.com/photo-1503387762-592dea58ef23?w=800" 
                alt="Architect working" 
                className="w-full h-full object-cover lg:rounded-none rounded-[2rem] shadow-2xl lg:shadow-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-blue-600 dark:bg-blue-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
            O'zingizning mulkingizni sotmoqchimisiz?
          </h2>
          <p className="text-blue-100 dark:text-blue-200 text-xl mb-12 font-medium opacity-90 max-w-2xl mx-auto">
            Bizning platforma orqali minglab xaridorlarga ega bo'ling. Tezkor va xavfsiz sotuvni ta'minlaymiz.
          </p>
          <Link 
            to="/contact"
            className="inline-block bg-white hover:bg-gray-50 text-blue-600 px-12 py-5 rounded-[1.5rem] font-black text-lg transition-all shadow-2xl active:scale-95"
          >
            Biz bilan bog'laning
          </Link>
        </div>
      </section>
    </div>
  )
}
