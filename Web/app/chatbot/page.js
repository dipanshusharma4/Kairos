"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { IoIosLogOut } from "react-icons/io";
import { HiMenuAlt3 } from "react-icons/hi";
import { IoMdClose } from "react-icons/io";
import { FaPlus, FaPen, FaCheck, FaChevronDown, FaTrash } from "react-icons/fa6";
import { RiVoiceprintFill } from "react-icons/ri";
import { IoSendSharp } from "react-icons/io5";

export default function chatbot() {
  const { data: session, status } = useSession();
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // New conversation states
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);

  // Renaming states
  const [editingConversationId, setEditingConversationId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  // Header Dropdown state
  const [isHeaderDropdownOpen, setIsHeaderDropdownOpen] = useState(false);

  const sideBarRef = useRef(null);
  const headerDropdownRef = useRef(null);
  const messageEndRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event) {
      if (sideBarRef.current && !sideBarRef.current.contains(event.target)) {
        setIsSidebarOpen(false);
      }
      if (headerDropdownRef.current && !headerDropdownRef.current.contains(event.target)) {
        setIsHeaderDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sideBarRef, headerDropdownRef]);

  // Derived state
  const currentConversation = conversations.find(c => c._id === currentConversationId);
  const currentTitle = currentConversation ? currentConversation.title : "New Chat";

  // Fetch Conversations List
  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/chat/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      setIsLoading(false);
    }
  };

  // Select a conversation and load its history
  const selectConversation = async (conversationId) => {
    setCurrentConversationId(conversationId);
    setIsLoading(true);
    setIsHeaderDropdownOpen(false); // Close header dropdown if open
    try {
      const response = await fetch(`/api/chat/history?conversationId=${conversationId}`);
      if (response.ok) {
        const history = await response.json();
        setChatMessages(Array.isArray(history) ? history : []);
      }
    } catch (error) {
      console.error("Failed to load history", error);
      setChatMessages([{ sender: "Kairos", text: "Error loading history." }]);
    } finally {
      setIsLoading(false);
      if (window.innerWidth < 768) setIsSidebarOpen(false); // Mobile: close sidebar on select
    }
  };

  // Start editing a conversation title
  const startEditing = (e, conv) => {
    e.stopPropagation(); // Prevent selecting the conversation
    setEditingConversationId(conv._id);
    setEditTitle(conv.title);
  };

  // Save the new title
  const saveTitle = async (e, conversationId) => {
    e.stopPropagation();
    if (!editTitle.trim()) {
      setEditingConversationId(null);
      return;
    }

    try {
      const res = await fetch("/api/chat/conversations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, title: editTitle }),
      });

      if (res.ok) {
        setConversations(conversations.map(c =>
          c._id === conversationId ? { ...c, title: editTitle } : c
        ));
      }
    } catch (error) {
      console.error("Failed to rename conversation:", error);
    } finally {
      setEditingConversationId(null);
    }
  };

  // Delete a conversation
  const deleteConversation = async (e, conversationId) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this chat?")) return;

    try {
      const res = await fetch(`/api/chat/conversations?conversationId=${conversationId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setConversations(conversations.filter(c => c._id !== conversationId));
        if (currentConversationId === conversationId) {
          handleNewChat();
        }
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  useEffect(() => {
    document.title = "Chatbot - Kairos";
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchConversations();
      if (!currentConversationId) {
        // Ensure we start in a clean state if no conversation is selected
        handleNewChat();
        setIsLoading(false);
      }
    }
  }, [status, router]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isLoading]);

  // Voice Chat State
  const [isListening, setIsListening] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false); // UI State
  const voiceActiveRef = useRef(false); // Ref for callbacks
  const recognitionRef = useRef(null); // Ref for Recognition Instance

  // Sync Ref with State
  useEffect(() => {
    voiceActiveRef.current = voiceActive;
  }, [voiceActive]);

  // Speech Recognition
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Your browser does not support voice recognition. Try Chrome or Edge.");
      return;
    }

    // Stop any previous instance
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = false; // We want one command/sentence at a time
    recognition.interimResults = true; // Show results as we speak
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceActive(true); // Update State
      voiceActiveRef.current = true; // Update Ref
    };

    recognition.onresult = (event) => {
      const result = event.results[0];
      const transcript = result[0].transcript;

      setChatInput(transcript); // Live update input box

      if (result.isFinal) {
        handleSend(transcript, true);
      }
    };

    recognition.onerror = (event) => {
      // 'aborted' is expected when we stop manually, so we ignore it completely
      if (event.error === 'aborted') return;

      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Determine if we should restart listening or just stop based on logic?
      // Since continuous=false, it naturally ends after one sentence.
      // If we want "Conversation Mode", we should restart it in handleSend AFTER the bot speaks.
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition:", e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort(); // Actually stop the browser engine
      recognitionRef.current = null;
    }

    setIsListening(false);
    setVoiceActive(false);
    voiceActiveRef.current = false;
    window.speechSynthesis.cancel(); // Stop speaking immediately
  }


  // Text to Speech
  const speak = (text) => {
    if (!('speechSynthesis' in window)) return;

    // Clean text for better speech
    const cleanText = text
      .replace(/<[^>]*>/g, '') // Remove HTML tags if any
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links, keep text: [text](url) -> text
      .replace(/[`*#_~]/g, '') // Remove markdown symbols (*, #, _, ~, `)
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '') // Remove emojis
      .replace(/\n+/g, '. ') // Replace newlines with pause
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim();

    if (!cleanText) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "en-US";
    utterance.rate = 0.9; // Slightly slower for a more relaxed, human feel
    utterance.pitch = 1;

    // Voice Selection
    const voices = window.speechSynthesis.getVoices();
    const englishVoices = voices.filter(voice => voice.lang.startsWith('en'));
    const preferredVoice = englishVoices.find(v => v.name.includes("Natural"))
      || englishVoices.find(v => v.name.includes("Google US English"))
      || englishVoices.find(v => v.name.includes("Samantha"))
      || englishVoices.find(v => v.name.includes("Microsoft Zira"))
      || englishVoices.find(v => v.lang === "en-US")
      || englishVoices[0];

    if (preferredVoice) utterance.voice = preferredVoice;

    // CONTINUOUS MODE: When bot finishes, start listening again if mode is active
    utterance.onend = () => {
      if (voiceActiveRef.current) {
        startListening();
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // Ensure we cancel speech if we unmount or leave
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    }
  }, []);

  const handleSend = async (manualInput = null, isVoice = false) => {
    const textToSend = manualInput || chatInput;
    if (!textToSend.trim()) return;

    // If this wasn't a voice action, ensure we don't speak back unless previously active? 
    // Actually, usually if user types, bot texts. If user speaks, bot speaks.
    if (!isVoice) setVoiceActive(false);

    let activeConvId = currentConversationId;

    // If sending a message and no conversation is selected (or it's a "New Chat" state), create one
    if (!activeConvId) {
      try {
        const res = await fetch("/api/chat/conversations", { method: 'POST' });
        if (res.ok) {
          const newConv = await res.json();
          activeConvId = newConv._id;
          setCurrentConversationId(activeConvId);
          setConversations(prev => [newConv, ...prev]);
        }
      } catch (err) {
        console.error("Failed to create new conversation", err);
        alert("Unable to start a new chat. Please Log Out and Log In again to refresh your session.");
        return;
      }
    }

    setIsLoading(true);
    const userMessage = { sender: "You", text: textToSend };
    // Optimistic UI update
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
          prompt: userMessage.text,
          history: historyForApi,
          conversationId: activeConvId
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          const rateLimitMsg = {
            sender: "Kairos",
            text: "Whoa, we're chatting a bit too fast! ⚡️\n\nI need a quick breather (about 30 seconds) to cool down my circuits. Thanks for being patient! 🌿"
          };
          setChatMessages((prev) => [...prev, rateLimitMsg]);
          if (isVoice || voiceActive) speak("Whoa, chatting too fast. I need a breather.");
          return;
        }
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      const botText = data.text || "Sorry, I couldn't understand that.";
      const botResponse = { sender: "Kairos", text: botText };

      setChatMessages((prev) => [...prev, botResponse]);

      // Speak response if voice active
      if (isVoice || voiceActive) {
        speak(botText);
      }

      // Refresh conversations list (to update 'updatedAt' order or titles)
      fetchConversations();

    } catch (error) {
      console.error("Chat API Error:", error);
      const errMsg = "Sorry, I'm having trouble connecting right now. Please try again.";
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "Kairos",
          text: errMsg,
        },
      ]);
      if (isVoice || voiceActive) speak(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentConversationId(null);
    setChatMessages([]);
    setIsSidebarOpen(false);
    setIsHeaderDropdownOpen(false);
    setVoiceActive(false);
    window.speechSynthesis.cancel();
  };

  return (
    <div className="bg-[#a7ebf2] h-[86.4vh] flex flex-col overflow-hidden p-4">
      <main className="flex-1 flex flex-col min-h-0 relative">
        {/* --- Sidebar --- */}
        <aside
          className={`absolute top-0 left-0 h-full bg-[#011c40] w-64 md:w-80 shadow-2xl z-30 transform transition-transform duration-300 ${isSidebarOpen ? "block" : "hidden"
            }`}
          ref={sideBarRef}
        >
          <div className="p-4 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h2 className="text-xl font-bold text-[#a7ebf2]">Chats</h2>
              <button
                suppressHydrationWarning={true}
                onClick={() => setIsSidebarOpen(false)}
                className="text-[#a7ebf2] p-1 rounded-full hover:bg-white/10"
              >
                <IoMdClose className="text-2xl" />
              </button>
            </div>
            <button
              onClick={handleNewChat}
              className="flex items-center justify-center w-full p-3 mb-4 text-[#a7ebf2] bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/10"
            >
              <FaPlus className="text-sm" />
              <span className="ml-2 font-medium">New Chat</span>
            </button>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {conversations.map((conv) => (
                <div
                  key={conv._id}
                  onClick={() => selectConversation(conv._id)}
                  className={`w-full text-left p-3 rounded-lg text-sm transition-colors flex justify-between items-center group cursor-pointer ${currentConversationId === conv._id
                    ? "bg-[#a7ebf2] text-[#023859] font-medium"
                    : "text-gray-300 hover:bg-white/5"
                    }`}
                >
                  {editingConversationId === conv._id ? (
                    <div className="flex items-center w-full">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.key === 'Enter' && saveTitle(e, conv._id)}
                        className="bg-white/20 text-inherit border-none rounded px-1 py-0.5 text-xs w-full mr-2 focus:outline-none"
                        autoFocus
                      />
                      <button onClick={(e) => saveTitle(e, conv._id)} className="p-1 hover:bg-white/20 rounded">
                        <FaCheck className="text-xs" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="truncate flex-1">{conv.title || "New Chat"}</span>
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => startEditing(e, conv)}
                          className={`p-1.5 hover:bg-white/20 rounded mr-1 ${currentConversationId === conv._id ? "text-[#023859]" : "text-gray-400"
                            }`}
                          title="Rename"
                        >
                          <FaPen className="text-xs" />
                        </button>
                        <button
                          onClick={(e) => deleteConversation(e, conv._id)}
                          className={`p-1.5 hover:bg-red-500/20 rounded hover:text-red-400 ${currentConversationId === conv._id ? "text-[#023859]" : "text-gray-400"
                            }`}
                          title="Delete"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {conversations.length === 0 && (
                <div className="text-gray-500 text-sm text-center mt-4">No past conversations</div>
              )}
            </div>

            <div className="mt-4 flex-shrink-0 pt-4 border-t border-gray-700">
              <button
                onClick={() => signOut({ callbackUrl: "/signup" })}
                className="flex items-center w-full text-left px-4 py-2 text-lg font-semibold text-red-400 hover:bg-red-500/10 rounded-md gap-2"
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
            <div className="flex items-center w-full">
              <button
                suppressHydrationWarning={true}
                onClick={() => setIsSidebarOpen(true)}
                className="mr-4 text-[#a7ebf2] p-2 rounded-full hover:bg-white/10"
              >
                <HiMenuAlt3 className="text-2xl" />
              </button>
              <div className="rounded-full mr-4 w-10 h-10 flex-shrink-0">
                <Image
                  src="/chatbot_logo.svg"
                  alt="Kairos"
                  width={40}
                  height={40}
                />
              </div>

              {/* HEADER TITLE WITH DROPDOWN */}
              <div className="relative flex-1" ref={headerDropdownRef}>
                <button
                  onClick={() => setIsHeaderDropdownOpen(!isHeaderDropdownOpen)}
                  className="flex items-center gap-2 group text-left max-w-full"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-[#a7ebf2] text-lg leading-tight truncate">{currentTitle}</p>
                    <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors truncate">Kairos • {currentConversation ? 'Active' : 'New'}</p>
                  </div>
                  <FaChevronDown className={`text-[#a7ebf2] text-xs transition-transform duration-200 flex-shrink-0 ${isHeaderDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isHeaderDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-[#011c40] border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden ring-1 ring-white/10">
                    <div className="p-2 border-b border-gray-700 bg-[#011c40]/50 backdrop-blur-sm">
                      <p className="text-xs font-semibold text-gray-400 ml-2">Switch Conversation</p>
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      <button
                        onClick={handleNewChat}
                        className="w-full text-left px-4 py-3 hover:bg-[#a7ebf2]/10 text-sm text-[#a7ebf2] flex items-center gap-2 font-medium border-b border-gray-700/50"
                      >
                        <FaPlus className="text-xs" /> New Chat
                      </button>
                      {conversations.map(conv => (
                        <button
                          key={conv._id}
                          onClick={() => selectConversation(conv._id)}
                          className={`w-full text-left px-4 py-3 hover:bg-white/5 text-sm transition-colors border-b border-gray-700/50 last:border-0 ${currentConversationId === conv._id ? "bg-[#a7ebf2]/20 text-white font-medium" : "text-gray-300"
                            }`}
                        >
                          <div className="truncate">{conv.title || "New Chat"}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            {new Date(conv.updatedAt).toLocaleDateString()}
                          </div>
                        </button>
                      ))}
                      {conversations.length === 0 && (
                        <div className="p-4 text-center text-xs text-gray-500">No recent chats</div>
                      )}
                    </div>
                  </div>
                )}
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
                suppressHydrationWarning={true}
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
                className={`px-3.5 rounded-full hover:bg-[#01295c] transition-all duration-300
                ${isListening
                    ? "bg-red-500 animate-pulse text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                    : voiceActive
                      ? "bg-red-500/20 text-red-300 border border-red-500/50"
                      : "bg-[#011c40] text-white"
                  } 
                ${isLoading ? "bg-gray-700 cursor-not-allowed" : "cursor-pointer"}`}
                onClick={voiceActive ? stopListening : startListening}
                disabled={isLoading && !voiceActive}
                title={voiceActive ? "Stop Voice Mode" : "Start Voice Chat"}
              >
                {voiceActive && !isListening ? <FaTrash className="text-sm" /> : <RiVoiceprintFill className="text-xl" />}
              </button>

              <button
                className={`px-4 rounded-full hover:bg-[#01295c] 
                bg-[#011c40] cursor-pointer ${!isLoading ? "bg-[#011c40]" : "bg-gray-700"
                  }`}
                onClick={() => handleSend()}
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
          className={`w-8 h-8 flex-shrink-0 ${isLoading ? "animate-pulse" : ""
            }`}
        >
          <Image src="/chatbot_logo.svg" alt="Kairos" width={32} height={32} />
        </div>
      )}
      <div
        className={`px-4 py-2 max-w-[80%] rounded-2xl text-base break-words mx-2 shadow-md ${isUser
          ? "bg-[#54acbf] text-white rounded-tr-none"
          : "bg-[#a7ebf2] text-[#023859] rounded-tl-none"
          }`}
      >
        <p
          className={`leading-relaxed whitespace-pre-wrap ${isLoading ? "italic opacity-75 font-medium" : ""
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
            className={`rounded-full ${!session?.user.image
              ? "filter invert p-1"
              : "object-center w-full h-full"
              }`}
          />
        </div>
      )}
    </div>
  );
};
