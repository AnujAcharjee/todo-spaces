"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { useThemeStore, PRESET_BACKGROUNDS, DEFAULT_BG } from "@/store/theme.store";
import { Modal } from "@/components/ui/Modal";

export function BackgroundSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const backgroundUrl = useThemeStore((state) => state.backgroundUrl);
  const setBackground = useThemeStore((state) => state.setBackground);
  const resetBackground = useThemeStore((state) => state.resetBackground);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (PNG, JPG, WebP, etc.)");
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = reader.result as string;
        await setBackground(result, true);
        setIsProcessing(false);
      } catch (err) {
        console.error("Failed to process image:", err);
        setErrorMessage("Could not save image. Try a smaller image file.");
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setErrorMessage("Error reading image file.");
      setIsProcessing(false);
    };

    reader.readAsDataURL(file);
  };

  const handleSelectPreset = async (url: string) => {
    setErrorMessage(null);
    await setBackground(url, false);
  };

  const handleReset = async () => {
    setErrorMessage(null);
    await resetBackground();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-white/70 transition hover:bg-white/[0.12] hover:text-white"
        title="Customize Wallpaper"
        aria-label="Customize Wallpaper"
      >
        <i className="bi bi-image text-sm" />
      </button>

      <Modal
        open={isOpen}
        title="Customize Background"
        description="Choose a preset wallpaper or upload your own image. It is saved locally in your browser."
        submitLabel="Done"
        onClose={() => {
          setIsOpen(false);
          setErrorMessage(null);
        }}
        onSubmit={(e) => {
          e.preventDefault();
          setIsOpen(false);
        }}
      >
        <div className="space-y-4">
          {/* Custom Upload Section */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-2">
              Upload Your Own Image
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/[0.03] p-5 text-center transition hover:border-white/40 hover:bg-white/[0.08]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-white/60 group-hover:text-white">
                <i className="bi bi-cloud-arrow-up text-xl" />
              </div>
              <p className="mt-2 text-sm font-semibold text-white/90">
                {isProcessing ? "Processing image..." : "Click to browse image from device"}
              </p>
              <p className="mt-0.5 text-xs text-white/40">
                Supports JPG, PNG, WebP, GIF (saved in browser IndexedDB)
              </p>
            </div>
            {errorMessage && (
              <p className="mt-1.5 text-xs text-red-300">{errorMessage}</p>
            )}
          </div>

          {/* Presets Gallery */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-2">
              Preset Wallpapers
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {PRESET_BACKGROUNDS.map((preset) => {
                const isSelected = backgroundUrl === preset.url;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.url)}
                    className={[
                      "group relative flex flex-col overflow-hidden rounded-xl border text-left transition",
                      isSelected
                        ? "border-amber-400 ring-2 ring-amber-400/40"
                        : "border-white/10 hover:border-white/30",
                    ].join(" ")}
                  >
                    <div
                      className="h-16 w-full bg-cover bg-center transition group-hover:scale-105"
                      style={{ backgroundImage: `url(${preset.preview})` }}
                    />
                    <div className="bg-slate-900/90 px-2.5 py-1.5 backdrop-blur-sm">
                      <p className="truncate text-xs font-medium text-white/90">
                        {preset.name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reset Action */}
          {backgroundUrl !== DEFAULT_BG && (
            <div className="pt-2 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition"
              >
                <i className="bi bi-arrow-counterclockwise" />
                <span>Reset to default wallpaper</span>
              </button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
