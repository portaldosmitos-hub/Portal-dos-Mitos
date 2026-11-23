const SHELL='pdm-shell-v3',BLOG='https://portal-dos-mitos.blogspot.com';
self.addEventListener('install',e=>{e.waitUntil(caches.open(SHELL).then(c=>c.addAll(['./','./manifest.webmanifest','./icon.svg'])).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n.startsWith('pdm-shell')&&n!==SHELL).map(n=>caches.delete(n)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  e.respondWith(fetch(r).then(res=>{const c=res.clone();caches.open(SHELL).then(x=>x.put(r,c));return res}).catch(()=>caches.match(r).then(m=>m||caches.match('./'))));
});
async function check(){
  const res=await fetch(BLOG+'/feeds/posts/default?alt=json&max-results=1');
  const en=(await res.json()).feed.entry[0];
  const id=en.id.$t.split('post-')[1]||en.id.$t;
  const meta=await caches.open('pdm-meta');
  const prev=await meta.match('/lastseen');
  const last=prev?await prev.text():null;
  if(last&&last!==id){
    const txt=(en.content?en.content.$t:'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,120);
    await self.registration.showNotification('Novo mito: '+en.title.$t,{body:txt,icon:'icon.svg',badge:'icon.svg',tag:'mito-'+id});
  }
  await meta.put('/lastseen',new Response(id));
}
self.addEventListener('periodicsync',e=>{if(e.tag==='novos-mitos')e.waitUntil(check().catch(()=>{}))});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>l.length?l[0].focus():self.clients.openWindow('./')));
});
