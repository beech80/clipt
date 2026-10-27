import { supabase } from "@/lib/supabase";
import { createCommentService } from "./commentServiceCore";

export type { CommentData, CommentRecord, CommentResponse } from "./commentServiceCore";
export { MAX_COMMENT_LENGTH } from "./commentServiceCore";

// Reads and writes reject on failure so callers retain drafts and show errors.
export const {
  createComment,
  getComments,
  getReplies,
  likeComment,
  deleteComment,
  editComment,
  getCommentCount,
} = createCommentService(supabase);
