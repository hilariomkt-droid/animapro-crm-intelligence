self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(fetch(event.request).catch(() => new Response(
    '<html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>AnimaPro CRM</title><main><h1>Você está sem conexão</h1><p>Reconecte-se para consultar o CRM.</p><a href="/dashboard">Tentar novamente</a></main></html>',
    {headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}}
  )));
});
