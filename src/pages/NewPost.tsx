import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Upload, Globe, Users, FileEdit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BackButton } from '@/components/ui/back-button';
import { supabase } from '@/lib/supabase';
import { clipCaption, formatClipSize, MAX_CLIP_BYTES, videoPreviewReady } from '@/lib/clip-upload';
import { prepareClipFile } from '@/lib/prepare-clip';
import { preparePhoto, photoUploadError } from '@/lib/photo-upload';
import {GameCatalogLookup} from '@/components/GameCatalogLookup';
import {completeGameCatalog, gameLabel} from '@/lib/game-catalog';
import { useAuth } from '@/contexts/AuthContext';
import { usePrivateMediaUrl } from '@/hooks/usePrivateMedia';
import { clipUploadError } from '@/lib/clip-upload';
import {checkClipReward,clipRewardMessage} from '@/lib/clip-reward';
import {toast} from 'sonner';
import { communityErrorMessage, communityTextWarning } from '@/lib/community-text';
import {beginPublishing,publishingBlocked,publishingUncertain,updatePublishing,subscribePublishing,publishingSnapshot} from '@/lib/publishing-status';

export default function NewPost() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  useSyncExternalStore(subscribePublishing,publishingSnapshot,()=>null);
  const [params] = useSearchParams();
  const draftId = params.get('draft');
  const [destination, setDestination] = useState<'clipts' | 'squad' | 'draft'>('clipts');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [gameId, setGameId] = useState('');
  const [gameSearch, setGameSearch] = useState('');
  const [stage, setStage] = useState<'idle' | 'checking' | 'converting' | 'uploading' | 'publishing' | 'reward'>('idle');
  const [playable, setPlayable] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<number | null>(null);
  const [converted, setConverted] = useState(false);
  const prepareAbort = useRef<AbortController | null>(null);
  const [error, setError] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const [kind, setKind] = useState<'video' | 'photo'>('video');
  const [captionError, setCaptionError] = useState('');
  const captionInput = useRef<HTMLTextAreaElement>(null);
  const previewVideo = useRef<HTMLVideoElement>(null);
  const busy = useRef(false);
  const selection = useRef(0);
  const input = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const initializedDraft = useRef<string | null>(null);
  useEffect(() => {
    prepareAbort.current?.abort();
    selection.current += 1;
    initializedDraft.current = null;
    setConversionProgress(null); setConverted(false); setStage('idle');
    setFile(null); setCaption(''); setHashtags(''); setGameId(''); setGameSearch('');
    setDestination('clipts'); setKind('video'); setPlayable(false); setError(''); setCaptionError(''); setUncertain(false);
    return () => { selection.current += 1; prepareAbort.current?.abort(); };
  }, [draftId, user?.id]);
  const draft = useQuery({
    queryKey: ['clipt-draft', user?.id, draftId], enabled: Boolean(user && draftId), retry: false,
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase.from('posts').select('id,content,video_url,image_url,game_id')
        .eq('id', draftId!).eq('user_id', user!.id).eq('is_published', false).abortSignal(signal).retry(false).maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Draft not found or not accessible.');
      return data;
    },
  });
  const savedReference = draft.data?.video_url || draft.data?.image_url;
  const savedMedia = usePrivateMediaUrl(savedReference);
  useEffect(() => {
    if (!draft.data || initializedDraft.current === draft.data.id) return;
    initializedDraft.current = draft.data.id;
    setCaption(draft.data.content ?? ''); setGameId(draft.data.game_id ?? '');
    setKind(draft.data.video_url ? 'video' : 'photo');
    setDestination('clipts'); setPlayable(false);
  }, [draft.data]);
  const postingCapabilities = useQuery({
    queryKey: ['clipt-posting-capabilities', user?.id], enabled: Boolean(user), retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('clipt_posting_capabilities').retry(false);
      if (error) throw error;
      return data;
    },
  });
  const squadReady = postingCapabilities.data === true;
  const games = useQuery({
    queryKey: ['create-clip-games', gameSearch],
    retry: false,
    queryFn: ({ signal }) => completeGameCatalog(gameSearch, signal),
  });
  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const previewSource = preview || savedMedia.src;
  useEffect(() => {
    const player = previewVideo.current;
    return () => { player?.pause(); };
  }, [previewSource]);
  async function chooseFile(candidate?: File) {
    if (busy.current || !candidate) return;
    prepareAbort.current?.abort();
    const controller = new AbortController(); prepareAbort.current = controller;
    const revision = ++selection.current;
    setConversionProgress(null); setConverted(false);
    setError(''); setStage('checking');
    // A rejected replacement must not leave the previous video ready to publish.
    setFile(null); setPlayable(false);
    try {
      const prepared = kind === 'photo' ? await preparePhoto(candidate) : await prepareClipFile(candidate, {
        signal: controller.signal, onProgress: progress => {
          if (revision === selection.current) { setStage('converting'); setConversionProgress(Math.min(95, Math.floor(progress * 20) * 5)); }
        },
      });
      if (revision === selection.current) { setPlayable(false); setFile(prepared); setConverted(kind === 'video' && prepared !== candidate); }
    } catch (cause) {
      if (revision === selection.current) setError(cause instanceof Error ? cause.message : 'This media could not be checked.');
    } finally { if (revision === selection.current) { prepareAbort.current = null; setStage('idle'); setConversionProgress(null); } }
  }
  function requireCaption() {
    setError(''); setCaptionError('Add a caption before posting.');
    captionInput.current?.scrollIntoView({ block: 'center', behavior: 'auto' });
    captionInput.current?.focus();
  }
  function previewReady(video: HTMLVideoElement) {
    // Metadata alone does not prove a frame can decode. Support the events
    // reached after an explicit iPhone play gesture as well as preloading.
    if (video !== previewVideo.current || !videoPreviewReady(video)) return;
    setPlayable(true);
    setError(current => current === 'The preview could not start. Tap Play in the video or choose another copy.' ? '' : current);
  }
  function playPreview() {
    setError('');
    void previewVideo.current?.play().catch(() => setError('The preview could not start. Tap Play in the video or choose another copy.'));
  }
  async function publish(event: React.FormEvent) {
    event.preventDefault();
    if (busy.current || uncertain || publishingBlocked(user?.id)) return;
    if ((!file && !savedReference) || !playable) { setError('Choose supported media and wait for its preview to load.'); return; }
    if (destination !== 'draft' && !caption.trim()) { requireCaption(); return; }
    if (destination === 'squad' && !squadReady) { setError('Squad privacy is not configured in this backend. Nothing was posted.'); return; }
    const warning = communityTextWarning(`${caption} ${hashtags}`);
    if (warning) { setError(warning); return; }
    busy.current = true; setError('');
    const submittingUserId=user?.id;
    const publishingId = destination !== 'draft' && user ? beginPublishing(user.id,destination) : null;
    const reportStage = (next:'uploading'|'publishing'|'reward') => {setStage(next);if(publishingId)updatePublishing(publishingId,{stage:next});};
    let uploadedPath: string | null = null;
    try {
      const content = destination === 'draft' && !caption.trim() && !hashtags.trim() ? '' : clipCaption(caption, hashtags);
      if(kind==='photo'&&destination==='clipts'&&content.length>500)throw new Error('Public photo captions and hashtags together must be 500 characters or fewer for safety review.');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Sign in to publish a Clipt.');
      if(user.id!==submittingUserId)throw new Error('Your signed-in account changed. Check the current account before posting again.');
      // Continue the in-memory job while Home displays its real upload stage.
      // Drafts stay in their private workflow; no draft is injected into Home.
      if (publishingId) { previewVideo.current?.pause(); navigate('/clipts'); }
      let mediaUrl = savedReference;
      if (file) {
        reportStage('uploading');
        const path = `${user.id}/${crypto.randomUUID()}.${kind === 'photo' ? 'jpg' : file.type === 'video/webm' ? 'webm' : 'mp4'}`;
        const { error: uploadError } = await supabase.storage.from('media').upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw new Error(kind === 'photo' ? photoUploadError(uploadError) : clipUploadError(uploadError));
        uploadedPath = path;
        // Persist only a canonical locator. The private bucket is never made public;
        // all rendering resolves this through caller-scoped signed media access.
        mediaUrl = supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
      }
      if (!mediaUrl) throw new Error('The media reference is missing. Nothing was posted.');
      reportStage('publishing');
      const values = {
        user_id: user.id, content, video_url: kind === 'video' ? mediaUrl : null,
        image_url: kind === 'photo' ? mediaUrl : null, post_type: destination === 'squad' ? 'squad' : 'clipt',
        is_published: destination !== 'draft', is_premium: false, is_subscriber_only: false,
        game_id: gameId || null,
      };
      const request = draftId ? supabase.from('posts').update(values).eq('id', draftId).eq('user_id', user.id).eq('is_published', false) : supabase.from('posts').insert(values);
      const { data: post, error: postError, status } = await request.select('id').retry(false).single();
      if (postError || !post?.id) {
        if (!status || status >= 500 || !postError) {
          // A lost response does not prove the insert failed. Keep its media;
          // deleting it could break a post which was actually committed.
          uploadedPath = null;
          setUncertain(true);
          if(publishingId)updatePublishing(publishingId,{uncertain:true});
          throw new Error('Publishing status is uncertain. The upload was preserved. Check your profile before trying again.');
        }
        throw new Error(communityErrorMessage(postError, 'Publishing was rejected. No new draft was saved. Return to posting to select your media again.'));
      }
      uploadedPath = null;
      void queryClient.invalidateQueries({ queryKey: ['clipt-drafts'] });
      if (destination === 'draft') { toast('Draft saved privately. Only you can open it.'); navigate('/drafts'); return; }
      // Publication is confirmed now. Rewards must never delay feed visibility.
      void queryClient.invalidateQueries({ queryKey: ['clipts-feed'] });
      if(publishingId)updatePublishing(publishingId,{stage:'complete',postId:post.id});
      else navigate('/clipts');
      if(kind === 'video' && destination === 'clipts' && (file?.type==='video/mp4' || (!file && mediaUrl.endsWith('.mp4')))){
        void checkClipReward(post.id).then(result => toast(clipRewardMessage(result)))
          .catch(() => toast('Clipt published. Token reward is not confirmed; you can retry from Token Store.'))
          .finally(() => {
            void queryClient.invalidateQueries({queryKey:['token-wallet']});
            void queryClient.invalidateQueries({queryKey:['token-ledger']});
            void queryClient.invalidateQueries({queryKey:['boost-economy']});
          });
      }
    } catch (cause) {
      let message = cause instanceof Error ? cause.message : 'The Clipt could not be published.';
      if (uploadedPath) {
        const { error: cleanupError } = await supabase.storage.from('media').remove([uploadedPath]);
        if (cleanupError) message += ' The unused upload could not be removed; contact support for cleanup.';
      }
      setError(message);
      if(publishingId)updatePublishing(publishingId,{stage:'error',message});
    } finally { busy.current = false; setStage('idle'); }
  }
  const preparing = stage === 'checking' || stage === 'converting';
  const submitting = stage === 'uploading' || stage === 'publishing' || stage === 'reward' || publishingBlocked(user?.id);
  return <main className="clipt-create clipt-auth mx-auto min-h-screen max-w-6xl p-4 pb-44 space-y-5">
    <header className="flex items-center gap-3"><BackButton /><h1 className="flex items-center gap-2 text-2xl font-bold"><Camera aria-hidden="true" />Create Clipt</h1></header>
    <nav aria-label="Create content" className="flex flex-wrap gap-2">
      {(['video', 'photo'] as const).map(value => <Button key={value} type="button" variant={kind === value ? 'default' : 'outline'} aria-pressed={kind === value}
        disabled={Boolean(draftId) || submitting || preparing} onClick={() => { selection.current += 1; setKind(value); setFile(null); setPlayable(false); setError(''); }}>{value === 'video' ? 'Video' : 'Photo'}</Button>)}
      <Button asChild variant="outline"><Link to="/stream-setup">Live stream</Link></Button>
    </nav>
    <form onSubmit={publish} className="clipt-create-layout">
      <section className="clipt-create-media space-y-5" aria-label="Media preview and upload">
      <Button type="button" variant="outline" className="w-full min-h-24" disabled={submitting || preparing} onClick={() => input.current?.click()}>
        <Upload className="mr-2" aria-hidden="true" />{file ? `Replace ${kind}` : `Choose ${kind}`}
      </Button>
      <input ref={input} type="file" aria-describedby="clip-media-help" aria-label={kind === 'photo' ? 'Clipt photo' : 'Clipt video'} accept={kind === 'photo' ? 'image/jpeg,image/png,image/webp' : 'video/mp4,video/quicktime,video/webm'} className="sr-only" disabled={submitting || preparing}
        onChange={event => { void chooseFile(event.target.files?.[0]); event.target.value = ''; }} />
      {kind === 'photo' ? <><Button type="button" variant="outline" disabled={submitting || preparing} onClick={() => cameraInput.current?.click()}><Camera className="mr-2" aria-hidden="true" />Take photo</Button>
        <input ref={cameraInput} type="file" aria-label="Take a Clipt photo" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" disabled={submitting || preparing} onChange={event => { void chooseFile(event.target.files?.[0]); event.target.value = ''; }} />
        <p id="clip-media-help" className="text-sm text-slate-300">One JPEG, PNG or WebP photo, up to 5 MB. Photos are processed to remove embedded metadata. Camera capture depends on your device/browser; otherwise choose a photo. HEIC, SVG and animated files are not supported.</p></> : <p id="clip-media-help" className="text-sm text-slate-300">One MP4, MOV or WebM video, up to {formatClipSize(MAX_CLIP_BYTES)}. HEVC/MOV videos are converted on supported devices before upload. Your original stays unchanged.</p>}
      {stage === 'converting' && <div className="space-y-3"><p role="status">Converting video… {conversionProgress ?? 0}% · Keep this page open.</p><progress className="w-full" aria-label="Video conversion progress" max={100} value={conversionProgress ?? 0} /><Button type="button" variant="outline" className="min-h-11" onClick={() => { selection.current += 1; prepareAbort.current?.abort(); prepareAbort.current = null; setStage('idle'); setConversionProgress(null); setError('Conversion cancelled. Your caption has been kept.'); }}>Cancel conversion</Button></div>}
      {converted && file && <p className="text-sm text-violet-200">Converted to a compatible MP4 on your device. Your original is unchanged.</p>}
      {file && kind === 'video' && <p role="status" className="break-all text-sm text-violet-200">Selected video: {file.name} · {formatClipSize(file.size)}</p>}
      {draftId && draft.isPending && <p role="status">Opening your draft…</p>}
      {draftId && draft.isError && <p role="alert">This draft could not be opened. <Button type="button" onClick={() => void draft.refetch()}>Retry draft</Button></p>}
      {savedMedia.error && !file && <p role="alert">Draft media access failed. <Button type="button" onClick={() => void savedMedia.retry()}>Retry media</Button></p>}
      {(preview || savedMedia.src) && (kind === 'photo' ? <img key={preview || savedMedia.src} src={preview || savedMedia.src} alt="Selected photo preview" className="max-h-72 w-full rounded-xl bg-black object-contain" onLoad={() => setPlayable(true)} onError={() => { setPlayable(false); setError('Photo preview failed. Choose a supported photo and retry.'); }} /> : <video ref={previewVideo} key={preview || savedMedia.src} src={preview || savedMedia.src} controls playsInline preload="auto" className="max-h-72 w-full rounded-xl bg-black"
        onLoadedMetadata={event => previewReady(event.currentTarget)} onLoadedData={event => previewReady(event.currentTarget)} onCanPlay={event => previewReady(event.currentTarget)} onPlaying={event => previewReady(event.currentTarget)}
        onError={() => { setPlayable(false); setError('This browser cannot decode the video. Export H.264 MP4 or WebM and try again.'); }} />)}
      {kind === 'video' && (preview || savedMedia.src) && !preparing && <div className="space-y-2"><Button type="button" variant="outline" className="min-h-11" disabled={submitting} onClick={playPreview}>Play video preview</Button>{!playable && <p role="status" className="text-sm text-violet-200">Tap Play to check this video before posting.</p>}</div>}
      </section>
      <section className="clipt-create-details space-y-5" aria-label="Clipt details">
      <div className="space-y-2"><label htmlFor="clip-caption">Caption</label><Textarea ref={captionInput} id="clip-caption" value={caption} maxLength={kind==='photo'&&destination==='clipts'?500:2000} required={destination !== 'draft'} disabled={submitting} aria-describedby={captionError && destination !== 'draft' ? "clip-caption-help clip-caption-count clip-caption-error" : "clip-caption-help clip-caption-count"} aria-invalid={Boolean(captionError && destination !== 'draft')}
        onInvalid={event => { event.preventDefault(); requireCaption(); }}
        onChange={event => { setCaption(event.target.value); setCaptionError(''); }} placeholder="Share your gaming moment…" />
        <p id="clip-caption-help" className="text-sm text-violet-200">{destination === 'draft' ? 'Optional for this private draft.' : 'Required before posting.'}</p>
        {captionError && destination !== 'draft' && <p id="clip-caption-error" role="alert" className="text-red-200">{captionError}</p>}
        <p id="clip-caption-count" className="text-right text-xs text-slate-300">{caption.length.toLocaleString()} / {kind==='photo'&&destination==='clipts'?'500':'2,000'} characters</p></div>
      {kind==='photo'&&destination==='clipts'&&<p className="text-sm text-slate-300">Public photo captions and hashtags together are limited to 500 characters for safety review. When automated review is enabled, the photo stays out of public discovery until review completes. Check Photo safety notices in Notifications for status.</p>}
      <label className="block space-y-2"><span>Hashtags</span><Input value={hashtags} disabled={submitting} onChange={event => setHashtags(event.target.value)} placeholder="#gaming #clipt" /></label>
      <label className="block space-y-2"><span>Find a game</span><Input value={gameSearch} onKeyDown={event=>{if(event.key==='Enter'&&!event.nativeEvent.isComposing)event.preventDefault();}} disabled={submitting} onChange={event => { setGameSearch(event.target.value); setGameId(''); }} placeholder="Search games…" /></label>
      <label className="block space-y-2"><span>Game / category</span><select aria-label="Game / category" className="w-full rounded-md border border-purple-500 bg-slate-950 p-3" value={gameId} disabled={submitting || games.isPending}
        onChange={event => setGameId(event.target.value)}><option value="">No game selected</option>{games.data?.map(game => <option key={game.id} value={game.id}>{gameLabel(game)}</option>)}</select></label>
      <GameCatalogLookup disabled={submitting} term={gameSearch} onChoose={game=>{setGameSearch('');setGameId(game.id);}}/>
      {games.isPending && <p role="status">Loading game categories…</p>}
      {!games.isPending && !games.isError && !games.data?.length && <p role="status">{gameSearch.trim() ? 'No configured channels match. Search the full game catalog above to choose another game.' : 'No game categories are available. You can post without a game.'}</p>}
      {games.isError && <div role="alert">Games could not be loaded. <Button type="button" variant="outline" disabled={games.isFetching} onClick={() => games.refetch()}>Retry games</Button></div>}
      <fieldset className="clipt-post-destinations" disabled={submitting}><legend>Where do you want to post?</legend>
        {[{value:'clipts' as const,label:'Clipts',description:'Public · For You',Icon:Globe},{value:'squad' as const,label:'Squad',description:'People who follow you',Icon:Users},{value:'draft' as const,label:'Drafts',description:'Private · Only you',Icon:FileEdit}].map(({value,label,description,Icon}) => <label key={value} data-selected={destination===value}><input type="radio" name="clip-destination" value={value} checked={destination===value} disabled={value==='squad' && !squadReady} onChange={()=>setDestination(value)}/><Icon aria-hidden="true"/><strong>{label}</strong><span>{description}</span></label>)}
      </fieldset>
      {!squadReady && <p className="text-xs text-slate-300">Squad-only posting requires the local privacy migration to be installed in the development backend. It stays unavailable until server protection is confirmed. <Button type="button" variant="outline" disabled={postingCapabilities.isFetching} onClick={()=>void postingCapabilities.refetch()}>Recheck Squad privacy</Button></p>}
      <Link to="/drafts" className="inline-flex">Open saved drafts</Link>
      {error && <p role="alert" className="text-red-200">{error}</p>}
      {publishingUncertain(user?.id) && <p role="alert">An earlier post has an uncertain result. Check your profile before retrying; duplicate posting is blocked in this session.</p>}
      {stage !== 'idle' && stage !== 'converting' && <p role="status">{stage === 'checking' ? 'Checking media…' : stage === 'uploading' ? 'Uploading media…' : stage === 'reward' ? 'Clipt published. Checking Token reward…' : 'Publishing Clipt…'}</p>}
      <p id="clip-post-help" aria-live="polite" className="text-sm text-violet-200">{uncertain || publishingUncertain(user?.id) ? 'Check your profile before retrying an uncertain post.' : submitting ? 'Posting is in progress. Keep this page open.' : preparing ? 'Finish preparing the media first.' : !file && !savedReference ? 'Choose a video or photo first.' : !playable ? (kind === 'video' ? 'Play the video preview above before posting.' : 'Wait for the photo preview to load.') : destination !== 'draft' && !caption.trim() ? 'Add a caption, then press Post.' : 'Ready to post.'}</p>
      <Button type="submit" className="w-full" aria-describedby="clip-post-help" disabled={uncertain || submitting || (!file && !savedReference) || !playable || preparing || Boolean(draftId && !draft.isSuccess)}>{submitting ? 'Please wait…' : destination === 'draft' ? 'Save Draft' : destination === 'squad' ? 'Post to Squad' : 'Post Clipt'}</Button>
      {uncertain && <Button type="button" variant="outline" onClick={() => navigate('/profile')}>Check my profile</Button>}
      </section>
    </form>
  </main>;
}
