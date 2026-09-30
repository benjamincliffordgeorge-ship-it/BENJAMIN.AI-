import { useEffect } from 'react';
import { StudioTab } from '../components/Navbar';

interface WindowsShortcutsOptions {
  activeTab: StudioTab;
  onSelectTab: (tab: StudioTab) => void;
  onSynthesize: () => void;
  onOpenExportModal: () => void;
  onOpenHistory: () => void;
  onOpenPricingModal: () => void;
  onOpenShortcutsModal: () => void;
  onOpenVoiceHearing?: () => void;
  onCloseModals: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export function useWindowsShortcuts({
  activeTab,
  onSelectTab,
  onSynthesize,
  onOpenExportModal,
  onOpenHistory,
  onOpenPricingModal,
  onOpenShortcutsModal,
  onOpenVoiceHearing,
  onCloseModals,
  showToast,
}: WindowsShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement | null;
      const isInputOrTextarea =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      // F1 or Ctrl + / or Ctrl + K: Open Windows Shortcuts Modal
      if (e.key === 'F1' || (isCtrlOrMeta && (e.key === '/' || e.key === 'k' || e.key === 'K'))) {
        e.preventDefault();
        onOpenShortcutsModal();
        return;
      }

      // Escape: Close any open modal / drawer
      if (e.key === 'Escape') {
        onCloseModals();
        return;
      }

      // Ctrl + 1..3: Switch Studio Tabs
      if (isCtrlOrMeta && !e.shiftKey && !e.altKey) {
        if (e.key === '1') {
          e.preventDefault();
          onSelectTab('search');
          showToast('Switched to KURAL Search Engine [Ctrl + 1]', 'info');
          return;
        }
        if (e.key === '2') {
          e.preventDefault();
          onSelectTab('tts');
          showToast('Switched to TTS Studio [Ctrl + 2]', 'info');
          return;
        }
        if (e.key === '3') {
          e.preventDefault();
          onSelectTab('live');
          showToast('Switched to Live Voice Assistant [Ctrl + 3]', 'info');
          return;
        }
      }

      // Ctrl + H: Open Audio Library / History
      if (isCtrlOrMeta && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        onOpenHistory();
        return;
      }

      // Ctrl + M or Ctrl + B: Open Pricing / Credits Top-up
      if (isCtrlOrMeta && (e.key === 'm' || e.key === 'M' || e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        onOpenPricingModal();
        return;
      }

      // Ctrl + E: Open Export Audio Modal
      if (isCtrlOrMeta && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        onOpenExportModal();
        return;
      }

      // Ctrl + Shift + S: Toggle Sample Scripts dropdown in TTS
      if (isCtrlOrMeta && e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('benjamin:toggle-sample-scripts'));
        return;
      }

      // Ctrl + Shift + X: Clear text in TTS
      if (isCtrlOrMeta && e.shiftKey && (e.key === 'x' || e.key === 'X')) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('benjamin:clear-script'));
        showToast('Cleared script text [Ctrl + Shift + X]', 'info');
        return;
      }

      // Alt + P or Ctrl + Space: Toggle Play / Pause Audio
      if ((e.altKey && (e.key === 'p' || e.key === 'P')) || (isCtrlOrMeta && e.code === 'Space')) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('benjamin:toggle-playback'));
        return;
      }

      // Space when not inside an input/textarea: Toggle Play / Pause Audio
      if (e.code === 'Space' && !isInputOrTextarea) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('benjamin:toggle-playback'));
        return;
      }

      // Alt + Left: Skip backward 5s
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('benjamin:seek-playback', { detail: { delta: -5 } }));
        showToast('Seek -5s [Alt + ←]', 'info');
        return;
      }

      // Alt + Right: Skip forward 5s
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('benjamin:seek-playback', { detail: { delta: 5 } }));
        showToast('Seek +5s [Alt + →]', 'info');
        return;
      }

      // Alt + M: Toggle Mute
      if (e.altKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('benjamin:toggle-mute'));
        return;
      }

      // Alt + G: Toggle Google Search Grounding in Chat
      if (e.altKey && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('benjamin:toggle-search-grounding'));
        return;
      }

      // Alt + V: Start / End Live Voice Call
      if (e.altKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('benjamin:toggle-live-call'));
        return;
      }

      // Alt + H or Ctrl + Shift + H: Open AI Voice Hearing & Speech Transcriber
      if ((e.altKey && (e.key === 'h' || e.key === 'H')) || (isCtrlOrMeta && e.shiftKey && (e.key === 'h' || e.key === 'H'))) {
        e.preventDefault();
        if (onOpenVoiceHearing) {
          onOpenVoiceHearing();
          showToast('Opened AI Voice Hearing & Transcriber [Alt + H]', 'info');
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    activeTab,
    onSelectTab,
    onSynthesize,
    onOpenExportModal,
    onOpenHistory,
    onOpenPricingModal,
    onOpenShortcutsModal,
    onOpenVoiceHearing,
    onCloseModals,
    showToast,
  ]);
}
