import { Type } from "lucide-react";
import { ScreenshotScreen } from "../../types";
import { GOOGLE_FONTS_PRESETS } from "../../templates";
import CollapsibleSection from "./CollapsibleSection";

interface Props {
  details: ScreenshotScreen;
  isLocked: boolean;
  handleUpdateField: <K extends keyof ScreenshotScreen>(key: K, value: ScreenshotScreen[K]) => void;
  collapsed: boolean;
  onToggleSection: (id: string) => void;
}

export default function TypographySection({ details, isLocked, handleUpdateField, collapsed, onToggleSection }: Props) {
  return (
    <CollapsibleSection id="typo" title="Typography Formatting" collapsed={collapsed} onToggle={onToggleSection}
      icon={<Type className="w-3.5 h-3.5" />}
    >
      <div className="space-y-3">
        <div>
          <span className="text-[10px] text-gray-500 font-semibold mb-1 block">Select Google Font</span>
          <select
            value={details.fontFamily}
            onChange={(e) => handleUpdateField("fontFamily", e.target.value)}
            className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {GOOGLE_FONTS_PRESETS.map((f) => (
              <option key={f.name} value={f.name}>{f.name} ({f.category})</option>
            ))}
          </select>
        </div>

        <div>
          <span className="text-[10px] text-gray-500 font-semibold mb-1 block">Headline Weight</span>
          <select
            value={details.headlineFontWeight}
            onChange={(e) => handleUpdateField("headlineFontWeight", e.target.value)}
            className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="300">Light (300)</option>
            <option value="400">Regular (400)</option>
            <option value="500">Medium (500)</option>
            <option value="600">Semi Bold (600)</option>
            <option value="700">Bold (700)</option>
            <option value="800">Extra Bold (800)</option>
            <option value="900">Black (900)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] text-gray-500 font-semibold mb-1 block">Title Color</span>
            <div className="flex items-center gap-1.5 bg-white p-1 rounded border border-gray-300">
              <input
                type="color"
                value={details.textColorHeadline}
                onChange={(e) => handleUpdateField("textColorHeadline", e.target.value)}
                className="w-6 h-6 rounded border-0 p-0 cursor-pointer bg-transparent"
              />
              <span className="text-[10px] text-gray-600 uppercase">{details.textColorHeadline}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-gray-500 font-semibold mb-1 block">Subtext Color</span>
            <div className="flex items-center gap-1.5 bg-white p-1 rounded border border-gray-300">
              <input
                type="color"
                value={details.textColorSubtext}
                onChange={(e) => handleUpdateField("textColorSubtext", e.target.value)}
                className="w-6 h-6 rounded border-0 p-0 cursor-pointer bg-transparent"
              />
              <span className="text-[10px] text-gray-600 uppercase">{details.textColorSubtext}</span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold mb-1">
            <span>Text Align</span>
            {isLocked && <span className="text-[9px] text-indigo-600 font-medium">*Global</span>}
          </div>
          <div className="grid grid-cols-3 gap-1 bg-gray-50 p-0.5 rounded border border-gray-200">
            {(["left", "center", "right"] as const).map((aln) => (
              <button
                key={aln}
                onClick={() => handleUpdateField("align", aln)}
                className={`py-1 text-[11px] font-semibold rounded capitalize cursor-pointer transition-all ${
                  details.align === aln
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >{aln}</button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold">
            <span>Headline Font Size ({details.fontSizeHeadline}px)</span>
          </div>
          <input type="range" min={30} max={150} value={details.fontSizeHeadline}
            onChange={(e) => handleUpdateField("fontSizeHeadline", parseInt(e.target.value))}
            className="w-full accent-indigo-500 h-1 mt-1 cursor-pointer bg-gray-100 rounded"
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold">
            <span>Subtext Font Size ({details.fontSizeSubtext}px)</span>
          </div>
          <input type="range" min={20} max={80} value={details.fontSizeSubtext}
            onChange={(e) => handleUpdateField("fontSizeSubtext", parseInt(e.target.value))}
            className="w-full accent-indigo-500 h-1 mt-1 cursor-pointer bg-gray-100 rounded"
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold">
            <span>Headline Line-Height ({details.lineHeightHeadline?.toFixed(2) || "1.25"})</span>
          </div>
          <input type="range" min={80} max={200} step={5}
            value={Math.round((details.lineHeightHeadline || 1.25) * 100)}
            onChange={(e) => handleUpdateField("lineHeightHeadline", parseInt(e.target.value) / 100)}
            className="w-full accent-indigo-500 h-1 mt-1 cursor-pointer bg-gray-100 rounded"
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold">
            <span>Subtext Line-Height ({details.lineHeightSubtext?.toFixed(2) || "1.35"})</span>
          </div>
          <input type="range" min={80} max={200} step={5}
            value={Math.round((details.lineHeightSubtext || 1.35) * 100)}
            onChange={(e) => handleUpdateField("lineHeightSubtext", parseInt(e.target.value) / 100)}
            className="w-full accent-indigo-500 h-1 mt-1 cursor-pointer bg-gray-100 rounded"
          />
        </div>
      </div>
    </CollapsibleSection>
  );
}
