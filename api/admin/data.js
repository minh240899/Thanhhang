import {body,result,protect,sameOrigin,err} from '../_lib/auth.js';
import {readDocument,mutateDocument} from '../_lib/store.js';
export default async function handler(req,res){if(!protect(req,res))return;try{
 if(req.method==='GET'){const doc=await readDocument();return result(res,200,doc);}
 if(req.method!=='PUT')return result(res,405,{error:'Method not allowed'});
 if(!sameOrigin(req))return result(res,403,{error:'Origin'});
 const payload=await body(req,1800000),key=payload.key;
 if(key!=='site-state'&&key!=='site-settings')return result(res,400,{error:'Không hợp lệ'});
 const next=await mutateDocument(doc=>{
   if(Number(payload.revision)!==doc.revision){const e=new Error('Dữ liệu đã thay đổi. Hãy tải lại Admin.');e.statusCode=409;throw e;}
   if(key==='site-state'){
    const x=payload.value;if(!x||!['trips','posts','wishes','comments','wishComments'].every(k=>Array.isArray(x[k])))throw Object.assign(new Error('Sai cấu trúc dữ liệu'),{statusCode:400});
    doc.state=x;
   }else{
    const x=payload.value;if(!x||typeof x!=='object'||Object.keys(x).length>32)throw Object.assign(new Error('Cấu hình không hợp lệ'),{statusCode:400});doc.settings=x;
   }return doc;
 },1);
 return result(res,200,{revision:next.revision});
 }catch(e){err(res,e)}}
