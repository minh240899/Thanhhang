// Public guest media: short-lived, scoped tokens for direct browser-to-Blob uploads.
import {handleUpload} from '@vercel/blob/client';
import {body,result,sameOrigin,err} from './_lib/auth.js';
import {createHash} from 'node:crypto';

const formats={jpg:'image/jpeg',png:'image/png',webp:'image/webp',mp4:'video/mp4',webm:'video/webm'};
const limits=new Map();
function limited(req){
  const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0];
  const key=createHash('sha256').update(ip).digest('hex'),t=Date.now();
  const recent=(limits.get(key)||[]).filter(at=>t-at<60000);
  recent.push(t);limits.set(key,recent);
  return recent.length>25;
}
export default async function handler(req,res){
  if(req.method!=='POST')return result(res,405,{error:'Method not allowed'});
  try{
    const payload=req.body&&typeof req.body==='object'?req.body:await body(req,16000);
    if(!['blob.generate-client-token','blob.upload-completed'].includes(payload?.type))
      return result(res,400,{error:'Yêu cầu upload không hợp lệ.'});
    if(payload.type==='blob.generate-client-token'){
      if(!sameOrigin(req))return result(res,403,{error:'Origin không hợp lệ.'});
      if(limited(req))return result(res,429,{error:'Quá nhiều lượt tải tệp. Hãy thử lại sau.'});
    }
    const response=await handleUpload({
      body:payload,request:req,
      onBeforeGenerateToken:async pathname=>{
        const match=/^guest-media\/[a-f0-9-]{20,60}\.(jpg|png|webp|mp4|webm)$/i.exec(pathname);
        if(!match)throw Object.assign(new Error('Đường dẫn tệp không hợp lệ.'),{statusCode:400});
        const ext=match[1].toLowerCase(),video=ext==='mp4'||ext==='webm';
        return {
          allowedContentTypes:[formats[ext]],
          maximumSizeInBytes:(video?30:8)*1024*1024,
          addRandomSuffix:true,
          validUntil:Date.now()+10*60*1000
        };
      },
      // Saving the public wish/album occurs in /api/guest after its files have uploaded.
      onUploadCompleted:async()=>{}
    });
    return result(res,200,response);
  }catch(e){err(res,e);}
}
