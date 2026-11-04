/** Restrict shared-link sign-in returns to ordinary post pages, never external URLs. */
export function loginDestination(search:string) {
 const next=new URLSearchParams(search).get('next');
 return next && new RegExp('^/post/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?:#comments)?$','i').test(next) ? next : '/clipts';
}
