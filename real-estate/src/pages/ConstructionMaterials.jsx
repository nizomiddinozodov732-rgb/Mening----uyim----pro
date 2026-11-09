import { useState, useEffect } from 'react'
import { Search, Filter, SlidersHorizontal, Map as MapIcon, List, Building2, Phone, Star } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

export default function ConstructionMaterials() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterRegion, setFilterRegion] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState('split')
  const [materials, setMaterials] = useState([])
  const [selectedStore, setSelectedStore] = useState(null)
  const [storeInventory, setStoreInventory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingInventory, setIsLoadingInventory] = useState(false)
  const [hoverRating, setHoverRating] = useState({})
  const [mapCenter, setMapCenter] = useState([41.3115, 69.2796])

  useEffect(() => {
    fetchMaterials()
    fetchAllInventory()
  }, [])

  const fetchMaterials = async () => {
    try {
      const response = await fetch(`${API_URL}/construction-materials`)
      if (response.ok) {
        const data = await response.json()
        setMaterials(data)
      }
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching materials:', error)
      setIsLoading(false)
    }
  }

  const fetchAllInventory = async () => {
    try {
      const response = await fetch(`${API_URL}/construction-materials/all-inventory`)
      if (response.ok) {
        const data = await response.json()
        setStoreInventory(data)
      } else {
        // Agar maxsus endpoint bo'lmasa, har bir do'kon uchun alohida yuklaymiz (fallback)
        const allInv = []
        for (const store of materials) {
          const res = await fetch(`${API_URL}/construction-materials/${store.id}/inventory`)
          if (res.ok) {
            const items = await res.json()
            allInv.push(...items.map(item => ({ ...item, storeName: store.name })))
          }
        }
        setStoreInventory(allInv)
      }
    } catch (error) {
      console.error('Error fetching all inventory:', error)
    }
  }

  const handleStoreClick = async (store) => {
    if (selectedStore?.id === store.id) {
      setSelectedStore(null)
      fetchAllInventory()
    } else {
      setSelectedStore(store)
      setIsLoadingInventory(true)
      try {
        const response = await fetch(`${API_URL}/construction-materials/${store.id}/inventory`)
        if (response.ok) {
          const data = await response.json()
          setStoreInventory(data.map(item => ({ ...item, storeName: store.name })))
        }
      } catch (error) {
        console.error('Error fetching store inventory:', error)
      }
      setIsLoadingInventory(false)
    }
  }

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !filterCategory || material.category === filterCategory
    const matchesRegion = !filterRegion || material.location.toLowerCase().includes(filterRegion.toLowerCase())
    return matchesSearch && matchesCategory && matchesRegion
  })

  const filteredInventory = storeInventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !filterCategory || item.category === filterCategory
    return matchesSearch && matchesCategory
  })

  // Update map center when filtered materials change
  useEffect(() => {
    if (filteredMaterials.length > 0 && filteredMaterials[0].coordinates) {
      setMapCenter(filteredMaterials[0].coordinates)
    }
  }, [filteredMaterials])

  // Geocoding function to convert location name to coordinates
  const searchLocation = async (locationName) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&countrycodes=UZ`)
      const data = await response.json()
      if (data && data.length > 0) {
        const { lat, lon } = data[0]
        setMapCenter([parseFloat(lat), parseFloat(lon)])
      }
    } catch (error) {
      console.error('Error geocoding location:', error)
    }
  }

  // Handle search with geocoding
  const handleSearch = (e) => {
    const value = e.target.value
    setSearchTerm(value)
  }

  // Handle Enter key press for location search
  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      const value = e.target.value
      if (value.length > 2) {
        searchLocation(value)
      }
    }
  }

  const categories = ['Umumiy', 'Beton', 'G\'isht', 'Metall', 'Elektr', 'Qoplama', 'Devor', 'Yopishtirish']

  const regions = [
    'Barchasi',
    'Toshkent',
    'Samarqand',
    'Buxoro',
    'Namangan',
    'Farg\'ona',
    'Andijon',
    'Qashqadaryo',
    'Surxondaryo',
    'Xorazm',
    'Jizzax',
    'Sirdaryo',
    'Navoiy',
    'Qoraqalpog\'iston'
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header Section */}
      <div className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {selectedStore ? `Do'kon: ${selectedStore.name}` : 'Qurilish Mollari va Do\'konlar'}
              </h1>
              
              <div className="flex items-center gap-2">
                {selectedStore && (
                  <button
                    onClick={() => {
                      setSelectedStore(null)
                      fetchAllInventory()
                    }}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    Barcha mollarni ko'rish
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  <Filter className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Mahsulot yoki do'kon bo'yicha qidiring..."
                value={searchTerm}
                onChange={handleSearch}
                onKeyDown={handleSearchSubmit}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Kategoriya</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Barchasi</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Hudud (Do'konlar uchun)</label>
                  <select
                    value={filterRegion}
                    onChange={(e) => setFilterRegion(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option key="Barchasi" value="">Barchasi</option>
                    {regions.filter(r => r !== 'Barchasi').map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setFilterCategory('')
                      setFilterRegion('')
                      setSelectedStore(null)
                      fetchAllInventory()
                    }}
                    className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    Filtrlarni tozalash
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Map Section - Always visible */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MapIcon className="h-5 w-5 text-blue-600" />
              Do'konlar xaritada
            </h2>
            <span className="text-sm text-gray-500 font-medium">{filteredMaterials.length} ta do'kon</span>
          </div>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-2 overflow-hidden h-[400px] relative">
            {/* Search bar on map */}
            <div className="absolute top-4 left-4 right-4 z-[1000]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Xaritada qidirish..."
                  value={searchTerm}
                  onChange={handleSearch}
                  onKeyDown={handleSearchSubmit}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-white shadow-lg"
                />
              </div>
            </div>
            <MapContainer
              center={mapCenter}
              zoom={12}
              className="w-full h-full rounded-2xl"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {filteredMaterials.map(material => (
                material.coordinates && (
                  <Marker
                    key={material.id}
                    position={material.coordinates}
                    eventHandlers={{
                      click: () => handleStoreClick(material),
                    }}
                  >
                    <Popup className="custom-popup">
                      <div className="p-1 max-w-[200px]">
                        <img src={material.image} className="w-full h-24 object-cover rounded-lg mb-2" alt={material.name} />
                        <h4 className="font-bold text-sm text-gray-900">{material.name}</h4>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{material.location}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs font-bold">{material.rating?.toFixed(1) || '0.0'}</span>
                        </div>
                        <button
                          className={`w-full mt-2 py-1.5 rounded-md text-[10px] font-bold transition-colors ${selectedStore?.id === material.id ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}
                        >
                          {selectedStore?.id === material.id ? "Tanlangan do'kon" : "Mollarini ko'rish"}
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          </div>
        </section>

        {/* Products Section - Displayed as Ads/Listings */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <List className="h-5 w-5 text-blue-600" />
              {selectedStore ? `${selectedStore.name} mollari` : 'Barcha qurilish mollari'}
            </h2>
            <span className="text-sm text-gray-500 font-medium">{filteredInventory.length} ta mahsulot</span>
          </div>

          {isLoadingInventory ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-500 font-medium">Mahsulotlar yuklanmoqda...</p>
            </div>
          ) : filteredInventory.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredInventory.map(item => (
                <div key={item.id} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <span className="bg-white/90 backdrop-blur-sm text-blue-600 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm">
                        {item.category}
                      </span>
                      {item.storeName && (
                        <span className="bg-blue-600 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {item.storeName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4 flex flex-grow flex-col">
                    <h3 className="text-base font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{item.name}</h3>
                    <p className="text-gray-500 text-xs mt-1 line-clamp-2 h-8">{item.description}</p>
                    
                    <div className="mt-auto pt-4 flex flex-col gap-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-blue-600">{item.price.toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">so'm / {item.unit}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className="text-gray-400">Holati:</span>
                        <span className={`${item.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.quantity > 0 ? `Sotuvda bor (${item.quantity} ${item.unit})` : 'Tugagan'}
                        </span>
                      </div>
                      <button className="w-full bg-gray-900 hover:bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2">
                        <Phone className="h-4 w-4" />
                        Bog'lanish
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-100">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-200" />
              <h3 className="text-xl font-bold text-gray-900">Mahsulotlar topilmadi</h3>
              <p className="text-gray-500 mt-2">Bu bo'limda hozircha e'lonlar mavjud emas.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
