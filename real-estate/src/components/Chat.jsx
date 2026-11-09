import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, Send, X, Video, Paperclip, Image, Film, Smile, Check, CheckCheck, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import VideoCall from './VideoCall'
import { io as socketIO } from 'socket.io-client'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const SOCKET_URL = API_URL.replace('/api', '')

export default function Chat({ sellerId, sellerName, propertyId, propertyTitle, onClose }) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(!!onClose)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [videoCallId, setVideoCallId] = useState(null)
  const [isTyping, setIsTyping] = useState(false)
  const [lightboxImage, setLightboxImage] = useState(null)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const socketRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  // Socket.IO connection
  useEffect(() => {
    if (!user) return

    const socket = socketIO(SOCKET_URL, {
      transports: ['websocket', 'polling']
    })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('register', user.id)
    })

    socket.on('receive_message', (newMessage) => {
      // Only add if it's relevant to this chat
      const isRelevant =
        (newMessage.senderId === Number(sellerId) && newMessage.receiverId === user.id) ||
        (newMessage.senderId === user.id && newMessage.receiverId === Number(sellerId))

      if (isRelevant) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.id === newMessage.id)) return prev
          return [...prev, newMessage]
        })
      }
    })

    socket.on('user_typing', ({ senderId }) => {
      if (Number(senderId) === Number(sellerId)) {
        setIsTyping(true)
      }
    })

    socket.on('user_stop_typing', ({ senderId }) => {
      if (Number(senderId) === Number(sellerId)) {
        setIsTyping(false)
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [user, sellerId])

  useEffect(() => {
    if (isOpen && user && sellerId) {
      fetchMessages()
      // Mark messages as read
      markMessagesRead()
    }
  }, [isOpen, user, sellerId])

  // Polling fallback — refresh messages every 10s while chat is open
  useEffect(() => {
    if (!isOpen || !user || !sellerId) return
    const interval = setInterval(() => {
      fetchMessages()
    }, 10000)
    return () => clearInterval(interval)
  }, [isOpen, user, sellerId])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/chat/${sellerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (Array.isArray(data)) {
        setMessages(data)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const markMessagesRead = async () => {
    try {
      const token = localStorage.getItem('token')
      // Mark all unread messages from this seller as read in one batch request
      await fetch(`${API_URL}/chat/read-all/${sellerId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      })
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const handleTyping = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('typing', { senderId: user.id, receiverId: sellerId })
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit('stop_typing', { senderId: user.id, receiverId: sellerId })
      }
    }, 1500)
  }, [user, sellerId])

  const handleSendMessage = async (e, mediaUrl = null, mediaType = null) => {
    if (e) e.preventDefault()
    const content = mediaUrl || message.trim()
    if (!content || !user) return

    setIsLoading(true)
    if (socketRef.current) {
      socketRef.current.emit('stop_typing', { senderId: user.id, receiverId: sellerId })
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: sellerId,
          propertyId: propertyId,
          message: content,
          message_type: mediaType || 'text'
        })
      })

      if (response.ok) {
        setMessage('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setShowAttachMenu(false)

    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('media', file)

      const response = await fetch(`${API_URL}/chat/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        // Build the full URL for the backend
        const fullUrl = SOCKET_URL + data.url
        await handleSendMessage(null, fullUrl, data.type)
      } else {
        alert('Fayl yuklashda xatolik yuz berdi')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Fayl yuklashda xatolik yuz berdi')
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleVideoCall = async () => {
    if (!user) return
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/video-call/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: sellerId,
          propertyId: propertyId
        })
      })
      const data = await response.json()
      setVideoCallId(data.callId)
    } catch (error) {
      console.error('Error initiating video call:', error)
      alert('Xatolik yuz berdi')
    }
  }

  const handleEndVideoCall = () => {
    setVideoCallId(null)
  }

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
  }

  const renderMessageContent = (msg) => {
    const isSender = msg.senderId === user.id

    if (msg.message_type === 'image') {
      return (
        <div className="chat-media-container" onClick={() => setLightboxImage(msg.message)}>
          <img
            src={msg.message}
            alt="Rasm"
            style={{
              maxWidth: '220px',
              maxHeight: '220px',
              borderRadius: '12px',
              cursor: 'pointer',
              objectFit: 'cover',
              display: 'block'
            }}
            onError={(e) => { e.target.style.display = 'none' }}
          />
        </div>
      )
    }

    if (msg.message_type === 'video') {
      return (
        <div className="chat-media-container">
          <video
            controls
            style={{
              maxWidth: '250px',
              maxHeight: '200px',
              borderRadius: '12px',
              display: 'block'
            }}
          >
            <source src={msg.message} />
            Video yuklanmadi
          </video>
        </div>
      )
    }

    return <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', wordBreak: 'break-word' }}>{msg.message}</p>
  }

  if (!user) {
    return (
      <div style={{
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 50
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(16px)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          padding: '24px',
          maxWidth: '340px'
        }}>
          <p style={{ color: '#6b7280', textAlign: 'center', margin: 0 }}>Chat uchun tizimga kiring</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {videoCallId && (
        <VideoCall callId={videoCallId} onEnd={handleEndVideoCall} />
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            animation: 'chatFadeIn 0.2s ease'
          }}
          onClick={() => setLightboxImage(null)}
        >
          <img
            src={lightboxImage}
            alt="Katta rasm"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '12px', objectFit: 'contain' }}
          />
          <button
            style={{
              position: 'absolute', top: '20px', right: '20px',
              background: 'rgba(255,255,255,0.15)', border: 'none',
              color: '#fff', borderRadius: '50%', width: '44px', height: '44px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: '20px'
            }}
          >
            <X size={22} />
          </button>
        </div>
      )}

      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 50 }}>
        {!isOpen ? (
          /* Chat Bubble Button */
          <button
            onClick={() => setIsOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: '60px', height: '60px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 30px rgba(99,102,241,0.45)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              animation: 'chatPulse 2s infinite'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(99,102,241,0.6)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(99,102,241,0.45)' }}
          >
            <MessageCircle size={26} />
          </button>
        ) : (
          /* Chat Window */
          <div
            style={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.3)',
              width: '400px',
              maxHeight: '620px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'chatSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)',
              color: '#fff',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 700, fontSize: '16px' }}>{sellerName}</h3>
                {propertyTitle && (
                  <p style={{ margin: '2px 0 0', fontSize: '12px', opacity: 0.8 }}>{propertyTitle}</p>
                )}
                {isTyping && (
                  <p style={{
                    margin: '2px 0 0', fontSize: '11px', opacity: 0.9,
                    animation: 'chatFadeIn 0.3s ease',
                    fontStyle: 'italic'
                  }}>
                    yozmoqda...
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={handleVideoCall}
                  title="Video qo'ng'iroq"
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none', color: '#fff',
                    borderRadius: '12px', width: '38px', height: '38px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                >
                  <Video size={18} />
                </button>
                <button
                  onClick={() => { setIsOpen(false); onClose && onClose(); }}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none', color: '#fff',
                    borderRadius: '12px', width: '38px', height: '38px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              minHeight: '320px',
              maxHeight: '420px',
              background: 'linear-gradient(180deg, #f8f9ff 0%, #f0f1ff 100%)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {messages.length === 0 ? (
                <div style={{
                  textAlign: 'center', color: '#9ca3af', paddingTop: '60px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'
                }}>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <MessageCircle size={28} style={{ color: '#818cf8' }} />
                  </div>
                  <p style={{ margin: 0, fontWeight: 500, color: '#6b7280' }}>Suhbatni boshlang</p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>Rasm va video ham yuborishingiz mumkin</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isSender = msg.senderId === user.id
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        justifyContent: isSender ? 'flex-end' : 'flex-start',
                        animation: 'chatMessageIn 0.25s ease'
                      }}
                    >
                      <div style={{
                        maxWidth: '78%',
                        borderRadius: isSender ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        padding: msg.message_type !== 'text' ? '6px' : '10px 14px',
                        background: isSender
                          ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                          : '#fff',
                        color: isSender ? '#fff' : '#1f2937',
                        boxShadow: isSender
                          ? '0 4px 14px rgba(99,102,241,0.3)'
                          : '0 2px 8px rgba(0,0,0,0.06)',
                        position: 'relative'
                      }}>
                        {renderMessageContent(msg)}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '4px',
                          marginTop: '4px',
                          padding: msg.message_type !== 'text' ? '0 6px 4px' : '0'
                        }}>
                          <span style={{
                            fontSize: '11px',
                            opacity: 0.7,
                            color: isSender ? '#e0e7ff' : '#9ca3af'
                          }}>
                            {formatTime(msg.createdAt)}
                          </span>
                          {isSender && (
                            msg.isRead
                              ? <CheckCheck size={14} style={{ color: '#a5f3fc', opacity: 0.9 }} />
                              : <Check size={14} style={{ opacity: 0.6 }} />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}

              {/* Typing Indicator */}
              {isTyping && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', animation: 'chatFadeIn 0.3s ease' }}>
                  <div style={{
                    background: '#fff',
                    borderRadius: '18px 18px 18px 4px',
                    padding: '12px 18px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    display: 'flex', gap: '4px', alignItems: 'center'
                  }}>
                    <span className="chat-typing-dot" style={{ animationDelay: '0s' }}></span>
                    <span className="chat-typing-dot" style={{ animationDelay: '0.15s' }}></span>
                    <span className="chat-typing-dot" style={{ animationDelay: '0.3s' }}></span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Upload progress */}
            {isUploading && (
              <div style={{
                padding: '10px 20px',
                background: 'rgba(99,102,241,0.08)',
                display: 'flex', alignItems: 'center', gap: '10px',
                borderTop: '1px solid rgba(99,102,241,0.1)'
              }}>
                <Loader2 size={18} style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '13px', color: '#6366f1', fontWeight: 500 }}>Fayl yuklanmoqda...</span>
              </div>
            )}

            {/* Attachment Menu */}
            {showAttachMenu && (
              <div style={{
                padding: '12px 16px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                gap: '10px',
                background: '#fafbff',
                animation: 'chatFadeIn 0.2s ease'
              }}>
                <button
                  onClick={() => {
                    fileInputRef.current.accept = 'image/*'
                    fileInputRef.current.click()
                  }}
                  style={{
                    flex: 1,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                    padding: '12px',
                    border: '2px dashed #c7d2fe',
                    borderRadius: '16px',
                    background: 'rgba(99,102,241,0.04)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#818cf8'; e.currentTarget.style.background = 'rgba(99,102,241,0.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#c7d2fe'; e.currentTarget.style.background = 'rgba(99,102,241,0.04)' }}
                >
                  <Image size={22} style={{ color: '#6366f1' }} />
                  <span style={{ fontSize: '12px', color: '#6366f1', fontWeight: 600 }}>Rasm</span>
                </button>
                <button
                  onClick={() => {
                    fileInputRef.current.accept = 'video/*'
                    fileInputRef.current.click()
                  }}
                  style={{
                    flex: 1,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                    padding: '12px',
                    border: '2px dashed #c7d2fe',
                    borderRadius: '16px',
                    background: 'rgba(99,102,241,0.04)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#818cf8'; e.currentTarget.style.background = 'rgba(99,102,241,0.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#c7d2fe'; e.currentTarget.style.background = 'rgba(99,102,241,0.04)' }}
                >
                  <Film size={22} style={{ color: '#8b5cf6' }} />
                  <span style={{ fontSize: '12px', color: '#8b5cf6', fontWeight: 600 }}>Video</span>
                </button>
              </div>
            )}

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />

            {/* Input Area */}
            <form
              onSubmit={handleSendMessage}
              style={{
                padding: '14px 16px',
                borderTop: '1px solid rgba(0,0,0,0.06)',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <button
                type="button"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                style={{
                  background: showAttachMenu ? 'rgba(99,102,241,0.12)' : 'transparent',
                  border: 'none',
                  borderRadius: '12px',
                  width: '40px', height: '40px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  color: showAttachMenu ? '#6366f1' : '#9ca3af',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.color = '#6366f1' }}
                onMouseLeave={e => {
                  if (!showAttachMenu) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#9ca3af'
                  }
                }}
              >
                <Paperclip size={20} />
              </button>

              <input
                type="text"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value)
                  handleTyping()
                }}
                placeholder="Xabar yozing..."
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '24px',
                  outline: 'none',
                  fontSize: '14px',
                  transition: 'border-color 0.2s',
                  background: '#f9fafb'
                }}
                onFocus={e => { e.target.style.borderColor = '#a5b4fc'; e.target.style.background = '#fff' }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb' }}
              />

              <button
                type="submit"
                disabled={isLoading || !message.trim()}
                style={{
                  background: (!message.trim() || isLoading)
                    ? '#e5e7eb'
                    : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '42px', height: '42px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: (!message.trim() || isLoading) ? 'not-allowed' : 'pointer',
                  color: (!message.trim() || isLoading) ? '#9ca3af' : '#fff',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                  boxShadow: (!message.trim() || isLoading) ? 'none' : '0 4px 14px rgba(99,102,241,0.35)'
                }}
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chatFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes chatMessageIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes chatPulse {
          0%, 100% { box-shadow: 0 8px 30px rgba(99,102,241,0.45); }
          50% { box-shadow: 0 8px 40px rgba(99,102,241,0.65), 0 0 0 8px rgba(99,102,241,0.1); }
        }
        @keyframes chatTypingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .chat-typing-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #8b5cf6;
          animation: chatTypingBounce 1.2s ease infinite;
        }
      `}</style>
    </>
  )
}
