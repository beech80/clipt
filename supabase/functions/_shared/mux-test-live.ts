// A narrow pilot: existing test resource only; no provider creation or paid API path.
export function muxTestSnapshot(value: unknown, expectedId: string) {
 const stream=value as {id?:unknown;test?:unknown;status?:unknown;max_continuous_duration?:unknown;playback_ids?:{id?:unknown;policy?:unknown}[]};
 if(!stream||stream.id!==expectedId)throw Error('Mux stream identity could not be verified');
 if(stream.test!==true)throw Error('Mux resource is not a verified test stream; paid streaming remains blocked');
 if(typeof stream.max_continuous_duration!=='number'||!Number.isFinite(stream.max_continuous_duration)
  ||stream.max_continuous_duration>300||stream.max_continuous_duration<1)
  throw Error('Mux test duration could not be verified within the approved limit');
 if(!['active','idle','disabled'].includes(String(stream.status)))throw Error('Mux returned an unsupported live status');
 const playback=Array.isArray(stream.playback_ids)?stream.playback_ids.find(p=>p&&p.policy==='public'&&typeof p.id==='string'&&/^[A-Za-z0-9]+$/.test(p.id)):undefined;
 if(!playback)throw Error('Mux public test playback could not be verified');
 return {is_live:stream.status==='active',provider_status:stream.status as string,
  playback_url:'https://stream.mux.com/'+playback.id+'.m3u8'};
}
