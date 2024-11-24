import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import Placeholder from './Placeholder';

const MdToHtml = ({ url, className = '' }) => {
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const setupMarkedRenderer = () => {
    const renderer = new marked.Renderer();

    // Helper function to safely stringify content
    const safeText = (text) => {
      if (text === null || text === undefined) return '';
      if (typeof text === 'string') return text;
      if (typeof text === 'object') {
        console.log('Object received in safeText:', text);
        if (text.text) return text.text;
        if (text.raw) return text.raw;
        return JSON.stringify(text);
      }
      return String(text);
    };

    renderer.heading = (text, level = 3) => {
      console.log('Heading:', { text, level });
      switch (level) {
        case 1:
          return `<h1 class="text-3xl font-bold mt-8 mb-4" id="heading ${safeText(text)}">${safeText(text)}</h1>`;
        case 2:
          return `<h2 class="text-2xl font-bold mt-6 mb-3" id="heading ${safeText(text)}">${safeText(text)}</h2>`;
        case 3:
          return `<h3 class="text-xl font-bold mt-4 mb-2" id="heading ${safeText(text)}">${safeText(text)}</h3>`;
        case 4:
          return `<h4 class="text-lg font-bold mt-3 mb-2" id="heading ${safeText(text)}">${safeText(text)}</h4>`;
        case 5:
          return `<h5 class="text-base font-bold mt-2 mb-1" id="heading ${safeText(text)}">${safeText(text)}</h5>`;
        case 6:
          return `<h6 class="text-sm font-bold mt-2 mb-1" id="heading ${safeText(text)}">${safeText(text)}</h6>`;
        default:
          return `<p id="heading-${safeText(level)}">${safeText(text)}</p>`;
      }
    };

    renderer.paragraph = (text) => {
      console.log('Paragraph:', { text });
      return `<p class="text-gray-700 leading-relaxed mb-4">${safeText(text)}</p>`;
    };

    renderer.list = (body, ordered) => {
      console.log('List:', { body, ordered });
      const type = ordered ? 'ol' : 'ul';
      const listClass = ordered ? 'list-decimal' : 'list-disc';
      return `<${type} class="${listClass} pl-6 mb-4 space-y-2">${safeText(body)}</${type}>`;
    };

    renderer.listitem = (text) => {
      console.log('List item:', { text });
      return `<li class="text-gray-700">${safeText(text)}</li>`;
    };

    renderer.codespan = (code) => {
      console.log('Codespan:', { code });
      return `<code class="bg-gray-100 text-gray-800 rounded px-1 py-0.5 font-mono text-sm">${safeText(code)}</code>`;
    };

    renderer.code = (code, language) => {
      console.log('Code block:', { code, language });
      return `<pre class="bg-gray-100 rounded-lg p-4 mb-4 overflow-x-auto">
                <code class="text-sm font-mono text-gray-800">${safeText(code)}</code>
              </pre>`;
    };

    return renderer;
  };

  const processMarkdown = (text) => {
    // If the input is already a string, return it
    if (typeof text === 'string') return text;

    try {
      // If it's JSON-like content, try to extract meaningful text
      if (typeof text === 'object' && text !== null) {
        console.log('Processing object:', text);

        if (text.tokens) {
          return text.tokens.map(token => {
            if (typeof token === 'string') return token;
            return token.text || token.raw || '';
          }).join('');
        }

        if (text.text) return text.text;
        if (text.raw) return text.raw;

        // For other objects, convert to string
        return JSON.stringify(text);
      }
    } catch (e) {
      console.error('Error processing markdown:', e);
    }

    // Fallback to string conversion
    return String(text);
  };

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

        let markdownText = await response.text();
        console.log('Raw markdown:', markdownText);

        // Process the markdown content
        markdownText = processMarkdown(markdownText);
        console.log('Processed markdown:', markdownText);

        // Configure marked options
        marked.setOptions({
          renderer: setupMarkedRenderer(),
          gfm: true,
          breaks: true,
          headerIds: true,
          mangle: false,
          headerPrefix: 'heading-',
          smartLists: true,
          smartypants: true,
          xhtml: true
        });

        // Convert markdown to HTML and sanitize
        const htmlContent = DOMPurify.sanitize(marked.parse(markdownText));
        console.log('Final HTML:', htmlContent);
        setContent(htmlContent);
      } catch (err) {
        console.error('Error in fetchMarkdown:', err);
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
        <Placeholder width="md" />
        <Placeholder width="lg" />
        <Placeholder width="sm" />
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
    <article
      className={`markdown-content prose prose-slate max-w-none select-text ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default MdToHtml;