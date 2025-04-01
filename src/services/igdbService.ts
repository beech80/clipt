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
  includeFullData?: boolean; 
}

class IGDBService {
  async searchGames(query: string, options: SearchOptions = {}): Promise<IGDBGame[]> {
    try {
      console.log('IGDB searchGames called with query:', query);
      
      // Handle search query - properly escape it to prevent injection and query errors
      const cleanQuery = query?.trim().replace(/"/g, '\\"') || '';
      
      // For empty queries, return popular games
      if (!cleanQuery) {
        console.log('Empty query, returning popular games');
        return this.getPopularGames(options.limit || 100); 
      }
      
      // Build search query with improved pattern matching
      // Use multiple query conditions to ensure we get more comprehensive results
      // First try exact match, then alternative search patterns
      const searchTerm = cleanQuery.length > 2 
        ? `where (name ~ "${cleanQuery}"* | name ~ "*${cleanQuery}*" | alternative_names.name ~ "*${cleanQuery}*" | keywords.name ~ "*${cleanQuery}*") & cover != null;`
        : `where name ~ "*${cleanQuery}*" & cover != null;`;
      
      // Set up sorting with proper defaults - prioritize relevance when searching
      const sortOption = cleanQuery
        ? 'sort popularity desc;' 
        : (options.sort ? `sort ${options.sort};` : 'sort popularity desc;');
      
      // Set reasonable limit but increase for searches to ensure we find matches
      const limitOption = `limit ${options.limit || (cleanQuery ? 150 : 100)};`; 
      
      // Expand fields to get more comprehensive game data
      const fields = options.includeFullData 
        ? 'fields name,rating,cover.url,genres.name,platforms.name,first_release_date,summary,popularity,alternative_names.name,storyline,total_rating,total_rating_count,aggregated_rating,aggregated_rating_count,game_modes.name,keywords.name,themes.name,similar_games.name,similar_games.cover.url,player_perspectives.name,involved_companies.company.name,videos.video_id,websites.url,websites.category;'
        : 'fields name,rating,cover.url,genres.name,platforms.name,first_release_date,summary,popularity,alternative_names.name;';
      
      // Create a well-formed IGDB query with proper formatting
      const igdbQuery = `
        ${fields}
        ${searchTerm}
        ${sortOption}
        ${limitOption}
      `;
      
      console.log('IGDB query:', igdbQuery);
      
      try {
        const { data, error } = await supabase.functions.invoke('igdb', {
          body: {
            endpoint: 'games',
            query: igdbQuery
          }
        });

        if (error) {
          console.error('IGDB API error:', error);
          throw error;
        }
        
        if (!data || !Array.isArray(data)) {
          console.warn('Invalid data returned from IGDB API:', data);
          throw new Error('Invalid data format from IGDB API');
        }
        
        console.log(`IGDB returned ${data.length} results for "${cleanQuery}"`);
        
        // Process image URLs to use HTTPS and proper sizes
        return data.map(game => ({
          ...game,
          cover: game.cover ? {
            ...game.cover,
            url: this.formatImageUrl(game.cover.url)
          } : undefined
        }));
      } catch (apiError) {
        console.error('Failed to get games from IGDB API, using fallback:', apiError);
        // Fallback to mock data for immediate testing
        return this.getMockGamesBySearch(cleanQuery, options.limit || 20); 
      }
    } catch (error) {
      console.error('Error in searchGames method:', error);
      // Return mock games as fallback
      return this.getMockGamesBySearch(query, options.limit || 20); 
    }
  }

  async getPopularGames(limit = 100): Promise<IGDBGame[]> { 
    try {
      console.log('Getting popular games from IGDB');
      
      const { data, error } = await supabase.functions.invoke('igdb', {
        body: {
          endpoint: 'games',
          query: `
            fields name,rating,cover.url,genres.name,platforms.name,first_release_date,summary,popularity;
            where cover != null;
            sort popularity desc;
            limit ${limit};
          `
        }
      });

      if (error) {
        console.error('IGDB popular games error:', error);
        throw error;
      }
      
      if (!data || !Array.isArray(data)) {
        console.warn('Invalid data returned from IGDB API for popular games');
        return [];
      }

      console.log(`IGDB returned ${data.length} popular games`);
      
      // Format image URLs and return data
      return data.map(game => ({
        ...game,
        cover: game.cover ? {
          ...game.cover,
          url: this.formatImageUrl(game.cover.url)
        } : undefined
      }));
    } catch (error) {
      console.error('Error fetching popular games from IGDB:', error);
      // Return empty array on error instead of throwing to avoid breaking the UI
      return [];
    }
  }
  
  async getTopGames(
    filter: 'top_rated' | 'most_played' | 'most_watched' = 'top_rated', 
    page: number = 1, 
    pageSize: number = 20
  ): Promise<IGDBGame[]> {
    try {
      let sortOption = '';
      let additionalQuery = '';
      const offset = (page - 1) * pageSize;
      
      switch (filter) {
        case 'top_rated':
          sortOption = 'sort rating desc;';
          additionalQuery = 'where rating > 70;';
          break;
        case 'most_played':
          sortOption = 'sort total_rating_count desc;';
          additionalQuery = 'where total_rating_count > 0;';
          break;
        case 'most_watched':
          sortOption = 'sort hypes desc;';
          additionalQuery = 'where hypes > 0;';
          break;
      }
      
      const { data, error } = await supabase.functions.invoke('igdb', {
        body: {
          endpoint: 'games',
          query: `
            fields name,rating,cover.url,genres.name,platforms.name,first_release_date,summary,total_rating_count,hypes;
            where cover != null;
            ${additionalQuery}
            ${sortOption}
            limit ${pageSize};
            offset ${offset};
          `
        }
      });

      if (error) throw error;
      
      // If no data is returned, use mock data
      if (!data || data.length === 0) {
        console.log('No games returned from API, using mock data');
        return this.getMockGames();
      }
      
      // Process image URLs to use HTTPS and proper sizes
      return (data || []).map(game => ({
        ...game,
        cover: game.cover ? {
          ...game.cover,
          url: this.formatImageUrl(game.cover.url)
        } : undefined
      }));
    } catch (error) {
      console.error('Error fetching top games:', error);
      // Fall back to mock data when there's an error
      return this.getMockGames();
    }
  }

  private getMockGames(): IGDBGame[] {
    return [
      {
        id: 1,
        name: 'Halo Infinite',
        rating: 85,
        cover: {
          id: 101,
          url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg'
        }
      },
      {
        id: 2,
        name: 'Forza Horizon 5',
        rating: 92,
        cover: {
          id: 102,
          url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3wk8.jpg'
        }
      },
      {
        id: 3,
        name: 'Call of Duty: Modern Warfare',
        rating: 83,
        cover: {
          id: 103,
          url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wkb.jpg'
        }
      },
      {
        id: 4,
        name: 'FIFA 23',
        rating: 79,
        cover: {
          id: 104,
          url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co52l6.jpg'
        }
      },
      {
        id: 5,
        name: 'Cyberpunk 2077',
        rating: 75,
        cover: {
          id: 105,
          url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4hk8.jpg'
        }
      },
      {
        id: 6,
        name: 'Elden Ring',
        rating: 95,
        cover: {
          id: 106,
          url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg'
        }
      }
    ];
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
  
  // Improve the image URL formatting to handle all possible cases
  private formatImageUrl(url: string): string {
    if (!url) return '/img/games/default.jpg';
    
    try {
      // Fix protocol issues
      let formattedUrl = url;
      
      if (formattedUrl.startsWith('//')) {
        formattedUrl = 'https:' + formattedUrl;
      } else if (!formattedUrl.startsWith('http')) {
        formattedUrl = 'https://' + formattedUrl;
      }
      
      // Make sure we're using the right size image (t_cover_big)
      if (!formattedUrl.includes('t_cover_big')) {
        formattedUrl = formattedUrl.replace(/t_[a-z_]+/, 't_cover_big');
      }
      
      return formattedUrl;
    } catch (error) {
      console.error('Error formatting image URL:', error);
      return '/img/games/default.jpg';
    }
  }

  // Helper method to get mock games by search query for fallback
  getMockGamesBySearch(query: string, limit: number = 10): IGDBGame[] {
    console.log('Using mock games for search:', query);
    
    const mockGames: IGDBGame[] = [
      {
        id: 1,
        name: 'Call of Duty: Modern Warfare',
        rating: 85,
        cover: {
          id: 101,
          url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1rst.jpg'
        },
        summary: 'The stakes have never been higher as players take on the role of lethal Tier One operators in a heart-racing saga that will affect the global balance of power.',
        genres: [{ id: 5, name: 'Shooter' }],
        platforms: [{ id: 6, name: 'PC' }, { id: 48, name: 'PlayStation 4' }, { id: 49, name: 'Xbox One' }]
      },
      {
        id: 2,
        name: 'The Legend of Zelda: Breath of the Wild',
        rating: 97,
        cover: {
          id: 102,
          url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3p2d.jpg'
        },
        summary: 'Step into a world of discovery, exploration, and adventure in The Legend of Zelda: Breath of the Wild.',
        genres: [{ id: 12, name: 'Adventure' }, { id: 31, name: 'RPG' }],
        platforms: [{ id: 130, name: 'Nintendo Switch' }]
      },
      {
        id: 3,
        name: 'Fortnite',
        rating: 80,
        cover: {
          id: 103,
          url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2ekt.jpg'
        },
        summary: 'Fortnite is the free, always evolving, multiplayer game where you and your friends battle to be the last one standing or collaborate to create your dream Fortnite world.',
        genres: [{ id: 5, name: 'Shooter' }, { id: 8, name: 'Battle Royale' }],
        platforms: [{ id: 6, name: 'PC' }, { id: 48, name: 'PlayStation 4' }, { id: 49, name: 'Xbox One' }, { id: 130, name: 'Nintendo Switch' }]
      },
      {
        id: 4,
        name: 'Grand Theft Auto V',
        rating: 95,
        cover: {
          id: 104,
          url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1tgt.jpg'
        },
        summary: 'Los Santos: a sprawling sun-soaked metropolis full of self-help gurus, starlets and fading celebrities, once the envy of the Western world, now struggling to stay afloat in an era of economic uncertainty and cheap reality TV.',
        genres: [{ id: 5, name: 'Action' }, { id: 12, name: 'Adventure' }],
        platforms: [{ id: 6, name: 'PC' }, { id: 48, name: 'PlayStation 4' }, { id: 49, name: 'Xbox One' }]
      },
      {
        id: 5,
        name: 'Halo Infinite',
        rating: 87,
        cover: {
          id: 105,
          url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1rft.jpg'
        },
        summary: 'When all hope is lost and humanity\'s fate hangs in the balance, the Master Chief is ready to confront the most ruthless foe he\'s ever faced.',
        genres: [{ id: 5, name: 'Shooter' }],
        platforms: [{ id: 6, name: 'PC' }, { id: 169, name: 'Xbox Series X|S' }]
      }
    ];
    
    // Filter the mock games by the search query
    const lowercaseQuery = query.toLowerCase();
    const filteredGames = mockGames.filter(game => 
      game.name.toLowerCase().includes(lowercaseQuery) ||
      (game.summary && game.summary.toLowerCase().includes(lowercaseQuery)) ||
      (game.genres && game.genres.some(genre => genre.name.toLowerCase().includes(lowercaseQuery)))
    );
    
    // If no matches, return all mock games (for better UX)
    return (filteredGames.length > 0 ? filteredGames : mockGames).slice(0, limit);
  }
}

export const igdbService = new IGDBService();
