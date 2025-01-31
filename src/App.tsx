import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { StoriesBar } from '@/components/stories/StoriesBar';
import { MainNav } from '@/components/MainNav';
import { UserMenu } from '@/components/UserMenu';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background">
          <div className="border-b">
            <div className="flex h-16 items-center px-4">
              <MainNav className="mx-6" />
              <div className="ml-auto flex items-center space-x-4">
                <UserMenu />
              </div>
            </div>
          </div>
          <StoriesBar />
          <main className="container mx-auto py-6">
            <h1 className="text-2xl font-bold">Welcome to the Streaming Platform</h1>
            <p className="mt-4">Explore analytics, manage your streams, and engage with your audience.</p>
          </main>
        </div>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
