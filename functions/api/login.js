import {makeSession,json} from './_auth.js';
export async function onRequestPost({request,env}){
  if(!env.ADMIN_PASSWORD||!env.ADMIN_SESSION_SECRET)return json({error:'Cloudflare에 ADMIN_PASSWORD와 ADMIN_SESSION_SECRET을 먼저 등록해주세요.'},503);
  let body={};try{body=await request.json()}catch{return json({error:'잘못된 요청입니다.'},400)}
  if(body.password!==env.ADMIN_PASSWORD)return json({error:'비밀번호가 올바르지 않습니다.'},401);
  const token=await makeSession(env.ADMIN_SESSION_SECRET);
  return json({ok:true},200,{'Set-Cookie':`artist_admin=${token}; Path=/; Max-Age=86400; HttpOnly; Secure; SameSite=Strict`});
}
