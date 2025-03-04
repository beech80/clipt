# Clip - Social Gaming Platform

## Overview

Clip is a modern social platform for gamers to share their best gaming moments, connect with fellow gamers, and build a vibrant gaming community. The platform is available as both a web application and a progressive web app (PWA) that can be installed on mobile devices.

## Features

- **Social Gaming Feed**: Discover and engage with gaming content
- **Clip Uploads**: Share your best gaming moments with the community
- **User Profiles**: Customize your profile and showcase your gaming achievements
- **Offline Support**: PWA capabilities allow for some offline functionality
- **Mobile Optimized**: Works on all devices with responsive design

## Documentation

- [User Guide](./USERGUIDE.md) - Complete guide for using the platform
- [API Documentation](./docs/api.md) - API reference for developers
- [Contributing Guide](./CONTRIBUTING.md) - Guidelines for contributors

## Tech Stack

- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query
- **Backend**: Supabase
- **Build Tool**: Vite
- **PWA Support**: vite-plugin-pwa
- **Mobile**: Capacitor for native features

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Git

### Development
1. Clone and install dependencies:
```bash
git clone <repository-url>
cd clip-gaming
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```
Update the `.env` file with your Supabase credentials.

3. Start development server:
```bash
npm run dev
```

### Supabase Integration

This project uses Supabase for the backend. The database includes the following main tables:
- `posts` - for storing user posts/clips
- `comments` - for post comments
- `profiles` - for user profile information
- `likes` - for post likes
- `clip_votes` - for trophies on clips
- `follows` - for user follow relationships
- `games` - for game information

### Deployment

#### Web Deployment
1. Build the project:
```bash
npm run build
```

2. Deploy the contents of the `dist` folder to your web hosting provider.

#### PWA Installation
The application can be installed as a PWA on compatible devices by clicking the "Add to Home Screen" option in the browser menu.

#### Mobile App Deployment
Using Capacitor, you can build native mobile apps:

```bash
# Sync web code with native projects
npx cap sync

# Open Android Studio
npx cap open android

# Open Xcode for iOS
npx cap open ios
```

## Recent Updates

### UI/UX Improvements
- Improved mobile UI responsiveness, especially for the streaming page
- Added ability to click on usernames throughout the app to navigate to user profiles
- Fixed search functionality on the discovery page
- Fixed "Most Played Games" section to correctly show games

### User Profile Updates
- Implemented username change restriction (limited to once every two months)
- Added visual feedback and countdown for when users can change their username again

## CI/CD
This project uses GitHub Actions for continuous integration and deployment. The workflow automatically builds the application and deploys it to production when changes are pushed to the main branch.

## License

This project is licensed under the MIT License.

## Acknowledgments

- Backend powered by [Supabase](https://supabase.com)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Built with [Lovable](https://lovable.dev)