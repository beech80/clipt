export interface Game {
  id: number;
  name: string;
  cover_url?: string;
  summary?: string;
  first_release_date?: string;
  genres?: string[] | { id: number; name: string }[];
  platforms?: string[] | { id: number; name: string }[];
  developers?: string[] | { id: number; name: string }[];
  rating?: number;
  rating_count?: number;
  aggregated_rating?: number;
  aggregated_rating_count?: number;
  total_rating?: number;
  total_rating_count?: number;
  similar_games?: Game[];
  screenshots?: { id: number; url: string }[];
  videos?: { id: number; video_id: string }[];
}

export interface GameSearchResult {
  id: number;
  name: string;
  cover?: {
    id: number;
    url: string;
  };
  first_release_date?: number;
}
