const API_VERSION='2026-03-10';
const API_ROOT='https://api.github.com';

export function githubConfig(env){
  const owner=(env.GITHUB_OWNER||'').trim();
  const repo=(env.GITHUB_REPO||'').trim();
  const token=(env.GITHUB_TOKEN||'').trim();
  const branch=(env.GITHUB_BRANCH||'main').trim()||'main';
  const contentPath=cleanPath(env.GITHUB_CONTENT_PATH||'site-data/site.json');
  const mediaDir=cleanPath(env.GITHUB_MEDIA_DIR||'site-media');
  const missing=[];
  if(!owner)missing.push('GITHUB_OWNER');
  if(!repo)missing.push('GITHUB_REPO');
  if(!token)missing.push('GITHUB_TOKEN');
  return {owner,repo,token,branch,contentPath,mediaDir,missing};
}

export function cleanPath(value=''){
  return String(value).replace(/\\/g,'/').replace(/^\/+|\/+$/g,'').split('/').filter(p=>p&&p!=='.'&&p!=='..').join('/');
}

function encodeRepoPath(path){
  return cleanPath(path).split('/').map(encodeURIComponent).join('/');
}

function githubHeaders(cfg,accept='application/vnd.github+json'){
  return {
    'Accept':accept,
    'Authorization':`Bearer ${cfg.token}`,
    'X-GitHub-Api-Version':API_VERSION,
    'User-Agent':'artmug-artist-page-v2'
  };
}

async function parseError(response){
  let message=`GitHub 요청 실패 (${response.status})`;
  try{
    const body=await response.clone().json();
    if(body?.message)message=`${message}: ${body.message}`;
  }catch{}
  return new Error(message);
}

export async function getFileMeta(cfg,path){
  const url=`${API_ROOT}/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${encodeRepoPath(path)}?ref=${encodeURIComponent(cfg.branch)}`;
  const r=await fetch(url,{headers:githubHeaders(cfg)});
  if(r.status===404)return null;
  if(!r.ok)throw await parseError(r);
  return r.json();
}

export async function getRawFile(cfg,path){
  const url=`${API_ROOT}/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${encodeRepoPath(path)}?ref=${encodeURIComponent(cfg.branch)}`;
  const r=await fetch(url,{headers:githubHeaders(cfg,'application/vnd.github.raw+json')});
  if(r.status===404)return null;
  if(!r.ok)throw await parseError(r);
  return r;
}

function bytesToBase64(bytes){
  let out='';
  const chunk=0x8000;
  for(let i=0;i<bytes.length;i+=chunk){
    out+=String.fromCharCode(...bytes.subarray(i,i+chunk));
  }
  return btoa(out);
}

export function textToBase64(text){
  return bytesToBase64(new TextEncoder().encode(text));
}

export function arrayBufferToBase64(buffer){
  return bytesToBase64(new Uint8Array(buffer));
}

export async function putFile(cfg,path,base64Content,message,{sha}={}){
  const clean=cleanPath(path);
  let currentSha=sha;
  if(currentSha===undefined){
    const existing=await getFileMeta(cfg,clean);
    currentSha=existing?.sha||null;
  }
  const url=`${API_ROOT}/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${encodeRepoPath(clean)}`;
  const body={message,content:base64Content,branch:cfg.branch};
  if(currentSha)body.sha=currentSha;
  const r=await fetch(url,{method:'PUT',headers:{...githubHeaders(cfg),'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!r.ok)throw await parseError(r);
  return r.json();
}
