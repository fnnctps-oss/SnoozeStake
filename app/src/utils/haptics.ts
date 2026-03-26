import * as Haptics from 'expo-haptics';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

// Pre-load the tick sound once
let tickPlayer: ReturnType<typeof createAudioPlayer> | null = null;
let audioReady = false;

async function ensureAudio() {
  if (audioReady) return;
  try {
    await setAudioModeAsync({ playsInSilentMode: false });
    tickPlayer = createAudioPlayer(
      require('../../assets/tones/tick.wav')
    );
    audioReady = true;
  } catch {
    // graceful fallback — haptics will still work
  }
}

// Fire and forget — never block the UI
async function playTick() {
  try {
    if (!audioReady) await ensureAudio();
    if (!tickPlayer) return;
    tickPlayer.seekTo(0);
    tickPlayer.play();
  } catch {}
}

// ── Public API ────────────────────────────────────────────

/** Scroll picker item change — light selection snap */
export function hapticScroll() {
  Haptics.selectionAsync();
  playTick();
}

/** Light tap — day pill, tone row, option button */
export function hapticLight() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Medium tap — toggle switch, AM/PM */
export function hapticMedium() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/** Rigid/heavy tap — FAB, save button */
export function hapticHeavy() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
}

/** Success notification — alarm saved */
export function hapticSuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Warning — error / delete */
export function hapticWarning() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}
