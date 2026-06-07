import { Move } from "lucide-react";
import { ScreenshotScreen } from "../../types";
import CollapsibleSection from "./CollapsibleSection";

interface Props {
  screen: ScreenshotScreen;
  handleUpdateField: <K extends keyof ScreenshotScreen>(key: K, value: ScreenshotScreen[K]) => void;
  collapsed: boolean;
  onToggleSection: (id: string) => void;
}

export default function PlacementSection({ screen, handleUpdateField, collapsed, onToggleSection }: Props) {
  return (
    <CollapsibleSection id="placement" title="Advanced Device Placement" collapsed={collapsed} onToggle={onToggleSection}
      icon={<Move className="w-3.5 h-3.5" />}
    >
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold">
            <span>Mockup Scale ({Math.round(screen.deviceScale * 100)}%)</span>
            <button onClick={() => handleUpdateField("deviceScale", 1.0)} className="text-[9px] hover:text-gray-900 text-indigo-600">Reset (100%)</button>
          </div>
          <input type="range" min={15} max={180}
            value={Math.round(screen.deviceScale * 100)}
            onChange={(e) => handleUpdateField("deviceScale", parseFloat(e.target.value) / 100)}
            className="w-full accent-indigo-500 h-1 mt-1 cursor-pointer bg-gray-100 rounded"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold">
              <span>Offset Y ({screen.deviceOffsetY}%)</span>
              <button onClick={() => handleUpdateField("deviceOffsetY", 0)} className="text-[9px] text-gray-400 font-medium">0</button>
            </div>
            <input type="range" min={-50} max={50} value={screen.deviceOffsetY}
              onChange={(e) => handleUpdateField("deviceOffsetY", parseInt(e.target.value))}
              className="w-full accent-indigo-500 h-1 mt-1 cursor-pointer bg-gray-100 rounded"
            />
          </div>
          <div>
            <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold">
              <span>Offset X ({screen.deviceOffsetX}%)</span>
              <button onClick={() => handleUpdateField("deviceOffsetX", 0)} className="text-[9px] text-gray-400 font-medium">0</button>
            </div>
            <input type="range" min={-50} max={50} value={screen.deviceOffsetX}
              onChange={(e) => handleUpdateField("deviceOffsetX", parseInt(e.target.value))}
              className="w-full accent-indigo-500 h-1 mt-1 cursor-pointer bg-gray-100 rounded"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold">
            <span>Device Rotation ({screen.deviceRotation || 0}°)</span>
            <button onClick={() => handleUpdateField("deviceRotation", 0)} className="text-[9px] hover:text-gray-900 text-indigo-600 font-medium">Reset (0°)</button>
          </div>
          <input type="range" min={-45} max={45} value={screen.deviceRotation || 0}
            onChange={(e) => handleUpdateField("deviceRotation", parseInt(e.target.value))}
            className="w-full accent-indigo-500 h-1 mt-1 cursor-pointer bg-gray-100 rounded"
          />
        </div>
      </div>
    </CollapsibleSection>
  );
}
