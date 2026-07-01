"use client";

interface BookmarkButtonProps {
  onClick: () => void;
  isBookmarked?: boolean;
}

export function BookmarkButton({ onClick, isBookmarked }: BookmarkButtonProps) {
  return (
    <button
      onClick={onClick}
      className="ml-2 rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/40 hover:border-white/30 hover:text-white/70"
      title="Сохранить момент"
    >
      {isBookmarked ? "★" : "☆"}
    </button>
  );
}