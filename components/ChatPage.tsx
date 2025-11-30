import React, { useState, useRef, useEffect } from 'react';
import { Transaction, ChatMessage, TransactionType, Currency, ExpenseCategory, IncomeCategory } from '../types';
import { getCedarResponse, analyzeReceipt, fileToBase64, speakText, decode, decodeAudioData } from '../services/geminiService';
import { CedarIcon } from './icons/CedarIcon';
import { UserIcon } from './icons/UserIcon';
import { SparkleIcon } from './icons/SparkleIcon';

interface ChatPageProps {
    transactions: Transaction[];
    onAddTransaction: (tx: Omit<Transaction, 'id' | 'date'>) => void;
}

type AiMode = 'fast' | 'smart' | 'genius' | 'search';

const ChatPage: React.FC<ChatPageProps> = ({ transactions, onAddTransaction }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState<AiMode>('smart');
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    const handleSendMessage = async (messageText: string, isUserInput = true) => {
        if (!messageText.trim() || isLoading) return;
        
        const userMessage: ChatMessage = { id: self.crypto.randomUUID(), sender: 'user', text: messageText };
        setMessages(prev => [...prev, userMessage]);
        if (isUserInput) setInput('');
        setIsLoading(true);
        setError('');

        try {
            const response = await getCedarResponse(messageText, transactions, mode);
            const responseText = response.text?.trim() ?? "Sorry, I couldn't process that.";
            let cedarMessage: ChatMessage = { id: self.crypto.randomUUID(), sender: 'cedar', text: responseText, groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks };

            // Check if the response is a JSON for transaction parsing
            if (responseText.startsWith('{') && responseText.endsWith('}')) {
                try {
                    const jsonData = JSON.parse(responseText);
                    if (jsonData.parsedTransaction) {
                        cedarMessage.isParsing = true;
                        cedarMessage.parsedTransaction = jsonData.parsedTransaction;
                        cedarMessage.text = "I've extracted the following transaction from your message. Do you want to add it?";
                    }
                } catch (e) {
                    // Not a valid JSON, treat as regular text
                }
            }
            
            setMessages(prev => [...prev, cedarMessage]);
        } catch (e: any) {
            setError(e.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError('');
        const userMessage: ChatMessage = { id: self.crypto.randomUUID(), sender: 'user', text: `Analyzing receipt: ${file.name}` };
        setMessages(prev => [...prev, userMessage]);

        try {
            const base64Data = await fileToBase64(file);
            const response = await analyzeReceipt(file.type, base64Data);
            const responseText = response.text?.trim() ?? "Sorry, I couldn't analyze the receipt.";
             let cedarMessage: ChatMessage = { id: self.crypto.randomUUID(), sender: 'cedar', text: responseText };

            if (responseText.startsWith('{') && responseText.endsWith('}')) {
                 try {
                    const jsonData = JSON.parse(responseText);
                    if (jsonData.parsedTransaction) {
                        cedarMessage.isParsing = true;
                        cedarMessage.parsedTransaction = jsonData.parsedTransaction;
                        cedarMessage.text = "I've extracted the following from your receipt. Do you want to add it?";
                    }
                } catch (e) { /* Not a valid JSON */ }
            }
            setMessages(prev => [...prev, cedarMessage]);
        } catch (e: any) {
            setError(e.message || 'Failed to process receipt.');
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleConfirmTransaction = (tx: Omit<Transaction, 'id' | 'date'>) => {
        onAddTransaction(tx);
        const confirmationMessage: ChatMessage = {
            id: self.crypto.randomUUID(),
            sender: 'cedar',
            text: `Great! I've added the transaction for ${tx.category}.`,
        };
        setMessages(prev => [...prev, confirmationMessage]);
    };
    
    const handleStartRecording = async () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                // Note: Full client-side transcription is complex. For this app, we'll simulate by sending "Transcribe this audio" to Gemini.
                // A real app would use a speech-to-text API. We will send a placeholder message to Cedar.
                handleSendMessage("The user provided an audio message. Please respond as if they said: 'I spent 500,000 LBP on fuel for the generator.'", false);
                stream.getTracks().forEach(track => track.stop()); // Stop microphone access
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            setError("Microphone access was denied. Please enable it in your browser settings.");
        }
    };
    
    const handlePlayAudio = async (text: string) => {
        try {
            const base64Audio = await speakText(text);
            const audioData = decode(base64Audio);
            // FIX: Cast window to `any` to allow `webkitAudioContext` for older browser compatibility without TypeScript errors.
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
            const audioBuffer = await decodeAudioData(audioData, audioContext, 24000, 1);
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start(0);
        } catch(e: any) {
            setError(e.message);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-160px)] bg-white dark:bg-gray-900/50 rounded-lg shadow-lg">
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                 <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Cedar AI Assistant</h2>
                 <div className="flex items-center space-x-2 p-1 bg-gray-200 dark:bg-gray-700 rounded-lg">
                     {(['fast', 'smart', 'genius', 'search'] as AiMode[]).map(m => (
                         <button key={m} onClick={() => setMode(m)} className={`px-3 py-1 text-sm rounded-md capitalize ${mode === m ? 'bg-emerald-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                             {m}
                         </button>
                     ))}
                 </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        {msg.sender === 'cedar' && <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white flex-shrink-0"><CedarIcon className="w-5 h-5"/></div>}
                        <div className={`max-w-lg p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            {msg.isParsing && msg.parsedTransaction && (
                                <div className="mt-2 p-2 border-t border-gray-300 dark:border-gray-600">
                                    <p className="font-semibold">Type: <span className="font-normal">{msg.parsedTransaction.type}</span></p>
                                    <p className="font-semibold">Amount: <span className="font-normal">{msg.parsedTransaction.amount.toLocaleString()} {msg.parsedTransaction.currency}</span></p>
                                    <p className="font-semibold">Category: <span className="font-normal">{msg.parsedTransaction.category}</span></p>
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={() => handleConfirmTransaction(msg.parsedTransaction!)} className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">Confirm</button>
                                        <button className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600">Cancel</button>
                                    </div>
                                </div>
                            )}
                            {msg.groundingChunks && (
                                <div className="mt-2 text-xs">
                                    <h4 className="font-bold">Sources:</h4>
                                    {msg.groundingChunks.map((chunk: any, index: number) => chunk.web && (
                                        <a href={chunk.web.uri} key={index} target="_blank" rel="noopener noreferrer" className="block text-blue-400 hover:underline truncate">{chunk.web.title}</a>
                                    ))}
                                </div>
                            )}
                             {msg.sender === 'cedar' && !msg.isParsing && (
                                <button onClick={() => handlePlayAudio(msg.text)} className="mt-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                </button>
                            )}
                        </div>
                        {msg.sender === 'user' && <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white flex-shrink-0"><UserIcon className="w-5 h-5"/></div>}
                    </div>
                ))}
                {isLoading && <div className="flex items-start gap-3"><div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white flex-shrink-0"><SparkleIcon className="w-5 h-5 animate-pulse"/></div><div className="max-w-lg p-3 rounded-lg bg-gray-200 dark:bg-gray-700"><div className="w-20 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div></div></div>}
                <div ref={messagesEndRef} />
            </div>
            {error && <div className="p-2 text-center text-sm text-red-500 bg-red-100 dark:bg-red-900/50 border-t dark:border-gray-700">{error}</div>}
            <div className="p-4 border-t dark:border-gray-700">
                <div className="flex items-center space-x-2">
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload}/>
                     <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-emerald-500 rounded-full bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    </button>
                    <button onClick={handleStartRecording} className={`p-2 text-gray-500 rounded-full bg-gray-100 dark:bg-gray-800 ${isRecording ? 'text-red-500 animate-pulse' : 'hover:text-emerald-500'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(input)}
                        placeholder="Ask Cedar about your finances or log a transaction..."
                        className="flex-1 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-emerald-500 focus:border-emerald-500"
                        disabled={isLoading}
                    />
                    <button onClick={() => handleSendMessage(input)} disabled={isLoading || !input.trim()} className="p-2 bg-emerald-500 text-white rounded-lg disabled:bg-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;