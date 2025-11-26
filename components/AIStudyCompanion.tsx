import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { InputField } from './InputField';
import { getStudyHelp } from '../utils/gemini';
import { getTestResults } from '../utils/storage';
import { FormattedText } from './FormattedText'; // Import the new component
import { ChatMessage } from '../types';
import { 
  Bot, 
  Send, 
  ArrowLeft, 
  User, 
  Sparkles, 
  Loader2, 
  BookOpen 
} from 'lucide-react';

interface AIStudyCompanionProps {
  onBack: () => void;
}

export const AIStudyCompanion: React.FC<AIStudyCompanionProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hello! I'm your AI Study Companion.\n\nI can help you with:\n- Clearing doubts\n- Explaining complex topics\n- Solving math problems step-by-step\n\nWhat shall we study today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [weakTopics, setWeakTopics] = useState<string[]>([]);

  useEffect(() => {
    // Analyze weak topics from history
    const results = getTestResults();
    const topicStats: Record<string, { total: number, correct: number }> = {};
    
    results.forEach(r => {
      r.topicAnalysis.forEach(t => {
        if (!topicStats[t.topic]) topicStats[t.topic] = { total: 0, correct: 0 };
        topicStats[t.topic].total += t.totalQuestions;
        topicStats[t.topic].correct += t.correct;
      });
    });

    const weak = Object.entries(topicStats)
      .filter(([_, stats]) => (stats.correct / stats.total) < 0.5)
      .map(([topic]) => topic);
    
    setWeakTopics(weak);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Call AI
    const responseText = await getStudyHelp(userMsg.text, weakTopics);

    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      text: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 h-16 flex-shrink-0 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onBack} className="w-auto p-2 h-10 w-10 flex items-center justify-center rounded-full border-slate-200">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Bot className="h-6 w-6 text-indigo-600" />
              AI Study Companion
            </h1>
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
            </span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50">
        {/* Weak Topics Suggestion */}
        {weakTopics.length > 0 && messages.length === 1 && (
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-6 animate-fadeIn">
            <h3 className="text-sm font-bold text-orange-800 mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Focus Areas Detected
            </h3>
            <p className="text-xs text-orange-700 mb-3">
              Based on your test history, you might want to revise:
            </p>
            <div className="flex flex-wrap gap-2">
              {weakTopics.map(topic => (
                <button 
                  key={topic}
                  onClick={() => setInput(`Help me understand ${topic}`)}
                  className="px-3 py-1 bg-white border border-orange-200 text-orange-700 rounded-full text-xs font-medium hover:bg-orange-100 transition-colors"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-slideUp`}
          >
            <div className={`flex gap-3 max-w-[90%] sm:max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === 'user' ? 'bg-blue-100' : 'bg-indigo-100'}`}>
                {msg.sender === 'user' ? <User className="h-5 w-5 text-blue-600" /> : <Bot className="h-5 w-5 text-indigo-600" />}
              </div>
              <div 
                className={`p-4 rounded-2xl text-sm shadow-sm
                  ${msg.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                  }
                `}
              >
                {/* Use FormattedText for message content */}
                <FormattedText text={msg.text} className={msg.sender === 'user' ? 'text-white' : 'text-slate-700'} />
                
                <span className={`block text-[10px] mt-2 opacity-70 ${msg.sender === 'user' ? 'text-blue-100' : 'text-slate-400'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start animate-fadeIn">
             <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2 ml-11">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
             </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 p-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a doubt or request a topic summary..."
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm transition-all"
          />
          <Button onClick={handleSend} disabled={!input.trim() || isTyping} className="w-auto px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700">
            {isTyping ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
};