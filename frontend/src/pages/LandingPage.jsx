import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Send,
  X,
  Loader2,
  Mic,
  MicOff,
  Volume2,
} from "lucide-react";
import Aurora from "../components/Aurora";
import SplitText from "../components/SplitText";
import CircularText from "../components/CircularText";
import { aiService } from "../services/api";

const LandingPage = () => {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: "bot",
      content:
        "👋 Hi! I'm InsurAi Assistant. Ask me anything about our insurance platform, features, or how we can help your business!",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const messagesEndRef = useRef(null);

  const suggestedQueries = [
    "What is InsurAi?",
    "What features do you offer?",
    "How do I get started?",
    "Tell me about your agents",
    "How much does it cost?",
    "How do I book an appointment?",
    "Is my data secure?",
    "What can the AI assistant do?",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load available voices for speech synthesis
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      // Set default voice (prefer English female voices)
      const defaultVoice =
        availableVoices.find(
          (voice) => voice.lang.includes("en") && voice.name.includes("Female")
        ) ||
        availableVoices.find((voice) => voice.lang.includes("en")) ||
        availableVoices[0];
      setSelectedVoice(defaultVoice);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await aiService.processQuery({
        query: inputMessage,
        userId: null, // No user ID for non-logged-in users
        context: "landing_page_inquiry",
      });

      const botMessage = {
        type: "bot",
        content: response.data.response || response.data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      speakResponse(botMessage.content);
    } catch (error) {
      // Fallback response if API fails
      const fallbackMessage = {
        type: "bot",
        content: getFallbackResponse(inputMessage),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackMessage]);
      speakResponse(fallbackMessage.content);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert(
        "Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari."
      );
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setRecording(true);
      const systemMessage = {
        type: "system",
        content: "🎤 Listening...",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, systemMessage]);
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setRecording(false);

      // Remove the "Listening..." message
      setMessages((prev) => prev.filter((msg) => msg.type !== "system"));

      // Add user message
      const userMessage = {
        type: "user",
        content: transcript,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const response = await aiService.processQuery({
          query: transcript,
          userId: null,
          context: "landing_page_inquiry",
        });

        const botMessage = {
          type: "bot",
          content: response.data.response || response.data.message,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMessage]);
        speakResponse(botMessage.content);
      } catch (error) {
        const fallbackMessage = {
          type: "bot",
          content: getFallbackResponse(transcript),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, fallbackMessage]);
        speakResponse(fallbackMessage.content);
      } finally {
        setIsLoading(false);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setRecording(false);
      setMessages((prev) => prev.filter((msg) => msg.type !== "system"));

      if (event.error === "no-speech") {
        const errorMessage = {
          type: "bot",
          content: "I didn't hear anything. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    };

    recognition.onend = () => {
      setRecording(false);
      setMessages((prev) => prev.filter((msg) => msg.type !== "system"));
    };

    recognition.start();
  };

  const speakResponse = (text) => {
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Use selected voice if available
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const getFallbackResponse = (query) => {
    const lowerQuery = query.toLowerCase();

    if (
      lowerQuery.includes("what") ||
      lowerQuery.includes("about") ||
      lowerQuery.includes("insurai")
    ) {
      return "InsurAi is a corporate insurance management platform powered by AI. We help businesses manage their insurance needs with intelligent assistance, automated appointment scheduling, and real-time analytics. Our platform connects you with expert insurance agents and provides 24/7 AI support.";
    } else if (lowerQuery.includes("feature") || lowerQuery.includes("offer")) {
      return "We offer: 🤖 AI-powered insurance guidance with voice support, 📅 Easy appointment scheduling with qualified agents, 📊 Real-time analytics and dashboards, 👥 Expert agent network, and 🔒 Secure data management. Sign up to explore all features!";
    } else if (
      lowerQuery.includes("price") ||
      lowerQuery.includes("cost") ||
      lowerQuery.includes("pricing")
    ) {
      return "Our pricing is customized based on your business needs and coverage requirements. Please sign up and schedule an appointment with one of our agents to discuss pricing options tailored to your company.";
    } else if (
      lowerQuery.includes("sign up") ||
      lowerQuery.includes("register") ||
      lowerQuery.includes("get started")
    ) {
      return "Getting started is easy! Click the 'Get Started' button on this page to create your account. After registration, you can explore our AI assistant, browse available agents, and schedule appointments.";
    } else if (
      lowerQuery.includes("agent") ||
      lowerQuery.includes("consultant")
    ) {
      return "Our platform connects you with experienced insurance agents specialized in corporate insurance. You can view agent profiles, check their availability, and book appointments directly through our scheduling system.";
    } else if (
      lowerQuery.includes("appointment") ||
      lowerQuery.includes("schedule") ||
      lowerQuery.includes("book")
    ) {
      return "You can easily schedule appointments with our agents once you're logged in. Simply browse available agents, check their calendar, and book a time slot that works for you. Agents will receive instant notifications.";
    } else if (
      lowerQuery.includes("ai") ||
      lowerQuery.includes("assistant") ||
      lowerQuery.includes("chatbot")
    ) {
      return "Our AI Assistant provides 24/7 support with voice-powered guidance. It can answer insurance questions, help you find agents, and guide you through the booking process. The AI learns from interactions to provide better assistance over time.";
    } else if (
      lowerQuery.includes("secure") ||
      lowerQuery.includes("security") ||
      lowerQuery.includes("safe")
    ) {
      return "Security is our top priority. We use industry-standard encryption, secure authentication with JWT tokens, and follow best practices for data protection. Your business information and personal data are always kept safe and confidential.";
    } else {
      return "Thanks for your question! InsurAi is your AI-powered corporate insurance platform. We offer intelligent assistance, agent scheduling, and comprehensive analytics. Would you like to know more about our features, pricing, or how to get started?";
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden overflow-y-auto bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950">
      {/* Aurora Background */}
      <div className="fixed inset-0 z-0">
        <Aurora
          colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
        {/* Dark gradient overlay at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/80 pointer-events-none"></div>
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-white px-4 py-12">
        <div className="text-center space-y-8 max-w-4xl">
          {/* Logo/Icon */}
          <div className="animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-2xl mb-6">
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 animate-fade-in-up">
            InsurAi
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl lg:text-3xl text-gray-300 font-light animate-fade-in-up animation-delay-200">
            Corporate Insurance: AI-Powered Protection for Your Business
          </p>

          {/* Description */}
          <p className="text-lg text-gray-400 max-w-2xl mx-auto animate-fade-in-up animation-delay-400">
            Experience seamless insurance management with intelligent AI
            assistance, automated appointment scheduling, and real-time
            analytics.
          </p>

          {/* CTA Button */}
          <div className="pt-8 animate-fade-in-up animation-delay-600">
            <button
              onClick={() => (window.location.href = "http://localhost:5173/")}
              className="group relative px-12 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xl font-semibold rounded-full overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
            >
              <span className="relative z-10 flex items-center gap-3">
                Get Started
                <svg
                  className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 animate-fade-in-up animation-delay-800">
            <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition-all duration-300">
              <div className="text-purple-400 mb-3">
                <svg
                  className="w-8 h-8 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Assistant</h3>
              <p className="text-gray-400 text-sm">
                Smart voice-powered insurance guidance
              </p>
            </div>

            <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-indigo-500/50 transition-all duration-300">
              <div className="text-indigo-400 mb-3">
                <svg
                  className="w-8 h-8 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Easy Scheduling</h3>
              <p className="text-gray-400 text-sm">
                Book appointments with agents instantly
              </p>
            </div>

            <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-pink-500/50 transition-all duration-300">
              <div className="text-pink-400 mb-3">
                <svg
                  className="w-8 h-8 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Real-time Analytics
              </h3>
              <p className="text-gray-400 text-sm">
                Track performance with live dashboards
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Circular Text - Bottom Left */}
      <div className="fixed bottom-8 left-8 z-20">
        <CircularText
          text="• InsurAi • InsurAi "
          spinDuration={15}
          onHover="speedUp"
          className="text-purple-300"
        />
      </div>

      {/* Floating AI Chat Button */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-8 right-8 z-30 group"
        >
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-110">
              <MessageCircle className="text-white" size={28} />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
          </div>
          <div className="absolute bottom-full right-0 mb-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Ask me anything! 💬
          </div>
        </button>
      )}

      {/* AI Chat Window */}
      {isChatOpen && (
        <div className="fixed bottom-8 right-8 z-30 w-96 h-[600px] backdrop-blur-2xl bg-gradient-to-br from-gray-900/95 to-purple-900/95 rounded-2xl shadow-2xl border border-purple-500/30 flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-white font-semibold">InsurAi Assistant</h3>
                <p className="text-purple-100 text-xs">Always here to help</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Voice Selection Dropdown */}
              {voices.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedVoice?.name || ""}
                    onChange={(e) => {
                      const voice = voices.find(
                        (v) => v.name === e.target.value
                      );
                      setSelectedVoice(voice);
                    }}
                    className="appearance-none bg-white/20 backdrop-blur-sm text-white text-xs rounded-lg pl-3 pr-8 py-2 cursor-pointer border border-white/30 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                    title="Select voice"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: "right 0.5rem center",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "1.25rem 1.25rem",
                    }}
                  >
                    {voices
                      .filter((voice) => voice.lang.includes("en"))
                      .map((voice) => (
                        <option
                          key={voice.name}
                          value={voice.name}
                          className="bg-gray-800 text-white py-2 hover:bg-purple-600"
                        >
                          {voice.name.length > 25
                            ? voice.name.substring(0, 25) + "..."
                            : voice.name}
                        </option>
                      ))}
                  </select>
                  <Volume2
                    className="absolute left-1 top-1/2 -translate-y-1/2 text-white pointer-events-none"
                    size={12}
                  />
                </div>
              )}
              {/* Stop Speaking Button */}
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-all duration-200 flex items-center space-x-1 text-xs font-medium animate-pulse"
                  title="Stop speaking"
                >
                  <X size={14} />
                  <span>Stop</span>
                </button>
              )}
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Suggested Queries - Show only at the start */}
            {messages.length === 1 && (
              <div className="space-y-3">
                <p className="text-purple-300 text-sm font-medium text-center">
                  Suggested questions:
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {suggestedQueries.map((query, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setInputMessage(query);
                        // Automatically send the message
                        setTimeout(() => {
                          const event = new Event("submit", {
                            bubbles: true,
                            cancelable: true,
                          });
                          document
                            .querySelector("form")
                            ?.dispatchEvent(event) || handleSendMessage();
                        }, 100);
                      }}
                      className="text-left px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-100 rounded-xl border border-purple-500/30 hover:border-purple-500/50 transition-all duration-200 text-sm group"
                    >
                      <span className="flex items-center justify-between">
                        <span>{query}</span>
                        <Send
                          size={14}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    msg.type === "user"
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                      : msg.type === "system"
                      ? "bg-purple-500/20 text-purple-200 border border-purple-500/30 text-center"
                      : "bg-gray-800/80 text-gray-100 border border-purple-500/20"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p className="text-xs mt-2 opacity-60">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800/80 rounded-2xl p-4 border border-purple-500/20">
                  <Loader2 className="text-purple-400 animate-spin" size={20} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-purple-500/30 bg-gray-900/50">
            <form onSubmit={handleSendMessage} className="space-y-2">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  disabled={isLoading || recording}
                  className={`p-3 rounded-xl transition-all duration-300 ${
                    recording
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={recording ? "Listening..." : "Voice input"}
                >
                  {recording ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about our services..."
                  className="flex-1 bg-gray-800/80 text-white placeholder-gray-400 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-purple-500/20"
                  disabled={isLoading || recording}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim() || recording}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                <Volume2 className="inline-block w-3 h-3 mr-1" />
                Voice enabled • No login required • Instant responses
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
