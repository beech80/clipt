import React, { useState, useEffect } from 'react';
import { useStreamRecommendations, StreamRecommendation } from '@/services/recommendationService';
import { useUser } from '@/hooks/useUser';
import RecommendationSection from '@/components/streaming/recommendations/RecommendationSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Search, Zap, TrendingUp, Activity, Users, Tag, Info } from 'lucide-react';
import { supabase } from '@/supabaseClient';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = [
  'Gaming',
  'Music',
  'Creative',
  'Just Chatting',
  'IRL',
  'Sports',
  'Education',
  'Technology',
  'Entertainment',
  'News',
  'Other'
];

const StreamDiscoveryPage: React.FC = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const recommendations = useStreamRecommendations();
  
  const [personalized, setPersonalized] = useState<StreamRecommendation[]>([]);
  const [trending, setTrending] = useState<StreamRecommendation[]>([]);
  const [live, setLive] = useState<StreamRecommendation[]>([]);
  const [popular, setPopular] = useState<StreamRecommendation[]>([]);
  const [followedStreams, setFollowedStreams] = useState<StreamRecommendation[]>([]);
  const [categoryStreams, setCategoryStreams] = useState<Record<string, StreamRecommendation[]>>({});
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<StreamRecommendation[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  const [loading, setLoading] = useState({
    personalized: true,
    trending: true,
    live: true,
    popular: true,
    followed: true,
    category: true,
    search: false
  });
  
  // Track stream view for personalization data
  const trackStreamView = async (streamId: string) => {
    if (!user) return;
    
    try {
      await supabase.from('stream_view_history').insert({
        user_id: user.id,
        stream_id: streamId,
        watch_time: 0 // Initial view
      });
    } catch (error) {
      console.error('Error tracking stream view:', error);
    }
  };
  
  useEffect(() => {
    if (!user) return;
    
    const loadRecommendations = async () => {
      try {
        // Fetch personalized recommendations
        setLoading(prev => ({ ...prev, personalized: true }));
        const personalizedData = await recommendations.getPersonalized({ limit: 10 });
        setPersonalized(personalizedData);
        setLoading(prev => ({ ...prev, personalized: false }));
        
        // Fetch trending recommendations
        setLoading(prev => ({ ...prev, trending: true }));
        const trendingData = await recommendations.getTrending({ limit: 10 });
        setTrending(trendingData);
        setLoading(prev => ({ ...prev, trending: false }));
        
        // Fetch live streams
        setLoading(prev => ({ ...prev, live: true }));
        const liveData = await recommendations.getLive({ limit: 10 });
        setLive(liveData);
        setLoading(prev => ({ ...prev, live: false }));
        
        // Fetch popular streams
        setLoading(prev => ({ ...prev, popular: true }));
        const popularData = await recommendations.getPopular({ limit: 10 });
        setPopular(popularData);
        setLoading(prev => ({ ...prev, popular: false }));
        
        // Fetch followed streams
        setLoading(prev => ({ ...prev, followed: true }));
        const followedData = await recommendations.getLive({ 
          limit: 10, 
          followedOnly: true 
        });
        setFollowedStreams(followedData);
        setLoading(prev => ({ ...prev, followed: false }));
      } catch (error) {
        console.error('Error loading recommendations:', error);
        toast({
          title: 'Error loading recommendations',
          description: 'Please try refreshing the page.',
          variant: 'destructive'
        });
      }
    };
    
    loadRecommendations();
  }, [user]);
  
  const handleCategoryChange = async (category: string) => {
    setSelectedCategory(category);
    
    if (!categoryStreams[category]) {
      setLoading(prev => ({ ...prev, category: true }));
      try {
        const streams = await recommendations.getByCategory(category, { limit: 15 });
        setCategoryStreams(prev => ({
          ...prev,
          [category]: streams
        }));
      } catch (error) {
        console.error(`Error loading ${category} streams:`, error);
      }
      setLoading(prev => ({ ...prev, category: false }));
    }
  };
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setLoading(prev => ({ ...prev, search: true }));
    
    try {
      // Search based on title, tags, and description
      const { data: results, error } = await supabase
        .from('streams')
        .select(`
          id, 
          title, 
          thumbnail_url, 
          user_id,
          profiles(username, avatar_url),
          is_live,
          viewer_count,
          duration,
          created_at,
          category,
          tags,
          views
        `)
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .order('views', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      const formattedResults = results.map(stream => ({
        ...stream,
        username: stream.profiles?.username || 'Unknown',
        avatar_url: stream.profiles?.avatar_url || '',
        reason: 'Search result',
        score: 0
      }));
      
      setSearchResults(formattedResults);
    } catch (error) {
      console.error('Error searching streams:', error);
      toast({
        title: 'Search failed',
        description: 'Please try a different search term.',
        variant: 'destructive'
      });
    } finally {
      setLoading(prev => ({ ...prev, search: false }));
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Discover Streams</h1>
          <p className="text-muted-foreground">Find new content based on your interests</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-2">
          <div className="flex-1 md:w-64">
            <Input
              placeholder="Search streams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading.search}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
      </div>
      
      {/* If the user has no personalization data yet */}
      {user && personalized.length === 0 && !loading.personalized && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Welcome to personalized recommendations!</AlertTitle>
          <AlertDescription>
            Watch streams to improve your recommendations. We'll learn your preferences over time.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="foryou" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="foryou"><Zap className="h-4 w-4 mr-2" /> For You</TabsTrigger>
          <TabsTrigger value="trending"><TrendingUp className="h-4 w-4 mr-2" /> Trending</TabsTrigger>
          <TabsTrigger value="live"><Activity className="h-4 w-4 mr-2" /> Live</TabsTrigger>
          <TabsTrigger value="followed"><Users className="h-4 w-4 mr-2" /> Following</TabsTrigger>
          <TabsTrigger value="categories"><Tag className="h-4 w-4 mr-2" /> Categories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="foryou">
          {isSearching ? (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold mb-4">Search Results</h2>
                {loading.search ? (
                  <RecommendationSection 
                    title="" 
                    recommendations={[]}
                    isLoading={true}
                  />
                ) : (
                  searchResults.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {searchResults.map(result => (
                        <StreamRecommendationCard 
                          key={result.id} 
                          recommendation={result}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
                    </div>
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <RecommendationSection 
                title="Recommended for You" 
                recommendations={personalized}
                viewAllRoute="/recommended"
                isLoading={loading.personalized}
                emptyMessage="Watch more streams to get personalized recommendations"
              />
              
              <RecommendationSection 
                title="Popular Now" 
                recommendations={popular}
                viewAllRoute="/popular"
                isLoading={loading.popular}
              />
              
              {followedStreams.length > 0 && (
                <RecommendationSection 
                  title="From People You Follow" 
                  recommendations={followedStreams}
                  viewAllRoute="/following"
                  isLoading={loading.followed}
                />
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="trending">
          <RecommendationSection 
            title="Trending Today" 
            recommendations={trending}
            isLoading={loading.trending}
            cardSize="lg"
          />
        </TabsContent>
        
        <TabsContent value="live">
          <RecommendationSection 
            title="Live Now" 
            recommendations={live}
            isLoading={loading.live}
            cardSize="lg"
          />
        </TabsContent>
        
        <TabsContent value="followed">
          <RecommendationSection 
            title="Streams from People You Follow" 
            recommendations={followedStreams}
            isLoading={loading.followed}
            cardSize="lg"
            emptyMessage="You'll see streams from people you follow here"
          />
        </TabsContent>
        
        <TabsContent value="categories">
          <div className="mb-6 flex flex-wrap gap-2">
            {CATEGORIES.map(category => (
              <Badge 
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleCategoryChange(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
          
          {selectedCategory ? (
            <RecommendationSection 
              title={`${selectedCategory} Streams`}
              recommendations={categoryStreams[selectedCategory] || []}
              isLoading={loading.category && !categoryStreams[selectedCategory]}
              cardSize="lg"
            />
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Select a category to see relevant streams
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StreamDiscoveryPage;
