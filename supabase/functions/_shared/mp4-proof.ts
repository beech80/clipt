// Structural verification, not a claim of semantic moderation or full decoding.
// Parse bounded ISO-BMFF boxes; never accept codec names supplied by the client.
export function inspectH264Mp4(bytes: Uint8Array) {
  if(bytes.length<32||bytes.length>50*1024*1024)throw new Error('Invalid video size');
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const text=(at:number)=>String.fromCharCode(...bytes.subarray(at,at+4));
  let count=0;
  type Box={start:number;end:number;payload:number;type:string};
  function boxes(start:number,end:number):Box[]{
    const result:Box[]=[];
    while(start<end){
      if(++count>50000||end-start<8)throw new Error('Invalid box bounds');
      let size=view.getUint32(start),header=8;
      if(size===1){if(end-start<16)throw new Error('Invalid extended box');const wide=view.getBigUint64(start+8);if(wide>BigInt(bytes.length))throw new Error('Oversized box');size=Number(wide);header=16;}
      if(size===0)size=end-start;
      if(size<header||start+size>end)throw new Error('Invalid box size');
      result.push({start,end:start+size,payload:start+header,type:text(start+4)});start+=size;
    }
    return result;
  }
  const root=boxes(0,bytes.length);
  if(!root.some(b=>b.type==='ftyp'&&b.end-b.payload>=8)||!root.some(b=>b.type==='mdat'&&b.end>b.payload))throw new Error('Missing MP4 media');
  const moov=root.find(b=>b.type==='moov');if(!moov)throw new Error('Missing movie metadata');
  for(const trak of boxes(moov.payload,moov.end).filter(b=>b.type==='trak')){
    const mdia=boxes(trak.payload,trak.end).find(b=>b.type==='mdia');if(!mdia)continue;
    const media=boxes(mdia.payload,mdia.end),handler=media.find(b=>b.type==='hdlr');
    if(!handler||handler.end-handler.payload<12||text(handler.payload+8)!=='vide')continue;
    const mdhd=media.find(b=>b.type==='mdhd'),minf=media.find(b=>b.type==='minf');
    if(!mdhd||!minf)throw new Error('Missing video metadata');
    const version=bytes[mdhd.payload];let scale:number,duration:number;
    if(version===0&&mdhd.end-mdhd.payload>=20){scale=view.getUint32(mdhd.payload+12);duration=view.getUint32(mdhd.payload+16);}
    else if(version===1&&mdhd.end-mdhd.payload>=32){scale=view.getUint32(mdhd.payload+20);duration=Number(view.getBigUint64(mdhd.payload+24));}
    else throw new Error('Invalid duration metadata');
    const seconds=duration/scale;if(!Number.isFinite(seconds)||seconds<=0||seconds>86400)throw new Error('Invalid video duration');
    const stbl=boxes(minf.payload,minf.end).find(b=>b.type==='stbl');if(!stbl)throw new Error('Missing sample table');
    const samples=boxes(stbl.payload,stbl.end),stsd=samples.find(b=>b.type==='stsd'),stsz=samples.find(b=>b.type==='stsz');
    if(!stsd||stsd.end-stsd.payload<8||!stsz||stsz.end-stsz.payload<12||view.getUint32(stsz.payload+8)===0)throw new Error('Missing video samples');
    const entries=boxes(stsd.payload+8,stsd.end);
    if(entries.length!==view.getUint32(stsd.payload+4)||entries.length!==1)throw new Error('Unsupported sample descriptions');
    const sample=entries[0];if(!['avc1','avc3'].includes(sample.type)||sample.end-sample.start<86)throw new Error('H.264 video required');
    const width=view.getUint16(sample.start+32),height=view.getUint16(sample.start+34);
    if(!width||!height)throw new Error('Invalid dimensions');
    return {durationSeconds:seconds,width,height,codec:sample.type,
      mediaRanges:root.filter(b=>b.type==='mdat').map(b=>({start:b.payload,end:b.end}))};
  }
  throw new Error('Video track not found');
}
