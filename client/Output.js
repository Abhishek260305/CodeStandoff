import { useState } from "react";
import { executeCode } from "./api";
import "./Output.css"

const Output = ({ editorRef, language }) => {
  const [output, setOutput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const runCode = async () => {
    const sourceCode = editorRef.current.getValue();
    if (!sourceCode) return;
    try {
      setIsLoading(true);
      const { run: result } = await executeCode(language, sourceCode);
      setOutput(result.output.split("\n"));
      result.stderr ? setIsError(true) : setIsError(false);
    } catch (error) {
      console.log(error);
      alert(`An error occurred: ${error.message || "Unable to run code"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="output-container">
      {/* <h2>Output</h2> */}
      <button
        className={`run-button ${isLoading ? "loading" : ""}`}
        onClick={runCode}
        disabled={isLoading}
      >
        {isLoading ? "Running..." : "Run Code"}
      </button>
     
      <div
        className={`output-box ${isError ? "error" : ""}`}
      >
        <div id='TCH'>
        <div className="TCbutton">
          <button>Test Case</button>
          <button>Test Result</button>
          </div>
      </div>

      <div className="space">

</div>
        {output
          ? output.map((line, i) => <p key={i}>{line}</p>)
          : 'Click "Run Code" to see the output here'}
           
      </div>
      
    </div>
  );
};

export default Output;
