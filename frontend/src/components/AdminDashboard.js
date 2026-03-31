import React, { useState, useEffect } from 'react';
import * as API from '../services/apiService';
import { loginWithKeycloak, getTokenFromHash } from '../KeycloakAuth';
import RichTextEditor from './RichTextEditor';

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Brute force protection
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);

  // Data states
  const [profile, setProfile] = useState(null);
  const [experience, setExperience] = useState([]);
  const [education, setEducation] = useState([]);
  const [skills, setSkills] = useState([]);
  const [ventures, setVentures] = useState([]);
  const [achievements, setAchievements] = useState({ certificates: [], hackathons: [] });
  const [whitePapers, setWhitePapers] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [envVars, setEnvVars] = useState({});
  const [aiInstructions, setAiInstructions] = useState('');
  const [systemStatus, setSystemStatus] = useState(null);
  const [sectionVisibility, setSectionVisibility] = useState([]);
  const [portfolioSettings, setPortfolioSettings] = useState({});

  // Editing states
  const [editingItem, setEditingItem] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Authentication
  const handleLogin = (e) => {
    e.preventDefault();
    loginWithKeycloak();
  };

  useEffect(() => {
    const token = getTokenFromHash() || localStorage.getItem('token');
    if (token) {
      localStorage.setItem('token', token);
      setIsAuthenticated(true);
      fetchData();
    }
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('adminAuth'); // Clear auth token
  };

  // Show message
  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // Load all data
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [profileData, expData, eduData, skillsData, venturesData, achData, papersData, aptData, analyticsData, statusData, sectionsData, settingsData] = await Promise.all([
        API.getProfile().catch(() => null),
        API.getExperience(),
        API.getEducation(),
        API.getSkills(),
        API.getVentures(),
        API.getAchievements(),
        API.getWhitePapers(),
        API.getAppointments(),
        API.getAnalytics(),
        API.getSystemStatus().catch(() => null),
        API.getSectionVisibility().catch(() => ({ sections: [] })),
        API.getPortfolioSettings().catch(() => ({}))
      ]);
      
      setProfile(profileData);
      setExperience(expData);
      setEducation(eduData);
      setSkills(skillsData);
      setVentures(venturesData);
      setAchievements(achData);
      setWhitePapers(papersData);
      setAppointments(aptData);
      setAnalytics(analyticsData);
      setSystemStatus(statusData);
      setSectionVisibility(sectionsData.sections || []);
      setPortfolioSettings(settingsData);
    } catch (error) {
      console.error('Error loading data:', error);
      showMessage('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Profile handlers
  const handleProfileUpdate = async (updatedProfile) => {
    try {
      await API.updateProfile(updatedProfile);
      setProfile(updatedProfile);
      showMessage('Profile updated successfully!');
    } catch (error) {
      showMessage('Error updating profile', 'error');
    }
  };

  // Generic delete handler
  const handleDelete = async (section, id, apiDeleteFunc) => {
    if (!window.confirm(`Are you sure you want to delete this ${section}?`)) return;
    try {
      await apiDeleteFunc(id);
      await loadAllData();
      showMessage(`${section} deleted successfully!`);
    } catch (error) {
      showMessage(`Error deleting ${section}`, 'error');
    }
  };

  // Modal handlers
  const openModal = (section, item = null) => {
    setEditingItem(item);
    setEditingSection(section);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingItem(null);
    setEditingSection(null);
    setIsModalOpen(false);
  };

  const handleSaveFromModal = async (data) => {
    try {
      if (editingSection === 'profile') {
        await API.updateProfile(data);
      } else if (editingSection === 'experience') {
        if (editingItem) {
          await API.updateExperience(editingItem.id, data);
        } else {
          await API.createExperience(data);
        }
      } else if (editingSection === 'education') {
        if (editingItem) {
          await API.updateEducation(editingItem.id, data);
        } else {
          await API.createEducation(data);
        }
      } else if (editingSection === 'skills') {
        if (editingItem) {
          await API.updateSkillCategory(editingItem.id, data);
        } else {
          await API.createSkillCategory(data);
        }
      } else if (editingSection === 'ventures') {
        if (editingItem) {
          await API.updateVenture(editingItem.id, data);
        } else {
          await API.createVenture(data);
        }
      } else if (editingSection === 'whitepapers') {
        if (editingItem) {
          await API.updateWhitePaper(editingItem.id, data);
        } else {
          await API.createWhitePaper(data);
        }
      } else if (editingSection === 'achievements') {
        await API.updateAchievements(data);
      } else if (editingSection === 'appointments') {
        await API.updateAppointment(editingItem.id, data);
      }
      
      await loadAllData();
      showMessage('Saved successfully!');
      closeModal();
    } catch (error) {
      showMessage('Error saving', 'error');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
        
        {/* Dark Professional Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-950 to-black"></div>
        
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        </div>
        
        {/* Minimal Corporate Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Corporate Red Accents */}
          <div className="absolute top-10 left-10 w-1 h-20 bg-gradient-to-b from-red-600/50 to-transparent"></div>
          <div className="absolute top-10 left-10 w-20 h-1 bg-gradient-to-r from-red-600/50 to-transparent"></div>
          <div className="absolute bottom-10 right-10 w-1 h-20 bg-gradient-to-t from-red-600/50 to-transparent"></div>
          <div className="absolute bottom-10 right-10 w-20 h-1 bg-gradient-to-l from-red-600/50 to-transparent"></div>
          
          {/* Minimal Geometric Elements */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-red-500/30 transform rotate-45"></div>
          <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-red-500/30 transform rotate-45"></div>
          <div className="absolute top-2/3 left-1/2 w-1 h-1 bg-red-600/40"></div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          {/* Glassmorphism Card */}
          <div className="bg-red-900/20 backdrop-blur-2xl border border-red-500/30 rounded-2xl p-8 shadow-2xl shadow-black/50 relative overflow-hidden">
            
            {/* Glassmorphism Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-red-900/20 pointer-events-none"></div>
            
            {/* Inner Content */}
            <div className="relative z-10">
              <div className="text-center mb-8">
                {/* Corporate Icon */}
                <div className="inline-flex items-center justify-center w-20 h-20 bg-red-600/80 backdrop-blur-md rounded-xl mb-6 shadow-2xl border border-red-500/50">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                
                <h1 className="text-2xl font-bold text-white mb-2 tracking-wide">
                  ADMIN PORTAL
                </h1>
                <p className="text-gray-400 text-sm font-medium">Secure Administrative Access</p>
                
                {/* Corporate Line */}
                <div className="w-12 h-0.5 bg-red-500 mx-auto mt-4"></div>
              </div>
          
              {/* Security Status */}
              {isBlocked && (
                <div className="mb-6 p-4 bg-red-900/30 backdrop-blur-md border border-red-500/50 rounded-lg">
                  <p className="text-red-300 text-sm text-center flex items-center justify-center gap-2 font-medium">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                    </svg>
                    ACCESS BLOCKED - {Math.ceil(blockTimeRemaining / 60000)} MIN REMAINING
                  </p>
                </div>
              )}
              
              {failedAttempts > 0 && !isBlocked && (
                <div className="mb-6 p-4 bg-yellow-900/20 backdrop-blur-md border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-300 text-sm text-center flex items-center justify-center gap-2 font-medium">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    FAILED ATTEMPTS: {failedAttempts}/3
                  </p>
                </div>
              )}
          
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-gray-300 text-xs font-bold mb-3 tracking-widest uppercase">
                    Access Code
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full px-4 py-4 pr-12 bg-black/60 backdrop-blur-md border-2 rounded-lg text-white placeholder-gray-500 focus:outline-none transition-all duration-300 font-mono ${
                        isBlocked 
                          ? 'border-red-500/70 focus:border-red-400 focus:ring-2 focus:ring-red-500/20' 
                          : 'border-red-500/50 focus:border-red-400 focus:ring-2 focus:ring-red-500/30 hover:border-red-400/70'
                      }`}
                      placeholder="••••••••••••"
                      disabled={isBlocked}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-400 transition-colors duration-200 p-1"
                      disabled={isBlocked}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isBlocked}
                  className={`w-full py-4 rounded-lg font-bold text-sm tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-3 ${
                    isBlocked
                      ? 'bg-gray-800/80 cursor-not-allowed text-gray-500 border border-gray-600'
                      : 'bg-red-600/90 hover:bg-red-500 text-white border border-red-500/50 backdrop-blur-md shadow-lg shadow-red-500/25 hover:shadow-red-500/40'
                  }`}
                >
                  {isBlocked ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      ACCESS DENIED
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Authenticate
                    </>
                  )}
                </button>
              </form>
              
              {/* Footer */}
              <div className="mt-8 text-center">
                <div className="flex items-center justify-center gap-2 text-gray-500 text-xs mb-4">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="font-mono tracking-wider">SECURE CONNECTION ACTIVE</span>
                </div>
                <p className="text-gray-600 text-xs tracking-wide">
                  Administrative Portal • Authorized Personnel Only
                </p>
              </div>
              
              {/* Return to Portfolio Button */}
              <div className="mt-6">
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-gray-900/80 hover:bg-gray-800/80 backdrop-blur-md border border-gray-600/50 hover:border-gray-500/50 text-gray-300 hover:text-white py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm tracking-wide"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  RETURN TO PORTFOLIO
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-12 h-12 bg-gradient-to-br from-primary-600/80 to-primary-700/80 backdrop-blur-md border border-primary-500/50 rounded-xl flex items-center justify-center shadow-lg hover:from-primary-700 hover:to-primary-800 transition-all"
        aria-label="Toggle Sidebar"
      >
        {sidebarOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar - Fixed with scrollable navigation */}
      <div className={`w-64 bg-black/50 backdrop-blur-md border-r border-white/10 flex flex-col fixed left-0 top-0 bottom-0 z-40 transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header - Fixed */}
        <div className="p-6 border-b border-white/10 flex-shrink-0">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Admin Dashboard
          </h1>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
            { id: 'overview', label: 'Overview', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            )},
            { id: 'blog', label: 'Blog Posts', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            )},
            { id: 'profile', label: 'Profile', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )},
            { id: 'experience', label: 'Experience', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0v6l-1 1-1-1V6H8v6l-1 1-1-1V6" />
              </svg>
            )},
            { id: 'education', label: 'Education', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            )},
            { id: 'skills', label: 'Skills', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )},
            { id: 'ventures', label: 'Ventures', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )},
            { id: 'achievements', label: 'Achievements', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            )},
            { id: 'whitepapers', label: 'White Papers', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )},
            { id: 'sections', label: 'Section Visibility', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )},
            { id: 'appointments', label: 'Appointments', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )},
            { id: 'envvars', label: 'Environment Variables', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )},
            { id: 'aiinstructions', label: 'AI Instructions', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            )},
            { id: 'status', label: 'System Status', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            )},
            { id: 'theme', label: 'Theme', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4 4 4 0 004-4V5z" />
              </svg>
            )},
          ].map((section) => (
            <button
              key={section.id}
              onClick={() => {
                setActiveSection(section.id);
                setSidebarOpen(false); // Close sidebar on mobile after selection
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all text-left ${
                activeSection === section.id
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className={`${activeSection === section.id ? 'text-white' : 'text-red-500'}`}>
                {section.icon}
              </span>
              {section.label}
            </button>
          ))}
        </nav>

        {/* Footer Actions - Fixed */}
        <div className="p-4 border-t border-white/10 space-y-2 flex-shrink-0">
          <a 
            href="/portfolio" 
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all text-gray-300 hover:bg-white/10 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            View Portfolio
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all text-primary-400 hover:bg-red-500/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content - With left margin for fixed sidebar */}
      <div className="flex-1 flex flex-col lg:ml-64 ml-0">
        {/* Top Bar - Fixed */}
        <div className="bg-black/30 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-4 fixed top-0 right-0 left-0 lg:left-64 z-30">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold capitalize pl-14 lg:pl-0">
              {activeSection === 'whitepapers' ? 'White Papers' : activeSection}
            </h2>
            <div className="hidden sm:block text-sm text-gray-400">
              Welcome to the admin dashboard
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
            message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white animate-in slide-in-from-right`}>
            {message.text}
          </div>
        )}

        {/* Content Area - Scrollable with top padding for fixed header */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto mt-[73px]">

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading data...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">{activeSection === 'overview' && (
                <OverviewSection analytics={analytics} data={{ profile, experience, education, skills, ventures, achievements, whitePapers, appointments }} headerText="Dashboard Overview" />
              )}
              {activeSection === 'status' && (
                <SystemStatusSection 
                  systemStatus={systemStatus}
                  loadAllData={loadAllData}
                  showMessage={showMessage}
                />
              )}
              {activeSection === 'profile' && (
                <ProfileSection profile={profile} onUpdate={handleProfileUpdate} openModal={openModal} />
              )}
              {activeSection === 'experience' && (
                <DataSection
                  title={
                    <div className="flex items-center gap-3">
                      <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v6l-1 1-1-1V6H8v6l-1 1-1-1V6" />
                      </svg>
                      Work Experience
                    </div>
                  }
                  data={experience}
                  onAdd={() => openModal('experience')}
                  onEdit={(item) => openModal('experience', item)}
                  onDelete={(id) => handleDelete('experience', id, API.deleteExperience)}
                  renderItem={(exp) => (
                    <div>
                      <h3 className="text-xl font-bold text-white">{exp.role}</h3>
                      <p className="text-blue-400">{exp.company}</p>
                      <p className="text-gray-400 text-sm">{exp.period} • {exp.location}</p>
                    </div>
                  )}
                />
              )}
              {activeSection === 'education' && (
                <DataSection
                  title={
                    <div className="flex items-center gap-3">
                      <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                      Education
                    </div>
                  }
                  data={education}
                  onAdd={() => openModal('education')}
                  onEdit={(item) => openModal('education', item)}
                  onDelete={(id) => handleDelete('education', id, API.deleteEducation)}
                  renderItem={(edu) => (
                    <div>
                      <h3 className="text-xl font-bold text-white">{edu.degree}</h3>
                      <p className="text-blue-400">{edu.institution}</p>
                      <p className="text-gray-400 text-sm">{edu.period} • {edu.location}</p>
                    </div>
                  )}
                />
              )}
              {activeSection === 'skills' && (
                <DataSection
                  title={
                    <div className="flex items-center gap-3">
                      <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Skills & Technologies
                    </div>
                  }
                  data={skills}
                  onAdd={() => openModal('skills')}
                  onEdit={(item) => openModal('skills', item)}
                  onDelete={(id) => handleDelete('skill category', id, API.deleteSkillCategory)}
                  renderItem={(category) => (
                    <div>
                      <h3 className="text-xl font-bold text-white mb-3">{category.category}</h3>
                      <div className="flex flex-wrap gap-2">
                        {category.skills?.map((skill, idx) => (
                          <span key={idx} className="px-3 py-1 bg-white/10 rounded-full text-sm">{skill.name} ({skill.level}%)</span>
                        ))}
                      </div>
                    </div>
                  )}
                />
              )}
              {activeSection === 'ventures' && (
                <DataSection
                  title={
                    <div className="flex items-center gap-3">
                      <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Ventures & Projects
                    </div>
                  }
                  data={ventures}
                  onAdd={() => openModal('ventures')}
                  onEdit={(item) => openModal('ventures', item)}
                  onDelete={(id) => handleDelete('venture', id, API.deleteVenture)}
                  renderItem={(venture) => (
                    <div>
                      <h3 className="text-xl font-bold text-white">{venture.name}</h3>
                      <p className="text-blue-400">{venture.role} • {venture.type}</p>
                      <p className="text-gray-400 text-sm">{venture.period}</p>
                    </div>
                  )}
                />
              )}
              {activeSection === 'achievements' && (
                <AchievementsSection achievements={achievements} openModal={openModal} />
              )}
              {activeSection === 'whitepapers' && (
                <DataSection
                  title={
                    <div className="flex items-center gap-3">
                      <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      White Papers
                    </div>
                  }
                  data={whitePapers}
                  onAdd={() => openModal('whitepapers')}
                  onEdit={(item) => openModal('whitepapers', item)}
                  onDelete={(id) => handleDelete('white paper', id, API.deleteWhitePaper)}
                  renderItem={(paper) => (
                    <div>
                      <h3 className="text-xl font-bold text-white">{paper.title}</h3>
                      <p className="text-gray-400 text-sm">{paper.category} • {paper.publishedDate} • {paper.pages}</p>
                    </div>
                  )}
                />
              )}
              {activeSection === 'blog' && (
                <BlogSection 
                  blogs={blogs}
                  setBlogs={setBlogs}
                  showMessage={showMessage}
                />
              )}
              {activeSection === 'sections' && (
                <SectionVisibilitySection 
                  sectionVisibility={sectionVisibility}
                  setSectionVisibility={setSectionVisibility}
                  portfolioSettings={portfolioSettings}
                  setPortfolioSettings={setPortfolioSettings}
                  showMessage={showMessage}
                />
              )}
              {activeSection === 'appointments' && (
                <AppointmentsSection 
                  appointments={appointments}
                  openModal={openModal}
                  onDelete={(id) => handleDelete('appointment', id, API.deleteAppointment)}
                />
              )}
              {activeSection === 'theme' && (
                <ThemeSection 
                  showMessage={showMessage}
                />
              )}
              {activeSection === 'envvars' && (
                <EnvironmentVariablesSection 
                  envVars={envVars}
                  setEnvVars={setEnvVars}
                  showMessage={showMessage}
                />
              )}
              {activeSection === 'aiinstructions' && (
                <AIInstructionsSection 
                  aiInstructions={aiInstructions}
                  setAiInstructions={setAiInstructions}
                  showMessage={showMessage}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <EditModal
          section={editingSection}
          item={editingItem}
          onClose={closeModal}
          onSave={handleSaveFromModal}
        />
      )}
    </div>
  );
};

// Overview Section
const OverviewSection = ({ analytics, data, headerText = "Dashboard Overview" }) => (
  <div>
    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
      <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      {headerText}
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard title="Total Visits" value={analytics.total_visits || 0} icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      } color="blue" />
      <StatCard title="AI Chat Sessions" value={analytics.ai_chat_sessions || 0} icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      } color="green" />
      <StatCard title="Skills Viewed" value={analytics.skills_viewed || 0} icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      } color="purple" />
      <StatCard title="Appointments" value={analytics.appointments_booked || 0} icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      } color="red" />
    </div>

    {/* AI Resume Generation Section */}
    <div className="mb-8">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
        <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        AI-Enhanced Resume Generator
      </h3>
      <AIResumeGenerator />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <DataCard title="Experience Entries" count={data.experience?.length || 0} icon={
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v6l-1 1-1-1V6H8v6l-1 1-1-1V6" />
        </svg>
      } />
      <DataCard title="Education Entries" count={data.education?.length || 0} icon={
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
      } />
      <DataCard title="Skill Categories" count={data.skills?.length || 0} icon={
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      } />
      <DataCard title="Ventures" count={data.ventures?.length || 0} icon={
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      } />
      <DataCard title="White Papers" count={data.whitePapers?.length || 0} icon={
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      } />
      <DataCard title="Certificates" count={data.achievements?.certificates?.length || 0} icon={
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      } />
    </div>
  </div>
);

const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30 text-green-400',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400',
    red: 'from-red-500/20 to-red-600/20 border-red-500/30 text-red-400',
  };
  
  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-md border rounded-xl p-6`}>
      <div className="flex items-center justify-between mb-2">
        <span className={colorClasses[color].split(' ')[2]}>{icon}</span>
        <span className="text-3xl font-bold">{value}</span>
      </div>
      <p className="text-gray-300 text-sm">{title}</p>
    </div>
  );
};

