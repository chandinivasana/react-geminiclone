import { createContext, useState, useEffect } from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const Context = createContext();

const ContextProvider = (props) => {
    const [input, setInput] = useState("");
    const [recentPrompt, setRecentPrompt] = useState("");
    const [prevPrompts, setPrevPrompts] = useState([]); // This might be redundant now with sessions
    const [showResult, setShowResult] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resultData, setResultData] = useState("");
    const [sessionId, setSessionId] = useState(null);
    const [image, setImage] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    const [userName, setUserName] = useState("Chan");
    
    // Advanced Sidebar & Header State
    const [sessions, setSessions] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredSessions, setFilteredSessions] = useState([]);

    useEffect(() => {
        fetchSessions();
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
            // Assuming we want to show the last interaction
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
        setImage(null);
        setRecentPrompt("");
    }
    
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
                prompt: promptToSend
            };

            if (image) {
                body.image = image;
            }

            const response = await fetch("http://localhost:5000/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer simulation-token"
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error("Failed to fetch from backend");
            }

            const headerSessionId = response.headers.get("x-session-id");
            if (headerSessionId) {
                setSessionId(headerSessionId);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedResponse = "";
            setLoading(false);
            setImage(null);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                accumulatedResponse += chunk;
                setResultData(accumulatedResponse);
            }
            fetchSessions(); // Refresh list after sending
            
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
        image,
        setImage,
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
        fetchSessions
    };

    return (
        <Context.Provider value={contextValue}>
            {props.children}
        </Context.Provider>
    );
};

export default ContextProvider;
