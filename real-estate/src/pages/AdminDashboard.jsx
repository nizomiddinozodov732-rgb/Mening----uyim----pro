import { Link } from 'react-router-dom'
import { Users, Home, TrendingUp, Shield, LogOut, Settings, BarChart3, DollarSign, X, Star, AlertCircle, Building2, Palette, CreditCard, Plus, Trash2, Edit2, CheckCircle, XCircle, Search, MessageSquare, History, Check, ShieldAlert, Download, FileSpreadsheet, DatabaseBackup, FileText } from 'lucide-react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function AdminDashboard() {
  const { admin, adminLogout } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({ properties: 0, users: 0, sellers: 0, revenue: 0, stores: 0, architects: 0 })
  const [properties, setProperties] = useState([])
  const [users, setUsers] = useState([])
  const [stores, setStores] = useState([])
  const [architects, setArchitects] = useState([])
  const [payments, setPayments] = useState([])
  const [messages, setMessages] = useState([])
  const [logs, setLogs] = useState([])
  const [managers, setManagers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('') // 'store' or 'architect'
  const [currentEditItem, setCurrentEditEditItem] = useState(null)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState([])
  
  const [settings, setSettings] = useState({
    siteName: 'House Shop',
    contactEmail: 'info@houseshop.uz',
    phoneNumber: '+998 90 123 45 67',
    moderationMode: true,
    adsEnabled: true,
    registrationEnabled: true
  })

  useEffect(() => {
    fetchAdminData()
    fetchSettings()
  }, [])

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      if (!token) return;
      const headers = { 'Authorization': `Bearer ${token}` }
      
      const endpoints = [
        { key: 'stats', url: '/admin/stats' },
        { key: 'properties', url: '/admin/properties' },
        { key: 'users', url: '/admin/users' },
        { key: 'stores', url: '/admin/stores' },
        { key: 'architects', url: '/admin/architects' },
        { key: 'payments', url: '/admin/payments' },
        { key: 'messages', url: '/admin/messages' },
        { key: 'logs', url: '/admin/logs' }
      ]

      if (admin?.role === 'super_admin') {
        endpoints.push({ key: 'managers', url: '/admin/managers' })
      }

      const results = await Promise.allSettled(
        endpoints.map(e => fetch(`${API_URL}${e.url}`, { headers }).then(r => r.ok ? r.json() : Promise.reject(r.status)))
      )

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const key = endpoints[index].key
          const data = result.value
          if (key === 'stats') setStats(data)
          if (key === 'properties') setProperties(Array.isArray(data) ? data : [])
          if (key === 'users') setUsers(Array.isArray(data) ? data : [])
          if (key === 'stores') setStores(Array.isArray(data) ? data : [])
          if (key === 'architects') setArchitects(Array.isArray(data) ? data : [])
          if (key === 'payments') setPayments(Array.isArray(data) ? data : [])
          if (key === 'messages') setMessages(Array.isArray(data) ? data : [])
          if (key === 'logs') setLogs(Array.isArray(data) ? data : [])
          if (key === 'managers') setManagers(Array.isArray(data) ? data : [])
        } else {
          console.error(`Failed to fetch ${endpoints[index].key}:`, result.reason)
        }
      })

      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching admin data:', error)
      setIsLoading(false)
    }
  }

  const handlePropertyStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${API_URL}/admin/properties/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })
      if (res.ok) fetchAdminData()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const deleteProperty = async (id) => {
    if (!window.confirm('Haqiqatdan ham o\'chirmoqchimisiz?')) return
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${API_URL}/admin/properties/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) fetchAdminData()
    } catch (error) {
      console.error('Error deleting property:', error)
    }
  }

  const handleUserStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${API_URL}/admin/users/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })
      if (res.ok) fetchAdminData()
    } catch (error) {
      console.error('Error updating user status:', error)
    }
  }

  const handleUserRole = async (id, role) => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${API_URL}/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role })
      })
      if (res.ok) fetchAdminData()
    } catch (error) {
      console.error('Error updating role:', error)
    }
  }

  const handleMessageStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${API_URL}/admin/messages/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })
      if (res.ok) fetchAdminData()
    } catch (error) {
      console.error('Error updating message status:', error)
    }
  }

  const deleteMessage = async (id) => {
    if (!window.confirm('Xabar o\'chirilsinmi?')) return
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${API_URL}/admin/messages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) fetchAdminData()
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  const handleBulkStatus = async (status) => {
    if (selectedItems.length === 0) return
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${API_URL}/admin/properties/bulk-status`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: selectedItems, status })
      })
      if (res.ok) {
        setSelectedItems([])
        fetchAdminData()
      }
    } catch (error) {
      console.error('Error bulk updating:', error)
    }
  }

  const addManager = async (e) => {
    e.preventDefault()
    const form = e.target
    const username = form.username.value
    const password = form.password.value

    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${API_URL}/admin/managers`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })
      if (res.ok) {
        form.reset()
        fetchAdminData()
      } else {
        const data = await res.json()
        alert(data.error || 'Xatolik')
      }
    } catch (error) {
      console.error('Error adding manager:', error)
    }
  }

  const deleteManager = async (id) => {
    if (!window.confirm('Bu adminni o\'chirishga ishonchingiz komilmi?')) return
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${API_URL}/admin/managers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) fetchAdminData()
    } catch (error) {
      console.error('Error deleting manager:', error)
    }
  }

  const handleDangerZoneAction = async (type) => {
    const messages = {
      'properties': 'Barcha e\'lonlarni o\'chirishga ishonchingiz komilmi? Bu amalni ortga qaytarib bo\'lmaydi!',
      'users': 'Barcha foydalanuvchilarni o\'chirishga ishonchingiz komilmi? Bu amalni ortga qaytarib bo\'lmaydi!',
      'stores': 'Barcha do\'konlarni o\'chirishga ishonchingiz komilmi? Bu amalni ortga qaytarib bo\'lmaydi!',
      'messages': 'Barcha xabarlarni o\'chirishga ishonchingiz komilmi?'
    }

    if (!window.confirm(messages[type])) return
    if (window.prompt('Tasdiqlash uchun "UCHIRISH" deb yozing:') !== 'UCHIRISH') return

    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${API_URL}/admin/all-${type}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        alert('Muvaffaqiyatli o\'chirildi')
        fetchAdminData()
      }
    } catch (error) {
      console.error(`Error deleting all ${type}:`, error)
    }
  }

  const deleteUser = async (id) => {
    if (!window.confirm('Haqiqatdan ham ushbu foydalanuvchini o\'chirmoqchimisiz?')) return
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${API_URL}/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) fetchAdminData()
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/settings`)
      const data = await res.json()
      setSettings(data)
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const saveSettings = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      })
      if (res.ok) {
        alert('Sozlamalar saqlandi!')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const deleteAllProperties = async () => {
    if (!window.confirm('Haqiqatdan ham barcha e\'lonlarni o\'chirmoqchimisiz? Bu amal qaytarilmaydi!')) return
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${API_URL}/admin/all-properties`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        alert('Barcha e\'lonlar o\'chirildi')
        fetchAdminData()
      }
    } catch (error) {
      console.error('Error deleting all properties:', error)
    }
  }

  const deleteAllUsers = async () => {
    if (!window.confirm('Haqiqatdan ham barcha foydalanuvchilarni o\'chirmoqchimisiz? Bu amal qaytarilmaydi!')) return
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`${API_URL}/admin/all-users`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        alert('Barcha foydalanuvchilar o\'chirildi')
        fetchAdminData()
      }
    } catch (error) {
      console.error('Error deleting all users:', error)
    }
  }

  const handleLogout = () => {
    adminLogout()
    window.location.href = '/'
  }

  const filteredProperties = (properties || []).filter(p => 
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sellerName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredUsers = (users || []).filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone?.includes(searchTerm)
  )

  const exportPropertiesToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(properties.map(p => ({
      ID: p.id,
      Sarlavha: p.title,
      Manzil: p.location,
      Narx: p.price,
      Xonalar: p.rooms,
      Maydon: p.area,
      Sotuvchi: p.sellerName,
      Telefon: p.sellerPhone,
      Holati: p.status,
      Premium: p.isPremium ? 'Ha' : 'Yoq',
      Sana: new Date(p.createdAt).toLocaleDateString()
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "E'lonlar")
    XLSX.writeFile(wb, `Elonlar_Royxati_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const exportUsersToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(users.map(u => ({
      ID: u.id,
      Ism: u.name,
      Email: u.email,
      Telefon: u.phone,
      Roli: u.role,
      Premium: u.isPremium ? 'Ha' : 'Yoq',
      Holati: u.status,
      Sana: new Date(u.createdAt).toLocaleDateString()
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Foydalanuvchilar")
    XLSX.writeFile(wb, `Foydalanuvchilar_Royxati_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const exportPropertiesToPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.text("E'lonlar Ro'yxati", 105, 20, { align: 'center' })
    
    let y = 40
    properties.forEach((property, index) => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }
      
      doc.setFontSize(12)
      doc.text(`${index + 1}. ${property.title}`, 20, y)
      y += 7
      doc.setFontSize(10)
      doc.text(`Manzil: ${property.location}`, 20, y)
      y += 6
      doc.text(`Narx: ${property.price.toLocaleString()} so'm`, 20, y)
      y += 6
      doc.text(`Turi: ${property.type}`, 20, y)
      y += 6
      if (property.bedrooms) {
        doc.text(`Xonalar: ${property.bedrooms}`, 20, y)
        y += 6
      }
      if (property.area) {
        doc.text(`Maydon: ${property.area} m²`, 20, y)
        y += 6
      }
      y += 10
    })
    
    doc.save(`Elonlar_Royxati_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const exportUsersToPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.text("Foydalanuvchilar Ro'yxati", 105, 20, { align: 'center' })
    
    let y = 40
    users.forEach((user, index) => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }
      
      doc.setFontSize(12)
      doc.text(`${index + 1}. ${user.name}`, 20, y)
      y += 7
      doc.setFontSize(10)
      doc.text(`Email: ${user.email}`, 20, y)
      y += 6
      doc.text(`Telefon: ${user.phone}`, 20, y)
      y += 6
      doc.text(`Roli: ${user.role}`, 20, y)
      y += 6
      doc.text(`Premium: ${user.isPremium ? 'Ha' : 'Yoq'}`, 20, y)
      y += 6
      doc.text(`Holati: ${user.status || 'active'}`, 20, y)
      y += 10
    })
    
    doc.save(`Foydalanuvchilar_Royxati_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const downloadBackup = () => {
    const token = localStorage.getItem('adminToken')
    fetch(`${API_URL}/admin/backup`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) throw new Error('Yuklashda xatolik')
      return res.blob()
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `database_backup_${new Date().toISOString().split('T')[0]}.sqlite`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    })
    .catch(err => alert(err.message))
  }

  // Dummy chart data for demonstration
  const chartData = [
    { name: 'Dush', elonlar: 12, foydalanuvchilar: 5 },
    { name: 'Sesh', elonlar: 19, foydalanuvchilar: 8 },
    { name: 'Chor', elonlar: 15, foydalanuvchilar: 12 },
    { name: 'Pay', elonlar: 22, foydalanuvchilar: 15 },
    { name: 'Juma', elonlar: 30, foydalanuvchilar: 20 },
    { name: 'Shan', elonlar: 25, foydalanuvchilar: 18 },
    { name: 'Yak', elonlar: 35, foydalanuvchilar: 25 },
  ]

  const filteredMessages = (messages || []).filter(m =>
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.message?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 bg-gray-900 text-white min-h-screen">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <Shield className="h-8 w-8 text-blue-500" />
            <span className="text-xl font-black">HOUSE SHOP</span>
          </div>
          
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
            >
              <BarChart3 className="h-5 w-5" /> Umumiy
            </button>
            <button 
              onClick={() => setActiveTab('properties')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'properties' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
            >
              <Home className="h-5 w-5" /> E'lonlar
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
            >
              <Users className="h-5 w-5" /> Foydalanuvchilar
            </button>
            <button 
              onClick={() => setActiveTab('stores')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'stores' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
            >
              <Building2 className="h-5 w-5" /> Do'konlar
            </button>
            <button 
              onClick={() => setActiveTab('architects')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'architects' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
            >
              <Palette className="h-5 w-5" /> Arxitektorlar
            </button>
            <button 
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'payments' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
            >
              <CreditCard className="h-5 w-5" /> To'lovlar
            </button>
            <button 
              onClick={() => setActiveTab('messages')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'messages' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
            >
              <MessageSquare className="h-5 w-5" /> Xabarlar {messages.filter(m => m.status === 'unread').length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{messages.filter(m => m.status === 'unread').length}</span>}
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'logs' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
            >
              <History className="h-5 w-5" /> Loglar
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
            >
              <Settings className="h-5 w-5" /> Sozlamalar
            </button>
            {admin?.role === 'super_admin' && (
              <button 
                onClick={() => setActiveTab('super_admin')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'super_admin' ? 'bg-red-600' : 'hover:bg-gray-800 text-red-400 hover:text-red-300'}`}
              >
                <ShieldAlert className="h-5 w-5" /> Super Admin
              </button>
            )}
          </nav>
        </div>
        
        <div className="mt-auto p-6 border-t border-gray-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-900/20 transition-all">
            <LogOut className="h-5 w-5" /> Chiqish
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900">
              {activeTab === 'overview' && 'Boshqaruv Paneli'}
              {activeTab === 'properties' && 'E\'lonlar Moderatsiyasi'}
              {activeTab === 'users' && 'Foydalanuvchilar Boshqaruvi'}
              {activeTab === 'stores' && 'Do\'konlar Boshqaruvi'}
              {activeTab === 'messages' && 'Xabarlar'}
              {activeTab === 'logs' && 'Tizim Loglari'}
              {activeTab === 'settings' && 'Sozlamalar'}
              {activeTab === 'super_admin' && 'Super Admin Paneli'}
            </h2>
            <p className="text-gray-500 font-medium uppercase text-xs tracking-widest mt-1">
              Admin: {admin?.username} {admin?.role === 'super_admin' && <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[10px]">SUPER ADMIN</span>}
            </p>
          </div>

          {['properties', 'users', 'messages', 'stores', 'architects'].includes(activeTab) && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Qidiruv..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
          )}
        </div>

        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                  <Home className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Jami E'lonlar</p>
                <p className="text-3xl font-black text-gray-900">{stats.properties}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="bg-green-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">A'zolar</p>
                <p className="text-3xl font-black text-gray-900">{stats.users}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="bg-purple-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Sotuvchilar</p>
                <p className="text-3xl font-black text-gray-900">{stats.sellers}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="bg-yellow-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                </div>
                <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Jami Tushum</p>
                <p className="text-3xl font-black text-gray-900">{(stats.revenue || 0).toLocaleString()} <span className="text-sm">so'm</span></p>
              </div>
            </div>

            {/* Analytics Chart */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-10">
              <h3 className="font-black text-gray-900 uppercase text-sm tracking-widest mb-6">Haftalik O'sish Dinamikasi</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorElon" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorFoyd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="elonlar" name="Yangi e'lonlar" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorElon)" />
                    <Area type="monotone" dataKey="foydalanuvchilar" name="Yangi a'zolar" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorFoyd)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-gray-900 uppercase text-sm tracking-widest">Xizmatlar statistikasi</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <span className="font-bold text-gray-700">Qurilish Do'konlari</span>
                    </div>
                    <span className="text-xl font-black text-blue-600">{stats.stores}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Palette className="h-5 w-5 text-purple-600" />
                      <span className="font-bold text-gray-700">Professional Arxitektorlar</span>
                    </div>
                    <span className="text-xl font-black text-purple-600">{stats.architects}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-gray-900 uppercase text-sm tracking-widest">Oxirgi To'lovlar</h3>
                  <button onClick={() => setActiveTab('payments')} className="text-blue-600 text-xs font-bold uppercase">Hammasi</button>
                </div>
                <div className="space-y-3">
                  {payments.slice(0, 4).map(pay => (
                    <div key={pay.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg text-green-600">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{pay.userName}</p>
                          <p className="text-[10px] text-gray-500">{new Date(pay.paymentDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className="text-sm font-black text-blue-600">+{pay.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-black text-gray-900 uppercase tracking-tight">Oxirgi qo'shilganlar</h3>
                <button onClick={() => setActiveTab('properties')} className="text-blue-600 font-bold text-sm">Hammasini ko'rish</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-black">
                    <tr>
                      <th className="px-6 py-4">Mulk</th>
                      <th className="px-6 py-4">Sotuvchi</th>
                      <th className="px-6 py-4">Narx</th>
                      <th className="px-6 py-4">Holat</th>
                      <th className="px-6 py-4">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {properties.slice(0, 5).map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{p.title}</div>
                          <div className="text-xs text-gray-500">{p.location}</div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-700">{p.sellerName || 'Noma\'lum'}</td>
                        <td className="px-6 py-4 font-black text-blue-600">{p.price.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          <button onClick={() => handlePropertyStatus(p.id, 'active')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">Tasdiqlash</button>
                          <button onClick={() => deleteProperty(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">O'chirish</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'properties' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center gap-4">
              <h3 className="text-xl font-black text-gray-900">Barcha E'lonlar</h3>
              <div className="flex gap-2">
                <button 
                  onClick={exportPropertiesToPDF}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm"
                >
                  <FileText className="h-5 w-5" /> PDFga yuklash
                </button>
                <button 
                  onClick={exportPropertiesToExcel}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm"
                >
                  <FileSpreadsheet className="h-5 w-5" /> Excelga yuklash
                </button>
              </div>
            </div>
            {selectedItems.length > 0 && (
              <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-4">
                <span className="font-bold">{selectedItems.length} ta element tanlandi</span>
                <div className="flex gap-2">
                  <button onClick={() => handleBulkStatus('active')} className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1"><Check className="h-4 w-4" /> Tasdiqlash</button>
                  <button onClick={() => handleBulkStatus('blocked')} className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1"><X className="h-4 w-4" /> Bloklash</button>
                  <button onClick={() => setSelectedItems([])} className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg text-sm font-bold">Bekor qilish</button>
                </div>
              </div>
            )}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-black">
                    <tr>
                      <th className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          onChange={(e) => setSelectedItems(e.target.checked ? filteredProperties.map(p => p.id) : [])}
                          checked={selectedItems.length === filteredProperties.length && filteredProperties.length > 0}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-6 py-4">Mulk Ma'lumotlari</th>
                      <th className="px-6 py-4">Parametrlar</th>
                      <th className="px-6 py-4">Sotuvchi</th>
                      <th className="px-6 py-4">Holat</th>
                      <th className="px-6 py-4">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredProperties.map(p => (
                      <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${selectedItems.includes(p.id) ? 'bg-blue-50/50' : ''}`}>
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            checked={selectedItems.includes(p.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedItems([...selectedItems, p.id])
                              else setSelectedItems(selectedItems.filter(id => id !== p.id))
                            }}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{p.title}</div>
                          <div className="text-xs text-gray-500">{p.location}</div>
                          <div className="text-xs font-black text-blue-600 mt-1">{p.price.toLocaleString()} so'm</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-medium text-gray-600">{p.area} m² | {p.bedrooms} xona</div>
                          <div className="text-xs text-gray-400 capitalize">{p.type}</div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-700">{p.sellerName}</td>
                        <td className="px-6 py-4">
                          <select 
                            value={p.status} 
                            onChange={(e) => handlePropertyStatus(p.id, e.target.value)}
                            className="text-[10px] font-bold uppercase tracking-wider bg-gray-50 border-none rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="pending">Kutish</option>
                            <option value="active">Tasdiqlangan</option>
                            <option value="blocked">Bloklangan</option>
                            <option value="sold">Sotilgan</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <button onClick={() => deleteProperty(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><X className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center gap-4">
              <h3 className="text-xl font-black text-gray-900">Foydalanuvchilar Ro'yxati</h3>
              <div className="flex gap-2">
                <button 
                  onClick={exportUsersToPDF}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm"
                >
                  <FileText className="h-5 w-5" /> PDFga yuklash
                </button>
                <button 
                  onClick={exportUsersToExcel}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm"
                >
                  <FileSpreadsheet className="h-5 w-5" /> Excelga yuklash
                </button>
              </div>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-black">
                  <tr>
                    <th className="px-6 py-4">Foydalanuvchi</th>
                    <th className="px-6 py-4">Kontakt</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Premium</th>
                    <th className="px-6 py-4">Holat</th>
                    <th className="px-6 py-4">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{u.name}</td>
                      <td className="px-6 py-4 text-xs font-medium text-gray-600">
                        <div>{u.email}</div>
                        <div>{u.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          value={u.role} 
                          onChange={(e) => handleUserRole(u.id, e.target.value)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border-none ${
                            u.role === 'seller' ? 'bg-purple-100 text-purple-700' : u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          <option value="customer">Customer</option>
                          <option value="seller">Seller</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        {u.isPremium ? (
                          <span className="text-yellow-600 font-bold text-xs flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-600" /> Premium</span>
                        ) : (
                          <span className="text-gray-300 text-xs">Standart</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          value={u.status || 'active'} 
                          onChange={(e) => handleUserStatus(u.id, e.target.value)}
                          className="text-[10px] font-bold uppercase tracking-wider bg-gray-50 border-none rounded-lg px-2 py-1"
                        >
                          <option value="active">Faol</option>
                          <option value="blocked">Bloklangan</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => deleteUser(u.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><X className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          </div>
        )}

        {activeTab === 'stores' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-900">Do'konlar Ro'yxati</h3>
              <button 
                onClick={() => { setModalType('store'); setCurrentEditEditItem(null); setShowModal(true); }}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all"
              >
                <Plus className="h-5 w-5" /> Do'kon qo'shish
              </button>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-black">
                  <tr>
                    <th className="px-6 py-4">Do'kon</th>
                    <th className="px-6 py-4">Kategoriya</th>
                    <th className="px-6 py-4">Manzil</th>
                    <th className="px-6 py-4">Reyting</th>
                    <th className="px-6 py-4">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stores.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img src={s.image} alt={s.name} className="w-10 h-10 rounded-lg object-cover" />
                        <span className="font-bold text-gray-900">{s.name}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{s.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{s.location}</td>
                      <td className="px-6 py-4 text-sm font-bold text-yellow-600 flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-600" /> {s.rating?.toFixed(1)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => { setModalType('store'); setCurrentEditEditItem(s); setShowModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => { if(window.confirm('O\'chirilsinmi?')) deleteStore(s.id) }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-black">
                  <tr>
                    <th className="px-6 py-4">Yuboruvchi</th>
                    <th className="px-6 py-4">Xabar</th>
                    <th className="px-6 py-4">Sana</th>
                    <th className="px-6 py-4">Holat</th>
                    <th className="px-6 py-4">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredMessages.map(m => (
                    <tr key={m.id} className={`hover:bg-gray-50 transition-colors ${m.status === 'unread' ? 'bg-blue-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{m.name}</div>
                        <div className="text-xs text-gray-500">{m.email}</div>
                        <div className="text-xs text-gray-500">{m.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700 line-clamp-2 max-w-md">{m.message}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {new Date(m.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          value={m.status} 
                          onChange={(e) => handleMessageStatus(m.id, e.target.value)}
                          className={`text-[10px] font-bold uppercase tracking-wider border-none rounded-lg px-2 py-1 ${
                            m.status === 'unread' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                          }`}
                        >
                          <option value="unread">O'qilmagan</option>
                          <option value="read">O'qilgan</option>
                          <option value="replied">Javob berilgan</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <button onClick={() => deleteMessage(m.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-black">
                  <tr>
                    <th className="px-6 py-4">Admin</th>
                    <th className="px-6 py-4">Harakat</th>
                    <th className="px-6 py-4">Tafsilotlar</th>
                    <th className="px-6 py-4">Sana</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold text-gray-900">{log.adminName}</td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">
                        {log.details}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'architects' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-900">Arxitektorlar Ro'yxati</h3>
              <button 
                onClick={() => { setModalType('architect'); setCurrentEditEditItem(null); setShowModal(true); }}
                className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-700 transition-all"
              >
                <Plus className="h-5 w-5" /> Arxitektor qo'shish
              </button>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-black">
                  <tr>
                    <th className="px-6 py-4">Mutaxassis</th>
                    <th className="px-6 py-4">Yo'nalish</th>
                    <th className="px-6 py-4">Tajriba</th>
                    <th className="px-6 py-4">Loyihalar</th>
                    <th className="px-6 py-4">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {architects.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img src={a.image} alt={a.name} className="w-10 h-10 rounded-lg object-cover" />
                        <div>
                          <p className="font-bold text-gray-900">{a.name}</p>
                          <p className="text-[10px] text-gray-400">{a.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{a.specialization}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{a.experience} yil</td>
                      <td className="px-6 py-4 text-sm font-bold text-blue-600">{a.projectsCount || 0} ta</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => { setModalType('architect'); setCurrentEditEditItem(a); setShowModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => { if(window.confirm('O\'chirilsinmi?')) deleteArchitect(a.id) }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Site Settings */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                Sayt Sozlamalari
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sayt nomi</label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kontakt email</label>
                  <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefon raqam</label>
                  <input
                    type="tel"
                    value={settings.phoneNumber}
                    onChange={(e) => setSettings({...settings, phoneNumber: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button onClick={saveSettings} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition">
                  Saqlash
                </button>
              </div>
            </div>

            {/* Admin Settings */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Admin Sozlamalari
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">Moderatsiya rejimi</p>
                    <p className="text-sm text-gray-500">E'lonlarni avtomatik tasdiqlash</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.moderationMode}
                      onChange={(e) => setSettings({...settings, moderationMode: e.target.checked})}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">Reklama moduli</p>
                    <p className="text-sm text-gray-500">Reklama bannerlarini ko'rsatish</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.adsEnabled}
                      onChange={(e) => setSettings({...settings, adsEnabled: e.target.checked})}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">Foydalanuvchi ro'yxatdan o'tish</p>
                    <p className="text-sm text-gray-500">Yangi foydalanuvchilarga ruxsat berish</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.registrationEnabled}
                      onChange={(e) => setSettings({...settings, registrationEnabled: e.target.checked})}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'super_admin' && admin?.role === 'super_admin' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <ShieldAlert className="h-6 w-6 text-red-600" />
                Super Admin Boshqaruvi
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Admin Management */}
              <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Adminlarni boshqarish</h4>
                
                <form onSubmit={addManager} className="mb-6 flex gap-4 items-end bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Username</label>
                    <input type="text" name="username" required className="w-full px-3 py-2 border rounded-lg" placeholder="Yangi admin logini" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Parol</label>
                    <input type="password" name="password" required className="w-full px-3 py-2 border rounded-lg" placeholder="Parol" />
                  </div>
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition">
                    Qo'shish
                  </button>
                </form>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-black">
                      <tr>
                        <th className="px-4 py-3">ID / Username</th>
                        <th className="px-4 py-3">Yaratilgan sana</th>
                        <th className="px-4 py-3 text-right">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {managers.map(m => (
                        <tr key={m.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-bold">
                            {m.username} {m.username === 'super_admin' && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full ml-2">ASOSIY</span>}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{new Date(m.createdAt).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                            {m.username !== 'super_admin' && (
                              <button onClick={() => deleteManager(m.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-50 rounded-3xl border border-red-200 p-6 h-fit">
                <h4 className="text-lg font-black text-red-900 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    Xavfli hudud
                  </div>
                  <button onClick={downloadBackup} title="Bazani yuklab olish" className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition">
                    <DatabaseBackup className="h-5 w-5" />
                  </button>
                </h4>
                <div className="space-y-3">
                  <button onClick={() => handleDangerZoneAction('properties')} className="w-full bg-white border border-red-200 hover:bg-red-600 hover:text-white text-red-700 px-4 py-3 rounded-xl font-bold transition flex items-center justify-between group text-sm">
                    Barcha e'lonlarni o'chirish <Trash2 className="h-4 w-4 opacity-50 group-hover:opacity-100" />
                  </button>
                  <button onClick={() => handleDangerZoneAction('users')} className="w-full bg-white border border-red-200 hover:bg-red-600 hover:text-white text-red-700 px-4 py-3 rounded-xl font-bold transition flex items-center justify-between group text-sm">
                    Barcha mijozlarni o'chirish <Trash2 className="h-4 w-4 opacity-50 group-hover:opacity-100" />
                  </button>
                  <button onClick={() => handleDangerZoneAction('stores')} className="w-full bg-white border border-red-200 hover:bg-red-600 hover:text-white text-red-700 px-4 py-3 rounded-xl font-bold transition flex items-center justify-between group text-sm">
                    Barcha do'konlarni o'chirish <Trash2 className="h-4 w-4 opacity-50 group-hover:opacity-100" />
                  </button>
                  <button onClick={() => handleDangerZoneAction('messages')} className="w-full bg-white border border-red-200 hover:bg-red-600 hover:text-white text-red-700 px-4 py-3 rounded-xl font-bold transition flex items-center justify-between group text-sm">
                    Barcha xabarlarni o'chirish <Trash2 className="h-4 w-4 opacity-50 group-hover:opacity-100" />
                  </button>
                </div>
                <p className="text-xs text-red-500 font-medium mt-4 text-center">
                  Diqqat! Bu amallarni ortga qaytarib bo'lmaydi.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
