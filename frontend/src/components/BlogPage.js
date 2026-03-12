import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import * as API from '../services/apiService';

const BlogPage = () => {
  const { blogId } = useParams();
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid, list, masonry
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, popular, reading_time
  const [showTableOfContents, setShowTableOfContents] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [bookmarkedBlogs, setBookmarkedBlogs] = useState([]);
  const [showSocialShare, setShowSocialShare] = useState(false);
  const contentRef = useRef(null);
  useEffect(() => {
    loadBlogs();
  }, [filter]);

  useEffect(() => {
    if (blogId) {
      loadBlog(blogId);
    }
  }, [blogId]);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      const status = filter === 'all' ? null : filter;
      const blogData = await API.getBlogs(status);
      setBlogs(blogData || []);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(blogData.map(blog => blog.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBlog = async (id) => {
    try {
      const blog = await API.getBlog(id);
      setSelectedBlog(blog);
    } catch (error) {
      console.error('Error loading blog:', error);
      navigate('/blog');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const copyBlogLink = () => {
    const blogUrl = `${window.location.origin}/blog/${blogId}`;
    navigator.clipboard.writeText(blogUrl).then(() => {
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    });
  };

  const nextImage = () => {
    if (selectedBlog?.images && selectedBlog.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedBlog.images.length);
    }
  };

  const previousImage = () => {
    if (selectedBlog?.images && selectedBlog.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + selectedBlog.images.length) % selectedBlog.images.length);
    }
  };

  const isPDF = (url) => {
    return url?.toLowerCase().endsWith('.pdf');
  };

  // Calculate reading time if not provided
  const calculateReadingTime = (content) => {
    if (!content) return 0;
    const wordsPerMinute = 200;
    const words = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length;
    return Math.ceil(words / wordsPerMinute);
  };

  // Generate table of contents from blog content
  const generateTableOfContents = (content) => {
    if (!content) return [];
    const headings = content.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi);
    if (!headings) return [];
    
    return headings.map((heading, index) => {
      const level = parseInt(heading.match(/h(\d)/)[1]);
      const text = heading.replace(/<[^>]*>/g, '');
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return { level, text, id, index };
    });
  };

  // Social sharing functions
  const shareOnTwitter = () => {
    const url = `${window.location.origin}/blog/${blogId}`;
    const text = `Check out this blog post: ${selectedBlog.title}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    const url = `${window.location.origin}/blog/${blogId}`;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  };

  const shareOnFacebook = () => {
    const url = `${window.location.origin}/blog/${blogId}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  // Bookmark functionality
  const toggleBookmark = (blogId) => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarkedBlogs') || '[]');
    const isBookmarked = bookmarks.includes(blogId);
    
    if (isBookmarked) {
      const updatedBookmarks = bookmarks.filter(id => id !== blogId);
      localStorage.setItem('bookmarkedBlogs', JSON.stringify(updatedBookmarks));
      setBookmarkedBlogs(updatedBookmarks);
    } else {
      const updatedBookmarks = [...bookmarks, blogId];
      localStorage.setItem('bookmarkedBlogs', JSON.stringify(updatedBookmarks));
      setBookmarkedBlogs(updatedBookmarks);
    }
  };

  // Reading progress tracking
  useEffect(() => {
    if (blogId && contentRef.current) {
      const handleScroll = () => {
        const element = contentRef.current;
        const windowHeight = window.innerHeight;
        const documentHeight = element.scrollHeight;
        const scrollTop = window.scrollY;
        const progress = Math.min((scrollTop / (documentHeight - windowHeight)) * 100, 100);
        setReadingProgress(progress);
      };

      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [blogId]);

  // Load bookmarks on component mount
  useEffect(() => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarkedBlogs') || '[]');
    setBookmarkedBlogs(bookmarks);
  }, []);

  // Enhanced filtering and sorting
  const filteredAndSortedBlogs = blogs
    .filter(blog => {
      const matchesSearch = blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           blog.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           blog.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           blog.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesFilter = filter === 'all' || 
                           (filter === 'published' && blog.status === 'published') ||
                           (filter === 'bookmarked' && bookmarkedBlogs.includes(blog.id)) ||
                           blog.category === filter;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'popular':
          return (b.views || 0) - (a.views || 0);
        case 'reading_time':
          const aTime = a.reading_time || calculateReadingTime(a.content);
          const bTime = b.reading_time || calculateReadingTime(b.content);
          return aTime - bTime;
        case 'newest':
        default:
          return new Date(b.created_at || b.published_date) - new Date(a.created_at || a.published_date);
      }
    });

  // If viewing a single blog
  if (blogId && selectedBlog) {
    const tableOfContents = generateTableOfContents(selectedBlog.content);
    const readingTime = selectedBlog.reading_time || calculateReadingTime(selectedBlog.content);
    const isBookmarked = bookmarkedBlogs.includes(blogId);

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" ref={contentRef}>
        {/* Reading Progress Bar */}
        <div className="fixed top-0 left-0 w-full h-1 bg-gray-800 z-50">
          <div 
            className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300"
            style={{ width: `${readingProgress}%` }}
          />
        </div>

        {/* Header */}
        <header className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-md border-b border-white/10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/blog" className="flex items-center gap-2 text-white hover:text-primary-400 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="font-medium">Back to Blog</span>
              </Link>
              
              <div className="flex items-center gap-3">
                {/* Table of Contents Toggle */}
                {tableOfContents.length > 0 && (
                  <button
                    onClick={() => setShowTableOfContents(!showTableOfContents)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                      showTableOfContents ? 'bg-blue-600 text-white' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                    }`}
                    title="Table of Contents"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    TOC
                  </button>
                )}

                {/* Bookmark Button */}
                <button
                  onClick={() => toggleBookmark(blogId)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    isBookmarked ? 'bg-yellow-600 text-white' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                  }`}
                  title={isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
                >
                  <svg className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>

                {/* Social Share Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowSocialShare(!showSocialShare)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all"
                    title="Share this blog"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </button>

                  {/* Social Share Dropdown */}
                  {showSocialShare && (
                    <div className="absolute right-0 top-12 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                      <div className="p-2">
                        <button
                          onClick={shareOnTwitter}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left text-white hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                          </svg>
                          Share on Twitter
                        </button>
                        <button
                          onClick={shareOnLinkedIn}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left text-white hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                          Share on LinkedIn
                        </button>
                        <button
                          onClick={shareOnFacebook}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left text-white hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                          Share on Facebook
                        </button>
                        <div className="border-t border-gray-700 mt-2 pt-2">
                          <button
                            onClick={copyBlogLink}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left text-white hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            {showCopySuccess ? (
                              <>
                                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-green-400">Link Copied!</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy Link
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Link to="/portfolio" className="text-gray-400 hover:text-white transition-colors">
                  Portfolio
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Table of Contents Sidebar */}
        {showTableOfContents && tableOfContents.length > 0 && (
          <div className="fixed left-4 top-1/2 -translate-y-1/2 w-64 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-4 z-30 max-h-96 overflow-y-auto">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Table of Contents
            </h4>
            <nav className="space-y-1">
              {tableOfContents.map((item, index) => (
                <a
                  key={index}
                  href={`#${item.id}`}
                  className={`block text-sm text-gray-400 hover:text-white transition-colors py-1 ${
                    item.level === 2 ? 'pl-0' : item.level === 3 ? 'pl-4' : 'pl-8'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.getElementById(item.id);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  {item.text}
                </a>
              ))}
            </nav>
          </div>
        )}

        {/* Blog Content */}
        <article className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Blog Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              {selectedBlog.category && (
                <span className="px-3 py-1 bg-primary-500/20 text-primary-300 rounded-lg text-sm font-medium">
                  {selectedBlog.category}
                </span>
              )}
              {selectedBlog.ai_generated && (
                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-sm font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI Generated
                </span>
              )}
              <span className="text-gray-500 text-sm">
                {formatDate(selectedBlog.published_date || selectedBlog.created_at)}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {selectedBlog.title}
            </h1>
            
            <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
              <span>By {selectedBlog.author || 'Ibrahim El Khalil'}</span>
              {selectedBlog.reading_time && <span>• {selectedBlog.reading_time} min read</span>}
              {selectedBlog.views && <span>• {selectedBlog.views} views</span>}
            </div>

            {selectedBlog.excerpt && (
              <p className="text-xl text-gray-300 italic leading-relaxed">
                {selectedBlog.excerpt}
              </p>
            )}
          </header>

          {/* Featured Image */}
          {selectedBlog.featured_image && (
            <div className="mb-12 rounded-2xl overflow-hidden">
              <img
                src={selectedBlog.featured_image}
                alt={selectedBlog.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* Image Carousel / PDF Viewer */}
          {selectedBlog.images && selectedBlog.images.length > 0 && (
            <div className="mb-12">
              <h3 className="text-xl font-semibold text-white mb-4">Gallery</h3>
              <div className="relative bg-gray-800/50 rounded-2xl overflow-hidden border border-white/10">
                {/* Main Image/PDF Display */}
                <div className="relative aspect-video bg-gray-900/50">
                  {isPDF(selectedBlog.images[currentImageIndex]) ? (
                    // PDF Viewer
                    <div className="w-full h-full flex items-center justify-center">
                      <iframe
                        src={selectedBlog.images[currentImageIndex]}
                        className="w-full h-full"
                        title={`PDF ${currentImageIndex + 1}`}
                        style={{ minHeight: '600px' }}
                      />
                    </div>
                  ) : (
                    // Image Display
                    <img
                      src={selectedBlog.images[currentImageIndex]}
                      alt={`Gallery image ${currentImageIndex + 1}`}
                      className="w-full h-full object-contain"
                    />
                  )}
                  
                  {/* Navigation Arrows */}
                  {selectedBlog.images.length > 1 && (
                    <>
                      <button
                        onClick={previousImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all backdrop-blur-sm"
                        aria-label="Previous"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all backdrop-blur-sm"
                        aria-label="Next"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}

                  {/* Counter */}
                  <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/70 rounded-lg text-white text-sm backdrop-blur-sm">
                    {currentImageIndex + 1} / {selectedBlog.images.length}
                  </div>

                  {/* PDF Badge */}
                  {isPDF(selectedBlog.images[currentImageIndex]) && (
                    <div className="absolute top-4 left-4 px-3 py-1 bg-red-500/80 rounded-lg text-white text-sm font-medium backdrop-blur-sm flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      PDF
                    </div>
                  )}
                </div>

                {/* Thumbnail Strip */}
                {selectedBlog.images.length > 1 && (
                  <div className="p-4 bg-gray-900/30 flex gap-2 overflow-x-auto">
                    {selectedBlog.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          idx === currentImageIndex
                            ? 'border-primary-500 opacity-100'
                            : 'border-white/10 opacity-50 hover:opacity-75'
                        }`}
                      >
                        {isPDF(img) ? (
                          <div className="w-full h-full bg-red-500/20 flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                        ) : (
                          <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="prose prose-lg prose-invert prose-primary max-w-none mb-12">
            <div
              className="text-gray-300 leading-relaxed blog-content"
              dangerouslySetInnerHTML={{ __html: selectedBlog.content }}
            />
          </div>

          {/* Tags */}
          {selectedBlog.tags && selectedBlog.tags.length > 0 && (
            <div className="pt-8 border-t border-white/10">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {selectedBlog.tags.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 bg-white/5 text-gray-400 rounded-lg text-sm hover:bg-white/10 transition-colors cursor-pointer">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    );
  }

  // Blog List View
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <Link to="/portfolio" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Portfolio
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
                <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                Blog & Insights
              </h1>
              <p className="text-gray-400 mt-1">
                Thoughts on technology, development, and innovation
              </p>
            </div>
            
            {/* Search */}
            <div className="relative max-w-md w-full">
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Enhanced Filters and Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-12">
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'all'
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/50'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              All Posts ({blogs.length})
            </button>
            <button
              onClick={() => setFilter('published')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'published'
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/50'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              Published
            </button>
            <button
              onClick={() => setFilter('bookmarked')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                filter === 'bookmarked'
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/50'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <svg className="w-4 h-4" fill={filter === 'bookmarked' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Bookmarked ({bookmarkedBlogs.length})
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === category
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/50'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Sort and View Controls */}
          <div className="flex items-center gap-4">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="popular">Most Popular</option>
              <option value="reading_time">Reading Time</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'
                }`}
                title="List View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('masonry')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'masonry' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'
                }`}
                title="Masonry View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H5m14 14H5m6-7v7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-white/5 rounded-xl mb-4"></div>
                <div className="h-4 bg-white/5 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-white/5 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : filteredAndSortedBlogs.length === 0 ? (
          <div className="text-center py-24">
            <svg className="w-24 h-24 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <p className="text-gray-400 text-xl mb-2">No blog posts found</p>
            <p className="text-gray-500">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className={`${
            viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' :
            viewMode === 'list' ? 'space-y-6' :
            'columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8'
          }`}>
            {filteredAndSortedBlogs.map((blog) => {
              const readingTime = blog.reading_time || calculateReadingTime(blog.content);
              const isBookmarked = bookmarkedBlogs.includes(blog.id);
              
              if (viewMode === 'list') {
                return (
                  <div key={blog.id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-primary-500/50 transition-all">
                    <div className="flex gap-6">
                      {/* Image */}
                      <div className="flex-shrink-0 w-32 h-32">
                        {blog.featured_image ? (
                          <img
                            src={blog.featured_image}
                            alt={blog.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary-500/20 to-primary-900/20 rounded-lg flex items-center justify-center">
                            <svg className="w-8 h-8 text-primary-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 text-sm">
                            {blog.category && (
                              <span className="px-2 py-1 bg-primary-500/20 text-primary-300 rounded-md">
                                {blog.category}
                              </span>
                            )}
                            <span className="text-gray-500">
                              {formatDate(blog.published_date || blog.created_at)}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              toggleBookmark(blog.id);
                            }}
                            className={`p-1 rounded transition-colors ${
                              isBookmarked ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-400'
                            }`}
                          >
                            <svg className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          </button>
                        </div>
                        
                        <Link to={`/blog/${blog.id}`}>
                          <h3 className="text-xl font-bold mb-2 text-white hover:text-primary-400 transition-colors line-clamp-2">
                            {blog.title}
                          </h3>
                        </Link>
                        
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                          {blog.excerpt}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {readingTime} min
                            </span>
                            {blog.views > 0 && (
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                {blog.views}
                              </span>
                            )}
                          </div>
                          {blog.ai_generated && (
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-md flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              AI
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              
              return (
              <div
                key={blog.id}
                className={`group bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:border-primary-500/50 transition-all hover:transform hover:scale-105 ${
                  viewMode === 'masonry' ? 'break-inside-avoid mb-6' : ''
                }`}
              >
                {/* Bookmark Button */}
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggleBookmark(blog.id);
                    }}
                    className={`p-2 rounded-full backdrop-blur-sm transition-all ${
                      isBookmarked 
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30' 
                        : 'bg-black/30 text-gray-400 hover:text-yellow-400 border border-gray-600/30 hover:border-yellow-400/30'
                    }`}
                    title={isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
                  >
                    <svg className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                </div>

                <Link to={`/blog/${blog.id}`} className="block">
                  {/* Featured Image */}
                  {blog.featured_image ? (
                    <div className={`${viewMode === 'masonry' ? 'h-auto' : 'h-48'} overflow-hidden relative`}>
                      <img
                        src={blog.featured_image}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className={`${viewMode === 'masonry' ? 'h-32' : 'h-48'} bg-gradient-to-br from-primary-500/20 to-primary-900/20 flex items-center justify-center relative`}>
                      <svg className="w-16 h-16 text-primary-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6">
                    {/* Category & Date */}
                    <div className="flex items-center justify-between mb-3 text-sm">
                      <div className="flex items-center gap-2">
                        {blog.category && (
                          <span className="px-2 py-1 bg-primary-500/20 text-primary-300 rounded-md">
                            {blog.category}
                          </span>
                        )}
                        <span className="text-gray-500">
                          {formatDate(blog.published_date || blog.created_at)}
                        </span>
                      </div>
                      
                      {/* Reading Time Badge */}
                      <span className="flex items-center gap-1 text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {readingTime} min
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold mb-2 text-white group-hover:text-primary-400 transition-colors line-clamp-2">
                      {blog.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                      {blog.excerpt}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        {blog.views > 0 && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {blog.views}
                          </span>
                        )}
                        <span className="text-gray-600">•</span>
                        <span>By IEK</span>
                      </div>
                      {blog.ai_generated && (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-md flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          AI
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {blog.tags && blog.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {blog.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-white/5 text-gray-400 rounded hover:bg-white/10 transition-colors cursor-pointer">
                            #{tag}
                          </span>
                        ))}
                        {blog.tags.length > 3 && (
                          <span className="text-xs px-2 py-1 bg-white/5 text-gray-500 rounded">
                            +{blog.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              </div>
              )
            })}
          </div>
        )}

        {/* Stats Bar */}
        {filteredAndSortedBlogs.length > 0 && (
          <div className="mt-12 p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <div className="flex flex-wrap items-center justify-center gap-8 text-center">
              <div>
                <div className="text-2xl font-bold text-white">{filteredAndSortedBlogs.length}</div>
                <div className="text-sm text-gray-400">Articles</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{categories.length}</div>
                <div className="text-sm text-gray-400">Categories</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{bookmarkedBlogs.length}</div>
                <div className="text-sm text-gray-400">Bookmarked</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {Math.round(filteredAndSortedBlogs.reduce((acc, blog) => 
                    acc + (blog.reading_time || calculateReadingTime(blog.content)), 0) / filteredAndSortedBlogs.length) || 0}
                </div>
                <div className="text-sm text-gray-400">Avg. Reading Time</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-24">
        <div className="container mx-auto px-4 py-8 text-center text-gray-400 text-sm">
          © 2025 IEK Portfolio By ZYNIQ. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default BlogPage;
