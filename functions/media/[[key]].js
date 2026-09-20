import {cleanPath,getRawFile,githubConfig} from '../api/_github.js';

const contentTypes={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif'};
function mediaType(path){const ext=path.split('.').pop()?.toLowerCase();return contentTypes[ext]||'application/octet-stream';}

export async function onRequestGet(context){
  const {request,params,env}=context;
  const cfg=githubConfig(env);
  if(cfg.missing.length)return new Response('GitHub storage is not configured',{status:503});
  const key=cleanPath(Array.isArray(params.key)?params.key.join('/'):String(params.key||''));
  if(!key)return new Response('Not found',{status:404});
  try{
    const cache=globalThis.caches?.default;
    if(cache){const hit=await cache.match(request);if(hit)return hit;}
    const raw=await getRawFile(cfg,`${cfg.mediaDir}/${key}`);
    if(!raw)return new Response('Not found',{status:404});
    const headers=new Headers({
      'Content-Type':mediaType(key),
      'Cache-Control':'public, max-age=31536000, immutable',
      'X-Content-Type-Options':'nosniff'
    });
    const etag=raw.headers.get('etag');if(etag)headers.set('ETag',etag);
    const response=new Response(raw.body,{status:200,headers});
    if(cache)context.waitUntil(cache.put(request,response.clone()));
    return response;
  }catch(e){
    return new Response('Media fetch failed',{status:502,headers:{'Cache-Control':'no-store'}});
  }
}
