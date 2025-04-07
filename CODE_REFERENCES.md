# Clipt Code References

## Key Components and Their Locations

### Sharing Components
- `src/components/shared/ShareButton.tsx` - Web Share API integration

### Notification Components
- `src/components/notifications/PushNotificationOptIn.tsx` - Push notification UI
- `src/services/pushNotificationService.ts` - Push notification service

### Streaming Components
- `src/components/streaming/StreamClipGenerator.tsx` - Stream clip creation
- `src/components/streaming/StreamPoll.tsx` - Interactive polls
- `src/components/streaming/schedule/ScheduleStream.tsx` - Stream scheduling
- `src/components/streaming/StreamDonation.tsx` - Donation interface
- `src/components/streaming/StreamDonation.css` - Donation animations
- `src/components/streaming/StreamAnalytics.tsx` - Stream analytics dashboard

### Pages
- `src/pages/clips/[id].tsx` - Clip viewing page

## How to Use These Components

### ShareButton
```tsx
<ShareButton
  title="Check out this stream"
  text="I'm watching a great stream on Clipt"
  url={window.location.href}
/>
```

### PushNotificationOptIn
```tsx
<PushNotificationOptIn />
```

### ScheduleStream
```tsx
<ScheduleStream onSuccess={() => refetchSchedule()} />
```

### StreamDonation
```tsx
<StreamDonation
  streamId={streamId}
  streamerUsername={username}
  streamerId={streamerId}
/>
```

### StreamPoll
```tsx
<StreamPoll
  streamId={streamId}
  isStreamer={isStreamer}
/>
```

### StreamClipGenerator
```tsx
<StreamClipGenerator
  streamId={streamId}
  streamTitle={streamTitle}
  videoRef={videoRef}
/>
```

### StreamAnalytics
```tsx
<StreamAnalytics userId={userId} />
```

## Required Environment Variables

Create a `.env` file with the following variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_PUSH_PUBLIC_KEY=your_vapid_public_key
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_api_key
VITE_CLOUDINARY_API_SECRET=your_api_secret
```
 ,