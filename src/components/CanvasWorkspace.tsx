import React, { useEffect, useRef, useState, useCallback } from "react";
import { Download, Layers, Play, Check, Sparkles, Loader2, ZoomIn, ZoomOut, Maximize2, Minimize2 } from "lucide-react";
import { ASOProject, ScreenshotScreen } from "../types";
import { DEVICE_SIZES } from "../templates";
import { renderScreenshotOnCanvas } from "../utils/canvasRenderer";
import JSZip from "jszip";

interface CanvasWorkspaceProps {
  project: ASOProject;
  activeScreenId: string;
  onSelectScreen: (id: string) => void;
  onUpdateProject: (updater: (p: ASOProject) => ASOProject) => void;
}

const LOCALE_NAMES: Record<string, string> = {
  en: "English", es: "Español", fr: "Français", "pt-BR": "Português (Brasil)",
  de: "Deutsch", it: "Italiano", ja: "日本語", ko: "한국어",
  "zh-CN": "简体中文", "zh-TW": "繁體中文", ar: "العربية", ru: "Русский",
};

export default function CanvasWorkspace({
  project,
  activeScreenId,
  onSelectScreen,
  onUpdateProject,
}: CanvasWorkspaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const activeScreen = project.screens.find(s => s.id === activeScreenId);
  const [activeImage, setActiveImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportLocale, setExportLocale] = useState<string>("current");

  // Keep a pool of cached HTMLImages for all screenshots to render them instantly
  const [imageCache, setImageCache] = useState<Record<string, HTMLImageElement>>({});

  // Get active device dimension
  const deviceType = activeScreen ? (activeScreen.isLocked ? project.globalSettings.deviceType : activeScreen.deviceType) : "iphone_portrait";
  const { width: renderW, height: renderH, label: deviceLabel } = DEVICE_SIZES[deviceType];

  // Dynamic Google Font Injection Link Hook
  useEffect(() => {
    const uniqueFonts = new Set<string>();
    uniqueFonts.add(project.globalSettings.fontFamily);
    project.screens.forEach((s) => uniqueFonts.add(s.fontFamily));

    const fontQuery = Array.from(uniqueFonts)
      .map((f) => `family=${f.replace(/ /g, "+")}:wght@300;400;500;600;700;800;900`)
      .join("&");

    const linkId = "google-fonts-mockup-injector";
    let linkElement = document.getElementById(linkId) as HTMLLinkElement;

    if (!linkElement) {
      linkElement = document.createElement("link");
      linkElement.id = linkId;
      linkElement.rel = "stylesheet";
      document.head.appendChild(linkElement);
    }

    linkElement.href = `https://fonts.googleapis.com/css2?${fontQuery}&display=swap`;

    const allWeights = ["300", "400", "500", "600", "700", "800", "900"];
    const families = Array.from(uniqueFonts);
    const loadPromises = families.flatMap((f) =>
      allWeights.map((w) =>
        document.fonts.load(`${w} 1em "${f}"`).catch(() => {})
      )
    );

    Promise.all(loadPromises).then(() => {
      triggerRedraw();
    });

    const fallback = setTimeout(triggerRedraw, 1500);
    return () => clearTimeout(fallback);
  }, [project]);

  // Handle active slide image loading caching
  useEffect(() => {
    if (!activeScreen) return;
    const url = activeScreen.screenshotUrl;

    if (!url || url.startsWith("procedural:")) {
      setActiveImage(null);
      triggerRedraw();
      return;
    }

    // Check if cache has it loaded already
    if (imageCache[url]) {
      setActiveImage(imageCache[url]);
      return;
    }

    // Else load it
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => {
      setImageCache(prev => ({ ...prev, [url]: img }));
      setActiveImage(img);
    };
    img.onerror = () => {
      console.warn("Failed to load screenshots image:", url);
      setActiveImage(null);
    };
  }, [activeScreen?.screenshotUrl, activeScreenId, imageCache]);

  // Hook to repaint on project adjustments
  useEffect(() => {
    triggerRedraw();
  }, [project, activeImage, activeScreenId, deviceType]);

  const triggerRedraw = () => {
    if (!canvasRef.current || !activeScreen) return;
    
    // Normalise dimensions
    canvasRef.current.width = renderW;
    canvasRef.current.height = renderH;

    // Call high performance helper (asynchronously check)
    renderScreenshotOnCanvas(canvasRef.current, activeScreen, activeImage);
  };

  // Fullscreen toggle
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (!viewportRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      viewportRef.current.requestFullscreen();
    }
  }, []);

  // Download focused image
  const handleDownloadSingle = () => {
    if (!canvasRef.current || !activeScreen) return;
    
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const link = document.createElement("a");
    const safeName = activeScreen.name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    link.download = `${safeName}_screenshot.png`;
    link.href = dataUrl;
    link.click();
  };

  // Export ENTIRE multi-screen deck together as high-resolution ZIP
  const handleDownloadAllZip = async (targetLocale?: string) => {
    if (project.screens.length === 0) return;
    setIsExportingZip(true);
    setExportProgress(5);

    try {
      const zip = new JSZip();
      const exportCanvas = document.createElement("canvas");
      const exportCtx = exportCanvas.getContext("2d");
      if (!exportCtx) throw new Error("Could not initialize offscreen context.");

      const localesToExport = targetLocale === "all"
        ? project.locales
        : targetLocale
        ? [targetLocale]
        : [project.activeLocale];

      let totalScreens = project.screens.length * localesToExport.length;
      let completed = 0;

      for (const locale of localesToExport) {
        for (let i = 0; i < project.screens.length; i++) {
          const screen = project.screens[i];
          const screenDeviceType = screen.isLocked ? project.globalSettings.deviceType : screen.deviceType;
          const dims = DEVICE_SIZES[screenDeviceType];

          exportCanvas.width = dims.width;
          exportCanvas.height = dims.height;

          let screenImage: HTMLImageElement | null = null;
          if (screen.screenshotUrl && !screen.screenshotUrl.startsWith("procedural:")) {
            if (imageCache[screen.screenshotUrl]) {
              screenImage = imageCache[screen.screenshotUrl];
            } else {
              await new Promise<void>((resolve) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.src = screen.screenshotUrl!;
                img.onload = () => { screenImage = img; resolve(); };
                img.onerror = () => { screenImage = null; resolve(); };
              });
            }
          }

          // Apply locale translation to a copy of the screen
          const translation = screen.translations?.[locale];
          const localizedScreen = translation
            ? { ...screen, headline: translation.headline, subtext: translation.subtext }
            : screen;

          await renderScreenshotOnCanvas(exportCanvas, localizedScreen, screenImage);

          const blob = await new Promise<Blob | null>((resolve) => {
            exportCanvas.toBlob((b) => resolve(b), "image/png");
          });

          if (blob) {
            const paddedIndex = String(i + 1).padStart(2, "0");
            const slug = screen.name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
            zip.file(`${locale}/${paddedIndex}_${slug}.png`, blob);
          }

          completed++;
          setExportProgress(5 + Math.floor((completed / totalScreens) * 90));
        }
      }

      setExportProgress(95);
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      const zipSlug = project.appName ? project.appName.toLowerCase().replace(/[^a-z0-9]+/g, "_") : "app";
      const localeLabel = localesToExport.length > 1 ? "all-locales" : localesToExport[0];
      link.download = `${zipSlug}_${localeLabel}_screenshots.zip`;
      link.click();

      setExportProgress(100);
      setTimeout(() => setIsExportingZip(false), 800);
    } catch (err) {
      console.error("ZIP packaging failed:", err);
      alert("ZIP packaging crashed on canvas streams. Try exporting single slides instead.");
      setIsExportingZip(false);
    }
  };

  return (
    <div className="flex-1 min-w-0 bg-slate-950 flex flex-col h-full select-none justify-between overflow-hidden">
      
      {/* 1. WORKSPACE NAV BAR ACTIONS */}
      <div className="h-14 border-b border-slate-800 shrink-0 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between z-10">
        <div>
          <span className="text-xs font-bold text-white uppercase">{project.appName || "Visual Workspace"}</span>
          <p className="text-[10px] text-indigo-400 mt-0.5 font-medium">Device Frame: {deviceLabel}</p>
        </div>

        {/* EXPORTS TRIGGER ZONE */}
        <div className="flex items-center gap-2.5">
          {/* Download focussed slide */}
          <button
            onClick={handleDownloadSingle}
            className="flex items-center gap-1.5 p-2 px-3 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
            title="Download the currently active screenshot slide"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Save Active png</span>
          </button>

          {/* Locale selector for export */}
          <select
            value={exportLocale}
            onChange={(e) => setExportLocale(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-md px-2 py-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="current">{LOCALE_NAMES[project.activeLocale] || project.activeLocale} (active)</option>
            {project.locales.map((l) => (
              <option key={l} value={l}>{LOCALE_NAMES[l] || l}</option>
            ))}
            {project.locales.length > 1 && <option value="all">All Languages</option>}
          </select>

          {/* Download all as zip */}
          <button
            onClick={() => handleDownloadAllZip(exportLocale)}
            disabled={isExportingZip}
            className={`flex items-center gap-1.5 p-2 px-4 rounded-md text-xs font-bold shadow-lg shadow-indigo-600/10 transition-colors cursor-pointer ${
              isExportingZip 
                ? "bg-slate-800 text-slate-500 border border-slate-700" 
                : "bg-indigo-600 hover:bg-indigo-500 text-white"
            }`}
          >
            {isExportingZip ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Zipping ({exportProgress}%)</span>
              </>
            ) : (
              <>
                <Layers className="w-3.5 h-3.5" />
                <span>Export ZIP</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. CHIEFLY DRAW WORKSPACE */}
      <div className="flex-1 min-h-0 relative bg-slate-950 flex flex-col overflow-hidden">
        {/* Scrollable canvas viewport */}
        <div ref={viewportRef} className="flex-1 overflow-auto flex items-center justify-center p-6 min-h-0 w-full relative">
          {/* Subtle decorative grid backing */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:32px_32px] opacity-30 pointer-events-none" />

          {activeScreen ? (
            <div className="relative flex items-center justify-center p-4">
              {/* The canvas maintains original high definition size, styled beautifully by browser scaling */}
              <canvas
                ref={canvasRef}
                style={{
                  height: `${73 * zoom}vh`,
                  width: "auto"
                }}
                className={`${project.globalSettings.canvasCornerStyle === "square" ? "rounded-none" : "rounded-2xl"} border border-slate-800 object-contain shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] bg-slate-900 transition-all duration-150`}
              />
            </div>
          ) : (
            <div className="text-slate-500 flex flex-col items-center gap-2 text-sm">
              <Sparkles className="w-10 h-10 text-indigo-500/20 animate-pulse" />
              <span>Select or add a screenshot panel in the sequencer to load workspace canvas</span>
            </div>
          )}
        </div>

        {/* Floating Zoom & Fullscreen Controls */}
        {activeScreen && (
          <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-1.5 flex items-center gap-1 z-10 shadow-lg select-none">
            <button 
              onClick={() => setZoom(prev => Math.max(0.4, prev - 0.1))}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-bold text-slate-300 w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button 
              onClick={() => setZoom(prev => Math.min(2.0, prev + 0.1))}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3.5 bg-slate-800 mx-0.5" />
            <button 
              onClick={() => setZoom(1.0)}
              className="text-[9px] px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded cursor-pointer font-bold transition-colors"
              title="Reset Zoom"
            >
              100%
            </button>
            <div className="w-px h-3.5 bg-slate-800 mx-0.5" />
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => onUpdateProject((p) => ({ ...p, globalSettings: { ...p.globalSettings, canvasCornerStyle: "rounded" } }))}
                className={`text-[9px] px-1.5 py-0.5 rounded cursor-pointer font-bold transition-colors ${
                  project.globalSettings.canvasCornerStyle === "rounded"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-400"
                }`}
                title="Rounded corners"
              >
                Round
              </button>
              <button
                onClick={() => onUpdateProject((p) => ({ ...p, globalSettings: { ...p.globalSettings, canvasCornerStyle: "square" } }))}
                className={`text-[9px] px-1.5 py-0.5 rounded cursor-pointer font-bold transition-colors ${
                  project.globalSettings.canvasCornerStyle === "square"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-400"
                }`}
                title="Square corners"
              >
                Square
              </button>
            </div>
            <div className="w-px h-3.5 bg-slate-800 mx-0.5" />
            <button
              onClick={handleToggleFullscreen}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer transition-colors"
              title={isFullscreen ? "Exit Fullscreen (Esc)" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* 3. STORYBOARD HORIZONTAL SLIDES TIMELINE BAR */}
      <div className="h-28 border-t border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 flex items-center gap-4 shrink-0 overflow-x-auto overflow-y-hidden z-10 scrollbar-thin">
        <div className="flex items-center gap-1.5 shrink-0 text-slate-500 font-bold text-[10px] uppercase tracking-widest border-r border-slate-800 pr-4 h-full">
          <Layers className="w-3.5 h-3.5 text-indigo-500" />
          <span>Slide Deck Pack</span>
        </div>

        <div className="flex items-center gap-3 py-1 flex-1 min-w-0 pr-4">
          {project.screens.map((screen, idx) => {
            const isActive = screen.id === activeScreenId;
            const screenDevType = screen.isLocked ? project.globalSettings.deviceType : screen.deviceType;
            const isIpad = screenDevType === "ipad_portrait";

            return (
              <div
                key={screen.id}
                onClick={() => onSelectScreen(screen.id)}
                className={`relative shrink-0 flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer select-none transition-all ${
                  isActive 
                    ? "bg-slate-900 border-indigo-500 text-white scale-[1.02]" 
                    : "bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400"
                }`}
              >
                {/* Tiny Aspect Ratio Miniature Preview Frame */}
                <div 
                  className={`w-9 bg-slate-800 rounded flex items-center justify-center border border-slate-700 flex-col py-0.5 overflow-hidden ${
                    isIpad ? "aspect-[4/3] h-7" : "aspect-[9/19.5] h-10"
                  }`}
                  style={{
                    background: screen.backgroundType === "solid" 
                      ? screen.backgroundColor1 
                      : `linear-gradient(${screen.gradientAngle}deg, ${screen.backgroundColor1}, ${screen.backgroundColor2})`
                  }}
                >
                  <div className="text-[6px] text-center font-bold tracking-tighter scale-75 opacity-70 truncate px-0.5 text-white">
                    {screen.headline ? screen.headline.substring(0, 5) + ".." : "APP"}
                  </div>
                  {/* Miniature screen frame design */}
                  <div className="w-4 flex-1 mt-0.5 rounded-t bg-slate-950/30 border border-slate-100/10" />
                </div>

                <div className="flex flex-col min-w-0 w-24">
                  <span className={`text-[10px] font-bold truncate leading-none ${isActive ? "text-indigo-300" : "text-slate-300"}`}>
                    {screen.name}
                  </span>
                  <span className="text-[9px] text-slate-500 truncate mt-1 leading-snug">
                    {screen.headline || "(No Text)"}
                  </span>
                </div>

                {isActive && (
                  <div className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white rounded-full p-0.5 border border-slate-950">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
