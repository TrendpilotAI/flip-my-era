
import { supabase } from '@/integrations/supabase/client';

export const saveStory = async (story: string, name: string, date?: Date, prompt?: string) => {
  const { data, error } = await supabase
    .from('stories')
    .insert({
      name,
      birth_date: date?.toISOString(),
      initial_story: story,
      prompt: prompt
    })
    .select()
    .single();

  if (error) {
    console.error("Error saving story:", error);
    throw error;
  }

  return data;
};
