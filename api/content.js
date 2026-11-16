import {result,err} from './_lib/auth.js';import {readDocument,publicView} from './_lib/store.js';
export default async function handler(req,res){if(req.method!=='GET')return result(res,405,{error:'Method not allowed'});try{const doc=await readDocument();return result(res,200,{state:doc.revision?publicView(doc.state):null,settings:doc.settings,revision:doc.revision});}catch(e){err(res,e)}}
