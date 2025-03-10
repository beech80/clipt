-- This function aggregates trophy counts from both clip_votes and post_votes tables
CREATE OR REPLACE FUNCTION get_post_trophy_count(post_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    total_count INTEGER;
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM clip_votes WHERE post_id = post_id_param) +
        (SELECT COUNT(*) FROM post_votes WHERE post_id = post_id_param)
    INTO total_count;
    
    RETURN total_count;
END;
$$ LANGUAGE plpgsql;
