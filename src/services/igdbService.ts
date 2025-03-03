import { supabase } from '@/lib/supabase';

export interface IGDBGame {
  id: number;
  name: string;
  rating?: number;
  cover?: {
    id: number;
    url: string;
  };
  first_release_date?: string;
  genres?: {id: number; name: string;}[];
  platforms?: {id: number; name: string;}[];
  developers?: {id: number; name: string;}[];
  summary?: string;
}

interface SearchOptions {
  sort?: string;
  limit?: number;
}

class IGDBService {
  async searchGames(query: string, options: SearchOptions = {}): Promise<IGDBGame[]> {
    try {
      const searchTerm = query ? `search "${query}";` : '';
      const sortOption = options.sort ? `sort ${options.sort};` : 'sort rating desc;';
      const limitOption = `limit ${options.limit || 10};`;
      
      const { data, error } = await supabase.functions.invoke('igdb', {
        body: {
          endpoint: 'games',
          query: `
            ${searchTerm}
            fields name,rating,cover.url,genres.name,platforms.name,first_release_date,summary;
            where cover != null;
            ${sortOption}
            ${limitOption}
          `
        }
      });

      if (error) throw error;
      
      // Process image URLs to use HTTPS and proper sizes
      return (data || []).map(game => ({
        ...game,
        cover: game.cover ? {
          ...game.cover,
          url: this.formatImageUrl(game.cover.url)
        } : undefined
      }));
    } catch (error) {
      console.error('Error fetching games:', error);
      return [];
    }
  }

  async getPopularGames(): Promise<IGDBGame[]> {
    return this.searchGames('', {
      sort: 'rating desc',
      limit: 12
    });
  }
  
  async getTopGames(filter: 'top_rated' | 'most_played' | 'most_watched' = 'top_rated'): Promise<IGDBGame[]> {
    try {
      let query = '';

      switch (filter) {
        case 'top_rated':
          query = 'fields name,rating,cover.url; where rating != null & cover != null; sort rating desc; limit 12;';
          break;
        case 'most_played':
          query = 'fields name,rating,cover.url; where follows != null & cover != null; sort follows desc; limit 12;';
          break;
        case 'most_watched':
          query = 'fields name,rating,cover.url; where hypes != null & cover != null; sort hypes desc; limit 12;';
          break;
      }

      const { data, error } = await supabase.functions.invoke('igdb', {
        body: {
          endpoint: 'games',
          query
        }
      });

      if (error) throw error;
      
      // Process image URLs
      return (data || []).map(game => ({
        ...game,
        cover: game.cover ? {
          ...game.cover,
          url: this.formatImageUrl(game.cover.url)
        } : undefined
      }));
    } catch (error) {
      console.error('Error fetching top games:', error);
      return [];
    }
  }
  
  async getGameById(id: number): Promise<IGDBGame | null> {
    try {
      const { data, error } = await supabase.functions.invoke('igdb', {
        body: {
          endpoint: 'games',
          query: `fields name,rating,cover.url,first_release_date,genres.name,platforms.name,involved_companies.company.name,summary; 
                  where id = ${id}; 
                  limit 1;`
        }
      });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        return null;
      }
      
      // Process the data to extract developers from involved companies
      const game = data[0];
      
      // Process cover image URL
      if (game.cover) {
        game.cover.url = this.formatImageUrl(game.cover.url);
      }
      
      // Format the game data
      return {
        ...game,
        developers: game.involved_companies?.map(ic => ({ 
          id: ic.company.id, 
          name: ic.company.name 
        })) || []
      };
    } catch (error) {
      console.error('Error fetching game:', error);
      return null;
    }
  }
  
  // Helper to format IGDB image URLs correctly
  private formatImageUrl(url: string): string {
    if (!url) return '';
    
    // Ensure HTTPS and convert to large image format
    let formattedUrl = url;
    
    // Make sure we're using the right domain
    if (formattedUrl.includes('//images.igdb.com')) {
      // Already has the correct domain
    } else {
      // Fix the domain if needed
      formattedUrl = formattedUrl.replace('//localhost', '//images.igdb.com');
    }
    
    // Replace image size
    formattedUrl = formattedUrl.replace('t_thumb', 't_cover_big');
    
    // Add HTTPS protocol if missing
    if (!formattedUrl.startsWith('http')) {
      formattedUrl = 'https:' + formattedUrl;
    }
    
    return formattedUrl;
  }
}

export const igdbService = new IGDBService();
