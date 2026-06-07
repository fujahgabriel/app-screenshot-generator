import { Palette } from "lucide-react";
import { ScreenshotScreen, BackgroundType } from "../../types";
import CollapsibleSection from "./CollapsibleSection";

interface Props {
  details: ScreenshotScreen;
  handleUpdateField: <K extends keyof ScreenshotScreen>(key: K, value: ScreenshotScreen[K]) => void;
  collapsed: boolean;
  onToggleSection: (id: string) => void;
}

export default function GradientsSection({ details, handleUpdateField, collapsed, onToggleSection }: Props) {
  return (
    <CollapsibleSection id="gradients" title="Gradients & Canvas Colors" collapsed={collapsed} onToggle={onToggleSection}
      icon={<Palette className="w-3.5 h-3.5" />}
    >
      <div className="space-y-3">
        <div>
          <span className="text-[10px] text-gray-500 font-semibold mb-1 block">Canvas Style</span>
          <select
            value={details.backgroundType}
            onChange={(e) => handleUpdateField("backgroundType", e.target.value as BackgroundType)}
            className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="solid">Solid Palette Color</option>
            <option value="linear-gradient">Linear Gradient Blend</option>
            <option value="radial-gradient">Radial Gradient Bloom</option>
          </select>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <span className="text-[10px] text-gray-500 font-semibold mb-1 block">Primary Color</span>
            <div className="flex items-center gap-2 bg-white p-1 rounded border border-gray-300">
              <input
                type="color"
                value={details.backgroundColor1}
                onChange={(e) => handleUpdateField("backgroundColor1", e.target.value)}
                className="w-7 h-7 rounded border-0 p-0 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                maxLength={7}
                value={details.backgroundColor1.toUpperCase()}
                onChange={(e) => handleUpdateField("backgroundColor1", e.target.value)}
                className="w-16 bg-transparent border-none text-[11px] text-gray-700 uppercase focus:outline-none"
              />
            </div>
          </div>

          {details.backgroundType !== "solid" && (
            <div className="flex-1">
              <span className="text-[10px] text-gray-500 font-semibold mb-1 block">Secondary Color</span>
              <div className="flex items-center gap-2 bg-white p-1 rounded border border-gray-300">
                <input
                  type="color"
                  value={details.backgroundColor2}
                  onChange={(e) => handleUpdateField("backgroundColor2", e.target.value)}
                  className="w-7 h-7 rounded border-0 p-0 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  maxLength={7}
                  value={details.backgroundColor2.toUpperCase()}
                  onChange={(e) => handleUpdateField("backgroundColor2", e.target.value)}
                  className="w-16 bg-transparent border-none text-[11px] text-gray-700 uppercase focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {details.backgroundType === "linear-gradient" && (
          <div>
            <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold">
              <span>Gradient Direction (Angle)</span>
              <span className="text-gray-700 font-semibold">{details.gradientAngle}°</span>
            </div>
            <input
              type="range"
              min={0} max={360}
              value={details.gradientAngle}
              onChange={(e) => handleUpdateField("gradientAngle", parseInt(e.target.value))}
              className="w-full accent-indigo-500 h-1 mt-1 cursor-pointer bg-gray-100 rounded-lg appearance-none"
            />
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}
