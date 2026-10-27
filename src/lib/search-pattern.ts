/** Literal ILIKE substring: users cannot turn %/_ into match-all patterns. */
export function searchPattern(value:string){
  return `%${value.replace(/[\\%_]/g,character=>`\\${character}`)}%`;
}
