export function mentionAtCaret(text:string,caret:number) {
 const before=text.slice(0,caret),match=/(?:^|[\s(])@([\p{L}\p{N}_.-]{0,50})$/u.exec(before);
 if(!match)return null;
 const start=caret-match[1].length-1;
 const rest=/^[\p{L}\p{N}_.-]*/u.exec(text.slice(caret))?.[0] ?? '';
 return {start,end:caret+rest.length,term:match[1]};
}
export function insertMention(text:string,token:{start:number;end:number},username:string) {
 const value=text.slice(0,token.start)+'@'+username+' '+text.slice(token.end);
 return {value,caret:token.start+username.length+2};
}
