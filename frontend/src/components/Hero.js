import React, { useState, useEffect } from 'react';
import { PROFILE_DATA, SOCIAL_LINKS } from '../constants';
import { GithubIcon, LinkedInIcon, MailIcon } from './icons';
import * as API from '../services/apiService';

const Hero = () => {
  const [profileData, setProfileData] = useState(PROFILE_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await API.getProfile();
        if (profile) {
          setProfileData({
            ...PROFILE_DATA,
            ...profile,
            // Use social links from profile if available, otherwise fallback to constants
            linkedin: profile.linkedin || SOCIAL_LINKS.linkedin,
            github: profile.github || SOCIAL_LINKS.github,
            email: profile.email || SOCIAL_LINKS.email,
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        // Fallback to constants if API fails
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="relative">
        <div className="glass-card rounded-2xl p-6 md:p-8 relative overflow-hidden">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-8 bg-white/10 rounded w-3/4"></div>
                <div className="h-6 bg-white/10 rounded w-1/2"></div>
                <div className="h-4 bg-white/10 rounded w-full"></div>
                <div className="h-4 bg-white/10 rounded w-5/6"></div>
              </div>
              <div className="flex justify-center lg:justify-end">
                <div className="w-32 h-32 md:w-40 md:h-40 bg-white/10 rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="relative">
      <div className="bg-gray-900/60 backdrop-blur-md rounded-2xl p-6 md:p-8 relative overflow-hidden border border-gray-600/30 shadow-2xl shadow-black/50">
        {/* Dark professional background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800/20 via-transparent to-black/20 pointer-events-none"></div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Profile Image - Mobile First (Top) */}
          <div className="flex justify-center lg:hidden order-first">
            <div className="relative group">
              {/* Subtle glow effect */}
              <div className="absolute -inset-2 bg-gradient-to-r from-gray-600/20 via-gray-500/30 to-gray-600/20 rounded-2xl opacity-50 group-hover:opacity-75 blur-lg transition-all duration-300"></div>
              
              {/* Image container */}
              <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-4 border-gray-600/50 shadow-2xl shadow-black/50 transform transition-all duration-300 group-hover:scale-105 group-hover:rotate-1">
                <img 
                  src={profileData.image} 
                  alt={profileData.name}
                  className="w-full h-full object-cover"
                />
                {/* Overlay gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              
              {/* Status indicator with pulse */}
              <div className="absolute -top-2 -right-2 flex items-center justify-center">
                <div className="absolute w-5 h-5 bg-green-500 rounded-full animate-ping opacity-75"></div>
                <div className="relative w-5 h-5 bg-green-500 rounded-full border-4 border-black"></div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-2 space-y-4">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
                {profileData.name}
              </h1>
              <h2 className="text-lg md:text-xl text-gray-300 font-medium">
                {profileData.title}
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Available for opportunities</span>
              </div>
            </div>
            
            <p className="text-gray-300 text-base leading-relaxed max-w-2xl">
              {profileData.summary}
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-3">
              {profileData.linkedin && (
                <a 
                  href={profileData.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-300 hover:scale-105 group"
                  aria-label="LinkedIn Profile"
                >
                  <LinkedInIcon className="w-5 h-5 text-gray-300 group-hover:text-blue-400 transition-colors duration-300" />
                </a>
              )}
              {profileData.github && (
                <a 
                  href={profileData.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-300 hover:scale-105 group"
                  aria-label="GitHub Profile"
                >
                  <GithubIcon className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors duration-300" />
                </a>
              )}
              {/* Action buttons: Business Card and Generate Resume - Icon Only */}
              <button 
                onClick={() => window.location.href = '/'} 
                className="group p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-300 hover:scale-105 relative"
                aria-label="View Business Card"
              >
                <svg className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
                {/* Tooltip */}
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Business Card
                </span>
              </button>
              <button
                onClick={async () => {
                  const base = (process.env.REACT_APP_BACKEND_URL || '');
                  const endpoint = `${base}/api/generate_ats_resume`;
                  try {
                    const res = await fetch(endpoint, { 
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        job_description: "General Software Developer position requiring full-stack development skills",
                        target_role: "Software Developer"
                      })
                    });
                    if (!res.ok) {
                      const txt = await res.text().catch(() => '');
                      console.error('Resume API error', res.status, txt);
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
                      a.download = 'AI_Enhanced_Resume.pdf'; 
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      setTimeout(() => URL.revokeObjectURL(url), 1000);
                    } else {
                      alert('AI Resume generation failed: ' + (data.error || 'Unknown error'));
                    }
                  } catch (e) {
                    console.error(e);
                    alert('AI Resume generation failed');
                  }
                }}
                className="group p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-300 hover:scale-105 relative"
                aria-label="Generate Resume"
              >
                <svg className="w-5 h-5 text-gray-300 group-hover:text-green-400 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {/* Tooltip */}
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  AI-Enhanced Resume
                </span>
              </button>
            </div>
          </div>
          
          {/* Profile Image - Desktop Only (Right Side) */}
          <div className="hidden lg:flex justify-center lg:justify-end">
            <div className="relative group">
              {/* Subtle glow effect */}
              <div className="absolute -inset-2 bg-gradient-to-r from-gray-600/20 via-gray-500/30 to-gray-600/20 rounded-2xl opacity-50 group-hover:opacity-75 blur-lg transition-all duration-300"></div>
              
              {/* Image container */}
              <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-4 border-gray-600/50 shadow-2xl shadow-black/50 transform transition-all duration-300 group-hover:scale-105 group-hover:rotate-1">
                <img 
                  src={profileData.image} 
                  alt={profileData.name}
                  className="w-full h-full object-cover"
                />
                {/* Overlay gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              
              {/* Status indicator with pulse */}
              <div className="absolute -top-2 -right-2 flex items-center justify-center">
                <div className="absolute w-5 h-5 bg-green-500 rounded-full animate-ping opacity-75"></div>
                <div className="relative w-5 h-5 bg-green-500 rounded-full border-4 border-black"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;