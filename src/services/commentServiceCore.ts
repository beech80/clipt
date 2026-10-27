import type { SupabaseClient } from "@supabase/supabase-js";

export const MAX_COMMENT_LENGTH = 2000;

export interface CommentData {
  post_id: string;
  user_id: string;
  content: string;
  parent_id?: string | null;
}

export interface CommentRecord extends CommentData {
  parent_id: string | null;
  id: string;
  created_at: string;
  likes_count: number;
  liked_by_me?: boolean;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

export interface CommentResponse<T> {
  data: T;
  error: null;
}

const fields = `id, content, created_at, parent_id, likes_count, user_id,
  post_id, profiles:user_id (username, avatar_url)`;

const success = <T>(data: T): CommentResponse<T> => ({ data, error: null });

const validateContent = (content: string) => {
  const trimmed = content.trim();
  if (!trimmed) throw new Error("Comment content cannot be empty");
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    throw new Error(`Comments must be ${MAX_COMMENT_LENGTH} characters or fewer`);
  }
  return trimmed;
};

const normalizeComment = (comment: CommentRecord): CommentRecord => ({
  ...comment,
  likes_count: comment.likes_count ?? 0,
  profiles: {
    username: comment.profiles?.username || "Deleted user",
    avatar_url: comment.profiles?.avatar_url ?? null,
  },
});

/** The injected client keeps regression tests independent of live accounts. */
export const createCommentService = (client: Pick<SupabaseClient, "auth" | "from">) => {
  const pendingLikes = new Map<string, Promise<CommentResponse<{ liked: boolean }>>>();

  const requireUser = async (expectedUserId?: string) => {
    const { data: { user }, error } = await client.auth.getUser();
    if (error) throw error;
    if (!user) throw new Error("Please sign in to manage comments");
    if (expectedUserId && expectedUserId !== user.id) {
      throw new Error("You cannot act as another user");
    }
    return user;
  };

  const withLikeStatus = async (rows: CommentRecord[]) => {
    const comments = rows.map(normalizeComment);
    if (comments.length === 0) return comments;
    const { data: { user } } = await client.auth.getUser();
    if (!user) return comments.map(comment => ({ ...comment, liked_by_me: false }));

    const { data: likes, error } = await client.from("comment_likes")
      .select("comment_id")
      .eq("user_id", user.id)
      .in("comment_id", comments.map(comment => comment.id));
    if (error) throw error;
    const likedIds = new Set((likes || []).map(like => like.comment_id));
    return comments.map(comment => ({ ...comment, liked_by_me: likedIds.has(comment.id) }));
  };

  const createComment = async (input: CommentData) => {
    if (!input.post_id) throw new Error("Post ID is required");
    const content = validateContent(input.content);
    const user = await requireUser(input.user_id);

    if (input.parent_id) {
      const { data: parent, error } = await client.from("comments")
        .select("id, post_id")
        .eq("id", input.parent_id)
        .maybeSingle();
      if (error) throw error;
      if (!parent || parent.post_id !== input.post_id) {
        throw new Error("The reply must belong to a comment on this post");
      }
    }

    const { data, error } = await client.from("comments")
      .insert({
        post_id: input.post_id,
        user_id: user.id,
        content,
        parent_id: input.parent_id || null,
      })
      .select(fields);
    if (error) throw error;
    if (!data?.length) throw new Error("The comment could not be saved");
    return success((data as unknown as CommentRecord[]).map(normalizeComment));
  };

  const getComments = async (postId: string, page = 0, limit = 100, before?: Pick<CommentRecord,'id'|'created_at'>) => {
    if (!postId) throw new Error("Post ID is required");
    if (!Number.isInteger(page) || page < 0 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error("Invalid comments page");
    }
    const start = page * limit;
    if(before && (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(before.id) || !/^\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:\d{2})$/.test(before.created_at) || !Number.isFinite(Date.parse(before.created_at)))) throw new Error('Invalid comment cursor');
    let request = client.from("comments")
      .select(fields)
      .eq("post_id", postId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(start, start + limit - 1);
    if(before) request=request.or(`created_at.lt.${before.created_at},and(created_at.eq.${before.created_at},id.lt.${before.id})`);
    const { data, error } = await request;
    if (error) throw error;
    return success(await withLikeStatus((data || []) as unknown as CommentRecord[]));
  };

  const getReplies = async (commentId: string) => {
    if (!commentId) throw new Error("Comment ID is required");
    const { data, error } = await client.from("comments")
      .select(fields)
      .eq("parent_id", commentId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(100);
    if (error) throw error;
    return success(await withLikeStatus((data || []) as unknown as CommentRecord[]));
  };

  const toggleLike = async (commentId: string) => {
    if (!commentId) throw new Error("Comment ID is required");
    const user = await requireUser();
    const { data: existing, error: readError } = await client.from("comment_likes")
      .select("id")
      .eq("comment_id", commentId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (readError) throw readError;

    const { error } = existing
      ? await client.from("comment_likes").delete()
        .eq("comment_id", commentId).eq("user_id", user.id)
      : await client.from("comment_likes").insert({ comment_id: commentId, user_id: user.id });
    if (error) throw error;
    // Database comment_like_insert/delete triggers maintain likes_count.
    // A viewer must not update another author's comment to maintain a counter.
    return success({ liked: !existing });
  };

  const likeComment = (commentId: string) => {
    const pending = pendingLikes.get(commentId);
    if (pending) return pending;
    const operation = toggleLike(commentId).finally(() => pendingLikes.delete(commentId));
    pendingLikes.set(commentId, operation);
    return operation;
  };

  const deleteComment = async (commentId: string, userId?: string) => {
    if (!commentId) throw new Error("Comment ID is required");
    const user = await requireUser(userId);
    const { data, error } = await client.from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id)
      .select("id");
    if (error) throw error;
    if (!data?.length) throw new Error("Comment not found or you cannot delete it");
    return success({ success: true });
  };

  const editComment = async (commentId: string, userId: string, input: string) => {
    if (!commentId) throw new Error("Comment ID is required");
    const content = validateContent(input);
    const user = await requireUser(userId);
    const { data, error } = await client.from("comments")
      .update({ content })
      .eq("id", commentId)
      .eq("user_id", user.id)
      .select(fields);
    if (error) throw error;
    if (!data?.length) throw new Error("Comment not found or you cannot edit it");
    return success((data as unknown as CommentRecord[]).map(normalizeComment));
  };

  const getCommentCount = async (postId: string) => {
    if (!postId) throw new Error("Post ID is required");
    const { count, error } = await client.from("comments")
      .select("id", { count: "exact", head: true }).eq("post_id", postId);
    if (error) throw error;
    return count ?? 0;
  };

  return { createComment, getComments, getReplies, likeComment, deleteComment, editComment, getCommentCount };
};
