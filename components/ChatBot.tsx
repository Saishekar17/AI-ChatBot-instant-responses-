// pages/index.tsx
"use client"
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

interface Message {
  text: string;
  alignment: 'left' | 'right';
}

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [receiving, setReceiving] = useState(false);
  const chatboxRef = useRef<HTMLDivElement>(null);
  const chatId = useRef<string>('');

  useEffect(() => {
    chatId.current = crypto.randomUUID();
  }, []);

  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [messages]);

  const systemPrompt = "You are an AI assistant providing intelligent and efficient responses to the user's inquiries.";

  const connectWebSocket = (message: string) => {
    setReceiving(true);
    const url = "wss://backend.buildpicoapps.com/api/chatbot/chat";
    const websocket = new WebSocket(url);

    websocket.addEventListener("open", () => {
      websocket.send(
        JSON.stringify({
          chatId: chatId.current,
          appId: "daughter-both",
          systemPrompt: systemPrompt,
          message: message,
        })
      );
    });

    let aiMessage = '';
    websocket.onmessage = (event) => {
      aiMessage += event.data;
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { text: aiMessage, alignment: 'left' };
        return newMessages;
      });
    };

    websocket.onclose = async (event) => {
      if (event.code === 1000) {
        setReceiving(false);
      } else {
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { 
            text: aiMessage + "Error getting response from server. Refresh the page and try again.", 
            alignment: 'left' 
          };
          return newMessages;
        });
        setReceiving(false);
      }
    };
  };

  const handleSendMessage = async () => {
    if (!receiving && inputMessage.trim() !== "") {
      const messageText = inputMessage.trim();
      setInputMessage('');
      setMessages(prev => [...prev, { text: messageText, alignment: 'right' }, { text: '', alignment: 'left' }]);
      connectWebSocket(messageText);
      // Note: storeMessageInDatabase function is not implemented in this example
      // await storeMessageInDatabase(chatId.current, messageText);
    }
  };

  return (
    <div className= "mt-14">
      <Head>
        <title>AI Chat Application</title>
        <link
          href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.3/dist/tailwind.min.css"
          rel="stylesheet"
        />
      </Head>

      <header className="text-center p-4">
        <h1 className="text-3xl font-bold">AI Chat Application</h1>
        <p className="mt-2">Chat with the AI and get instant responses!</p>
      
      </header>

      <div className="flex justify-center">
        <div className="px-2 w-full max-w-2xl">
          <div ref={chatboxRef} className="flex flex-col items-start h-64 overflow-y-auto p-5 border border-gray-600 rounded my-5">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`inline-block my-2.5 p-2.5 rounded border ${
                  message.alignment === "left" ? "self-start bg-white font-bold text-black text-sm" : "self-end bg-white text-sm text-black font-medium"
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>
          <div className="flex flex-row mt-10">
            <input
              className="shadow text-black flex-grow rounded p-2 mr-2 border border-black focus:outline-none"
              type="text"
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !receiving && inputMessage.trim() !== "") {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <button
              className="rounded py-2 px-4 font-bold border border-white"
              onClick={handleSendMessage}
            >
              Ask AI
            </button>
          </div>
        </div>
      </div>
      <footer className='font-bold text-center mt-10'>AI chatBot Copyrights@2024 SaiShekar </footer>
    </div>
  );
}