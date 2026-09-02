"use client";

import { useState, useEffect, useRef } from "react";
import { Comment } from "@/lib/types";
import { getComments, addComment, updateComment, deleteComment } from "@/lib/comments";
import { motion, AnimatePresence } from "motion/react";

interface CommentSectionProps {
  todoId: string;
  commentCount: number;
  onCommentCountChange: (count: number) => void;
}

export default function CommentSection({ todoId, commentCount, onCommentCountChange }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [newBody, setNewBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [mutating, setMutating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!loaded) {
      setLoading(true);
      getComments(todoId)
        .then((data) => {
          setComments(data);
          setLoaded(true);
        })
        .catch((e) => console.error("Failed to load comments", e))
        .finally(() => setLoading(false));
    }
  }, [todoId, loaded]);

  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus();
      editRef.current.selectionStart = editRef.current.value.length;
    }
  }, [editingId]);

  const handleAdd = async () => {
    if (!newBody.trim() || mutating) return;
    setMutating(true);
    try {
      const comment = await addComment(todoId, newBody.trim());
      setComments([...comments, comment]);
      onCommentCountChange(commentCount + 1);
      setNewBody("");
    } catch (e) {
      console.error("Failed to add comment", e);
    }
    setMutating(false);
  };

  const handleUpdate = async (id: string) => {
    if (!editBody.trim() || mutating) return;
    setMutating(true);
    try {
      await updateComment(id, editBody.trim());
      setComments(comments.map((c) => (c.id === id ? { ...c, body: editBody.trim(), updated_at: new Date().toISOString() } : c)));
      setEditingId(null);
    } catch (e) {
      console.error("Failed to update comment", e);
    }
    setMutating(false);
  };

  const handleDelete = async (id: string) => {
    if (mutating) return;
    setMutating(true);
    try {
      await deleteComment(id);
      setComments(comments.filter((c) => c.id !== id));
      onCommentCountChange(commentCount - 1);
    } catch (e) {
      console.error("Failed to delete comment", e);
    }
    setMutating(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="mt-sm pt-sm border-t border-outline-variant/20">
      {loading && (
        <p className="text-xs text-on-surface-variant py-2">Loading comments...</p>
      )}

      <AnimatePresence>
        {comments.map((comment) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mb-sm"
          >
            {editingId === comment.id ? (
              <div className="flex gap-sm">
                <textarea
                  ref={editRef}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleUpdate(comment.id);
                    }
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="flex-1 px-2 py-1 text-sm bg-surface-secondary border border-outline-variant/30 rounded-lg outline-none focus:border-primary resize-none"
                  rows={2}
                />
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleUpdate(comment.id)}
                    className="p-1 rounded-lg hover:bg-surface-secondary text-primary"
                  >
                    <span className="material-symbols-outlined text-sm">check</span>
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1 rounded-lg hover:bg-surface-secondary text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="group rounded-lg hover:bg-surface-variant/30 p-2 -mx-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-on-surface-variant">
                    {formatDate(comment.created_at)}
                    {comment.updated_at && " (edited)"}
                  </span>
                  <div className="hidden group-hover:flex items-center gap-0.5">
                    <button
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditBody(comment.body);
                      }}
                      disabled={mutating}
                      className="p-0.5 rounded hover:bg-surface-secondary text-on-surface-variant disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(comment.id)}
                      disabled={mutating}
                      className="p-0.5 rounded hover:bg-surface-secondary text-error disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="flex gap-sm mt-sm">
        <textarea
          ref={textareaRef}
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Add a comment..."
          className="flex-1 px-2 py-1 text-sm bg-surface-secondary border border-outline-variant/30 rounded-lg outline-none focus:border-primary resize-none"
          rows={1}
        />
        <button
          onClick={handleAdd}
          disabled={!newBody.trim() || mutating}
          className="px-2 py-1 text-sm rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-50 transition-all"
        >
          <span className="material-symbols-outlined text-sm">{mutating ? "hourglass_empty" : "send"}</span>
        </button>
      </div>
    </div>
  );
}
