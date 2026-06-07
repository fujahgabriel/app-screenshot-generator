import { useState, useEffect } from "react";
import { ASOProject, ScreenshotScreen } from "./types";
import { DEFAULT_PROJECTS, cloneOverlays } from "./templates";
import Sidebar from "./components/Sidebar";
import CanvasWorkspace from "./components/CanvasWorkspace";
import CustomizePanel from "./components/CustomizePanel";
import { Sparkles, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from "lucide-react";

export default function App() {
  // Bootstrap the application with the productivity preset by default
  const [project, setProject] = useState<ASOProject>(DEFAULT_PROJECTS.productivity);
  const [activeScreenId, setActiveScreenId] = useState<string>(
    DEFAULT_PROJECTS.productivity.screens[0]?.id || ""
  );

  // Load from localStorage if a previous session exists
  useEffect(() => {
    const saved = localStorage.getItem("aso_screenshot_pack_project_v1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && Array.isArray(parsed.screens)) {
          const mergeOverlays = (existing: any[]): any[] => {
            const defaults = cloneOverlays();
            if (!Array.isArray(existing)) return defaults;
            const existingMap = new Map(existing.map((o: any) => [o.type, o]));
            return defaults.map((def) => {
              const ext = existingMap.get(def.type);
              return ext ? { ...def, ...ext } : def;
            });
          };

          // Migrate old saves — ensure overlays, lineHeight, locale, translations, deviceRotation
          parsed.globalSettings.overlays = mergeOverlays(parsed.globalSettings.overlays);
          parsed.globalSettings.lineHeightHeadline ??= 1.25;
          parsed.globalSettings.lineHeightSubtext ??= 1.35;
          parsed.globalSettings.deviceRotation ??= 0;
          parsed.globalSettings.canvasCornerStyle ??= "rounded";
          parsed.locales ??= ["en"];
          parsed.activeLocale ??= "en";
          parsed.screens = parsed.screens.map((s: any) => ({
            ...s,
            lineHeightHeadline: s.lineHeightHeadline ?? 1.25,
            lineHeightSubtext: s.lineHeightSubtext ?? 1.35,
            deviceRotation: s.deviceRotation ?? 0,
            overlays: mergeOverlays(s.overlays),
            translations: s.translations || { en: { headline: s.headline, subtext: s.subtext } },
          }));
          setProject(parsed);
          if (parsed.screens.length > 0) {
            setActiveScreenId(parsed.screens[0].id);
          }
        }
      } catch (err) {
        console.warn("Could not read saved session, using default productivity layout.", err);
      }
    }
  }, []);

  // Save changes to localStorage
  const handleUpdateProject = (updater: (p: ASOProject) => ASOProject) => {
    setProject((current) => {
      const updated = updater(current);
      try {
        localStorage.setItem("aso_screenshot_pack_project_v1", JSON.stringify(updated));
      } catch (e) {
        if (e instanceof DOMException && e.name === "QuotaExceededError") {
          const stripped = { ...updated, screens: updated.screens.map((s) => ({ ...s, screenshotUrl: s.screenshotUrl?.startsWith("procedural:") ? s.screenshotUrl : null })) };
          try {
            localStorage.setItem("aso_screenshot_pack_project_v1", JSON.stringify(stripped));
          } catch {}
          console.warn("localStorage quota exceeded. Image data excluded from saved session.");
        }
      }
      return updated;
    });
  };

  // Switch active locale — swap headline/subtext across all screens
  const handleChangeLocale = (newLocale: string) => {
    setProject((current) => {
      const oldLocale = current.activeLocale;
      if (oldLocale === newLocale) return current;

      const updatedScreens = current.screens.map((screen) => {
        const translations = { ...screen.translations };
        // Save current text under old locale
        translations[oldLocale] = { headline: screen.headline, subtext: screen.subtext };
        // Load new locale text (or empty if first time)
        const t = translations[newLocale];
        return {
          ...screen,
          headline: t?.headline || "",
          subtext: t?.subtext || "",
          translations,
        };
      });

      return {
        ...current,
        activeLocale: newLocale,
        screens: updatedScreens,
      };
    });
  };

  // Add a new locale to the project
  const handleAddLocale = (locale: string) => {
    setProject((current) => {
      if (current.locales.includes(locale)) return current;
      const newLocales = [...current.locales, locale].sort();
      return {
        ...current,
        locales: newLocales,
        screens: current.screens.map((s) => ({
          ...s,
          translations: { ...s.translations, [locale]: { headline: "", subtext: "" } },
        })),
      };
    });
  };

  // Remove a locale (cannot remove the last one)
  const handleRemoveLocale = (locale: string) => {
    setProject((current) => {
      if (current.locales.length <= 1) return current;
      const newLocales = current.locales.filter((l) => l !== locale);
      let screens = current.screens;
      if (locale === current.activeLocale) {
        // Switch to first remaining locale
        const newLocale = newLocales[0];
        const oldLocale = current.activeLocale;
        screens = screens.map((screen) => {
          const translations = { ...screen.translations };
          translations[oldLocale] = { headline: screen.headline, subtext: screen.subtext };
          const t = translations[newLocale];
          return { ...screen, headline: t?.headline || "", subtext: t?.subtext || "", translations };
        });
        return { ...current, locales: newLocales, activeLocale: newLocale, screens };
      }
      return { ...current, locales: newLocales, screens: current.screens.map((s) => {
        const { [locale]: _, ...rest } = s.translations;
        return { ...s, translations: rest };
      })};
    });
  };

  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  // Reset/Apply a preset template category
  const handleApplyTemplate = (type: "kids" | "productivity") => {
    const template = DEFAULT_PROJECTS[type];
    if (template) {
      setProject(template);
      if (template.screens.length > 0) {
        setActiveScreenId(template.screens[0].id);
      }
      localStorage.setItem("aso_screenshot_pack_project_v1", JSON.stringify(template));
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-50 font-sans overflow-hidden select-none">
      
      {/* 1. TOP HEADER BRAND LINES */}
      <header className="h-12 shrink-0 bg-white border-b border-gray-200 px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 text-white p-1 rounded-md">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-gray-900 tracking-tight">ASO Studio</span>
          <span className="text-[10px] bg-indigo-50 text-indigo-600 font-semibold px-2 py-0.5 rounded border border-indigo-200">
            AI-Enhanced
          </span>
        </div>

        {/* Sidebar Toggle Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setLeftSidebarOpen((v) => !v)}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            title={leftSidebarOpen ? "Close left sidebar" : "Open left sidebar"}
          >
            {leftSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setRightSidebarOpen((v) => !v)}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            title={rightSidebarOpen ? "Close right sidebar" : "Open right sidebar"}
          >
            {rightSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button>
        </div>

        {/* Humility & Instructions metadata info (strictly anti-larping) */}
        <div className="flex items-center gap-5 text-[11px] text-gray-500">
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 py-0.5 px-2.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-gray-600 leading-none">Studio Engine Active</span>
          </div>
          
          
        </div>
      </header>

      {/* 2. MAIN SPLIT EDITOR WORKSPACE GRID */}
      <main className="flex-1 min-h-0 w-full flex overflow-hidden">
        
        {/* Left Side: Sequencer & Gemini Generation Form */}
        <Sidebar
          project={project}
          activeScreenId={activeScreenId}
          onUpdateProject={handleUpdateProject}
          onSelectScreen={setActiveScreenId}
          onApplyTemplate={handleApplyTemplate}
          activeLocale={project.activeLocale}
          locales={project.locales}
          onChangeLocale={handleChangeLocale}
          onAddLocale={handleAddLocale}
          onRemoveLocale={handleRemoveLocale}
          collapsed={!leftSidebarOpen}
          onToggle={() => setLeftSidebarOpen((v) => !v)}
        />

        {/* Central Workspace: Canvas View & Slide Deck filmic Strip */}
        <CanvasWorkspace
          project={project}
          activeScreenId={activeScreenId}
          onSelectScreen={setActiveScreenId}
          onUpdateProject={handleUpdateProject}
        />

        {/* Right Side: Customize slide parameters drawer (Colors, Sizing, Sliders, Uploads) */}
        <CustomizePanel
          project={project}
          activeScreenId={activeScreenId}
          onUpdateProject={handleUpdateProject}
          activeLocale={project.activeLocale}
          collapsed={!rightSidebarOpen}
          onToggle={() => setRightSidebarOpen((v) => !v)}
        />

      </main>

    </div>
  );
}
