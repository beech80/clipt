import { supabase } from "@/lib/supabase";

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

class IGDBService {
  async searchGames(query: string): Promise<IGDBGame[]> {
    try {
      const { data, error } = await supabase.functions.invoke('igdb', {
        body: {
          endpoint: 'games',
          query: `search "${query}"; fields name,rating,cover.url; limit 10;`
        }
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching games:', error);
      return [];
    }
  }

  async getTopGames(filter: 'top_rated' | 'most_played' | 'most_watched' = 'top_rated'): Promise<IGDBGame[]> {
    try {
      let query = '';

      switch (filter) {
        case 'top_rated':
          query = 'fields name,rating,cover.url; sort rating desc; where rating != null; limit 12;';
          break;
        case 'most_played':
          query = 'fields name,rating,cover.url; sort follows desc; where follows != null; limit 12;';
          break;
        case 'most_watched':
          query = 'fields name,rating,cover.url; sort hypes desc; where hypes != null; limit 12;';
          break;
      }

      const { data, error } = await supabase.functions.invoke('igdb', {
        body: {
          endpoint: 'games',
          query
        }
      });

      if (error) throw error;
      return data || [];
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
}

export const igdbService = new IGDBService();
