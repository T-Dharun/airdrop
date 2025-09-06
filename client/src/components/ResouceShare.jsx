import React, { useState } from "react";
import { useRef } from "react";
import useWebsocket from "../hooks/useWebsocket";
import docs from "../assets/docs.svg";
import sheet from "../assets/sheet.svg";
import slides from "../assets/slides.svg";
import image from "../assets/image.svg";
import pdf from "../assets/pdf.svg";
import music from "../assets/music.svg";
import video from "../assets/movie.svg";
import text from "../assets/text.svg";

// Add custom animations
const customStyles = `
  @keyframes blob {
    0% { transform: translate(0px, 0px) scale(1); }
    33% { transform: translate(30px, -50px) scale(1.1); }
    66% { transform: translate(-20px, 20px) scale(0.9); }
    100% { transform: translate(0px, 0px) scale(1); }
  }
  
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes bounce-slow {
    0%, 100% { transform: translateY(0) rotate(12deg); }
    50% { transform: translateY(-10px) rotate(12deg); }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  
  @keyframes float-reverse {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(20px); }
  }
  
  @keyframes fade-in {
    0% { opacity: 0; transform: translateY(-20px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  
  .animate-blob { animation: blob 7s infinite; }
  .animate-spin-slow { animation: spin-slow 10s linear infinite; }
  .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
  .animate-float { animation: float 4s ease-in-out infinite; }
  .animate-float-reverse { animation: float-reverse 4s ease-in-out infinite; }
  .animate-fade-in { animation: fade-in 0.3s ease-out; }
  .animation-delay-1000 { animation-delay: 1s; }
  .animation-delay-1500 { animation-delay: 1.5s; }
  .animation-delay-2000 { animation-delay: 2s; }
  .animation-delay-3000 { animation-delay: 3s; }
  .animation-delay-4000 { animation-delay: 4s; }
`;

