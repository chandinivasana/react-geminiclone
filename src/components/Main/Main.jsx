import React, { useContext, useState } from 'react'
import './Main.css'
import { assets } from '../../assets/assets'
import { Context } from '../../context/Context'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { 
  Search, 
  Settings, 
  User, 
  Activity, 
  Share2, 
  Sun, 
  Moon, 
  Monitor,
  Check,
  Copy,
  Twitter,
  Linkedin,
  LogOut
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";

const Main = () => {
    const { 
        onSent, 
        recentPrompt, 
        showResult, 
        loading, 
        resultData, 
        setInput, 
        input, 
        setImage, 
        image, 
        userName, 
        setUserName,
        searchQuery,
        setSearchQuery,
        darkMode,
        setDarkMode,
        sessionId
    } = useContext(Context);
    
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCardClick = (promptText) => {
        onSent(promptText);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const copyToClipboard = () => {
        const url = `${window.location.origin}/chat/${sessionId}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareToSocial = (platform) => {
        const url = `${window.location.origin}/chat/${sessionId}`;
        const text = "Check out this chat with Gemini Clone!";
        let shareUrl = "";
        if (platform === 'twitter') {
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        } else if (platform === 'linkedin') {
            shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        }
        window.open(shareUrl, '_blank');
    };

    return (
        <div className={`main ${darkMode ? 'dark' : ''}`}>
            <div className="header">
                <div className="header-left">
                    <p>Gemini</p>
                </div>
                
                <div className="header-center">
                    <div className="search-bar">
                        <Search size={18} />
                        <input 
                            type="text" 
                            placeholder="Search chats..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="header-right">
                    <button className="icon-btn" onClick={() => setDarkMode(!darkMode)}>
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    
                    {sessionId && (
                        <button className="share-btn" onClick={() => setShareModalOpen(true)}>
                            <Share2 size={18} />
                            <span>Share</span>
                        </button>
                    )}

                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                            <img src={assets.user_icon} alt="User" className="user-avatar" />
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                            <DropdownMenu.Content className="dropdown-content" sideOffset={5} align="end">
                                <DropdownMenu.Label className="dropdown-label">My Account</DropdownMenu.Label>
                                <DropdownMenu.Separator className="dropdown-separator" />
                                <DropdownMenu.Item className="dropdown-item">
                                    <User size={16} /> <span>Profile</span>
                                </DropdownMenu.Item>
                                <DropdownMenu.Item className="dropdown-item">
                                    <Settings size={16} /> <span>Settings</span>
                                </DropdownMenu.Item>
                                <DropdownMenu.Item className="dropdown-item">
                                    <Activity size={16} /> <span>Activity</span>
                                </DropdownMenu.Item>
                                <DropdownMenu.Separator className="dropdown-separator" />
                                <DropdownMenu.Item className="dropdown-item delete">
                                    <LogOut size={16} /> <span>Log out</span>
                                </DropdownMenu.Item>
                            </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                </div>
            </div>

            <div className="main-container">
                {!showResult ? (
                    <>
                        <div className="greet">
                            <p><span>Hello, {userName}.</span></p>
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
                                : <div className='markdown-container'>
                                    {image && <img src={image} alt="Selected" className="image-preview" />}
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            code({ node, inline, className, children, ...props }) {
                                                const match = /language-(\w+)/.exec(className || '')
                                                return !inline && match ? (
                                                    <SyntaxHighlighter
                                                        style={vscDarkPlus}
                                                        language={match[1]}
                                                        PreTag="div"
                                                        {...props}
                                                    >
                                                        {String(children).replace(/\n$/, '')}
                                                    </SyntaxHighlighter>
                                                ) : (
                                                    <code className={className} {...props}>
                                                        {children}
                                                    </code>
                                                )
                                            }
                                        }}
                                    >
                                        {resultData}
                                    </ReactMarkdown>
                                  </div>
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
                            <input
                                type="file"
                                accept="image/*"
                                id="imageInput"
                                style={{ display: 'none' }}
                                onChange={handleImageChange}
                            />
                            <label htmlFor="imageInput">
                                <img src={assets.gallery_icon} alt="Gallery icon" style={{ cursor: 'pointer' }} />
                            </label>
                            {image && <p className="image-attached">Image Attached</p>}
                            <img src={assets.mic_icon} alt="Mic icon" />
                            {input ? <img onClick={() => onSent(input)} src={assets.send_icon} alt="Send icon" className='send-icon' /> : null}
                        </div>
                    </div>
                    <p className="bottom-info">
                        Gemini can malfunction sometimes! crosscheck dude
                    </p>
                </div>
            </div>

            {/* Share Modal */}
            <Dialog.Root open={shareModalOpen} onOpenChange={setShareModalOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="dialog-overlay" />
                    <Dialog.Content className="dialog-content">
                        <Dialog.Title className="dialog-title">Share this chat</Dialog.Title>
                        <Dialog.Description className="dialog-description">
                            Generate a link to share this conversation with others.
                        </Dialog.Description>
                        
                        <div className="share-link-box">
                            <input readOnly value={`${window.location.origin}/chat/${sessionId}`} />
                            <button onClick={copyToClipboard}>
                                {copied ? <Check size={18} color="#10b981" /> : <Copy size={18} />}
                            </button>
                        </div>

                        <div className="share-socials">
                            <button onClick={() => shareToSocial('twitter')}>
                                <Twitter size={20} />
                                <span>Twitter</span>
                            </button>
                            <button onClick={() => shareToSocial('linkedin')}>
                                <Linkedin size={20} />
                                <span>LinkedIn</span>
                            </button>
                        </div>

                        <div className="dialog-footer">
                            <Dialog.Close asChild>
                                <button className="close-btn">Done</button>
                            </Dialog.Close>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
};

export default Main;
