import {json} from './_auth.js';
export async function onRequestPost(){return json({ok:true},200,{'Set-Cookie':'artist_admin=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict'})}
