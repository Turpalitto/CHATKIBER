"use client";

import { useState, useEffect } from "react";

export interface Bookmark {
  id: string;
  messageText: string;
  sessionId: string;
  frequencyLabel: string;
  createdAt: number;
}

const STORAGE_KEY = "signal-bookmarks";

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setBookmarks(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const addBookmark = (messageText: string, sessionId: string, frequencyLabel: string) => {
    const newBookmark: Bookmark = {
      id: Date.now().toString(36),
      messageText: messageText.slice(0, 120),
      sessionId,
      frequencyLabel,
      createdAt: Date.now()
    };

    const updated = [newBookmark, ...bookmarks].slice(0, 50);
    setBookmarks(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const removeBookmark = (id: string) => {
    const updated = bookmarks.filter(b => b.id !== id);
    setBookmarks(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return { bookmarks, addBookmark, removeBookmark };
}