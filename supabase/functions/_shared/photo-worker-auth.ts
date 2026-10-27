export function photoWorkerAuthorized(provided:unknown,secret:unknown):boolean {
 if(typeof secret!=='string'||secret.length<32||secret.length>256||typeof provided!=='string'||provided.length!==secret.length)return false;
 let difference=0;for(let index=0;index<secret.length;index++)difference|=secret.charCodeAt(index)^provided.charCodeAt(index);
 return difference===0;
}
