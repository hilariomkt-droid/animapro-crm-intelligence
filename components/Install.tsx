'use client';
import { useEffect, useState } from 'react';
type InstallPrompt = Event & {prompt(): Promise<void>};
export default function Install() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  useEffect(() => {
    const receive = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt); };
    window.addEventListener('beforeinstallprompt', receive);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/crm-sw.js').catch(() => {});
    return () => window.removeEventListener('beforeinstallprompt', receive);
  }, []);
  return prompt ? <button className="btn" onClick={async () => { await prompt.prompt(); setPrompt(null); }}>Instalar aplicativo</button> : null;
}
