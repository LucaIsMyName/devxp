import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import Button from '../partials/Button';
import { Copy, FileUp } from 'lucide-react';

const formatters = {
  json: (str, isTreeView) => {
    const parsed = JSON.parse(str);
    return isTreeView ? parsed : JSON.stringify(parsed, null, 2);
  },
  javascript: (str) => window.prettier.format(str, {
    parser: 'babel',
    plugins: window.prettierPlugins,
    printWidth: 80,
    tabWidth: 2,
    semi: true,
    singleQuote: true
  }),
  html: (str) => window.prettier.format(str, {
    parser: 'html',
    plugins: window.prettierPlugins,
    printWidth: 80,
    tabWidth: 2,
    htmlWhitespaceSensitivity: 'css'
  }),
  css: (str) => window.prettier.format(str, {
    parser: 'css',
    plugins: window.prettierPlugins,
    printWidth: 80,
    tabWidth: 2
  })
};
const CodeEditorLayout = ({ 
  leftTitle, 
  rightTitle,
  leftValue,
  rightValue,
  onLeftChange,
  leftExtensions = [],
  rightExtensions = [],
  error = null,
  onFileUpload = null // New prop for file handling
}) => {
  const editorConfig = {
    height: "100%",
    extensions: [
      EditorView.lineWrapping,
      EditorView.theme({
        "&": { height: "100%" }
      })
    ]
  };

  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
  };

  return (
    <div data-component="CodeEditorLayout" className="flex-1 flex flex-col lg:grid lg:grid-cols-2 min-h-0">
      <div className="h-[50vh] lg:h-full overflow-y-scroll flex flex-col">
        <div className="py-3 pl-4 border-b-2 border-r-2 flex justify-between items-center sticky top-0 z-0">
          <h3 className="font-medium text-gray-700">{leftTitle}</h3>
          <div className="flex gap-2 mr-2">
            {onFileUpload && (
              <>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={onFileUpload}
                />
                <Button 
                  onClick={() => document.getElementById('file-upload').click()}
                >
                  <FileUp className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button 
              onClick={() => copyToClipboard(leftValue)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 bg-white min-h-0 overflow-auto border-r-2">
          <CodeMirror
            value={leftValue}
            height="100%"
            {...editorConfig}
            extensions={[...leftExtensions, ...editorConfig.extensions]}
            onChange={onLeftChange}
          />
        </div>
      </div>

      <div className="h-[50vh] lg:h-full overflow-y-scroll flex flex-col">
        <div className="py-3 px-4 border-b-2 flex justify-between items-center sticky top-0 z-0">
          <h3 className="font-medium text-gray-700">{rightTitle}</h3>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => copyToClipboard(rightValue)}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 bg-white min-h-0 overflow-auto">
          {error ? (
            <div className="text-red-500 p-4 bg-red-50 rounded m-4">
              {error}
            </div>
          ) : (
            <CodeMirror
              value={rightValue}
              height="100%"
              {...editorConfig}
              extensions={[...rightExtensions, ...editorConfig.extensions]}
              editable={false}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeEditorLayout;