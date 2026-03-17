import { createContext, useState, useEffect } from "react";

export const Context = createContext();

const ContextProvider = (props) => {
    const [input, setInput] = useState("");
    const [recentPrompt, setRecentPrompt] = useState("");
    const [prevPrompts, setPrevPrompts] = useState([]);
    const [showResult, setShowResult] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resultData, setResultData] = useState("");
    const [sessionId, setSessionId] = useState(null);
    const [fileData, setFileData] = useState(null);
    const [mimeType, setMimeType] = useState(null);
    const [fileName, setFileName] = useState("");
    const [darkMode, setDarkMode] = useState(false);
    const [userName, setUserName] = useState("Chan");
    
    // Gems State
    const [gems, setGems] = useState([]);
    const [selectedGemId, setSelectedGemId] = useState(null);

    // Advanced Sidebar & Header State
    const [sessions, setSessions] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredSessions, setFilteredSessions] = useState([]);

    // Deep Research State
    const [isDeepResearch, setIsDeepResearch] = useState(false);

    // Voice State
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        fetchSessions();
        fetchGems();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            searchSessions(searchQuery);
        } else {
            setFilteredSessions(sessions);
        }
    }, [searchQuery, sessions]);

    const fetchSessions = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/sessions", {
                headers: { "Authorization": "Bearer simulation-token" }
            });
            const data = await response.json();
            setSessions(data);
        } catch (error) {
            console.error("Error fetching sessions:", error);
        }
    };

    const fetchGems = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/gems", {
                headers: { "Authorization": "Bearer simulation-token" }
            });
            const data = await response.json();
            setGems(data);
        } catch (error) {
            console.error("Error fetching gems:", error);
        }
    };

    const createGem = async (gemData) => {
        try {
            await fetch("http://localhost:5000/api/gems", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer simulation-token"
                },
                body: JSON.stringify(gemData)
            });
            fetchGems();
        } catch (error) {
            console.error("Error creating gem:", error);
        }
    };

    const searchSessions = async (query) => {
        try {
            const response = await fetch(`http://localhost:5000/api/chats/search?q=${query}`, {
                headers: { "Authorization": "Bearer simulation-token" }
            });
            const data = await response.json();
            setFilteredSessions(data);
        } catch (error) {
            console.error("Error searching sessions:", error);
        }
    };

    const loadSession = async (id) => {
        setLoading(true);
        setShowResult(true);
        setSessionId(id);
        try {
            const response = await fetch(`http://localhost:5000/api/session/${id}`, {
                headers: { "Authorization": "Bearer simulation-token" }
            });
            const data = await response.json();
            if (data.gemId) setSelectedGemId(data.gemId._id || data.gemId);
            else setSelectedGemId(null);

            if (data.messages && data.messages.length > 0) {
                const lastUserMsg = [...data.messages].reverse().find(m => m.role === 'user');
                const lastModelMsg = [...data.messages].reverse().find(m => m.role === 'model');
                setRecentPrompt(lastUserMsg ? lastUserMsg.parts[0].text : "");
                setResultData(lastModelMsg ? lastModelMsg.parts[0].text : "");
            }
        } catch (error) {
            console.error("Error loading session:", error);
        } finally {
            setLoading(false);
        }
    };

    const renameSession = async (id, newTitle) => {
        try {
            await fetch(`http://localhost:5000/api/chats/${id}`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": "Bearer simulation-token" 
                },
                body: JSON.stringify({ title: newTitle })
            });
            fetchSessions();
        } catch (error) {
            console.error("Error renaming session:", error);
        }
    };

    const deleteSession = async (id) => {
        try {
            await fetch(`http://localhost:5000/api/chats/${id}`, {
                method: "DELETE",
                headers: { "Authorization": "Bearer simulation-token" }
            });
            if (sessionId === id) newChat();
            fetchSessions();
        } catch (error) {
            console.error("Error deleting session:", error);
        }
    };

    const pinSession = async (id, isPinned) => {
        try {
            await fetch(`http://localhost:5000/api/chats/${id}`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": "Bearer simulation-token" 
                },
                body: JSON.stringify({ isPinned })
            });
            fetchSessions();
        } catch (error) {
            console.error("Error pinning session:", error);
        }
    };

    const newChat = async () => {
        setLoading(false);
        setShowResult(false);
        setResultData("");
        setSessionId(null);
        setFileData(null);
        setMimeType(null);
        setFileName("");
        setRecentPrompt("");
    }

    const startVoiceInput = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
        };
        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
        };
        recognition.onend = () => setIsListening(false);

        recognition.start();
    };

    const speakText = (text) => {
        if (!('speechSynthesis' in window)) return;
        
        window.speechSynthesis.cancel();
        setIsSpeaking(true);
        
        const utterance = new SpeechSynthesisUtterance(text.replace(/[*#]/g, ''));
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    };

    const stopSpeaking = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    };
    
    const onSent = async (prompt) => {
        setResultData("");
        setLoading(true);
        setShowResult(true);
        
        const promptToSend = prompt || input;
        setRecentPrompt(promptToSend);
        setInput(""); 

        try {
            const body = {
                sessionId: sessionId,
                prompt: promptToSend,
                gemId: selectedGemId
            };

            if (fileData && mimeType) {
                body.fileData = fileData;
                body.mimeType = mimeType;
            }

            const endpoint = isDeepResearch ? "http://localhost:5000/api/research" : "http://localhost:5000/api/chat";
            
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer simulation-token"
                },
                body: JSON.stringify(isDeepResearch ? { query: promptToSend } : body)
            });

            if (!response.ok) {
                throw new Error("Failed to fetch from backend");
            }

            if (!isDeepResearch) {
                const headerSessionId = response.headers.get("x-session-id");
                if (headerSessionId) {
                    setSessionId(headerSessionId);
                }
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedResponse = "";
            setLoading(false);
            setFileData(null);
            setMimeType(null);
            setFileName("");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                accumulatedResponse += chunk;
                setResultData(accumulatedResponse);
            }
            fetchSessions();
            
            if (!isDeepResearch) {
                speakText(accumulatedResponse);
            }
            
        } catch (error) {
            console.error("Error in ContextProvider onSent:", error);
            setResultData("Sorry, an error occurred. Please try again.");
            setLoading(false);
        }
    };

    const contextValue = {
        newChat,
        onSent,
        input,
        setInput,
        recentPrompt,
        setRecentPrompt,
        prevPrompts,
        showResult,
        setShowResult,
        loading,
        setLoading,
        resultData,
        setResultData,
        sessionId,
        setSessionId,
        fileData,
        setFileData,
        mimeType,
        setMimeType,
        fileName,
        setFileName,
        darkMode,
        setDarkMode,
        userName,
        setUserName,
        sessions,
        filteredSessions,
        searchQuery,
        setSearchQuery,
        loadSession,
        renameSession,
        deleteSession,
        pinSession,
        fetchSessions,
        gems,
        selectedGemId,
        setSelectedGemId,
        createGem,
        isDeepResearch,
        setIsDeepResearch,
        isListening,
        startVoiceInput,
        isSpeaking,
        stopSpeaking
    };

    return (
        <Context.Provider value={contextValue}>
            {props.children}
        </Context.Provider>
    );
};

export default ContextProvider;