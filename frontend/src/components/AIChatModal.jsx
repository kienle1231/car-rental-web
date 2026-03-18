import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
import { chatAIAPI } from '../services/api';

const AIChatModal = ({ onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: "1",
      role: 'assistant',
      content: 'Xin chào! Tôi là Trợ lý Elite của bạn. Tôi có thể giúp bạn tìm xe hoàn hảo, tư vấn giá cả hoặc giải đáp bất kỳ thắc mắc nào về dịch vụ của chúng tôi. Bạn cần tôi hỗ trợ gì hôm nay? 🚘',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    const currentInput = inputText.trim();
    setInputText('');
    setLoading(true);

    try {
      const history = messages.map(msg => ({ 
        role: msg.role, 
        content: msg.content,
        suggestedCars: msg.suggestedCars 
      }));

      const res = await chatAIAPI({ message: currentInput, chatHistory: history });
      const data = res.data;

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.replyText || 'Xin lỗi, tôi không thể xử lý yêu cầu lúc này.',
        suggestedCars: data.suggestedCars || [],
        timestamp: new Date(),
      }]);
    } catch (err) {
      console.error('AI error:', err);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Xin lỗi, đang có sự cố kỹ thuật. Vui lòng thử lại sau.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-24 right-6 w-96 h-[600px] max-h-[80vh] bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 text-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <Bot size={20} className="text-accent" />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0f172a]"></div>
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Elite Concierge</h3>
            <p className="text-xs text-white/50">Always ready to assist</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X size={18} className="text-white/70" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div 
              className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                msg.role === 'user' 
                  ? 'bg-accent text-white rounded-tr-sm' 
                  : 'bg-white/10 text-white/90 rounded-tl-sm'
              }`}
            >
              {msg.content}
            </div>

            {/* Suggested Cars Carousel Map equivalent */}
            {msg.suggestedCars && msg.suggestedCars.length > 0 && (
              <div className="flex overflow-x-auto gap-3 py-3 w-full scrollbar-hide snap-x">
                {msg.suggestedCars.map((car, idx) => (
                  <div key={idx} className="min-w-[200px] max-w-[200px] snap-center bg-white/5 border border-white/10 rounded-xl overflow-hidden shrink-0 group hover:border-accent/50 transition-colors">
                    <img src={car.image || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8'} alt={car.carName} className="w-full h-24 object-cover" />
                    <div className="p-3">
                      <h4 className="font-semibold text-white mb-1 truncate">{car.carName}</h4>
                      <p className="text-accent text-sm font-medium mb-2">${car.price}/ngày</p>
                      <p className="text-[11px] text-white/60 line-clamp-3 leading-snug">{car.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start">
            <div className="bg-white/10 p-3 rounded-2xl rounded-tl-sm flex gap-1">
              <motion.div animate={{y: [0, -5, 0]}} transition={{duration: 0.6, repeat: Infinity, delay: 0}} className="w-2 h-2 bg-white/50 rounded-full"></motion.div>
              <motion.div animate={{y: [0, -5, 0]}} transition={{duration: 0.6, repeat: Infinity, delay: 0.2}} className="w-2 h-2 bg-white/50 rounded-full"></motion.div>
              <motion.div animate={{y: [0, -5, 0]}} transition={{duration: 0.6, repeat: Infinity, delay: 0.4}} className="w-2 h-2 bg-white/50 rounded-full"></motion.div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-white/5 border-t border-white/10 flex items-end gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Bạn đang tìm chiếc xe nào?"
          className="flex-1 bg-white/5 border border-white/10 hover:border-white/20 focus:border-accent focus:ring-1 focus:ring-accent/50 text-white rounded-xl px-4 py-3 min-h-[44px] text-sm transition-colors outline-none placeholder:text-white/30"
        />
        <button 
          type="submit" 
          disabled={!inputText.trim() || loading}
          className="w-11 h-11 shrink-0 rounded-xl bg-accent text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors"
        >
          <Send size={18} />
        </button>
      </form>
    </motion.div>
  );
};

export default AIChatModal;
