interface PostFormContentProps {
  content: string;
  onChange: (content: string) => void;
  disabled?: boolean;
}

export default function PostFormContent({ content, onChange, disabled }: PostFormContentProps) {
  return (
    <div className="relative">
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What's on your mind?"
        className="w-full min-h-[100px] p-3 rounded-lg border border-border bg-background resize-none"
        disabled={disabled}
      />
    </div>
  );
}