import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ArrowLeft, MapPin, Upload, Video, X, Check, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function AddProperty() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    type: 'Sotuv',
    price: '',
    location: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    description: '',
    features: '',
    coordinates: null
  })
  const [videoFile, setVideoFile] = useState(null)
  const [imageFiles, setImageFiles] = useState([])
  const [videoPreview, setVideoPreview] = useState(null)
  const [imagePreviews, setImagePreviews] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [validationErrors, setValidationErrors] = useState({})

  // Real-time validation
  useEffect(() => {
    const errors = {}
    if (formData.title && formData.title.length < 5) {
      errors.title = 'Sarlavha kamida 5 ta belgidan iborat bo\'lishi kerak'
    }
    if (formData.price && formData.price < 1000000) {
      errors.price = 'Narx kamida 1,000,000 so\'m bo\'lishi kerak'
    }
    if (formData.bedrooms && formData.bedrooms < 1) {
      errors.bedrooms = 'Kamida 1 xona bo\'lishi kerak'
    }
    if (formData.area && formData.area < 10) {
      errors.area = 'Maydon kamida 10 m² bo\'lishi kerak'
    }
    setValidationErrors(errors)
  }, [formData])

  // Handle video file with preview
  const handleVideoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setError('Video hajmi 50MB dan oshmasligi kerak')
        return
      }
      setVideoFile(file)
      const preview = URL.createObjectURL(file)
      setVideoPreview(preview)
    }
  }

  // Handle image files with preview
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 10) {
      setError('Maksimal 10 ta rasm yuklash mumkin')
      return
    }
    
    const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024)
    if (validFiles.length !== files.length) {
      setError('Ba\'zi rasmlar 5MB dan katta, ular o\'tkazib yuborildi')
    }
    
    setImageFiles(validFiles)
    const previews = validFiles.map(file => URL.createObjectURL(file))
    setImagePreviews(previews)
  }

  const removeImage = (index) => {
    const newImageFiles = imageFiles.filter((_, i) => i !== index)
    const newImagePreviews = imagePreviews.filter((_, i) => i !== index)
    setImageFiles(newImageFiles)
    setImagePreviews(newImagePreviews)
  }

  const removeVideo = () => {
    setVideoFile(null)
    setVideoPreview(null)
    document.getElementById('video-upload').value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    setUploadProgress(0)
    
    if (!formData.title || !formData.price || !formData.location || !formData.bedrooms || !formData.area) {
      setError("Barcha majburiy maydonlarni to'ldiring")
      setIsLoading(false)
      return
    }

    try {
      const formDataObj = new FormData()
      formDataObj.append('title', formData.title)
      formDataObj.append('type', formData.type)
      formDataObj.append('price', formData.price)
      formDataObj.append('location', formData.location)
      formDataObj.append('coordinates', JSON.stringify([41.3115, 69.2796])) // Default coordinates
      formDataObj.append('bedrooms', formData.bedrooms)
      formDataObj.append('bathrooms', formData.bathrooms)
      formDataObj.append('area', formData.area)
      formDataObj.append('description', formData.description)
      formDataObj.append('features', formData.features)
      if (videoFile) formDataObj.append('video', videoFile)
      
      imageFiles.forEach((file, index) => {
        formDataObj.append(`images`, file)
      })

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/properties`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataObj
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'E\'lon qo\'shish xatolik yuz berdi')
      }

      alert('E\'lon muvaffaqiyatli qo\'shildi!')
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'E\'lon qo\'shish xatolik yuz berdi')
      setUploadProgress(0)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-blue-600 hover:text-blue-700 text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Kabinetga qaytish
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Yangi e'lon qo'shish</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-4 sm:mb-6 text-sm sm:text-base">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rasmlar
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 lg:p-8 text-center hover:border-blue-500 transition cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-400" />
                  <p className="text-gray-600 text-sm sm:text-base">Rasmlarni bu yerga torting yoki bosing</p>
                  <p className="text-gray-400 text-xs sm:text-sm mt-1 sm:mt-2">PNG, JPG (max 5MB, 10 ta rasm)</p>
                </label>
              </div>
              
              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 sm:h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Video Upload (Mandatory) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video * (majburiy)
              </label>
              {!videoPreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 lg:p-8 text-center hover:border-blue-500 transition cursor-pointer">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="hidden"
                    id="video-upload"
                    required
                  />
                  <label htmlFor="video-upload" className="cursor-pointer">
                    <Video className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-400" />
                    <p className="text-gray-600 text-sm sm:text-base">Videoni bu yerga torting yoki bosing</p>
                    <p className="text-gray-400 text-xs sm:text-sm mt-1 sm:mt-2">MP4, WebM (max 50MB)</p>
                  </label>
                  <label htmlFor="video-upload" className="mt-3 sm:mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 rounded-lg cursor-pointer transition text-sm sm:text-base touch-target btn-hover">
                    Video tanlash
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <video
                    src={videoPreview}
                    controls
                    className="w-full max-h-64 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeVideo}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sarlavha *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className={`w-full px-3 sm:px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-sm sm:text-base ${validationErrors.title ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                  placeholder="Masalan: Zamonaviy 3 xonali kvartira"
                  required
                />
                {validationErrors.title && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {validationErrors.title}
                  </p>
                )}
                {formData.title && formData.title.length >= 5 && !validationErrors.title && (
                  <p className="text-green-500 text-xs mt-1 flex items-center">
                    <Check className="h-3 w-3 mr-1" />
                    To'g'ri
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Turi *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                >
                  <option value="Sotuv">Sotuv</option>
                  <option value="Ijara">Ijara</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Narx (so'm) *
                </label>
                <input  
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className={`w-full px-3 sm:px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-sm sm:text-base ${validationErrors.price ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                  placeholder="350000000"
                  required
                />
                {validationErrors.price && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {validationErrors.price}
                  </p>
                )}
                {formData.price && formData.price >= 1000000 && !validationErrors.price && (
                  <p className="text-green-500 text-xs mt-1 flex items-center">
                    <Check className="h-3 w-3 mr-1" />
                    To'g'ri
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manzil *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className={`w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-sm sm:text-base ${formData.location ? 'border-green-500 focus:ring-green-500' : 'border-gray-300 focus:ring-blue-500'}`}
                    placeholder="Toshkent, Yunusobod tumani"
                    required
                  />
                  {formData.location && (
                    <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Xona soni *
                </label>
                <input
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({...formData, bedrooms: e.target.value})}
                  className={`w-full px-3 sm:px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-sm sm:text-base ${validationErrors.bedrooms ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                  placeholder="3"
                  required
                />
                {validationErrors.bedrooms && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {validationErrors.bedrooms}
                  </p>
                )}
                {formData.bedrooms && formData.bedrooms >= 1 && !validationErrors.bedrooms && (
                  <p className="text-green-500 text-xs mt-1 flex items-center">
                    <Check className="h-3 w-3 mr-1" />
                    To'g'ri
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vannaxona soni
                </label>
                <input
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({...formData, bathrooms: e.target.value})}
                  className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  placeholder="2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maydon (m²) *
                </label>
                <input
                  type="number"
                  value={formData.area}
                  onChange={(e) => setFormData({...formData, area: e.target.value})}
                  className={`w-full px-3 sm:px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-sm sm:text-base ${validationErrors.area ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                  placeholder="95"
                  required
                />
                {validationErrors.area && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {validationErrors.area}
                  </p>
                )}
                {formData.area && formData.area >= 10 && !validationErrors.area && (
                  <p className="text-green-500 text-xs mt-1 flex items-center">
                    <Check className="h-3 w-3 mr-1" />
                    To'g'ri
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tavsif
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="4 sm:rows-5"
                className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base resize-none"
                placeholder="Mulk haqida batafsil ma'lumot..."
              ></textarea>
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Xususiyatlar (vergul bilan ajrating)
              </label>
              <input
                type="text"
                value={formData.features}
                onChange={(e) => setFormData({...formData, features: e.target.value})}
                className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                placeholder="Markaziy isitish, Konditsioner, Balkon"
              />
            </div>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 text-sm sm:text-base touch-target btn-hover disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                >
                  {isLoading ? (
                    <>
                      <span className="relative z-10">{uploadProgress < 100 ? `Yuklanmoqda... ${uploadProgress}%` : 'Yuklanmoqda...'}</span>
                      {uploadProgress > 0 && (
                        <div 
                          className="absolute top-0 left-0 h-full bg-blue-700 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      )}
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                      E'lon qo'shish
                    </>
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                disabled={isLoading}
                className="px-6 sm:px-8 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm sm:text-base touch-target disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Bekor qilish
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
