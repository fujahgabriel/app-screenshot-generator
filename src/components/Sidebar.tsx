import React, { useState } from "react";
import { 
  Sparkles, Plus, Trash, Copy, ChevronUp, ChevronDown, 
  Gamepad2, Briefcase, Wand2, Info, Check, RefreshCw,
  PanelLeftOpen
} from "lucide-react";
import { ASOProject, ScreenshotScreen } from "../types";
import { DEFAULT_PROJECTS } from "../templates";

interface SidebarProps {
  project: ASOProject;
  activeScreenId: string;
  onUpdateProject: (updater: (p: ASOProject) => ASOProject) => void;
  onSelectScreen: (id: string) => void;
  onApplyTemplate: (type: "kids" | "productivity") => void;
  activeLocale: string;
  locales: string[];
  onChangeLocale: (locale: string) => void;
  onAddLocale: (locale: string) => void;
  onRemoveLocale: (locale: string) => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

const SUPPORTED_LOCALES = [
  "en", "es", "fr", "pt-BR", "de", "it", "ja", "ko",
  "zh-CN", "zh-TW", "ar", "ru", "nl", "pl", "sv", "da",
  "fi", "nb", "tr", "th", "vi", "hi",
];

const PROVIDER_MODELS: Record<string, { label: string; models: { value: string; label: string }[] }> = {
  google: {
    label: "Google Gemini",
    models: [
      { value: "gemini-3.5-flash", label: "Gemini 3.5 Flash (Stable)" },
      { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro (Preview)" },
      { value: "gemini-3-flash-preview", label: "Gemini 3 Flash (Preview)" },
      { value: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite (Stable)" },
      { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite" },
    ],
  },
  openai: {
    label: "OpenAI",
    models: [
      { value: "gpt-5.5", label: "GPT-5.5" },
      { value: "gpt-5.5-pro", label: "GPT-5.5 Pro" },
      { value: "gpt-5.4", label: "GPT-5.4" },
      { value: "gpt-5.4-pro", label: "GPT-5.4 Pro" },
      { value: "gpt-5.4-mini", label: "GPT-5.4 Mini" },
      { value: "gpt-5.4-nano", label: "GPT-5.4 Nano" },
      { value: "gpt-5-mini", label: "GPT-5 Mini" },
      { value: "gpt-5-nano", label: "GPT-5 Nano" },
      { value: "gpt-5", label: "GPT-5" },
      { value: "gpt-4.1", label: "GPT-4.1" },
    ],
  },
  anthropic: {
    label: "Anthropic Claude",
    models: [
      { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
      { value: "claude-haiku-3-5-20241022", label: "Claude Haiku 3.5" },
      { value: "claude-opus-4-20250514", label: "Claude Opus 4" },
    ],
  },
  openrouter: {
    label: "OpenRouter",
    models: [
      { value: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
      { value: "openai/gpt-4o", label: "GPT-4o" },
      { value: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4" },
      { value: "google/gemini-2.0-flash", label: "Gemini 2.0 Flash" },
      { value: "mistralai/mistral-large", label: "Mistral Large" },
      { value: "meta-llama/llama-4-scout", label: "Llama 4 Scout" },
      { value: "deepseek/deepseek-chat", label: "DeepSeek V3" },
    ],
  },
};

const FLAGS: Record<string, string> = {
  en: "🇬🇧", es: "🇪🇸", fr: "🇫🇷", "pt-BR": "🇧🇷", de: "🇩🇪",
  it: "🇮🇹", ja: "🇯🇵", ko: "🇰🇷", "zh-CN": "🇨🇳", "zh-TW": "🇹🇼",
  ar: "🇸🇦", ru: "🇷🇺", nl: "🇳🇱", pl: "🇵🇱", sv: "🇸🇪",
  da: "🇩🇰", fi: "🇫🇮", nb: "🇳🇴", tr: "🇹🇷", th: "🇹🇭",
  vi: "🇻🇳", hi: "🇮🇳",
};

const LOCALE_NAMES: Record<string, string> = {
  en: "🇬🇧 English",
  es: "🇪🇸 Español",
  fr: "🇫🇷 Français",
  "pt-BR": "🇧🇷 Português (Brasil)",
  de: "🇩🇪 Deutsch",
  it: "🇮🇹 Italiano",
  ja: "🇯🇵 日本語",
  ko: "🇰🇷 한국어",
  "zh-CN": "🇨🇳 简体中文",
  "zh-TW": "🇹🇼 繁體中文",
  ar: "🇸🇦 العربية",
  ru: "🇷🇺 Русский",
  nl: "🇳🇱 Nederlands",
  pl: "🇵🇱 Polski",
  sv: "🇸🇪 Svenska",
  da: "🇩🇰 Dansk",
  fi: "🇫🇮 Suomi",
  nb: "🇳🇴 Norsk",
  tr: "🇹🇷 Türkçe",
  th: "🇹🇭 ไทย",
  vi: "🇻🇳 Tiếng Việt",
  hi: "🇮🇳 हिन्दी",
};

export default function Sidebar({
  project,
  activeScreenId,
  onUpdateProject,
  onSelectScreen,
  onApplyTemplate,
  activeLocale,
  locales,
  onChangeLocale,
  onAddLocale,
  onRemoveLocale,
  collapsed,
  onToggle,
}: SidebarProps) {
  const [showAddLocale, setShowAddLocale] = useState(false);
  const [newLocaleInput, setNewLocaleInput] = useState("");
  // AI Panel State
  const [appNameInput, setAppNameInput] = useState(project.appName);
  const [appDescInput, setAppDescInput] = useState(project.appDescription);
  const [categoryInput, setCategoryInput] = useState(project.category);
  const [toneInput, setToneInput] = useState(project.tone);
  const [aiLocales, setAiLocales] = useState<string[]>([project.activeLocale]);
  const [aiProvider, setAiProvider] = useState("google");
  const [aiModel, setAiModel] = useState(PROVIDER_MODELS.google.models[0].value);
  const [aiApiKey, setAiApiKey] = useState("");
  const [targetAge, setTargetAge] = useState("all-ages");
  const [targetGender, setTargetGender] = useState("all");
  const [targetParent, setTargetParent] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = useState(false);

  // Synchronize input fields if project changes globally
  React.useEffect(() => {
    setAppNameInput(project.appName);
    setAppDescInput(project.appDescription);
    setCategoryInput(project.category);
    setToneInput(project.tone);
    setAiLocales((prev) =>
      prev.includes(project.activeLocale) ? prev : [...prev, project.activeLocale]
    );
  }, [project.appName, project.appDescription, project.category, project.tone, project.activeLocale]);

  // Handle template selection
  const handleLoadTemplate = (type: "kids" | "productivity") => {
    if (confirm("Are you sure you want to load the template? This will replace your current screenshot settings and texts.")) {
      onApplyTemplate(type);
    }
  };

  // Generate captions using Gemini API via custom server endpoint
  const handleGenerateAICaptions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appDescInput.trim()) {
      setAiError("Please supply a short description about the app first.");
      return;
    }
    if (aiLocales.length === 0) {
      setAiError("Select at least one language.");
      return;
    }

    setIsGenerating(true);
    setAiError(null);
    setAiSuccess(false);

    try {
      const response = await fetch("/api/generate-captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appName: appNameInput,
          appDescription: appDescInput,
          category: categoryInput,
          tone: toneInput,
          locales: aiLocales,
          provider: aiProvider,
          model: aiModel,
          apiKey: aiApiKey || undefined,
          targetAge,
          targetGender,
          targetParent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate screenshot captions.");
      }

      const data = await response.json();
      const localeCaptions = data.locale_captions || (data.captions ? { [aiLocales[0] || "en"]: data.captions } : null);
      if (localeCaptions) {
        onUpdateProject((current) => {
          const updatedScreens = current.screens.map((screen, idx) => {
            let updated: ScreenshotScreen = { ...screen };
            const translations = { ...screen.translations };

            for (const locale of aiLocales) {
              const captions = localeCaptions[locale];
              const aiCaption = captions?.[idx];
              if (aiCaption) {
                translations[locale] = {
                  headline: aiCaption.headline.toUpperCase(),
                  subtext: aiCaption.subtext,
                };
                if (locale === aiLocales[0]) {
                  updated = {
                    ...updated,
                    headline: aiCaption.headline.toUpperCase(),
                    subtext: aiCaption.subtext,
                    name: `${idx + 1}. AI ${aiCaption.focus || "Focus"}`,
                  };
                }
              }
            }

            return { ...updated, translations };
          });

          return {
            ...current,
            appName: appNameInput,
            appDescription: appDescInput,
            category: categoryInput as any,
            tone: toneInput as any,
            activeLocale: aiLocales[0],
            screens: updatedScreens,
          };
        });

        setAiSuccess(true);
        setTimeout(() => setAiSuccess(false), 4000);
      } else {
        throw new Error("Invalid response format from server.");
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Something went wrong. Please check your workspace server.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Screen List Handlers
  const handleAddScreen = () => {
    onUpdateProject((current) => {
      const global = current.globalSettings;
      const newId = `screen_custom_${Date.now()}`;
      const newIndex = current.screens.length + 1;
      
      const newScreen: ScreenshotScreen = {
        id: newId,
        name: `${newIndex}. Custom Screen`,
        headline: "CAPTION TITLE GOES HERE",
        subtext: "Add a supportive description detailing your amazing tool",
        screenshotUrl: null, // empty / wait for upload
        screenshotFit: "cover",
        deviceType: global.deviceType,
        deviceColor: global.deviceColor,
        backgroundType: global.backgroundType,
        backgroundColor1: global.backgroundColor1,
        backgroundColor2: global.backgroundColor2,
        gradientAngle: global.gradientAngle,
        fontFamily: global.fontFamily,
        headlineFontWeight: global.headlineFontWeight,
        textColorHeadline: global.textColorHeadline,
        textColorSubtext: global.textColorSubtext,
        fontSizeHeadline: global.fontSizeHeadline,
        fontSizeSubtext: global.fontSizeSubtext,
        lineHeightHeadline: global.lineHeightHeadline || 1.25,
        lineHeightSubtext: global.lineHeightSubtext || 1.35,
        align: global.align,
        layoutStyle: global.layoutStyle,
        overlays: global.overlays || [],
        deviceScale: 0.85,
        deviceOffsetY: 4,
        deviceOffsetX: 0,
        deviceRotation: global.deviceRotation || 0,
        isLocked: true, // synched to global initially
        translations: Object.fromEntries(
          (project.locales || ["en"]).map((l) => [l, { headline: "CAPTION TITLE GOES HERE", subtext: "Add a supportive description detailing your amazing tool" }])
        ),
      };

      onSelectScreen(newId);
      return {
        ...current,
        screens: [...current.screens, newScreen],
      };
    });
  };

  const handleDuplicateScreen = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateProject((current) => {
      const targetIdx = current.screens.findIndex(s => s.id === id);
      if (targetIdx === -1) return current;

      const source = current.screens[targetIdx];
      const dupId = `screen_dup_${Date.now()}`;
      const clone: ScreenshotScreen = {
        ...source,
        id: dupId,
        name: `${source.name} (Copy)`,
      };

      const newScreens = [...current.screens];
      newScreens.splice(targetIdx + 1, 0, clone);

      onSelectScreen(dupId);
      return {
        ...current,
        screens: newScreens,
      };
    });
  };

  const handleDeleteScreen = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (project.screens.length <= 1) {
      alert("You must keep at least one screenshot screen!");
      return;
    }

    onUpdateProject((current) => {
      const filter = current.screens.filter(s => s.id !== id);
      
      // Auto select first if we are deleting active
      if (activeScreenId === id) {
        onSelectScreen(filter[0].id);
      }
      return {
        ...current,
        screens: filter,
      };
    });
  };

  const handleMoveScreen = (index: number, direction: "up" | "down", e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateProject((current) => {
      const screens = [...current.screens];
      const targetIdx = direction === "up" ? index - 1 : index + 1;
      
      if (targetIdx < 0 || targetIdx >= screens.length) return current;

      // Swap
      const temp = screens[index];
      screens[index] = screens[targetIdx];
      screens[targetIdx] = temp;

      return {
        ...current,
        screens,
      };
    });
  };

  if (collapsed) {
    return (
      <div className="w-8 h-full bg-slate-900 border-r border-slate-800 shrink-0 flex flex-col items-center pt-2 select-none">
        <button
          onClick={onToggle}
          className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Open sidebar"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 h-full bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col overflow-y-auto shrink-0 select-none">
      
      {/* App Branding & Category Templates */}
      <div className="p-4 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span>ASO Studio Mockup</span>
          </h1>
          <button
            onClick={() => {
              const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${project.appName || "app-screenshots"}-settings.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded flex items-center gap-1 cursor-pointer"
            title="Export settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
              <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
              <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
            </svg>
            Export
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">Quickly construct professional App Store graphics</p>
        
        {/* Category Templates */}
        <div className="mt-4">
          <h2 className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-2">Category Presets</h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleLoadTemplate("kids")}
              className={`p-2 rounded-lg border text-left flex flex-col gap-1 cursor-pointer transition-colors ${
                project.category === "kids" 
                  ? "bg-pink-950/40 border-pink-500/50 text-pink-200" 
                  : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300"
              }`}
            >
              <Gamepad2 className={`w-4 h-4 ${project.category === "kids" ? "text-pink-400" : "text-slate-400"}`} />
              <span className="text-xs font-medium">Kids Game</span>
            </button>

            <button
              onClick={() => handleLoadTemplate("productivity")}
              className={`p-2 rounded-lg border text-left flex flex-col gap-1 cursor-pointer transition-colors ${
                project.category === "productivity" 
                  ? "bg-indigo-950/40 border-indigo-500/50 text-indigo-200" 
                  : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300"
              }`}
            >
              <Briefcase className={`w-4 h-4 ${project.category === "productivity" ? "text-indigo-400" : "text-slate-400"}`} />
              <span className="text-xs font-medium">Productivity</span>
            </button>
          </div>
        </div>

        {/* Locale Switcher */}
        <div className="mt-4">
          <h2 className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-2">Language</h2>
          <div className="flex items-center gap-2">
            <select
              value={activeLocale}
              onChange={(e) => onChangeLocale(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {locales.map((l) => (
                <option key={l} value={l}>{LOCALE_NAMES[l] || l}</option>
              ))}
            </select>
            {locales.length > 1 && (
              <button
                onClick={() => onRemoveLocale(activeLocale)}
                className="p-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-800 cursor-pointer"
                title={`Remove ${LOCALE_NAMES[activeLocale] || activeLocale}`}
              >
                <Trash className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={() => setShowAddLocale(!showAddLocale)}
              className="p-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-800 cursor-pointer"
              title="Add language"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {showAddLocale && (
            <div className="mt-2 flex items-center gap-2">
              <select
                value=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && !locales.includes(val)) {
                    onAddLocale(val);
                    onChangeLocale(val);
                  }
                  setShowAddLocale(false);
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="" disabled>Select a language...</option>
                {SUPPORTED_LOCALES.filter((l) => !locales.includes(l)).map((l) => (
                  <option key={l} value={l}>{LOCALE_NAMES[l] || l}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* AI CAPTION GENERATOR SECTION (Uses @google/genai server proxies) */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm mb-3">
          <Wand2 className="w-4 h-4" />
          <span> AI Copywriter</span>
        </div>

        <form onSubmit={handleGenerateAICaptions} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">App Title</label>
            <input
              type="text"
              value={appNameInput}
              onChange={(e) => {
                setAppNameInput(e.target.value);
                onUpdateProject((current) => ({ ...current, appName: e.target.value }));
              }}
              placeholder="e.g., Sleek Habits"
              className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              App Short Description
            </label>
            <textarea
              value={appDescInput}
              onChange={(e) => {
                setAppDescInput(e.target.value);
                onUpdateProject((current) => ({ ...current, appDescription: e.target.value }));
              }}
              placeholder="What does your app do? What are its key features?"
              rows={3}
              className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-md p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none h-16"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Category</label>
              <select
                value={categoryInput}
                onChange={(e) => {
                  setCategoryInput(e.target.value as any);
                  onUpdateProject((current) => ({ ...current, category: e.target.value as any }));
                }}
                className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="kids">Kids Game</option>
                <option value="productivity">Productivity</option>
                <option value="utility">Utility & Tech</option>
                <option value="game">Action Game</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Voice Tone</label>
              <select
                value={toneInput}
                onChange={(e) => {
                  setToneInput(e.target.value as any);
                  onUpdateProject((current) => ({ ...current, tone: e.target.value as any }));
                }}
                className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="playful">Playful</option>
                <option value="bold">Bold & Direct</option>
                <option value="minimal">Minimal / Sleek</option>
                <option value="corporate">Corporate</option>
                <option value="energetic">Energetic</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Target Audience</label>
            <div className="space-y-1.5">
              <div className="flex flex-wrap gap-1">
                {[
                  { value: "kids-4-8", label: "Kids 4-8" },
                  { value: "tweens-9-12", label: "Tweens 9-12" },
                  { value: "teens-13-17", label: "Teens 13-17" },
                  { value: "adults-18-24", label: "18-24" },
                  { value: "adults-25-34", label: "25-34" },
                  { value: "adults-35-44", label: "35-44" },
                  { value: "adults-45-54", label: "45-54" },
                  { value: "adults-55+", label: "55+" },
                  { value: "all-ages", label: "All Ages" },
                ].map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => setTargetAge(a.value)}
                    className={`text-[10px] px-2 py-1 rounded-full border cursor-pointer transition-colors ${
                      targetAge === a.value
                        ? "bg-indigo-600/30 border-indigo-500 text-indigo-200"
                        : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                {[
                  { value: "all", label: "All Genders" },
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                ].map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setTargetGender(g.value)}
                    className={`text-[10px] px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
                      targetGender === g.value
                        ? "bg-indigo-600/30 border-indigo-500 text-indigo-200"
                        : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
                {[
                  { value: "all", label: "Anyone" },
                  { value: "parents", label: "Parents" },
                ].map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setTargetParent(p.value)}
                    className={`text-[10px] px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
                      targetParent === p.value
                        ? "bg-indigo-600/30 border-indigo-500 text-indigo-200"
                        : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">AI Languages</label>
            <div className="max-h-32 overflow-y-auto space-y-1 border border-slate-800 rounded-md p-1.5 bg-slate-950">
              {project.locales.map((l) => {
                const checked = aiLocales.includes(l);
                return (
                  <label
                    key={l}
                    className={`flex items-center gap-2 px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                      checked ? "bg-indigo-600/20 text-indigo-200" : "text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setAiLocales((prev) =>
                          checked ? prev.filter((x) => x !== l) : [...prev, l]
                        );
                      }}
                      className="accent-indigo-500 w-3 h-3"
                    />
                    <span>{LOCALE_NAMES[l] || l}</span>
                  </label>
                );
              })}
            </div>
            {aiLocales.length === 0 && (
              <p className="text-[10px] text-rose-400 mt-1">Select at least one language</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">AI Provider</label>
              <select
                value={aiProvider}
                onChange={(e) => {
                  const p = e.target.value;
                  setAiProvider(p);
                  setAiModel(PROVIDER_MODELS[p]?.models[0]?.value || "");
                }}
                className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {Object.entries(PROVIDER_MODELS).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Model</label>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {PROVIDER_MODELS[aiProvider]?.models.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              API Key <span className="text-slate-600 font-normal">(leave blank for .env)</span>
            </label>
            <input
              type="password"
              value={aiApiKey}
              onChange={(e) => setAiApiKey(e.target.value)}
              placeholder={`Defaults to ${PROVIDER_MODELS[aiProvider]?.label} env key`}
              className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className={`w-full py-2 px-3 rounded-md text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-colors ${
              isGenerating 
                ? "bg-slate-800 border border-slate-700 text-slate-400" 
                : "bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/10"
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Analysing ASO Data...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5" />
                <span>Generate Captions with AI</span>
              </>
            )}
          </button>
        </form>

        {aiError && (
          <div className="mt-2.5 p-2 bg-red-950/50 border border-red-800 rounded-md text-red-200 text-[11px] leading-relaxed flex gap-1.5 items-start">
            <Info className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
            <span>{aiError}</span>
          </div>
        )}

        {aiSuccess && (
          <div className="mt-2.5 p-2 bg-emerald-950/50 border border-emerald-800 rounded-md text-emerald-200 text-[11px] flex gap-1.5 items-center">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>ASO copywriting loaded to all 5 screenshots!</span>
          </div>
        )}
      </div>

      {/* SCREEN SEQUENCE MANAGER */}
      <div className="p-4 flex-1 flex flex-col min-h-[300px]">
        <div className="flex items-center justify-between mb-3 text-slate-300">
          <span className="text-xs font-semibold tracking-wider uppercase">Screenshot Screens ({project.screens.length})</span>
          <button
            onClick={handleAddScreen}
            className="p-1 px-2 text-[11px] bg-slate-800 hover:bg-indigo-600 hover:text-white rounded flex items-center gap-1 transition-colors cursor-pointer text-slate-300"
          >
            <Plus className="w-3 h-3" />
            <span>Add</span>
          </button>
        </div>

        {/* List of screens */}
        <div className="space-y-1.5 overflow-y-auto max-h-[400px] flex-1 pr-1">
          {project.screens.map((screen, index) => {
            const isActive = screen.id === activeScreenId;
            return (
              <div
                key={screen.id}
                onClick={() => onSelectScreen(screen.id)}
                className={`group p-2 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between ${
                  isActive 
                    ? "bg-slate-800 border-indigo-500/50 text-white" 
                    : "bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 text-slate-400"
                }`}
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className={`text-xs font-semibold truncate ${isActive ? "text-indigo-300" : "text-slate-300"}`}>
                    {screen.name}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate mt-0.5 leading-snug">
                    {screen.headline || "No Caption Title"}
                  </span>
                </div>

                {/* Operations overlay or static actions */}
                <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                  {/* Nudge Up */}
                  <button
                    onClick={(e) => handleMoveScreen(index, "up", e)}
                    disabled={index === 0}
                    className={`p-1 rounded hover:bg-slate-700 hover:text-slate-200 ${index === 0 ? "text-slate-700 cursor-not-allowed" : "text-slate-400 cursor-pointer"}`}
                    title="Nudge Up"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>

                  {/* Nudge Down */}
                  <button
                    onClick={(e) => handleMoveScreen(index, "down", e)}
                    disabled={index === project.screens.length - 1}
                    className={`p-1 rounded hover:bg-slate-700 hover:text-slate-200 ${index === project.screens.length - 1 ? "text-slate-700 cursor-not-allowed" : "text-slate-400 cursor-pointer"}`}
                    title="Nudge Down"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {/* Duplicate */}
                  <button
                    onClick={(e) => handleDuplicateScreen(screen.id, e)}
                    className="p-1 rounded hover:bg-slate-700 hover:text-indigo-400 text-slate-400"
                    title="Duplicate Screen"
                  >
                    <Copy className="w-3 h-3" />
                  </button>

                  {/* Remove */}
                  <button
                    onClick={(e) => handleDeleteScreen(screen.id, e)}
                    className="p-1 rounded hover:bg-slate-700 hover:text-rose-400 text-slate-400"
                    title="Delete Screen"
                  >
                    <Trash className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
