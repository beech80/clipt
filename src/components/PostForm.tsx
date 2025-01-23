import PostFormContainer from "./post/form/PostFormContainer";

interface PostFormProps {
  onPostCreated?: () => void;
}

export default function PostForm(props: PostFormProps) {
  return <PostFormContainer {...props} />;
}