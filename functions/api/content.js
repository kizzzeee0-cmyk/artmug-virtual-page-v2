import {isAdmin,json} from './_auth.js';
import {githubConfig,getRawFile,putFile,textToBase64,resolveGitHubConfig} from './_github.js';

function cacheKey(request){return new Request(new URL('/api/content',request.url).toString(),{method:'GET'});}

export async function onRequestGet(context){
  const {request,env}=context;
  let cfg=githubConfig(env);
  if(cfg.missing.length){
    return json({content:null,warning:`GitHub 저장소 설정이 없습니다: ${cfg.missing.join(', ')}`});
  }
  try{
    const cache=globalThis.caches?.default;
    if(cache){const hit=await cache.match(cacheKey(request));if(hit)return hit;}
    const raw=await getRawFile(cfg,cfg.contentPath);
    if(!raw){
      return json({content:null,warning:`${cfg.contentPath} 파일이 아직 없습니다. 관리자에서 처음 저장하면 자동 생성됩니다.`,storage:{owner:cfg.owner,repo:cfg.repo,branch:cfg.branch,path:cfg.contentPath}});
    }
    const text=await raw.text();
    let content;
    try{content=JSON.parse(text)}catch{return json({content:null,warning:`GitHub의 ${cfg.contentPath} JSON 형식이 올바르지 않습니다.`},502)}
    const response=json({content,storage:{owner:cfg.owner,repo:cfg.repo,branch:cfg.branch,path:cfg.contentPath}},200,{'Cache-Control':'public, max-age=0, s-maxage=30'});
    if(cache)context.waitUntil(cache.put(cacheKey(request),response.clone()));
    return response;
  }catch(e){
    return json({content:null,error:'GitHub에서 페이지 데이터를 불러오지 못했습니다.',detail:e.message},502);
  }
}

export async function onRequestPost(context){
  const {request,env}=context;
  if(!(await isAdmin(request,env)))return json({error:'관리자 로그인이 필요합니다.'},401);
  let cfg=githubConfig(env);
  if(cfg.missing.length)return json({error:`Cloudflare에 ${cfg.missing.join(', ')} 값을 먼저 등록해주세요.`},503);
  try{cfg=await resolveGitHubConfig(cfg)}catch(e){return json({error:'GitHub 저장소 연결 설정을 확인해주세요.',detail:e.message},e.status===401?401:502)}
  let body;try{body=await request.json()}catch{return json({error:'JSON 형식이 올바르지 않습니다.'},400)}
  if(!body||typeof body!=='object'||Array.isArray(body))return json({error:'저장할 데이터가 없습니다.'},400);
  const text=JSON.stringify(body,null,2);
  if(new TextEncoder().encode(text).byteLength>1024*1024)return json({error:'페이지 설정 데이터가 1MB를 넘었습니다. 이미지/GIF는 파일 업로드 버튼으로 등록해주세요.'},413);
  try{
    const result=await putFile(cfg,cfg.contentPath,textToBase64(text),'Update Artmug artist page content');
    const cache=globalThis.caches?.default;
    if(cache)context.waitUntil(cache.delete(cacheKey(request)));
    return json({ok:true,commit:result?.commit?.sha||null,path:cfg.contentPath,storage:{owner:cfg.owner,repo:cfg.repo,branch:cfg.branch,path:cfg.contentPath}});
  }catch(e){
    return json({error:'GitHub에 페이지 내용을 저장하지 못했습니다.',detail:e.message},502);
  }
}
