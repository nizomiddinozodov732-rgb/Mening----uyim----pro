import { Phone, Mail, MapPin, Building2, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-white mt-auto border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
          <div className="col-span-1 sm:col-span-2 md:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight">House Shop</span>
            </div>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              O'zbekistondagi eng yaxshi ko'chmas mulk platformasi. 
              Siz uchun eng qulay va ishonchli uy-joy savdosini tashkil etamiz.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 mb-6">Tezkor havolalar</h3>
            <ul className="space-y-4 text-slate-400 font-bold">
              <li><Link to="/" className="hover:text-blue-400 transition-colors">Bosh sahifa</Link></li>
              <li><Link to="/listings" className="hover:text-blue-400 transition-colors">E'lonlar</Link></li>
              <li><Link to="/about" className="hover:text-blue-400 transition-colors">Biz haqimizda</Link></li>
              <li><Link to="/contact" className="hover:text-blue-400 transition-colors">Aloqa</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 mb-6">Aloqa</h3>
            <ul className="space-y-4 text-slate-400 font-bold">
              <li className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-blue-500/50" />
                <span>+998 90 123 45 67</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-blue-500/50" />
                <span>info@uyjoysavdosi.uz</span>
              </li>
              <li className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-blue-500/50" />
                <span>Toshkent, O'zbekiston</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-16 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-500 text-sm font-medium">&copy; 2024 Uy-Joy Savdosi. Barcha huquqlar himoyalangan.</p>
            <div className="flex gap-4">
              <Link 
                to="/admin-login"
                className="flex items-center gap-2 text-slate-600 hover:text-slate-400 transition-colors text-sm font-bold uppercase tracking-widest"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
              <Link 
                to="/super-admin-login"
                className="flex items-center gap-2 text-slate-600 hover:text-slate-400 transition-colors text-sm font-bold uppercase tracking-widest"
              >
                <Shield className="h-4 w-4" />
                Super Admin
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
