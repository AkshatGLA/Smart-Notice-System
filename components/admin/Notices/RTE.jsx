import React, { useState, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Controller } from 'react-hook-form';
import { FaExpand, FaCompress } from 'react-icons/fa';

export default function RTE({ name, control, label, defaultValue = "" }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const editorRef = useRef(null);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (editorRef.current) {
      if (!isFullscreen) {
        editorRef.current.editor.execCommand('mceFullScreen');
      } else {
        editorRef.current.editor.execCommand('mceFullScreen');
      }
    }
  };

  return (
    <div className={`w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-4' : ''}`}>
      <div className="flex justify-between items-center mb-1">
        {label && <label className='inline-block pl-1'>{label}</label>}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="text-gray-500 hover:text-gray-700"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <FaCompress size={18} /> : <FaExpand size={18} />}
        </button>
      </div>

      <Controller
        name={name || "content"}
        control={control}
        defaultValue={defaultValue}
        render={({ field: { onChange, value } }) => (
          <Editor
            apiKey="3sin62j8rlf51ngh4mypckvi1zncy6klqmu9u964f29qgehp"
            onInit={(evt, editor) => (editorRef.current = { editor })}
            value={value}
            init={{
              height: isFullscreen ? 'calc(100vh - 80px)' : 500,
              menubar: true,
              plugins: [
                "fullscreen", // Make sure this plugin is included
                "image",
                "advlist",
                "autolink",
                "lists",
                "link",
                "image",
                "charmap",
                "preview",
                "anchor",
                "searchreplace",
                "visualblocks",
                "code",
                "fullscreen",
                "insertdatetime",
                "media",
                "table",
                "code",
                "help",
                "wordcount",
                "anchor",
              ],
              toolbar: "undo redo | blocks | image | bold italic forecolor | alignleft aligncenter bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help | fullscreen",
              content_style: "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
              setup: (editor) => {
                editor.on('FullscreenStateChanged', (e) => {
                  setIsFullscreen(e.state);
                });
              }
            }}
            onEditorChange={onChange}
          />
        )}
      />
    </div>
  );
}