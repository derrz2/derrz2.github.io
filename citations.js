(() => {
 const status=document.getElementById('citation-status');
 let busy=false;
 function date(iso){return new Intl.DateTimeFormat('en',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',timeZoneName:'short'}).format(new Date(iso));}
 async function refresh(){
  if(busy||document.hidden)return;busy=true;
  try{
   const response=await fetch('/citations.json',{cache:'no-store',signal:AbortSignal.timeout(30000)});
   if(!response.ok)throw Error('Citation service unavailable');
   const data=await response.json();
   if(data.source!=='Google Scholar'||!Number.isFinite(Date.parse(data.fetchedAt)))throw Error('Invalid citation data');
   document.querySelectorAll('.citation-link[data-paper]').forEach(link=>{
    const item=data.papers?.[link.dataset.paper];
    if(!item||!Number.isSafeInteger(item.count)||item.count<0)return;
    const url=new URL(item.url);
    if(url.protocol!=='https:'||url.hostname!=='scholar.google.com')return;
    link.href=url.href;link.querySelector('.citation-count').textContent=item.count+(item.estimated?'*':'');
    link.title='Google Scholar · Verified '+date(data.fetchedAt)+(item.estimated?' · Estimated by Scholar':'');
   });
   const stale=data.syncState==='stale'||Date.now()-Date.parse(data.fetchedAt)>2*60*60*1000;
   status.textContent='Google Scholar · '+(stale?'Last verified ':'Updated ')+date(data.fetchedAt)+(stale?' · Update delayed; showing last verified counts.':' · Automatically updated hourly.');
   status.title='Google Scholar updates its own index on a separate schedule. Counts are not instantaneous.';
  }catch{status.textContent=status.textContent.replace(/ · Sync unavailable\./g,'').replace(' · Checking for updates…','').replace(' · Automatically updated hourly.','')+' · Sync unavailable.';}
  finally{busy=false;}
 }
 refresh();setInterval(refresh,5*60*1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
})();