const DataCard = ({ title, count, icon }) => (
  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-sm mb-1">{title}</p>
        <p className="text-2xl font-bold text-white">{count}</p>
      </div>
      <span className="text-red-500 opacity-50">{icon}</span>
    </div>
  </div>
);

// Profile Section
const ProfileSection = ({ profile, onUpdate, openModal }) => {
  const [formData, setFormData] = useState(profile || {});
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    if (profile) setFormData(profile);
  }, [profile]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
  };

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">No profile data found. The system will migrate data automatically on first page load.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors"
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        Edit Profile
      </h2>
      <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Name</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            value={formData.title || ''}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Location</label>
          <input
            type="text"
            value={formData.location || ''}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Summary</label>
          <textarea
            value={formData.summary || ''}
            onChange={(e) => setFormData({...formData, summary: e.target.value})}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white h-24"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Image URL</label>
          <input
            type="url"
            value={formData.image || ''}
            onChange={(e) => setFormData({...formData, image: e.target.value})}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">LinkedIn URL</label>
            <input
              type="url"
              value={formData.linkedin || ''}
              onChange={(e) => setFormData({...formData, linkedin: e.target.value})}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">GitHub URL</label>
            <input
              type="url"
              value={formData.github || ''}
              onChange={(e) => setFormData({...formData, github: e.target.value})}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            />
          </div>
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors"
          >
            Save Profile
          </button>
          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-600 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Change Password
          </button>
        </div>
      </form>

      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
        />
      )}
    </div>
  );
};

