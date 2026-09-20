import {isAdmin,json} from './_auth.js';
export async function onRequestGet({request,env}){return json({authenticated:await isAdmin(request,env)})}
