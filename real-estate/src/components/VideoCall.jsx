import { useState, useEffect, useRef } from 'react'
import { Video, Phone, PhoneOff, Mic, MicOff, Camera, CameraOff, X, Loader2 } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function VideoCall({ callId, onEnd }) {
  const [status, setStatus] = useState('connecting')
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const peerConnection = useRef(null)

  useEffect(() => {
    if (callId) {
      startCall()
    }
    return () => {
      cleanup()
    }
  }, [callId])

  const startCall = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      setLocalStream(stream)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      setStatus('connected')
    } catch (error) {
      console.error('Error starting call:', error)
      setStatus('error')
    }
  }

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
    if (peerConnection.current) {
      peerConnection.current.close()
    }
  }

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !isMuted
        setIsMuted(!isMuted)
      }
    }
  }

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !isCameraOff
        setIsCameraOff(!isCameraOff)
      }
    }
  }

  const handleEndCall = async () => {
    cleanup()
    try {
      const token = localStorage.getItem('token')
      await fetch(`${API_URL}/video-call/${callId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'ended' })
      })
    } catch (error) {
      console.error('Error ending call:', error)
    }
    onEnd()
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Main video area */}
      <div className="flex-1 relative">
        {status === 'connecting' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin" />
              <p className="text-xl">Qo'ng'iroq qo'nmoqda...</p>
            </div>
          </div>
        ) : status === 'error' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <X className="h-16 w-16 mx-auto mb-4 text-red-500" />
              <p className="text-xl">Qo'ng'iroq xatolik yuz berdi</p>
            </div>
          </div>
        ) : (
          <>
            {/* Remote video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Local video (picture-in-picture) */}
            <div className="absolute bottom-24 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-4 flex items-center justify-center gap-4">
        <button
          onClick={toggleMute}
          className={`p-4 rounded-full transition ${
            isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {isMuted ? <MicOff className="h-6 w-6 text-white" /> : <Mic className="h-6 w-6 text-white" />}
        </button>
        
        <button
          onClick={toggleCamera}
          className={`p-4 rounded-full transition ${
            isCameraOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {isCameraOff ? <CameraOff className="h-6 w-6 text-white" /> : <Camera className="h-6 w-6 text-white" />}
        </button>
        
        <button
          onClick={handleEndCall}
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition"
        >
          <PhoneOff className="h-6 w-6 text-white" />
        </button>
      </div>
    </div>
  )
}
