import { ScreenshotScreen } from "../../types";
import CollapsibleSection from "./CollapsibleSection";

interface Props {
  screen: ScreenshotScreen;
  handleUpdateField: <K extends keyof ScreenshotScreen>(key: K, value: ScreenshotScreen[K]) => void;
  collapsed: boolean;
  onToggleSection: (id: string) => void;
}

export default function ZoomCalloutSection({ screen, handleUpdateField, collapsed, onToggleSection }: Props) {
  return (
    <CollapsibleSection id="zoom" title="Zoom Callout" collapsed={collapsed} onToggle={onToggleSection}
      icon={
        <svg className="w-3.5 h-3.5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6M8 11h6"/>
        </svg>
      }
      extra={
        <button
          onClick={() => {
            const fp = screen.zoomCallout;
            const next = fp
              ? { ...fp, enabled: !fp.enabled }
              : { enabled: true, sourceY: 50, sourceH: 22, zoom: 2.2, panelW: 88, overlayOpacity: 0.55, panelOffset: 0 };
            handleUpdateField("zoomCallout", next as any);
          }}
          className={`w-8 h-4.5 rounded-full relative transition-colors cursor-pointer flex items-center px-0.5 ${
            screen.zoomCallout?.enabled ? "bg-indigo-500" : "bg-gray-300"
          }`}
          style={{ width: 28, height: 16 }}
        >
          <div className={`w-3 h-3 bg-white rounded-full absolute transition-all ${
            screen.zoomCallout?.enabled ? "left-3.5" : "left-0.5"
          }`} />
        </button>
      }
    >
      {screen.zoomCallout?.enabled && (
        <div className="space-y-3 mt-2">
          <div>
            <div className="flex justify-between text-[10px] text-gray-500 font-semibold">
              <span>Focus Position (Y)</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-700">{screen.zoomCallout.sourceY}%</span>
                <button onClick={() => handleUpdateField("zoomCallout", { ...screen.zoomCallout!, sourceY: 50 } as any)} className="text-indigo-600 hover:text-gray-900 cursor-pointer" title="Reset">↺</button>
              </div>
            </div>
            <input type="range" min={5} max={95} value={screen.zoomCallout.sourceY}
              onChange={(e) => handleUpdateField("zoomCallout", { ...screen.zoomCallout!, sourceY: parseInt(e.target.value) } as any)}
              className="w-full accent-indigo-500 h-1 mt-1 cursor-pointer bg-gray-100 rounded"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-gray-500 font-semibold">
              <span>Capture Height</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-700">{screen.zoomCallout.sourceH}%</span>
                <button onClick={() => handleUpdateField("zoomCallout", { ...screen.zoomCallout!, sourceH: 22 } as any)} className="text-indigo-600 hover:text-gray-900 cursor-pointer" title="Reset">↺</button>
              </div>
            </div>
            <input type="range" min={5} max={60} value={screen.zoomCallout.sourceH}
              onChange={(e) => handleUpdateField("zoomCallout", { ...screen.zoomCallout!, sourceH: parseInt(e.target.value) } as any)}
              className="w-full accent-indigo-500 h-1 mt-1 cursor-pointer bg-gray-100 rounded"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-gray-500 font-semibold">
              <span>Zoom Level</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-700">{screen.zoomCallout.zoom.toFixed(1)}×</span>
                <button onClick={() => handleUpdateField("zoomCallout", { ...screen.zoomCallout!, zoom: 2.2 } as any)} className="text-indigo-600 hover:text-gray-900 cursor-pointer" title="Reset">↺</button>
              </div>
            </div>
            <input type="range" min={10} max={50} value={Math.round(screen.zoomCallout.zoom * 10)}
              onChange={(e) => handleUpdateField("zoomCallout", { ...screen.zoomCallout!, zoom: parseInt(e.target.value) / 10 } as any)}
              className="w-full accent-indigo-500 h-1 mt-1 cursor-pointer bg-gray-100 rounded"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-gray-500 font-semibold">
              <span>Panel Offset</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-700">{screen.zoomCallout.panelOffset > 0 ? "+" : ""}{screen.zoomCallout.panelOffset}%</span>
                <button onClick={() => handleUpdateField("zoomCallout", { ...screen.zoomCallout!, panelOffset: 0 } as any)} className="text-indigo-600 hover:text-gray-900 cursor-pointer" title="Reset">↺</button>
              </div>
            </div>
            <input type="range" min={-25} max={25} value={screen.zoomCallout.panelOffset}
              onChange={(e) => handleUpdateField("zoomCallout", { ...screen.zoomCallout!, panelOffset: parseInt(e.target.value) } as any)}
              className="w-full accent-indigo-500 h-1 mt-1 cursor-pointer bg-gray-100 rounded"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-gray-500 font-semibold">
              <span>Panel Width</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-700">{screen.zoomCallout.panelW}%</span>
                <button onClick={() => handleUpdateField("zoomCallout", { ...screen.zoomCallout!, panelW: 88 } as any)} className="text-indigo-600 hover:text-gray-900 cursor-pointer" title="Reset">↺</button>
              </div>
            </div>
            <input type="range" min={40} max={100} value={screen.zoomCallout.panelW}
              onChange={(e) => handleUpdateField("zoomCallout", { ...screen.zoomCallout!, panelW: parseInt(e.target.value) } as any)}
              className="w-full accent-indigo-500 h-1 mt-1 cursor-pointer bg-gray-100 rounded"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-gray-500 font-semibold">
              <span>Screen Dim</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-700">{Math.round(screen.zoomCallout.overlayOpacity * 100)}%</span>
                <button onClick={() => handleUpdateField("zoomCallout", { ...screen.zoomCallout!, overlayOpacity: 0.55 } as any)} className="text-indigo-600 hover:text-gray-900 cursor-pointer" title="Reset">↺</button>
              </div>
            </div>
            <input type="range" min={0} max={85} value={Math.round(screen.zoomCallout.overlayOpacity * 100)}
              onChange={(e) => handleUpdateField("zoomCallout", { ...screen.zoomCallout!, overlayOpacity: parseInt(e.target.value) / 100 } as any)}
              className="w-full accent-indigo-500 h-1 mt-1 cursor-pointer bg-gray-100 rounded"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button onClick={() => handleUpdateField("zoomCallout", { enabled: true, sourceY: 50, sourceH: 22, zoom: 2.2, panelW: 88, overlayOpacity: 0.55, panelOffset: 0 } as any)} className="text-[10px] text-indigo-600 hover:text-gray-900 cursor-pointer">Reset all</button>
            <button onClick={() => handleUpdateField("zoomCallout", undefined as any)} className="text-[10px] text-rose-600 hover:text-rose-500 cursor-pointer">Remove callout</button>
          </div>
        </div>
      )}
    </CollapsibleSection>
  );
}
