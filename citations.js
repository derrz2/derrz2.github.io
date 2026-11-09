(() => {
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
  }catch{
   // Keep the last verified counts and their per-paper timestamp tooltip.
  }
  finally{busy=false;}
 }
 refresh();setInterval(refresh,5*60*1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
})();
