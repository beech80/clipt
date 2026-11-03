import {forwardRef,useEffect,useId,useImperativeHandle,useRef,useState} from 'react';
import {Textarea} from '@/components/ui/textarea';
import {supabase} from '@/lib/supabase';
import {mentionAtCaret,insertMention} from '@/lib/mention-input';
type Props=React.ComponentProps<typeof Textarea>;
export const MentionTextarea=forwardRef<HTMLTextAreaElement,Props>(function MentionTextarea(props,ref) {
 const input=useRef<HTMLTextAreaElement>(null);useImperativeHandle(ref,()=>input.current!);
 const id=useId(),text=String(props.value??'');
 const [caret,setCaret]=useState(0),[dismissed,setDismissed]=useState<string|null>(null);
 const token=mentionAtCaret(text,caret),key=token?token.start+':'+token.term:null;
 const [result,setResult]=useState<{key:string|null;rows:{id:string;username:string|null;display_name:string|null}[];error:boolean;loading:boolean}>({key:null,rows:[],error:false,loading:false});
 const [active,setActive]=useState(0);
 const open=Boolean(token&&key!==dismissed&&!props.disabled);
 useEffect(()=>{
  if(!open||!token)return;
  const controller=new AbortController();setActive(0);setResult({key,rows:[],error:false,loading:true});
  const timer=setTimeout(()=>{void(async()=>{
   const term=token.term.replace(/[%_\\]/g,'\\$&');
   const {data,error}=await supabase.from('profiles').select('id,username,display_name').ilike('username',term+'%').order('username').limit(8).abortSignal(controller.signal).retry(false);
   if(!controller.signal.aborted)setResult({key,rows:data??[],error:Boolean(error),loading:false});
  })().catch(()=>{if(!controller.signal.aborted)setResult({key,rows:[],error:true,loading:false});});},250);
  return()=>{clearTimeout(timer);controller.abort();};
 },[open,key]);
 const rows=result.key===key?result.rows:[];
 function select(username:string|null) {
  if(!token||!username||!input.current)return;
  const next=insertMention(text,token,username),element=input.current;
  if(props.maxLength&&next.value.length>props.maxLength)return;
  const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')?.set;
  setter?.call(element,next.value);
  // Notify controlled React fields through the same onChange contract.
  props.onChange?.({target:element,currentTarget:element} as React.ChangeEvent<HTMLTextAreaElement>);
  setDismissed(key);requestAnimationFrame(()=>{element.focus();element.setSelectionRange(next.caret,next.caret);setCaret(next.caret);});
 }
 return <div className="min-w-0 flex-1 space-y-2">
  <Textarea {...props} ref={input} aria-autocomplete="list" aria-controls={open?id:undefined}
   aria-activedescendant={open&&rows[active]?id+'-'+active:undefined}
   onChange={event=>{setCaret(event.currentTarget.selectionStart);setDismissed(null);props.onChange?.(event);}}
   onSelect={event=>{setCaret(event.currentTarget.selectionStart);props.onSelect?.(event);}}
   onKeyDown={event=>{
    if(open&&!event.nativeEvent.isComposing){
     if(event.key==='Escape'){event.preventDefault();setDismissed(key);return;}
     if(rows.length&&(event.key==='ArrowDown'||event.key==='ArrowUp')){event.preventDefault();setActive(value=>(value+(event.key==='ArrowDown'?1:-1)+rows.length)%rows.length);return;}
     if(rows[active]&&event.key==='Enter'){event.preventDefault();select(rows[active].username);return;}
    }props.onKeyDown?.(event);
   }}/>
  {open&&<div className="rounded-lg border border-purple-400/50 bg-[#100b20] p-2 text-white">
   {result.loading||result.key!==key?<p role="status">Finding people…</p>:result.error?<p role="status">People could not be loaded. You can keep writing.</p>:!rows.length?<p role="status">No matching people.</p>:null}
   <div id={id} role="listbox" aria-label="People to tag" className="max-h-48 overflow-y-auto overscroll-contain">
    {rows.map((person,index)=><button key={person.id} id={id+'-'+index} type="button" role="option" aria-selected={active===index}
     className={'flex min-h-11 w-full items-center rounded px-3 text-left '+(active===index?'bg-purple-800':'')}
     onPointerDown={event=>event.preventDefault()} onClick={()=>select(person.username)}>@{person.username}{person.display_name?' · '+person.display_name:''}</button>)}
   </div>
  </div>}
 </div>;
});
