// src/tts/speak.ts

let preferredVoice: SpeechSynthesisVoice | null = null;

function findEnglishVoice(): SpeechSynthesisVoice | null {
  if (preferredVoice) return preferredVoice;

  const voices = speechSynthesis.getVoices();

  preferredVoice =
    voices.find(
      (v) => v.lang.startsWith("en-US") && v.name.includes("Google")
    ) ??
    voices.find(
      (v) => v.lang.startsWith("en-US") && v.name.includes("Samantha")
    ) ??
    voices.find(
      (v) => v.lang.startsWith("en-US") && v.name.includes("Microsoft")
    ) ??
    voices.find((v) => v.lang.startsWith("en-US")) ??
    voices.find((v) => v.lang.startsWith("en-GB")) ??
    voices.find((v) => v.lang.startsWith("en")) ??
    null;

  return preferredVoice;
}

export function speak(text: string, rate: number = 0.9): Promise<void> {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) {
      console.warn("Web Speech API not supported");
      resolve();
      return;
    }

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = findEnglishVoice();

    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;

    let resolved = false;
    const done = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      resolve();
    };

    // Safety net: resolve after 5s if onend/onerror never fire (known Chromium bug)
    const timeout = setTimeout(done, 5_000);

    utterance.onend = () => done();
    utterance.onerror = () => {
      console.warn("TTS error, continuing");
      done();
    };

    speechSynthesis.speak(utterance);
  });
}

export function initVoices(): void {
  if ("speechSynthesis" in window) {
    speechSynthesis.getVoices();
    speechSynthesis.onvoiceschanged = () => {
      preferredVoice = null;
      findEnglishVoice();
    };
  }
}
