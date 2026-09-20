const enc = new TextEncoder();
function hex(buf){return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function sign(value,secret){const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(await crypto.subtle.sign('HMAC',key,enc.encode(value)))}
function cookie(request,name){const raw=request.headers.get('Cookie')||'';for(const part of raw.split(';')){const [k,...v]=part.trim().split('=');if(k===name)return decodeURIComponent(v.join('='))}return''}
export async function makeSession(secret){const ts=Date.now().toString();const sig=await sign(ts,secret);return `${ts}.${sig}`}
export async function isAdmin(request,env){if(!env.ADMIN_SESSION_SECRET)return false;const token=cookie(request,'artist_admin');const [ts,sig]=token.split('.');if(!ts||!sig)return false;if(Date.now()-Number(ts)>86400000)return false;const expected=await sign(ts,env.ADMIN_SESSION_SECRET);if(expected.length!==sig.length)return false;let diff=0;for(let i=0;i<expected.length;i++)diff|=expected.charCodeAt(i)^sig.charCodeAt(i);return diff===0}
export const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}});
