import { useRef, useState } from "react";
import { Editor } from "@monaco-editor/react";
import LanguageSelector from "./LanguageSelector";
import { CODE_SNIPPETS } from "./constants";
import Output from "./Output";
import "./CodeEditor.css"

const CodeEditor = () => {
  const editorRef = useRef();
  const [value, setValue] = useState("");
  const [language, setLanguage] = useState("javascript");

  const onMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  const onSelect = (language) => {
    setLanguage(language);
    setValue(CODE_SNIPPETS[language]);
  };

  return (
    <div className="code-editor-container">
      {/* Header: Logo and DPs */}
      <div className="header">
        {/* Logo */}
        <img src="/path/to/logo.png" alt="Logo" className="logo" />
        
        {/* Player DPs */}
        <div className="dp-container">
          <img src="/path/to/your-dp.png" alt="Your DP" className="dp" />
          <span>VS</span>
          <img src="/path/to/opp-dp.png" alt="Opponent DP" className="dp" />
        </div>

        {/* Buttons */}
        <div className="action-buttons">
          <button className="surrender-button">Surrender</button>
        </div>
      </div>

      <div className="main-content">
        {/* Left Column: Question box and Chat */}
        <div className="left-column">
          {/* Question Box */}
          <div className="question-box">
            <p>Question with input and output</p>
          </div>

          {/* Chat Box */}
          <div className="chat-box">
            <p>Chat with opponent</p>
          </div>
        </div>

        {/* Right Column: Code Editor and Output */}
        <div className="right-column">
          {/* Code Editor */}
          <div className="code-editor">
            <LanguageSelector language={language} onSelect={onSelect} />
            <p className="code-editor-header">Write your Code Here</p>
            <Editor
              options={{ minimap: { enabled: false } }}
              height="350px"
              
              theme="vs-dark"
              language={language}
              defaultValue={CODE_SNIPPETS[language]}
              onMount={onMount}
              value={value}
              onChange={(value) => setValue(value)}
            />
          </div>

          {/* Output Box */}
          <Output editorRef={editorRef} language={language} />
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
