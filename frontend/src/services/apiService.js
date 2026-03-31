import { PROFILE_DATA, SOCIAL_LINKS, EXPERIENCE_DATA, EDUCATION_DATA, SKILLS_DATA, VENTURES_DATA, OTHER_ACHIEVEMENTS_DATA, WHITE_PAPERS_DATA } from '../constants';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Helper to get auth headers
const getAuthHeaders = () => {
  const authToken = localStorage.getItem('adminAuth');
  return authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
};

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    // Add auth headers for write operations
    const isWriteOperation = options.method && ['POST', 'PUT', 'DELETE'].includes(options.method.toUpperCase());
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // Add authorization header for write operations
    if (isWriteOperation) {
      Object.assign(headers, getAuthHeaders());
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error);
    throw error;
  }
};

// Check if data needs migration
let migrationChecked = false;

const checkAndMigrate = async () => {
  if (migrationChecked) return;
  
  try {
    // Check if profile exists
    const profile = await apiCall('/api/profile');
    migrationChecked = true;
  } catch (error) {
    // Profile doesn't exist, migrate data
    console.log('Migrating data from constants to database...');
    
    const migrationData = {
      profile: {
        ...PROFILE_DATA,
        linkedin: SOCIAL_LINKS.linkedin,
        github: SOCIAL_LINKS.github,
        email: SOCIAL_LINKS.email,
      },
      experience: EXPERIENCE_DATA,
      education: EDUCATION_DATA,
      skills: SKILLS_DATA,
      ventures: VENTURES_DATA,
      achievements: OTHER_ACHIEVEMENTS_DATA,
      whitepapers: WHITE_PAPERS_DATA,
    };
    
    try {
      await apiCall('/api/migrate', {
        method: 'POST',
        body: JSON.stringify(migrationData),
      });
      console.log('Data migration successful!');
      migrationChecked = true;
    } catch (migError) {
      console.error('Migration failed:', migError);
    }
  }
};

// Call migration check on module load
checkAndMigrate();

// ==================== PROFILE ====================
export const getProfile = async () => {
  await checkAndMigrate();
  return await apiCall('/api/profile');
};

export const updateProfile = async (profileData) => {
  return await apiCall('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
};

// ==================== EXPERIENCE ====================
export const getExperience = async () => {
  await checkAndMigrate();
  return await apiCall('/api/experience');
};

export const createExperience = async (experienceData) => {
  return await apiCall('/api/experience', {
    method: 'POST',
    body: JSON.stringify(experienceData),
  });
};

export const updateExperience = async (id, experienceData) => {
  return await apiCall(`/api/experience/${id}`, {
    method: 'PUT',
    body: JSON.stringify(experienceData),
  });
};

export const deleteExperience = async (id) => {
  return await apiCall(`/api/experience/${id}`, {
    method: 'DELETE',
  });
};

// ==================== EDUCATION ====================
export const getEducation = async () => {
  await checkAndMigrate();
  return await apiCall('/api/education');
};

export const createEducation = async (educationData) => {
  return await apiCall('/api/education', {
    method: 'POST',
    body: JSON.stringify(educationData),
  });
};

export const updateEducation = async (id, educationData) => {
  return await apiCall(`/api/education/${id}`, {
    method: 'PUT',
    body: JSON.stringify(educationData),
  });
};

export const deleteEducation = async (id) => {
  return await apiCall(`/api/education/${id}`, {
    method: 'DELETE',
  });
};

// ==================== SKILLS ====================
export const getSkills = async () => {
  await checkAndMigrate();
  return await apiCall('/api/skills');
};

export const createSkillCategory = async (skillData) => {
  return await apiCall('/api/skills', {
    method: 'POST',
    body: JSON.stringify(skillData),
  });
};

export const updateSkillCategory = async (id, skillData) => {
  return await apiCall(`/api/skills/${id}`, {
    method: 'PUT',
    body: JSON.stringify(skillData),
  });
};

export const deleteSkillCategory = async (id) => {
  return await apiCall(`/api/skills/${id}`, {
    method: 'DELETE',
  });
};

// ==================== VENTURES ====================
export const getVentures = async () => {
  await checkAndMigrate();
  return await apiCall('/api/ventures');
};

export const createVenture = async (ventureData) => {
  return await apiCall('/api/ventures', {
    method: 'POST',
    body: JSON.stringify(ventureData),
  });
};

export const updateVenture = async (id, ventureData) => {
  return await apiCall(`/api/ventures/${id}`, {
    method: 'PUT',
    body: JSON.stringify(ventureData),
  });
};

export const deleteVenture = async (id) => {
  return await apiCall(`/api/ventures/${id}`, {
    method: 'DELETE',
  });
};

// ==================== ACHIEVEMENTS ====================
export const getAchievements = async () => {
  await checkAndMigrate();
  return await apiCall('/api/achievements');
};

export const updateAchievements = async (achievementsData) => {
  return await apiCall('/api/achievements', {
    method: 'PUT',
    body: JSON.stringify(achievementsData),
  });
};

// ==================== WHITE PAPERS ====================
export const getWhitePapers = async () => {
  await checkAndMigrate();
  return await apiCall('/api/whitepapers');
};

export const createWhitePaper = async (paperData) => {
  return await apiCall('/api/whitepapers', {
    method: 'POST',
    body: JSON.stringify(paperData),
  });
};

export const updateWhitePaper = async (id, paperData) => {
  return await apiCall(`/api/whitepapers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(paperData),
  });
};

export const deleteWhitePaper = async (id) => {
  return await apiCall(`/api/whitepapers/${id}`, {
    method: 'DELETE',
  });
};

// ==================== APPOINTMENTS ====================
export const getAppointments = async () => {
  return await apiCall('/api/appointments');
};

export const createAppointment = async (appointmentData) => {
  return await apiCall('/api/appointments', {
    method: 'POST',
    body: JSON.stringify(appointmentData),
  });
};

export const updateAppointment = async (id, appointmentData) => {
  return await apiCall(`/api/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(appointmentData),
  });
};

