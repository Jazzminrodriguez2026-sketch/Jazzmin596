const CACHE='planificador-v1';
const ASSETS=['./', './index.html', './manifest.json'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>
    Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))
  ).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).catch(()=>caches.match('./index.html'))));
});

const alarms=new Map();
self.addEventListener('message',e=>{
  const{type,taskId,taskName,delay}=e.data||{};
  if(type==='SCHEDULE_ALARM'){
    if(alarms.has(taskId))clearTimeout(alarms.get(taskId));
    const tid=setTimeout(()=>{
      self.registration.showNotification('¡Es hora! — '+taskName,{
        body:'Abrí la app para iniciar la tarea',
        icon:'./icons/icon-192.png',
        vibrate:[400,150,400,150,400],
        requireInteraction:true,
        tag:'alarm-'+taskId
      });
      alarms.delete(taskId);
    },delay);
    alarms.set(taskId,tid);
  }
  if(type==='CANCEL_ALARM'){
    if(alarms.has(taskId)){clearTimeout(alarms.get(taskId));alarms.delete(taskId);}
  }
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    if(list.length)return list[0].focus();
    return clients.openWindow('./index.html');
  }));
});
