import { Link } from 'react-router-dom'
import { Home, Building2, Phone, Menu, X, LogIn, LogOut, User, Plus, Hammer, Palette, Sun, Moon, Calculator } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-blue-600 p-1.5 rounded-xl group-hover:rotate-6 transition-transform duration-300">
              <Building2 className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
              House Shop
            </span>
          </Link>

          <nav className="hidden lg:flex space-x-1 items-center">
            <Link to="/" className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-all rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800">Bosh sahifa</Link>
            <Link to="/listings" className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-all rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800">E'lonlar</Link>
            <Link to="/construction-materials" className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-all rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center gap-1.5">
              <Hammer className="h-4 w-4" />
              <span>Materiallar</span>
            </Link>
            <Link to="/architects" className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-all rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center gap-1.5">
              <Palette className="h-4 w-4" />
              <span>Arxitektorlar</span>
            </Link>
            <Link to="/calculator" className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-all rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center gap-1.5">
              <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Kalkulyator</span>
            </Link>
            <Link to="/about" className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-all rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800">Biz haqimizda</Link>

            <div className="h-6 w-[1px] bg-gray-200 dark:bg-slate-700 mx-2"></div>

            <button
              onClick={toggleTheme}
              className="p-2.5 text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 mr-2"
              title={isDarkMode ? "Kunduzgi rejim" : "Tungi rejim"}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all font-semibold">
                  <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span>{user.name.split(' ')[0]}</span>
                </Link>
                {user.role === 'seller' && (
                  <Link to="/add-property" className="bg-gray-900 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all font-bold flex items-center gap-2 shadow-sm hover:shadow-blue-200">
                    <Plus className="h-4 w-4" />
                    <span>E'lon qo'shish</span>
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="p-2.5 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="Chiqish"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="px-5 py-2.5 text-gray-600 dark:text-slate-300 font-bold hover:text-blue-600 dark:hover:text-blue-400 transition-all">
                  Kirish
                </Link>
                <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl transition-all font-bold shadow-md hover:shadow-lg active:scale-95">
                  Ro'yxatdan o'tish
                </Link>
              </div>
            )}
          </nav>

          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={toggleTheme}
              className="p-2.5 text-gray-500 dark:text-slate-400 hover:text-blue-600 transition-all rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800"
            >
              {isDarkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
            </button>
            <button
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all text-gray-600 dark:text-slate-300"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="lg:hidden absolute left-0 right-0 top-[65px] sm:top-[81px] bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 shadow-xl py-6 px-4 space-y-2 animate-in slide-in-from-top duration-300 z-50">
            <Link to="/" className="block p-4 text-gray-600 dark:text-slate-300 font-bold hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 rounded-2xl" onClick={() => setIsOpen(false)}>
              Bosh sahifa
            </Link>
            <Link to="/listings" className="block p-4 text-gray-600 dark:text-slate-300 font-bold hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 rounded-2xl" onClick={() => setIsOpen(false)}>
              E'lonlar
            </Link>
            <Link to="/construction-materials" className="block p-4 text-gray-600 dark:text-slate-300 font-bold hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 rounded-2xl" onClick={() => setIsOpen(false)}>
              Qurilish materiallari
            </Link>
            <Link to="/architects" className="block p-4 text-gray-600 dark:text-slate-300 font-bold hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 rounded-2xl flex items-center gap-2" onClick={() => setIsOpen(false)}>
              <Palette className="h-5 w-5" />
              Arxitektorlar
            </Link>
            <Link to="/calculator" className="block p-4 text-gray-600 dark:text-slate-300 font-bold hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 rounded-2xl flex items-center gap-2" onClick={() => setIsOpen(false)}>
              <Calculator className="h-5 w-5 text-blue-600" />
              Smeta Kalkulyatori
            </Link>
            <Link to="/about" className="block p-4 text-gray-600 dark:text-slate-300 font-bold hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 rounded-2xl" onClick={() => setIsOpen(false)}>
              Biz haqimizda
            </Link>

            <div className="border-t border-gray-100 dark:border-slate-800 my-4 pt-4">
              {user ? (
                <div className="space-y-2">
                  <Link to="/dashboard" className="flex items-center gap-3 p-4 text-gray-900 dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-slate-800 rounded-2xl" onClick={() => setIsOpen(false)}>
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    {user.name}
                  </Link>
                  {user.role === 'seller' && (
                    <Link to="/add-property" className="flex items-center gap-3 p-4 bg-gray-900 dark:bg-blue-600 text-white font-bold rounded-2xl" onClick={() => setIsOpen(false)}>
                      <Plus className="h-5 w-5" />
                      E'lon qo'shish
                    </Link>
                  )}
                  <button
                    onClick={() => { logout(); setIsOpen(false); }}
                    className="flex items-center gap-3 p-4 text-red-600 font-bold w-full hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl"
                  >
                    <LogOut className="h-5 w-5" />
                    Chiqish
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/login" className="p-4 text-center text-gray-600 dark:text-slate-300 font-bold border border-gray-200 dark:border-slate-700 rounded-2xl" onClick={() => setIsOpen(false)}>
                    Kirish
                  </Link>
                  <Link to="/register" className="p-4 text-center bg-blue-600 text-white font-bold rounded-2xl shadow-sm" onClick={() => setIsOpen(false)}>
                    A'zo bo'lish
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

