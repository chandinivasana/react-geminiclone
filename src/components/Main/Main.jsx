import React, { useContext } from 'react'
import './Main.css'
import { assets } from '../../assets/assets'
import { Context } from '../../context/Context'

const Main = () => {
    const { onSent, recentPrompt, showResult, loading, resultData, setInput, input, newChat } = useContext(Context);
    
    const handleCardClick = (promptText) => {
        onSent(promptText);
    };

    return (
        <div className='main'>
            <div className="nav">
                <p>Gemini</p>
                <img onClick={newChat} src={assets.user_icon} alt="User icon" />
            </div>
            <div className="main-container">
                {!showResult ? (
                    <>
                        <div className="greet">
                            <p><span>Hello,Chan.</span></p>
                            <p>How can I help you today?</p>
                        </div>
                        <div className="cards">
                            <div className="card" onClick={() => handleCardClick("Suggest beautiful place to see on an upcoming road trip")}>
                                <p>Suggest beautiful place to see on an upcoming road trip</p>
                                <img src={assets.compass_icon} alt="Compass icon" />
                            </div>
                            <div className="card" onClick={() => handleCardClick("Briefly summarize this concept: urban planning")}>
                                <p>Briefly summarize this concept: urban planning</p>
                                <img src={assets.bulb_icon} alt="Bulb icon" />
                            </div>
                            <div className="card" onClick={() => handleCardClick("Brainstorm team bonding activities for our work retreat")}>
                                <p>Brainstorm team bonding activities for our work retreat</p>
                                <img src={assets.message_icon} alt="Message icon" />
                            </div>
                            <div className="card" onClick={() => handleCardClick("Improve the readability of the following code")}>
                                <p>Improve the readability of the following code</p>
                                <img src={assets.code_icon} alt="Code icon" />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="result">
                        <div className="result-title">
                            <img src={assets.user_icon} alt="User icon" />
                            <p>{recentPrompt}</p>
                        </div>
                        <div className="result-data">
                            <img src={assets.gemini_icon} alt="Gemini icon" />
                            {loading
                                ? <div className="loader">
                                    <hr />
                                    <hr />
                                    <hr />
                                </div>
                                :<p dangerouslySetInnerHTML={{ __html: resultData }}></p>
                            }
                        </div>
                    </div>
                )}
                
                <div className="main-bottom">
                    <div className="search-box">
                        <input
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    onSent(input);
                                }
                            }}
                            value={input}
                            type="text"
                            placeholder="Enter the prompt here"
                        />
                        <div>
                            <img src={assets.gallery_icon} alt="Gallery icon" />
                            <img src={assets.mic_icon} alt="Mic icon" />
                            {input ? <img onClick={() => onSent(input)} src={assets.send_icon} alt="Send icon" className='send-icon' /> : null}
                        </div>
                    </div>
                    <p className="bottom-info">
                        Gemini can malfunction sometimes!crosscheck dude
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Main;