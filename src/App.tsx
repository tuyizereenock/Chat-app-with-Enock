import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import {
  ArrowLeft,
  CheckCheck,
  Download,
  Image,
  LogOut,
  MessageCircle,
  Mic,
  Moon,
  MoreVertical,
  Phone,
  Paperclip,
  Plus,
  Search,
  Send,
  Smile,
  Square,
  Sun,
  UserRound,
  Users,
  Video,
  X,
} from 'lucide-react'
import { supabase, supabaseConfig } from './lib/supabase'

type Profile = {
  id: string
  display_name: string
  avatar_url: string | null
}

type Conversation = {
  id: string
  title: string
  is_group: boolean
  created_at: string
  updated_at: string
  receiver: Profile | null
  memberIds: string[]
}

type ConversationRow = Omit<Conversation, 'receiver' | 'memberIds'> & {
  conversation_members:
    | {
        user_id: string
        profiles: Profile | Profile[] | null
      }[]
    | null
}

type Message = {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  attachment_url: string | null
  attachment_name: string | null
  attachment_type: string | null
  read_at: string | null
  created_at: string
  profiles: Pick<Profile, 'display_name' | 'avatar_url'> | null
}

type MessageRow = Omit<Message, 'profiles'> & {
  profiles:
    | Pick<Profile, 'display_name' | 'avatar_url'>
    | Pick<Profile, 'display_name' | 'avatar_url'>[]
    | null
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function initials(name: string) {
  return name
    .split(/[\s_]/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function Avatar({
  src,
  name,
  size = 'md',
}: {
  src?: string | null
  name: string
  size?: 'sm' | 'md'
}) {
  const className = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-12 w-12 text-sm'

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${className} shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-slate-950`}
      />
    )
  }

  return (
    <span
      className={`${className} grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-sky-500 font-semibold text-white ring-2 ring-white dark:ring-slate-950`}
    >
      {initials(name || 'User')}
    </span>
  )
}

function SetupNotice() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5 text-slate-900">
      <section className="w-full max-w-md rounded-md border border-slate-200 bg-white p-6">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-600 text-white">
          <MessageCircle size={24} />
        </div>
        <h1 className="mt-5 text-xl font-bold">Supabase key needed</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Add your public anon key to a local environment file before starting
          the app.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-md bg-slate-950 p-4 text-xs text-slate-100">
          VITE_SUPABASE_URL={supabaseConfig.url}
          {'\n'}VITE_SUPABASE_ANON_KEY=your-public-anon-key
        </pre>
      </section>
    </main>
  )
}

function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return

    setSubmitting(true)
    setStatus('')

    const result =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { data: { display_name: displayName || email.split('@')[0] } },
          })

    if (result.error) {
      setStatus(result.error.message)
    } else if (mode === 'signup' && !result.data.session) {
      setStatus('Account created. Check your email to confirm your signup.')
    }

    setSubmitting(false)
  }

  return (
    <main className="grid min-h-screen bg-slate-50 text-slate-900 lg:grid-cols-[1fr_460px]">
      <section className="hidden bg-[url('/src/assets/hero.png')] bg-cover bg-center lg:block" />
      <section className="flex items-center justify-center px-5">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm rounded-md border border-slate-200 bg-white p-6"
        >
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-violet-600 text-white">
            <MessageCircle size={26} />
          </div>
          <h1 className="mt-6 text-2xl font-bold">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Login or signup to access your chat workspace.
          </p>

          {mode === 'signup' && (
            <label className="mt-6 block text-sm font-semibold">
              Display name
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-violet-500"
                placeholder="Your name"
              />
            </label>
          )}

          <label className="mt-4 block text-sm font-semibold">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-violet-500"
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="mt-4 block text-sm font-semibold">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-violet-500"
              placeholder="Minimum 6 characters"
              required
            />
          </label>

          {status && (
            <p className="mt-4 rounded-md bg-violet-50 px-3 py-2 text-sm text-violet-700">
              {status}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 h-11 w-full rounded-md bg-violet-600 font-semibold text-white disabled:opacity-60"
          >
            {submitting ? 'Please wait...' : mode === 'login' ? 'Login' : 'Signup'}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode((value) => (value === 'login' ? 'signup' : 'login'))
              setStatus('')
            }}
            className="mt-4 w-full text-sm font-semibold text-violet-600"
          >
            {mode === 'login'
              ? 'Need an account? Signup'
              : 'Already have an account? Login'}
          </button>
        </form>
      </section>
    </main>
  )
}

function ChatBubble({
  message,
  currentUserId,
  showSender,
}: {
  message: Message
  currentUserId: string
  showSender: boolean
}) {
  const mine = message.sender_id === currentUserId
  const senderName = mine ? 'You' : message.profiles?.display_name ?? 'User'
  const isImage = message.attachment_type?.startsWith('image/')
  const isAudio = message.attachment_type?.startsWith('audio/')

  return (
    <div className={`flex gap-3 ${mine ? 'justify-end' : 'justify-start'}`}>
      {!mine &&
        (showSender ? (
          <Avatar name={senderName} src={message.profiles?.avatar_url} size="sm" />
        ) : (
          <span className="h-8 w-8 shrink-0" />
        ))}
      <div className={mine ? 'text-right' : 'text-left'}>
        {showSender && (
          <p className="mb-1 text-xs font-semibold text-slate-500">
            {senderName}{' '}
            <span className="ml-2 font-normal">
              {formatTime(message.created_at)}
            </span>
          </p>
        )}
        <div
          className={`max-w-[520px] rounded-md px-3 py-2 text-sm leading-6 ${
            mine
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-200 dark:shadow-none'
              : 'bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300'
          }`}
        >
          {isImage && message.attachment_url && (
            <img
              src={message.attachment_url}
              alt={message.attachment_name ?? 'Attachment'}
              className="mb-3 max-h-72 rounded-md object-cover"
            />
          )}
          {message.attachment_url && !isImage && (
            isAudio ? (
              <audio src={message.attachment_url} controls className="mb-2 w-64 max-w-full" />
            ) : (
              <a
                href={message.attachment_url}
                target="_blank"
                rel="noreferrer"
                className={`mb-2 flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold ${
                  mine ? 'bg-white/15 text-white' : 'bg-white text-slate-600'
                }`}
              >
                <Download size={15} />
                <span className="truncate">{message.attachment_name}</span>
              </a>
            )
          )}
          {message.body}
          {mine && (
            <span className="ml-2 inline-flex align-middle">
              <CheckCheck
                size={14}
                className={message.read_at ? 'text-sky-300' : 'text-white/60'}
              />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function getConversationName(conversation: Conversation) {
  return conversation.is_group
    ? conversation.title
    : (conversation.receiver?.display_name ?? conversation.title)
}

function getConversationAvatar(conversation: Conversation) {
  return conversation.is_group ? null : (conversation.receiver?.avatar_url ?? null)
}

function ChatApp({ user }: { user: User }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [profileQuery, setProfileQuery] = useState('')
  const [startChatOpen, setStartChatOpen] = useState(false)
  const [groupOpen, setGroupOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [selectedGroupMemberIds, setSelectedGroupMemberIds] = useState<string[]>([])
  const [activeView, setActiveView] = useState<'chats' | 'people'>('chats')
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([])
  const [notice, setNotice] = useState('')
  const [callMode, setCallMode] = useState<'audio' | 'video' | null>(null)
  const [callStatus, setCallStatus] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [recording, setRecording] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const photoInputRef = useRef<HTMLInputElement | null>(null)
  const profilePhotoInputRef = useRef<HTMLInputElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<BlobPart[]>([])
  const [darkMode, setDarkMode] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeId) ?? null
  const activeConversationName = activeConversation
    ? getConversationName(activeConversation)
    : ''

  const filteredConversations = useMemo(
    () =>
      conversations.filter((conversation) =>
        getConversationName(conversation)
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [conversations, query],
  )

  const filteredProfiles = useMemo(
    () =>
      profiles.filter((item) =>
        item.display_name.toLowerCase().includes(profileQuery.toLowerCase()),
      ),
    [profiles, profileQuery],
  )
  const recentPeople = conversations
    .map((conversation) => conversation.receiver)
    .filter((item): item is Profile => Boolean(item))
    .slice(0, 6)
  const activeReceiverOnline = activeConversation?.receiver
    ? onlineUserIds.includes(activeConversation.receiver.id)
    : false

  async function loadProfile() {
    if (!supabase) return

    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      setError(profileError.message)
    } else if (!data) {
      const fallbackProfile = {
        id: user.id,
        display_name:
          user.user_metadata.display_name ?? user.email?.split('@')[0] ?? 'User',
        avatar_url: null,
      }
      const { data: createdProfile, error: createProfileError } = await supabase
        .from('profiles')
        .upsert(fallbackProfile)
        .select('id, display_name, avatar_url')
        .single()

      if (createProfileError) {
        setError(createProfileError.message)
      } else {
        setProfile(createdProfile)
      }
    } else {
      setProfile(data)
    }
  }

  async function loadConversations() {
    if (!supabase) return

    const { data, error: conversationError } = await supabase
      .from('conversations')
      .select(
        'id, title, is_group, created_at, updated_at, conversation_members(user_id, profiles:user_id(id, display_name, avatar_url))',
      )
      .order('updated_at', { ascending: false })

    if (conversationError) {
      setError(conversationError.message)
      return
    }

    const rows = (data ?? []) as unknown as ConversationRow[]
    const nextConversations = rows.map((conversation) => {
      const members = conversation.conversation_members ?? []
      const receiverMember =
        members.find((member) => member.user_id !== user.id) ?? members[0]
      const receiverProfiles = receiverMember?.profiles ?? null
      const receiver = Array.isArray(receiverProfiles)
        ? (receiverProfiles[0] ?? null)
        : receiverProfiles

      return {
        id: conversation.id,
        title: conversation.title,
        is_group: conversation.is_group,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        receiver,
        memberIds: members.map((member) => member.user_id),
      }
    })
    setConversations(nextConversations)
  }

  async function loadProfiles() {
    if (!supabase) return

    const { data, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .neq('id', user.id)
      .order('display_name', { ascending: true })

    if (profilesError) {
      setError(profilesError.message)
    } else {
      setProfiles(data ?? [])
    }
  }

  async function loadMessages(conversationId: string) {
    if (!supabase) return

    const { data, error: messageError } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, body, attachment_url, attachment_name, attachment_type, read_at, created_at, profiles:sender_id(display_name, avatar_url)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (messageError) {
      setError(messageError.message)
    } else {
      const rows = (data ?? []) as unknown as MessageRow[]
      setMessages(
        rows.map((message) => ({
          ...message,
          profiles: Array.isArray(message.profiles)
            ? (message.profiles[0] ?? null)
            : message.profiles,
        })),
      )
    }
  }

  async function loadUnreadCounts() {
    if (!supabase) return

    const { data, error: unreadError } = await supabase
      .from('messages')
      .select('conversation_id')
      .neq('sender_id', user.id)
      .is('read_at', null)

    if (unreadError) {
      setError(unreadError.message)
      return
    }

    const nextCounts = (data ?? []).reduce<Record<string, number>>((counts, item) => {
      counts[item.conversation_id] = (counts[item.conversation_id] ?? 0) + 1
      return counts
    }, {})

    setUnreadCounts(nextCounts)
  }

  async function markConversationRead(conversationId: string) {
    if (!supabase) return

    const { error: readError } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .is('read_at', null)

    if (readError) {
      setError(readError.message)
      return
    }

    setUnreadCounts((counts) => ({ ...counts, [conversationId]: 0 }))
    void loadMessages(conversationId)
  }

  async function createConversation(otherProfile: Profile) {
    if (!supabase || busy) return

    const existingConversation = conversations.find((conversation) =>
      conversation.memberIds.includes(otherProfile.id),
    )

    if (existingConversation) {
      setActiveView('chats')
      setStartChatOpen(false)
      setProfileQuery('')
      setActiveId(null)
      setMessages([])
      return
    }

    setBusy(true)
    setError('')

    const myName =
      profile?.display_name ??
      user.user_metadata.display_name ??
      user.email?.split('@')[0] ??
      'You'
    const title = `${myName}, ${otherProfile.display_name}`

    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({ title, created_by: user.id })
      .select('id, title, is_group, created_at, updated_at')
      .single()

    if (conversationError) {
      setError(conversationError.message)
      setBusy(false)
      return
    }

    const { error: memberError } = await supabase
      .from('conversation_members')
      .insert([
        { conversation_id: conversation.id, user_id: user.id },
        { conversation_id: conversation.id, user_id: otherProfile.id },
      ])

    if (memberError) {
      setError(memberError.message)
    } else {
      setConversations((items) => [
        {
          ...conversation,
          receiver: otherProfile,
          memberIds: [user.id, otherProfile.id],
        },
        ...items,
      ])
      setActiveId(null)
      setMessages([])
      setActiveView('chats')
      setStartChatOpen(false)
      setProfileQuery('')
    }

    setBusy(false)
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || !activeId || !draft.trim()) return

    const body = draft.trim()
    setDraft('')
    setError('')

    const { error: messageError } = await supabase.from('messages').insert({
      conversation_id: activeId,
      sender_id: user.id,
      body,
    })

    if (messageError) {
      setDraft(body)
      setError(messageError.message)
    } else {
      void loadMessages(activeId)
      void loadConversations()
    }
  }

  async function sendAttachment(file: File) {
    if (!supabase || !activeId) return

    setError('')
    const filePath = `${activeId}/${user.id}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(filePath, file)

    if (uploadError) {
      setError(
        uploadError.message.includes('Bucket not found')
          ? 'Bucket not found. Run the latest supabase/schema.sql in Supabase SQL Editor, or create a public Storage bucket named chat-attachments.'
          : uploadError.message,
      )
      return
    }

    const { data } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(filePath)

    const { error: messageError } = await supabase.from('messages').insert({
      conversation_id: activeId,
      sender_id: user.id,
      body: file.type.startsWith('image/') ? 'Photo' : file.name,
      attachment_url: data.publicUrl,
      attachment_name: file.name,
      attachment_type: file.type || 'application/octet-stream',
    })

    if (messageError) {
      setError(messageError.message)
    } else {
      void loadMessages(activeId)
      void loadConversations()
    }
  }

  async function createGroup() {
    if (!supabase || busy || !groupName.trim() || !selectedGroupMemberIds.length) {
      return
    }

    setBusy(true)
    setError('')

    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({
        title: groupName.trim(),
        is_group: true,
        created_by: user.id,
      })
      .select('id, title, is_group, created_at, updated_at')
      .single()

    if (conversationError) {
      setError(conversationError.message)
      setBusy(false)
      return
    }

    const memberRows = [user.id, ...selectedGroupMemberIds].map((memberId) => ({
      conversation_id: conversation.id,
      user_id: memberId,
    }))
    const { error: memberError } = await supabase
      .from('conversation_members')
      .insert(memberRows)

    if (memberError) {
      setError(memberError.message)
    } else {
      setConversations((items) => [
        { ...conversation, receiver: null, memberIds: memberRows.map((item) => item.user_id) },
        ...items,
      ])
      setGroupName('')
      setSelectedGroupMemberIds([])
      setGroupOpen(false)
      setActiveView('chats')
      setActiveId(null)
    }

    setBusy(false)
  }

  async function startVoiceNote() {
    if (!activeId || recording) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      recordedChunksRef.current = []
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        const audioBlob = new Blob(recordedChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        const voiceFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, {
          type: audioBlob.type,
        })
        void sendAttachment(voiceFile)
      }

      recorder.start()
      setRecording(true)
    } catch (voiceError) {
      setError(
        voiceError instanceof Error
          ? voiceError.message
          : 'Could not access microphone.',
      )
    }
  }

  function stopVoiceNote() {
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
    setRecording(false)
  }

  async function updateProfilePhoto(file: File) {
    if (!supabase) return

    setError('')
    const extension = file.name.split('.').pop() ?? 'jpg'
    const filePath = `${user.id}/avatar-${Date.now()}.${extension}`
    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, file)

    if (uploadError) {
      setError(
        uploadError.message.includes('Bucket not found')
          ? 'Bucket not found. Run the latest supabase/schema.sql in Supabase SQL Editor, or create a public Storage bucket named profile-photos.'
          : uploadError.message,
      )
      return
    }

    const { data } = supabase.storage.from('profile-photos').getPublicUrl(filePath)
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: data.publicUrl })
      .eq('id', user.id)
      .select('id, display_name, avatar_url')
      .single()

    if (updateError) {
      setError(updateError.message)
    } else {
      setProfile(updatedProfile)
      setProfileOpen(false)
      void loadProfiles()
      void loadConversations()
    }
  }

  function notifyIncoming(conversationId: string) {
    const conversation = conversations.find((item) => item.id === conversationId)
    const senderName = conversation ? getConversationName(conversation) : 'New message'
    const text = `New message from ${senderName}`
    setNotice(text)

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(text)
    } else if ('Notification' in window && Notification.permission === 'default') {
      void Notification.requestPermission()
    }
  }

  async function startCall(mode: 'audio' | 'video') {
    if (!activeConversation) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: mode === 'video',
      })

      localStreamRef.current = stream
      setCallMode(mode)
      setCallStatus(
        `${mode === 'video' ? 'Video' : 'Audio'} call ready with ${activeConversationName}`,
      )

      window.setTimeout(() => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
      }, 0)
    } catch (callError) {
      setError(
        callError instanceof Error
          ? callError.message
          : 'Could not access camera or microphone.',
      )
    }
  }

  function endCall() {
    localStreamRef.current?.getTracks().forEach((track) => track.stop())
    localStreamRef.current = null
    setCallMode(null)
    setCallStatus('')
  }

  async function signOut() {
    await supabase?.auth.signOut()
  }

  useEffect(() => {
    void loadProfile()
    void loadConversations()
    void loadProfiles()
    void loadUnreadCounts()
  }, [])

  useEffect(() => {
    if (activeId) {
      void loadMessages(activeId)
      void markConversationRead(activeId)
    } else {
      setMessages([])
    }
  }, [activeId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, activeId])

  useEffect(() => {
    if (!supabase) return undefined

    const client = supabase
    const channel = client
      .channel(`messages:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const nextMessage = payload.new as Partial<Message>
          const conversationId = nextMessage.conversation_id

          void loadConversations()
          void loadUnreadCounts()

          if (conversationId && conversationId === activeId) {
            void loadMessages(conversationId)
            void markConversationRead(conversationId)
          }

          if (
            payload.eventType === 'INSERT' &&
            conversationId &&
            nextMessage.sender_id !== user.id &&
            conversationId !== activeId
          ) {
            notifyIncoming(conversationId)
          }
        },
      )
      .subscribe()

    return () => {
      void client.removeChannel(channel)
    }
  }, [activeId, conversations, user.id])

  useEffect(() => {
    if (!supabase) return undefined

    const client = supabase
    const channel = client
      .channel(`conversation-members:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_members',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void loadConversations()
        },
      )
      .subscribe()

    return () => {
      void client.removeChannel(channel)
    }
  }, [user.id])

  useEffect(() => {
    if (!supabase) return undefined

    const client = supabase
    const channel = client.channel('online-users', {
      config: { presence: { key: user.id } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        setOnlineUserIds(Object.keys(channel.presenceState()))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id, online_at: new Date().toISOString() })
        }
      })

    return () => {
      void channel.untrack()
      void client.removeChannel(channel)
    }
  }, [user.id])

  return (
    <main
      className={`${
        darkMode ? 'dark' : ''
      } h-screen overflow-hidden bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100`}
    >
      <section className="grid h-full min-h-0 grid-cols-1 overflow-hidden lg:grid-cols-[64px_320px_minmax(520px,1fr)]">
        <aside className="hidden min-h-0 flex-col items-center gap-5 border-r border-slate-100 bg-white px-3 py-5 dark:border-slate-800 dark:bg-slate-950 lg:flex">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-sky-400 via-violet-500 to-fuchsia-500 text-white">
            <MessageCircle size={24} />
          </div>
          <button
            type="button"
            onClick={() => setActiveView('chats')}
            aria-label="Chats"
            title="Chats"
            className={`grid h-10 w-10 place-items-center rounded-lg ${
              activeView === 'chats'
                ? 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300'
                : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900'
            }`}
          >
            <MessageCircle size={18} />
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveView('people')
              void loadProfiles()
            }}
            aria-label="People"
            title="People"
            className={`grid h-10 w-10 place-items-center rounded-lg ${
              activeView === 'people'
                ? 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300'
                : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900'
            }`}
          >
            <UserRound size={18} />
          </button>
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            aria-label="Profile photo"
            title="Profile photo"
            className="grid h-10 w-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
          >
            <Avatar
              name={profile?.display_name ?? user.email ?? 'User'}
              src={profile?.avatar_url}
              size="sm"
            />
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setDarkMode((value) => !value)}
            aria-label="Toggle dark mode"
            title="Toggle dark mode"
            className="grid h-10 w-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
          >
            {darkMode ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button
            type="button"
            onClick={signOut}
            aria-label="Logout"
            title="Logout"
            className="grid h-10 w-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
          >
            <LogOut size={18} />
          </button>
        </aside>

        <aside
          className={`min-h-0 flex-col overflow-hidden border-r border-slate-100 bg-slate-50/80 px-5 py-4 dark:border-slate-800 dark:bg-slate-900 ${
            activeConversation ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <header className="flex shrink-0 items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-950 dark:text-white">
                {activeView === 'chats' ? 'Chats' : 'People'}
              </h1>
              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                className="mt-1 flex items-center gap-2 text-left text-xs text-slate-500 dark:text-slate-400"
              >
                <Avatar
                  name={profile?.display_name ?? user.email ?? 'User'}
                  src={profile?.avatar_url}
                  size="sm"
                />
                <span>
                  {activeView === 'chats'
                    ? `Signed in as ${profile?.display_name ?? user.email}`
                    : 'Users registered in the database'}
                </span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setStartChatOpen(true)}
              aria-label="New chat"
              title="New chat"
              className="grid h-8 w-8 place-items-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-200 dark:shadow-none"
            >
              <Plus size={17} />
            </button>
            <button
              type="button"
              onClick={() => setGroupOpen(true)}
              aria-label="New group"
              title="New group"
              className="grid h-8 w-8 place-items-center rounded-full bg-slate-900 text-white dark:bg-slate-700"
            >
              <Users size={16} />
            </button>
          </header>

          <label className="mt-5 flex h-11 shrink-0 items-center gap-3 rounded-md bg-white px-4 text-xs text-slate-400 shadow-sm dark:bg-slate-800 dark:text-slate-500 dark:shadow-none">
            <input
              value={activeView === 'chats' ? query : profileQuery}
              onChange={(event) => {
                if (activeView === 'chats') {
                  setQuery(event.target.value)
                } else {
                  setProfileQuery(event.target.value)
                }
              }}
              placeholder={
                activeView === 'chats'
                  ? 'Search For Contacts or Messages'
                  : 'Search people in database'
              }
              className="min-w-0 flex-1 bg-transparent text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            <Search size={16} />
          </label>

          {error && (
            <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </p>
          )}

          {activeView === 'chats' && (
            <>
              <div className="mt-5 flex shrink-0 items-center justify-between">
                <h2 className="text-sm font-bold text-slate-950 dark:text-white">
                  Recent Chats
                </h2>
                <MoreVertical size={16} className="text-slate-400" />
              </div>
              <div className="mt-4 flex shrink-0 gap-4 overflow-x-auto pb-2">
                {recentPeople.length ? (
                  recentPeople.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => {
                        const conversation = conversations.find(
                          (entry) => entry.receiver?.id === item.id,
                        )
                        setActiveId(conversation?.id ?? null)
                      }}
                      className="w-12 shrink-0 text-center"
                    >
                      <Avatar name={item.display_name} src={item.avatar_url} />
                      <span className="mt-2 block truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {item.display_name}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                    People you have chatted with will appear here.
                  </p>
                )}
              </div>
            </>
          )}

          <div className="mt-4 flex shrink-0 items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-950 dark:text-white">
              {activeView === 'chats' ? 'All Chats' : 'Users'}
            </h2>
            <MoreVertical size={16} className="text-slate-400" />
          </div>

          <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {activeView === 'chats' ? (
              <>
                {filteredConversations.map((conversation) => {
                  const active = conversation.id === activeId

                  return (
                    <button
                      type="button"
                      key={conversation.id}
                      onClick={() => setActiveId(conversation.id)}
                      className={`grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md px-3 py-3 text-left transition ${
                        active
                          ? 'bg-white shadow-sm dark:bg-slate-800 dark:shadow-none'
                          : 'hover:bg-white/80 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <Avatar
                        name={getConversationName(conversation)}
                        src={getConversationAvatar(conversation)}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {getConversationName(conversation)}
                        </span>
                        <span className="mt-1 block truncate text-xs text-slate-500 dark:text-slate-400">
                          {conversation.receiver &&
                          onlineUserIds.includes(conversation.receiver.id)
                            ? 'Active'
                            : 'Offline'}{' '}
                          · Updated {formatTime(conversation.updated_at)}
                        </span>
                      </span>
                      {unreadCounts[conversation.id] ? (
                        <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold leading-none text-white">
                          {unreadCounts[conversation.id]}
                        </span>
                      ) : (
                        <CheckCheck size={14} className="text-slate-400" />
                      )}
                    </button>
                  )
                })}

                {!filteredConversations.length && (
                  <div className="rounded-md border border-dashed border-slate-200 p-4 text-sm leading-6 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    People you have chatted with will appear here.
                  </div>
                )}
              </>
            ) : (
              <>
                {filteredProfiles.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => createConversation(item)}
                    disabled={busy}
                    className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md px-3 py-3 text-left transition hover:bg-white/80 disabled:opacity-60 dark:hover:bg-slate-800/70"
                  >
                    <Avatar name={item.display_name} src={item.avatar_url} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {item.display_name}
                      </span>
                      <span className="mt-1 block truncate text-xs text-slate-500 dark:text-slate-400">
                        Click to start a chat
                      </span>
                    </span>
                    <Plus size={16} className="text-violet-500" />
                  </button>
                ))}

                {!filteredProfiles.length && (
                  <div className="rounded-md border border-dashed border-slate-200 p-4 text-sm leading-6 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    No users found in the database yet.
                  </div>
                )}
              </>
            )}
          </div>
        </aside>

        <section
          className={`min-h-0 min-w-0 flex-col bg-white dark:bg-slate-950 ${
            activeConversation ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-6 dark:border-slate-800">
            {activeConversation ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveId(null)}
                  aria-label="Back to chats"
                  title="Back to chats"
                  className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-900"
                >
                  <ArrowLeft size={18} />
                </button>
                <Avatar
                  name={activeConversationName}
                  src={getConversationAvatar(activeConversation)}
                  size="sm"
                />
                <div>
                  <h2 className="text-sm font-bold text-slate-950 dark:text-white">
                    {activeConversationName}
                  </h2>
                  <p
                    className={`text-xs ${
                      activeReceiverOnline ? 'text-emerald-500' : 'text-slate-400'
                    }`}
                  >
                    {activeReceiverOnline ? 'Active' : 'Offline'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-slate-500">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 dark:bg-slate-900">
                  <MessageCircle size={16} />
                </span>
                <h2 className="text-sm font-bold">
                  Click to the user in order to start a chat
                </h2>
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-400">
              <button
                type="button"
                aria-label="Search messages"
                title="Search messages"
                className="grid h-8 w-8 place-items-center rounded-md hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-100"
              >
                <Search size={16} />
              </button>
              <button
                type="button"
                onClick={() => void startCall('audio')}
                disabled={!activeConversation}
                aria-label="Audio call"
                title="Audio call"
                className="grid h-8 w-8 place-items-center rounded-md hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 dark:hover:bg-slate-900 dark:hover:text-slate-100"
              >
                <Phone size={16} />
              </button>
              <button
                type="button"
                onClick={() => void startCall('video')}
                disabled={!activeConversation}
                aria-label="Video call"
                title="Video call"
                className="grid h-8 w-8 place-items-center rounded-md hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 dark:hover:bg-slate-900 dark:hover:text-slate-100"
              >
                <Video size={16} />
              </button>
              <button
                type="button"
                aria-label="More options"
                title="More options"
                className="grid h-8 w-8 place-items-center rounded-md hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-100"
              >
                <MoreVertical size={16} />
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 lg:px-14">
            <div className="space-y-5">
              {activeConversation ? (
                messages.map((message, index) => {
                  const previousMessage = messages[index - 1]
                  const showSender =
                    !previousMessage ||
                    previousMessage.sender_id !== message.sender_id

                  return (
                    <ChatBubble
                      key={message.id}
                      message={message}
                      currentUserId={user.id}
                      showSender={showSender}
                    />
                  )
                })
              ) : (
                <div className="grid h-full min-h-[360px] place-items-center text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
                  <p>Click to the user in order to start a chat</p>
                </div>
              )}

              {activeConversation && !messages.length && (
                <div className="grid h-full min-h-[280px] place-items-center text-center text-sm text-slate-500 dark:text-slate-400">
                  <p>No messages yet. Send the first one.</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <footer className="shrink-0 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
            <form
              onSubmit={sendMessage}
              className="flex items-center gap-3 rounded-md bg-slate-50 px-4 py-3 dark:bg-slate-900"
            >
              <Smile size={20} className="text-slate-400" />
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void sendAttachment(file)
                  event.target.value = ''
                }}
              />
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void sendAttachment(file)
                  event.target.value = ''
                }}
              />
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={
                  activeConversation
                    ? 'Write your message...'
                    : 'Click to the user in order to start a chat'
                }
                disabled={!activeConversation}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <button
                type="button"
                disabled={!activeConversation}
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach file"
                title="Attach file"
                className="grid h-10 w-10 place-items-center rounded-md text-slate-400 hover:bg-white disabled:opacity-40 dark:hover:bg-slate-800"
              >
                <Paperclip size={18} />
              </button>
              <button
                type="button"
                disabled={!activeConversation}
                onClick={() => photoInputRef.current?.click()}
                aria-label="Attach photo"
                title="Attach photo"
                className="grid h-10 w-10 place-items-center rounded-md text-slate-400 hover:bg-white disabled:opacity-40 dark:hover:bg-slate-800"
              >
                <Image size={18} />
              </button>
              <button
                type="submit"
                disabled={!activeConversation || !draft.trim()}
                aria-label="Send"
                title="Send"
                className="grid h-10 w-10 place-items-center rounded-md bg-violet-600 text-white shadow-lg shadow-violet-200 disabled:opacity-50 dark:shadow-none"
              >
                <Send size={18} />
              </button>
            </form>
          </footer>
        </section>
      </section>

      {startChatOpen && (
        <div className="absolute inset-0 z-30 flex items-start justify-center bg-slate-950/30 px-4 py-16 backdrop-blur-[1px] dark:bg-black/50">
          <section className="w-full max-w-md rounded-md border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-950 dark:text-white">
                  Start a chat
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Choose a registered user to message.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStartChatOpen(false)}
                aria-label="Close"
                title="Close"
                className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={17} />
              </button>
            </header>

            <label className="mt-4 flex h-11 items-center gap-3 rounded-md bg-slate-50 px-3 text-slate-400 dark:bg-slate-950">
              <Search size={16} />
              <input
                value={profileQuery}
                onChange={(event) => setProfileQuery(event.target.value)}
                placeholder="Search people"
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </label>

            <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
              {filteredProfiles.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => createConversation(item)}
                  disabled={busy}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md px-3 py-3 text-left hover:bg-slate-50 disabled:opacity-60 dark:hover:bg-slate-800"
                >
                  <Avatar name={item.display_name} src={item.avatar_url} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {item.display_name}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                      Available to chat
                    </span>
                  </span>
                  <Plus size={16} className="text-violet-500" />
                </button>
              ))}

              {!filteredProfiles.length && (
                <p className="rounded-md border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  No other users found yet. Create or confirm another account,
                  then open this list again.
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      {profileOpen && (
        <div className="absolute inset-0 z-30 flex items-start justify-center bg-slate-950/30 px-4 py-16 backdrop-blur-[1px] dark:bg-black/50">
          <section className="w-full max-w-sm rounded-md border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-950 dark:text-white">
                  Profile photo
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Update the image people see in chats.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                aria-label="Close profile"
                title="Close profile"
                className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={17} />
              </button>
            </header>

            <div className="mt-6 flex flex-col items-center text-center">
              <Avatar
                name={profile?.display_name ?? user.email ?? 'User'}
                src={profile?.avatar_url}
              />
              <h3 className="mt-3 text-sm font-bold text-slate-950 dark:text-white">
                {profile?.display_name ?? user.email}
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {user.email}
              </p>
            </div>

            <input
              ref={profilePhotoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void updateProfilePhoto(file)
                event.target.value = ''
              }}
            />
            <button
              type="button"
              onClick={() => profilePhotoInputRef.current?.click()}
              className="mt-6 h-10 w-full rounded-md bg-violet-600 text-sm font-bold text-white"
            >
              Choose photo
            </button>
          </section>
        </div>
      )}

      {notice && (
        <button
          type="button"
          onClick={() => setNotice('')}
          className="absolute right-5 top-5 z-40 max-w-sm rounded-md bg-slate-950 px-4 py-3 text-left text-sm font-semibold text-white shadow-lg"
        >
          {notice}
        </button>
      )}

      {callMode && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-slate-950/70 px-4">
          <section className="w-full max-w-lg overflow-hidden rounded-md bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-950 dark:text-white">
                  {activeConversationName}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {callStatus}
                </p>
              </div>
              <button
                type="button"
                onClick={endCall}
                className="rounded-md bg-rose-500 px-3 py-2 text-xs font-bold text-white"
              >
                End
              </button>
            </div>
            <div className="grid min-h-72 place-items-center bg-slate-950 p-4 text-white">
              {callMode === 'video' ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="max-h-[420px] w-full rounded-md object-cover"
                />
              ) : (
                <div className="text-center">
                  <Phone size={34} className="mx-auto mb-3" />
                  <p className="text-sm font-semibold">Microphone is active</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return undefined
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!supabaseConfig.hasAnonKey) {
    return <SetupNotice />
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-sm font-semibold text-slate-500">
        Loading...
      </main>
    )
  }

  if (!session) {
    return <AuthScreen />
  }

  return <ChatApp user={session.user} />
}

export default App
