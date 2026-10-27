import { supabase } from '@/integrations/supabase/client';
export { supabase };

// Database provisioning belongs to reviewed migrations, never browser requests.
export const checkTableExists = async (tableName: 'messages') => {
  if (tableName !== 'messages') throw new Error('Unsupported messaging table');
  const { error } = await supabase.from('messages').select('id').limit(1);
  if (error) throw error;
  return true;
};
