import { LayoutGrid } from "lucide-react";
import { ScreenshotScreen } from "../../types";
import CollapsibleSection from "./CollapsibleSection";

interface Props {
  screen: ScreenshotScreen;
  handleUpdateField: <K extends keyof ScreenshotScreen>(key: K, value: ScreenshotScreen[K]) => void;
  collapsed: boolean;
  onToggleSection: (id: string) => void;
}

export default function OverlaysSection({ screen, handleUpdateField, collapsed, onToggleSection }: Props) {
  return (
    <CollapsibleSection id="effects" title="Background Effects" collapsed={collapsed} onToggle={onToggleSection}
      icon={<LayoutGrid className="w-3.5 h-3.5" />}
    >
      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
        {(screen.overlays || []).map((overlay, idx) => (
          <div key={overlay.type} className="bg-gray-50 border border-gray-200 rounded-lg p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const updated = [...(screen.overlays || [])];
                    updated[idx] = { ...updated[idx], enabled: !updated[idx].enabled };
                    handleUpdateField("overlays", updated);
                  }}
                  className={`w-7 h-4 rounded-full transition-colors cursor-pointer relative ${overlay.enabled ? "bg-indigo-500" : "bg-gray-300"}`}
                >
                  <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${overlay.enabled ? "left-3.5" : "left-0.5"}`} />
                </button>
                <span className={`text-[11px] font-semibold capitalize ${overlay.enabled ? "text-gray-800" : "text-gray-400"}`}>
                  {overlay.type.replace("-", " ")}
                </span>
              </div>
              {overlay.enabled && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-gray-500">{Math.round(overlay.opacity * 100)}%</span>
                  <input type="range" min={5} max={100}
                    value={Math.round(overlay.opacity * 100)}
                    onChange={(e) => {
                      const updated = [...(screen.overlays || [])];
                      updated[idx] = { ...updated[idx], opacity: parseInt(e.target.value) / 100 };
                      handleUpdateField("overlays", updated);
                    }}
                    className="w-16 accent-indigo-500 h-1 cursor-pointer bg-gray-200 rounded"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}
