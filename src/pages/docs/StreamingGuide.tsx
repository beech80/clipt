export default function StreamingGuide() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-4xl font-bold">Streaming Guide</h1>
      
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Setting Up Your Stream</h2>
        <p>
          Learn how to set up and customize your streaming experience on Clip.
          From basic configuration to advanced features, we'll guide you through
          everything you need to know.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Stream Settings</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Stream key and security</li>
          <li>Video quality and bitrate</li>
          <li>Chat moderation tools</li>
          <li>Stream overlay customization</li>
          <li>Alert and notification settings</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Best Practices</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Recommended streaming settings</li>
          <li>Engaging with your audience</li>
          <li>Growing your channel</li>
          <li>Stream scheduling tips</li>
          <li>Technical troubleshooting</li>
        </ul>
      </section>
    </div>
  );
}