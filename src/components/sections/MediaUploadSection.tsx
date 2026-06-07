import React, { useState, useRef } from "react";
import { Upload, Check } from "lucide-react";
import { ScreenshotScreen, ASOProject } from "../../types";
import CollapsibleSection from "./CollapsibleSection";

interface Props {
  screen: ScreenshotScreen;
  handleUpdateField: <K extends keyof ScreenshotScreen>(key: K, value: ScreenshotScreen[K]) => void;
  project: ASOProject;
  collapsed: boolean;
  onToggleSection: (id: string) => void;
}

export default function MediaUploadSection({ screen, handleUpdateField, collapsed, onToggleSection }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, HEIC, or SVG).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) handleUpdateField("screenshotUrl", result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  return (
    <CollapsibleSection id="media" title="Screenshot Media Sandbox" collapsed={collapsed} onToggle={onToggleSection}
      icon={<Upload className="w-3.5 h-3.5" />}
    >
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`h-24 w-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all ${
          dragOver
            ? "border-indigo-400 bg-indigo-50 text-indigo-600"
            : screen.screenshotUrl && !screen.screenshotUrl.startsWith("procedural:")
            ? "border-emerald-300 bg-emerald-50 text-emerald-600"
            : "border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-500"
        }`}
      >
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        {screen.screenshotUrl && !screen.screenshotUrl.startsWith("procedural:") ? (
          <>
            <Check className="w-6 h-6 text-emerald-500 mb-1" />
            <span className="text-[11px] font-medium">Custom Screen Active (Click to Replace)</span>
          </>
        ) : (
          <>
            <Upload className="w-5 h-5 mb-1" />
            <span className="text-[11px] text-gray-700 font-medium">Drag & drop or Click to upload</span>
            <span className="text-[9px] text-gray-400 mt-0.5">Procedural play is showing as default</span>
          </>
        )}
      </div>

      {screen.screenshotUrl && (
        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-[10px] text-gray-500 font-medium">Render aspect-fit</span>
          <div className="flex gap-1.5 bg-gray-50 p-0.5 rounded-md border border-gray-200">
            <button
              onClick={() => handleUpdateField("screenshotFit", "cover")}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                screen.screenshotFit === "cover" ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-800"
              }`}
            >Cover</button>
            <button
              onClick={() => handleUpdateField("screenshotFit", "contain")}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                screen.screenshotFit === "contain" ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-800"
              }`}
            >Contain</button>
          </div>
        </div>
      )}
    </CollapsibleSection>
  );
}
