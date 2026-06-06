import React, { useRef, useState } from "react";
import { 
  Lock, Unlock, Upload, Check, AlertCircle,
  Type, Move, Palette, LayoutGrid
} from "lucide-react";
import { ASOProject, ScreenshotScreen, DeviceType, LayoutStyle, BackgroundType, MockupColor } from "../types";
import { GOOGLE_FONTS_PRESETS, DEVICE_SIZES } from "../templates";

interface CustomizePanelProps {
  project: ASOProject;
  activeScreenId: string;
  onUpdateProject: (updater: (p: ASOProject) => ASOProject) => void;
  activeLocale: string;
}

export default function CustomizePanel({
  project,
  activeScreenId,
  onUpdateProject,
  activeLocale,
}: CustomizePanelProps) {
  const activeScreen = project.screens.find(s => s.id === activeScreenId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  if (!activeScreen) {
    return (
      <div className="w-80 h-full bg-slate-900 border-l border-slate-800 text-slate-400 p-6 flex flex-col items-center justify-center select-none text-center">
        <AlertCircle className="w-10 h-10 text-slate-600 mb-2" />
        <span className="text-sm">No active screen focused. Select a screen to edit in the sequence list.</span>
      </div>
    );
  }

  // Determine current effective style settings (screen-specific, or global if locked)
  const isLocked = activeScreen.isLocked;
  const currentDetails = isLocked ? project.globalSettings : activeScreen;

  // Generic key update helper
  const handleUpdateField = <K extends keyof ScreenshotScreen>(key: K, value: ScreenshotScreen[K]) => {
    onUpdateProject((current) => {
      const screens = current.screens.map((screen) => {
        if (screen.id === activeScreenId) {
          return {
            ...screen,
            [key]: value,
          };
        }
        return screen;
      });

      // Also support updating corresponding global settings if locked
      let globalSettings = current.globalSettings;
      if (isLocked && key in globalSettings) {
        globalSettings = {
          ...globalSettings,
          [key]: value as any,
        };

        // If locked to global, we propagate this styling key to ALL screens that are locked!
        const autoSyncedScreens = screens.map((s) => {
          if (s.isLocked) {
            return {
              ...s,
              [key]: value,
            };
          }
          return s;
        });

        return {
          ...current,
          globalSettings,
          screens: autoSyncedScreens,
        };
      }

      return {
        ...current,
        screens,
      };
    });
  };

  // Lock status toggle
  const handleToggleLock = () => {
    onUpdateProject((current) => {
      const screens = current.screens.map((screen) => {
        if (screen.id === activeScreenId) {
          const nextLocked = !screen.isLocked;
          if (nextLocked) {
            // Apply current global settings immediately to this screen
            return {
              ...screen,
              isLocked: true,
              deviceType: current.globalSettings.deviceType,
              deviceColor: current.globalSettings.deviceColor,
              backgroundType: current.globalSettings.backgroundType,
              backgroundColor1: current.globalSettings.backgroundColor1,
              backgroundColor2: current.globalSettings.backgroundColor2,
              gradientAngle: current.globalSettings.gradientAngle,
              fontFamily: current.globalSettings.fontFamily,
              headlineFontWeight: current.globalSettings.headlineFontWeight,
              textColorHeadline: current.globalSettings.textColorHeadline,
              textColorSubtext: current.globalSettings.textColorSubtext,
              fontSizeHeadline: current.globalSettings.fontSizeHeadline,
              fontSizeSubtext: current.globalSettings.fontSizeSubtext,
              lineHeightHeadline: current.globalSettings.lineHeightHeadline || 1.25,
              lineHeightSubtext: current.globalSettings.lineHeightSubtext || 1.35,
              align: current.globalSettings.align,
              layoutStyle: current.globalSettings.layoutStyle,
              overlays: current.globalSettings.overlays || [],
            };
          } else {
            // Detach and keep current values as custom overrides
            return {
              ...screen,
              isLocked: false,
            };
          }
        }
        return screen;
      });
      return {
        ...current,
        screens,
      };
    });
  };

  // Convert uploaded image file to data URL
  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, HEIC, or SVG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        handleUpdateField("screenshotUrl", result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  return (
    <div className="w-80 h-full bg-slate-900 border-l border-slate-800 text-slate-200 flex flex-col overflow-y-auto shrink-0 select-none">
      
      {/* Title & Custom Lock Scope state */}
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Slide Config</span>
          <h2 className="text-sm font-bold text-white truncate max-w-[150px]">{activeScreen.name}</h2>
        </div>

        {/* Global style Sync Button (Figma/Photoshop styled Lock) */}
        <button
          onClick={handleToggleLock}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
            isLocked
              ? "bg-indigo-950 border-indigo-700/60 text-indigo-300"
              : "bg-amber-950 border-amber-800/60 text-amber-300"
          }`}
          title={isLocked ? "Currently synced to global project details" : "Independent custom overrides applied"}
        >
          {isLocked ? (
            <>
              <Lock className="w-3 h-3 text-indigo-400" />
              <span>Global Synced</span>
            </>
          ) : (
            <>
              <Unlock className="w-3 h-3 text-amber-400" />
              <span>Independent</span>
            </>
          )}
        </button>
      </div>

      {/* 1. MOCKUP SCREEN UPLOAD PANEL */}
      <div className="p-4 border-b border-slate-800">
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
          <Upload className="w-3.5 h-3.5" />
          <span>Screenshot Media Sandbox</span>
        </label>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`h-24 w-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all ${
            dragOver 
              ? "border-indigo-500 bg-indigo-950/20 text-indigo-300" 
              : activeScreen.screenshotUrl && !activeScreen.screenshotUrl.startsWith("procedural:")
              ? "border-emerald-700/60 bg-slate-950 text-emerald-400"
              : "border-slate-800 bg-slate-950 hover:bg-slate-950/60 text-slate-500"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          {activeScreen.screenshotUrl && !activeScreen.screenshotUrl.startsWith("procedural:") ? (
            <>
              <Check className="w-6 h-6 text-emerald-400 mb-1" />
              <span className="text-[11px] font-medium">Custom Screen Active (Click to Replace)</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 mb-1" />
              <span className="text-[11px] text-slate-300 font-medium">Drag & drop or Click to upload</span>
              <span className="text-[9px] text-slate-500 mt-0.5">Procedural play is showing as default</span>
            </>
          )}
        </div>

        {activeScreen.screenshotUrl && (
          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-medium">Render aspect-fit</span>
            <div className="flex gap-1.5 bg-slate-950 p-0.5 rounded-md border border-slate-800">
              <button
                onClick={() => handleUpdateField("screenshotFit", "cover")}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                  activeScreen.screenshotFit === "cover" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Cover
              </button>
              <button
                onClick={() => handleUpdateField("screenshotFit", "contain")}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                  activeScreen.screenshotFit === "contain" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Contain
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. TEXT CAPTION LABELS */}
      <div className="p-4 border-b border-slate-800">
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5 text-indigo-400" />
          <span>Copywriting / Headlines</span>
        </label>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-500 font-semibold">HEADLINE TEXT</span>
              <span className="text-[9px] uppercase font-bold text-indigo-400">{activeLocale}</span>
            </div>
            <input
              type="text"
              value={activeScreen.headline}
              onChange={(e) => {
                const val = e.target.value;
                handleUpdateField("headline", val);
                onUpdateProject((current) => ({
                  ...current,
                  screens: current.screens.map((s) =>
                    s.id === activeScreenId
                      ? { ...s, translations: { ...s.translations, [activeLocale]: { ...s.translations[activeLocale], headline: val } } }
                      : s
                  ),
                }));
              }}
              placeholder="Headline..."
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-semibold"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-500 font-semibold">SUBTEXT / DESCRIPTION</span>
              <span className="text-[9px] uppercase font-bold text-indigo-400">{activeLocale}</span>
            </div>
            <textarea
              value={activeScreen.subtext}
              onChange={(e) => {
                const val = e.target.value;
                handleUpdateField("subtext", val);
                onUpdateProject((current) => ({
                  ...current,
                  screens: current.screens.map((s) =>
                    s.id === activeScreenId
                      ? { ...s, translations: { ...s.translations, [activeLocale]: { ...s.translations[activeLocale], subtext: val } } }
                      : s
                  ),
                }));
              }}
              placeholder="Slogan..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none h-12"
            />
          </div>
        </div>
      </div>

      {/* 3. DEVICE LAYOUT CONFIG */}
      <div className="p-4 border-b border-slate-800">
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
          <span>Mockup Device Frame</span>
        </label>

        <div className="space-y-3">
          {/* Device Type Select */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-500 font-semibold">Aspect Ratio Canvas</span>
              {isLocked && <span className="text-[9px] text-indigo-400 font-medium">*Global</span>}
            </div>
            <select
              value={currentDetails.deviceType}
              onChange={(e) => handleUpdateField("deviceType", e.target.value as DeviceType)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="iphone_portrait">iPhone 6.5&quot;-6.7&quot; (19.5:9 Display)</option>
              <option value="iphone_69_portrait">iPhone 6.9&quot; Display (1260x2736)</option>
              <option value="ipad_portrait">iPad Pro 12.9&quot; (4:3 Tablet)</option>
              <option value="android_portrait">Google Play Store Phone (19.5:9)</option>
            </select>
          </div>

          {/* Color & Layout Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-slate-500 font-semibold mb-1 block">Device Bezel</span>
              <select
                value={currentDetails.deviceColor}
                onChange={(e) => handleUpdateField("deviceColor", e.target.value as MockupColor)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="dark">Titanium Dark</option>
                <option value="light">Ceramic Light</option>
                <option value="spacegray">Space Gray</option>
                <option value="gold">Champagne Gold</option>
              </select>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 font-semibold mb-1 block">Visual Layout</span>
              <select
                value={currentDetails.layoutStyle}
                onChange={(e) => handleUpdateField("layoutStyle", e.target.value as LayoutStyle)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="text-top">Text on Top</option>
                <option value="text-bottom">Text on Bottom</option>
                <option value="full-screenshot">Full Overlay</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BACKGROUND STYLING (Color Pickers) */}
      <div className="p-4 border-b border-slate-800">
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-indigo-400" />
          <span>Gradients & Canvas Colors</span>
        </label>

        <div className="space-y-3">
          {/* Background Style Type */}
          <div>
            <span className="text-[10px] text-slate-500 font-semibold mb-1 block">Canvas Style</span>
            <select
              value={currentDetails.backgroundType}
              onChange={(e) => handleUpdateField("backgroundType", e.target.value as BackgroundType)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="solid">Solid Palette Color</option>
              <option value="linear-gradient">Linear Gradient Blend</option>
              <option value="radial-gradient">Radial Gradient Bloom</option>
            </select>
          </div>

          {/* Color pickers */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <span className="text-[10px] text-slate-500 font-semibold mb-1 block">Primary Color</span>
              <div className="flex items-center gap-2 bg-slate-950 p-1 rounded border border-slate-800">
                <input
                  type="color"
                  value={currentDetails.backgroundColor1}
                  onChange={(e) => handleUpdateField("backgroundColor1", e.target.value)}
                  className="w-7 h-7 rounded border-0 p-0 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  maxLength={7}
                  value={currentDetails.backgroundColor1.toUpperCase()}
                  onChange={(e) => handleUpdateField("backgroundColor1", e.target.value)}
                  className="w-16 bg-transparent border-none text-[11px] text-slate-200 uppercase focus:outline-none"
                />
              </div>
            </div>

            {currentDetails.backgroundType !== "solid" && (
              <div className="flex-1">
                <span className="text-[10px] text-slate-500 font-semibold mb-1 block">Secondary Color</span>
                <div className="flex items-center gap-2 bg-slate-950 p-1 rounded border border-slate-800">
                  <input
                    type="color"
                    value={currentDetails.backgroundColor2}
                    onChange={(e) => handleUpdateField("backgroundColor2", e.target.value)}
                    className="w-7 h-7 rounded border-0 p-0 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    maxLength={7}
                    value={currentDetails.backgroundColor2.toUpperCase()}
                    onChange={(e) => handleUpdateField("backgroundColor2", e.target.value)}
                    className="w-16 bg-transparent border-none text-[11px] text-slate-200 uppercase focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Angle for Linear Gradients */}
          {currentDetails.backgroundType === "linear-gradient" && (
            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                <span>Gradient Direction (Angle)</span>
                <span className="text-slate-300 font-semibold">{currentDetails.gradientAngle}°</span>
              </div>
              <input
                type="range"
                min={0}
                max={360}
                value={currentDetails.gradientAngle}
                onChange={(e) => handleUpdateField("gradientAngle", parseInt(e.target.value))}
                className="w-full accent-indigo-500 h-1 mt-1 cursor-pointer bg-slate-950 rounded-lg appearance-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* 5. TYPOGRAPHY DETAILS */}
      <div className="p-4 border-b border-slate-800">
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5 text-indigo-400" />
          <span>Typography Formatting</span>
        </label>

        <div className="space-y-3">
          {/* Family Select */}
          <div>
            <span className="text-[10px] text-slate-500 font-semibold mb-1 block">Select Google Font</span>
            <select
              value={currentDetails.fontFamily}
              onChange={(e) => handleUpdateField("fontFamily", e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {GOOGLE_FONTS_PRESETS.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name} ({f.category})
                </option>
              ))}
            </select>
          </div>

          {/* Font Weight Select */}
          <div>
            <span className="text-[10px] text-slate-500 font-semibold mb-1 block">Headline Weight</span>
            <select
              value={currentDetails.headlineFontWeight}
              onChange={(e) => handleUpdateField("headlineFontWeight", e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
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
            {/* Color of Headline */}
            <div>
              <span className="text-[10px] text-slate-500 font-semibold mb-1 block">Title Color</span>
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded border border-slate-800">
                <input
                  type="color"
                  value={currentDetails.textColorHeadline}
                  onChange={(e) => handleUpdateField("textColorHeadline", e.target.value)}
                  className="w-6 h-6 rounded border-0 p-0 cursor-pointer bg-transparent"
                />
                <span className="text-[10px] text-slate-300 uppercase">{currentDetails.textColorHeadline}</span>
              </div>
            </div>

            {/* Color of Subtext */}
            <div>
              <span className="text-[10px] text-slate-500 font-semibold mb-1 block">Subtext Color</span>
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded border border-slate-800">
                <input
                  type="color"
                  value={currentDetails.textColorSubtext}
                  onChange={(e) => handleUpdateField("textColorSubtext", e.target.value)}
                  className="w-6 h-6 rounded border-0 p-0 cursor-pointer bg-transparent"
                />
                <span className="text-[10px] text-slate-300 uppercase">{currentDetails.textColorSubtext}</span>
              </div>
            </div>
          </div>

          {/* Sizing sliders & Alignment */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mb-1">
              <span>Text Align</span>
              {isLocked && <span className="text-[9px] text-indigo-400 font-medium">*Global</span>}
            </div>
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
              {(["left", "center", "right"] as const).map((aln) => (
                <button
                  key={aln}
                  onClick={() => handleUpdateField("align", aln)}
                  className={`py-1 text-[11px] font-semibold rounded capitalize cursor-pointer transition-all ${
                    currentDetails.align === aln 
                      ? "bg-indigo-600 text-white shadow-sm" 
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {aln}
                </button>
              ))}
            </div>
          </div>

          {/* Headline Size Slider */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
              <span>Headline Font Size ({currentDetails.fontSizeHeadline}px)</span>
            </div>
            <input
              type="range"
              min={30}
              max={150}
              value={currentDetails.fontSizeHeadline}
              onChange={(e) => handleUpdateField("fontSizeHeadline", parseInt(e.target.value))}
              className="w-full accent-indigo-500 h-1 mt-1 cursor-pointer bg-slate-950 rounded"
            />
          </div>

          {/* Subtext Size Slider */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
              <span>Subtext Font Size ({currentDetails.fontSizeSubtext}px)</span>
            </div>
            <input
              type="range"
              min={20}
              max={80}
              value={currentDetails.fontSizeSubtext}
              onChange={(e) => handleUpdateField("fontSizeSubtext", parseInt(e.target.value))}
              className="w-full accent-indigo-500 h-1 mt-1 cursor-pointer bg-slate-950 rounded"
            />
          </div>
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
              <span>Headline Line-Height ({currentDetails.lineHeightHeadline?.toFixed(2) || "1.25"})</span>
            </div>
            <input
              type="range"
              min={80}
              max={200}
              step={5}
              value={Math.round((currentDetails.lineHeightHeadline || 1.25) * 100)}
              onChange={(e) => handleUpdateField("lineHeightHeadline", parseInt(e.target.value) / 100)}
              className="w-full accent-indigo-500 h-1 mt-1 cursor-pointer bg-slate-950 rounded"
            />
          </div>

          {/* Subtext Line-Height Slider */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
              <span>Subtext Line-Height ({currentDetails.lineHeightSubtext?.toFixed(2) || "1.35"})</span>
            </div>
            <input
              type="range"
              min={80}
              max={200}
              step={5}
              value={Math.round((currentDetails.lineHeightSubtext || 1.35) * 100)}
              onChange={(e) => handleUpdateField("lineHeightSubtext", parseInt(e.target.value) / 100)}
              className="w-full accent-indigo-500 h-1 mt-1 cursor-pointer bg-slate-950 rounded"
            />
          </div>
        </div>
      </div>

      {/* 6. BACKGROUND OVERLAYS */}
      <div className="p-4 border-b border-slate-800">
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
          <span>Background Effects</span>
        </label>

        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
          {(activeScreen.overlays || []).map((overlay, idx) => (
            <div
              key={overlay.type}
              className="bg-slate-950 border border-slate-800 rounded-lg p-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const updated = [...(activeScreen.overlays || [])];
                      updated[idx] = { ...updated[idx], enabled: !updated[idx].enabled };
                      handleUpdateField("overlays", updated);
                    }}
                    className={`w-7 h-4 rounded-full transition-colors cursor-pointer relative ${
                      overlay.enabled ? "bg-indigo-600" : "bg-slate-700"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${
                        overlay.enabled ? "left-3.5" : "left-0.5"
                      }`}
                    />
                  </button>
                  <span className={`text-[11px] font-semibold capitalize ${overlay.enabled ? "text-slate-200" : "text-slate-500"}`}>
                    {overlay.type.replace("-", " ")}
                  </span>
                </div>

                {overlay.enabled && (
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-500">{Math.round(overlay.opacity * 100)}%</span>
                    <input
                      type="range"
                      min={5}
                      max={100}
                      value={Math.round(overlay.opacity * 100)}
                      onChange={(e) => {
                        const updated = [...(activeScreen.overlays || [])];
                        updated[idx] = { ...updated[idx], opacity: parseInt(e.target.value) / 100 };
                        handleUpdateField("overlays", updated);
                      }}
                      className="w-16 accent-indigo-500 h-1 cursor-pointer bg-slate-800 rounded"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. ADVANCED CANVAS POSITIONING ADJUSTMENT (Screen independent - always custom to make perfect screen layout slides) */}
      <div className="p-4 pb-8">
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <Move className="w-3.5 h-3.5 text-indigo-400" />
          <span>Advanced Device Placement</span>
        </label>

        <div className="space-y-4">
          {/* Zoom scale slider */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
              <span>Mockup Scale ({Math.round(activeScreen.deviceScale * 100)}%)</span>
              <button
                onClick={() => handleUpdateField("deviceScale", 1.0)}
                className="text-[9px] hover:text-white text-indigo-400"
              >
                Reset (100%)
              </button>
            </div>
            <input
              type="range"
              min={15}
              max={180}
              value={Math.round(activeScreen.deviceScale * 100)}
              onChange={(e) => handleUpdateField("deviceScale", parseFloat(e.target.value) / 100)}
              className="w-full accent-indigo-500 h-1 mt-1 cursor-pointer bg-slate-950 rounded"
            />
          </div>

          {/* Position offsets sliders */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                <span>Offset Y ({activeScreen.deviceOffsetY}%)</span>
                <button
                  onClick={() => handleUpdateField("deviceOffsetY", 0)}
                  className="text-[9px] text-slate-400 font-medium"
                >
                  0
                </button>
              </div>
              <input
                type="range"
                min={-50}
                max={50}
                value={activeScreen.deviceOffsetY}
                onChange={(e) => handleUpdateField("deviceOffsetY", parseInt(e.target.value))}
                className="w-full accent-indigo-500 h-1 mt-1 cursor-pointer bg-slate-950 rounded"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                <span>Offset X ({activeScreen.deviceOffsetX}%)</span>
                <button
                  onClick={() => handleUpdateField("deviceOffsetX", 0)}
                  className="text-[9px] text-slate-400 font-medium"
                >
                  0
                </button>
              </div>
              <input
                type="range"
                min={-50}
                max={50}
                value={activeScreen.deviceOffsetX}
                onChange={(e) => handleUpdateField("deviceOffsetX", parseInt(e.target.value))}
                className="w-full accent-indigo-500 h-1 mt-1 cursor-pointer bg-slate-950 rounded"
              />
            </div>
          </div>

          {/* Device Rotation slider */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
              <span>Device Rotation ({activeScreen.deviceRotation || 0}°)</span>
              <button
                onClick={() => handleUpdateField("deviceRotation", 0)}
                className="text-[9px] hover:text-white text-indigo-400 font-medium"
              >
                Reset (0°)
              </button>
            </div>
            <input
              type="range"
              min={-45}
              max={45}
              value={activeScreen.deviceRotation || 0}
              onChange={(e) => handleUpdateField("deviceRotation", parseInt(e.target.value))}
              className="w-full accent-indigo-500 h-1 mt-1 cursor-pointer bg-slate-950 rounded"
            />
          </div>

        </div>
      </div>

      {/* 8. FOCAL POINT MAGNIFIER */}
      <div className="p-4 border-b border-slate-800">
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6M8 11h6"/>
            </svg>
            Focal Magnifier
          </span>
          <button
            onClick={() => {
              const fp = activeScreen.focalPoint;
              const next = fp
                ? { ...fp, enabled: !fp.enabled }
                : { enabled: true, sourceY: 50, sourceH: 22, zoom: 2.2, panelW: 88, overlayOpacity: 0.55, panelOffset: 0 };
              handleUpdateField("focalPoint", next as any);
            }}
            className={`w-8 h-4.5 rounded-full relative transition-colors cursor-pointer flex items-center px-0.5 ${
              activeScreen.focalPoint?.enabled ? "bg-indigo-600" : "bg-slate-700"
            }`}
            style={{ width: 28, height: 16 }}
          >
            <div
              className={`w-3 h-3 bg-white rounded-full absolute transition-all ${
                activeScreen.focalPoint?.enabled ? "left-3.5" : "left-0.5"
              }`}
            />
          </button>
        </label>

        {activeScreen.focalPoint?.enabled && (
          <div className="space-y-3 mt-2">
            <div>
              <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                <span>Focus Position (Y)</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-300">{activeScreen.focalPoint.sourceY}%</span>
                  <button onClick={() => handleUpdateField("focalPoint", { ...activeScreen.focalPoint!, sourceY: 50 } as any)} className="text-indigo-400 hover:text-white cursor-pointer" title="Reset">↺</button>
                </div>
              </div>
              <input type="range" min={5} max={95} value={activeScreen.focalPoint.sourceY} onChange={(e) => handleUpdateField("focalPoint", { ...activeScreen.focalPoint!, sourceY: parseInt(e.target.value) } as any)} className="w-full accent-indigo-500 h-1 mt-1 cursor-pointer bg-slate-950 rounded" />
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                <span>Capture Height</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-300">{activeScreen.focalPoint.sourceH}%</span>
                  <button onClick={() => handleUpdateField("focalPoint", { ...activeScreen.focalPoint!, sourceH: 22 } as any)} className="text-indigo-400 hover:text-white cursor-pointer" title="Reset">↺</button>
                </div>
              </div>
              <input type="range" min={5} max={60} value={activeScreen.focalPoint.sourceH} onChange={(e) => handleUpdateField("focalPoint", { ...activeScreen.focalPoint!, sourceH: parseInt(e.target.value) } as any)} className="w-full accent-indigo-500 h-1 mt-1 cursor-pointer bg-slate-950 rounded" />
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                <span>Zoom Level</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-300">{activeScreen.focalPoint.zoom.toFixed(1)}×</span>
                  <button onClick={() => handleUpdateField("focalPoint", { ...activeScreen.focalPoint!, zoom: 2.2 } as any)} className="text-indigo-400 hover:text-white cursor-pointer" title="Reset">↺</button>
                </div>
              </div>
              <input type="range" min={10} max={50} value={Math.round(activeScreen.focalPoint.zoom * 10)} onChange={(e) => handleUpdateField("focalPoint", { ...activeScreen.focalPoint!, zoom: parseInt(e.target.value) / 10 } as any)} className="w-full accent-indigo-500 h-1 mt-1 cursor-pointer bg-slate-950 rounded" />
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                <span>Panel Offset</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-300">{activeScreen.focalPoint.panelOffset > 0 ? "+" : ""}{activeScreen.focalPoint.panelOffset}%</span>
                  <button onClick={() => handleUpdateField("focalPoint", { ...activeScreen.focalPoint!, panelOffset: 0 } as any)} className="text-indigo-400 hover:text-white cursor-pointer" title="Reset">↺</button>
                </div>
              </div>
              <input type="range" min={-25} max={25} value={activeScreen.focalPoint.panelOffset} onChange={(e) => handleUpdateField("focalPoint", { ...activeScreen.focalPoint!, panelOffset: parseInt(e.target.value) } as any)} className="w-full accent-indigo-500 h-1 mt-1 cursor-pointer bg-slate-950 rounded" />
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                <span>Panel Width</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-300">{activeScreen.focalPoint.panelW}%</span>
                  <button onClick={() => handleUpdateField("focalPoint", { ...activeScreen.focalPoint!, panelW: 88 } as any)} className="text-indigo-400 hover:text-white cursor-pointer" title="Reset">↺</button>
                </div>
              </div>
              <input type="range" min={40} max={100} value={activeScreen.focalPoint.panelW} onChange={(e) => handleUpdateField("focalPoint", { ...activeScreen.focalPoint!, panelW: parseInt(e.target.value) } as any)} className="w-full accent-indigo-500 h-1 mt-1 cursor-pointer bg-slate-950 rounded" />
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                <span>Screen Dim</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-300">{Math.round(activeScreen.focalPoint.overlayOpacity * 100)}%</span>
                  <button onClick={() => handleUpdateField("focalPoint", { ...activeScreen.focalPoint!, overlayOpacity: 0.55 } as any)} className="text-indigo-400 hover:text-white cursor-pointer" title="Reset">↺</button>
                </div>
              </div>
              <input type="range" min={0} max={85} value={Math.round(activeScreen.focalPoint.overlayOpacity * 100)} onChange={(e) => handleUpdateField("focalPoint", { ...activeScreen.focalPoint!, overlayOpacity: parseInt(e.target.value) / 100 } as any)} className="w-full accent-indigo-500 h-1 mt-1 cursor-pointer bg-slate-950 rounded" />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button onClick={() => handleUpdateField("focalPoint", { enabled: true, sourceY: 50, sourceH: 22, zoom: 2.2, panelW: 88, overlayOpacity: 0.55, panelOffset: 0 } as any)} className="text-[10px] text-indigo-400 hover:text-white cursor-pointer">Reset all</button>
              <button onClick={() => handleUpdateField("focalPoint", undefined as any)} className="text-[10px] text-rose-400 hover:text-rose-300 cursor-pointer">Remove magnifier</button>
            </div>
          </div>
        )}
      </div>


    </div>
  );
}
