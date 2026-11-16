// Permanent background music uploaded directly from an authenticated Admin browser.
// The upload callback is verified internally by @vercel/blob/client; only Admin may mint a token.
import {handleUpload} from '@vercel/blob/client';
import {body,protect,sameOrigin,result,err} from '../_lib/auth.js';

const mimeByExtension={
  mp3:['audio/mpeg','audio/mp3'],
  m4a:['audio/mp4','audio/x-m4a'],
  ogg:['audio/ogg','application/ogg'],
  wav:['audio/wav','audio/x-wav','audio/wave']
};
const limit=20*1024*1024;

export default async function handler(req,res){
  if(req.method!=='POST')return result(res,405,{error:'Method not allowed'});
  try{
    const payload=req.body&&typeof req.body==='object'?req.body:await body(req,16000);
    if(!['blob.generate-client-token','blob.upload-completed'].includes(payload?.type))
      return result(res,400,{error:'Yêu cầu tải nhạc không hợp lệ.'});
    if(payload.type==='blob.generate-client-token'){
      if(!protect(req,res))return;
      if(!sameOrigin(req))return result(res,403,{error:'Origin không hợp lệ.'});
    }
    const response=await handleUpload({
      request:req,
      body:payload,
      onBeforeGenerateToken:async pathname=>{
        const match=/^music\/[a-z0-9-]{20,72}\.(mp3|m4a|ogg|wav)$/i.exec(pathname);
        if(!match)throw Object.assign(new Error('Tên tệp nhạc không hợp lệ.'),{statusCode:400});
        return {
          allowedContentTypes:mimeByExtension[match[1].toLowerCase()],
          maximumSizeInBytes:limit,
          addRandomSuffix:true,
          validUntil:Date.now()+10*60*1000
        };
      },
      // Admin saves the returned URL in /api/admin/data after upload succeeds.
      onUploadCompleted:async()=>{}
    });
    return result(res,200,response);
  }catch(error){err(res,error);}
}
