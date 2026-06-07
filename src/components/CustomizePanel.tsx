import React, { useState } from "react";
import { Lock, Unlock, AlertCircle, PanelRightOpen } from "lucide-react";
import { ASOProject, ScreenshotScreen } from "../types";
import MediaUploadSection from "./sections/MediaUploadSection";
import CopywritingSection from "./sections/CopywritingSection";
import DeviceFrameSection from "./sections/DeviceFrameSection";
import GradientsSection from "./sections/GradientsSection";
import TypographySection from "./sections/TypographySection";
import OverlaysSection from "./sections/OverlaysSection";
import PlacementSection from "./sections/PlacementSection";
import ZoomCalloutSection from "./sections/ZoomCalloutSection";

interface CustomizePanelProps {
  project: ASOProject;
  activeScreenId: string;
  onUpdateProject: (updater: (p: ASOProject) => ASOProject) => void;
  activeLocale: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function CustomizePanel({
  project,
  activeScreenId,
  onUpdateProject,
  activeLocale,
  collapsed,
  onToggle,
}: CustomizePanelProps) {
  const activeScreen = project.screens.find(s => s.id === activeScreenId);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    copy: true,
    typo: true,
    effects: true,
    placement: true,
    zoom: true,
  });
  const toggleSection = (id: string) => setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }));

  if (collapsed) {
    return (
      <div className="w-8 h-full bg-white border-l border-gray-200 shrink-0 flex flex-col items-center pt-2 select-none">
        <button
          onClick={onToggle}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          title="Open customize panel"
        >
          <PanelRightOpen className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (!activeScreen) {
    return (
      <div className="w-80 h-full bg-white border-l border-gray-200 text-gray-400 p-6 flex flex-col items-center justify-center select-none text-center">
        <AlertCircle className="w-10 h-10 text-slate-600 mb-2" />
        <span className="text-sm">No active screen focused. Select a screen to edit in the sequence list.</span>
      </div>
    );
  }

  const isLocked = activeScreen.isLocked;
  const currentDetails = (isLocked ? project.globalSettings : activeScreen) as ScreenshotScreen;

  const handleUpdateField = <K extends keyof ScreenshotScreen>(key: K, value: ScreenshotScreen[K]) => {
    onUpdateProject((current) => {
      const screens = current.screens.map((screen) => {
        if (screen.id === activeScreenId) {
          return { ...screen, [key]: value };
        }
        return screen;
      });

      let globalSettings = current.globalSettings;
      if (isLocked && key in globalSettings) {
        globalSettings = { ...globalSettings, [key]: value as any };

        const autoSyncedScreens = screens.map((s) => {
          if (s.isLocked) return { ...s, [key]: value };
          return s;
        });

        return { ...current, globalSettings, screens: autoSyncedScreens };
      }

      return { ...current, screens };
    });
  };

  const handleToggleLock = () => {
    onUpdateProject((current) => {
      const screens = current.screens.map((screen) => {
        if (screen.id === activeScreenId) {
          const nextLocked = !screen.isLocked;
          if (nextLocked) {
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
              textShadow: current.globalSettings.textShadow,
            };
          } else {
            return { ...screen, isLocked: false };
          }
        }
        return screen;
      });
      return { ...current, screens };
    });
  };

  return (
    <div className="w-80 h-full bg-white border-l border-gray-200 text-gray-800 flex flex-col overflow-y-auto shrink-0 select-none">

      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-gray-500 uppercase font-semibold">Slide Config</span>
          <h2 className="text-sm font-bold text-gray-900 truncate max-w-[150px]">{activeScreen.name}</h2>
        </div>

        <button
          onClick={handleToggleLock}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
            isLocked
              ? "bg-indigo-50 border-indigo-200 text-indigo-700"
              : "bg-amber-50 border-amber-200 text-amber-700"
          }`}
          title={isLocked ? "Currently synced to global project details" : "Independent custom overrides applied"}
        >
          {isLocked ? (
            <><Lock className="w-3 h-3 text-indigo-500" /><span>Global Synced</span></>
          ) : (
            <><Unlock className="w-3 h-3 text-amber-500" /><span>Independent</span></>
          )}
        </button>
      </div>

      <MediaUploadSection
        screen={activeScreen}
        handleUpdateField={handleUpdateField}
        project={project}
        collapsed={collapsedSections["media"] ?? false}
        onToggleSection={toggleSection}
      />

      <CopywritingSection
        screen={activeScreen}
        activeLocale={activeLocale}
        handleUpdateField={handleUpdateField}
        onUpdateProject={onUpdateProject}
        collapsed={collapsedSections["copy"] ?? false}
        onToggleSection={toggleSection}
      />

      <DeviceFrameSection
        details={currentDetails}
        isLocked={isLocked}
        handleUpdateField={handleUpdateField}
        onUpdateProject={onUpdateProject}
        project={project}
        collapsed={collapsedSections["device"] ?? false}
        onToggleSection={toggleSection}
      />

      <GradientsSection
        details={currentDetails}
        handleUpdateField={handleUpdateField}
        collapsed={collapsedSections["gradients"] ?? false}
        onToggleSection={toggleSection}
      />

      <TypographySection
        details={currentDetails}
        isLocked={isLocked}
        handleUpdateField={handleUpdateField}
        collapsed={collapsedSections["typo"] ?? false}
        onToggleSection={toggleSection}
      />

      <OverlaysSection
        screen={activeScreen}
        handleUpdateField={handleUpdateField}
        collapsed={collapsedSections["effects"] ?? false}
        onToggleSection={toggleSection}
      />

      <PlacementSection
        screen={activeScreen}
        handleUpdateField={handleUpdateField}
        collapsed={collapsedSections["placement"] ?? false}
        onToggleSection={toggleSection}
      />

      <ZoomCalloutSection
        screen={activeScreen}
        handleUpdateField={handleUpdateField}
        collapsed={collapsedSections["zoom"] ?? false}
        onToggleSection={toggleSection}
      />

    </div>
  );
}
