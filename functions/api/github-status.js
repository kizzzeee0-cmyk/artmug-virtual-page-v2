import {isAdmin,json} from './_auth.js';
import {githubConfig,resolveGitHubConfig} from './_github.js';

export async function onRequestGet({request,env}){
  if(!(await isAdmin(request,env)))return json({error:'관리자 로그인이 필요합니다.'},401);
  let cfg=githubConfig(env);
  if(cfg.missing.length)return json({ok:false,error:`Cloudflare에 ${cfg.missing.join(', ')} 값을 먼저 등록해주세요.`},503);
  try{
    cfg=await resolveGitHubConfig(cfg);
    return json({ok:true,owner:cfg.owner,repo:cfg.repo,branch:cfg.branch,defaultBranch:cfg.defaultBranch,userLogin:cfg.userLogin,privateRepo:cfg.privateRepo,contentPath:cfg.contentPath,mediaDir:cfg.mediaDir});
  }catch(e){
    return json({ok:false,error:'GitHub 연결 실패',detail:e.message},e.status===401?401:502);
  }
}
