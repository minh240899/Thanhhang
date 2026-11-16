import {body,result,sameOrigin,err} from './_lib/auth.js';import {mutateDocument} from './_lib/store.js';import {randomUUID,createHash} from 'node:crypto';
const limits=new Map();function throttled(req){const ip=String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'unknown').split(',')[0],key=createHash('sha256').update(ip).digest('hex');const t=Date.now();const x=limits.get(key)||[];const active=x.filter(y=>t-y<60000);active.push(t);limits.set(key,active);return active.length>12;}
const clean=(x,n)=>String(x||'').trim().slice(0,n);const groups=['Gia đình','Bạn bè & đồng nghiệp','Người thương'];
export default async function handler(req,res){if(req.method!=='POST')return result(res,405,{error:'Method not allowed'});if(!sameOrigin(req))return result(res,403,{error:'Origin không hợp lệ'});if(throttled(req))return result(res,429,{error:'Bạn đang gửi quá nhanh. Hãy thử lại sau.'});try{
 const x=await body(req,12000),type=x.type;const author=clean(x.author,40),message=clean(x.message,1200);
 if(x.honey||!['wish','comment','like'].includes(type))return result(res,400,{error:'Nội dung không hợp lệ'});
 if(type!=='like'&&(!author||!message))return result(res,400,{error:'Thiếu tên hoặc nội dung'});
 const resultState=await mutateDocument(d=>{const s=d.state,entry={id:randomUUID(),created_at:new Date().toISOString(),author,message,approved:true};
 if(type==='wish'){if(!groups.includes(x.group))throw Object.assign(new Error('Nhóm lời chúc không hợp lệ'),{statusCode:400});s.wishes.unshift({...entry,group_type:x.group,media_items:[],image_urls:[]});}
 else if(type==='comment'){const kind=x.kind==='post'?'post':x.kind==='wish'?'wish':null;if(!kind)throw Object.assign(new Error('Loại không hợp lệ'),{statusCode:400});const items=kind==='post'?s.posts:s.wishes;if(!items.some(item=>item.id===x.id&&item.approved!==false))throw Object.assign(new Error('Bài viết không tồn tại'),{statusCode:404});(kind==='post'?s.comments:s.wishComments).push({...entry,...(kind==='post'?{memory_id:x.id}:{wish_id:x.id})});}
 else {const kind=x.kind==='post'?'post':x.kind==='wish'?'wish':null;if(!kind)throw Object.assign(new Error('Loại không hợp lệ'),{statusCode:400});const items=kind==='post'?s.posts:s.wishes;if(!items.some(item=>item.id===x.id&&item.approved!==false))throw Object.assign(new Error('Nội dung không tồn tại'),{statusCode:404});const key=kind==='post'?'likes':'wishLikes';s[key][x.id]=Math.min(100000,(s[key][x.id]||0)+1);}
 return d;});return result(res,200,{ok:true,revision:resultState.revision,pending:false,published:true});
 }catch(e){err(res,e)}}
