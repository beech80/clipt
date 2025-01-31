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

export const igdbService = {
  async searchGames(searchTerm: string): Promise<IGDBGame[]> {
    const query = `
      search "${searchTerm}";
      fields name,cover.url,summary,rating,first_release_date,genres.name;
      where version_parent = null;
      limit 10;
    `;

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

    return data;
  },

  async getPopularGames(): Promise<IGDBGame[]> {
    const query = `
      fields name,cover.url,summary,rating,first_release_date,genres.name;
      where rating != null & version_parent = null;
      sort rating desc;
      limit 10;
    `;

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

    return data;
  },

  async getGameDetails(gameId: number): Promise<IGDBGame> {
    const query = `
      fields name,cover.url,summary,rating,first_release_date,genres.name;
      where id = ${gameId};
    `;

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

    return data[0];
  },
};