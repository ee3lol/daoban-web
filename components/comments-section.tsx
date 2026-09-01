"use client";

import React, { useEffect, useState } from 'react';
import { MdChatBubbleOutline, MdSend, MdDeleteOutline, MdThumbUp, MdThumbDown, MdClose } from 'react-icons/md';
import { getComments, postComment, deleteComment, toggleCommentLike } from '@/lib/actions/comments';
import { useRouter } from 'next/navigation';

export interface CommentType {
  id: string;
  content: string;
  createdAt: string | Date;
  userLikeStatus: 'like' | 'dislike' | null;
  likesCount: number;
  dislikesCount: number;
  user: {
    id: string;
    name: string;
    username?: string;
    image?: string;
  };
  replies?: CommentType[];
  [key: string]: unknown;
}

function getRelativeTime(dateString: string | Date) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;
  return `${Math.floor(diffInDays / 365)}y ago`;
}

const CommentNode = ({ 
  comment, 
  currentUser,
  isReply = false, 
  threadId,
  replyingTo,
  replyingToUser,
  replyText,
  setReplyingTo,
  setReplyingToUser,
  setReplyText,
  handleLike,
  handleDelete,
  handleSubmit
}: { 
  comment: CommentType;
  currentUser?: Record<string, unknown> | null;
  isReply?: boolean;
  threadId?: string;
  replyingTo: string | null;
  replyingToUser: string | null;
  replyText: string;
  setReplyingTo: (id: string | null) => void;
  setReplyingToUser: (username: string | null) => void;
  setReplyText: (text: string) => void;
  handleLike: (id: string, isLike: boolean) => void;
  handleDelete: (id: string) => void;
  handleSubmit: (e: React.FormEvent, parentId: string | null) => void;
}) => {
  const isLiked = comment.userLikeStatus === 'like';
  const isDisliked = comment.userLikeStatus === 'dislike';
  const actualThreadId = threadId || comment.id;
  const [showReplies, setShowReplies] = useState(false);

  const onReplyClick = () => {
    const isActivating = replyingTo !== actualThreadId;
    setReplyingTo(isActivating ? actualThreadId : null);
    setReplyingToUser(isActivating && isReply ? (comment.user.username || comment.user.name.split(' ')[0]) : null);
    setReplyText("");
  };

  return (
    <div className="flex flex-col gap-2 group animate-in fade-in slide-in-from-bottom-2">
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-white/10 shrink-0 overflow-hidden flex items-center justify-center">
          {comment.user.image ? (
            
            <img src={comment.user.image} alt={comment.user.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-white/50">{comment.user.name?.[0]?.toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2 truncate">
              <span className="text-[13px] font-bold text-white/90 truncate">{comment.user.username || comment.user.name}</span>
              <span className="text-[10px] font-medium text-white/40 shrink-0 mt-0.5">
                {getRelativeTime(comment.createdAt)}
              </span>
            </div>
            {currentUser?.id === comment.user.id && (
              <button 
                onClick={() => handleDelete(comment.id)}
                className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-500 transition-all p-1"
              >
                <MdDeleteOutline className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <p className="text-[13px] text-white/80 mt-1 whitespace-pre-wrap break-words leading-relaxed">{comment.content}</p>
          
          {}
          <div className="flex items-center gap-4 mt-2 mb-1">
            <button 
              onClick={() => handleLike(comment.id, true)} 
              className={`flex items-center gap-1.5 transition-colors text-[11px] font-bold ${isLiked ? 'text-accent' : 'text-white/40 hover:text-white'}`}
            >
              <MdThumbUp className="w-3.5 h-3.5" />
              {comment.likesCount > 0 && <span>{comment.likesCount}</span>}
            </button>
            <button 
              onClick={() => handleLike(comment.id, false)} 
              className={`flex items-center gap-1.5 transition-colors text-[11px] font-bold ${isDisliked ? 'text-accent' : 'text-white/40 hover:text-white'}`}
            >
              <MdThumbDown className="w-3.5 h-3.5" />
              {comment.dislikesCount > 0 && <span>{comment.dislikesCount}</span>}
            </button>
            
            <button 
              onClick={onReplyClick} 
              className="text-white/40 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider"
            >
              Reply
            </button>
          </div>

          {}
          {replyingTo === actualThreadId && !isReply && (!showReplies || !comment.replies || comment.replies.length === 0) && (
            <form onSubmit={(e) => handleSubmit(e, actualThreadId)} className="mt-2 mb-4 relative flex items-start gap-2 bg-white/5 border border-white/10 rounded-xl focus-within:border-accent/50 focus-within:bg-white/10 transition-all animate-in fade-in zoom-in-95 p-1 pl-3">
              {replyingToUser && (
                <div className="mt-1.5 flex items-center shrink-0">
                  <span className="bg-accent/20 text-accent px-1.5 py-0.5 rounded text-[11px] font-bold whitespace-nowrap">
                    @{replyingToUser}
                  </span>
                </div>
              )}
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="w-full bg-transparent py-2 text-xs text-white focus:outline-none resize-none min-h-[40px] max-h-[100px] custom-scrollbar"
                rows={1}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e, actualThreadId);
                  }
                }}
              />
              <div className="flex items-center gap-1 p-1 shrink-0 mt-1">
                <button 
                  type="button" 
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyingToUser(null);
                  }}
                  className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white rounded-lg transition-all"
                >
                  <MdClose className="w-4 h-4" />
                </button>
                <button 
                  type="submit" 
                  disabled={!replyText.trim()}
                  className="w-7 h-7 flex items-center justify-center bg-accent text-accent-foreground rounded-lg disabled:opacity-50 hover:brightness-110 transition-all"
                >
                  <MdSend className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {}
          {!isReply && comment.replies && comment.replies.length > 0 && (
            <button 
              onClick={() => setShowReplies(!showReplies)}
              className="mt-1 flex items-center gap-2 text-accent hover:brightness-125 transition-all text-[11px] font-bold uppercase tracking-wider w-fit"
            >
              <div className="w-4 h-[1px] bg-accent" />
              {showReplies ? 'Hide' : 'View'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      </div>

      {}
      {!isReply && comment.replies && comment.replies.length > 0 && showReplies && (
        <div className="ml-10 mt-2 flex flex-col gap-4">
          {comment.replies.map((reply: CommentType) => (
            <CommentNode 
              key={reply.id} 
              comment={reply} 
              isReply={true} 
              threadId={actualThreadId}
              currentUser={currentUser}
              replyingTo={replyingTo}
              replyingToUser={replyingToUser}
              replyText={replyText}
              setReplyingTo={setReplyingTo}
              setReplyingToUser={setReplyingToUser}
              setReplyText={setReplyText}
              handleLike={handleLike}
              handleDelete={handleDelete}
              handleSubmit={handleSubmit}
            />
          ))}
          {}
          {replyingTo === actualThreadId && (
            <form onSubmit={(e) => handleSubmit(e, actualThreadId)} className="mt-2 mb-4 relative flex items-start gap-2 bg-white/5 border border-white/10 rounded-xl focus-within:border-accent/50 focus-within:bg-white/10 transition-all animate-in fade-in zoom-in-95 p-1 pl-3">
              {replyingToUser && (
                <div className="mt-1.5 flex items-center shrink-0">
                  <span className="bg-accent/20 text-accent px-1.5 py-0.5 rounded text-[11px] font-bold whitespace-nowrap">
                    @{replyingToUser}
                  </span>
                </div>
              )}
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="w-full bg-transparent py-2 text-xs text-white focus:outline-none resize-none min-h-[40px] max-h-[100px] custom-scrollbar"
                rows={1}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e, actualThreadId);
                  }
                }}
              />
              <div className="flex items-center gap-1 p-1 shrink-0 mt-1">
                <button 
                  type="button" 
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyingToUser(null);
                  }}
                  className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white rounded-lg transition-all"
                >
                  <MdClose className="w-4 h-4" />
                </button>
                <button 
                  type="submit" 
                  disabled={!replyText.trim()}
                  className="w-7 h-7 flex items-center justify-center bg-accent text-accent-foreground rounded-lg disabled:opacity-50 hover:brightness-110 transition-all"
                >
                  <MdSend className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

interface CommentsSectionProps {
  mediaId: number;
  mediaType: string;
  season?: number;
  episode?: number;
  currentUser?: Record<string, unknown> | null;
  variant?: 'sidebar' | 'inline';
}

export default function CommentsSection({ mediaId, mediaType, season, episode, currentUser, variant = 'sidebar' }: CommentsSectionProps) {
  const router = useRouter();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyingToUser, setReplyingToUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    const res = await getComments(mediaId, mediaType, season, episode);
    if (res.success && res.comments) {
      setComments(res.comments);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    
    load();
    
  }, [mediaId, mediaType, season, episode]);

  const handleSubmit = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    if (!currentUser) {
      router.push('/auth');
      return;
    }
    
    const content = parentId && replyingToUser ? `@${replyingToUser} ${replyText}` : (parentId ? replyText : newComment);
    if (!content.trim() || content.trim() === `@${replyingToUser}`) return;

    if (parentId) {
      setReplyText("");
      setReplyingTo(null);
      setReplyingToUser(null);
    } else {
      setNewComment("");
    }

    const res = await postComment(mediaId, mediaType, content, season, episode, parentId || undefined);
    if (!res.success) {
      alert(res.error || "Failed to post message");
    } else {
      
      load();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    const res = await deleteComment(id);
    if (!res.success) {
      alert(res.error || "Failed to delete");
    } else {
      load();
    }
  };

  const handleLike = async (id: string, isLike: boolean) => {
    if (!currentUser) {
      router.push('/auth');
      return;
    }

    const updateTree = (nodes: CommentType[]): CommentType[] => {
      return nodes.map(node => {
        if (node.id === id) {
          let newLikeStatus = node.userLikeStatus;
          let newLikes = node.likesCount;
          let newDislikes = node.dislikesCount;

          if (node.userLikeStatus === (isLike ? 'like' : 'dislike')) {
            
            newLikeStatus = null;
            if (isLike) newLikes--;
            else newDislikes--;
          } else {
            
            if (node.userLikeStatus === 'like') newLikes--;
            if (node.userLikeStatus === 'dislike') newDislikes--;
            
            newLikeStatus = isLike ? 'like' : 'dislike';
            if (isLike) newLikes++;
            else newDislikes++;
          }

          return { ...node, userLikeStatus: newLikeStatus, likesCount: newLikes, dislikesCount: newDislikes };
        }
        if (node.replies) {
          return { ...node, replies: updateTree(node.replies) };
        }
        return node;
      });
    };

    setComments(prev => updateTree(prev));
    const res = await toggleCommentLike(id, isLike);
    if (!res.success) {
      
      load();
    }
  };

  const containerClass = variant === 'sidebar' 
    ? "flex flex-col h-full bg-background-elevated/50 backdrop-blur-3xl border-l border-white/5 relative"
    : "flex flex-col w-full relative";

  const listClass = variant === 'sidebar'
    ? "flex-1 overflow-y-auto p-5 flex flex-col gap-6 custom-scrollbar relative"
    : "flex flex-col gap-6 mt-6";

  const inputContainerClass = variant === 'sidebar'
    ? "p-4 border-t border-white/5 bg-black/40 shrink-0"
    : "w-full shrink-0";

  const inputForm = (
    <div className={inputContainerClass}>
      <form onSubmit={(e) => handleSubmit(e)} className={`relative flex items-end gap-2 bg-white/5 border border-white/10 focus-within:border-accent/50 focus-within:bg-white/10 transition-all ${variant === 'sidebar' ? 'rounded-xl' : 'rounded-2xl'}`}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={currentUser ? "Join the discussion..." : "Sign in to join the discussion"}
          className="w-full bg-transparent px-4 py-3 text-sm text-white focus:outline-none resize-none min-h-[44px] max-h-[120px] custom-scrollbar"
          rows={1}
          disabled={!currentUser}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <div className="flex items-center gap-1 p-2 shrink-0">
          <button 
            type="submit" 
            disabled={!newComment.trim() || !currentUser}
            className="w-8 h-8 flex items-center justify-center bg-accent text-accent-foreground rounded-lg disabled:opacity-50 hover:brightness-110 transition-all"
          >
            <MdSend className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className={containerClass}>
      {variant === 'sidebar' && (
        <div className="p-5 border-b border-white/5 flex items-center gap-3 bg-black/20 shrink-0">
          <MdChatBubbleOutline className="w-5 h-5 text-accent" />
          <h2 className="text-white font-bold tracking-widest text-sm uppercase">Discussion</h2>
        </div>
      )}

      {variant === 'inline' && inputForm}

      <div className={listClass}>
        {isLoading ? (
          <div className="flex items-center justify-center flex-1 py-10">
            <svg
              className="w-10 h-10 text-accent animate-[spin_0.8s_linear_infinite] drop-shadow-lg"
              viewBox="0 0 50 50"
            >
              <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" stroke="currentColor" strokeLinecap="round" strokeDasharray="90, 150" />
            </svg>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-white/30 text-center gap-2 py-10">
            <MdChatBubbleOutline className="w-10 h-10 opacity-20 mb-2" />
            <p className="text-sm">No messages yet.</p>
            <p className="text-xs">Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentNode 
              key={comment.id} 
              comment={comment} 
              currentUser={currentUser}
              replyingTo={replyingTo}
              replyingToUser={replyingToUser}
              replyText={replyText}
              setReplyingTo={setReplyingTo}
              setReplyingToUser={setReplyingToUser}
              setReplyText={setReplyText}
              handleLike={handleLike}
              handleDelete={handleDelete}
              handleSubmit={handleSubmit}
            />
          ))
        )}
      </div>

      {variant === 'sidebar' && inputForm}
    </div>
  );
}
