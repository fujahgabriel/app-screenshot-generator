import { ChevronDown } from "lucide-react";
import { ReactNode } from "react";

interface CollapsibleSectionProps {
  id: string;
  collapsed: boolean;
  onToggle: (id: string) => void;
  icon?: ReactNode;
  title: string;
  children: ReactNode;
  extra?: ReactNode;
}

export default function CollapsibleSection({ id, collapsed, onToggle, icon, title, children, extra }: CollapsibleSectionProps) {
  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => onToggle(id)} className="flex items-center gap-1.5 text-left">
          {icon && <span className="w-3.5 h-3.5 text-indigo-500 shrink-0">{icon}</span>}
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{title}</span>
          <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${collapsed ? "-rotate-90" : ""}`} />
        </button>
        {extra}
      </div>
      {!collapsed && children}
    </div>
  );
}
