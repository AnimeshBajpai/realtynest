import { useState, useEffect, useRef } from 'react';
import { Bot, User } from 'lucide-react';
import type { CoachMessage } from '../types/runner.types';

interface CoachChatProps {
  messages: CoachMessage[];
  responseOptions?: { label: string; value: string }[];
  onSelectOption?: (value: string) => void;
}

function TypewriterText({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayedText('');
    indexRef.current = 0;
    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayedText(text.slice(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayedText}</span>;
}

export default function CoachChat({ messages, responseOptions, onSelectOption }: CoachChatProps) {
  return (
    <div className="space-y-4">
      {messages.map((msg, idx) => {
        const isCoach = msg.type !== 'feedback';
        const isLast = idx === messages.length - 1;

        return (
          <div
            key={msg.id}
            className={`flex gap-3 ${isCoach ? 'justify-start' : 'justify-end'}`}
          >
            {isCoach && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--rc-neon-green)]/20 flex items-center justify-center">
                <Bot size={18} className="text-[var(--rc-neon-green)]" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                isCoach
                  ? 'bg-[var(--rc-bg-secondary)] text-white rounded-tl-sm'
                  : 'bg-[var(--rc-neon-green)]/20 text-[var(--rc-neon-green)] rounded-tr-sm'
              }`}
            >
              <p className="text-sm leading-relaxed">
                {isLast && isCoach ? <TypewriterText text={msg.content || ''} /> : (msg.content || '')}
              </p>
            </div>
            {!isCoach && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--rc-neon-cyan)]/20 flex items-center justify-center">
                <User size={18} className="text-[var(--rc-neon-cyan)]" />
              </div>
            )}
          </div>
        );
      })}

      {responseOptions && responseOptions.length > 0 && (
        <div className="flex flex-wrap gap-2 ml-11">
          {responseOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSelectOption?.(opt.value)}
              className="rc-btn bg-[var(--rc-bg-secondary)] border border-[var(--rc-neon-green)]/30 text-white px-4 py-2 rounded-full text-sm hover:border-[var(--rc-neon-green)] hover:text-[var(--rc-neon-green)] transition-colors"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
