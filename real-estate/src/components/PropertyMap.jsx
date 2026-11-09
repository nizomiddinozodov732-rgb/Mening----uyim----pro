import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Search } from 'lucide-react'

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Calculate distance between two coordinates (in km)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export default function PropertyMap({ coordinates, location, allProperties, currentPropertyId }) {
  const [mapCenter, setMapCenter] = useState(coordinates)
  const [searchTerm, setSearchTerm] = useState('')

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

  if (!coordinates || coordinates.length !== 2) {
    return null
  }

  // Find nearby properties within 5km
  const nearbyProperties = allProperties
    .filter(p => p.id !== currentPropertyId && p.coordinates)
    .filter(p => calculateDistance(coordinates[0], coordinates[1], p.coordinates[0], p.coordinates[1]) <= 5)
    .slice(0, 5) // Show max 5 nearby properties

  return (
    <div className="h-96 rounded-xl overflow-hidden shadow-lg relative">
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
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white shadow-lg"
          />
        </div>
      </div>
      <MapContainer
        center={mapCenter}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Main property marker */}
        <Marker position={coordinates}>
          <Popup>
            <div className="text-center">
              <p className="font-semibold">{location}</p>
              <p className="text-sm text-gray-600">Bu obyekt</p>
            </div>
          </Popup>
        </Marker>

        {/* Nearby property markers */}
        {nearbyProperties.map(property => (
          <Marker
            key={property.id}
            position={property.coordinates}
            icon={L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="background-color: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })}
          >
            <Popup>
              <div className="text-center min-w-[150px]">
                <p className="font-semibold text-sm">{property.title}</p>
                <p className="text-xs text-gray-600">{property.price.toLocaleString()} so'm</p>
                <Link
                  to={`/property/${property.id}`}
                  className="inline-block mt-2 text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  Ko'rish
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Nearby properties legend */}
      {nearbyProperties.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">Yaqin atrofdagi obyektlar</h4>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
              <span className="text-gray-600">Bu obyekt</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">Yaqin obyektlar ({nearbyProperties.length})</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
