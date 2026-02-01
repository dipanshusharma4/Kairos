"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { IoIosLogOut } from "react-icons/io";
import { HiMenuAlt3 } from "react-icons/hi";
import { IoMdClose } from "react-icons/io";
import { FaPlus } from "react-icons/fa6";
import { RiVoiceprintFill } from "react-icons/ri";
import { IoSendSharp } from "react-icons/io5";

export default function chatbot() {
  const { data: session, status } = useSession();
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sideBarRef = useRef(null);

  //   const websocket = useRef(null);
  const messageEndRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event) {
      if (sideBarRef.current && !sideBarRef.current.contains(event.target)) {
        setIsSidebarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sideBarRef]);

  useEffect(() => {
    document.title = "Chatbot - Kairos";
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "loading" || status === "unauthenticated") {
      return;
    }
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        setChatMessages([]);
      } catch (error) {
        setChatMessages([
          { sender: "Kairos", text: "Error connecting. Please refresh." },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [session, status]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isLoading]);

  // useEffect(() => {
  //     if (!session) return;

  //     const fetchHistory = async () => {
  //         setIsLoading(true);
  //         try {
  //             // Calls the correct, simpler history endpoint
  //             const response = await fetch(`${API_URL}/api/chat/history/${userId}`);
  //             if (response.ok) {
  //                 const history = await response.json();
  //                 const formatted = history.map(msg => ({ sender: msg.role === 'user' ? 'You' : 'Kairos', text: msg.content }));
  //                 setChatMessages(formatted.length > 0 ? formatted : [{ sender: "Kairos", text: "Welcome! How can I help?" }]);
  //             } else {
  //                setChatMessages([{ sender: "Kairos", text: "Welcome! How can I help?" }]);
  //             }
  //         } catch (error) {
  //             setChatMessages([{ sender: "Kairos", text: "Error connecting. Please refresh." }]);
  //         } finally {
  //             setIsLoading(false);
  //         }
  //     };
  //     fetchHistory();
  // }, [session]);

  const handleSend = async () => {
    if (!chatInput.trim()) return;

    setIsLoading(true);
    const userMessage = { sender: "You", text: chatInput };
    const updatedMessages = [...chatMessages, userMessage];

    setChatMessages(updatedMessages);
    setChatInput("");

    try {
      const historyForApi = updatedMessages.map((msg) => ({
        role: msg.sender === "You" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: chatInput,
          history: historyForApi,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      const botResponse = { sender: "Kairos", text: data.text };

      setChatMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error("Chat API Error:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "Kairos",
          text: "Sorry, I'm having trouble connecting right now. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setChatMessages([]);
    setIsSidebarOpen(false);
  };

  return (
    <div className="bg-[#a7ebf2] h-[86.4vh] flex flex-col overflow-hidden p-4">
      <main className="flex-1 flex flex-col min-h-0 relative">
        {/* --- Sidebar --- */}
        <aside
          className={`absolute top-0 left-0 h-full bg-[#011c40] w-64 md:w-80 shadow-2xl z-30 transform transition-transform duration-300 ${
            isSidebarOpen ? "block" : "hidden"
          }`}
          ref={sideBarRef}
        >
          <div className="p-4 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h2 className="text-xl font-bold text-[#a7ebf2]">Chat History</h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="text-[#a7ebf2] p-1 rounded-full hover:bg-white/10"
              >
                <IoMdClose className="text-2xl" />
              </button>
            </div>
            <button
              onClick={handleNewChat}
              className="flex items-center justify-center w-full p-2 mb-4 text-[#a7ebf2] bg-white/5 rounded-md hover:bg-white/10"
            >
              <FaPlus className="text-xl" />
              <span className="ml-2">New Chat</span>
            </button>

            <ul className="space-y-2 overflow-y-auto flex-1">
              {chatMessages.map((msg, idx) => (
                <li
                  key={idx}
                  className={`p-2 rounded-md text-sm truncate ${
                    msg.sender === "You"
                      ? "text-gray-400 text-right"
                      : "text-gray-200"
                  }`}
                >
                  {msg.text}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex-shrink-0">
              <button
                onClick={() => signOut({ callbackUrl: "/signup" })}
                className="flex items-center w-full text-left px-4 py-2 text-lg font-semibold text-red-400 hover:bg-red-500/10 rounded-md border-t-2 border-gray-500 gap-2"
              >
                <IoIosLogOut className="text-2xl" />
                <span className="ml-2">Log Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* --- Main Chat Window --- */}
        <div className="relative flex-1 flex flex-col bg-[#023859] rounded-lg shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-gray-700 flex-shrink-0">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="mr-4 text-[#a7ebf2] p-2 rounded-full hover:bg-white/10"
              >
                <HiMenuAlt3 className="text-2xl" />
              </button>
              <div className="rounded-full mr-4 w-10 h-10">
                <Image
                  src="/chatbot_logo.svg"
                  alt="Kairos"
                  width={40}
                  height={40}
                />
              </div>
              <div>
                <p className="font-semibold text-[#a7ebf2]">Kairos</p>
                <p className="text-xs text-gray-400">Your wellness companion</p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto relative hide-scrollbar">
            {chatMessages.length === 0 && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <h1 className=" text-xl lg:text-3xl md:text-2xl font-bold text-[#a7ebf2] select-none">
                  Hello,{" "}
                  {session?.user?.name &&
                    session.user.name.charAt(0).toUpperCase() +
                      session.user.name.slice(1)}
                </h1>
              </div>
            )}
            <div className="max-w-4xl mx-auto w-full">
              {/* Render Existing Messages */}
              {chatMessages.map((msg, idx) => (
                <ChatMessageBubble key={idx} msg={msg} />
              ))}

              {/* Render Loading Bubble using the SAME component */}
              {isLoading && (
                <ChatMessageBubble
                  msg={{ sender: "Kairos", text: "" }}
                  isLoading={true}
                />
              )}

              <div ref={messageEndRef} />
            </div>
          </div>
          <div className="p-4 border-t-2 border-gray-700 flex-shrink-0">
            <div className="mx-auto flex gap-2 justify-center">
              <input
                type="text"
                id="text"
                className="max-w-full lg:max-w-4xl flex-1 border-0 rounded-full px-4 py-3 bg-gray-600/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#a7ebf2] outline-none"
                placeholder="Type your message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLoading) handleSend();
                }}
              />

              <button
                className={`px-3.5 rounded-full hover:bg-[#01295c] 
                bg-[#011c40] cursor-pointer ${
                  !isLoading ? "bg-[#011c40]" : "bg-gray-700"
                }`}
                onClick={handleSend}
                disabled={isLoading}
              >
                <RiVoiceprintFill className="text-white text-xl" />
              </button>

              <button
                className={`px-4 rounded-full hover:bg-[#01295c] 
                bg-[#011c40] cursor-pointer ${
                  !isLoading ? "bg-[#011c40]" : "bg-gray-700"
                }`}
                onClick={handleSend}
                disabled={isLoading}
              >
                <IoSendSharp className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// UPDATED Reusable ChatMessageBubble component
const ChatMessageBubble = ({ msg, isLoading = false }) => {
  const { data: session } = useSession();
  const [loadingText, setLoadingText] = useState("Thinking...");

  const isUser = msg.sender === "You";

  // Logic for the loading animation INSIDE the bubble component
  useEffect(() => {
    if (!isLoading) return; // Only run if this specific bubble is in loading mode

    const states = [
      "Thinking...",
      "Processing...",
      "Analyzing...",
      "Typing...",
    ];
    let i = 0;

    // Reset to start
    setLoadingText(states[0]);

    const interval = setInterval(() => {
      i = (i + 1) % states.length;
      setLoadingText(states[i]);
    }, 700);

    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <div className={`mb-4 flex ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div
          className={`w-8 h-8 flex-shrink-0 ${
            isLoading ? "animate-pulse" : ""
          }`}
        >
          <Image src="/chatbot_logo.svg" alt="Kairos" width={32} height={32} />
        </div>
      )}
      <div
        className={`px-4 py-2 max-w-[80%] rounded-2xl text-base break-words mx-2 shadow-md ${
          isUser
            ? "bg-[#54acbf] text-white rounded-tr-none"
            : "bg-[#a7ebf2] text-[#023859] rounded-tl-none"
        }`}
      >
        <p
          className={`leading-relaxed whitespace-pre-wrap ${
            isLoading ? "italic opacity-75 font-medium" : ""
          }`}
        >
          {isLoading ? loadingText : msg.text}
        </p>
      </div>
      {isUser && (
        <div className="w-8 h-8 flex-shrink-0">
          <Image
            src={session?.user?.image || "/user.png"}
            alt="You"
            width={32}
            height={32}
            className={`rounded-full ${
              !session?.user.image
                ? "filter invert p-1"
                : "object-center w-full h-full"
            }`}
          />
        </div>
      )}
    </div>
  );
};
