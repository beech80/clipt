import { supabase } from "@/lib/supabase";

export interface IGDBGame {
  id: number;
  name: string;
  cover?: {
    id: number;
    url: string;
  };
  summary?: string;
  rating?: number;
  total_rating?: number;
  first_release_date?: number;
  genres?: Array<{ id: number; name: string }>;
  screenshots?: Array<{ id: number; url: string }>;
  similar_games?: Array<IGDBGame>;
}

interface SearchOptions {
  sort?: string;
  limit?: number;
}

export const igdbService = {
  async searchGames(searchTerm: string, options: SearchOptions = {}): Promise<IGDBGame[]> {
    console.log("Searching for games with term:", searchTerm);
    const oneYearAgo = Math.floor(Date.now() / 1000) - (365 * 24 * 60 * 60);
    
    const query = `
      ${searchTerm ? `search "${searchTerm}";` : ''}
      fields name,cover.url,summary,rating,total_rating,first_release_date,genres.name,genres.id;
      where version_parent = null
      & first_release_date >= ${oneYearAgo};
      ${options.sort ? `sort ${options.sort};` : ''}
      limit ${options.limit || 10};
    `;

    try {
      const { data, error } = await supabase.functions.invoke('igdb', {
        body: {
          endpoint: 'games',
          query,
        },
      });

      if (error) {
        console.error('Error searching games:', error);
        throw error;
      }

      console.log("IGDB search results:", data);
      return data;
    } catch (err) {
      console.error('Failed to search games:', err);
      throw err;
    }
  },

  async getPopularGames(): Promise<IGDBGame[]> {
    console.log("Fetching popular games");
    const oneYearAgo = Math.floor(Date.now() / 1000) - (365 * 24 * 60 * 60);
    
    const query = `
      fields name,cover.url,summary,rating,total_rating,first_release_date,genres.name,genres.id;
      where rating != null 
      & version_parent = null
      & first_release_date >= ${oneYearAgo};
      sort rating desc;
      limit 10;
    `;

    try {
      const { data, error } = await supabase.functions.invoke('igdb', {
        body: {
          endpoint: 'games',
          query,
        },
      });

      if (error) {
        console.error('Error fetching popular games:', error);
        throw error;
      }

      console.log("Popular games results:", data);
      return data;
    } catch (err) {
      console.error('Failed to fetch popular games:', err);
      throw err;
    }
  },

  async getGameById(gameId: number): Promise<IGDBGame | null> {
    console.log("Fetching game details for ID:", gameId);
    const query = `
      fields name,cover.url,summary,rating,total_rating,first_release_date,genres.name,genres.id,screenshots.url;
      where id = ${gameId};
    `;

    try {
      const { data, error } = await supabase.functions.invoke('igdb', {
        body: {
          endpoint: 'games',
          query,
        },
      });

      if (error) {
        console.error('Error fetching game details:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return null;
      }

      // Fetch similar games
      const similarGamesQuery = `
        fields name,cover.url;
        where similar_games = ${gameId}
        & cover != null;
        limit 6;
      `;

      const { data: similarGames, error: similarError } = await supabase.functions.invoke('igdb', {
        body: {
          endpoint: 'games',
          query: similarGamesQuery,
        },
      });

      if (!similarError && similarGames && similarGames.length > 0) {
        data[0].similar_games = similarGames;
      }

      console.log("Game details:", data[0]);
      return data[0];
    } catch (err) {
      console.error('Failed to fetch game details:', err);
      throw err;
    }
  }
};
