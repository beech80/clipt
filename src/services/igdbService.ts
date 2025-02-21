
import { supabase } from "@/lib/supabase";

export interface IGDBGame {
  id: number;
  name: string;
  cover?: {
    url: string;
  };
  summary?: string;
  rating?: number;
  first_release_date?: number;
  genres?: Array<{ name: string }>;
}

interface SearchOptions {
  sort?: string;
  limit?: number;
}

export const igdbService = {
  async searchGames(searchTerm: string, options: SearchOptions = {}): Promise<IGDBGame[]> {
    console.log("Searching for games with term:", searchTerm);
    const query = `
      ${searchTerm ? `search "${searchTerm}";` : ''}
      fields name,cover.url,summary,rating,first_release_date,genres.name;
      where version_parent = null;
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
    const query = `
      fields name,cover.url,summary,rating,first_release_date,genres.name;
      where rating != null & version_parent = null;
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

  async getGameDetails(gameId: number): Promise<IGDBGame> {
    console.log("Fetching game details for ID:", gameId);
    const query = `
      fields name,cover.url,summary,rating,first_release_date,genres.name;
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

      console.log("Game details result:", data[0]);
      return data[0];
    } catch (err) {
      console.error('Failed to fetch game details:', err);
      throw err;
    }
  },
};
