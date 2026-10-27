import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {z} from 'zod';
import {useAuth} from '@/contexts/AuthContext';
import {supabase} from '@/lib/supabase';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import {BarChart3} from 'lucide-react';

const count=z.number().int().nonnegative();
const metricsSchema=z.object({
  days:z.number().int(),from:z.string().datetime({offset:true}),to:z.string().datetime({offset:true}),
  views:count,likes:count,trophies:count,followers:count,
  daily:z.array(z.object({day:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(day=>Number.isFinite(Date.parse(day))),views:count,likes:count,trophies:count})).max(367),
  top_clipts:z.array(z.object({id:z.string().uuid(),caption:z.string().nullable(),views:count,likes:count,trophies:count})).max(10),
});

export default function CreatorDashboard() {
  const {user}=useAuth();
  const [days,setDays]=useState(7);
  const [chartMetric,setChartMetric]=useState<'views'|'likes'|'trophies'>('views');
  const query=useQuery({
    queryKey:['creator-dashboard',user?.id,days],enabled:Boolean(user),retry:false,
    queryFn:async()=>{
      const {data,error}=await supabase.rpc('get_creator_dashboard',{p_days:days});
      if(error) throw error;
      return metricsSchema.parse(data);
    },
  });
  const data=query.data;
  const daily=(data?.daily ?? []).slice().sort((a,b)=>a.day.localeCompare(b.day));
  const chartMax=Math.max(1,...daily.map(day=>day[chartMetric]));
  const start=daily.length ? Date.parse(daily[0].day) : 0;
  const span=daily.length ? Math.max(86400000,Date.parse(daily[daily.length-1].day)-start) : 1;
  const chartPoints=daily.map(day=>({
    x:24+(Date.parse(day.day)-start)/span*552,
    y:156-day[chartMetric]/chartMax*132,
    day:day.day,value:day[chartMetric],
  }));
  return <main className="clipt-creator-dashboard container max-w-6xl px-4 py-6 space-y-6">
    <header className="gaming-card p-5"><h1 className="text-2xl font-bold flex items-center gap-3"><BarChart3 className="text-purple-300" aria-hidden="true"/>Creator Dashboard</h1><p className="mt-2 text-sm text-purple-200">Your recorded activity. No estimated revenue or invented growth.</p></header>
    <div role="group" aria-label="Analytics period" className="flex flex-wrap gap-2">
      {[[7,'7D'],[30,'30D'],[90,'90D'],[365,'1Y']].map(([value,label])=><Button
        key={value} variant={days===value?'default':'outline'} aria-pressed={days===value}
        onClick={()=>setDays(Number(value))}>{label}</Button>)}
    </div>
    {query.isPending && <p role="status">Loading recorded analytics…</p>}
    {query.isError && <Card className="p-6 space-y-3"><p role="alert">Unable to load analytics. Your data has not been reset.</p>
      <Button onClick={()=>void query.refetch()}>Retry</Button></Card>}
    {!query.isError && data && <>
      <p className="text-sm text-muted-foreground">{new Date(data.from).toLocaleDateString(undefined,{timeZone:'UTC'})}–{new Date(data.to).toLocaleDateString(undefined,{timeZone:'UTC'})} UTC · Rolling {data.days}-day window</p>
      <dl className="clipt-dashboard-metrics grid grid-cols-2 md:grid-cols-4 gap-3">
        {([['Recorded views',data.views],['Current likes',data.likes],['Current Trophies',data.trophies],['New followers still following',data.followers]] as const).map(([label,value])=><Card key={label} className="p-4">
          <dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-2 text-2xl font-bold tabular-nums">{value.toLocaleString()}</dd>
        </Card>)}
      </dl>
      <p className="text-sm text-muted-foreground">Counts reflect stored records created in this window for your published, non-hidden Clipts. Removed likes, Trophies and follows are not retained. Recorded views are not a complete or independently verified audience count. Revenue and growth estimates are not shown.</p>
      <section aria-labelledby="creator-chart-title" className="rounded-xl border border-purple-500/40 bg-gradient-to-br from-purple-950/40 to-slate-950 p-4 space-y-3">
        <h2 id="creator-chart-title" className="text-xl font-semibold">Activity trend</h2>
        <div role="group" aria-label="Chart metric" className="flex flex-wrap gap-2">
          {(['views','likes','trophies'] as const).map(metric=><Button key={metric} size="sm" variant={chartMetric===metric?'default':'outline'} aria-pressed={chartMetric===metric} onClick={()=>setChartMetric(metric)}>{metric==='views'?'Recorded views':metric==='likes'?'Likes':'Trophies'}</Button>)}
        </div>
        {daily.length===0 ? <p className="text-sm text-muted-foreground">No recorded activity to chart in this period.</p> : <>
          <svg viewBox="0 0 600 180" className="w-full h-auto" role="img" aria-label={`Recorded daily ${chartMetric}. Exact values are in the daily activity table below.`}>
            <path d="M24 24V156H576" fill="none" stroke="currentColor" className="text-slate-500" />
            {chartPoints.length>1 && <polyline points={chartPoints.map(point=>`${point.x},${point.y}`).join(' ')} fill="none" stroke="#c084fc" strokeWidth="3" />}
            {chartPoints.map(point=><circle key={point.day} cx={point.x} cy={point.y} r="4" fill="#e9d5ff"><title>{point.day}: {point.value} {chartMetric}</title></circle>)}
          </svg>
          <p className="text-xs text-muted-foreground">{daily[0].day}–{daily[daily.length-1].day} UTC · Scale 0–{chartMax.toLocaleString()}. Points show stored daily counts, not cumulative totals. Connecting lines do not represent measured activity between points.</p>
        </>}
      </section>
      <section className="space-y-3" aria-labelledby="creator-top-clips">
        <h2 id="creator-top-clips" className="text-xl font-semibold">Top Clipts</h2>
        <p className="text-sm text-muted-foreground">Up to 10 Clipts with recorded activity, ordered by Trophies, then recorded views. Gifts and token spending do not affect this order.</p>
        {data.top_clipts.length===0 ? <Card className="p-6"><p>No recorded Clipt activity in this period.</p><Button asChild className="mt-3"><Link to="/new-post">Create a Clipt</Link></Button></Card> :
          <ol className="grid gap-3 md:grid-cols-2">{data.top_clipts.map((clip,index)=><li key={clip.id}><Card className="p-4 space-y-2">
            <Link to={`/post/${clip.id}`} className="font-semibold underline break-words">{index+1}. {clip.caption || 'Untitled Clipt'}</Link>
            <p className="text-sm text-muted-foreground">{clip.trophies} Trophies · {clip.likes} likes · {clip.views} recorded views</p>
          </Card></li>)}</ol>}
      </section>
      <section className="space-y-3" aria-labelledby="creator-daily">
        <h2 id="creator-daily" className="text-xl font-semibold">Recorded daily activity</h2>
        <p className="text-sm text-muted-foreground">UTC dates with recorded events only. Missing dates have no stored events.</p>
        {data.daily.length===0 ? <p>No daily activity recorded.</p> : <div className="overflow-x-auto"><table className="w-full text-sm">
          <caption className="sr-only">Daily recorded views, likes and Trophies</caption>
          <thead><tr>{['Date (UTC)','Views','Likes','Trophies'].map(label=><th key={label} scope="col" className="text-left p-2 border-b">{label}</th>)}</tr></thead>
          <tbody>{data.daily.map(day=><tr key={day.day}><th scope="row" className="text-left p-2 font-normal whitespace-nowrap">{day.day}</th><td className="p-2">{day.views}</td><td className="p-2">{day.likes}</td><td className="p-2">{day.trophies}</td></tr>)}</tbody>
        </table></div>}
      </section>
    </>}
  </main>;
}
