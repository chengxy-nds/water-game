import React from 'react';
import { soundManager } from '../utils/audio';
import { X, Volume2, VolumeX, Vibrate, Music } from 'lucide-react';

interface SettingsModalProps {
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  bgmEnabled: boolean;
  onToggleSound: () => void;
  onToggleVibrate: () => void;
  onToggleBgm: () => void;
  onClose: () => void;
}

// Glossy blue 3D button — same style as the main game page buttons.
const GLOSSY_BLUE =
  'bg-gradient-to-b from-[#60a5fa] via-[#3b82f6] to-[#1e40af] border-2 border-[#93c5fd] shadow-[0_4px_12px_rgba(29,78,216,0.55),inset_0_1.5px_2px_rgba(255,255,255,0.85),inset_0_-2px_3px_rgba(30,58,138,0.5)]';

// Glossy glass toggle switch
const GlassSwitch: React.FC<{ enabled: boolean; onColor: string; onClick: () => void }> = ({
  enabled,
  onColor,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`relative w-12 h-7 rounded-full border transition-colors cursor-pointer ${
      enabled
        ? `bg-gradient-to-b ${onColor} border-white/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_2px_8px_rgba(0,0,0,0.4)]`
        : 'bg-white/10 border-white/20 backdrop-blur-sm'
    }`}
  >
    <div
      className={`absolute top-1 h-5 w-5 rounded-full bg-gradient-to-b from-white to-slate-300 shadow-[0_1px_3px_rgba(0,0,0,0.6)] transition-all ${
        enabled ? 'left-6' : 'left-1'
      }`}
    />
  </button>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({
  soundEnabled,
  vibrateEnabled,
  bgmEnabled,
  onToggleSound,
  onToggleVibrate,
  onToggleBgm,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#03081a]/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#1a2a55]/85 via-[#0e1e42]/80 to-[#0a1630]/85 backdrop-blur-2xl border border-white/15 shadow-2xl p-5 flex flex-col overflow-hidden">
        {/* Top ambient glow + hairline highlight */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-400/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between pb-4 border-b border-white/10">
          <h3 className="text-lg font-black text-white">游戏设置</h3>
          <button
            onClick={onClose}
            className={`relative p-1.5 rounded-xl text-white active:scale-95 transition-transform cursor-pointer overflow-hidden ${GLOSSY_BLUE}`}
          >
            <div className="absolute top-0.5 left-1 right-1 h-2 rounded-t-[10px] bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />
            <X className="relative w-5 h-5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
          </button>
        </div>

        {/* Toggles */}
        <div className="relative py-4 flex flex-col gap-3">
          {/* Water Sound */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-400/30">
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <span className="text-sm font-bold text-white">水流音效</span>
            </div>
            <GlassSwitch
              enabled={soundEnabled}
              onColor="from-cyan-400 to-blue-500"
              onClick={() => {
                onToggleSound();
                soundManager.playSelect();
              }}
            />
          </div>

          {/* Haptics */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-400/30">
                <Vibrate className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-white">触感震动</span>
            </div>
            <GlassSwitch
              enabled={vibrateEnabled}
              onColor="from-emerald-400 to-teal-500"
              onClick={onToggleVibrate}
            />
          </div>

          {/* Background Music */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center border border-violet-400/30">
                <Music className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-white">背景音乐</span>
            </div>
            <GlassSwitch
              enabled={bgmEnabled}
              onColor="from-violet-400 to-purple-500"
              onClick={onToggleBgm}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
