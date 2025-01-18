# API Documentation

## Authentication
All API endpoints require authentication via Supabase JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <token>
```

## Posts

### Create Post
`POST /posts`

Request body:
```typescript
{
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  scheduledPublishTime?: string;
  isPublished?: boolean;
}
```

Response:
```typescript
{
  data: {
    id: string;
    content: string;
    user_id: string;
    image_url: string | null;
    video_url: string | null;
    created_at: string;
  } | null;
  error: Error | null;
}
```

### Get Posts
`GET /posts`

Query parameters:
- `page`: number (default: 1)
- `limit`: number (default: 10)

Response:
```typescript
{
  data: Post[];
  error: Error | null;
}
```

## Streams

### Start Stream
`POST /streams/start`

Request body:
```typescript
{
  title: string;
  description?: string;
}
```

Response:
```typescript
{
  isLive: boolean;
  streamKey: string;
  streamUrl: string;
  streamId: string;
}
```

### End Stream
`POST /streams/end`

Response:
```typescript
{
  isLive: boolean;
  streamKey: null;
  streamUrl: null;
  streamId: null;
}
```

## Analytics

### Track Post Analytics
`POST /post-analytics`

Request body:
```typescript
{
  postId: string;
  metricType: 'view' | 'share' | 'share_click' | 'hashtag_click' | 'time_spent';
  value?: number;
}
```

## Error Handling
All endpoints return errors in the following format:
```typescript
{
  error: {
    message: string;
    status: number;
  }
}
```

Common status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Rate Limits
- Authentication endpoints: 20 requests per minute
- Post creation: 10 posts per minute
- Stream operations: 30 requests per minute
- Analytics tracking: 100 requests per minute