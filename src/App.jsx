import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: ""
 });

const inputChat = document.querySelector("#chat");
const outputChat = document.querySelector("#yap");

function App() {
  const [count, setCount] = useState(0);



  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <input type='text' id='chat'></input>
        <button onClick={() => {    
          async function main() {
          const question = inputChat.value;

          console.log(question);
          const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: `${question}, answer in less than 30 words` ,
          });
          console.log(response.text);
          const answer = response.text;
          outputChat.innerHTML = answer;
          }

          main();
          }}
        >
          ask about
        </button>
        <p id='yap'></p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
