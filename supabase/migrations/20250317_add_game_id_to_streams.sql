-- Add game_id column to streams table
ALTER TABLE streams 
ADD COLUMN game_id UUID REFERENCES games(id);
