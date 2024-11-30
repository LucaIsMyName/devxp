
import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Globe, History, Trash2 } from 'lucide-react';
import Input from '../partials/Input';
import Button from '../partials/Button';

// URL validation helper
const isValidUrl = (url) => {
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
};

const proxyUrl = (url) => {
  return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
};

const getFaviconUrl = (domain) => {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
};

const WebReader = ({ initialState }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [article, setArticle] = useState(null);
  const [error, setError] = useState(null);
  const [recentUrls, setRecentUrls] = useState([]);
  const [favicon, setFavicon] = useState(null);


  // Load recent URLs and last fetched content from localStorage
  useEffect(() => {
    const savedUrls = localStorage.getItem('webreader_recent_urls');
    if (savedUrls) {
      setRecentUrls(JSON.parse(savedUrls));
    }

    const lastUrl = localStorage.getItem('webreader_last_url');
    const lastContent = localStorage.getItem('webreader_last_content');
    if (lastUrl && lastContent) {
      setUrl(lastUrl);
      setArticle(JSON.parse(lastContent));
    }
  }, []);

  const cleanUrl = (inputUrl) => {
    let cleanedUrl = inputUrl.trim();
    if (!cleanedUrl.startsWith('http')) {
      cleanedUrl = `https://${cleanedUrl}`;
    }
    return cleanedUrl;
  };

  const parseArticleContent = (html, baseUrl) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Find main content container
    const mainContent =
      doc.querySelector('main') ||
      doc.querySelector('article') ||
      doc.querySelector('.article') ||
      doc.querySelector('.post-content');

    if (!mainContent) {
      throw new Error('Could not find main content');
    }

    // Convert relative URLs to absolute
    const resolveUrl = (relativeUrl) => {
      try {
        return new URL(relativeUrl, baseUrl).href;
      } catch {
        return relativeUrl;
      }
    };

    // Extract content
    const title = doc.querySelector('h1')?.textContent || doc.title || '';
    const subtitle = doc.querySelector('h2')?.textContent || '';
    const sections = [];

    // Get favicon
    const faviconLink = doc.querySelector('link[rel="icon"]') ||
      doc.querySelector('link[rel="shortcut icon"]');
    const faviconUrl = faviconLink ?
      resolveUrl(faviconLink.href) :
      getFaviconUrl(new URL(baseUrl).hostname);

    // Process all content nodes
    mainContent.querySelectorAll('h1, h2, h3, h4, h5, h6, p, img, picture, blockquote').forEach(node => {
      if (node.tagName.toLowerCase() === 'img' || node.tagName.toLowerCase() === 'picture') {
        let imgSrc = '';
        let imgAlt = '';

        if (node.tagName.toLowerCase() === 'picture') {
          const img = node.querySelector('img');
          const source = node.querySelector('source');
          imgSrc = img?.src || source?.srcset?.split(' ')?.[0] || '';
          imgAlt = img?.alt || '';
        } else {
          imgSrc = node.src;
          imgAlt = node.alt;
        }

        if (imgSrc) {
          const absoluteImgUrl = resolveUrl(imgSrc);
          sections.push({
            type: 'image',
            src: proxyUrl(absoluteImgUrl),
            originalSrc: absoluteImgUrl,
            alt: imgAlt,
            caption: node.getAttribute('caption') || ''
          });
        }
      } else if (node.tagName.toLowerCase().startsWith('h')) {
        sections.push({
          type: 'heading',
          level: parseInt(node.tagName[1]),
          content: node.textContent.trim()
        });
      } else if (node.tagName.toLowerCase() === 'blockquote') {
        sections.push({
          type: 'quote',
          content: node.textContent.trim()
        });
      } else {
        const content = node.textContent.trim();
        if (content) {
          sections.push({
            type: 'paragraph',
            content
          });
        }
      }
    });

    return {
      title,
      subtitle,
      sections,
      url: baseUrl,
      favicon: proxyUrl(faviconUrl),
      timestamp: new Date().toISOString()
    };
  };


  const updateRecentUrls = (newUrl) => {
    const updatedUrls = [
      newUrl,
      ...recentUrls.filter(u => u !== newUrl).slice(0, 4)
    ];
    setRecentUrls(updatedUrls);
    localStorage.setItem('webreader_recent_urls', JSON.stringify(updatedUrls));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setArticle(null);
    setFavicon(null);
    setIsLoading(true);

    try {
      const cleanedUrl = cleanUrl(url);
      if (!isValidUrl(cleanedUrl)) {
        throw new Error('Invalid URL format');
      }

      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(cleanedUrl)}`);
      if (!response.ok) throw new Error('Failed to fetch article');

      const data = await response.json();
      const articleData = parseArticleContent(data.contents, cleanedUrl);

      setArticle(articleData);
      setFavicon(articleData.favicon);
      updateRecentUrls(cleanedUrl);

      localStorage.setItem('webreader_last_url', cleanedUrl);
      localStorage.setItem('webreader_last_content', JSON.stringify(articleData));
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };


  const clearHistory = () => {
    setRecentUrls([]);
    localStorage.removeItem('webreader_recent_urls');
    localStorage.removeItem('webreader_last_url');
    localStorage.removeItem('webreader_last_content');
  };

  return (
    <div data-component="WebReader" className="mx-auto p-4">
      <div className="">
        <section className='flex flex-wrap gap-4 items-center'>
          <form onSubmit={handleSubmit} className="flex-1 flex  lg:space-y-0 gap-4 items-center">
            <div className="flex-1 relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-700 dark:text-gray-200 w-4 h-4" />
              <Input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter URL (e.g., example.com/article)"
                disabled={isLoading}
                className='w-full pl-10'
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !url}
            >
              {isLoading ? (
                <span className="flex gap-3 items-center">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="hidden lg:block">Loading...</span>
                </span>
              ) : (
                <span className="flex gap-3 items-center">
                  <Globe className="w-5 h-5" />
                  <span className="hidden lg:block">Get Article</span>
                </span>
              )}
            </Button>
          </form>
          <Button
            onClick={clearHistory}
            disabled={recentUrls.length === 0}
            className={`${recentUrls.length === false ? 'cursor-not-allowed' : ''} flex gap-3 text-red-500 hover:text-red-600 flex items-center gap-1`}
          >
            <Trash2 className="w-5 h-5" />
            <span className="hidden lg:block">Clear</span>
          </Button>
        </section>

        {/* Recent URLs */}
        {recentUrls.length > 0 && (
          <div className="border-2 dark:border-gray-800 sm:flex items-center gap-4 my-4 px-4 rounded-lg bg-gray-100 dar:bg-gray-800 pb-4 pt-4">
            <div className="flex items-center justify-between mb-2 sm:mb-0">
              <div className="flex items-center text-xs text-gray-400 dark:text-gray-200 font-mono uppercase gap-2 text-gray-600 dark:text-gray-300">
                <History strokeWidth={2.25} className="text-gray-400 dark:text-gray-200 w-4 h-4" />
                Recent 
              </div>

            </div>
            <div className="flex flex-wrap gap-2">
              {recentUrls.map((recentUrl) => (
                <Button
                  key={recentUrl}
                  onClick={
                    () => {
                      setUrl(recentUrl);
                      setTimeout(() => {
                        handleSubmit(new Event('submit'));
                      }, 100);
                    }
                  }
                  className="text-xs px-3 py-1 rounded-full"
                >
                  {new URL(recentUrl).hostname}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 dark:border-gray-800 border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Article Content */}
        {article && (
          <article className="prose prose-slate max-w-4xl mx-auto select-text">
            <div className="lg:flex  items-start gap-3 my-8">
              {article.favicon && (
                <img
                  src={article.favicon}
                  alt="Site favicon"
                  className="w-9 h-9 mb-4 lg:mb-0"
                  onError={(e) => e.target.style.display = 'none'}
                />
              )}
              <h1 className="text-3xl font-bold m-0">{article.title}</h1>
            </div>

            {article.subtitle && (
              <h2 className="text-xl text-gray-600 dark:text-gray-300 mb-6">{article.subtitle}</h2>
            )}

            <div className="text-sm text-gray-50 dark:text-gray-black0 dark:text-gray-200 mb-8 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-300 dark:text-blue-600 dark:text-blue-300 dark:text-blue-700 underline"
              >
                {new URL(article.url).hostname + article.url.split(new URL(article.url).hostname)[1]}
              </a>
            </div>

            <div className="space-y-4 max-w-4xl select-text">
              {article.sections.map((section, index) => {
                switch (section.type) {
                  case 'heading':
                    const HeadingTag = `h${section.level}`;
                    return (
                      <HeadingTag key={index} className="font-bold mt-6">
                        {section.content}
                      </HeadingTag>
                    );

                  case 'paragraph':
                    return (
                      <p key={index} className="text-gray-700 dark:text-gray-200 leading-relaxed">
                        {section.content}
                      </p>
                    );

                  case 'image':
                    return (
                      <figure key={index} className="my-6">
                        <div className="relative bg-gray-100 border-2 dark:border-gray-800 rounded-lg overflow-hidden">
                          <img
                            src={section.src}
                            alt={section.alt}
                            className="max-w-full w-full h-auto mx-auto"
                            onError={(e) => {
                              // Fallback for failed images
                              e.target.parentElement.innerHTML = `
                                <div class="flex items-center justify-center p-8 text-gray-400 dark:text-gray-700 dark:text-gray-200">
                                  <span class="flex items-center gap-2">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Image failed to load
                                  </span>
                                </div>
                              `;
                            }}
                          />
                        </div>
                        {section.caption && (
                          <figcaption className="text-sm text-gray-50 dark:text-gray-black0 dark:text-gray-200 text-center mt-2">
                            {section.caption}
                          </figcaption>
                        )}
                      </figure>
                    );

                  case 'quote':
                    return (
                      <blockquote key={index} className="border-l-4 border-gray-300 pl-4 italic text-gray-600 dark:text-gray-300">
                        {section.content}
                      </blockquote>
                    );

                  default:
                    return null;
                }
              })}
            </div>
          </article>
        )}
      </div>
    </div>
  );
};

export default WebReader;