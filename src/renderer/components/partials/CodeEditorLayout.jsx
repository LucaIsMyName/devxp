
import React, { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import Button from '../partials/Button';
import { Copy, FileUp, WrapText } from 'lucide-react';

const CodeEditorLayout = ({
  leftTitle,
  rightTitle,
  leftValue,
  rightValue,
  onLeftChange,
  leftExtensions = [],
  rightExtensions = [],
  error = null,
  onFileUpload = null
}) => {
  const [leftLineWrap, setLeftLineWrap] = useState(true);
  const [rightLineWrap, setRightLineWrap] = useState(true);

  const leftEditorConfig = {
    height: "100%",
    extensions: [
      ...(leftLineWrap ? [EditorView.lineWrapping] : []),
      EditorView.theme({
        "&": { height: "100%" }
      })
    ]
  };

  const rightEditorConfig = {
    height: "100%",
    extensions: [
      ...(rightLineWrap ? [EditorView.lineWrapping] : []),
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
        <div className="py-3 pl-4 border-b-2 dark:border-gray-800 border-r-2 dark:border-gray-800 flex justify-between items-center sticky top-0 z-0">
          <h3 className="font-medium text-gray-700 dark:text-gray-200">{leftTitle}</h3>
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
                  <FileUp className="h-4 h-4" />
                </Button>
              </>
            )}
            <Button
              isActive={leftLineWrap}
              onClick={() => setLeftLineWrap(!leftLineWrap)}
              className={`flex items-center gap-1 ${leftLineWrap ? '' : ''}`}
            >
              <WrapText className={`h-4 w-4 text-black dark:text-white`} />
            </Button>
            <Button onClick={() => copyToClipboard(leftValue)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 bg-white dark:bg-gray-900 min-h-0 overflow-auto border-r-2 dark:border-gray-800">
          <CodeMirror
            value={leftValue}
            height="100%"
            {...leftEditorConfig}
            extensions={[...leftExtensions, ...leftEditorConfig.extensions]}
            onChange={onLeftChange}
          />
        </div>
      </div>

      <div className="h-[50vh] lg:h-full overflow-y-scroll flex flex-col">
        <div className="py-3 px-4 border-b-2 dark:border-gray-800 flex justify-between items-center sticky top-0 z-0">
          <h3 className="font-medium text-gray-700 dark:text-gray-200">{rightTitle}</h3>
          <div className="flex gap-2">
            <Button
              isActive={rightLineWrap}
              onClick={() => setRightLineWrap(!rightLineWrap)}
              className={`flex items-center gap-1 ${rightLineWrap ? '' : ''}`}
            >
              <WrapText className="h-4 w-4 text-black dark:text-white" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => copyToClipboard(rightValue)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 bg-white dark:bg-gray-900 min-h-0 overflow-auto">
          {error ? (
            <div className="text-red-500 p-4 bg-red-50 rounded m-4">
              {error}
            </div>
          ) : (
            <CodeMirror
              value={rightValue}
              height="100%"
              {...rightEditorConfig}
              extensions={[...rightExtensions, ...rightEditorConfig.extensions]}
              editable={false}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeEditorLayout;
