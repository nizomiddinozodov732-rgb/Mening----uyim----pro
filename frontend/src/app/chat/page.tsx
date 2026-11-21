'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, useStore } from '@/store/useStore';
import { 
  Send, Phone, Video, PhoneOff, MessageSquare, Plus, Search,
  X, CheckCheck, Sparkles,
  Image as ImageIcon, Film, FileText, MapPin, Paperclip,
  ExternalLink, Download, ArrowUpRight,
  Mic, MicOff, VideoOff, PhoneIncoming, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: number;
  conversation: number;
  sender: number;
  sender_name: string;
  content: string;
  message_type: 'text' | 'image' | 'video' | 'document' | 'location' | string;
  file?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
}

interface Participant {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  avatar: string | null;
  profession_display?: string;
  is_online?: boolean;
  phone?: string;
  telegram?: string;
  whatsapp?: string;
  instagram?: string;
}

interface Conversation {
  id: number;
  participants: Participant[];
  property_detail?: {
    id: number;
    title: string;
    price: string;
  };
  last_message?: Message | null;
  unread_count: number;
  updated_at?: string;
}

type CallType = 'audio' | 'video';
type CallState = 'idle' | 'outgoing' | 'incoming' | 'connecting' | 'connected';

interface CallPeer {
  id: number;
  name: string;
  avatar?: string | null;
}

