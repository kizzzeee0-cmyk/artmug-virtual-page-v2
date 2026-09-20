import {isAdmin,json} from './_auth.js';
import {arrayBufferToBase64,cleanPath,githubConfig,putFile} from './_github.js';

const types=new Map([
  ['image/png','png'],['image/jpeg','jpg'],['image/webp','webp'],['image/gif','gif']
]);

export async function onRequestPost({request,env}){
  if(!(await isAdmin(request,env)))return json({error:'관리자 로그인이 필요합니다.'},401);
  const cfg=githubConfig(env);
  if(cfg.missing.length)return json({error:`Cloudflare에 ${cfg.missing.join(', ')} 값을 먼저 등록해주세요.`},503);
  let form;try{form=await request.formData()}catch{return json({error:'업로드 요청을 읽지 못했습니다.'},400)}
  const file=form.get('file');
  if(!(file instanceof File))return json({error:'파일이 없습니다.'},400);
  if(!types.has(file.type))return json({error:'PNG/JPG/WEBP/GIF 파일만 업로드할 수 있습니다.'},415);
  if(file.size>10*1024*1024)return json({error:'GitHub 저장 방식에서는 파일 하나를 10MB 이하로 사용하는 것을 권장합니다.'},413);
  const ext=types.get(file.type);
  const date=new Date().toISOString().slice(0,7);
  const filename=`${crypto.randomUUID()}.${ext}`;
  const relativePath=cleanPath(`${date}/${filename}`);
  const repoPath=cleanPath(`${cfg.mediaDir}/${relativePath}`);
  try{
    const buffer=await file.arrayBuffer();
    await putFile(cfg,repoPath,arrayBufferToBase64(buffer),`Upload Artmug media: ${filename}`,{sha:null});
    return json({ok:true,key:relativePath,url:`/media/${relativePath}`,size:file.size,type:file.type});
  }catch(e){
    return json({error:'GitHub에 파일을 업로드하지 못했습니다.',detail:e.message},502);
  }
}
