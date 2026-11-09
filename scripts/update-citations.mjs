import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {parseSerpApi} from './scholar-parser.mjs';
const seed=JSON.parse(await readFile('citations.json','utf8'));
let snapshot=seed;
try {
 const cached=JSON.parse(await readFile('.citation-cache/citations.json','utf8'));
 if(cached.source==='Google Scholar'&&Date.parse(cached.fetchedAt)>Date.parse(seed.fetchedAt)&&Object.entries(seed.papers).every(([slug,p])=>cached.papers?.[slug]?.citationId===p.citationId&&Number.isSafeInteger(cached.papers[slug].count)&&cached.papers[slug].count>=0))snapshot=cached;
}catch{}
let live=false;
try {
 if(!process.env.SERPAPI_API_KEY)throw Error('Missing SERPAPI_API_KEY');
 const url=new URL('https://serpapi.com/search.json');
 url.search=new URLSearchParams({engine:'google_scholar_author',author_id:'Yru0cJoAAAAJ',hl:'en',num:'100',api_key:process.env.SERPAPI_API_KEY}).toString();
 const response=await fetch(url,{signal:AbortSignal.timeout(45000)});
 if(!response.ok)throw Error('Provider HTTP '+response.status);
 snapshot=parseSerpApi(await response.json(),seed);
 snapshot.syncState='live';live=true;
 console.log('Verified Google Scholar counts for '+Object.keys(snapshot.papers).length+' papers at '+snapshot.fetchedAt);
}catch {
 snapshot={...snapshot,syncState:'stale'};
 console.warn('::warning::Citation refresh unavailable; preserving the last verified snapshot. Check the SerpAPI secret and account quota.');
}
await writeFile('citations.json',JSON.stringify(snapshot,null,2)+'\n');
if(live){await mkdir('.citation-cache',{recursive:true});await writeFile('.citation-cache/citations.json',JSON.stringify(snapshot,null,2)+'\n');}
