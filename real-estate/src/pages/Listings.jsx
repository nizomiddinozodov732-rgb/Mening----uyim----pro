import { useState, useEffect } from 'react'
import { Search, Filter, SlidersHorizontal, Map as MapIcon, List, Download, Building2, Palette, Home, MessageCircle } from 'lucide-react'
import PropertyCard from '../components/PropertyCard'
import Chat from '../components/Chat'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

export default function Listings() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterBedrooms, setFilterBedrooms] = useState('')
  const [filterRegion, setFilterRegion] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState('split') // 'list', 'map', or 'split'
  const [properties, setProperties] = useState([])
  const [architects, setArchitects] = useState([])
  const [stores, setStores] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [mapCenter, setMapCenter] = useState([41.3115, 69.2796]) // Default center (Tashkent)
  const [showMarkers, setShowMarkers] = useState({ properties: true, architects: true, stores: true })
  const [chatProperty, setChatProperty] = useState(null)

  useEffect(() => {
    fetchProperties()
    fetchArchitects()
    fetchStores()
  }, [])

  const fetchProperties = async () => {
    try {
      const response = await fetch(`${API_URL}/properties`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log('Fetched properties:', data)
      setProperties(data)
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching properties:', error)
      setIsLoading(false)
    }
  }

  const fetchArchitects = async () => {
    try {
      const response = await fetch(`${API_URL}/architects`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setArchitects(data)
    } catch (error) {
      console.error('Error fetching architects:', error)
    }
  }

  const fetchStores = async () => {
    try {
      const response = await fetch(`${API_URL}/stores`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setStores(data)
    } catch (error) {
      console.error('Error fetching stores:', error)
    }
  }

  // Filter architects and stores by search term
  const filteredArchitects = architects.filter(architect =>
    architect.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    architect.location?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredStores = stores.filter(store =>
    store.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.location?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !filterType || property.type === filterType
    const matchesBedrooms = !filterBedrooms || property.bedrooms >= parseInt(filterBedrooms)
    const matchesRegion = !filterRegion || property.location.toLowerCase().includes(filterRegion.toLowerCase())
    
    return matchesSearch && matchesType && matchesBedrooms && matchesRegion
  })

  const sortedProperties = [...filteredProperties].sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price
    if (sortBy === 'price_desc') return b.price - a.price
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt)
    if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt)
    return 0
  })

  // Update map center when search changes
  useEffect(() => {
    if (sortedProperties.length > 0 && sortedProperties[0].coordinates) {
      setMapCenter(sortedProperties[0].coordinates)
    }
  }, [sortedProperties])

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

  // Custom marker icons
  const createCustomIcon = (color) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30]
    })
  }

  const propertyIcon = createCustomIcon('#3b82f6') // Blue for properties
  const architectIcon = createCustomIcon('#8b5cf6') // Purple for architects
  const storeIcon = createCustomIcon('#10b981') // Green for stores

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
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Barcha e'lonlar</h1>
          
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Manzil yoki sarlavha bo'yicha qidiring..."
                value={searchTerm}
                onChange={handleSearch}
                onKeyDown={handleSearchSubmit}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              />
            </div>
            <div className="flex gap-2 sm:gap-4 flex-wrap">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm sm:text-base touch-target"
              >
                <SlidersHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Filtrlar</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-3 border rounded-lg transition text-sm sm:text-base touch-target ${viewMode === 'list' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 hover:bg-gray-50'}`}
              >
                <List className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Ro'yxat</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-3 border rounded-lg transition text-sm sm:text-base touch-target ${viewMode === 'map' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 hover:bg-gray-50'}`}
              >
                <MapIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Xarita</span>
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-3 border rounded-lg transition text-sm sm:text-base touch-target ${viewMode === 'split' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 hover:bg-gray-50'}`}
              >
                <div className="flex gap-0.5">
                  <List className="h-4 w-4 sm:h-5 sm:w-5" />
                  <MapIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <span className="hidden sm:inline">Ikkalasi</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg mobile-menu">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Turi</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  >
                    <option value="">Barchasi</option>
                    <option value="Sotuv">Sotuv</option>
                    <option value="Ijara">Ijara</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hudud</label>
                  <select
                    value={filterRegion}
                    onChange={(e) => setFilterRegion(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  >
                    {regions.map(region => (
                      <option key={region} value={region === 'Barchasi' ? '' : region}>{region}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum xona soni</label>
                  <select
                    value={filterBedrooms}
                    onChange={(e) => setFilterBedrooms(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  >
                    <option value="">Barchasi</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tartiblash</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  >
                    <option value="newest">Eng yangilari</option>
                    <option value="oldest">Eng eskilar</option>
                    <option value="price_asc">Arzonlari oldin</option>
                    <option value="price_desc">Qimmatlari oldin</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setFilterType('')
                      setFilterBedrooms('')
                      setFilterRegion('')
                    }}
                    className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition text-sm sm:text-base touch-target"
                  >
                    Filtrlarni tozalash
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Yuklanmoqda...</p>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
              {sortedProperties.length} ta e'lon topildi
            </p>

            {/* Map Only View */}
            {viewMode === 'map' && (
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Xarita ko'rinishi</h2>
                <div className="h-[60vh] sm:h-[70vh] rounded-xl overflow-hidden shadow-lg relative">
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
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {/* Property markers */}
                    {showMarkers.properties && sortedProperties.map(property => (
                      property.coordinates && (
                        <Marker key={`property-${property.id}`} position={property.coordinates} icon={propertyIcon}>
                          <Popup>
                            <div className="min-w-[150px] sm:min-w-[200px]">
                              <p className="font-semibold text-sm flex items-center gap-1">
                                <Home className="h-4 w-4 text-blue-600" />
                                {property.title}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-600">{property.price.toLocaleString()} so'm</p>
                              <p className="text-xs text-gray-500 mt-1">{property.location}</p>
                              <button
                                onClick={() => setChatProperty(property)}
                                className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 rounded-lg flex items-center justify-center gap-1 transition"
                              >
                                <MessageCircle className="h-3 w-3" />
                                Xabar yuborish
                              </button>
                            </div>
                          </Popup>
                        </Marker>
                      )
                    ))}
                    {/* Architect markers */}
                    {showMarkers.architects && filteredArchitects.map(architect => (
                      architect.coordinates && (
                        <Marker key={`architect-${architect.id}`} position={architect.coordinates} icon={architectIcon}>
                          <Popup>
                            <div className="min-w-[150px] sm:min-w-[200px]">
                              <p className="font-semibold text-sm flex items-center gap-1">
                                <Palette className="h-4 w-4 text-purple-600" />
                                {architect.name}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-600">Arxitektor</p>
                              <p className="text-xs text-gray-500 mt-1">{architect.location}</p>
                            </div>
                          </Popup>
                        </Marker>
                      )
                    ))}
                    {/* Store markers */}
                    {showMarkers.stores && filteredStores.map(store => (
                      store.coordinates && (
                        <Marker key={`store-${store.id}`} position={store.coordinates} icon={storeIcon}>
                          <Popup>
                            <div className="min-w-[150px] sm:min-w-[200px]">
                              <p className="font-semibold text-sm flex items-center gap-1">
                                <Building2 className="h-4 w-4 text-green-600" />
                                {store.name}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-600">Qurilish materiallari do'koni</p>
                              <p className="text-xs text-gray-500 mt-1">{store.location}</p>
                            </div>
                          </Popup>
                        </Marker>
                      )
                    ))}
                  </MapContainer>
                  {/* Legend */}
                  <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg z-[1000]">
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showMarkers.properties}
                          onChange={(e) => setShowMarkers({...showMarkers, properties: e.target.checked})}
                          className="rounded"
                        />
                        <Home className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium">E'lonlar</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showMarkers.architects}
                          onChange={(e) => setShowMarkers({...showMarkers, architects: e.target.checked})}
                          className="rounded"
                        />
                        <Palette className="h-4 w-4 text-purple-600" />
                        <span className="text-xs font-medium">Arxitektorlar</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showMarkers.stores}
                          onChange={(e) => setShowMarkers({...showMarkers, stores: e.target.checked})}
                          className="rounded"
                        />
                        <Building2 className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium">Do'konlar</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* List Only View */}
            {viewMode === 'list' && (
              sortedProperties.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                  {sortedProperties.map(property => (
                    <PropertyCard key={property.id} property={property} onChat={setChatProperty} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Filter className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Hech narsa topilmadi</h3>
                  <p className="text-gray-600 text-sm sm:text-base">Boshqa qidirish sharoitlarini sinab ko'ring</p>
                </div>
              )
            )}

            {/* Split View - List and Map Side by Side */}
            {viewMode === 'split' && (
              <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                {/* List */}
                <div className="flex-1">
                  {sortedProperties.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                      {sortedProperties.map(property => (
                        <PropertyCard key={property.id} property={property} onChat={setChatProperty} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                      <Filter className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Hech narsa topilmadi</h3>
                      <p className="text-gray-600 text-sm sm:text-base">Boshqa qidirish sharoitlarini sinab ko'ring</p>
                    </div>
                  )}
                </div>

                {/* Map */}
                <div className="lg:w-1/2">
                  <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 sticky top-20">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Xarita</h2>
                    <div className="h-[50vh] sm:h-[60vh] lg:h-[70vh] rounded-xl overflow-hidden shadow-lg relative">
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
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {/* Property markers */}
                        {showMarkers.properties && sortedProperties.map(property => (
                          property.coordinates && (
                            <Marker key={`property-split-${property.id}`} position={property.coordinates} icon={propertyIcon}>
                              <Popup>
                                <div className="min-w-[150px] sm:min-w-[200px]">
                                  <p className="font-semibold text-sm flex items-center gap-1">
                                    <Home className="h-4 w-4 text-blue-600" />
                                    {property.title}
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-600">{property.price.toLocaleString()} so'm</p>
                                  <p className="text-xs text-gray-500 mt-1">{property.location}</p>
                                  <button
                                    onClick={() => setChatProperty(property)}
                                    className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 rounded-lg flex items-center justify-center gap-1 transition"
                                  >
                                    <MessageCircle className="h-3 w-3" />
                                    Xabar yuborish
                                  </button>
                                </div>
                              </Popup>
                            </Marker>
                          )
                        ))}
                        {/* Architect markers */}
                        {showMarkers.architects && filteredArchitects.map(architect => (
                          architect.coordinates && (
                            <Marker key={`architect-split-${architect.id}`} position={architect.coordinates} icon={architectIcon}>
                              <Popup>
                                <div className="min-w-[150px] sm:min-w-[200px]">
                                  <p className="font-semibold text-sm flex items-center gap-1">
                                    <Palette className="h-4 w-4 text-purple-600" />
                                    {architect.name}
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-600">Arxitektor</p>
                                  <p className="text-xs text-gray-500 mt-1">{architect.location}</p>
                                </div>
                              </Popup>
                            </Marker>
                          )
                        ))}
                        {/* Store markers */}
                        {showMarkers.stores && filteredStores.map(store => (
                          store.coordinates && (
                            <Marker key={`store-split-${store.id}`} position={store.coordinates} icon={storeIcon}>
                              <Popup>
                                <div className="min-w-[150px] sm:min-w-[200px]">
                                  <p className="font-semibold text-sm flex items-center gap-1">
                                    <Building2 className="h-4 w-4 text-green-600" />
                                    {store.name}
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-600">Qurilish materiallari do'koni</p>
                                  <p className="text-xs text-gray-500 mt-1">{store.location}</p>
                                </div>
                              </Popup>
                            </Marker>
                          )
                        ))}
                      </MapContainer>
                      {/* Legend */}
                      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg z-[1000]">
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={showMarkers.properties}
                              onChange={(e) => setShowMarkers({...showMarkers, properties: e.target.checked})}
                              className="rounded"
                            />
                            <Home className="h-4 w-4 text-blue-600" />
                            <span className="text-xs font-medium">E'lonlar</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={showMarkers.architects}
                              onChange={(e) => setShowMarkers({...showMarkers, architects: e.target.checked})}
                              className="rounded"
                            />
                            <Palette className="h-4 w-4 text-purple-600" />
                            <span className="text-xs font-medium">Arxitektorlar</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={showMarkers.stores}
                              onChange={(e) => setShowMarkers({...showMarkers, stores: e.target.checked})}
                              className="rounded"
                            />
                            <Building2 className="h-4 w-4 text-green-600" />
                            <span className="text-xs font-medium">Do'konlar</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Chat Component */}
      {chatProperty && (
        <Chat
          sellerId={chatProperty.sellerId || chatProperty.userId}
          sellerName={chatProperty.sellerName || chatProperty.userName || 'Sotuvchi'}
          propertyId={chatProperty.id}
          propertyTitle={chatProperty.title}
          onClose={() => setChatProperty(null)}
        />
      )}
    </div>
  )
}
