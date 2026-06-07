import { LayoutGrid } from "lucide-react";
import { ScreenshotScreen, ASOProject, DeviceType, LayoutStyle, MockupColor } from "../../types";
import CollapsibleSection from "./CollapsibleSection";

interface Props {
  details: ScreenshotScreen;
  isLocked: boolean;
  handleUpdateField: <K extends keyof ScreenshotScreen>(key: K, value: ScreenshotScreen[K]) => void;
  onUpdateProject: (updater: (p: ASOProject) => ASOProject) => void;
  project: ASOProject;
  collapsed: boolean;
  onToggleSection: (id: string) => void;
}

export default function DeviceFrameSection({ details, isLocked, handleUpdateField, onUpdateProject, project, collapsed, onToggleSection }: Props) {
  return (
    <CollapsibleSection id="device" title="Mockup Device Frame" collapsed={collapsed} onToggle={onToggleSection}
      icon={<LayoutGrid className="w-3.5 h-3.5" />}
    >
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500 font-semibold">Aspect Ratio Canvas</span>
            {isLocked && <span className="text-[9px] text-indigo-600 font-medium">*Global</span>}
          </div>
          <select
            value={details.deviceType}
            onChange={(e) => handleUpdateField("deviceType", e.target.value as DeviceType)}
            className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="iphone_portrait">iPhone 6.5&quot; (1242x2688)</option>
            <option value="iphone_69_portrait">iPhone 6.9&quot; (1260x2736)</option>
            <option value="iphone_67_portrait">iPhone 6.7&quot; (1284x2778)</option>
            <option value="iphone_61_portrait">iPhone 6.1&quot; (1179x2556)</option>
            <option value="iphone_55_portrait">iPhone 5.5&quot; (1242x2208)</option>
            <option value="ipad_portrait">iPad Pro 12.9&quot; (2048x2732)</option>
            <option value="android_portrait">Android 19.5:9 (1440x3120)</option>
            <option value="android_pixel_portrait">Google Pixel (1080x2400)</option>
            <option value="android_samsung_portrait">Samsung Galaxy S (1440x3088)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] text-gray-500 font-semibold mb-1 block">Device Bezel</span>
            <select
              value={details.deviceColor}
              onChange={(e) => handleUpdateField("deviceColor", e.target.value as MockupColor)}
              className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="dark">Titanium Dark</option>
              <option value="light">Ceramic Light</option>
              <option value="spacegray">Space Gray</option>
              <option value="gold">Champagne Gold</option>
            </select>
          </div>

          <div>
            <span className="text-[10px] text-gray-500 font-semibold mb-1 block">Visual Layout</span>
            <select
              value={details.layoutStyle}
              onChange={(e) => handleUpdateField("layoutStyle", e.target.value as LayoutStyle)}
              className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="text-top">Text on Top</option>
              <option value="text-bottom">Text on Bottom</option>
              <option value="full-screenshot">Full Overlay</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-gray-500 font-semibold">Show Device Frame</span>
          <button
            onClick={() => onUpdateProject((p) => ({ ...p, globalSettings: { ...p.globalSettings, showDeviceFrame: !p.globalSettings.showDeviceFrame } }))}
            className={`w-7 h-4 rounded-full transition-colors cursor-pointer relative ${project.globalSettings.showDeviceFrame ? "bg-indigo-500" : "bg-gray-300"}`}
          >
            <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${project.globalSettings.showDeviceFrame ? "left-3.5" : "left-0.5"}`} />
          </button>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-gray-500 font-semibold">Screenshot Corners</span>
          <div className="flex gap-1">
            <button
              onClick={() => onUpdateProject((p) => ({ ...p, globalSettings: { ...p.globalSettings, screenshotCorners: "rounded" } }))}
              className={`px-2 py-1 text-[10px] rounded cursor-pointer font-medium transition-colors ${
                project.globalSettings.screenshotCorners === "rounded"
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >Round</button>
            <button
              onClick={() => onUpdateProject((p) => ({ ...p, globalSettings: { ...p.globalSettings, screenshotCorners: "square" } }))}
              className={`px-2 py-1 text-[10px] rounded cursor-pointer font-medium transition-colors ${
                project.globalSettings.screenshotCorners === "square"
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >Square</button>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
