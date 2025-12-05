import { useState, useRef } from "react";
import { toast } from "react-toastify";
import Layout from "../components/Layout";
import { aiService } from "../services/api";
import { getUser } from "../utils/auth";
import { Send, Mic, MicOff, MessageSquare, Bot, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        'Hello! I\'m your InsurAi assistant. How can I help you today? You can ask me about insurance policies, claims, coverage, or say "show available agents" to book an appointment!',
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [availableAgents, setAvailableAgents] = useState([]);
  const [showAgentSelection, setShowAgentSelection] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const messagesEndRef = useRef(null);
  const user = getUser();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load available voices
  useState(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      // Set default voice (prefer English voices)
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage;
    setInputMessage("");

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      // Check if user wants to see available agents
      const lowerMessage = userMessage.toLowerCase();
      if (
        (lowerMessage.includes("show") &&
          (lowerMessage.includes("agent") ||
            lowerMessage.includes("available"))) ||
        lowerMessage.includes("list agent") ||
        lowerMessage.includes("available agent")
      ) {
        await fetchAvailableAgents();
        setLoading(false);
        return;
      }

      // Check if user wants to book with a specific agent
      if (lowerMessage.includes("book") && lowerMessage.includes("agent")) {
        await fetchAvailableAgents();
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Great! Please select an agent from the list below to book your appointment.",
            showAgents: true,
          },
        ]);
        setLoading(false);
        return;
      }

      const response = await aiService.processQuery({
        question: userMessage,
        isVoiceQuery: false,
        userId: user.id,
      });

      // Add AI response
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.data.answer,
          category: response.data.category,
          canBookAppointment: response.data.canBookAppointment,
          suggestedAction: response.data.suggestedAction,
        },
      ]);

      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Error sending message:", error);

      // Provide a helpful fallback response based on the question
      const fallbackResponse = generateFallbackResponse(userMessage);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: fallbackResponse.content,
          canBookAppointment: fallbackResponse.canBookAppointment,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      toast.error(
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
      setMessages((prev) => [
        ...prev,
        { role: "system", content: "🎤 Listening..." },
      ]);
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setRecording(false);

      // Remove the "Listening..." message
      setMessages((prev) => prev.filter((msg) => msg.role !== "system"));

      // Add user message
      setMessages((prev) => [...prev, { role: "user", content: transcript }]);
      setLoading(true);

      try {
        // Check if user wants to see available agents
        const lowerTranscript = transcript.toLowerCase();
        if (
          (lowerTranscript.includes("show") &&
            (lowerTranscript.includes("agent") ||
              lowerTranscript.includes("available"))) ||
          lowerTranscript.includes("list agent") ||
          lowerTranscript.includes("available agent")
        ) {
          await fetchAvailableAgents();
          speakResponse(
            "Here are our available agents. Please select one to book an appointment."
          );
          setLoading(false);
          return;
        }

        // Check if user wants to book
        if (
          lowerTranscript.includes("book") &&
          lowerTranscript.includes("agent")
        ) {
          await fetchAvailableAgents();
          const message =
            "Great! I'll show you our available agents. Please select one to continue.";
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: message,
              showAgents: true,
            },
          ]);
          speakResponse(message);
          setLoading(false);
          return;
        }

        const response = await aiService.processQuery({
          question: transcript,
          isVoiceQuery: true,
          userId: user.id,
        });

        // Add AI response
        const assistantMessage = {
          role: "assistant",
          content: response.data.answer,
          category: response.data.category,
          canBookAppointment: response.data.canBookAppointment,
          suggestedAction: response.data.suggestedAction,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Speak the response
        speakResponse(response.data.answer);

        setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error("Error processing voice input:", error);

        // Provide a helpful fallback response
        const fallbackResponse = generateFallbackResponse(transcript);
        const message = {
          role: "assistant",
          content: fallbackResponse.content,
          canBookAppointment: fallbackResponse.canBookAppointment,
        };
        setMessages((prev) => [...prev, message]);
        speakResponse(fallbackResponse.content);
      } finally {
        setLoading(false);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setRecording(false);
      setMessages((prev) => prev.filter((msg) => msg.role !== "system"));

      if (event.error === "no-speech") {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "I didn't hear anything. Please try again.",
          },
        ]);
      }
    };

    recognition.onend = () => {
      setRecording(false);
      setMessages((prev) => prev.filter((msg) => msg.role !== "system"));
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

      window.speechSynthesis.speak(utterance);
    }
  };

  const fetchAvailableAgents = async () => {
    try {
      const response = await aiService.getAvailableAgents();
      const agents = response.data;
      setAvailableAgents(agents);

      if (agents.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I'm sorry, but there are no agents available at the moment. Please try again later or contact our support team.",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `I found ${agents.length} available agent${
              agents.length > 1 ? "s" : ""
            } for you. Please select one below to book your appointment.`,
            agents: agents,
          },
        ]);
      }

      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Error fetching agents:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm having trouble fetching available agents. Please try again or use the Book Appointment page.",
        },
      ]);
    }
  };

  const handleAgentSelection = (agent) => {
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `Great choice! You've selected ${agent.fullName}, who specializes in ${agent.specialization}. Redirecting you to complete your booking...`,
        selectedAgent: agent,
      },
    ]);

    speakResponse(
      `Great choice! Redirecting you to book with ${agent.fullName}.`
    );

    // Redirect to booking page with agent pre-selected
    setTimeout(() => {
      window.location.href = `/book-appointment?agentId=${agent.id}`;
    }, 2000);
  };

  const generateFallbackResponse = (question) => {
    const lowerQuestion = question.toLowerCase();

    // Insurance types
    if (
      (lowerQuestion.includes("type") && lowerQuestion.includes("insurance")) ||
      (lowerQuestion.includes("what") && lowerQuestion.includes("offer"))
    ) {
      return {
        content:
          "We offer comprehensive insurance coverage including Life Insurance (term, whole, and universal life), Health Insurance (individual, family, and corporate plans), Auto Insurance (comprehensive and collision coverage), Home Insurance (property and liability), and Business Insurance (commercial property and workers compensation). Each policy is customizable to meet your specific needs!",
        canBookAppointment: true,
      };
    }

    // Life insurance
    if (
      lowerQuestion.includes("life insurance") ||
      lowerQuestion.includes("term insurance")
    ) {
      return {
        content:
          "Life insurance provides financial protection for your loved ones. We offer Term Life (affordable coverage for specific periods), Whole Life (lifetime coverage with cash value), and Universal Life (flexible premiums and death benefits). Our agents can help you choose the right policy based on your age, health, and financial goals. Would you like to speak with a specialist?",
        canBookAppointment: true,
      };
    }

    // Health insurance
    if (
      lowerQuestion.includes("health insurance") ||
      lowerQuestion.includes("medical")
    ) {
      return {
        content:
          "Our health insurance plans cover medical expenses, hospital stays, prescriptions, and preventive care. We offer individual plans, family coverage, and corporate group policies. Plans include options for different deductibles and coverage levels. Let me connect you with a health insurance specialist to find the perfect plan for you!",
        canBookAppointment: true,
      };
    }

    // Auto insurance
    if (
      lowerQuestion.includes("auto") ||
      lowerQuestion.includes("car") ||
      lowerQuestion.includes("vehicle")
    ) {
      return {
        content:
          "Our auto insurance provides comprehensive protection for your vehicle including collision coverage, liability protection, theft coverage, and roadside assistance. We offer competitive rates with various deductible options. Our auto insurance specialists can help you find the right coverage at the best price!",
        canBookAppointment: true,
      };
    }

    // Claims
    if (lowerQuestion.includes("claim") || lowerQuestion.includes("file")) {
      return {
        content:
          "Filing a claim is easy! You can submit claims online through your dashboard, call our 24/7 claims hotline, or schedule an appointment with a claims specialist. You'll need your policy number, incident details, and any supporting documentation. Our team typically processes claims within 5-7 business days. Would you like help with a claim?",
        canBookAppointment: true,
      };
    }

    // Appointment/booking
    if (
      lowerQuestion.includes("appointment") ||
      lowerQuestion.includes("schedule") ||
      lowerQuestion.includes("book") ||
      lowerQuestion.includes("meet")
    ) {
      return {
        content:
          "I'd be happy to help you schedule an appointment! You can say 'show available agents' to see our specialists, or click the Book Appointment button below. Our agents are available for in-person, phone, or video consultations. What works best for you?",
        canBookAppointment: true,
      };
    }

    // Coverage/policy
    if (
      lowerQuestion.includes("coverage") ||
      lowerQuestion.includes("policy")
    ) {
      return {
        content:
          "Our policies provide comprehensive coverage tailored to your needs. Coverage details vary by insurance type and plan level. I recommend speaking with one of our licensed agents who can review your specific situation and recommend the best coverage options. Would you like to schedule a free consultation?",
        canBookAppointment: true,
      };
    }

    // Premium/pricing
    if (
      lowerQuestion.includes("premium") ||
      lowerQuestion.includes("price") ||
      lowerQuestion.includes("cost") ||
      lowerQuestion.includes("how much")
    ) {
      return {
        content:
          "Insurance premiums vary based on coverage type, coverage amount, your age, health status, and other factors. We offer competitive rates with flexible payment options (monthly, quarterly, or annual). Our agents can provide personalized quotes based on your specific needs. Would you like to get a free quote?",
        canBookAppointment: true,
      };
    }

    // Default response
    return {
      content:
        "I'm here to help with all your insurance questions! I can provide information about our Life, Health, Auto, Home, and Business insurance products. You can also say 'show available agents' to connect with a specialist, or ask me about coverage, claims, pricing, or how to get started. What would you like to know?",
      canBookAppointment: true,
    };
  };

  const quickQuestions = [
    "What types of insurance do you offer?",
    "Show available agents",
    "Book an appointment with an agent",
    "How do I file a claim?",
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div
          className="card p-0 flex flex-col backdrop-blur-sm bg-white/85 border border-white/20"
          style={{ height: "calc(100vh - 200px)" }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 p-6 text-white flex-shrink-0 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shadow-md">
                  <Bot size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">InsurAi Assistant</h2>
                  <p className="text-purple-100">
                    Your AI companion for insurance
                  </p>
                </div>
              </div>
              {voices.length > 0 && (
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-white/80">Voice:</label>
                  <select
                    value={selectedVoice?.name || ""}
                    onChange={(e) => {
                      const voice = voices.find(
                        (v) => v.name === e.target.value
                      );
                      setSelectedVoice(voice);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/20 text-white border border-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    {voices
                      .filter((v) => v.lang.includes("en"))
                      .map((voice) => (
                        <option
                          key={voice.name}
                          value={voice.name}
                          className="text-gray-900"
                        >
                          {voice.name
                            .replace("Microsoft ", "")
                            .replace("Google ", "")}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-6 space-y-4"
            style={{ maxHeight: "100%", overflowY: "auto" }}
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg"
                      : message.role === "system"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-800 text-white shadow-md"
                  } rounded-2xl px-4 py-3`}
                >
                  <div className="flex items-start space-x-2">
                    {message.role === "assistant" && (
                      <Bot
                        size={20}
                        className="mt-1 flex-shrink-0 text-white"
                      />
                    )}
                    <div className="w-full">
                      <p className="whitespace-pre-wrap text-white">
                        {message.content}
                      </p>

                      {/* Display agent cards if available */}
                      {message.agents && message.agents.length > 0 && (
                        <div className="mt-4 space-y-3">
                          {message.agents.map((agent) => (
                            <div
                              key={agent.id}
                              onClick={() => handleAgentSelection(agent)}
                              className="bg-white border-2 border-primary-200 rounded-lg p-4 hover:border-primary-500 hover:shadow-lg transition-all cursor-pointer"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 text-lg">
                                    {agent.fullName}
                                  </h4>
                                  <p className="text-primary-600 text-sm font-medium mt-1">
                                    🎯 {agent.specialization}
                                  </p>
                                  <div className="mt-2 space-y-1">
                                    <p className="text-gray-600 text-sm">
                                      📧 {agent.email}
                                    </p>
                                    <p className="text-gray-600 text-sm">
                                      📞 {agent.phoneNumber}
                                    </p>
                                    <p className="text-gray-600 text-sm">
                                      ⭐ Rating: {agent.rating || "N/A"}/5
                                    </p>
                                  </div>
                                </div>
                                <div className="ml-3">
                                  <div
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                                      agent.isAvailable
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-600"
                                    }`}
                                  >
                                    {agent.isAvailable ? "✓ Available" : "Busy"}
                                  </div>
                                </div>
                              </div>
                              <button className="mt-3 w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-2 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-purple-500/50 font-medium">
                                Book with {agent.fullName.split(" ")[0]}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {message.canBookAppointment && !message.agents && (
                        <div className="mt-3">
                          <Link
                            to="/book-appointment"
                            className="inline-flex items-center space-x-2 bg-white text-primary-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-50"
                          >
                            <Calendar size={16} />
                            <span>Book Appointment</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Bot size={20} />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className="px-6 pb-4 flex-shrink-0">
              <p className="text-sm text-gray-600 mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(question)}
                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t p-4 flex-shrink-0 bg-white">
            <form
              onSubmit={handleSendMessage}
              className="flex items-center space-x-2"
            >
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`p-3 rounded-lg transition-colors ${
                  recording
                    ? "bg-red-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {recording ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me anything about insurance..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-900 bg-white placeholder-gray-500"
              />

              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="btn btn-primary px-6"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AIAssistant;
