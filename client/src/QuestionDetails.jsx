import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Editor } from "@monaco-editor/react";
import axios from 'axios';
import { executeCode } from './api'; 
import { API_BASE_URL } from './auth';
import { CODE_SNIPPETS, LANGUAGE_VERSIONS } from "./Constants";
import './QuestionDetails.css';

export default function QuestionDetail() {
  const [question, setQuestion] = useState(null);
  const [expectedOutput, setExpectedOutput] = useState(null);
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [code, setCode] = useState(''); 
  const [language, setLanguage] = useState('cpp');
  const editorRef = useRef(null);
  
  const [output, setOutput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // Resizable state
  const [leftPanelWidth, setLeftPanelWidth] = useState(50);
  const [testPanelHeight, setTestPanelHeight] = useState(200);
  const [isResizingHorizontal, setIsResizingHorizontal] = useState(false);
  const [isResizingVertical, setIsResizingVertical] = useState(false);
  const containerRef = useRef(null);
  const testPanelRef = useRef(null);
  const languageDropdownRef = useRef(null);

  // Define LeetCode theme handler
  const handleEditorBeforeMount = (monaco) => {
    monaco.editor.defineTheme('leetcode-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'support.function', foreground: 'DCDCAA' },
        { token: 'entity.name.function', foreground: 'DCDCAA' },
        { token: 'meta.return-type', foreground: '4EC9B0' },
        { token: 'support.class', foreground: '4EC9B0' },
        { token: 'support.type', foreground: '4EC9B0' },
        { token: 'entity.name.type', foreground: '4EC9B0' },
        { token: 'entity.name.namespace', foreground: '4EC9B0' },
        { token: 'entity.name.class', foreground: '4EC9B0' },
        { token: 'keyword.control', foreground: 'C586C0' },
        { token: 'keyword.operator', foreground: 'C586C0' },
        { token: 'variable', foreground: '9CDCFE' },
        { token: 'entity.name.variable', foreground: '9CDCFE' },
        { token: 'variable.other.constant', foreground: '4FC1FF' },
        { token: 'variable.other.enummember', foreground: '4FC1FF' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'constant.character', foreground: '569cd6' },
        { token: 'constant.character.escape', foreground: 'd7ba7d' },
        { token: 'constant.numeric', foreground: 'b5cea8' },
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
      ],
      colors: {
        'editor.background': '#282828',
        'editor.foreground': '#D4D4D4',
        'editor.inactiveSelectionBackground': '#3A3D41',
        'editorIndentGuide.background': '#404040',
        'editorIndentGuide.activeBackground': '#707070',
        'editor.selectionHighlightBackground': '#ADD6FF26',
        'editor.lineHighlightBackground': '#2A2A2A',
        'editor.selectionBackground': '#5a5a5a',
        'editor.wordHighlightBackground': '#4a4a4a',
        'editor.wordHighlightStrongBackground': '#5a5a5a',
        'editor.findMatchBackground': '#4a4a4a',
        'editor.findMatchHighlightBackground': '#5a5a5a',
        'editorCursor.foreground': '#ffffff',
        'editorLineNumber.foreground': '#858585',
        'editorWhitespace.foreground': '#3b3b3b',
      }
    });
  };

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/questions`);
        if (response.data.questions) {
          const foundQuestion = response.data.questions.find(q => q._id === id);
          if (foundQuestion) {
            setQuestion(foundQuestion);
            setExpectedOutput(foundQuestion['Expected Output']);
            setCode(CODE_SNIPPETS[language] || '');
          }
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
      }
    };
    fetchQuestion();
  }, [id, language]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setShowLanguageDropdown(false);
      }
    };

    if (showLanguageDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageDropdown]);

  // Horizontal resize handlers
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingHorizontal && containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const newLeftWidth = (e.clientX / containerWidth) * 100;
        const constrainedWidth = Math.max(20, Math.min(80, newLeftWidth));
        setLeftPanelWidth(constrainedWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingHorizontal(false);
    };

    if (isResizingHorizontal) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingHorizontal]);

  // Vertical resize handlers
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingVertical && containerRef.current) {
        const containerHeight = containerRef.current.offsetHeight;
        const rightPanelTop = containerRef.current.querySelector('.right-panel')?.offsetTop || 0;
        const newHeight = containerHeight - (e.clientY - rightPanelTop);
        const minHeight = 150;
        const maxHeight = containerHeight * 0.6;
        const constrainedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
        setTestPanelHeight(constrainedHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizingVertical(false);
    };

    if (isResizingVertical) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingVertical]);

  const normalizeOutput = (output) => {
    if (!output) return '';
    return output
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[\n\r]+/g, ' ')
      .replace(/[^a-z0-9 ]/g, '')
      .replace(/\b(true|false|yes|no|1|0)\b/g, match => 
        match === 'true' || match === '1' || match === 'yes' ? 'true' : 'false'
      );
  };

  const handleRun = async () => {
    if (!code.trim()) return;
    
    try {
        setIsLoading(true);
      setIsError(false);
      setComparisonResult(null);
      
      const { run: result } = await executeCode(language, code);
      setOutput(result.output || '');
        setIsError(!!result.stderr);

        if (expectedOutput) {
            const userOutput = normalizeOutput(result.output);
            const expected = normalizeOutput(expectedOutput);
        
            if (userOutput === expected) {
          setComparisonResult("Accepted");
          setShowSuccess(true);
                setTimeout(() => {
            setShowSuccess(false);
            navigate('/subject');
          }, 2000);
            } else {
          setComparisonResult(`Wrong Answer`);
            }
        }
    } catch (error) {
      setIsError(true);
      setOutput(`Error: ${error.message || "Unable to run code"}`);
    } finally {
        setIsLoading(false);
    }
};

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return '#00b8a3';
      case 'medium': return '#ffc01e';
      case 'hard': return '#ff375f';
      default: return '#5e6e82';
    }
  };

  const getLanguageDisplayName = (lang) => {
    const names = {
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      python: 'Python',
      java: 'Java',
      cpp: 'C++',
      c: 'C',
      csharp: 'C#',
      php: 'PHP',
      go: 'Go',
      rust: 'Rust'
    };
    return names[lang] || lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  // Prevent body scrolling when component mounts
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!question) { 
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 53px)', backgroundColor: '#1e1e1e' }}>
        <div style={{ fontSize: '18px', color: '#ffffff' }}>Loading question...</div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      style={{ 
        display: 'flex', 
        height: 'calc(100vh - 53px)', // Account for navbar height
        backgroundColor: '#1e1e1e', 
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Left Panel - Question */}
      <div 
        style={{ 
          width: `${leftPanelWidth}%`, 
          backgroundColor: '#262626', 
          borderRight: '1px solid #3d3d3d',
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minWidth: '300px',
          maxWidth: '80%',
          height: '100%'
        }}
      >
        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid #3d3d3d',
          backgroundColor: '#1e1e1e',
          padding: '0 20px'
        }}>
          <button
            onClick={() => setActiveTab('description')}
            style={{
              padding: '12px 16px',
              border: 'none',
              backgroundColor: activeTab === 'description' ? '#262626' : 'transparent',
              borderBottom: activeTab === 'description' ? '2px solid #ffffff' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === 'description' ? '500' : '400',
              color: activeTab === 'description' ? '#ffffff' : '#9ca3af',
              marginBottom: '-1px'
            }}
          >
            Description
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', flex: 1 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: '600', 
              color: '#ffffff',
              margin: 0,
              lineHeight: '1.2'
            }}>
              {question['Question Title'] || 'Question'}
            </h1>
            {question.difficulty && (
              <span style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '500',
                color: '#ffffff',
                backgroundColor: getDifficultyColor(question.difficulty)
              }}>
                {question.difficulty}
              </span>
            )}
          </div>

          {/* Problem Statement */}
          <div style={{ marginBottom: '32px', lineHeight: '1.6', color: '#e5e7eb' }}>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: '15px' }}>
              {question['Question Text'] || 'No description available.'}
            </div>
          </div>

          {/* Examples */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              marginBottom: '16px',
              color: '#ffffff'
            }}>
              Example:
            </h3>
            <div style={{ 
              backgroundColor: '#1e1e1e', 
              borderRadius: '8px', 
              padding: '16px',
              border: '1px solid #3d3d3d'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#e5e7eb', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Input:</strong>
                <pre style={{ 
                  margin: 0,
                  padding: '12px',
                  backgroundColor: '#1e1e1e',
                  borderRadius: '4px',
                  border: '1px solid #3d3d3d',
                  fontSize: '13px',
                  color: '#e5e7eb',
                  fontFamily: 'Monaco, "Courier New", monospace',
                  overflow: 'auto'
                }}>
                  {question['Input'] || 'N/A'}
                </pre>
              </div>
              <div>
                <strong style={{ color: '#e5e7eb', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Output:</strong>
                <pre style={{ 
                  margin: 0,
                  padding: '12px',
                  backgroundColor: '#1e1e1e',
                  borderRadius: '4px',
                  border: '1px solid #3d3d3d',
                  fontSize: '13px',
                  color: '#e5e7eb',
                  fontFamily: 'Monaco, "Courier New", monospace',
                  overflow: 'auto'
                }}>
                  {question['Expected Output'] || 'N/A'}
                </pre>
              </div>
            </div>
          </div>

          {/* Tags */}
          {question['Topic Tagged text'] && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                marginBottom: '16px',
                color: '#ffffff'
              }}>
                Tags:
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {question['Topic Tagged text'].split(',').map((tag, idx) => (
                  <span key={idx} style={{
                    padding: '4px 12px',
                    backgroundColor: '#3d3d3d',
                    color: '#60a5fa',
                    borderRadius: '16px',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>
                    {tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>

      {/* Resizer Handle - Vertical */}
      <div
        onMouseDown={() => setIsResizingHorizontal(true)}
        style={{
          width: '4px',
          backgroundColor: '#3d3d3d',
          cursor: 'col-resize',
          position: 'relative',
          flexShrink: 0
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#60a5fa';
        }}
        onMouseLeave={(e) => {
          if (!isResizingHorizontal) {
            e.currentTarget.style.backgroundColor = '#3d3d3d';
          }
        }}
      />

      {/* Right Panel - Code Editor */}
      <div 
        className="right-panel"
        style={{ 
          width: `${100 - leftPanelWidth}%`, 
          display: 'flex', 
          flexDirection: 'column',
          backgroundColor: '#1e1e1e',
          minWidth: '300px'
        }}
      >
        {/* Editor Header with Tabs */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '0',
          borderBottom: '1px solid #3d3d3d',
          backgroundColor: '#262626',
          flexShrink: 0,
          height: '48px'
        }}>
          {/* Left side - Code tab */}
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              padding: '0 16px',
              height: '100%',
              borderBottom: '2px solid #ffffff',
              backgroundColor: '#262626'
            }}>
              <span style={{ fontSize: '16px', marginRight: '6px', color: '#ffffff' }}>{'</>'}</span>
              <span style={{ 
                fontSize: '13px',
                fontWeight: '500',
                color: '#ffffff'
              }}>
                Code
              </span>
            </div>
          </div>

          {/* Right side - Language selector and buttons */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            padding: '0 16px',
            height: '100%'
          }}>
            {/* Modern Language Selector */}
            <div ref={languageDropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  border: '1px solid #3d3d3d',
                  borderRadius: '4px',
                  fontSize: '13px',
                  backgroundColor: '#1e1e1e',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  minWidth: '80px',
                  justifyContent: 'space-between'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#60a5fa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#3d3d3d';
                }}
              >
                <span>{getLanguageDisplayName(language)}</span>
                <svg 
                  width="12" 
                  height="12" 
                  viewBox="0 0 12 12" 
                  fill="none" 
                  style={{ 
                    transform: showLanguageDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}
                >
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showLanguageDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  backgroundColor: '#262626',
                  border: '1px solid #3d3d3d',
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  zIndex: 1000,
                  minWidth: '200px',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  padding: '8px 0'
                }}>
                  {Object.entries(LANGUAGE_VERSIONS).map(([lang, version]) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguage(lang);
                        setShowLanguageDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        border: 'none',
                        backgroundColor: language === lang ? '#1e1e1e' : 'transparent',
                        color: '#ffffff',
                        fontSize: '13px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontFamily: 'inherit'
                      }}
                      onMouseEnter={(e) => {
                        if (language !== lang) {
                          e.currentTarget.style.backgroundColor = '#1e1e1e';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (language !== lang) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <span>{getLanguageDisplayName(lang)}</span>
                      {language === lang && (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* LeetCode-style Run Button */}
            <button
              onClick={handleRun}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 16px',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: '500',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                backgroundColor: isLoading ? '#6b7280' : '#22c55e',
                color: '#ffffff',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
                opacity: isLoading ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#16a34a';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#22c55e';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                <path d="M3 2L11 7L3 12V2Z" fill="#ffffff" stroke="#ffffff" strokeWidth="1"/>
              </svg>
              <span>Run</span>
            </button>

            {/* LeetCode-style Submit Button */}
            <button
              onClick={handleRun}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 16px',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: '500',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                backgroundColor: '#22c55e',
                color: '#ffffff',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
                opacity: isLoading ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#16a34a';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#22c55e';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                <path d="M7 1L9 5L13 6L9 7L7 11L5 7L1 6L5 5L7 1Z" fill="#ffffff"/>
              </svg>
              <span>Submit</span>
            </button>
          </div>
        </div>

        {/* Code Editor */}
        <div style={{ 
          flex: 1, 
          position: 'relative', 
          minHeight: 0,
          height: `calc(100% - ${testPanelHeight}px - 48px)`,
          backgroundColor: '#1e1e1e'
        }}>
          <Editor
            height="100%"
            language={language}
            theme="leetcode-dark"
            value={code}
            onChange={(value) => setCode(value || '')}
            beforeMount={handleEditorBeforeMount}
            onMount={handleEditorMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'off',
              padding: { top: 16 },
            }}
          />
        </div>

        {/* Resizer Handle - Horizontal (for test panel) */}
        <div
          onMouseDown={() => setIsResizingVertical(true)}
          style={{
            height: '4px',
            backgroundColor: '#3d3d3d',
            cursor: 'row-resize',
            position: 'relative',
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#60a5fa';
          }}
          onMouseLeave={(e) => {
            if (!isResizingVertical) {
              e.currentTarget.style.backgroundColor = '#3d3d3d';
            }
          }}
        />

        {/* Test Results Panel */}
        <div 
          ref={testPanelRef}
          style={{ 
            height: `${testPanelHeight}px`,
            borderTop: '1px solid #3d3d3d',
            backgroundColor: '#1e1e1e',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '150px',
            maxHeight: '60%',
            flexShrink: 0
          }}
        >
          <div style={{ 
            display: 'flex',
            borderBottom: '1px solid #3d3d3d',
            padding: '8px 16px',
            backgroundColor: '#262626',
            flexShrink: 0
          }}>
            <button style={{
              padding: '8px 16px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: '2px solid #ffffff',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              color: '#ffffff',
              marginBottom: '-8px'
            }}>
              {'>_ Test Result'}
            </button>
          </div>
          <div style={{ 
            padding: '16px',
            flex: 1,
            overflowY: 'auto',
            backgroundColor: '#1e1e1e'
          }}>
            {isLoading ? (
              <div style={{ color: '#9ca3af', fontSize: '14px' }}>Running your code...</div>
            ) : output !== null ? (
              <div>
                {comparisonResult && (
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '16px',
                    color: comparisonResult === 'Accepted' ? '#22c55e' : '#ef4444'
                  }}>
                    {comparisonResult}
                  </div>
                )}
                {isError ? (
                  <pre style={{ 
                    color: '#ef4444', 
                    fontSize: '13px', 
                    whiteSpace: 'pre-wrap', 
                    fontFamily: 'Monaco, "Courier New", monospace',
                    margin: 0
                  }}>
                    {output}
                  </pre>
                ) : (
                  <div>
                    <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>Input:</div>
                    <pre style={{
                      margin: '0 0 12px 0',
                      padding: '8px',
                      backgroundColor: '#262626',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontFamily: 'Monaco, "Courier New", monospace',
                      color: '#e5e7eb',
                      border: '1px solid #3d3d3d'
                    }}>
                      {question['Input'] || 'N/A'}
                    </pre>
                    <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>Output:</div>
                    <pre style={{
                      margin: 0,
                      padding: '8px',
                      backgroundColor: '#262626',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontFamily: 'Monaco, "Courier New", monospace',
                      color: '#e5e7eb',
                      border: '1px solid #3d3d3d'
                    }}>
                      {output}
                    </pre>
            </div>
                )}
            </div>
            ) : (
              <div style={{ color: '#6b7280', fontSize: '14px' }}>Run your code to see output here</div>
            )}
            </div>
          </div>
        </div>

      {/* Success Modal */}
      {showSuccess && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#262626',
            borderRadius: '8px',
            padding: '32px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            border: '1px solid #3d3d3d'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: '600', 
              color: '#22c55e', 
              marginBottom: '8px',
              margin: 0
            }}>
              Accepted!
            </h2>
            <p style={{ color: '#9ca3af', marginBottom: '24px', marginTop: '8px' }}>
              Your solution is correct!
            </p>
            <button
              onClick={() => {
                setShowSuccess(false);
                navigate('/subject');
              }}
              style={{
                padding: '10px 24px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: '#22c55e',
                color: '#ffffff',
                width: '100%'
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