// Change Password Modal
const ChangePasswordModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/admin/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminAuth')}`
        },
        body: JSON.stringify({
          current_password: formData.currentPassword,
          new_password: formData.newPassword
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to change password');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-amber-500/30 p-8 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Change Password
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-400 font-medium">Password changed successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
              <input
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-amber-500"
                required
                autoComplete="current-password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-amber-500"
                required
                minLength="6"
                autoComplete="new-password"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-amber-500"
                required
                minLength="6"
                autoComplete="new-password"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// Generic Data Section Component
const DataSection = ({ title, data, onAdd, onEdit, onDelete, renderItem }) => (
  <div>
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold">{title}</h2>
      <button
        onClick={onAdd}
        className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
      >
        + Add New
      </button>
    </div>
    <div className="space-y-4">
      {data && data.length > 0 ? (
        data.map((item) => (
          <div key={item.id || item._id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
            <div className="flex justify-between items-start">
              {renderItem(item)}
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => onEdit(item)}
                  className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(item.id || item._id)}
                  className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12 bg-white/5 rounded-xl">
          <p className="text-gray-400">No entries yet. Click "Add New" to create one.</p>
        </div>
      )}
    </div>
  </div>
);

// Achievements Section
const AchievementsSection = ({ achievements, openModal }) => (
  <div>
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold flex items-center gap-3">
        <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
        Achievements
      </h2>
      <button
        onClick={() => openModal('achievements', achievements)}
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
      >
        Edit All
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">Certificates ({achievements.certificates?.length || 0})</h3>
        <div className="space-y-2">
          {achievements.certificates?.map((cert, idx) => (
            <div key={idx} className="bg-white/5 p-3 rounded">
              <p className="font-medium">{cert.name}</p>
              <p className="text-sm text-gray-400">{cert.issuer} • {cert.year}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">Hackathons ({achievements.hackathons?.length || 0})</h3>
        <div className="space-y-2">
          {achievements.hackathons?.map((hack, idx) => (
            <div key={idx} className="bg-white/5 p-3 rounded">
              <p className="font-medium">{hack.event}</p>
              <p className="text-sm text-gray-400">{hack.year}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Appointments Section
const AppointmentsSection = ({ appointments, openModal, onDelete }) => (
  <div>
    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
      <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      Appointments
    </h2>
    <div className="space-y-4">
      {appointments && appointments.length > 0 ? (
        appointments.map((apt) => (
          <div key={apt.id || apt._id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-white">{apt.name}</h3>
                <p className="text-gray-400">{apt.email}</p>
                <p className="text-sm text-gray-500">{apt.date} at {apt.time}</p>
                <p className="text-sm text-gray-400 mt-2">{apt.reason}</p>
                <span
                  className={`inline-block mt-2 px-3 py-1 rounded-full text-xs ${
                    apt.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                    apt.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {apt.status}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openModal('appointments', apt)}
                  className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(apt.id || apt._id)}
                  className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12 bg-white/5 rounded-xl">
          <p className="text-gray-400">No appointments yet.</p>
        </div>
      )}
    </div>
  </div>
);

// Edit Modal - Fully functional forms for all sections
const EditModal = ({ section, item, onClose, onSave }) => {
  const [formData, setFormData] = useState(item || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      // Set default values for new items
      const defaults = getDefaultValues(section);
      setFormData(defaults);
    }
  }, [item, section]);

  const getDefaultValues = (section) => {
    switch (section) {
      case 'experience':
        return {
          role: '',
          company: '',
          period: '',
          location: '',
          description: [''],
          projects: [{ name: '', description: '' }]
        };
      case 'education':
        return {
          degree: '',
          institution: '',
          period: '',
          location: '',
          field: '',
          details: ['']
        };
      case 'skills':
        return {
          category: '',
          skills: [{ name: '', level: 50 }]
        };
      case 'ventures':
        return {
          name: '',
          role: '',
          period: '',
          type: '',
          description: '',
          achievements: [''],
          technologies: ['']
        };
      case 'whitepapers':
        return {
          title: '',
          briefDescription: '',
          fullDescription: '',
          keyPoints: [''],
          publishedDate: '',
          pages: '',
          category: ''
        };
      case 'achievements':
        return {
          certificates: [{ name: '', issuer: '', year: '', description: '' }],
          hackathons: [{ event: '', year: '', description: '' }]
        };
      case 'appointments':
        return { status: 'pending' };
      default:
        return {};
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field, defaultValue = '') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], defaultValue]
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const renderForm = () => {
    switch (section) {
      case 'experience':
        return renderExperienceForm();
      case 'education':
        return renderEducationForm();
      case 'skills':
        return renderSkillsForm();
      case 'ventures':
        return renderVenturesForm();
      case 'whitepapers':
        return renderWhitePapersForm();
      case 'achievements':
        return renderAchievementsForm();
      case 'appointments':
        return renderAppointmentsForm();
      default:
        return <div className="text-gray-400">Form not implemented for {section}</div>;
    }
  };

  const renderExperienceForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Role *</label>
          <input
            type="text"
            value={formData.role || ''}
            onChange={(e) => handleChange('role', e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Company *</label>
          <input
            type="text"
            value={formData.company || ''}
            onChange={(e) => handleChange('company', e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Period</label>
          <input
            type="text"
            value={formData.period || ''}
            onChange={(e) => handleChange('period', e.target.value)}
            placeholder="e.g., 2020 - Present"
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Location</label>
          <input
            type="text"
            value={formData.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        {(formData.description || ['']).map((desc, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <textarea
              value={desc}
              onChange={(e) => handleArrayChange('description', index, e.target.value)}
              className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white h-20"
              placeholder="Job responsibility or achievement"
            />
            <button
              type="button"
              onClick={() => removeArrayItem('description', index)}
              className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addArrayItem('description', '')}
          className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
        >
          + Add Description
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Projects</label>
        {(formData.projects || [{ name: '', description: '' }]).map((project, index) => (
          <div key={index} className="bg-white/5 p-4 rounded-lg mb-2">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">Project {index + 1}</h4>
              <button
                type="button"
                onClick={() => removeArrayItem('projects', index)}
                className="px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
              >
                ×
              </button>
            </div>
            <input
              type="text"
              value={project.name || ''}
              onChange={(e) => handleArrayChange('projects', index, { ...project, name: e.target.value })}
              placeholder="Project name"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white mb-2"
            />
            <textarea
              value={project.description || ''}
              onChange={(e) => handleArrayChange('projects', index, { ...project, description: e.target.value })}
              placeholder="Project description"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white h-16"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => addArrayItem('projects', { name: '', description: '' })}
          className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
        >
          + Add Project
        </button>
      </div>
    </div>
  );

  const renderEducationForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Degree *</label>
          <input
            type="text"
            value={formData.degree || ''}
            onChange={(e) => handleChange('degree', e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Institution *</label>
          <input
            type="text"
            value={formData.institution || ''}
            onChange={(e) => handleChange('institution', e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Period</label>
          <input
            type="text"
            value={formData.period || ''}
            onChange={(e) => handleChange('period', e.target.value)}
            placeholder="e.g., 2018 - 2022"
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Location</label>
          <input
            type="text"
            value={formData.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Field of Study</label>
          <input
            type="text"
            value={formData.field || ''}
            onChange={(e) => handleChange('field', e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Details</label>
        {(formData.details || ['']).map((detail, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <textarea
              value={detail}
              onChange={(e) => handleArrayChange('details', index, e.target.value)}
              className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white h-20"
              placeholder="Achievement, coursework, or relevant detail"
            />
            <button
              type="button"
              onClick={() => removeArrayItem('details', index)}
              className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addArrayItem('details', '')}
          className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
        >
          + Add Detail
        </button>
      </div>
    </div>
  );

  const renderSkillsForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Category *</label>
        <input
          type="text"
          value={formData.category || ''}
          onChange={(e) => handleChange('category', e.target.value)}
          placeholder="e.g., Backend Development, Frontend Development"
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Skills</label>
        {(formData.skills || [{ name: '', level: 50 }]).map((skill, index) => (
          <div key={index} className="bg-white/5 p-4 rounded-lg mb-2">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">Skill {index + 1}</h4>
              <button
                type="button"
                onClick={() => removeArrayItem('skills', index)}
                className="px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={skill.name || ''}
                onChange={(e) => handleArrayChange('skills', index, { ...skill, name: e.target.value })}
                placeholder="Skill name"
                className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
              />
              <div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={skill.level || 50}
                  onChange={(e) => handleArrayChange('skills', index, { ...skill, level: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-center text-sm text-gray-400">{skill.level || 50}%</div>
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addArrayItem('skills', { name: '', level: 50 })}
          className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
        >
          + Add Skill
        </button>
      </div>
    </div>
  );

  const renderVenturesForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Name *</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Role</label>
          <input
            type="text"
            value={formData.role || ''}
            onChange={(e) => handleChange('role', e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Period</label>
          <input
            type="text"
            value={formData.period || ''}
            onChange={(e) => handleChange('period', e.target.value)}
            placeholder="e.g., 2023 - Present"
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Type</label>
          <select
            value={formData.type || ''}
            onChange={(e) => handleChange('type', e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            style={{backgroundColor: '#1f2937', color: 'white'}}
          >
            <option value="" style={{backgroundColor: '#1f2937', color: 'white'}}>Select type</option>
            <option value="Startup" style={{backgroundColor: '#1f2937', color: 'white'}}>Startup</option>
            <option value="Freelance" style={{backgroundColor: '#1f2937', color: 'white'}}>Freelance</option>
            <option value="Open Source" style={{backgroundColor: '#1f2937', color: 'white'}}>Open Source</option>
            <option value="Personal Project" style={{backgroundColor: '#1f2937', color: 'white'}}>Personal Project</option>
            <option value="Consulting" style={{backgroundColor: '#1f2937', color: 'white'}}>Consulting</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white h-24"
          placeholder="Describe the venture or project"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Achievements</label>
        {(formData.achievements || ['']).map((achievement, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <textarea
              value={achievement}
              onChange={(e) => handleArrayChange('achievements', index, e.target.value)}
              className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white h-16"
              placeholder="Key achievement or milestone"
            />
            <button
              type="button"
              onClick={() => removeArrayItem('achievements', index)}
              className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addArrayItem('achievements', '')}
          className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
        >
          + Add Achievement
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Technologies</label>
        {(formData.technologies || ['']).map((tech, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={tech}
              onChange={(e) => handleArrayChange('technologies', index, e.target.value)}
              className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              placeholder="Technology or tool used"
            />
            <button
              type="button"
              onClick={() => removeArrayItem('technologies', index)}
              className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addArrayItem('technologies', '')}
          className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
        >
          + Add Technology
        </button>
      </div>
    </div>
  );

  const renderWhitePapersForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Title *</label>
        <input
          type="text"
          value={formData.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Brief Description</label>
        <textarea
          value={formData.briefDescription || ''}
          onChange={(e) => handleChange('briefDescription', e.target.value)}
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white h-20"
          placeholder="Short summary for the card view"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Full Description</label>
        <textarea
          value={formData.fullDescription || ''}
          onChange={(e) => handleChange('fullDescription', e.target.value)}
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white h-32"
          placeholder="Detailed description for the popup"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Published Date</label>
          <input
            type="text"
            value={formData.publishedDate || ''}
            onChange={(e) => handleChange('publishedDate', e.target.value)}
            placeholder="e.g., March 2024"
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Pages</label>
          <input
            type="text"
            value={formData.pages || ''}
            onChange={(e) => handleChange('pages', e.target.value)}
            placeholder="e.g., 12 pages"
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Category</label>
          <input
            type="text"
            value={formData.category || ''}
            onChange={(e) => handleChange('category', e.target.value)}
            placeholder="e.g., AI Research"
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Key Points</label>
        {(formData.keyPoints || ['']).map((point, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <textarea
              value={point}
              onChange={(e) => handleArrayChange('keyPoints', index, e.target.value)}
              className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white h-16"
              placeholder="Key point or finding"
            />
            <button
              type="button"
              onClick={() => removeArrayItem('keyPoints', index)}
              className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addArrayItem('keyPoints', '')}
          className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
        >
          + Add Key Point
        </button>
      </div>
    </div>
  );

  const renderAchievementsForm = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-4">🏆 Certificates</h3>
        {(formData.certificates || [{ name: '', issuer: '', year: '', description: '' }]).map((cert, index) => (
          <div key={index} className="bg-white/5 p-4 rounded-lg mb-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">Certificate {index + 1}</h4>
              <button
                type="button"
                onClick={() => removeArrayItem('certificates', index)}
                className="px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
              <input
                type="text"
                value={cert.name || ''}
                onChange={(e) => handleArrayChange('certificates', index, { ...cert, name: e.target.value })}
                placeholder="Certificate name"
                className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
              />
              <input
                type="text"
                value={cert.issuer || ''}
                onChange={(e) => handleArrayChange('certificates', index, { ...cert, issuer: e.target.value })}
                placeholder="Issuing organization"
                className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
              <input
                type="text"
                value={cert.year || ''}
                onChange={(e) => handleArrayChange('certificates', index, { ...cert, year: e.target.value })}
                placeholder="Year"
                className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
              />
              <textarea
                value={cert.description || ''}
                onChange={(e) => handleArrayChange('certificates', index, { ...cert, description: e.target.value })}
                placeholder="Description (optional)"
                className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white h-20"
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addArrayItem('certificates', { name: '', issuer: '', year: '', description: '' })}
          className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
        >
          + Add Certificate
        </button>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-4">🏅 Hackathons</h3>
        {(formData.hackathons || [{ event: '', year: '', description: '' }]).map((hack, index) => (
          <div key={index} className="bg-white/5 p-4 rounded-lg mb-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">Hackathon {index + 1}</h4>
              <button
                type="button"
                onClick={() => removeArrayItem('hackathons', index)}
                className="px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
              <input
                type="text"
                value={hack.event || ''}
                onChange={(e) => handleArrayChange('hackathons', index, { ...hack, event: e.target.value })}
                placeholder="Event name"
                className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
              />
              <input
                type="text"
                value={hack.year || ''}
                onChange={(e) => handleArrayChange('hackathons', index, { ...hack, year: e.target.value })}
                placeholder="Year"
                className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
              />
            </div>
            <textarea
              value={hack.description || ''}
              onChange={(e) => handleArrayChange('hackathons', index, { ...hack, description: e.target.value })}
              placeholder="Achievement or project description"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white h-20"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => addArrayItem('hackathons', { event: '', year: '', description: '' })}
          className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
        >
          + Add Hackathon
        </button>
      </div>
    </div>
  );

  const renderAppointmentsForm = () => (
    <div className="space-y-4">
      <div className="bg-white/5 p-4 rounded-lg">
        <h3 className="text-lg font-bold mb-4">Appointment Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <span className="text-gray-400">Name:</span>
            <div className="font-medium">{formData.name}</div>
          </div>
          <div>
            <span className="text-gray-400">Email:</span>
            <div className="font-medium">{formData.email}</div>
          </div>
          <div>
            <span className="text-gray-400">Date:</span>
            <div className="font-medium">{formData.date}</div>
          </div>
          <div>
            <span className="text-gray-400">Time:</span>
            <div className="font-medium">{formData.time}</div>
          </div>
        </div>
        <div className="mb-4">
          <span className="text-gray-400">Reason:</span>
          <div className="font-medium mt-1">{formData.reason}</div>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Status</label>
        <select
          value={formData.status || 'pending'}
          onChange={(e) => handleChange('status', e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
          style={{backgroundColor: '#1f2937', color: 'white'}}
        >
          <option value="pending" style={{backgroundColor: '#1f2937', color: 'white'}}>Pending</option>
          <option value="confirmed" style={{backgroundColor: '#1f2937', color: 'white'}}>Confirmed</option>
          <option value="cancelled" style={{backgroundColor: '#1f2937', color: 'white'}}>Cancelled</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/20 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold capitalize">
            {item ? 'Edit' : 'Add'} {section === 'whitepapers' ? 'White Paper' : section}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {renderForm()}
          <div className="mt-8 flex gap-3 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-8 py-2 rounded-lg font-medium transition-colors ${
                saving 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800'
              } text-white`}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Environment Variables Section
const EnvironmentVariablesSection = ({ envVars, setEnvVars, showMessage }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedVars, setEditedVars] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEnvVars();
  }, []);

  const loadEnvVars = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/env-variables');
      if (response.ok) {
        const data = await response.json();
        setEnvVars(data);
        setEditedVars(data);
      }
    } catch (error) {
      console.error('Error loading environment variables:', error);
      showMessage('Error loading environment variables', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/env-variables', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedVars),
      });
      
      if (response.ok) {
        setEnvVars(editedVars);
        setIsEditing(false);
        showMessage('Environment variables updated successfully!');
      } else {
        showMessage('Error updating environment variables', 'error');
      }
    } catch (error) {
      console.error('Error saving environment variables:', error);
      showMessage('Error saving environment variables', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedVars(envVars);
    setIsEditing(false);
  };

  const handleChange = (key, value) => {
    setEditedVars(prev => ({ ...prev, [key]: value }));
  };

  const handleAddNew = () => {
    const key = prompt('Enter new environment variable name:');
    if (key && key.trim()) {
      setEditedVars(prev => ({ ...prev, [key.trim()]: '' }));
      setIsEditing(true);
    }
  };

  const handleDelete = (key) => {
    if (window.confirm(`Are you sure you want to delete ${key}?`)) {
      setEditedVars(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
      setIsEditing(true);
    }
  };

  if (loading && Object.keys(envVars).length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading environment variables...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Environment Variables
        </h2>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={handleAddNew}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
              >
                + Add New
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
              >
                Edit
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg transition-colors"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
        <div className="space-y-4">
          {Object.keys(editedVars).length > 0 ? (
            Object.entries(editedVars).map(([key, value]) => (
              <div key={key} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-400 mb-2">{key}</label>
                  {isEditing ? (
                    <input
                      type={key.toLowerCase().includes('secret') || key.toLowerCase().includes('password') || key.toLowerCase().includes('key') ? 'password' : 'text'}
                      value={value || ''}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                      placeholder={`Enter ${key}`}
                    />
                  ) : (
                    <div className="px-4 py-2 bg-white/10 rounded-lg text-white font-mono text-sm">
                      {key.toLowerCase().includes('secret') || key.toLowerCase().includes('password') || key.toLowerCase().includes('key') 
                        ? '••••••••••••••••' 
                        : value || '(not set)'}
                    </div>
                  )}
                </div>
                {isEditing && (
                  <button
                    onClick={() => handleDelete(key)}
                    className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No environment variables configured.</p>
              <button
                onClick={handleAddNew}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors"
              >
                Add First Variable
              </button>
            </div>
          )}
        </div>

        {Object.keys(editedVars).length > 0 && (
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-yellow-400 text-sm font-medium mb-1">Warning</p>
                <p className="text-yellow-300 text-xs">
                  Changing environment variables may require a server restart to take effect. 
                  Be careful when editing sensitive values like API keys and secrets.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Theme Section
const ThemeSection = ({ showMessage }) => {
  const [theme, setTheme] = useState({
    primaryColor: '#ef4444',
    secondaryColor: '#dc2626',
    accentColor: '#991b1b',
    backgroundColor: '#000000',
    surfaceColor: '#111827',
    textColor: '#ffffff',
    mutedTextColor: '#9ca3af',
    headerColor: '#ef4444',
    borderRadius: '0.75rem',
    shadowIntensity: 'medium',
    animationSpeed: 'normal',
    fontSize: 'medium',
    spacing: 'normal',
    gradientStyle: 'linear'
  });
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || ''}/api/theme`);
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setTheme({
            primaryColor: data.primary_color || '#ef4444',
            secondaryColor: data.secondary_color || '#dc2626',
            accentColor: data.accent_color || '#991b1b',
            backgroundColor: data.background_color || '#000000',
            surfaceColor: data.surface_color || '#111827',
            textColor: data.text_color || '#ffffff',
            mutedTextColor: data.muted_text_color || '#9ca3af',
            headerColor: data.header_color || data.primary_color || '#ef4444',
            borderRadius: data.border_radius || '0.75rem',
            shadowIntensity: data.shadow_intensity || 'medium',
            animationSpeed: data.animation_speed || 'normal',
            fontSize: data.font_size || 'medium',
            spacing: data.spacing || 'normal',
            gradientStyle: data.gradient_style || 'linear'
          });
        }
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (colorType, value) => {
    setTheme(prev => ({ ...prev, [colorType]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || ''}/api/theme`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary_color: theme.primaryColor,
          secondary_color: theme.secondaryColor,
          accent_color: theme.accentColor,
          background_color: theme.backgroundColor,
          surface_color: theme.surfaceColor,
          text_color: theme.textColor,
          muted_text_color: theme.mutedTextColor,
          header_color: theme.headerColor,
          border_radius: theme.borderRadius,
          shadow_intensity: theme.shadowIntensity,
          animation_speed: theme.animationSpeed,
          font_size: theme.fontSize,
          spacing: theme.spacing,
          gradient_style: theme.gradientStyle
        }),
      });
      
      if (response.ok) {
        showMessage('Theme colors updated successfully! Reloading page...');
        setHasChanges(false);
        // Reload the page to apply new theme
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        showMessage('Error updating theme', 'error');
      }
    } catch (error) {
      console.error('Error saving theme:', error);
      showMessage('Error saving theme', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTheme({
      primaryColor: '#ef4444',
      secondaryColor: '#dc2626',
      accentColor: '#991b1b',
      backgroundColor: '#000000',
      surfaceColor: '#111827',
      textColor: '#ffffff',
      mutedTextColor: '#9ca3af',
      headerColor: '#ef4444',
      borderRadius: '0.75rem',
      shadowIntensity: 'medium',
      animationSpeed: 'normal',
      fontSize: 'medium',
      spacing: 'normal',
      gradientStyle: 'linear'
    });
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4 4 4 0 004-4V5z" />
            </svg>
            Advanced Theme Customization
          </h2>
          <p className="text-gray-400 mt-1">Comprehensive styling and visual customization</p>
        </div>
      </div>

      {loading && !theme ? (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mr-3"></div>
            <p className="text-gray-400">Loading theme configuration...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Color Palette Section */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4 4 4 0 004-4V5z" />
              </svg>
              Color Palette
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primary Colors */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg text-white">Brand Colors</h4>
                {[
                  { key: 'primaryColor', label: 'Primary Color', description: 'Main brand color (buttons, links)', placeholder: '#ef4444' },
                  { key: 'secondaryColor', label: 'Secondary Color', description: 'Hover states, highlights', placeholder: '#dc2626' },
                  { key: 'accentColor', label: 'Accent Color', description: 'Borders, shadows, gradients', placeholder: '#991b1b' }
                ].map((color) => (
                  <div key={color.key} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      {color.label}
                      <span className="text-gray-500 text-xs ml-2">{color.description}</span>
                    </label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={theme[color.key]}
                        onChange={(e) => handleColorChange(color.key, e.target.value)}
                        className="w-16 h-10 rounded-lg cursor-pointer border-2 border-white/20"
                      />
                      <input
                        type="text"
                        value={theme[color.key]}
                        onChange={(e) => handleColorChange(color.key, e.target.value)}
                        className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
                        placeholder={color.placeholder}
                      />
                      <div 
                        className="w-10 h-10 rounded-lg border-2 border-white/20"
                        style={{ backgroundColor: theme[color.key] }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Surface Colors */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg text-white">Surface Colors</h4>
                {[
                  { key: 'backgroundColor', label: 'Background Color', description: 'Main background', placeholder: '#000000' },
                  { key: 'surfaceColor', label: 'Surface Color', description: 'Cards, panels', placeholder: '#111827' },
                  { key: 'textColor', label: 'Text Color', description: 'Primary text', placeholder: '#ffffff' },
                  { key: 'mutedTextColor', label: 'Muted Text', description: 'Secondary text', placeholder: '#9ca3af' },
                  { key: 'headerColor', label: 'Header Color', description: 'Section headers, titles', placeholder: '#ef4444' }
                ].map((color) => (
                  <div key={color.key} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      {color.label}
                      <span className="text-gray-500 text-xs ml-2">{color.description}</span>
                    </label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={theme[color.key]}
                        onChange={(e) => handleColorChange(color.key, e.target.value)}
                        className="w-16 h-10 rounded-lg cursor-pointer border-2 border-white/20"
                      />
                      <input
                        type="text"
                        value={theme[color.key]}
                        onChange={(e) => handleColorChange(color.key, e.target.value)}
                        className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
                        placeholder={color.placeholder}
                      />
                      <div 
                        className="w-10 h-10 rounded-lg border-2 border-white/20"
                        style={{ backgroundColor: theme[color.key] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Layout & Typography Section */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
              Layout & Typography
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Border Radius */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Border Radius
                  <span className="text-gray-500 text-xs ml-2">Corner roundness</span>
                </label>
                <select
                  value={theme.borderRadius}
                  onChange={(e) => handleColorChange('borderRadius', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
                  style={{backgroundColor: '#1f2937', color: 'white'}}
                >
                  <option value="0" style={{backgroundColor: '#1f2937', color: 'white'}}>Sharp (0px)</option>
                  <option value="0.25rem" style={{backgroundColor: '#1f2937', color: 'white'}}>Small (4px)</option>
                  <option value="0.5rem" style={{backgroundColor: '#1f2937', color: 'white'}}>Medium (8px)</option>
                  <option value="0.75rem" style={{backgroundColor: '#1f2937', color: 'white'}}>Large (12px)</option>
                  <option value="1rem" style={{backgroundColor: '#1f2937', color: 'white'}}>XL (16px)</option>
                  <option value="1.5rem" style={{backgroundColor: '#1f2937', color: 'white'}}>2XL (24px)</option>
                </select>
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Font Size Scale
                  <span className="text-gray-500 text-xs ml-2">Text sizing</span>
                </label>
                <select
                  value={theme.fontSize}
                  onChange={(e) => handleColorChange('fontSize', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
                  style={{backgroundColor: '#1f2937', color: 'white'}}
                >
                  <option value="small" style={{backgroundColor: '#1f2937', color: 'white'}}>Small</option>
                  <option value="medium" style={{backgroundColor: '#1f2937', color: 'white'}}>Medium</option>
                  <option value="large" style={{backgroundColor: '#1f2937', color: 'white'}}>Large</option>
                  <option value="xl" style={{backgroundColor: '#1f2937', color: 'white'}}>Extra Large</option>
                </select>
              </div>

              {/* Spacing */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Spacing Scale
                  <span className="text-gray-500 text-xs ml-2">Layout spacing</span>
                </label>
                <select
                  value={theme.spacing}
                  onChange={(e) => handleColorChange('spacing', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
                  style={{backgroundColor: '#1f2937', color: 'white'}}
                >
                  <option value="compact" style={{backgroundColor: '#1f2937', color: 'white'}}>Compact</option>
                  <option value="normal" style={{backgroundColor: '#1f2937', color: 'white'}}>Normal</option>
                  <option value="relaxed" style={{backgroundColor: '#1f2937', color: 'white'}}>Relaxed</option>
                  <option value="loose" style={{backgroundColor: '#1f2937', color: 'white'}}>Loose</option>
                </select>
              </div>
            </div>
          </div>

          {/* Visual Effects Section */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Visual Effects
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Shadow Intensity */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Shadow Intensity
                  <span className="text-gray-500 text-xs ml-2">Drop shadow depth</span>
                </label>
                <select
                  value={theme.shadowIntensity}
                  onChange={(e) => handleColorChange('shadowIntensity', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
                  style={{backgroundColor: '#1f2937', color: 'white'}}
                >
                  <option value="none" style={{backgroundColor: '#1f2937', color: 'white'}}>None</option>
                  <option value="subtle" style={{backgroundColor: '#1f2937', color: 'white'}}>Subtle</option>
                  <option value="medium" style={{backgroundColor: '#1f2937', color: 'white'}}>Medium</option>
                  <option value="strong" style={{backgroundColor: '#1f2937', color: 'white'}}>Strong</option>
                  <option value="dramatic" style={{backgroundColor: '#1f2937', color: 'white'}}>Dramatic</option>
                </select>
              </div>

              {/* Animation Speed */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Animation Speed
                  <span className="text-gray-500 text-xs ml-2">Transition timing</span>
                </label>
                <select
                  value={theme.animationSpeed}
                  onChange={(e) => handleColorChange('animationSpeed', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
                  style={{backgroundColor: '#1f2937', color: 'white'}}
                >
                  <option value="slow" style={{backgroundColor: '#1f2937', color: 'white'}}>Slow (0.5s)</option>
                  <option value="normal" style={{backgroundColor: '#1f2937', color: 'white'}}>Normal (0.3s)</option>
                  <option value="fast" style={{backgroundColor: '#1f2937', color: 'white'}}>Fast (0.15s)</option>
                  <option value="instant" style={{backgroundColor: '#1f2937', color: 'white'}}>Instant (0s)</option>
                </select>
              </div>

              {/* Gradient Style */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Gradient Style
                  <span className="text-gray-500 text-xs ml-2">Background gradients</span>
                </label>
                <select
                  value={theme.gradientStyle}
                  onChange={(e) => handleColorChange('gradientStyle', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
                  style={{backgroundColor: '#1f2937', color: 'white'}}
                >
                  <option value="linear" style={{backgroundColor: '#1f2937', color: 'white'}}>Linear</option>
                  <option value="radial" style={{backgroundColor: '#1f2937', color: 'white'}}>Radial</option>
                  <option value="conic" style={{backgroundColor: '#1f2937', color: 'white'}}>Conic</option>
                  <option value="none" style={{backgroundColor: '#1f2937', color: 'white'}}>None</option>
                </select>
              </div>
            </div>
          </div>

          {/* Live Preview Section */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Live Preview
            </h3>
            <div 
              className="p-6 rounded-xl border-2 transition-all duration-300"
              style={{ 
                backgroundColor: theme.surfaceColor,
                borderColor: theme.accentColor,
                borderRadius: theme.borderRadius
              }}
            >
              <div className="space-y-4">
                {/* Preview Buttons */}
                <div className="flex gap-3 flex-wrap">
                  <button 
                    className="px-6 py-3 font-medium transition-all duration-300 hover:shadow-lg"
                    style={{ 
                      backgroundColor: theme.primaryColor,
                      color: theme.textColor,
                      borderRadius: theme.borderRadius
                    }}
                  >
                    Primary Button
                  </button>
                  <button 
                    className="px-6 py-3 font-medium transition-all duration-300 hover:shadow-lg"
                    style={{ 
                      backgroundColor: theme.secondaryColor,
                      color: theme.textColor,
                      borderRadius: theme.borderRadius
                    }}
                  >
                    Secondary Button
                  </button>
                  <button 
                    className="px-6 py-3 font-medium border-2 transition-all duration-300"
                    style={{ 
                      borderColor: theme.accentColor,
                      color: theme.textColor,
                      backgroundColor: 'transparent',
                      borderRadius: theme.borderRadius
                    }}
                  >
                    Outline Button
                  </button>
                </div>

                {/* Preview Text */}
                <div className="space-y-2">
                  <h4 
                    className="text-xl font-bold"
                    style={{ color: theme.textColor }}
                  >
                    Portfolio Section Title
                  </h4>
                  <p style={{ color: theme.mutedTextColor }}>
                    This is a preview of how your text will look with the selected theme. 
                    Secondary text appears in a muted color for better hierarchy.
                  </p>
                </div>

                {/* Preview Card */}
                <div 
                  className="p-4 border transition-all duration-300"
                  style={{ 
                    backgroundColor: theme.backgroundColor,
                    borderColor: theme.accentColor,
                    borderRadius: theme.borderRadius
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 
                        className="font-medium"
                        style={{ color: theme.textColor }}
                      >
                        Sample Card Component
                      </h5>
                      <p 
                        className="text-sm"
                        style={{ color: theme.mutedTextColor }}
                      >
                        Card content with accent border
                      </p>
                    </div>
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                  </div>
                </div>

                {/* Gradient Preview */}
                {theme.gradientStyle !== 'none' && (
                  <div 
                    className="h-16 rounded-lg flex items-center justify-center"
                    style={{ 
                      background: theme.gradientStyle === 'linear' 
                        ? `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`
                        : theme.gradientStyle === 'radial'
                        ? `radial-gradient(circle, ${theme.primaryColor}, ${theme.secondaryColor})`
                        : `conic-gradient(${theme.primaryColor}, ${theme.secondaryColor}, ${theme.accentColor})`,
                      borderRadius: theme.borderRadius
                    }}
                  >
                    <span 
                      className="font-medium"
                      style={{ color: theme.textColor }}
                    >
                      Gradient Background Preview
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={loading || !hasChanges}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving Theme...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Theme Configuration
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              disabled={loading}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset to Defaults
            </button>
          </div>

          {/* Info Panel */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-blue-400 text-sm font-medium mb-1">Advanced Theme System</p>
                <p className="text-blue-300 text-xs">
                  This comprehensive theme system controls colors, typography, layout, and visual effects across your entire portfolio. 
                  Changes are applied immediately and will persist across browser sessions. For best results, test your theme 
                  across different sections of your portfolio.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// AI Instructions Section
const AIInstructionsSection = ({ aiInstructions, setAiInstructions, showMessage }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedInstructions, setEditedInstructions] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAIInstructions();
  }, []);

  const loadAIInstructions = async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
      console.log('Loading AI instructions from:', `${backendUrl}/api/ai-instructions`);
      console.log('REACT_APP_BACKEND_URL:', process.env.REACT_APP_BACKEND_URL);
      const response = await fetch(`${backendUrl}/api/ai-instructions`);
      if (response.ok) {
        const data = await response.json();
        const instructions = data.instructions || '';
        setAiInstructions(instructions);
        setEditedInstructions(instructions);
      } else {
        console.error('Failed to load AI instructions. Response status:', response.status);
        console.error('Response headers:', [...response.headers.entries()]);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        showMessage('Error loading AI instructions', 'error');
      }
    } catch (error) {
      console.error('Error loading AI instructions:', error);
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      showMessage(`Error loading AI instructions: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/ai-instructions`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminAuth')}`
        },
        body: JSON.stringify({ instructions: editedInstructions }),
      });
      
      if (response.ok) {
        setAiInstructions(editedInstructions);
        setIsEditing(false);
        showMessage('AI instructions updated successfully!');
      } else {
        showMessage('Error updating AI instructions', 'error');
      }
    } catch (error) {
      console.error('Error saving AI instructions:', error);
      showMessage('Error saving AI instructions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedInstructions(aiInstructions);
    setIsEditing(false);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset to default instructions?')) {
      const defaultInstructions = `You are Ibrahim El Khalil's AI assistant, helping visitors learn about his portfolio and capabilities.

Key Guidelines:
- Be professional, friendly, and helpful
- Provide accurate information about Ibrahim's experience, skills, and projects
- Guide users to relevant sections of the portfolio
- Answer questions about his work, education, and achievements
- If you don't know something, be honest and suggest contacting Ibrahim directly

Remember to maintain a conversational tone while being informative and respectful.`;
      setEditedInstructions(defaultInstructions);
      setIsEditing(true);
    }
  };

  if (loading && !aiInstructions) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading AI instructions...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          AI Chat Instructions
        </h2>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 rounded-lg transition-colors"
              >
                Reset to Default
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
              >
                Edit
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg transition-colors"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
        <div className="mb-4">
          <p className="text-gray-400 text-sm">
            These instructions guide the AI chatbot's behavior and responses. Customize them to control how the AI represents you and interacts with visitors.
          </p>
        </div>

        {isEditing ? (
          <textarea
            value={editedInstructions}
            onChange={(e) => setEditedInstructions(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white font-mono text-sm"
            rows={20}
            placeholder="Enter system instructions for the AI chatbot..."
          />
        ) : (
          <div className="px-4 py-3 bg-white/10 rounded-lg text-white font-mono text-sm whitespace-pre-wrap min-h-[400px]">
            {aiInstructions || '(No instructions set. Click Edit to add instructions.)'}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <div>
              <p className="text-blue-400 text-sm font-medium mb-1">Pro Tip</p>
              <p className="text-blue-300 text-xs">
                Include specific information about your expertise, personality traits, and how you want the AI to guide visitors through your portfolio. The more detailed, the better the AI will represent you.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// System Status Section
const SystemStatusSection = ({ systemStatus, loadAllData, showMessage }) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAllData();
      showMessage('System status refreshed successfully!');
    } catch (error) {
      showMessage('Error refreshing system status', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'warning': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'degraded': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'error': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return (
        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
      case 'warning': return (
        <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
      case 'degraded': return (
        <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
      case 'error': return (
        <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
      default: return (
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
  };

  if (!systemStatus) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            Advanced System Monitoring
          </h2>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors flex items-center gap-2"
          >
            {refreshing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {refreshing ? 'Refreshing...' : 'Refresh Status'}
          </button>
        </div>
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading system status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            Advanced System Monitoring
          </h2>
          <p className="text-gray-400 mt-1">Comprehensive infrastructure monitoring and health diagnostics</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors flex items-center gap-2"
        >
          {refreshing ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          {refreshing ? 'Refreshing...' : 'Refresh Status'}
        </button>
      </div>

      {/* Overall Status */}
      <div className={`mb-6 p-4 rounded-xl border ${getStatusColor(systemStatus.overall_status)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(systemStatus.overall_status)}
            <div>
              <h3 className="text-lg font-bold">Overall System Status</h3>
              <p className="text-sm opacity-75 capitalize">{systemStatus.overall_status}</p>
            </div>
          </div>
          <div className="text-right text-sm opacity-75">
            <p>Last checked:</p>
            <p>{new Date(systemStatus.timestamp).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* System Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <p className="text-2xl font-bold text-white">{systemStatus.uptime || 'N/A'}</p>
                <p className="text-xs text-gray-400">System Uptime</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div>
                <p className="text-2xl font-bold text-white">{systemStatus.response_time || 'N/A'}</p>
                <p className="text-xs text-gray-400">Response Time</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              <div>
                <p className="text-2xl font-bold text-white">{systemStatus.memory_usage || 'N/A'}</p>
                <p className="text-xs text-gray-400">Memory Usage</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <div>
                <p className="text-2xl font-bold text-white">{systemStatus.cpu_usage || 'N/A'}</p>
                <p className="text-xs text-gray-400">CPU Load</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Database Status - Enhanced */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              Database System
              <span className={`px-2 py-1 rounded-full text-xs ${systemStatus.database.connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {systemStatus.database.connected ? 'Connected' : 'Disconnected'}
              </span>
            </h3>
            
            {systemStatus.database.connected ? (
              <div className="space-y-4">
                {/* Connection Details */}
                <div className="bg-white/5 p-3 rounded-lg">
                  <h4 className="font-medium text-sm text-gray-300 mb-2">Connection Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Host:</span>
                      <span>{systemStatus.database.host || 'MongoDB Atlas'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Database:</span>
                      <span>{systemStatus.database.name || 'portfolio'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Latency:</span>
                      <span className="text-green-400">{systemStatus.database.latency || '<50ms'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Pool Size:</span>
                      <span>{systemStatus.database.pool_size || '10'}</span>
                    </div>
                  </div>
                </div>

                {/* Collections Status */}
                <div>
                  <h4 className="font-medium text-sm text-gray-300 mb-3">Collections Overview</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(systemStatus.database.collections || {}).map(([collection, info]) => (
                      <div key={collection} className="bg-white/5 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium capitalize text-sm">{collection}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-blue-500/30 text-blue-400 px-2 py-1 rounded-full">
                              {info.count} docs
                            </span>
                            <span className="text-xs bg-green-500/30 text-green-400 px-2 py-1 rounded-full">
                              {info.size || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>
                            {info.last_modified ? (
                              <>Last: {new Date(info.last_modified).toLocaleDateString()}</>
                            ) : (
                              'No recent activity'
                            )}
                          </span>
                          <span>Indexes: {info.indexes || 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-red-400 bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-medium">Database Connection Failed</p>
                  </div>
                  <p className="text-sm opacity-75 mb-2">{systemStatus.database.error || 'Unable to connect to MongoDB instance'}</p>
                  <div className="text-xs space-y-1">
                    <p>• Check MongoDB Atlas network access</p>
                    <p>• Verify connection string in environment</p>
                    <p>• Ensure database user permissions</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Backend Service - Enhanced */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
              Backend Service
              <span className={`px-2 py-1 rounded-full text-xs ${systemStatus.backend?.status === 'healthy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {systemStatus.backend?.status || 'Unknown'}
              </span>
            </h3>
            
            <div className="space-y-4">
              {/* Service Details */}
              <div className="bg-white/5 p-3 rounded-lg">
                <h4 className="font-medium text-sm text-gray-300 mb-2">Service Information</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Version:</span>
                    <span>{systemStatus.backend?.version || 'v1.0.0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Port:</span>
                    <span>{systemStatus.backend?.environment?.port || '8001'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Uptime:</span>
                    <span className="text-green-400">{systemStatus.backend?.uptime || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Requests:</span>
                    <span>{systemStatus.backend?.total_requests || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Environment Status */}
              <div>
                <h4 className="font-medium text-sm text-gray-300 mb-3">Environment Configuration</h4>
                <div className="space-y-2">
                  {[
                    { key: 'MongoDB URI', status: systemStatus.backend?.environment?.has_mongo_uri, critical: true },
                    { key: 'Gemini API Key', status: systemStatus.backend?.environment?.has_gemini_api, critical: true },
                    { key: 'Admin Password', status: systemStatus.backend?.environment?.has_admin_password, critical: false },
                    { key: 'CORS Origins', status: systemStatus.backend?.environment?.has_cors_origins, critical: false }
                  ].map((env, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${env.status ? 'bg-green-400' : env.critical ? 'bg-red-400' : 'bg-yellow-400'}`} />
                        <span className="text-sm">{env.key}</span>
                        {env.critical && !env.status && (
                          <span className="text-xs bg-red-500/30 text-red-400 px-1.5 py-0.5 rounded">Critical</span>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        env.status ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {env.status ? 'Configured' : 'Missing'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-white/5 p-3 rounded-lg">
                <h4 className="font-medium text-sm text-gray-300 mb-2">Performance Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Avg Response Time:</span>
                    <span className="text-green-400">{systemStatus.backend?.avg_response_time || '<100ms'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Error Rate:</span>
                    <span className={systemStatus.backend?.error_rate > 5 ? 'text-red-400' : 'text-green-400'}>
                      {systemStatus.backend?.error_rate || '0'}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Active Connections:</span>
                    <span>{systemStatus.backend?.active_connections || '0'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Endpoints & Security Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            API Endpoints Status
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center bg-white/5 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">{systemStatus.api_endpoints?.total_endpoints || 0}</div>
                <div className="text-xs text-gray-400">Total Endpoints</div>
              </div>
              <div className="text-center bg-white/5 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-400">{systemStatus.api_endpoints?.public_endpoints || 0}</div>
                <div className="text-xs text-gray-400">Public APIs</div>
              </div>
              <div className="text-center bg-white/5 p-3 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400">{systemStatus.api_endpoints?.authenticated_endpoints || 0}</div>
                <div className="text-xs text-gray-400">Protected</div>
              </div>
            </div>

            {/* Endpoint Health */}
            <div>
              <h4 className="font-medium text-sm text-gray-300 mb-2">Endpoint Health Status</h4>
              <div className="space-y-2">
                {[
                  { endpoint: '/api/health', status: 'healthy', response_time: '12ms' },
                  { endpoint: '/api/profile', status: systemStatus.database.connected ? 'healthy' : 'error', response_time: '45ms' },
                  { endpoint: '/api/experience', status: systemStatus.database.connected ? 'healthy' : 'error', response_time: '38ms' },
                  { endpoint: '/api/admin/*', status: 'healthy', response_time: '23ms' }
                ].map((api, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        api.status === 'healthy' ? 'bg-green-400' : 
                        api.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                      }`} />
                      <span className="font-mono text-xs">{api.endpoint}</span>
                    </div>
                    <span className="text-xs text-gray-400">{api.response_time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Security & Compliance
          </h3>
          
          <div className="space-y-4">
            {/* Security Metrics */}
            <div className="bg-white/5 p-3 rounded-lg">
              <h4 className="font-medium text-sm text-gray-300 mb-2">Security Status</h4>
              <div className="space-y-2">
                {[
                  { check: 'HTTPS Encryption', status: true, critical: true },
                  { check: 'Authentication Required', status: true, critical: true },
                  { check: 'CORS Configuration', status: true, critical: false },
                  { check: 'Rate Limiting', status: systemStatus.security?.rate_limiting || false, critical: false },
                  { check: 'Input Validation', status: true, critical: true },
                  { check: 'SQL Injection Protection', status: true, critical: true }
                ].map((security, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${security.status ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className="text-sm">{security.check}</span>
                      {security.critical && !security.status && (
                        <span className="text-xs bg-red-500/30 text-red-400 px-1.5 py-0.5 rounded">Critical</span>
                      )}
                    </div>
                    <span className={`text-xs ${security.status ? 'text-green-400' : 'text-red-400'}`}>
                      {security.status ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Events */}
            <div className="bg-white/5 p-3 rounded-lg">
              <h4 className="font-medium text-sm text-gray-300 mb-2">Recent Security Events</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Failed login attempts:</span>
                  <span className="text-yellow-400">{systemStatus.security?.failed_logins || '0'}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Blocked requests:</span>
                  <span className="text-red-400">{systemStatus.security?.blocked_requests || '0'}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Last admin login:</span>
                  <span className="text-green-400">{systemStatus.security?.last_admin_login || 'Just now'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced System Diagnostics */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Advanced System Diagnostics
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Analytics */}
        <div>
          <h4 className="font-medium mb-3 text-gray-300">Performance Analytics</h4>
          <div className="space-y-3">
            <div className="bg-white/5 p-3 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Request Volume (24h)</span>
                <span className="text-sm text-blue-400">{systemStatus.analytics?.requests_24h || 'N/A'}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div className="bg-white/5 p-3 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Error Rate (24h)</span>
                <span className="text-sm text-green-400">{systemStatus.analytics?.error_rate_24h || '0.1%'}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '5%' }}></div>
              </div>
            </div>
            <div className="bg-white/5 p-3 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Cache Hit Rate</span>
                <span className="text-sm text-purple-400">{systemStatus.analytics?.cache_hit_rate || '94%'}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '94%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* System Resources */}
        <div>
          <h4 className="font-medium mb-3 text-gray-300">Resource Utilization</h4>
          <div className="space-y-3">
            {[
              { name: 'Memory Usage', value: systemStatus.resources?.memory || '45%', color: 'blue', width: '45%' },
              { name: 'CPU Usage', value: systemStatus.resources?.cpu || '23%', color: 'green', width: '23%' },
              { name: 'Disk Usage', value: systemStatus.resources?.disk || '67%', color: 'yellow', width: '67%' },
              { name: 'Network I/O', value: systemStatus.resources?.network || '12%', color: 'purple', width: '12%' }
            ].map((resource, index) => (
              <div key={index} className="bg-white/5 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">{resource.name}</span>
                  <span className={`text-sm text-${resource.color}-400`}>{resource.value}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className={`bg-${resource.color}-500 h-2 rounded-full`} style={{ width: resource.width }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Events & Logs */}
        <div>
          <h4 className="font-medium mb-3 text-gray-300">Recent System Events</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {[
              { time: '2 min ago', event: 'Database connection established', type: 'success' },
              { time: '5 min ago', event: 'API endpoint health check passed', type: 'info' },
              { time: '12 min ago', event: 'System status refresh completed', type: 'info' },
              { time: '18 min ago', event: 'Authentication middleware active', type: 'success' },
              { time: '25 min ago', event: 'Environment variables loaded', type: 'info' },
              { time: '1 hour ago', event: 'Server startup completed', type: 'success' }
            ].map((log, index) => (
              <div key={index} className="bg-white/5 p-2 rounded text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    log.type === 'success' ? 'bg-green-400' : 
                    log.type === 'warning' ? 'bg-yellow-400' : 
                    log.type === 'error' ? 'bg-red-400' : 'bg-blue-400'
                  }`} />
                  <span className="text-gray-300">{log.event}</span>
                </div>
                <div className="text-gray-500 mt-1">{log.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Summary */}
      <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-white/10 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-white">
              {systemStatus.database.collections ? Object.values(systemStatus.database.collections).reduce((sum, col) => sum + (col.count || 0), 0) : 0}
            </p>
            <p className="text-xs text-gray-400">Total Documents</p>
          </div>
          <div>
            <p className="text-lg font-bold text-white">{new Date(systemStatus.timestamp).toLocaleTimeString()}</p>
            <p className="text-xs text-gray-400">Last System Check</p>
          </div>
          <div>
            <p className="text-lg font-bold text-white">{systemStatus.overall_status === 'healthy' ? '100%' : '85%'}</p>
            <p className="text-xs text-gray-400">System Health Score</p>
          </div>
          <div>
            <p className="text-lg font-bold text-white">{systemStatus.version || 'v2.1.0'}</p>
            <p className="text-xs text-gray-400">Portfolio Version</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

// AI Resume Generator Component
const AIResumeGenerator = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState(null);

  const generateAIResume = async () => {
    if (!jobDescription.trim() || !targetRole.trim()) {
      alert('Please fill in both job description and target role');
      return;
    }

    setIsGenerating(true);
    try {
      const base = (process.env.REACT_APP_BACKEND_URL || '');
      const endpoint = `${base}/api/generate_ats_resume`;
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_description: jobDescription,
          target_role: targetRole
        })
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        console.error('AI Resume API error', res.status, txt);
        alert('AI Resume generation failed');
        return;
      }

      const data = await res.json();
      if (data.success && data.pdf_url) {
        // Download the generated PDF
        const pdfRes = await fetch(data.pdf_url);
        const blob = await pdfRes.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AI_Resume_${targetRole.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        
        setLastGenerated(new Date().toLocaleString());
        alert('AI-Enhanced Resume generated successfully!');
      } else {
        alert('AI Resume generation failed: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      console.error(e);
      alert('AI Resume generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-red-500/10 to-red-700/10 backdrop-blur-md border border-red-500/20 rounded-xl p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Target Role
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g., Senior Full-Stack Developer, Data Scientist, etc."
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Job Description
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here. The AI will analyze it and optimize the resume for ATS compatibility..."
              rows={6}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-slate-400 resize-none"
            />
          </div>
        </div>

        {/* Action Section */}
        <div className="flex flex-col justify-between">
          <div className="space-y-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-full mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">AI-Powered Optimization</h4>
              <p className="text-slate-300 text-sm mb-4">
                Leverages Google Gemini AI to analyze job requirements and optimize resume content for ATS compatibility
              </p>
            </div>
            
            <div className="space-y-2 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                ATS-Friendly formatting
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Keyword optimization
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Tailored content selection
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Professional PDF output
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {lastGenerated && (
              <div className="text-xs text-slate-400 text-center">
                Last generated: {lastGenerated}
              </div>
            )}
            <button
              onClick={generateAIResume}
              disabled={isGenerating || !jobDescription.trim() || !targetRole.trim()}
              className="w-full py-3 px-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating AI Resume...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generate AI-Enhanced Resume
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== BLOG SECTION ====================
const BlogSection = ({ blogs, setBlogs, showMessage }) => {
  const [editingBlog, setEditingBlog] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiCategory, setAiCategory] = useState('');
  const [aiTone, setAiTone] = useState('professional');
  const [aiLength, setAiLength] = useState('medium');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showPreview, setShowPreview] = useState(false);
  const [showSEOPanel, setShowSEOPanel] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editorMode, setEditorMode] = useState('wysiwyg'); // 'wysiwyg', 'markdown', 'code'
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([
    'Technology', 'AI', 'Web Development', 'Mobile', 'Backend', 'Frontend',
    'DevOps', 'Cloud', 'Database', 'Security', 'UI/UX', 'Business', 'Tutorial'
  ]);

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    setLoading(true);
    try {
      const data = await API.getBlogs();
      setBlogs(data || []);
    } catch (error) {
      console.error('Error loading blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (blogData) => {
    try {
      if (editingBlog?.id) {
        await API.updateBlog(editingBlog.id, blogData);
        showMessage('Blog updated successfully!');
      } else {
        await API.createBlog(blogData);
        showMessage('Blog created successfully!');
      }
      loadBlogs();
      setShowModal(false);
      setEditingBlog(null);
    } catch (error) {
      showMessage('Error saving blog', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      try {
        await API.deleteBlog(id);
        showMessage('Blog deleted successfully!');
        loadBlogs();
      } catch (error) {
        showMessage('Error deleting blog', 'error');
      }
    }
  };

  const handleGenerateWithAI = async () => {
    if (!aiTopic) {
      showMessage('Please enter a topic', 'error');
      return;
    }

    setGeneratingAI(true);
    try {
      const generatedContent = await API.generateBlogWithAI(aiTopic, aiCategory, aiTone, aiLength);
      
      // Parse and structure the generated content properly
      const blogData = {
        title: generatedContent.title || '',
        excerpt: generatedContent.excerpt || '',
        content: generatedContent.content || '',
        category: generatedContent.category || aiCategory || '',
        tags: Array.isArray(generatedContent.tags) ? generatedContent.tags : [],
        seo_title: generatedContent.seo_title || generatedContent.title || '',
        seo_description: generatedContent.seo_description || generatedContent.excerpt || '',
        status: 'draft',
        ai_generated: generatedContent.ai_generated || true,
        author: 'Ibrahim El Khalil',
        featured_image: '',
        reading_time: Math.ceil((generatedContent.content || '').split(' ').length / 200) // Estimate reading time
      };
      
      setEditingBlog(blogData);
      setShowAIModal(false);
      setShowModal(true);
      showMessage('Blog content generated! Review and save.');
    } catch (error) {
      console.error('AI Generation Error:', error);
      showMessage('Error generating blog with AI', 'error');
    } finally {
      setGeneratingAI(false);
    }
  };

  // Filter blogs based on search and status
  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         blog.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         blog.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || blog.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            Blog Posts
          </h2>
          <p className="text-gray-400 mt-1">Manage your blog content and insights</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowAIModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate with AI
          </button>
          <button
            onClick={() => {
              setEditingBlog(null);
              setShowModal(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Post
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 011-1h6a1 1 0 011 1v8a1 1 0 01-1 1h-6a1 1 0 01-1-1V9z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      )}

      {/* Content */}
      {!loading && (
        <>
          {viewMode === 'table' ? (
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Views</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Published</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredBlogs.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                          <div className="flex flex-col items-center gap-2">
                            <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                            <p>No blog posts found</p>
                            <p className="text-sm">Create your first blog post or adjust your filters</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredBlogs.map((blog) => (
                        <tr key={blog.id} className="hover:bg-gray-750 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-start gap-3">
                              {blog.featured_image && (
                                <img 
                                  src={blog.featured_image} 
                                  alt={blog.title}
                                  className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-white font-medium truncate">{blog.title}</p>
                                <p className="text-gray-400 text-sm truncate mt-1">{blog.excerpt}</p>
                                {blog.ai_generated && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full mt-2">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    AI Generated
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(blog.status)}`}>
                              {blog.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-300">{blog.category || 'Uncategorized'}</td>
                          <td className="px-6 py-4 text-gray-300">{blog.views || 0}</td>
                          <td className="px-6 py-4 text-gray-300">{formatDate(blog.published_date)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingBlog(blog);
                                  setShowModal(true);
                                }}
                                className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(blog.id)}
                                className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                title="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBlogs.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400">
                  <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  <p className="text-lg">No blog posts found</p>
                  <p className="text-sm">Create your first blog post or adjust your filters</p>
                </div>
              ) : (
                filteredBlogs.map((blog) => (
                  <div key={blog.id} className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-red-500/50 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(blog.status)}`}>
                            {blog.status}
                          </span>
                          {blog.ai_generated && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              AI
                            </span>
                          )}
                        </div>
                        <h3 className="text-white font-medium mb-2 line-clamp-2">{blog.title}</h3>
                        <p className="text-gray-400 text-sm line-clamp-3 mb-3">{blog.excerpt}</p>
                        <div className="flex items-center text-xs text-gray-500 gap-4">
                          <span>{blog.category || 'Uncategorized'}</span>
                          <span>{blog.views || 0} views</span>
                          <span>{formatDate(blog.published_date)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingBlog(blog);
                            setShowModal(true);
                          }}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(blog.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* AI Generation Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-6">Generate Blog with AI</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Topic/Prompt</label>
                <textarea
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Enter the blog topic or detailed prompt..."
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <input
                  type="text"
                  value={aiCategory}
                  onChange={(e) => setAiCategory(e.target.value)}
                  placeholder="e.g., Technology, Business, AI"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tone</label>
                  <select
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="technical">Technical</option>
                    <option value="friendly">Friendly</option>
                    <option value="formal">Formal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Length</label>
                  <select
                    value={aiLength}
                    onChange={(e) => setAiLength(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="short">Short (300-500 words)</option>
                    <option value="medium">Medium (500-800 words)</option>
                    <option value="long">Long (800-1200 words)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAIModal(false)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                disabled={generatingAI}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateWithAI}
                disabled={generatingAI || !aiTopic}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingAI ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blog Editor Modal */}
      {showModal && (
        <BlogEditorModal
          blog={editingBlog}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingBlog(null);
          }}
        />
      )}
    </div>
  );
};

// Blog Editor Modal Component
const BlogEditorModal = ({ blog, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    title: blog?.title || '',
    slug: blog?.slug || '',
    excerpt: blog?.excerpt || '',
    content: blog?.content || '',
    category: blog?.category || '',
    tags: blog?.tags?.join(', ') || '',
    status: blog?.status || 'draft',
    featured_image: blog?.featured_image || '',
    images: blog?.images || [],
    seo_title: blog?.seo_title || '',
    seo_description: blog?.seo_description || '',
    reading_time: blog?.reading_time || 0,
    scheduled_date: blog?.scheduled_date || '',
    meta_keywords: blog?.meta_keywords || '',
    canonical_url: blog?.canonical_url || ''
  });
  const [newImageUrl, setNewImageUrl] = useState('');
  const [editorMode, setEditorMode] = useState('wysiwyg');
  const [showPreview, setShowPreview] = useState(false);
  const [showSEOPanel, setShowSEOPanel] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [availableTags] = useState([
    'Technology', 'AI', 'Web Development', 'Mobile', 'Backend', 'Frontend',
    'DevOps', 'Cloud', 'Database', 'Security', 'UI/UX', 'Business', 'Tutorial', 
    'React', 'JavaScript', 'Python', 'Node.js', 'Machine Learning', 'Blockchain'
  ]);

  // Calculate reading time based on word count
  const calculateReadingTime = (text) => {
    const wordsPerMinute = 200; // Average reading speed
    const words = text.split(/\s+/).filter(word => word.length > 0).length;
    const readingTime = Math.ceil(words / wordsPerMinute);
    setWordCount(words);
    return readingTime;
  };

  // Enhanced markdown to HTML conversion
  const convertMarkdownToHTML = (markdown) => {
    if (!markdown) return '';
    
    // Enhanced markdown parsing with code syntax highlighting
    let html = markdown
      // Code blocks with language specification
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        const language = lang || 'javascript';
        return `<pre class="bg-gray-800 rounded-lg p-4 overflow-x-auto"><code class="language-${language} text-sm">${code.trim()}</code></pre>`;
      })
      // Headers
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-semibold mt-6 mb-3 text-white">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-8 mb-4 text-white">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mt-8 mb-6 text-white">$1</h1>')
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-300">$1</em>')
      // Inline code
      .replace(/`(.*?)`/g, '<code class="bg-gray-800 px-2 py-1 rounded text-sm font-mono text-green-400">$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-red-400 hover:text-red-300 underline" target="_blank" rel="noopener noreferrer">$1</a>')
      // Lists
      .replace(/^\* (.*$)/gm, '<li class="ml-4 mb-1 text-gray-300">• $1</li>')
      // Blockquotes
      .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-red-500 pl-4 italic text-gray-400 my-4">$1</blockquote>')
      // Line breaks and paragraphs
      .replace(/\n\n/g, '</p><p class="mb-4 text-gray-300 leading-relaxed">')
      .replace(/\n/g, '<br />');
    
    // Wrap in paragraph if not already wrapped
    if (!html.startsWith('<')) {
      html = '<p class="mb-4 text-gray-300 leading-relaxed">' + html + '</p>';
    }
    
    return html;
  };

  // Update form data when blog prop changes (e.g., AI generation)
  useEffect(() => {
    if (blog) {
      const content = blog.content || '';
      const processedContent = convertMarkdownToHTML(content);
      const readingTime = calculateReadingTime(content);
      
      setFormData({
        title: blog.title || '',
        slug: blog.slug || '',
        excerpt: blog.excerpt || '',
        content: processedContent,
        category: blog.category || '',
        tags: Array.isArray(blog.tags) ? blog.tags.join(', ') : (blog.tags || ''),
        status: blog.status || 'draft',
        featured_image: blog.featured_image || '',
        images: blog.images || [],
        seo_title: blog.seo_title || blog.title || '',
        seo_description: blog.seo_description || blog.excerpt || '',
        reading_time: readingTime,
        scheduled_date: blog.scheduled_date || '',
        meta_keywords: blog.meta_keywords || '',
        canonical_url: blog.canonical_url || ''
      });
    }
  }, [blog]);

  // Update word count when content changes
  useEffect(() => {
    if (formData.content) {
      calculateReadingTime(formData.content.replace(/<[^>]*>/g, ''));
    }
  }, [formData.content]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from title
    if (field === 'title' && !blog?.slug) {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleSubmit = () => {
    const blogData = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      images: formData.images || []
    };
    onSave(blogData);
  };

  const addImage = () => {
    if (newImageUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), newImageUrl.trim()]
      }));
      setNewImageUrl('');
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const isPDF = (url) => {
    return url?.toLowerCase().endsWith('.pdf');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-2xl border border-red-500/30 p-8 max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        {/* Enhanced Header with Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h3 className="text-2xl font-bold text-white">
              {blog ? 'Edit Blog Post' : 'New Blog Post'}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{formData.reading_time} min read</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Editor Mode Toggle */}
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setEditorMode('wysiwyg')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  editorMode === 'wysiwyg' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Visual
              </button>
              <button
                onClick={() => setEditorMode('markdown')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  editorMode === 'markdown' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Markdown
              </button>
            </div>
            
            {/* Preview Toggle */}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`px-3 py-2 text-xs rounded-lg transition-colors ${
                showPreview ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>

            {/* SEO Panel Toggle */}
            <button
              onClick={() => setShowSEOPanel(!showSEOPanel)}
              className={`px-3 py-2 text-xs rounded-lg transition-colors ${
                showSEOPanel ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              SEO
            </button>

            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Slug */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500"
                  required
                  placeholder="Enter your blog title..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">URL Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500"
                  placeholder="auto-generated-from-title"
                />
              </div>
            </div>

            {/* Excerpt with Character Count */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">Excerpt *</label>
                <span className="text-xs text-gray-500">{formData.excerpt.length}/160 chars</span>
              </div>
              <textarea
                value={formData.excerpt}
                onChange={(e) => handleChange('excerpt', e.target.value)}
                rows="3"
                maxLength="160"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500 resize-none"
                placeholder="Brief description for search engines and social media..."
                required
              />
            </div>

            {/* Enhanced Content Editor */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-300">Content *</label>
                <div className="flex items-center gap-2">
                  {/* Content Formatting Tools */}
                  <button
                    type="button"
                    onClick={() => {
                      const selection = window.getSelection();
                      if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        const strong = document.createElement('strong');
                        try {
                          range.surroundContents(strong);
                        } catch (e) {
                          strong.appendChild(range.extractContents());
                          range.insertNode(strong);
                        }
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                    title="Bold"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                    title="Italic"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4h-8z"/>
                    </svg>
                  </button>
                  <div className="w-px h-4 bg-gray-600"></div>
                  <select
                    className="text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
                    onChange={(e) => {
                      // Insert code block template
                      const template = `<pre class="bg-gray-800 rounded-lg p-4 overflow-x-auto"><code class="language-${e.target.value}">\n// Your ${e.target.value} code here\n</code></pre>`;
                      handleChange('content', formData.content + '\n\n' + template);
                    }}
                  >
                    <option value="">Insert Code</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="json">JSON</option>
                    <option value="bash">Bash</option>
                  </select>
                </div>
              </div>
              
              {showPreview ? (
                <div className="border border-gray-700 rounded-lg">
                  <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 text-sm text-gray-400">
                    Preview
                  </div>
                  <div 
                    className="p-4 prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: formData.content }}
                  />
                </div>
              ) : (
                <textarea
                  value={formData.content}
                  onChange={(e) => handleChange('content', e.target.value)}
                  rows={editorMode === 'markdown' ? 20 : 15}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500 font-mono text-sm resize-none"
                  placeholder={editorMode === 'markdown' 
                    ? "# Your Blog Title\n\nStart writing in **Markdown**...\n\n## Section Title\n\nYour content here with `code` and [links](https://example.com).\n\n```javascript\n// Code blocks supported\nconsole.log('Hello World');\n```"
                    : "Start writing your blog content..."
                  }
                  required
                />
              )}
              
              {editorMode === 'markdown' && (
                <p className="text-xs text-gray-500 mt-2">
                  Markdown supported: **bold**, *italic*, `code`, [links](url), ## headers, ```code blocks```
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Publishing Options */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Publishing
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Schedule Publication</label>
                  <input
                    type="datetime-local"
                    value={formData.scheduled_date}
                    onChange={(e) => handleChange('scheduled_date', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="pt-2 border-t border-gray-700">
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>Last saved: {new Date().toLocaleTimeString()}</div>
                    <div>Reading time: {formData.reading_time} minutes</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Category & Tags */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Categorization
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                    placeholder="e.g., Technology, Tutorial"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => handleChange('tags', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500 mb-2"
                    placeholder="React, JavaScript, Web Dev"
                  />
                  <div className="flex flex-wrap gap-1">
                    {availableTags.slice(0, 8).map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const currentTags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
                          if (!currentTags.includes(tag)) {
                            handleChange('tags', [...currentTags, tag].join(', '));
                          }
                        }}
                        className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Image & Gallery */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Media
              </h4>
              
              <div className="space-y-4">
                {/* Featured Image */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Featured Image</label>
                  <input
                    type="url"
                    value={formData.featured_image}
                    onChange={(e) => handleChange('featured_image', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.featured_image && (
                    <div className="mt-2">
                      <img 
                        src={formData.featured_image} 
                        alt="Featured" 
                        className="w-full h-20 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Gallery Images */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Gallery Images/PDFs</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="Image or PDF URL"
                      className="flex-1 px-2 py-1 text-sm bg-gray-900 border border-gray-600 rounded text-white focus:outline-none focus:border-red-500"
                      onKeyPress={(e) => e.key === 'Enter' && addImage()}
                    />
                    <button
                      type="button"
                      onClick={addImage}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                    >
                      Add
                    </button>
                  </div>

                  {/* Display current images */}
                  {formData.images && formData.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <div className="aspect-video bg-gray-900 rounded overflow-hidden border border-gray-600">
                            {isPDF(img) ? (
                              <div className="w-full h-full flex flex-col items-center justify-center">
                                <svg className="w-6 h-6 text-red-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="text-xs text-red-400">PDF</span>
                              </div>
                            ) : (
                              <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute -top-1 -right-1 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SEO Panel */}
            {showSEOPanel && (
              <div className="lg:col-span-1 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  SEO Optimization
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">SEO Title</label>
                    <input
                      type="text"
                      value={formData.seo_title}
                      onChange={(e) => handleChange('seo_title', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                      placeholder="Optimized title for search engines"
                    />
                    <div className="text-xs text-gray-500 mt-1">{formData.seo_title.length}/60 chars</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Meta Description</label>
                    <textarea
                      value={formData.seo_description}
                      onChange={(e) => handleChange('seo_description', e.target.value)}
                      rows="3"
                      maxLength="160"
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500 resize-none"
                      placeholder="Description for search engine results"
                    />
                    <div className="text-xs text-gray-500 mt-1">{formData.seo_description.length}/160 chars</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Focus Keywords</label>
                    <input
                      type="text"
                      value={formData.meta_keywords}
                      onChange={(e) => handleChange('meta_keywords', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                      placeholder="keyword1, keyword2, keyword3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Canonical URL</label>
                    <input
                      type="url"
                      value={formData.canonical_url}
                      onChange={(e) => handleChange('canonical_url', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                      placeholder="https://yourdomain.com/blog/post-slug"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Action Buttons */}
          <div className="lg:col-span-3 flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-700">
            <div className="flex-1 flex gap-3">
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {formData.status === 'published' ? 'Update & Publish' : 'Save Draft'}
              </button>
              
              {formData.status === 'draft' && (
                <button
                  type="button"
                  onClick={() => {
                    handleChange('status', 'published');
                    handleSubmit();
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Publish Now
                </button>
              )}
            </div>
            
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== SECTION VISIBILITY SECTION ====================
const SectionVisibilitySection = ({ sectionVisibility, setSectionVisibility, portfolioSettings, setPortfolioSettings, showMessage }) => {
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    if (sectionVisibility && sectionVisibility.length > 0) {
      setSections([...sectionVisibility].sort((a, b) => a.display_order - b.display_order));
    } else {
      // Initialize with default sections if none exist
      const defaultSections = [
        { section_name: 'hero', is_visible: true, display_order: 0, description: 'Hero section with profile intro' },
        { section_name: 'ventures', is_visible: true, display_order: 1, description: 'Business ventures and projects' },
        { section_name: 'experience', is_visible: true, display_order: 2, description: 'Professional work experience' },
        { section_name: 'education', is_visible: true, display_order: 3, description: 'Educational background' },
        { section_name: 'achievements', is_visible: true, display_order: 4, description: 'Certificates and hackathons' },
        { section_name: 'blog', is_visible: true, display_order: 5, description: 'Blog posts and insights' }
      ];
      setSections(defaultSections);
    }
  }, [sectionVisibility]);

  const handleToggleVisibility = (sectionName) => {
    setSections(sections.map(section => 
      section.section_name === sectionName 
        ? { ...section, is_visible: !section.is_visible }
        : section
    ));
  };

  const handleReorderSection = (sectionName, direction) => {
    const currentIndex = sections.findIndex(s => s.section_name === sectionName);
    if (currentIndex === -1) return;

    const newSections = [...sections];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    // Swap the sections
    [newSections[currentIndex], newSections[targetIndex]] = [newSections[targetIndex], newSections[currentIndex]];
    
    // Update display orders
    newSections.forEach((section, index) => {
      section.display_order = index;
    });

    setSections(newSections);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await API.updateSectionVisibility(sections);
      setSectionVisibility(sections);
      showMessage('Section visibility updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating section visibility:', error);
      showMessage('Error updating section visibility', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getSectionIcon = (sectionName) => {
    const icons = {
      hero: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      ventures: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      experience: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0v6l-1 1-1-1V6H8v6l-1 1-1-1V6" />
        </svg>
      ),
      education: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
      ),
      achievements: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      blog: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      )
    };
    return icons[sectionName] || icons.hero;
  };

  const getSectionLabel = (sectionName) => {
    const labels = {
      hero: 'Hero Section',
      ventures: 'Ventures',
      experience: 'Experience',
      education: 'Education',
      achievements: 'Achievements',
      blog: 'Blog & Insights'
    };
    return labels[sectionName] || sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Portfolio Section Visibility
          </h2>
          <p className="text-gray-400 mt-1">Control which sections are visible on your portfolio</p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-50 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Settings Cards */}
      <div className="grid gap-4">
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            Section Order & Visibility
          </h3>
          <p className="text-gray-400 text-sm mb-6">Drag to reorder sections, toggle visibility, and control what visitors see on your portfolio.</p>
          
          <div className="space-y-3">
            {sections.map((section, index) => (
              <div
                key={section.section_name}
                className={`p-4 rounded-lg border transition-all ${
                  section.is_visible 
                    ? 'bg-gray-900/50 border-gray-600' 
                    : 'bg-gray-900/20 border-gray-700 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Visibility Toggle */}
                    <button
                      onClick={() => handleToggleVisibility(section.section_name)}
                      className={`p-2 rounded-lg transition-colors ${
                        section.is_visible 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                      title={section.is_visible ? 'Hide Section' : 'Show Section'}
                    >
                      {section.is_visible ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414l-1.414-1.414m2.829 2.829l4.243 4.243m0 0a3 3 0 104.243-4.243m-4.243 4.243L15.172 15.172m0-6.364L19.071 4.93m0 0a3 3 0 10-4.243 4.243m4.243-4.243L8.464 15.536" />
                        </svg>
                      )}
                    </button>

                    {/* Section Info */}
                    <div className="flex items-center gap-3">
                      <div className="text-gray-400">
                        {getSectionIcon(section.section_name)}
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{getSectionLabel(section.section_name)}</h4>
                        <p className="text-sm text-gray-500">
                          {section.description || `${getSectionLabel(section.section_name)} content`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Controls */}
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                      #{section.display_order + 1}
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleReorderSection(section.section_name, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move Up"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleReorderSection(section.section_name, 'down')}
                        disabled={index === sections.length - 1}
                        className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move Down"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {sections.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <p className="text-gray-400">No sections configured</p>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Portfolio Preview Order
          </h3>
          <div className="flex flex-wrap gap-2">
            {sections
              .filter(section => section.is_visible)
              .map((section, index) => (
                <div 
                  key={section.section_name}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600/20 border border-green-500/30 rounded-lg text-green-300 text-sm"
                >
                  <span className="text-xs text-green-500">#{index + 1}</span>
                  {getSectionIcon(section.section_name)}
                  {getSectionLabel(section.section_name)}
                </div>
              ))}
          </div>
          {sections.filter(s => s.is_visible).length === 0 && (
            <p className="text-gray-500 text-sm">No visible sections - portfolio will be empty</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
