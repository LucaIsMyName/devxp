
import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Eye, Image } from 'lucide-react';
import Button from '../partials/Button';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import CodeEditorLayout from '../partials/CodeEditorLayout';
import Modal from '../partials/Modal';

const STORAGE_KEY = 'svg-css-converter-state';

const ConvertSvgCss = () => {
  const [direction, setDirection] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).direction : 'svg-to-css';
  });

  const [input, setInput] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).input : '';
  });

  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ direction, input }));
  }, [direction, input]);

  const svgToCss = (svgContent) => {
    const trimmed = svgContent.trim();
    if (!trimmed.startsWith('<svg') || !trimmed.endsWith('</svg>')) {
      throw new Error('Input must be a valid SVG element');
    }

    const encoded = encodeURIComponent(trimmed)
      .replace(/'/g, '%27')
      .replace(/"/g, '%22');

    return `background-image: url("data:image/svg+xml,${encoded}");`;
  };

  const cssToSvg = (cssContent) => {
    const match = cssContent.match(/url\("data:image\/svg\+xml,(.*?)"\)/);
    if (!match) {
      throw new Error('Input must be a valid CSS background-image with SVG data URL');
    }

    const decoded = decodeURIComponent(match[1])
      .replace(/%27/g, "'")
      .replace(/%22/g, '"');

    if (!decoded.startsWith('<svg') || !decoded.endsWith('</svg>')) {
      throw new Error('Invalid SVG content in data URL');
    }

    return decoded;
  };

  const handleConvert = (value) => {
    if (!value.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      if (direction === 'svg-to-css') {
        setOutput(svgToCss(value));
      } else {
        setOutput(cssToSvg(value));
      }
      setError(null);
    } catch (err) {
      setError(`Invalid ${direction === 'svg-to-css' ? 'SVG' : 'CSS'}: ${err.message}`);
      setOutput('');
    }
  };

  const handleSwitch = () => {
    const newDirection = direction === 'svg-to-css' ? 'css-to-svg' : 'svg-to-css';
    setDirection(newDirection);
    setInput(output);
    setOutput(input);
    setError(null);
  };

  // Preview panel component
  const Preview = () => {
    const previewContent = direction === 'svg-to-css' ? input : output;

    if (!previewContent || error) return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No valid SVG to preview
      </div>
    );

    // If it's SVG content, render directly
    if (previewContent.trim().startsWith('<svg')) {
      return (
        <div
          className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg"
          dangerouslySetInnerHTML={{ __html: previewContent }}
        />
      );
    }

    // If it's CSS content, apply as background
    return (
      <div
        className="w-full h-full rounded-lg border border-gray-200"
        style={{
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: '200px 200px',
          ...Object.fromEntries(
            previewContent
              .split(';')
              .map(rule => rule.split(':').map(s => s.trim()))
              .filter(([k]) => k)
          )
        }}
      />
    );
  };

  useEffect(() => {
    handleConvert(input);
  }, []);

  return (
    <div data-component="ConvertSvgCss" className="h-screen flex flex-col">
      <div className="flex items-center gap-4 p-4 pb-0">
        <Button
          onClick={handleSwitch}
          className="flex items-center gap-2 px-4"
        >
          <span>{direction === 'svg-to-css' ? 'SVG → CSS' : 'CSS → SVG'}</span>
          <ArrowRightLeft className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => setShowPreview(!showPreview)}
          className={`flex items-center gap-2 px-4 ${showPreview ? 'bg-blue-100' : ''}`}
        >
          <Eye className="h-4 w-4" />
          <span>Preview</span>
        </Button>
      </div>

      <div className="flex-1 flex">
        <CodeEditorLayout
          leftTitle={direction === 'svg-to-css' ? 'SVG' : 'CSS'}
          rightTitle={direction === 'svg-to-css' ? 'CSS' : 'SVG'}
          leftValue={input}
          rightValue={output}
          onLeftChange={(value) => {
            setInput(value);
            handleConvert(value);
          }}
          leftExtensions={[direction === 'svg-to-css' ? html() : javascript()]}
          rightExtensions={[direction === 'svg-to-css' ? javascript() : html()]}
          error={error}
          className={showPreview ? 'col-span-2' : 'col-span-2'}
        />
        {showPreview && (
          <Modal isOpen={true}
            onClose={
              () => setShowPreview(false)
            }
            title={
              <div className='flex gap-2 items-center'><Image className='size-5' /> <p>Preview</p></div>
            }
            className="fixed bg-white dark:bg-black top-0 right-0 bottom-0 h-screen border-l-2 w-full w-[clamp(320px,33vw,768px)] dark:border-gray-800 p-4">
            <div className="h-[calc(100%-2rem)]">
              <Preview />
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default ConvertSvgCss;