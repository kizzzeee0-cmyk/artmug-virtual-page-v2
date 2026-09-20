const API_VERSION='2026-03-10';
const API_ROOT='https://api.github.com';

let resolvedCache={key:'',expires:0,value:null};
function cacheKeyFor(cfg){return `${cfg.owner}/${cfg.repo}|${cfg.branchConfigured?cfg.branch:'auto'}|${cfg.token}`;}

export function githubConfig(env){
  const owner=(env.GITHUB_OWNER||'').trim();
  const repo=(env.GITHUB_REPO||'').trim();
  const token=(env.GITHUB_TOKEN||'').trim();
  // 미설정 시 일반적인 기본값 main을 사용합니다. 관리자 저장/업로드 전에는 실제 default branch도 확인합니다.
  const configuredBranch=(env.GITHUB_BRANCH||'').trim();
  const branch=configuredBranch||'main';
  const branchConfigured=!!configuredBranch;
  const contentPath=cleanPath(env.GITHUB_CONTENT_PATH||'site-data/site.json');
  const mediaDir=cleanPath(env.GITHUB_MEDIA_DIR||'site-media');
  const missing=[];
  if(!owner)missing.push('GITHUB_OWNER');
  if(!repo)missing.push('GITHUB_REPO');
  if(!token)missing.push('GITHUB_TOKEN');
  return {owner,repo,token,branch,branchConfigured,contentPath,mediaDir,missing};
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
    'User-Agent':'artmug-artist-page-v2.1'
  };
}

async function responseMessage(response){
  try{
    const body=await response.clone().json();
    return body?.message||'';
  }catch{return''}
}

function makeGithubError(status,message,code='github_error'){
  const err=new Error(message);
  err.status=status;
  err.code=code;
  return err;
}

async function requestUser(cfg){
  const r=await fetch(`${API_ROOT}/user`,{headers:githubHeaders(cfg)});
  if(r.status===401)throw makeGithubError(401,'GITHUB_TOKEN이 올바르지 않거나 만료되었습니다. GitHub에서 토큰을 다시 만든 뒤 Cloudflare의 GITHUB_TOKEN을 교체해주세요.','token_invalid');
  if(r.status===403)throw makeGithubError(403,'GitHub 토큰 요청이 거부되었습니다. 토큰 상태와 GitHub API 사용 제한을 확인해주세요.','token_forbidden');
  if(!r.ok)throw makeGithubError(r.status,`GitHub 토큰 확인 실패 (${r.status}): ${await responseMessage(r)||r.statusText}`,'token_check_failed');
  return r.json();
}

async function requestRepo(cfg){
  const url=`${API_ROOT}/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}`;
  const r=await fetch(url,{headers:githubHeaders(cfg)});
  if(r.status===404){
    throw makeGithubError(404,`GitHub 저장소 ${cfg.owner}/${cfg.repo}에 접근할 수 없습니다. GITHUB_OWNER·GITHUB_REPO 철자와 Fine-grained token의 Repository access에 이 저장소가 선택되어 있는지 확인해주세요.`,'repo_not_found');
  }
  if(r.status===403)throw makeGithubError(403,`GitHub 저장소 ${cfg.owner}/${cfg.repo} 접근 권한이 부족합니다. 토큰의 Repository permissions → Contents를 Read and write로 설정해주세요.`,'repo_forbidden');
  if(!r.ok)throw makeGithubError(r.status,`GitHub 저장소 확인 실패 (${r.status}): ${await responseMessage(r)||r.statusText}`,'repo_check_failed');
  return r.json();
}

export async function resolveGitHubConfig(cfg){
  if(cfg.missing?.length) return cfg;
  const key=cacheKeyFor(cfg),now=Date.now();
  if(resolvedCache.value&&resolvedCache.key===key&&resolvedCache.expires>now)return resolvedCache.value;
  const user=await requestUser(cfg);
  const repoInfo=await requestRepo(cfg);
  const branch=cfg.branchConfigured?cfg.branch:(repoInfo.default_branch||cfg.branch||'main');
  const value={...cfg,branch,userLogin:user.login||'',defaultBranch:repoInfo.default_branch||branch,privateRepo:!!repoInfo.private};
  resolvedCache={key,expires:now+10*60*1000,value};
  return value;
}

async function parseError(response,cfg,path=''){
  const raw=await responseMessage(response);
  if(response.status===404){
    const target=path?` 파일 경로(${path})`:'';
    return makeGithubError(404,`GitHub 요청이 404로 실패했습니다.${target} 저장소 ${cfg.owner}/${cfg.repo}, 브랜치 ${cfg.branch} 설정을 확인해주세요. 비공개 저장소라면 토큰에 해당 저장소 접근 권한이 반드시 필요합니다.${raw?` GitHub: ${raw}`:''}`,'github_404');
  }
  if(response.status===403){
    return makeGithubError(403,`GitHub 쓰기 권한이 부족합니다. Fine-grained token에서 해당 저장소를 선택하고 Contents 권한을 Read and write로 설정해주세요.${raw?` GitHub: ${raw}`:''}`,'github_403');
  }
  if(response.status===401){
    return makeGithubError(401,`GITHUB_TOKEN 인증에 실패했습니다. 토큰이 만료되었거나 값이 잘못되었습니다.${raw?` GitHub: ${raw}`:''}`,'github_401');
  }
  return makeGithubError(response.status,`GitHub 요청 실패 (${response.status})${raw?`: ${raw}`:''}`,'github_error');
}

export async function getFileMeta(cfg,path){
  const resolved=cfg;
  const url=`${API_ROOT}/repos/${encodeURIComponent(resolved.owner)}/${encodeURIComponent(resolved.repo)}/contents/${encodeRepoPath(path)}?ref=${encodeURIComponent(resolved.branch)}`;
  const r=await fetch(url,{headers:githubHeaders(resolved)});
  if(r.status===404)return null;
  if(!r.ok)throw await parseError(r,resolved,path);
  return r.json();
}

export async function getRawFile(cfg,path){
  const resolved=cfg.defaultBranch!==undefined?cfg:await resolveGitHubConfig(cfg);
  const url=`${API_ROOT}/repos/${encodeURIComponent(resolved.owner)}/${encodeURIComponent(resolved.repo)}/contents/${encodeRepoPath(path)}?ref=${encodeURIComponent(resolved.branch)}`;
  const r=await fetch(url,{headers:githubHeaders(resolved,'application/vnd.github.raw+json')});
  if(r.status===404)return null;
  if(!r.ok)throw await parseError(r,resolved,path);
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
  const resolved=cfg;
  const clean=cleanPath(path);
  let currentSha=sha;
  if(currentSha===undefined){
    const existing=await getFileMeta(resolved,clean);
    currentSha=existing?.sha||null;
  }
  const url=`${API_ROOT}/repos/${encodeURIComponent(resolved.owner)}/${encodeURIComponent(resolved.repo)}/contents/${encodeRepoPath(clean)}`;
  const body={message,content:base64Content,branch:resolved.branch};
  if(currentSha)body.sha=currentSha;
  const r=await fetch(url,{method:'PUT',headers:{...githubHeaders(resolved),'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!r.ok)throw await parseError(r,resolved,clean);
  return r.json();
}
