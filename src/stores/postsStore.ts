import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { createAsyncAction } from './appStore';

interface Post {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
}

interface PostsState {
  posts: Post[];
  setPosts: (posts: Post[]) => void;
  addPost: (post: Post) => void;
  updatePost: (id: string, updates: Partial<Post>) => void;
  removePost: (id: string) => void;
}

export const usePostsStore = create<PostsState>()(
  devtools(
    (set) => ({
      posts: [],
      setPosts: (posts) => set({ posts }),
      addPost: (post) =>
        set((state) => ({
          posts: [post, ...state.posts],
        })),
      updatePost: (id, updates) =>
        set((state) => ({
          posts: state.posts.map((post) =>
            post.id === id ? { ...post, ...updates } : post
          ),
        })),
      removePost: (id) =>
        set((state) => ({
          posts: state.posts.filter((post) => post.id !== id),
        })),
    }),
    { name: 'posts-store' }
  )
);

// Type-safe async actions with optimistic updates
export const createPost = createAsyncAction(
  async (content: string) => {
    const { data, error } = await supabase
      .from('posts')
      .insert([{ content }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  {
    optimisticKey: 'create-post',
    optimisticData: (content: string) => ({
      id: 'temp-' + Date.now(),
      content,
      created_at: new Date().toISOString(),
    }),
    onSuccess: (post) => {
      usePostsStore.getState().addPost(post);
    },
  }
);

export const deletePost = createAsyncAction(
  async (postId: string) => {
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) throw error;
    return postId;
  },
  {
    optimisticKey: `delete-post`,
    onSuccess: (postId) => {
      usePostsStore.getState().removePost(postId);
    },
  }
);