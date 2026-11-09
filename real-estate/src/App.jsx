import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Listings from './pages/Listings'
import PropertyDetail from './pages/PropertyDetail'
import Contact from './pages/Contact'
import About from './pages/About'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AddProperty from './pages/AddProperty'
import AdminLogin from './pages/AdminLogin'
import SuperAdminLogin from './pages/SuperAdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import ConstructionMaterials from './pages/ConstructionMaterials'
import Architects from './pages/Architects'
import Calculator from './pages/Calculator'
import ProtectedRoute from './components/ProtectedRoute'
import SellerRoute from './components/SellerRoute'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/listings" element={<Listings />} />
                <Route path="/property/:id" element={<PropertyDetail />} />
                <Route path="/construction-materials" element={<ConstructionMaterials />} />
                <Route path="/architects" element={<Architects />} />
                <Route path="/calculator" element={<Calculator />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/about" element={<About />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/super-admin-login" element={<SuperAdminLogin />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/add-property" element={
                  <ProtectedRoute>
                    <SellerRoute>
                      <AddProperty />
                    </SellerRoute>
                  </ProtectedRoute>
                } />
                <Route path="*" element={
                  <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
                    <h1 className="text-6xl font-black text-gray-200 mb-4">404</h1>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Sahifa topilmadi</h2>
                    <p className="text-gray-600 mb-8">Siz qidirayotgan sahifa mavjud emas yoki o'chirib tashlangan.</p>
                    <a href="/" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">Bosh sahifaga qaytish</a>
                  </div>
                } />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
