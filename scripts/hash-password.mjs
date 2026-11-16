// Local only. Never commit password text, hash output is configured through Vercel Environment Variables.
import {pbkdf2Sync,randomBytes} from 'node:crypto';
const password=process.env.ADMIN_NEW_PASSWORD;
if(!password||password.length<12){console.error('Set ADMIN_NEW_PASSWORD to a new password (>=12 chars) in your private shell.');process.exit(1)}
const salt=randomBytes(16);
console.log('ADMIN_SALT='+salt.toString('hex'));
console.log('ADMIN_PASSWORD_HASH='+pbkdf2Sync(password,salt,240000,32,'sha256').toString('hex'));