const ResourceShare = () => {
    const {
        currentInstance,
        data,
        sendData,
        initialize,
        isConnected,
        receivingProgress,
        disconnect
    } = useWebsocket("wss://airdropx.onrender.com/");

    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [sendingFiles, setSendingFiles] = useState([]);
    const [receivingFiles, setReceivingFiles] = useState({});
    const [selectedFile, setSelectedFile] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const fileData = useRef();
    console.log(receivingProgress);
    const handleCodeChange = (index, value) => {
        if (value.length > 1) return;
        
        // Check if the input is a digit
        if (value && !/^\d$/.test(value)) {
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000); // Hide toast after 3 seconds
            return;
        }
        
        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);
        
        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`code-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Handle backspace to go to previous input
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            const prevInput = document.getElementById(`code-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    // Helper function to get file type icon and color
    const getFileIcon = (mimeType, fileName) => {
        const isImage = mimeType?.startsWith('image/');
        const isVideo = mimeType?.startsWith('video/') || fileName?.endsWith('.video');
        const isAudio = mimeType?.startsWith('audio/') || fileName?.endsWith('.audio');
        const isPDF = mimeType?.includes('pdf');
        const isDoc = mimeType?.includes('.document') || mimeType?.includes('word') || fileName?.endsWith('.doc') || fileName?.endsWith('.docx');
        const isExcel = mimeType?.includes('.sheet') || mimeType?.includes('excel') || fileName?.endsWith('.xls') || fileName?.endsWith('.xlsx');
        const isSlide = mimeType?.includes('.presentation')  || fileName?.endsWith('.pptx') || fileName?.endsWith('.ppt');
        
        if (isDoc) {
            return {
                icon: (
                    <img src={docs} width={40}/>
                ),
                bgColor: 'bg-blue-50',
                iconColor: 'text-blue-500',
                borderColor: 'border-blue-100'
            };
        }
        if (isImage) {
            return {
                icon: (
                    <img src={image} width={50}/>
                ),
                bgColor: 'bg-violet-50',
                iconColor: 'text-violet-500',
                borderColor: 'border-violet-100'
            };
        }
        if (isSlide) {
            return {
                icon: (
                    <img src={slides} width={50}/>
                ),
                bgColor: 'bg-yellow-50',
                iconColor: 'text-violet-500',
                borderColor: 'border-yellow-100'
            };
        }

        if (isExcel) {
            return {
                icon: (
                    <img src={sheet} width={40}/>
                ),
                bgColor: 'bg-green-50',
                iconColor: 'text-blue-500',
                borderColor: 'border-green-100'
            };
        }
        
        if (isVideo) {
            return {
                icon: (
                     <img src={video} width={40} />
                ),
                bgColor: 'bg-red-50',
                iconColor: 'text-red-500',
                borderColor: 'border-red-100'
            };
        }
        
        if (isAudio) {
            return {
                icon: (
                     <img src={music} width={40} />
                ),
                bgColor: 'bg-purple-50',
                iconColor: 'text-purple-500',
                borderColor: 'border-purple-100'
            };
        }
        
        if (isPDF) {
            return {
                icon: (
                    <img src={pdf} width={40} />
                ),
                bgColor: 'bg-orange-50',
                iconColor: 'text-orange-500',
                borderColor: 'border-orange-100'
            };
        }
        
        // Default file icon
        return {
            icon: (
                <img src={text} width={40}/>
            ),
            bgColor: 'bg-gray-50',
            iconColor: 'text-gray-500',
            borderColor: 'border-gray-100'
        };
    };

    const handleConnect = () => {
        const remoteCode = code.join('');
        if (remoteCode.length === 6) {
            initialize(remoteCode);
        }
    };

    const handleFileSelect = (file) => {
        setSelectedFile(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleFileInput = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleFile = () => {
        const file = selectedFile;
        if (!file) return;

        // Add file to sending list
        const fileId = Date.now() + Math.random();
        const fileInfo = {
            id: fileId,
            name: file.name,
            size: file.size,
            type: file.type,
            progress: 0,
            status: 'sending'
        };
        setSendingFiles(prev => [...prev, fileInfo]);
        console.log(fileInfo);
        sendData(
            JSON.stringify({ type: "file-meta", name: file.name, mime: file.type, size: file.size })
        );
        
        const chunksize = 16 * 1024;
        let offset = 0;

        const reader = new FileReader();
        reader.onload = (e) => {
            const buffer = e.target.result;
            console.log(buffer);
          const sendChunk = () => {
        if (offset < buffer.byteLength) {
            const slice = buffer.slice(offset, offset + chunksize);
            sendData(slice);
            offset += chunksize;

            // Update progress
            const progress = Math.min((offset / buffer.byteLength) * 100, 100);
            setSendingFiles(prev => 
                prev.map(f => f.id === fileId ? { ...f, progress } : f)
            );

            // Schedule next chunk
            setTimeout(sendChunk, 10);
        } else {
            // Finished sending
            sendData("EOF");
            setSendingFiles(prev => prev.filter(f => f.id !== fileId));
        }
    };

    sendChunk();
        }
        reader.readAsArrayBuffer(file);
        
        // Clear selected file
        setSelectedFile(null);
        if (fileData.current) {
            fileData.current.value = '';
        }
    }

    // Show file sharing interface after connection
    if (isConnected) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-6xl mx-auto p-6">
                    {/* Premium Header */}
                    <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-2xl p-5 py-8 mb-8 text-white relative overflow-hidden">
                        {/* Background Pattern */}
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center space-x-6">
                                {/* App Logo/Icon */}
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/>
                                    </svg>
                                </div>
                                
                                <div>
                                    <h1 className="text-xl font-bold mb-2 sm:text-3xl">AirdropX

                                        <button 
                                        onClick={disconnect}
                                        className="bg-white/20 backdrop-blur-sm p-2 ml-5 rounded-lg hover:bg-white/30 transition-colors group"
                                        title="Disconnect"
                                    >
                                        <svg className="w-5 h-5 text-white group-hover:text-orange-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                                        </svg>
                                    </button>
                                    </h1>
                                    <p className="text-orange-200 flex items-center space-x-2 xs:text-xs hidden md:block">
                                        <span>Connected Successfully</span>
                                    </p>
                                </div>
                            </div>
                            
                            <div className="text-right">
                                <p className="text-orange-100 text-sm mb-1">Client ID</p>
                                
                                <div className="bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg">
                                    <span className="font-mono text-sm font-semibold">{currentInstance.clientId}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Send Files Section */}
                        <div className="bg-white rounded-2xl border border-gray-200">
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="text-lg font-semibold text-gray-900">Send Files</h2>
                            </div>
                            <div className="p-6">
                                {/* File Upload Area */}
                                <div 
                                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                                        dragOver 
                                            ? 'border-orange-400 bg-orange-50' 
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <input 
                                        ref={fileData}
                                        type="file" 
                                        onChange={handleFileInput}
                                        className="hidden" 
                                        id="file-input"
                                    />
                                    <label htmlFor="file-input" className="cursor-pointer">
                                        <div className="text-gray-400 mb-4">
                                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                                            </svg>
                                        </div>
                                        <div className="text-gray-600">
                                            <p className="text-base mb-2">
                                                {selectedFile ? selectedFile.name : 'Drop files here or click to browse'}
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Support all file types'}
                                            </p>
                                        </div>
                                    </label>
                                    
                                    {selectedFile && (
                                        <button 
                                            onClick={handleFile}
                                            className="mt-4 bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                                        >
                                            Send File
                                        </button>
                                    )}
                                </div>

                                {/* Sending Progress */}
                                {sendingFiles.length > 0 && (
                                    <div className="mt-6">
                                        <h3 className="text-sm font-medium text-gray-900 mb-3">Sending</h3>
                                        <div className="space-y-3">
                                            {sendingFiles.map((file) => (
                                                <div key={file.id} className="bg-gray-50 rounded-lg p-3">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-medium text-gray-900 truncate">{file.name}</span>
                                                        <span className="text-sm text-gray-600">{Math.round(file.progress)}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                        <div 
                                                            className="bg-orange-600 h-1.5 rounded-full transition-all duration-300"
                                                            style={{ width: `${file.progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Received Files Section */}
                        <div className="bg-white rounded-2xl border border-gray-200">
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="text-lg font-semibold text-gray-900">Received Files</h2>
                            </div>
                            
                            {/* Receiving Progress */}
                            {Object.keys(receivingProgress).length > 0 && (
                                <div className="p-6 border-b border-gray-100">
                                    <h3 className="text-sm font-medium text-gray-900 mb-3">Receiving</h3>
                                    <div className="space-y-3">
                                        {Object.values(receivingProgress).map((file) => (
                                            <div key={file.name} className="bg-blue-50 rounded-lg p-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium text-gray-900 truncate">{file.name}</span>
                                                    <span className="text-sm text-gray-600">{Math.round(file.progress || 0)}%</span>
                                                </div>
                                                <div className="w-full bg-blue-200 rounded-full h-1.5">
                                                    <div 
                                                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                                        style={{ width: `${file.progress || 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Files Grid */}
                            <div className="p-6">
                                {data.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="text-gray-400 mb-4">
                                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                                            </svg>
                                        </div>
                                        <p className="text-gray-500">No files received yet</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                                        {data.map((item, i) => {
                                            if (item.type !== 'file') return null;
                                            const url = URL.createObjectURL(item.blob);
                                            const fileStyle = getFileIcon(item.blob.type, item.name);
                                            
                                            return (
                                                <div key={i} className={`${fileStyle.bgColor} ${fileStyle.borderColor} border rounded-xl p-4 hover:shadow-sm transition-all group`}>
                                                    {/* File Icon */}
                                                    <div className={`w-16 h-16 ${fileStyle.bgColor} rounded-lg flex items-center justify-center mx-auto mb-0 ${fileStyle.iconColor}`}>
                                                        {fileStyle.icon}
                                                    </div>
                                                    
                                                    {/* File Name */}
                                                    <p className="text-sm font-medium text-gray-900 text-center  truncate" title={item.name}>
                                                        {item.name}
                                                    </p>
                                                    
                                                    {/* File Size */}
                                                    <p className="text-xs text-gray-500 text-center mb-3">
                                                        {(item.blob.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                    
                                                    {/* Action Buttons */}
                                                    <div className="flex space-x-2 ">
                                                        <a 
                                                            href={url} 
                                                            download={item.name}
                                                            className="flex-3 bg-green-100 hover:bg-green-200 text-green-700 text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center"
                                                        >
                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                                            </svg>
                                                            Download
                                                        </a>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            
            <style>{customStyles}</style>
            
            {/* Toast Notification */}
            {showToast && (
                <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-fade-in">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zM4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8-8-3.589-8-8zm9-3h-2v6h2v-6zm0 8h-2v2h2v-2z"/>
                    </svg>
                    <span>Only digits (0-9) are allowed!</span>
                </div>
            )}
            
            <div className="min-h-screen bg-gradient-to-br from-orange-100 via-white to-orange-200 flex items-center justify-center relative overflow-hidden">
            
            
            <div className="absolute inset-0">
                
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-1/4 left-1/3 w-32 h-32 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
                
                {/* Geometric Shapes */}
                <div className="absolute top-20 right-20 w-16 h-16 border border-orange-300 rotate-45 animate-spin-slow opacity-40"></div>
                <div className="absolute bottom-32 left-20 w-12 h-12 bg-orange-300 rotate-12 animate-bounce-slow opacity-30"></div>
                <div className="absolute top-1/2 right-10 w-8 h-8 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full animate-pulse opacity-50"></div>
                
                {/* Connection Ripples */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-96 h-96 border border-orange-300 rounded-full animate-ping opacity-20 animation-delay-1000"></div>
                    <div className="absolute inset-8 border border-orange-400 rounded-full animate-ping opacity-15 animation-delay-2000"></div>
                    <div className="absolute inset-16 border border-orange-500 rounded-full animate-ping opacity-10 animation-delay-3000"></div>
                </div>
                
                {/* Floating Particles */}
                <div className="absolute top-1/4 left-1/2 w-2 h-2 bg-orange-400 rounded-full animate-float opacity-60"></div>
                <div className="absolute top-3/4 left-1/4 w-1 h-1 bg-yellow-500 rounded-full animate-float-reverse opacity-70"></div>
                <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-orange-300 rounded-full animate-float animation-delay-1500"></div>
                <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-pink-400 rounded-full animate-float-reverse animation-delay-3000"></div>
            </div>
        
            {/* Central Connection Card */}
            <div className="relative z-10 backdrop-blur-sm p-12 rounded-3xl border border-orange-200 max-w-md w-full mx-4">
                
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-orange-500/10 rounded-3xl blur-xl"></div>
                
                <div className="relative z-10">
                    
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Connect to Transfer</h1>
                        <p className="text-gray-600">Your Client ID</p>
                        <div className="text-xl font-mono font-bold text-orange-600 bg-orange-50 px-4 py-2 rounded-lg mt-2">
                            {currentInstance.clientId || "X X X X X X"}
                        </div>
                    </div>

                    {/* Code Input Section */}
                    <div className="mb-8">
                        <label className="block text-gray-700 text-sm font-semibold mb-4 text-center">
                            Enter Remote Client Code
                        </label>
                        <div className="flex justify-center space-x-2">
                            {code.map((digit, index) => (
                                <input
                                    key={index}
                                    id={`code-${index}`}
                                    type="text"
                                    value={digit}
                                    onChange={(e) => handleCodeChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                                    maxLength="1"
                                    placeholder="*"
                                />
                            ))}
                        </div>
                    </div>

                    {/* Connect Button */}
                    <div className="text-center">
                        <button 
                            onClick={handleConnect}
                            disabled={code.join('').length !== 6}
                            className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 ${
                                code.join('').length === 6 
                                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5' 
                                    : 'bg-gray-400 text-white cursor-not-allowed'
                            }`}
                        >
                            {code.join('').length === 6 ? 'Establish Connection' : 'Enter 6-Digit Code'}
                        </button>
                    </div>

                    {/* Status Indicator */}
                    <div className="mt-6 text-center">
                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-900">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                            <span>{currentInstance.message || "Searching for connections ..."}</span>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </>
    );

    // Keep original file handling logic for later use
    
}

export default ResourceShare;