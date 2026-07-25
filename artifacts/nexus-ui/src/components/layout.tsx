import React, { useState, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import {
  Activity, MessageSquare, Database,
  Network, Code, Settings, Cpu, Globe
} from 'lucide-react';
import { useGetAgentStatus } from '@workspace/api-client-react';
import { useLangContext } from '@/hooks/use-language';
import { useVoice } from '@/hooks/use-voice';
import { VoiceIndicator } from '@/components/hud/voice-indicator';
import { motion, AnimatePresence } from 'framer-motion';

function Clock() {
  const [time, setTime] = React.useState(new Date());
  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="font-mono text-primary/80 flex items-center gap-3">
      <span className="hidden sm:inline text-primary/40 text-xs tracking-widest uppercase">SYS</span>
      <div className="flex flex-col items-end">
        <span className="cyber-glow-text text-primary font-bold text-sm tracking-widest">
          {pad(time.getHours())}:{pad(time.getMinutes())}:{pad(time.getSeconds())}
        </span>
        <span className="text-primary/40 text-[9px] tracking-widest hidden sm:block">
          {time.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
        </span>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { t, lang, setLanguage } = useLangContext();
  const { data: agentStatus } = useGetAgentStatus({ query: { refetchInterval: 5000, queryKey: ['agents-status-nav'] } });
  const [showVoicePanel, setShowVoicePanel] = useState(false);

  const activeAgents = agentStatus?.filter(a => a.status === 'active').length || 0;

  const voice = useVoice({
    wakeWord: 'nexus',
    lang: lang === 'ne' ? 'ne-NP' : 'en-US',
    ttsEnabled: true,
    onTranscript: (text) => {
      // Navigate based on voice commands
      const lower = text.toLowerCase();
      if (lower.includes('chat') || lower.includes('comms') || lower.includes('कुराकानी')) {
        window.location.hash = '#/chat';
      } else if (lower.includes('memory') || lower.includes('स्मृति')) {
        window.location.hash = '#/memory';
      } else if (lower.includes('agent') || lower.includes('एजेन्ट')) {
        window.location.hash = '#/agents';
      } else if (lower.includes('sandbox') || lower.includes('code') || lower.includes('कोड')) {
        window.location.hash = '#/sandbox';
      } else if (lower.includes('setting') || lower.includes('सेटिङ')) {
        window.location.hash = '#/settings';
      } else if (lower.includes('dashboard') || lower.includes('home') || lower.includes('hud')) {
        window.location.hash = '#/';
      }
    }
  });

  const navItems = [
    { href: '/', icon: Activity, label: t.hud },
    { href: '/chat', icon: MessageSquare, label: t.comms },
    { href: '/memory', icon: Database, label: t.memory },
    { href: '/agents', icon: Network, label: t.agents },
    { href: '/sandbox', icon: Code, label: t.sandbox },
    { href: '/settings', icon: Settings, label: t.settings },
  ];

  return (
    <div className="min-h-[100dvh] h-screen bg-background text-foreground flex flex-col scanlines overflow-hidden">
      {/* Top HUD Bar */}
      <header className="h-14 border-b border-primary/20 cyber-panel flex items-center justify-between px-4 sm:px-6 z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <Cpu className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </motion.div>
            <h1 className="text-lg sm:text-xl font-bold tracking-widest text-primary cyber-glow-text uppercase">
              NEXUS <span className="text-primary/50 text-xs sm:text-sm">OS</span>
            </h1>
          </div>
          <div className="h-4 w-px bg-primary/30 mx-0 sm:mx-2 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono uppercase text-primary/70">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            {t.systemOnline}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(lang === 'en' ? 'ne' : 'en')}
            className="flex items-center gap-1.5 px-2 py-1 border border-primary/20 hover:border-primary/50 text-primary/60 hover:text-primary transition-all font-mono text-xs uppercase tracking-wider"
            title={t.language}
          >
            <Globe className="w-3 h-3" />
            <span className="hidden sm:inline">{lang === 'en' ? 'EN' : 'नेपाली'}</span>
          </button>

          {/* Voice Toggle */}
          <VoiceIndicator
            state={voice.state}
            wakeWordDetected={voice.wakeWordDetected}
            transcript={voice.transcript}
            enabled={voice.enabled}
            onToggle={voice.toggle}
            compact
          />

          <Clock />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative z-0">
        {/* Sidebar */}
        <aside className="w-16 sm:w-48 md:w-56 border-r border-primary/20 cyber-panel flex flex-col items-center sm:items-stretch py-4 sm:py-6 gap-1 shrink-0 z-10">
          <div className="text-[10px] font-mono text-primary/50 px-4 pb-3 hidden sm:block uppercase tracking-widest border-b border-primary/10 mb-2">
            {t.modules}
          </div>
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center justify-center sm:justify-start gap-3 px-0 sm:px-4 py-3 cursor-pointer transition-all duration-200 border-l-2 w-full relative",
                isActive
                  ? "border-primary bg-primary/10 text-primary cyber-glow-text"
                  : "border-transparent text-muted-foreground hover:bg-primary/5 hover:text-primary"
              )}>
                {isActive && (
                  <motion.div
                    className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary"
                    layoutId="nav-indicator"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="font-mono text-sm hidden sm:block uppercase tracking-wider">{item.label}</span>
              </Link>
            );
          })}

          <div className="mt-auto px-4 pb-4">
            <div className="hidden sm:flex flex-col gap-2 font-mono text-[10px] text-primary/50 uppercase border-t border-primary/20 pt-4 mt-4">
              <div className="flex justify-between">
                <span>{t.agents}</span>
                <span className="text-primary">{activeAgents} ACT</span>
              </div>
              <div className="flex justify-between">
                <span>NET</span>
                <span className="text-emerald-500">{t.secureNet}</span>
              </div>
              <div className="flex justify-between">
                <span>VOICE</span>
                <span className={voice.enabled ? 'text-primary' : 'text-primary/30'}>
                  {voice.enabled ? 'ON' : 'OFF'}
                </span>
              </div>

              {/* Voice wake word hint */}
              {!voice.enabled && (
                <div className="mt-2 text-primary/30 text-[9px] leading-tight">
                  {t.wakeWord}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 relative overflow-y-auto overflow-x-hidden p-4 sm:p-6 custom-scrollbar z-0">
          {children}
        </main>
      </div>

      {/* Wake word global overlay */}
      <AnimatePresence>
        {voice.wakeWordDetected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-primary/10 border border-primary backdrop-blur-md px-6 py-3 font-mono text-primary text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(0,212,255,0.4)]"
          >
            ⚡ NEXUS — {lang === 'ne' ? 'के गर्नु छ?' : 'How can I help?'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
