import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const MdToHtml = ({ url, className = '' }) => {
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMarkdown = async () => {
      if (!url) {
        setError('No URL provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch markdown: ${response.statusText}`);
        }

        const markdownText = await response.text();
        
        // Configure marked options
        marked.setOptions({
          gfm: true, // GitHub Flavored Markdown
          breaks: true, // Convert line breaks to <br>
          headerIds: true, // Add ids to headers
          mangle: false, // Don't escape HTML
          headerPrefix: 'heading-', // Prefix for header ids
          smartLists: true, // Use smarter list behavior
          smartypants: true // Use smart punctuation
        });

        // Convert markdown to HTML and sanitize
        const htmlContent = DOMPurify.sanitize(marked.parse(markdownText));
        setContent(htmlContent);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarkdown();
  }, [url]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 space-x-4 animate-pulse">
        <div className="w-4 h-4 bg-blue-200 rounded-full"></div>
        <div className="w-4 h-4 bg-blue-300 rounded-full"></div>
        <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-lg">
        <p className="font-medium">Error loading markdown:</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div 
      className={`markdown-content prose prose-blue max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default MdToHtml;