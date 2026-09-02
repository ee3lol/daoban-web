/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { searchMentionableUsers } from "@/lib/actions/comments";
import { MdCheck } from "react-icons/md";

interface AutocompleteTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onValueChange: (val: string) => void;
}

const COMMANDS = [
  { name: "/spoiler", description: "Hide text behind a spoiler tag" },
  { name: "/timestamp", description: "Add a clickable video timestamp (e.g. /t 1:23)" },
];

export default function AutocompleteTextarea({ onValueChange, value, onKeyDown, ...props }: AutocompleteTextareaProps) {
  const [showPopup, setShowPopup] = useState<'command' | 'mention' | null>(null);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [query, setQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Parse text around cursor to detect slash commands or mentions
  const checkTrigger = useCallback(() => {
    if (!textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart;
    const textBeforeCursor = (value as string).slice(0, cursor);
    
    // Check for commands (DISABLED for now as requested)
    /*
    const commandMatch = /(?:^|\s)(\/[a-zA-Z]*)$/.exec(textBeforeCursor);
    if (commandMatch) {
      setQuery(commandMatch[1]);
      setShowPopup('command');
      setSelectedIndex(0);
      return;
    }
    */

    // Check for mentions
    const mentionMatch = /(?:^|\s)(@[a-zA-Z0-9_.-]*)$/.exec(textBeforeCursor);
    if (mentionMatch) {
      setQuery(mentionMatch[1]);
      setShowPopup('mention');
      setSelectedIndex(0);
      return;
    }

    setShowPopup(null);
  }, [value]);

  useEffect(() => {
    checkTrigger();
  }, [value, checkTrigger]);

  // Debounced search for mentions
  useEffect(() => {
    if (showPopup !== 'mention') return;
    const searchQuery = query.slice(1); // remove '@'
    
    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      const res = await searchMentionableUsers(searchQuery);
      if (res.success && res.users) {
        setMentionResults(res.users);
      }
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, showPopup]);

  const insertText = (insertion: string) => {
    if (!textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart;
    const textBeforeCursor = (value as string).slice(0, cursor);
    const textAfterCursor = (value as string).slice(cursor);
    
    // Replace the matched query with the insertion
    const matchLength = query.length;
    const newText = textBeforeCursor.slice(0, -matchLength) + insertion + " " + textAfterCursor;
    
    onValueChange(newText);
    setShowPopup(null);
    
    // Restore focus
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        // Move cursor after the insertion space
        const newCursor = cursor - matchLength + insertion.length + 1;
        textareaRef.current.setSelectionRange(newCursor, newCursor);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showPopup) {
      if (onKeyDown) onKeyDown(e);
      return;
    }

    const items = showPopup === 'command' ? COMMANDS.filter(c => c.name.startsWith(query)) : mentionResults;
    const maxIndex = items.length - 1;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < maxIndex ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (showPopup === 'command') {
        const cmd = items[selectedIndex];
        if (cmd) insertText(cmd.name);
      } else if (showPopup === 'mention') {
        const user = items[selectedIndex];
        if (user && user.mentionable) {
          insertText(`@${user.username}`);
        }
      }
    } else if (e.key === 'Escape') {
      setShowPopup(null);
    } else {
      if (onKeyDown) onKeyDown(e);
    }
  };

  const commandItems = COMMANDS.filter(c => c.name.startsWith(query));

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onSelect={checkTrigger}
        onBlur={() => setTimeout(() => setShowPopup(null), 200)}
        {...props}
      />

      {showPopup === 'command' && commandItems.length > 0 && (
        <div className="absolute bottom-full mb-2 left-0 w-64 max-h-48 overflow-y-auto bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95">
          {commandItems.map((cmd, i) => (
            <div
              key={cmd.name}
              onClick={() => insertText(cmd.name)}
              className={`px-3 py-2 cursor-pointer transition-colors flex flex-col gap-0.5 ${i === selectedIndex ? 'bg-accent/20' : 'hover:bg-white/5'}`}
            >
              <span className="text-accent font-bold text-sm">{cmd.name}</span>
              <span className="text-white/50 text-[10px]">{cmd.description}</span>
            </div>
          ))}
        </div>
      )}

      {showPopup === 'mention' && (
        <div className="absolute bottom-full mb-2 left-0 w-64 max-h-60 overflow-y-auto bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 custom-scrollbar">
          {isLoading ? (
            <div className="p-4 text-center text-white/50 text-xs">Searching...</div>
          ) : mentionResults.length === 0 ? (
            <div className="p-4 text-center text-white/50 text-xs">No users found</div>
          ) : (
            mentionResults.map((u, i) => (
              <div
                key={u.id}
                onClick={() => {
                  if (u.mentionable) insertText(`@${u.username}`);
                }}
                className={`px-3 py-2 transition-colors flex items-center justify-between gap-3 ${
                  !u.mentionable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer ' + (i === selectedIndex ? 'bg-accent/20' : 'hover:bg-white/5')
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-6 h-6 rounded-full bg-white/10 shrink-0 overflow-hidden">
                    {u.image ? <img src={u.image} alt={u.name} className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="text-sm font-bold text-white truncate">{u.name}</span>
                    <span className="text-xs text-white/50 truncate">@{u.username}</span>
                  </div>
                </div>
                {!u.mentionable && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">Disabled</span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