// WebRTC uchun ICE serverlar. TURN (ixtiyoriy) ENV orqali sozlanadi —
// cheklangan (NAT/firewall) tarmoqlarda ham aloqa o'rnatish uchun kerak.
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];
const TURN_URL = process.env.NEXT_PUBLIC_TURN_URL;
if (TURN_URL) {
  ICE_SERVERS.push({
    urls: TURN_URL,
    username: process.env.NEXT_PUBLIC_TURN_USERNAME,
    credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
  });
}

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function ChatContent() {
  const searchParams = useSearchParams();
  const { user, accessToken, isLoggedIn } = useStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // New Chat Modal state
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<Participant[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Call state
  const [callState, setCallState] = useState<CallState>('idle');
  const [callType, setCallType] = useState<CallType>('audio');
  const [callPeer, setCallPeer] = useState<CallPeer | null>(null);
  const [callError, setCallError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const socketRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // ── WebRTC refs ──────────────────────────────────────────────
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const peerIdRef = useRef<number | null>(null);
  const isCallerRef = useRef(false);
  const callTypeRef = useRef<CallType>('audio');
  const callStateRef = useRef<CallState>('idle');
  const incomingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeConvIdRef = useRef<number | null>(null);
  // WebSocket xabaridan qo'ng'iroq signalini qayta ishlovchi eng so'nggi funksiya
  const signalHandlerRef = useRef<((sig: any) => void) | null>(null);

  // File and Location input refs
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // URL'dan kelgan parametrlar (qiymat bo'yicha barqaror — qayta ulanish/loop oldini oladi)
  const convParam = searchParams.get('conv');
  const userParam = searchParams.get('user');

  // 1. Load Conversations
  const loadConversations = useCallback(async () => {
    try {
      const res = await api.get('/chat/conversations/');
      const list: Conversation[] = res.data.results || res.data || [];
      setConversations(list);

      if (convParam) {
        const found = list.find((c) => c.id === parseInt(convParam));
        if (found && activeConvIdRef.current !== found.id) setActiveConv(found);
      } else if (userParam) {
        // Agar ?user=ID kelsa, shu user bilan suhbat topish yoki yangi ochish
        const targetUserId = parseInt(userParam);
        const existing = list.find((c) => c.participants.some((p) => p.id === targetUserId));
        if (existing) {
          if (activeConvIdRef.current !== existing.id) setActiveConv(existing);
        } else {
          // Yangi ochish
          try {
            const createRes = await api.post('/chat/conversations/', { recipient_id: targetUserId });
            const newConv = createRes.data;
            setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== newConv.id)]);
            setActiveConv(newConv);
          } catch (err) {
            console.error('Failed to auto-create conversation with user:', err);
          }
        }
      } else if (!activeConvIdRef.current && list.length > 0) {
        // Standart holatda birinchi suhbatni ochish
        setActiveConv(list[0]);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  }, [convParam, userParam]);

  useEffect(() => {
    if (isLoggedIn) {
      loadConversations();
    }
  }, [isLoggedIn, loadConversations]);

  // 2. Load Messages for active conversation
  const loadMessages = useCallback(async (convId: number) => {
    try {
      const res = await api.get(`/chat/conversations/${convId}/messages/`);
      const msgs: Message[] = res.data.results || res.data || [];
      setMessages(msgs);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  }, []);

  // 3. WebSocket ulanishi — login/token o'zgarganda bir marta ulanadi.
  //    Suhbat almashganda qayta ulanmaydi, shu sababli qo'ng'iroq signallari yo'qolmaydi.
  useEffect(() => {
    if (!isLoggedIn) return;

    const token = accessToken || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : '');
    if (!token) return;

    // WebSocket URL aniqlash.
    // Ustuvorlik: aniq NEXT_PUBLIC_WS_URL -> NEXT_PUBLIC_API_URL hosti -> joriy domen.
    // `server.js` (custom server) `/ws/*` WebSocket ulanishlarini Django'ga proxy qiladi,
    // shu sababli bir xil domendagi manzil ham dev, ham production'da ishlaydi.
    const wsUrl = (() => {
      const explicit = (process.env.NEXT_PUBLIC_WS_URL || '').trim();
      const sameOrigin = () => {
        const loc = typeof window !== 'undefined' ? window.location : null;
        const proto = loc && loc.protocol === 'https:' ? 'wss' : 'ws';
        const host = loc ? loc.host : '127.0.0.1:8000';
        return `${proto}://${host}/ws/chat/?token=${token}`;
      };
      if (explicit) {
        // Berilgan manzil to'liq yo'lni o'z ichiga olmasa, standart yo'lni qo'shamiz
        let base = explicit.replace(/\/+$/, '');
        if (!/\/ws\//.test(base)) base = `${base}/ws/chat/`;
        else if (!base.endsWith('/')) base = `${base}/`;
        const sep = base.includes('?') ? '&' : '?';
        return `${base}${sep}token=${token}`;
      }
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || '').trim();
      if (/^https?:\/\//i.test(apiUrl)) {
        // Mutlaq API manzilidan hostni olib, WebSocket manzilini yasaymiz
        try {
          const u = new URL(apiUrl);
          const wsProto = u.protocol === 'https:' ? 'wss' : 'ws';
          return `${wsProto}://${u.host}/ws/chat/?token=${token}`;
        } catch {
          return sameOrigin();
        }
      }
      // Nisbiy yoki bo'sh manzil -> joriy domen (server.js proxy qiladi)
      return sameOrigin();
    })();

    let socket: WebSocket | null = null;
    let stopped = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      try {
        socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => setWsConnected(true);

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'message') {
              const newMsg: Message = data.data;
              if (newMsg.conversation === activeConvIdRef.current) {
                setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
              }
              // Suhbatlar ro'yxatida oxirgi xabarni yangilash
              setConversations((prev) =>
                prev.map((c) => (c.id === newMsg.conversation ? { ...c, last_message: newMsg } : c))
              );
            } else if (data.type === 'call_signal') {
              signalHandlerRef.current?.(data.data);
            }
          } catch (e) {
            console.error('Error parsing WS message:', e);
          }
        };

        socket.onerror = () => setWsConnected(false);

        socket.onclose = () => {
          setWsConnected(false);
          // Kutilmagan uzilishda avtomatik qayta ulanish (tarmoq barqarorligi)
          if (!stopped) reconnectTimer = setTimeout(connect, 3000);
        };
      } catch (err) {
        console.warn('WebSocket connection failed, retrying...');
        setWsConnected(false);
        if (!stopped) reconnectTimer = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
      socketRef.current = null;
      setWsConnected(false);
    };
  }, [isLoggedIn, accessToken]);

  // 4. Faol suhbat xabarlarini yuklash (+ WebSocket uzilganda HTTP polling fallback)
  useEffect(() => {
    if (!isLoggedIn || !activeConv) return;
    loadMessages(activeConv.id);
    const interval = setInterval(() => loadMessages(activeConv.id), 4000);
    return () => clearInterval(interval);
  }, [activeConv, isLoggedIn, loadMessages]);

  // 5. Faol suhbat id sini ref da saqlash (WS callback uchun)
  useEffect(() => {
    activeConvIdRef.current = activeConv?.id ?? null;
  }, [activeConv]);

  // 6. Media oqimlarini video/audio elementlarga ulash
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current && localVideoRef.current.srcObject !== localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
    if (remoteVideoRef.current && remoteStreamRef.current && remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }
    if (remoteAudioRef.current && remoteStreamRef.current && remoteAudioRef.current.srcObject !== remoteStreamRef.current) {
      remoteAudioRef.current.srcObject = remoteStreamRef.current;
    }
  }, [callState, callType]);

  // ── Suhbatdoshni aniqlash yordamchilari ──────────────────────
  const getRecipient = (conv: Conversation): Participant | undefined => {
    return conv.participants.find((p) => p.id !== user?.id) || conv.participants[0];
  };

  const getRecipientName = (conv: Conversation) => {
    const r = getRecipient(conv);
    if (!r) return 'Muloqotdosh';
    const fullName = `${r.first_name || ''} ${r.last_name || ''}`.trim();
    return fullName || r.username || 'Foydalanuvchi';
  };

  const activeRecipient = activeConv ? getRecipient(activeConv) : null;

  // Auto-scroll messages — faqat chat box ichida, butun sahifani emas
  useEffect(() => {
    const el = chatEndRef.current;
    if (!el) return;
    const parent = el.parentElement;
    if (parent) {
      parent.scrollTop = parent.scrollHeight;
    }
  }, [messages]);

  // 4. Send Message (WebSocket + HTTP Fallback)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = inputMessage.trim();
    if (!content || !activeConv || isSending) return;

    setIsSending(true);
    setInputMessage('');

    // Agar WebSocket ochiq bo'lsa, u orqali yuborish
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        action: 'message',
        conversation_id: activeConv.id,
        content: content,
        message_type: 'text'
      }));
      setIsSending(false);
    } else {
      // WebSocket yo'q yoki uzilgan bo'lsa, HTTP API orqali yuborish
      try {
        const res = await api.post(`/chat/conversations/${activeConv.id}/send_message/`, {
          content: content,
          message_type: 'text'
        });
        const savedMsg = res.data;
        setMessages((prev) => [...prev, savedMsg]);
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConv.id ? { ...c, last_message: savedMsg } : c))
        );
      } catch (err) {
        console.error('Error sending message via HTTP:', err);
      } finally {
        setIsSending(false);
      }
    }
  };

  // 4.1 Send File (Image, Video, Document)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'document') => {
    const file = e.target.files?.[0];
    if (!file || !activeConv || uploadingFile) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('message_type', type);
    formData.append('content', file.name);

    try {
      const res = await api.post(`/chat/conversations/${activeConv.id}/send_message/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const savedMsg = res.data;
      setMessages((prev) => [...prev, savedMsg]);
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConv.id ? { ...c, last_message: savedMsg } : c))
      );
    } catch (err: any) {
      console.error('Error uploading file:', err);
      alert(err.response?.data?.error || "Faylni yuborishda xatolik yuz berdi");
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  // 4.2 Send Location
  const handleSendLocation = () => {
    if (!activeConv || locationLoading) return;
    if (!navigator.geolocation) {
      alert("Brauzeringiz geolokatsiyani qo'llab-quvvatlamaydi");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await api.post(`/chat/conversations/${activeConv.id}/send_message/`, {
            content: `Joylashuv: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
            message_type: 'location',
            latitude,
            longitude,
          });
          const savedMsg = res.data;
          setMessages((prev) => [...prev, savedMsg]);
          setConversations((prev) =>
            prev.map((c) => (c.id === activeConv.id ? { ...c, last_message: savedMsg } : c))
          );
        } catch (err: any) {
          console.error('Error sending location:', err);
          alert(err.response?.data?.error || "Lokatsiyani yuborishda xatolik yuz berdi");
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocationLoading(false);
        alert("Joylashuvingizni aniqlab bo'lmadi. Iltimos, brauzerda geolokatsiya ruxsatini tekshiring.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // 5. Search & Load Users for New Chat
  const loadUsers = async (search = '') => {
    setLoadingUsers(true);
    try {
      const res = await api.get('/chat/conversations/users/', { params: { search } });
      setAvailableUsers(res.data.results || res.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleOpenNewChat = () => {
    setShowNewChatModal(true);
    loadUsers('');
  };

  const handleStartConversationWith = async (targetUser: Participant) => {
    try {
      const res = await api.post('/chat/conversations/', { recipient_id: targetUser.id });
      const convData: Conversation = res.data;
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === convData.id);
        if (exists) return prev;
        return [convData, ...prev];
      });
      setActiveConv(convData);
      setShowNewChatModal(false);
    } catch (err) {
      console.error('Failed to start conversation:', err);
    }
  };

  // ══════════ QO'NG'IROQ (WebRTC) LOGIKASI ══════════

  const updateCallState = (s: CallState) => {
    callStateRef.current = s;
    setCallState(s);
  };

  const sendCallSignal = (payload: Record<string, unknown>): boolean => {
    const s = socketRef.current;
    if (s && s.readyState === WebSocket.OPEN) {
      s.send(JSON.stringify({ action: 'call_signal', ...payload }));
      return true;
    }
    return false;
  };

  const startDurationTimer = () => {
    if (durationTimerRef.current) return;
    setCallDuration(0);
    durationTimerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
  };

  const flushPendingCandidates = async () => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription) return;
    const queued = pendingCandidatesRef.current;
    pendingCandidatesRef.current = [];
    for (const c of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch {
        /* ba'zi ICE nomzodlar eskirgan bo'lishi mumkin */
      }
    }
  };

  const cleanupCall = (notifyPeer = false) => {
    if (notifyPeer && peerIdRef.current != null) {
      sendCallSignal({ recipient_id: peerIdRef.current, signal_type: 'end-call', call_type: callTypeRef.current });
    }
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (pcRef.current) {
      try {
        pcRef.current.onicecandidate = null;
        pcRef.current.ontrack = null;
        pcRef.current.onconnectionstatechange = null;
        pcRef.current.close();
      } catch {
        /* e'tiborsiz */
      }
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    remoteStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    pendingCandidatesRef.current = [];
    incomingOfferRef.current = null;
    peerIdRef.current = null;
    isCallerRef.current = false;
    setIsMuted(false);
    setIsCamOff(false);
    setCallDuration(0);
    setCallError(null);
    setCallPeer(null);
    updateCallState('idle');
  };

  const createPeerConnection = (remoteId: number): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendCallSignal({
          recipient_id: remoteId,
          signal_type: 'ice-candidate',
          call_type: callTypeRef.current,
          signal_data: e.candidate.toJSON(),
        });
      }
    };

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      if (!stream) return;
      remoteStreamRef.current = stream;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = stream;
    };

    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      if (st === 'connected') {
        updateCallState('connected');
        startDurationTimer();
      } else if (st === 'failed') {
        setCallError("Aloqa uzildi (tarmoq muammosi).");
        setTimeout(() => cleanupCall(false), 2500);
      }
    };

    // ICE qayta ishga tushirish — tarmoq o'zgarganda aloqani tiklashga yordam beradi
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        try {
          pc.restartIce();
        } catch {
          /* e'tiborsiz */
        }
      }
    };

    return pc;
  };

  const getLocalStream = async (type: CallType): Promise<MediaStream> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      throw new Error("Brauzeringiz media qurilmalarini qo'llab-quvvatlamaydi.");
    }
    const constraints: MediaStreamConstraints = type === 'video'
      ? { audio: true, video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } }
      : { audio: true, video: false };
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
        throw new Error('Kamera va mikrofon uchun ruxsat berilmadi.');
      }
      if (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') {
        if (type === 'video') {
          // Kamera topilmasa — faqat ovozli rejimda davom etamiz
          return await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        }
        throw new Error('Mikrofon yoki kamera topilmadi.');
      }
      if (err?.name === 'NotReadableError') {
        throw new Error('Kamera yoki mikrofon boshqa dasturda band.');
      }
      throw new Error("Media qurilmalarini ishga tushirib bo'lmadi.");
    }
  };

  // WebSocket orqali kelgan signalizatsiya xabarini qayta ishlash
  const handleCallSignal = (sig: any) => {
    if (!sig || !sig.signal_type) return;
    const fromId: number = sig.caller_id;
    const type: string = sig.signal_type;
    const incomingType: CallType = sig.call_type === 'video' ? 'video' : 'audio';

    if (type === 'offer') {
      // Allaqachon qo'ng'iroqda bo'lsak — band deb javob qaytaramiz
      if (callStateRef.current !== 'idle') {
        sendCallSignal({ recipient_id: fromId, signal_type: 'busy', call_type: incomingType });
        return;
      }
      peerIdRef.current = fromId;
      isCallerRef.current = false;
      callTypeRef.current = incomingType;
      incomingOfferRef.current = sig.signal_data;
      setCallType(incomingType);
      setCallPeer({ id: fromId, name: sig.caller_name || 'Foydalanuvchi', avatar: sig.caller_avatar });
      setCallError(null);
      updateCallState('incoming');
      return;
    }

    // Qolgan signallarni faqat joriy qo'ng'iroq ishtirokchisidan qabul qilamiz
    if (fromId !== peerIdRef.current) return;

    if (type === 'answer') {
      const pc = pcRef.current;
      if (pc && isCallerRef.current && sig.signal_data) {
        pc.setRemoteDescription(new RTCSessionDescription(sig.signal_data))
          .then(flushPendingCandidates)
          .catch(() => setCallError("Aloqa o'rnatilmadi."));
      }
      return;
    }

    if (type === 'ice-candidate') {
      if (!sig.signal_data) return;
      const pc = pcRef.current;
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        pc.addIceCandidate(new RTCIceCandidate(sig.signal_data)).catch(() => { /* e'tiborsiz */ });
      } else {
        // Masofaviy tavsif hali o'rnatilmagan — nomzodlarni navbatga qo'yamiz
        pendingCandidatesRef.current.push(sig.signal_data);
      }
      return;
    }

    if (type === 'end-call') {
      setCallError("Qo'ng'iroq tugatildi.");
      cleanupCall(false);
      return;
    }

    if (type === 'reject') {
      setCallError("Qo'ng'iroq rad etildi.");
      setTimeout(() => cleanupCall(false), 2000);
      return;
    }

    if (type === 'busy') {
      setCallError('Foydalanuvchi hozir band.');
      setTimeout(() => cleanupCall(false), 2000);
      return;
    }
  };

  // Eng so'nggi signal ishlovchisini ref ga yozib qo'yamiz (WS callback uchun)
  useEffect(() => {
    signalHandlerRef.current = handleCallSignal;
  });

  // Chiquvchi qo'ng'iroqni boshlash
  const startCall = async (type: CallType) => {
    if (callStateRef.current !== 'idle' || !activeConv) return;
    const recipient = getRecipient(activeConv);
    if (!recipient) return;

    callTypeRef.current = type;
    peerIdRef.current = recipient.id;
    isCallerRef.current = true;
    setCallType(type);
    setCallPeer({ id: recipient.id, name: getRecipientName(activeConv), avatar: recipient.avatar });
    setCallError(null);
    updateCallState('outgoing');

    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setCallError("Server bilan aloqa yo'q. Qo'ng'iroqni amalga oshirib bo'lmaydi.");
      setTimeout(() => cleanupCall(false), 3000);
      return;
    }

    try {
      const stream = await getLocalStream(type);
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = createPeerConnection(recipient.id);
      pcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: type === 'video',
      });
      await pc.setLocalDescription(offer);
      sendCallSignal({
        recipient_id: recipient.id,
        signal_type: 'offer',
        call_type: type,
        signal_data: pc.localDescription,
      });
    } catch (err: any) {
      setCallError(err.message || "Qo'ng'iroqni boshlab bo'lmadi.");
      setTimeout(() => cleanupCall(false), 4000);
    }
  };

  // Kiruvchi qo'ng'iroqqa javob berish
  const acceptCall = async () => {
    const offer = incomingOfferRef.current;
    const remoteId = peerIdRef.current;
    if (!offer || remoteId == null) return;

    updateCallState('connecting');
    try {
      const stream = await getLocalStream(callTypeRef.current);
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = createPeerConnection(remoteId);
      pcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await flushPendingCandidates();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendCallSignal({
        recipient_id: remoteId,
        signal_type: 'answer',
        call_type: callTypeRef.current,
        signal_data: pc.localDescription,
      });
      // 'connected' holati onconnectionstatechange orqali o'rnatiladi
    } catch (err: any) {
      setCallError(err.message || "Qo'ng'iroqqa javob berib bo'lmadi.");
      setTimeout(() => cleanupCall(true), 3000);
    }
  };

  // Kiruvchi qo'ng'iroqni rad etish
  const rejectCall = () => {
    if (peerIdRef.current != null) {
      sendCallSignal({ recipient_id: peerIdRef.current, signal_type: 'reject', call_type: callTypeRef.current });
    }
    cleanupCall(false);
  };

  // Qo'ng'iroqni tugatish
  const endCall = () => cleanupCall(true);

  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !isMuted;
    stream.getAudioTracks().forEach((t) => { t.enabled = !next; });
    setIsMuted(next);
  };

  const toggleCam = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !isCamOff;
    stream.getVideoTracks().forEach((t) => { t.enabled = !next; });
    setIsCamOff(next);
  };

  // Sahifadan chiqilganda qo'ng'iroq resurslarini bo'shatish
  useEffect(() => {
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      if (pcRef.current) {
        try {
          pcRef.current.close();
        } catch {
          /* e'tiborsiz */
        }
      }
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (!isLoggedIn) {
    return (
      <div className="card rounded-3xl p-12 text-center max-w-md mx-auto my-12 flex flex-col items-center gap-4 border border-[var(--border)]">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
          <MessageSquare size={32} />
        </div>
        <h2 className="text-2xl font-black text-[var(--text)]">Chatdan foydalanish</h2>
        <p className="text-xs text-[var(--text-3)]">
          Foydalanuvchilar, sotuvchilar va ustalar bilan xabar almashish uchun avval tizimga kiring.
        </p>
        <Link href="/login" className="btn btn-primary px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20">
          Kirish / Ro&apos;yxatdan o&apos;tish
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 h-[calc(100vh-140px)] min-h-[580px]">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 h-full overflow-hidden">

        {/* ══════════ CHAP PANEL: SUHBATLAR RO'YXATI ══════════ */}
        <div className="card rounded-3xl p-4 flex flex-col gap-3 h-full overflow-hidden border border-[var(--border)] bg-[var(--surface)]">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <MessageSquare className="text-blue-500" size={20} />
              <h2 className="font-extrabold text-[var(--text)] text-base">Xabarlar</h2>
              {conversations.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold">
                  {conversations.length}
                </span>
              )}
            </div>
            <button
              onClick={handleOpenNewChat}
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow-md transition"
              title="Yangi suhbat boshlash"
            >
              <Plus size={14} /> Yangi
            </button>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1">
            {conversations.length === 0 ? (
              <div className="text-center py-16 text-[var(--text-3)] text-xs flex flex-col items-center gap-3">
                <MessageSquare size={36} className="opacity-30" />
                <p>Hozircha suhbatlar mavjud emas.</p>
                <button
                  onClick={handleOpenNewChat}
                  className="btn btn-outline text-xs px-4 py-2 rounded-xl"
                >
                  Birinchi suhbatni boshlang
                </button>
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = activeConv?.id === conv.id;
                const rec = getRecipient(conv);
                const recName = getRecipientName(conv);

                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConv(conv)}
                    className={`p-3 rounded-2xl flex items-center gap-3 transition-all text-left relative ${
                      isActive
                        ? 'bg-blue-500/10 border border-blue-500/30 shadow-sm'
                        : 'hover:bg-[var(--bg-2)] border border-transparent'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-zinc-800 shrink-0 border border-[var(--border)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={rec?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'}
                        alt={recName}
                        className="w-full h-full object-cover"
                      />
                      {rec?.is_online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[var(--surface)]" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-[var(--text)] truncate">{recName}</span>
                        {conv.last_message && (
                          <span className="text-[10px] text-[var(--text-3)] shrink-0">
                            {new Date(conv.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      {/* Property topic */}
                      {conv.property_detail && (
                        <span className="text-[10px] text-blue-500 truncate block mt-0.5 font-medium">
                          🏠 {conv.property_detail.title}
                        </span>
                      )}

                      {/* Last message preview */}
                      <p className="text-[11px] text-[var(--text-3)] truncate mt-0.5">
                        {conv.last_message ? conv.last_message.content : 'Suhbat boshlangan'}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {conv.unread_count > 0 && (
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ══════════ O'NG PANEL: ASOSIY CHAT OYNASI ══════════ */}
        <div className="lg:col-span-3 card rounded-3xl flex flex-col justify-between overflow-hidden relative border border-[var(--border)] bg-[var(--surface)] h-full">
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 sm:p-4 border-b border-[var(--border)] flex flex-wrap justify-between items-center gap-2 bg-[var(--surface)]">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-2xl overflow-hidden bg-zinc-800 shrink-0 border border-[var(--border)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeRecipient?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                    {activeRecipient?.is_online && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[var(--surface)]" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[var(--text)] text-sm flex items-center gap-2">
                      {getRecipientName(activeConv)}
                      {activeRecipient?.profession_display && (
                        <span className="text-[10px] font-normal text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
                          {activeRecipient.profession_display}
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-[var(--text-3)] mt-0.5">
                      {wsConnected ? (
                        <span className="flex items-center gap-1 text-emerald-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Real-time faol
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Avtomatik sinxronlash
                        </span>
                      )}
                      {activeConv.property_detail && (
                        <span className="truncate max-w-[200px]">
                          • Mulk: {activeConv.property_detail.title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right controls: Messenger Redirect Links + Call Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Telegram Redirect */}
                  {(() => {
                    const tg = activeRecipient?.telegram || activeRecipient?.username;
                    const tgUrl = tg ? `https://t.me/${tg.replace('@', '').replace('https://t.me/', '')}` : null;
                    return tgUrl ? (
                      <a
                        href={tgUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20 text-xs font-bold hover:bg-sky-100 transition-all shadow-sm"
                        title="Telegram orqali suhbatlashish"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" /> Telegram
                        <ArrowUpRight size={11} />
                      </a>
                    ) : null;
                  })()}

                  {/* WhatsApp Redirect */}
                  {(() => {
                    const waRaw = activeRecipient?.whatsapp || activeRecipient?.phone;
                    const waClean = waRaw ? waRaw.replace(/[^0-9]/g, '') : null;
                    return waClean ? (
                      <a
                        href={`https://wa.me/${waClean}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-xs font-bold hover:bg-emerald-100 transition-all shadow-sm"
                        title="WhatsApp orqali suhbatlashish"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> WhatsApp
                        <ArrowUpRight size={11} />
                      </a>
                    ) : null;
                  })()}

                  {/* Instagram Redirect */}
                  {(() => {
                    const ig = activeRecipient?.instagram;
                    const igUrl = ig ? `https://instagram.com/${ig.replace('@', '').replace('https://instagram.com/', '')}` : null;
                    return igUrl ? (
                      <a
                        href={igUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-500/20 text-xs font-bold hover:bg-pink-100 transition-all shadow-sm"
                        title="Instagram profilini ko'rish"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500" /> Instagram
                        <ArrowUpRight size={11} />
                      </a>
                    ) : null;
                  })()}

                  <button
                    onClick={() => startCall('audio')}
                    className="p-2 rounded-xl bg-[var(--bg-2)] hover:bg-blue-500/10 hover:text-blue-500 text-[var(--text-2)] border border-[var(--border)] transition"
                    title="Ovozli qo'ng'iroq"
                  >
                    <Phone size={15} />
                  </button>
                  <button
                    onClick={() => startCall('video')}
                    className="p-2 rounded-xl bg-[var(--bg-2)] hover:bg-purple-500/10 hover:text-purple-500 text-[var(--text-2)] border border-[var(--border)] transition"
                    title="Video qo'ng'iroq"
                  >
                    <Video size={15} />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="p-4 sm:p-6 flex-1 overflow-y-auto flex flex-col gap-3 bg-[var(--bg-2)]/40">
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-3)] text-xs gap-2 py-10">
                    <Sparkles size={28} className="text-amber-500 opacity-60" />
                    <p className="font-semibold text-sm">Suhbat boshlandi!</p>
                    <p>Birinchi xabaringizni yozib salomlashing.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender === user?.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col gap-1 max-w-[85%] sm:max-w-[75%] ${
                          isMine ? 'self-end items-end' : 'self-start items-start'
                        }`}
                      >
                        {!isMine && (
                          <span className="text-[10px] text-[var(--text-3)] px-1">
                            {msg.sender_name}
                          </span>
                        )}
                        <div
                          className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
                            isMine
                              ? 'bg-blue-600 text-white rounded-tr-none'
                              : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-tl-none'
                          }`}
                        >
                          {/* Image message */}
                          {msg.message_type === 'image' && (
                            <div className="flex flex-col gap-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={msg.file_url || msg.file || ''}
                                alt="Rasm"
                                onClick={() => window.open(msg.file_url || msg.file || '', '_blank')}
                                className="max-w-xs sm:max-w-sm max-h-72 rounded-xl object-cover cursor-pointer hover:opacity-95 transition-opacity border border-white/10"
                              />
                              {msg.content && msg.content !== msg.file_name && (
                                <p className="text-xs">{msg.content}</p>
                              )}
                            </div>
                          )}

                          {/* Video message */}
                          {msg.message_type === 'video' && (
                            <div className="flex flex-col gap-2">
                              <video
                                src={msg.file_url || msg.file || ''}
                                controls
                                className="max-w-xs sm:max-w-sm max-h-72 rounded-xl bg-black border border-white/10"
                              />
                              {msg.content && msg.content !== msg.file_name && (
                                <p className="text-xs">{msg.content}</p>
                              )}
                            </div>
                          )}

                          {/* Document message */}
                          {msg.message_type === 'document' && (
                            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/10 dark:bg-white/10 max-w-xs sm:max-w-sm">
                              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                                <FileText size={20} className={isMine ? 'text-white' : 'text-blue-500'} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-xs truncate">{msg.file_name || msg.content || 'Hujjat'}</p>
                                {msg.file_size && (
                                  <p className="text-[10px] opacity-75">
                                    {(msg.file_size / 1024).toFixed(1)} KB
                                  </p>
                                )}
                              </div>
                              {msg.file_url && (
                                <a
                                  href={msg.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all shrink-0"
                                  title="Yuklab olish"
                                >
                                  <Download size={14} />
                                </a>
                              )}
                            </div>
                          )}

                          {/* Location message */}
                          {msg.message_type === 'location' && (
                            <div className="flex flex-col gap-2 p-1 min-w-[180px]">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center shrink-0">
                                  <MapPin size={18} className="text-rose-500" />
                                </div>
                                <div>
                                  <p className="font-bold text-xs">Lokatsiya</p>
                                  <p className="text-[10px] opacity-80">{msg.content || 'Geolokatsiya nuqtasi'}</p>
                                </div>
                              </div>
                              {msg.latitude && msg.longitude && (
                                <a
                                  href={`https://www.google.com/maps?q=${msg.latitude},${msg.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold transition-all mt-1"
                                >
                                  Xaritada ochish <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                          )}

                          {/* Text message */}
                          {(!msg.message_type || msg.message_type === 'text') && (
                            <p>{msg.content}</p>
                          )}

                          <div
                            className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${
                              isMine ? 'text-blue-100' : 'text-[var(--text-3)]'
                            }`}
                          >
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMine && <CheckCheck size={11} />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Hidden File Inputs */}
              <input
                type="file"
                ref={imageInputRef}
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'image')}
                className="hidden"
              />
              <input
                type="file"
                ref={videoInputRef}
                accept="video/*"
                onChange={(e) => handleFileUpload(e, 'video')}
                className="hidden"
              />
              <input
                type="file"
                ref={docInputRef}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt"
                onChange={(e) => handleFileUpload(e, 'document')}
                className="hidden"
              />

              {/* Message Input Box */}
              <div className="p-3 sm:p-4 border-t border-[var(--border)] bg-[var(--surface)] flex flex-col gap-2">
                {(uploadingFile || locationLoading) && (
                  <div className="flex items-center gap-2 text-xs text-blue-500 font-semibold px-2 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                    {uploadingFile ? "Fayl yuklanmoqda va yuborilmoqda..." : "Lokatsiya aniqlanmoqda..."}
                  </div>
                )}

                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-2"
                >
                  {/* Action buttons: Image, Video, Document, Location */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={uploadingFile || isSending}
                      onClick={() => imageInputRef.current?.click()}
                      className="p-2.5 rounded-xl bg-[var(--bg-2)] hover:bg-blue-500/10 hover:text-blue-500 text-[var(--text-3)] border border-[var(--border)] transition disabled:opacity-50"
                      title="Rasm yuborish"
                    >
                      <ImageIcon size={17} />
                    </button>
                    <button
                      type="button"
                      disabled={uploadingFile || isSending}
                      onClick={() => videoInputRef.current?.click()}
                      className="p-2.5 rounded-xl bg-[var(--bg-2)] hover:bg-purple-500/10 hover:text-purple-500 text-[var(--text-3)] border border-[var(--border)] transition disabled:opacity-50"
                      title="Video yuborish"
                    >
                      <Film size={17} />
                    </button>
                    <button
                      type="button"
                      disabled={uploadingFile || isSending}
                      onClick={() => docInputRef.current?.click()}
                      className="p-2.5 rounded-xl bg-[var(--bg-2)] hover:bg-amber-500/10 hover:text-amber-500 text-[var(--text-3)] border border-[var(--border)] transition disabled:opacity-50"
                      title="Hujjat (PDF, Word, Zip) yuborish"
                    >
                      <Paperclip size={17} />
                    </button>
                    <button
                      type="button"
                      disabled={locationLoading || isSending}
                      onClick={handleSendLocation}
                      className="p-2.5 rounded-xl bg-[var(--bg-2)] hover:bg-rose-500/10 hover:text-rose-500 text-[var(--text-3)] border border-[var(--border)] transition disabled:opacity-50"
                      title="Lokatsiya (joylashuv) yuborish"
                    >
                      <MapPin size={17} />
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Xabarni yozing..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    className="glass-input flex-1 px-4 py-3 rounded-2xl text-xs sm:text-sm"
                    disabled={isSending || uploadingFile}
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isSending || uploadingFile}
                    className="p-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-all shadow-md shadow-blue-500/20 shrink-0"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-3)] gap-4 p-8">
              <div className="w-16 h-16 rounded-3xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <MessageSquare size={32} />
              </div>
              <div className="text-center max-w-sm">
                <h3 className="font-extrabold text-[var(--text)] text-lg">Suhbat tanlanmagan</h3>
                <p className="text-xs text-[var(--text-3)] mt-1 leading-relaxed">
                  Chap tarafdagi ro&apos;yxatdan suhbatni tanlang yoki yangi foydalanuvchi bilan muloqot boshlang.
                </p>
                <button
                  onClick={handleOpenNewChat}
                  className="btn btn-primary px-5 py-2.5 rounded-xl text-xs font-bold mt-4 inline-flex items-center gap-1.5 shadow-lg shadow-blue-500/20"
                >
                  <Plus size={15} /> Yangi suhbat ochish
                </button>
              </div>
            </div>
          )}

          {/* ══════════ QO'NG'IROQ MODALI (WebRTC) ══════════ */}
          {callState !== 'idle' && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 animate-fadeIn">
              {/* Masofaviy ovoz (audio-only qo'ng'iroqlar uchun) */}
              <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

              <div className="flex flex-col items-center gap-5 text-center max-w-md w-full">
                {/* Video ko'rinish — faqat video qo'ng'iroqda va ulanish bosqichida */}
                {callType === 'video' && (callState === 'connected' || callState === 'connecting') ? (
                  <div className="relative w-full aspect-video rounded-2xl bg-zinc-900 border border-white/10 overflow-hidden shadow-2xl">
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover bg-zinc-900"
                    />
                    {/* Mahalliy kamera ko'rinishi (kichik oyna) */}
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute bottom-3 right-3 w-28 h-20 rounded-xl object-cover border border-white/20 bg-black/60 shadow-lg"
                    />
                    {isCamOff && (
                      <div className="absolute bottom-3 right-3 w-28 h-20 rounded-xl bg-zinc-800/90 border border-white/20 flex items-center justify-center">
                        <VideoOff size={20} className="text-zinc-400" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-800 border-4 border-blue-500/40 animate-pulse">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={callPeer?.avatar || activeRecipient?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div>
                  <h4 className="font-black text-xl text-white">
                    {callPeer?.name || (activeConv ? getRecipientName(activeConv) : 'Muloqotdosh')}
                  </h4>
                  <p className="text-xs text-blue-400 mt-1 font-semibold flex items-center justify-center gap-1.5">
                    {callState === 'connected' ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        {formatDuration(callDuration)}
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                        {callState === 'outgoing' && "Qo'ng'iroq qilinmoqda..."}
                        {callState === 'incoming' && "Kiruvchi qo'ng'iroq..."}
                        {callState === 'connecting' && 'Ulanmoqda...'}
                      </>
                    )}
                  </p>
                  {callError && (
                    <p className="text-xs text-rose-400 mt-2 font-semibold flex items-center justify-center gap-1.5">
                      <AlertTriangle size={13} /> {callError}
                    </p>
                  )}
                </div>

                {/* Boshqaruv tugmalari */}
                <div className="flex items-center gap-4 mt-1">
                  {callState === 'incoming' ? (
                    <>
                      <button
                        onClick={rejectCall}
                        className="p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/40 hover:scale-110 transition-all"
                        title="Rad etish"
                      >
                        <PhoneOff size={24} />
                      </button>
                      <button
                        onClick={acceptCall}
                        className="p-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/40 hover:scale-110 transition-all animate-bounce"
                        title="Qabul qilish"
                      >
                        <PhoneIncoming size={24} />
                      </button>
                    </>
                  ) : (
                    <>
                      {callState === 'connected' && callType === 'video' && (
                        <button
                          onClick={toggleCam}
                          className={`p-3.5 rounded-full text-white shadow-lg transition-all hover:scale-110 ${
                            isCamOff ? 'bg-zinc-600 hover:bg-zinc-500' : 'bg-white/15 hover:bg-white/25'
                          }`}
                          title={isCamOff ? "Kamerani yoqish" : "Kamerani o'chirish"}
                        >
                          {isCamOff ? <VideoOff size={22} /> : <Video size={22} />}
                        </button>
                      )}
                      {callState === 'connected' && (
                        <button
                          onClick={toggleMute}
                          className={`p-3.5 rounded-full text-white shadow-lg transition-all hover:scale-110 ${
                            isMuted ? 'bg-zinc-600 hover:bg-zinc-500' : 'bg-white/15 hover:bg-white/25'
                          }`}
                          title={isMuted ? "Ovozni yoqish" : "Ovozni o'chirish"}
                        >
                          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                        </button>
                      )}
                      <button
                        onClick={endCall}
                        className="p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/40 hover:scale-110 transition-all"
                        title="Qo'ng'iroqni tugatish"
                      >
                        <PhoneOff size={24} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════ YANGI SUHBAT OCHISH MODALI ══════════ */}
      {showNewChatModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowNewChatModal(false)}
        >
          <div
            className="card rounded-3xl p-6 w-full max-w-md bg-[var(--surface)] border border-[var(--border)] shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <h3 className="font-extrabold text-[var(--text)] text-base flex items-center gap-2">
                <Plus size={18} className="text-blue-500" /> Yangi suhbat boshlash
              </h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="p-1 rounded-full text-[var(--text-3)] hover:text-[var(--text)]"
              >
                <X size={18} />
              </button>
            </div>

            {/* User Search Input */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
              <input
                type="text"
                placeholder="Foydalanuvchini ismi yoki kasbi bo'yicha qidiring..."
                value={userSearchQuery}
                onChange={(e) => {
                  setUserSearchQuery(e.target.value);
                  loadUsers(e.target.value);
                }}
                className="glass-input w-full pl-9 pr-3 py-2.5 rounded-xl text-xs"
              />
            </div>

            {/* Users list */}
            <div className="max-h-64 overflow-y-auto flex flex-col gap-2 pr-1">
              {loadingUsers ? (
                <div className="py-8 text-center text-xs text-[var(--text-3)]">Yuklanmoqda...</div>
              ) : availableUsers.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--text-3)]">
                  Foydalanuvchilar topilmadi.
                </div>
              ) : (
                availableUsers.map((u) => {
                  const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username;
                  return (
                    <button
                      key={u.id}
                      onClick={() => handleStartConversationWith(u)}
                      className="p-3 rounded-2xl flex items-center justify-between gap-3 bg-[var(--bg-2)] hover:bg-blue-500/10 hover:border-blue-500/30 border border-transparent transition text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl overflow-hidden bg-zinc-800 shrink-0 border border-[var(--border)]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                            alt={name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-[var(--text)]">{name}</p>
                          <span className="text-[10px] text-blue-500 font-semibold">
                            {u.profession_display || 'Foydalanuvchi'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-500/10 px-2.5 py-1 rounded-xl">
                        Yozish →
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Chat() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[var(--text-3)] font-bold text-sm">Chat yuklanmoqda...</div>}>
      <ChatContent />
    </Suspense>
  );
}
