import { createContext, useContext, useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [admin, setAdmin] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    const storedAdminToken = localStorage.getItem('adminToken')
    const storedAdmin = localStorage.getItem('admin')

    if (storedToken && storedUser) {
      setUser(JSON.parse(storedUser))
    }
    if (storedAdminToken && storedAdmin) {
      setAdmin(JSON.parse(storedAdmin))
    }
    setIsLoading(false)
  }, [])

  const login = async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.indexOf("application/json") !== -1) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { error: text || 'Server xatosi yuz berdi' };
    }

    if (!response.ok) {
      throw new Error(data.error || 'Login xatolik yuz berdi')
    }

    setUser(data.user)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data.user
  }

  const register = async (name, email, phone, password, role) => {
    try {
      console.log('AuthContext: Attempting register at', `${API_URL}/auth/register`);
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password, role })
      })

      const data = await response.json()
      console.log('AuthContext: Register response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Ro\'yxatdan o\'tish xatolik yuz berdi')
      }

      setUser(data.user)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      return data.user
    } catch (error) {
      console.error('AuthContext: Register error:', error);
      throw error;
    }
  }

  const adminLogin = async (username, password) => {
    const response = await fetch(`${API_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })

    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.indexOf("application/json") !== -1) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { error: text || 'Server xatosi yuz berdi' };
    }

    if (!response.ok) {
      throw new Error(data.error || 'Noto\'g\'ri login yoki parol')
    }

    setAdmin(data.admin)
    localStorage.setItem('adminToken', data.token)
    localStorage.setItem('admin', JSON.stringify(data.admin))
    return data.admin
  }

  const superAdminLogin = async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/super-admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('SuperAdminLogin: Non-JSON response:', text);
        data = { error: text || `Server xatosi (${response.status})` };
      }

      if (!response.ok) {
        console.error('SuperAdminLogin: Error response:', data);
        throw new Error(data.error || 'Noto\'g\'ri login yoki parol')
      }

      setAdmin(data.admin)
      localStorage.setItem('adminToken', data.token)
      localStorage.setItem('admin', JSON.stringify(data.admin))
      return data.admin
    } catch (error) {
      console.error('SuperAdminLogin: Fetch error:', error);
      throw error;
    }
  }

  const adminLogout = () => {
    setAdmin(null)
    localStorage.removeItem('adminToken')
    localStorage.removeItem('admin')
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const upgradeToPremium = async () => {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_URL}/auth/upgrade-premium`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Premiumga o\'tish xatolik yuz berdi')
    }

    if (user) {
      const updatedUser = { ...user, isPremium: true }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
    }
    return data
  }

  return (
    <AuthContext.Provider value={{ user, admin, login, register, adminLogin, superAdminLogin, adminLogout, logout, upgradeToPremium, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
