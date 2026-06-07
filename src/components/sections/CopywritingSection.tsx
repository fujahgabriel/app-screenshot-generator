import { Type } from "lucide-react";
import { ScreenshotScreen, ASOProject } from "../../types";
import CollapsibleSection from "./CollapsibleSection";

interface Props {
  screen: ScreenshotScreen;
  activeLocale: string;
  handleUpdateField: <K extends keyof ScreenshotScreen>(key: K, value: ScreenshotScreen[K]) => void;
  onUpdateProject: (updater: (p: ASOProject) => ASOProject) => void;
  collapsed: boolean;
  onToggleSection: (id: string) => void;
}

export default function CopywritingSection({ screen, activeLocale, handleUpdateField, onUpdateProject, collapsed, onToggleSection }: Props) {
  return (
    <CollapsibleSection id="copy" title="Copywriting / Headlines" collapsed={collapsed} onToggle={onToggleSection}
      icon={<Type className="w-3.5 h-3.5" />}
    >
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500 font-semibold">HEADLINE TEXT</span>
            <span className="text-[9px] uppercase font-bold text-indigo-600">{activeLocale}</span>
          </div>
          <input
            type="text"
            value={screen.headline}
            onChange={(e) => {
              const val = e.target.value;
              handleUpdateField("headline", val);
              onUpdateProject((current) => ({
                ...current,
                screens: current.screens.map((s) =>
                  s.id === screen.id
                    ? { ...s, translations: { ...s.translations, [activeLocale]: { ...s.translations[activeLocale], headline: val } } }
                    : s
                ),
              }));
            }}
            placeholder="Headline..."
            className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 font-semibold"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500 font-semibold">SUBTEXT / DESCRIPTION</span>
            <span className="text-[9px] uppercase font-bold text-indigo-600">{activeLocale}</span>
          </div>
          <textarea
            value={screen.subtext}
            onChange={(e) => {
              const val = e.target.value;
              handleUpdateField("subtext", val);
              onUpdateProject((current) => ({
                ...current,
                screens: current.screens.map((s) =>
                  s.id === screen.id
                    ? { ...s, translations: { ...s.translations, [activeLocale]: { ...s.translations[activeLocale], subtext: val } } }
                    : s
                ),
              }));
            }}
            placeholder="Slogan..."
            rows={2}
            className="w-full bg-white border border-gray-300 rounded p-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 resize-none h-12"
          />
        </div>
      </div>
    </CollapsibleSection>
  );
}
