import { useState, useEffect, useRef, useCallback } from 'react';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

interface UseVoiceOptions {
  onTranscript?: (text: string) => void;
  wakeWord?: string;
  lang?: string;
  ttsEnabled?: boolean;
}

// Web Speech API types (not always in TS lib)
interface SpeechRecognitionResultItem { transcript: string; confidence: number; }
interface SpeechRecognitionResult extends Iterable<SpeechRecognitionResultItem> {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionResultItem;
  [index: number]: SpeechRecognitionResultItem;
}
interface SpeechRecognitionResultList extends Iterable<SpeechRecognitionResult> {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onstart: ((ev: Event) => void) | null;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((ev: Event) => void) | null;
  onend: ((ev: Event) => void) | null;
}

function getSRClass(): (new () => SpeechRecognitionInstance) | null {
  const w = window as unknown as Record<string, unknown>;
  return (w['SpeechRecognition'] as (new () => SpeechRecognitionInstance) | undefined)
    || (w['webkitSpeechRecognition'] as (new () => SpeechRecognitionInstance) | undefined)
    || null;
}

export function useVoice({ onTranscript, wakeWord = 'nexus', lang = 'en-US', ttsEnabled = true }: UseVoiceOptions = {}) {
  const [state, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const supported = !!getSRClass() && 'speechSynthesis' in window;

  const speak = useCallback((text: string, langCode?: string) => {
    if (!ttsEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = langCode || lang;
    utter.rate = 0.95;
    utter.pitch = 0.85;
    utter.volume = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const pref = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Microsoft')))
      || voices.find(v => v.lang.startsWith('en'))
      || voices[0];
    if (pref) utter.voice = pref;
    utter.onstart = () => setVoiceState('speaking');
    utter.onend = () => setVoiceState(enabledRef.current ? 'listening' : 'idle');
    window.speechSynthesis.speak(utter);
  }, [ttsEnabled, lang]);

  const stopListening = useCallback(() => {
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setVoiceState('idle');
    setTranscript('');
  }, []);

  const startListening = useCallback(() => {
    const SRClass = getSRClass();
    if (!SRClass) return;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
    const sr = new SRClass();
    sr.continuous = true;
    sr.interimResults = true;
    sr.lang = lang;
    sr.maxAlternatives = 1;

    sr.onstart = () => setVoiceState('listening');

    sr.onresult = (event: SpeechRecognitionEvent) => {
      const results = Array.from(event.results);
      const fullTranscript = results.map(r => r[0].transcript).join(' ').trim();
      setTranscript(fullTranscript);

      const latest = results[results.length - 1]?.[0]?.transcript?.toLowerCase() || '';
      if (latest.includes(wakeWord.toLowerCase())) {
        setWakeWordDetected(true);
        setTimeout(() => setWakeWordDetected(false), 3000);
      }

      if (event.results[event.results.length - 1].isFinal) {
        setTranscript('');
        if (fullTranscript.length > 2) {
          setVoiceState('processing');
          onTranscript?.(fullTranscript);
        }
      }
    };

    sr.onerror = () => {
      setVoiceState('idle');
      if (enabledRef.current) {
        restartTimerRef.current = setTimeout(() => startListening(), 1500);
      }
    };

    sr.onend = () => {
      if (enabledRef.current) {
        restartTimerRef.current = setTimeout(() => startListening(), 500);
      } else {
        setVoiceState('idle');
      }
    };

    recognitionRef.current = sr;
    try { sr.start(); } catch (_) {}
  }, [lang, wakeWord, onTranscript]);

  const toggle = useCallback(() => {
    setEnabled(prev => {
      if (prev) stopListening();
      return !prev;
    });
  }, [stopListening]);

  const pushToTalk = useCallback(() => {
    const SRClass = getSRClass();
    if (!SRClass) return;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
    const sr = new SRClass();
    sr.continuous = false;
    sr.interimResults = true;
    sr.lang = lang;
    sr.maxAlternatives = 1;
    sr.onstart = () => setVoiceState('listening');
    sr.onresult = (event: SpeechRecognitionEvent) => {
      const t = Array.from(event.results).map(r => r[0].transcript).join(' ').trim();
      setTranscript(t);
      if (event.results[event.results.length - 1].isFinal && t.length > 1) {
        setTranscript('');
        onTranscript?.(t);
        setVoiceState('processing');
      }
    };
    sr.onend = () => setVoiceState('idle');
    sr.onerror = () => setVoiceState('idle');
    recognitionRef.current = sr;
    try { sr.start(); } catch (_) {}
  }, [lang, onTranscript]);

  useEffect(() => {
    if (enabled) startListening();
    else stopListening();
    return () => stopListening();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { state, transcript, enabled, wakeWordDetected, supported, toggle, pushToTalk, speak, setVoiceState };
}
