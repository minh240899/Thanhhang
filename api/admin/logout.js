import {clearCookie,result,sameOrigin} from '../_lib/auth.js';
export default function handler(req,res){if(req.method!=='POST')return result(res,405,{error:'Method not allowed'});if(!sameOrigin(req))return result(res,403,{error:'Origin'});clearCookie(res);return result(res,200,{ok:true});}
