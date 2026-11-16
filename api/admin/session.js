import {authorized,result} from '../_lib/auth.js';
export default function handler(req,res){if(req.method!=='GET')return result(res,405,{error:'Method not allowed'});const ok=authorized(req);return result(res,ok?200:401,{authenticated:ok,username:ok?'minh':null});}
