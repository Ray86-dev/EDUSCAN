"use client";

interface TopAppBarProps {
  title?: string;
  rightContent?: React.ReactNode;
}

export default function TopAppBar({ title = "Exámenes", rightContent }: TopAppBarProps) {
  return (
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">menu</span>
        </button>
        <h1 className="text-xl font-headline font-semibold text-on-surface">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {rightContent}
        <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
        </button>
      </div>
    </header>
  );
}
