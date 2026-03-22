import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Send, MessageSquare, Loader2, ArrowLeft, Check, CheckCheck, Info } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/toast';
import api from '../../lib/api';

export default function Messages() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeChatId = searchParams.get('active');

  const [conversations, setConversations] = useState<any[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSidebar, setShowSidebar] = useState(!activeChatId);
  const [canReply, setCanReply] = useState(true);

  useEffect(() => { setShowSidebar(!activeChatId); }, [activeChatId]);

  useEffect(() => {
    const fetch = async () => {
      try { 
        const r = await api.get('/messages/conversations'); 
        const uniqueConversations = Array.from(new Map((r.data.conversations || []).map((c: any) => [c.id, c])).values());
        setConversations(uniqueConversations as any[]); 
      }
      catch {} finally { setLoadingChats(false); }
    };
    fetch();
    const i = setInterval(fetch, 10000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (!activeChatId) return;
    const fetch = async (loader = false) => {
      if (loader) setLoadingMessages(true);
      try {
        const r = await api.get(`/messages/conversations/${activeChatId}/messages`);
        if (typeof r.data.canReply === 'boolean') setCanReply(r.data.canReply);
        setMessages(prev => { 
          const combined = [...prev, ...r.data.messages];
          const uniqueMessages = Array.from(new Map(combined.map((m: any) => [m.id, m])).values());
          if (prev.length !== uniqueMessages.length) setTimeout(scrollBottom, 100); 
          return uniqueMessages.sort((a: any, b: any) => +new Date(a.createdAt) - +new Date(b.createdAt)); 
        });
      } catch {} finally { setLoadingMessages(false); }
    };
    fetch(true);
    const i = setInterval(() => fetch(false), 3000);
    return () => clearInterval(i);
  }, [activeChatId]);

  const scrollBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChatId) return;
    setSending(true);
    const txt = messageText.trim();
    setMessageText('');
    try {
      const r = await api.post(`/messages/conversations/${activeChatId}/messages`, { content: txt });
      setMessages(p => {
        const combined = [...p, r.data.message];
        return Array.from(new Map(combined.map((m: any) => [m.id, m])).values()).sort((a: any, b: any) => +new Date(a.createdAt) - +new Date(b.createdAt));
      });
      setConversations(p => p.map(c => c.id === activeChatId ? { ...c, lastMessage: r.data.message, updatedAt: r.data.message.createdAt } : c).sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)));
      setTimeout(scrollBottom, 50);
    } catch { showToast('Failed to send message', 'error'); setMessageText(txt); }
    finally { setSending(false); }
  };

  const activeChat = conversations.find(c => c.id === activeChatId);
  const filtered = conversations.filter(c => c.otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages</h1>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex h-[calc(100vh-160px)] min-h-[500px] shadow-sm">
          {/* Sidebar */}
          <div className={`w-full md:w-80 flex-col border-r border-gray-200 ${showSidebar ? 'flex' : 'hidden md:flex'}`}>
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingChats ? (
                <div className="flex items-center justify-center h-40"><Loader2 className="w-5 h-5 animate-spin text-blue-600" /></div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <MessageSquare className="w-10 h-10 mb-3 text-gray-300" />
                  <p className="text-sm text-gray-400">No conversations found.</p>
                </div>
              ) : (
                filtered.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => setSearchParams({ active: conv.id })}
                    className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors flex items-start gap-3 ${activeChatId === conv.id ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {(conv.otherUser?.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <p className="font-semibold text-gray-900 truncate text-sm">{conv.otherUser?.name}</p>
                        <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">{conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                          {conv.lastMessage ? (
                            <>{conv.lastMessage.senderId === user?.id && <span className="text-gray-400 mr-1">You:</span>}{conv.lastMessage.content}</>
                          ) : 'Started a conversation'}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">{conv.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex-col ${!showSidebar ? 'flex' : 'hidden md:flex'}`}>
            {!activeChatId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-300" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Select a conversation</h2>
                <p className="text-sm text-gray-400">Choose a chat from the sidebar or message a provider from their profile.</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="h-14 border-b border-gray-200 bg-white flex items-center px-4 flex-shrink-0">
                  <button onClick={() => setShowSidebar(true)} className="md:hidden mr-3 text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></button>
                  {activeChat && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">{(activeChat.otherUser?.name || '?').charAt(0).toUpperCase()}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{activeChat.otherUser?.name}</h3>
                        <p className="text-xs text-gray-400 leading-tight capitalize">{activeChat.otherUser?.role?.toLowerCase()}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                  {loadingMessages && messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
                  ) : (
                    <>
                      {messages.map((msg) => {
                        const isMe = msg.senderId === user?.id;
                        return (
                          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {!isMe && (
                              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold mr-2 flex-shrink-0 self-end mb-5">
                                {(activeChat?.otherUser?.name || '?').charAt(0)}
                              </div>
                            )}
                            <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                              <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'}`}>
                                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                              </div>
                              <div className="flex items-center gap-1 mt-1 px-1">
                                <span className="text-[10px] text-gray-400">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                {isMe && (msg.isRead ? <CheckCheck className="w-3 h-3 text-blue-500" /> : <Check className="w-3 h-3 text-gray-400" />)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Input */}
                {canReply ? (
                  <div className="p-3 bg-white border-t border-gray-200 flex-shrink-0">
                    <form onSubmit={handleSend} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                        disabled={sending}
                      />
                      <button
                        type="submit"
                        disabled={!messageText.trim() || sending}
                        className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors flex-shrink-0"
                        aria-label="Send message"
                      >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border-t border-gray-200 text-center text-sm text-gray-500 flex-shrink-0 flex items-center justify-center gap-2">
                     <Info className="w-4 h-4 text-gray-400" /> You can only message users you have a pending or future appointment with.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
