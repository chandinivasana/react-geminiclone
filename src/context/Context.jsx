import { createContext, useState } from "react";
import sendPromptToGemini from "../geminiApi";

// eslint-disable-next-line react-refresh/only-export-components
export const Context = createContext();
const ContextProvider = (props) => {
    const [input, setInput] = useState("");
    const [recentPrompt, setRecentPrompt] = useState("");
    const [prevPrompts, setPrevPrompts] = useState([]);
    const [showResult, setShowResult] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resultData, setResultData] = useState("");

    const delayPara = (index, nextWord) => {
        setTimeout(() => {
            setResultData(prev => prev + nextWord);
        }, 75 * index);
    };

    const newChat = () => {
        setLoading(false);
        setShowResult(false);
        setResultData("");
    }
    
    const onSent = async (prompt) => {
        setResultData("");
        setLoading(true);
        setShowResult(true);
        
        const promptToSend = prompt || input;
        setRecentPrompt(promptToSend);
        setPrevPrompts(prev => [...prev, promptToSend]);
        setInput(""); 

        try {
            const response = await sendPromptToGemini(promptToSend);
            
            
            const formattedResponse = response.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
            const finalResponse = formattedResponse.replace(/\*/g, '<br>');
            
           
            const responseWords = finalResponse.split(" ");
            
            
            for (let i = 0; i < responseWords.length; i++) {
                const nextWord = responseWords[i];
                delayPara(i, nextWord + " ");
            }
            
        } catch (error) {
            console.error("Error in ContextProvider onSent:", error);
            setResultData("Sorry, an error occurred. Please try again.");
        } finally {
            
            setLoading(false);
        }
    };

    const contextValue = {
        newChat,
        onSent,
        input,
        setInput,
        recentPrompt,
        prevPrompts,
        showResult,
        loading,
        resultData,
    };

    return (
        <Context.Provider value={contextValue}>
            {props.children}
        </Context.Provider>
    );
};

export default ContextProvider;