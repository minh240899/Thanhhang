import {put} from '@vercel/blob';import {randomUUID} from 'node:crypto';
import {protect,sameOrigin,result,err} from '../_lib/auth.js';
const types={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','video/mp4':'mp4','video/webm':'webm','audio/mpeg':'mp3'};
export default async function handler(req,res){if(!protect(req,res))return;if(req.method!=='POST')return result(res,405,{error:'Method not allowed'});if(!sameOrigin(req))return result(res,403,{error:'Origin'});try{
 const mime=String(req.headers['content-type']||'').split(';')[0];const ext=types[mime];if(!ext)return result(res,415,{error:'Định dạng tệp không được hỗ trợ.'});
 let chunks=[],size=0;for await(const b of req){size+=b.length;if(size>3500000)return result(res,413,{error:'Giới hạn 3,5 MB/tệp trong bản này. Video lớn hơn cần upload trực tiếp có cấp quyền.'});chunks.push(b);}
 if(size<100)return result(res,400,{error:'Tệp trống hoặc lỗi'});
 const obj=await put(`media/${Date.now()}-${randomUUID()}.${ext}`,Buffer.concat(chunks),{access:'public',contentType:mime,addRandomSuffix:false});
 return result(res,200,{url:obj.url,mime,size});
 }catch(e){err(res,e)}}
