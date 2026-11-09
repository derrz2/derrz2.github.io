export function parseSerpApi(data,seed,now=new Date().toISOString()){
 if(data.error||!Array.isArray(data.articles))throw Error('Provider articles unavailable');
 const found=new Map(data.articles.map(a=>[a.citation_id,a]));
 const papers={};
 for(const [slug,known] of Object.entries(seed.papers)){
  const a=found.get(known.citationId);
  // Scholar omits the citation value for uncited articles. Accept this only
  // for a verified zero-count paper with no cited-by link.
  const raw=a?.cited_by?.value;
  const count=raw==null&&a&&known.count===0&&!a.cited_by?.link?0:raw;
  if(!a||!Number.isSafeInteger(count)||count<0)throw Error('Incomplete provider profile');
  const url=new URL(a.cited_by?.link||a.link);
  if(url.protocol!=='https:'||url.hostname!=='scholar.google.com')throw Error('Invalid provider source');
  papers[slug]={citationId:known.citationId,count,estimated:false,url:url.href};
 }
 const processed=data.search_metadata?.processed_at;
 const processedTime=processed?Date.parse(processed):NaN;
 const fetchedAt=Number.isFinite(processedTime)?new Date(Math.min(processedTime,Date.parse(now))).toISOString():now;
 return {source:'Google Scholar',provider:'SerpAPI',profileUrl:seed.profileUrl,fetchedAt,papers};
}
