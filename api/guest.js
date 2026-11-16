import {body,result,sameOrigin,err} from './_lib/auth.js';
import {mutateDocument} from './_lib/store.js';
import {head} from '@vercel/blob';
import {randomUUID,createHash} from 'node:crypto';

const limits=new Map();
function throttled(req){
  const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0];
  const key=createHash('sha256').update(ip).digest('hex'),t=Date.now();
  const recent=(limits.get(key)||[]).filter(y=>t-y<60000);
  recent.push(t);limits.set(key,recent);return recent.length>12;
}
const clean=(x,n)=>String(x||'').trim().slice(0,n);
const groups=['Gia đình','Bạn bè & đồng nghiệp','Người thương'];
const categories=['Du lịch','Hẹn hò','Đời thường','Bạn bè & đồng nghiệp','Gia đình'];
const mimes={'image/jpeg':'image','image/png':'image','image/webp':'image','video/mp4':'video','video/webm':'video'};
const invalid=message=>Object.assign(new Error(message),{statusCode:400});

async function validateMedia(items,kind){
  if(items==null)return [];
  if(!Array.isArray(items))throw invalid('Danh sách ảnh/video không hợp lệ.');
  const max=kind==='wish'?5:10,maxVideos=kind==='wish'?1:2;
  if(items.length>max)throw invalid('Đã vượt quá số lượng ảnh/video cho phép.');
  const unique=new Set();let videos=0,total=0;
  const media=[];
  for(const item of items){
    if(!item||typeof item.url!=='string'||!['image','video'].includes(item.type))
      throw invalid('Tệp đính kèm không hợp lệ.');
    let url;
    try{url=new URL(item.url);}catch{throw invalid('Liên kết tệp không hợp lệ.');}
    if(url.protocol!=='https:'||!/^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/i.test(url.hostname)
      ||url.search||url.hash||!url.pathname.startsWith('/guest-media/')||unique.has(url.href))
      throw invalid('Chỉ nhận tệp được tải lên website.');
    unique.add(url.href);
    let info;
    try{info=await head(url.href);}catch{throw invalid('Tệp đính kèm không tồn tại hoặc không thể xác minh.');}
    const type=String(info.contentType||'').split(';')[0].toLowerCase();
    if(info.url!==url.href||!info.pathname?.startsWith('guest-media/')||mimes[type]!==item.type)
      throw invalid('Định dạng hoặc nguồn tệp không hợp lệ.');
    if(!Number.isSafeInteger(info.size)||info.size<=0||info.size>(item.type==='video'?30:8)*1024*1024)
      throw invalid('Tệp vượt giới hạn dung lượng.');
    total+=info.size;
    if(total>75*1024*1024)throw invalid('Tổng dung lượng bài đăng vượt 75 MB.');
    if(item.type==='video'&&++videos>maxVideos)throw invalid('Bài đăng có quá nhiều video.');
    media.push({type:item.type,url:url.href});
  }
  return media;
}

export default async function handler(req,res){
  if(req.method!=='POST')return result(res,405,{error:'Method not allowed'});
  if(!sameOrigin(req))return result(res,403,{error:'Origin không hợp lệ'});
  if(throttled(req))return result(res,429,{error:'Bạn đang gửi quá nhanh. Hãy thử lại sau.'});
  try{
    const x=await body(req,18000),type=x.type;
    if(x.honey||!['wish','post','comment','like'].includes(type))throw invalid('Nội dung không hợp lệ');
    const author=clean(x.author,40),message=clean(x.message,1200);
    const media=['wish','post'].includes(type)?await validateMedia(x.media_items,type):[];
    if(type==='wish'&&(!author||(!message&&!media.length)))throw invalid('Cần tên và lời chúc hoặc ảnh/video.');
    if(type==='post'&&(!author||!clean(x.title,90)||!media.length))throw invalid('Album cần tên, tiêu đề và ít nhất một ảnh/video.');
    if(type==='comment'&&(!author||!message))throw invalid('Thiếu tên hoặc bình luận.');
    if(type==='wish'&&!groups.includes(x.group))throw invalid('Nhóm lời chúc không hợp lệ.');
    if(type==='post'&&!categories.includes(x.category))throw invalid('Danh mục album không hợp lệ.');
    const images=media.filter(m=>m.type==='image').map(m=>m.url);
    const saved=await mutateDocument(d=>{
      const s=d.state,entry={id:randomUUID(),created_at:new Date().toISOString(),author,message,approved:true};
      if(type==='wish'){
        s.wishes.unshift({...entry,group_type:x.group,media_items:media,image_urls:images,image_url:images[0]||null});
      }else if(type==='post'){
        s.posts.unshift({...entry,title:clean(x.title,90),body:message,category:x.category,media_items:media,image_urls:images,image_url:images[0]||null});
      }else if(type==='comment'){
        const kind=x.kind==='post'?'post':x.kind==='wish'?'wish':null;
        if(!kind)throw invalid('Loại bình luận không hợp lệ.');
        const items=kind==='post'?s.posts:s.wishes;
        if(!items.some(item=>item.id===x.id&&item.approved!==false))
          throw Object.assign(new Error('Bài viết không tồn tại'),{statusCode:404});
        (kind==='post'?s.comments:s.wishComments).push({...entry,...(kind==='post'?{memory_id:x.id}:{wish_id:x.id})});
      }else{
        const kind=x.kind==='post'?'post':x.kind==='wish'?'wish':null;
        if(!kind)throw invalid('Loại không hợp lệ.');
        const items=kind==='post'?s.posts:s.wishes;
        if(!items.some(item=>item.id===x.id&&item.approved!==false))
          throw Object.assign(new Error('Nội dung không tồn tại'),{statusCode:404});
        const key=kind==='post'?'likes':'wishLikes';
        s[key][x.id]=Math.min(100000,(s[key][x.id]||0)+1);
      }
      return d;
    });
    return result(res,200,{ok:true,revision:saved.revision,pending:false,published:true});
  }catch(e){err(res,e);}
}
