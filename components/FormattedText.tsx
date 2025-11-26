import React from 'react';

interface FormattedTextProps {
  text: string;
  className?: string;
}

export const FormattedText: React.FC<FormattedTextProps> = ({ text, className = '' }) => {
  if (!text) return null;

  const processLine = (line: string, index: number) => {
    // Inline formatting parser
    // Split by **bold** and `code/math` markers
    const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g).map((part, partIndex) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={partIndex} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={partIndex} className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono text-xs mx-0.5 border border-slate-200">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });

    return <span key={index}>{parts}</span>;
  };

  // Split text into lines to handle block structures
  const lines = text.split('\n');
  
  return (
    <div className={`space-y-1 ${className}`}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-2" />; // Spacer for empty lines

        // List Item detection
        const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ');
        const isOrdered = /^\d+\.\s/.test(trimmed); // Matches "1. ", "2. ", etc.

        if (isBullet) {
          const content = trimmed.replace(/^[-*•]\s/, '');
          return (
            <div key={idx} className="flex items-start gap-2 ml-2">
              <span className="text-slate-400 mt-1.5 text-[10px]">•</span>
              <div className="flex-1">{processLine(content, idx)}</div>
            </div>
          );
        }

        if (isOrdered) {
          const match = trimmed.match(/^(\d+\.)\s/);
          const number = match ? match[1] : '';
          const content = trimmed.replace(/^\d+\.\s/, '');
          return (
            <div key={idx} className="flex items-start gap-2 ml-1">
              <span className="font-bold text-slate-500 min-w-[1.5rem] text-right">{number}</span>
              <div className="flex-1">{processLine(content, idx)}</div>
            </div>
          );
        }

        // Regular paragraph line
        return <div key={idx} className="leading-relaxed">{processLine(line, idx)}</div>;
      })}
    </div>
  );
};