import {DEMO_SEED} from './seed.js';
import {head,put,BlobNotFoundError,BlobPreconditionFailedError} from '@vercel/blob';
import {createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';

const PATH='secure/birthday-state-v15.enc';
const empty=()=>({posts:[],trips:[],wishes:[],comments:[],wishComments:[],likes:{},wishLikes:{},liked:[],wishLiked:[]});
const conflict=message=>Object.assign(new Error(message),{statusCode:409,code:'BLOB_CONFLICT'});
const tag=x=>String(x||'').replace(/^W\//,'').replace(/^"|"$/g,'').trim();

function secret(){
 const k=process.env.DATA_ENC_KEY||'';
 if(!/^[0-9a-f]{64}$/i.test(k))throw new Error('Thiếu DATA_ENC_KEY');
 return Buffer.from(k,'hex');
}
function encrypt(object){
 const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',secret(),iv);
 const bytes=Buffer.concat([cipher.update(JSON.stringify(object),'utf8'),cipher.final()]);
 return JSON.stringify({v:1,iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:bytes.toString('base64')});
}
function decrypt(raw){
 const x=JSON.parse(raw),dec=createDecipheriv('aes-256-gcm',secret(),Buffer.from(x.iv,'base64'));
 dec.setAuthTag(Buffer.from(x.tag,'base64'));
 return JSON.parse(Buffer.concat([dec.update(Buffer.from(x.data,'base64')),dec.final()]).toString('utf8'));
}
function initialDocument(){
 return {
  state:{...empty(),posts:structuredClone(DEMO_SEED.posts),trips:structuredClone(DEMO_SEED.trips).map((x,i)=>({...x,published:true,sort_order:i})),wishes:structuredClone(DEMO_SEED.wishes)},
  settings:{},revision:0,etag:null
 };
}
async function currentMetadata(){
 try{return await head(PATH);}
 catch(e){if(e instanceof BlobNotFoundError)return null;throw e;}
}

/**
 * Public Blob GETs may be served from a 60-second CDN cache.
 * In the public store, get(..., {useCache:false}) does not bypass that cache.
 * Resolve the current ETag via the Blob control plane, then read the exact
 * version with a fresh query URL. Reject mismatched versions rather than
 * accidentally overwriting newer wishes, likes, or comments.
 */
export async function readDocument(){
 for(let attempt=0;attempt<4;attempt++){
  const meta=await currentMetadata();
  if(!meta)return initialDocument();
  const url=new URL(meta.url);
  url.searchParams.set('stateVersion',tag(meta.etag));
  url.searchParams.set('nonce',randomBytes(8).toString('hex'));
  const response=await fetch(url,{cache:'no-store'});
  if(!response.ok)throw Object.assign(new Error('Không đọc được dữ liệu Blob (HTTP '+response.status+').'),{statusCode:503});
  const servedTag=response.headers.get('etag');
  if(servedTag&&tag(servedTag)!==tag(meta.etag))continue;
  const doc=decrypt(await response.text());
  return {state:{...empty(),...doc.state},settings:doc.settings||{},revision:Number(doc.revision||0),etag:meta.etag};
 }
 throw conflict('Dữ liệu đang được cập nhật. Vui lòng thử lại.');
}

export async function saveDocument(previous,next){
 const data={state:next.state,settings:next.settings,revision:previous.revision+1,updatedAt:new Date().toISOString()};
 const options={access:'public',allowOverwrite:true,addRandomSuffix:false,contentType:'application/octet-stream',cacheControlMaxAge:60};
 if(previous.etag)options.ifMatch=previous.etag;
 try{
  await put(PATH,encrypt(data),options);
 }catch(e){
  if(e instanceof BlobPreconditionFailedError || /precondition.failed|etag.mismatch/i.test(String(e?.message||''))){
   throw conflict('Dữ liệu đã thay đổi trên máy chủ. Vui lòng tải lại trang và thử lại.');
  }
  throw e;
 }
 return data.revision;
}
export async function mutateDocument(transform,max=5){
 for(let i=0;i<max;i++){
  const prev=await readDocument();
  const next=transform(structuredClone(prev));
  try{
   const revision=await saveDocument(prev,next);
   return {state:next.state,settings:next.settings,revision};
  }catch(e){
   if(e?.code==='BLOB_CONFLICT'&&i+1<max)continue;
   throw e;
  }
 }
 throw conflict('Có nhiều thay đổi đồng thời. Vui lòng thử lại.');
}
export function publicView(s){
 return {...empty(),trips:s.trips.filter(x=>x.published!==false),posts:s.posts.filter(x=>x.approved!==false),wishes:s.wishes.filter(x=>x.approved!==false),comments:s.comments.filter(x=>x.approved!==false),wishComments:s.wishComments.filter(x=>x.approved!==false),likes:s.likes||{},wishLikes:s.wishLikes||{}};
}
