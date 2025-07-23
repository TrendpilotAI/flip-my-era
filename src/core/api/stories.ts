const SUPABASE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stories`;

export interface Story {
  id: string;
  user_id: string;
  name: string;
  title?: string;
  initial_story: string;
  prompt?: string;
  birth_date?: string;
  personality_type?: string;
  era?: string;
  location?: string;
  gender?: string;
  transformed_name?: string;
  prompt_data?: any;
  generation_settings?: any;
  word_count?: number;
  reading_time_minutes?: number;
  content_rating?: string;
  tags?: string[];
  status?: string;
  generation_started_at?: string;
  generation_completed_at?: string;
  view_count?: number;
  like_count?: number;
  share_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateStoryData {
  name: string;
  title?: string;
  initial_story: string;
  prompt?: string;
  birth_date?: string;
  personality_type?: string;
  era?: string;
  location?: string;
  gender?: string;
  transformed_name?: string;
  prompt_data?: any;
  generation_settings?: any;
  word_count?: number;
  reading_time_minutes?: number;
  content_rating?: string;
  tags?: string[];
  status?: string;
}

class StoriesAPI {
  private async getAuthHeaders(token: string): Promise<HeadersInit> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  async getStories(token: string): Promise<Story[]> {
    try {
      const headers = await this.getAuthHeaders(token);
      const response = await fetch(`${SUPABASE_FUNCTION_URL}/stories`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.stories || [];
    } catch (error) {
      console.error('Error fetching stories:', error);
      throw error;
    }
  }

  async getStory(id: string, token: string): Promise<Story> {
    try {
      const headers = await this.getAuthHeaders(token);
      const response = await fetch(`${SUPABASE_FUNCTION_URL}/${id}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.story;
    } catch (error) {
      console.error('Error fetching story:', error);
      throw error;
    }
  }

  async createStory(storyData: CreateStoryData, token: string): Promise<Story> {
    try {
      const headers = await this.getAuthHeaders(token);
      const response = await fetch(`${SUPABASE_FUNCTION_URL}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(storyData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.story;
    } catch (error) {
      console.error('Error creating story:', error);
      throw error;
    }
  }

  async updateStory(id: string, storyData: Partial<CreateStoryData>, token: string): Promise<Story> {
    try {
      const headers = await this.getAuthHeaders(token);
      const response = await fetch(`${SUPABASE_FUNCTION_URL}/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(storyData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.story;
    } catch (error) {
      console.error('Error updating story:', error);
      throw error;
    }
  }

  async deleteStory(id: string, token: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders(token);
      const response = await fetch(`${SUPABASE_FUNCTION_URL}/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  }
}

export const storiesAPI = new StoriesAPI(); 