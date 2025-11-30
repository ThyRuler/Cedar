
import React, { useState, useEffect, useCallback } from 'react';
import { generateImage, generateVideo, checkVideoStatus } from '../services/geminiService';

const ApiKeySelector: React.FC<{ onKeySelected: () => void }> = ({ onKeySelected }) => {
    const [hasKey, setHasKey] = useState(false);
    
    useEffect(() => {
        const checkKey = async () => {
            if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
                const keyStatus = await window.aistudio.hasSelectedApiKey();
                setHasKey(keyStatus);
            }
        };
        checkKey();
    }, []);

    const handleSelectKey = async () => {
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
            await window.aistudio.openSelectKey();
            // Assume success and proceed, to avoid race conditions.
            setHasKey(true);
            onKeySelected();
        }
    };
    
    if (hasKey) return null;

    return (
        <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-10 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center">
                <h3 className="text-lg font-bold mb-2">API Key Required</h3>
                <p className="text-sm mb-4">Video generation requires a paid Google Cloud project. Please select an API key to continue.</p>
                <p className="text-xs mb-4 text-gray-500">For more information, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">billing documentation</a>.</p>
                <button onClick={handleSelectKey} className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700">Select API Key</button>
            </div>
        </div>
    );
};


const ToolsPage: React.FC = () => {
    const [imagePrompt, setImagePrompt] = useState('A beautiful cedar tree in the mountains of Lebanon, hyperrealistic.');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [imageSize, setImageSize] = useState('1K');
    const [imageUrl, setImageUrl] = useState('');
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [imageError, setImageError] = useState('');

    const [videoPrompt, setVideoPrompt] = useState('A drone shot flying over Beirut at sunset');
    const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [videoUrl, setVideoUrl] = useState('');
    const [isVideoLoading, setIsVideoLoading] = useState(false);
    const [videoError, setVideoError] = useState('');
    const [videoStatus, setVideoStatus] = useState('');
    const [operation, setOperation] = useState<any>(null);
    const [needsApiKey, setNeedsApiKey] = useState(true);

    const handleGenerateImage = async () => {
        if (!imagePrompt) return;
        setIsImageLoading(true);
        setImageError('');
        setImageUrl('');
        try {
            const url = await generateImage(imagePrompt, aspectRatio, imageSize);
            setImageUrl(url);
        } catch (e: any) {
            setImageError(e.message);
        } finally {
            setIsImageLoading(false);
        }
    };

    const handleGenerateVideo = async () => {
        if (!videoPrompt) return;
        setVideoStatus("Starting video generation...");
        setIsVideoLoading(true);
        setVideoError('');
        setVideoUrl('');
        setOperation(null);
        try {
            const op = await generateVideo(videoPrompt, videoAspectRatio);
            setOperation(op);
            setVideoStatus("Video generation in progress... this may take a few minutes.");
        } catch (e: any) {
            setVideoError(e.message);
            if (e.message.includes("API key")) {
                setNeedsApiKey(true);
            }
            setIsVideoLoading(false);
        }
    };
    
    const pollVideoStatus = useCallback(async () => {
        if (!operation) return;
        try {
            const result = await checkVideoStatus(operation);
            if(result.done) {
                setVideoUrl(result.url ?? '');
                setVideoStatus("Video generation complete!");
                setOperation(null);
                setIsVideoLoading(false);
            } else {
                 setVideoStatus("Still processing... please wait.");
            }
        } catch(e: any) {
            setVideoError(e.message);
            if (e.message.includes("API key")) {
                setNeedsApiKey(true);
            }
            setIsVideoLoading(false);
            setOperation(null);
        }
    }, [operation]);

    useEffect(() => {
        if (operation) {
            const interval = setInterval(pollVideoStatus, 10000);
            return () => clearInterval(interval);
        }
    }, [operation, pollVideoStatus]);
    
    useEffect(() => {
        const checkKey = async () => {
             if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
                const keyStatus = await window.aistudio.hasSelectedApiKey();
                setNeedsApiKey(!keyStatus);
            } else {
                setNeedsApiKey(false); // Assume no key needed if aistudio isn't present
            }
        };
        checkKey();
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Generation */}
            <div className="bg-white dark:bg-gray-900/50 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Image Generation</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prompt</label>
                        <textarea value={imagePrompt} onChange={e => setImagePrompt(e.target.value)} rows={3} className="mt-1 block w-full rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"></textarea>
                    </div>
                    <div className="flex space-x-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Aspect Ratio</label>
                            <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="mt-1 block w-full rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 shadow-sm focus:border-emerald-500 focus:ring-emerald-500">
                                {["1:1", "3:4", "4:3", "9:16", "16:9"].map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div className="flex-1">
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Image Size</label>
                            <select value={imageSize} onChange={e => setImageSize(e.target.value)} className="mt-1 block w-full rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 shadow-sm focus:border-emerald-500 focus:ring-emerald-500">
                                {["1K", "2K", "4K"].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <button onClick={handleGenerateImage} disabled={isImageLoading} className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 disabled:bg-gray-400">
                        {isImageLoading ? 'Generating...' : 'Generate Image'}
                    </button>
                    {imageError && <p className="text-red-500 text-sm">{imageError}</p>}
                    {isImageLoading && <div className="text-center">Generating your image, please wait...</div>}
                    {imageUrl && <img src={imageUrl} alt="Generated" className="mt-4 rounded-lg w-full"/>}
                </div>
            </div>

            {/* Video Generation */}
            <div className="bg-white dark:bg-gray-900/50 p-6 rounded-lg shadow-lg relative">
                 {needsApiKey && <ApiKeySelector onKeySelected={() => setNeedsApiKey(false)} />}
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Video Generation (Veo)</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prompt</label>
                        <textarea value={videoPrompt} onChange={e => setVideoPrompt(e.target.value)} rows={3} className="mt-1 block w-full rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Aspect Ratio</label>
                        <select value={videoAspectRatio} onChange={e => setVideoAspectRatio(e.target.value as any)} className="mt-1 block w-full rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 shadow-sm focus:border-emerald-500 focus:ring-emerald-500">
                            <option value="16:9">16:9 (Landscape)</option>
                            <option value="9:16">9:16 (Portrait)</option>
                        </select>
                    </div>
                    <button onClick={handleGenerateVideo} disabled={isVideoLoading || needsApiKey} className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 disabled:bg-gray-400">
                        {isVideoLoading ? 'Generating...' : 'Generate Video'}
                    </button>
                    {videoError && <p className="text-red-500 text-sm">{videoError}</p>}
                    {isVideoLoading && <div className="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-md">{videoStatus}</div>}
                    {videoUrl && <video src={videoUrl} controls autoPlay muted loop className="mt-4 rounded-lg w-full"></video>}
                </div>
            </div>
        </div>
    );
};

export default ToolsPage;
