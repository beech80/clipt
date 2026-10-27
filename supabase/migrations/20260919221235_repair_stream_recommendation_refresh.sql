BEGIN;
-- Preserve recommendation rows and identities instead of truncating the cache.
-- SECURITY INVOKER deliberately retains the caller's table/RLS permissions.
CREATE OR REPLACE FUNCTION public.update_stream_recommendations()
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
  UPDATE public.recommended_streams SET score=0 WHERE score IS DISTINCT FROM 0;
  INSERT INTO public.recommended_streams(user_id,stream_id,score)
  SELECT signals.user_id,signals.stream_id,sum(signals.score)
  FROM (
    SELECT DISTINCT f.follower_id AS user_id,s.id AS stream_id,1.0 AS score
    FROM public.follows f JOIN public.streams s ON s.user_id=f.following_id
    WHERE s.is_live=true
    UNION ALL
    SELECT DISTINCT v.viewer_id AS user_id,s.id AS stream_id,0.5 AS score
    FROM public.post_views v JOIN public.streams s ON s.user_id<>v.viewer_id
    WHERE s.is_live=true AND v.viewer_id IS NOT NULL
  ) signals GROUP BY signals.user_id,signals.stream_id
  ON CONFLICT(user_id,stream_id) DO UPDATE SET score=EXCLUDED.score;
END;
$$;
COMMIT;