export const deleteAppointment = async (id) => {
  return await apiCall(`/api/appointments/${id}`, {
    method: 'DELETE',
  });
};

// ==================== ANALYTICS ====================
export const getAnalytics = async () => {
  return await apiCall('/api/analytics');
};

export const trackEvent = async (eventType) => {
  try {
    await apiCall('/api/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ event_type: eventType }),
    });
  } catch (error) {
    // Silently fail for analytics
    console.warn('Analytics tracking failed:', error);
  }
};

// ==================== THEME ====================
export const getTheme = async () => {
  return await apiCall('/api/theme');
};

export const updateTheme = async (themeData) => {
  return await apiCall('/api/theme', {
    method: 'POST',
    body: JSON.stringify(themeData),
  });
};

// ==================== SYSTEM STATUS ====================
export const getSystemStatus = async () => {
  return await apiCall('/api/system-status');
};

// ==================== BLOG POSTS ====================
export const getBlogs = async (status = null, category = null, limit = null) => {
  let url = '/api/blogs?';
  if (status) url += `status=${status}&`;
  if (category) url += `category=${category}&`;
  if (limit) url += `limit=${limit}`;
  return await apiCall(url);
};

export const getBlog = async (id) => {
  return await apiCall(`/api/blogs/${id}`);
};

export const createBlog = async (blogData) => {
  return await apiCall('/api/blogs', {
    method: 'POST',
    body: JSON.stringify(blogData),
  });
};

export const updateBlog = async (id, blogData) => {
  return await apiCall(`/api/blogs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(blogData),
  });
};

export const deleteBlog = async (id) => {
  return await apiCall(`/api/blogs/${id}`, {
    method: 'DELETE',
  });
};

export const generateBlogWithAI = async (topic, category, tone = 'professional', length = 'medium') => {
  return await apiCall('/api/blogs/generate', {
    method: 'POST',
    body: JSON.stringify({ topic, category, tone, length }),
  });
};

// ==================== SECTION VISIBILITY ====================
export const getSectionVisibility = async () => {
  return await apiCall('/api/section-visibility');
};

export const updateSectionVisibility = async (sections) => {
  return await apiCall('/api/admin/section-visibility', {
    method: 'POST',
    body: JSON.stringify({ sections }),
  });
};

export const getPortfolioSettings = async () => {
  return await apiCall('/api/admin/portfolio-settings');
};

export const updatePortfolioSettings = async (settings) => {
  return await apiCall('/api/admin/portfolio-settings', {
    method: 'POST',
    body: JSON.stringify(settings),
  });
};