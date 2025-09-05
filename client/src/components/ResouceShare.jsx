import React, { useState } from "react";
import { useRef } from "react";
import useWebsocket from "../hooks/useWebsocket";

const ResourceShare = () => {
    const {
        currentInstance,
        data,
        sendData,
        initialize,
        isConnected,
        receivingProgress
    } = useWebsocket("ws://10.194.130.1:5000");

    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [sendingFiles, setSendingFiles] = useState([]);
    const [receivingFiles, setReceivingFiles] = useState({});
    const [selectedFile, setSelectedFile] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const fileData = useRef();

    const handleCodeChange = (index, value) => {
        if (value.length > 1) return;
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
        const isVideo = mimeType?.startsWith('video/');
        const isAudio = mimeType?.startsWith('audio/');
        const isPDF = mimeType?.includes('pdf');
        const isDoc = mimeType?.includes('document') || mimeType?.includes('word') || fileName?.endsWith('.doc') || fileName?.endsWith('.docx');
        const isExcel = mimeType?.includes('spreadsheet') || mimeType?.includes('excel') || fileName?.endsWith('.xls') || fileName?.endsWith('.xlsx');
        
        if (isImage) {
            return {
                icon: (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19M13.5,16L10.5,12.5L8.5,15L6,11.5L9,16H13.5Z"/>
                    </svg>
                ),
                bgColor: 'bg-blue-50',
                iconColor: 'text-blue-500',
                borderColor: 'border-blue-100'
            };
        }
        
        if (isVideo) {
            return {
                icon: (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/>
                    </svg>
                ),
                bgColor: 'bg-red-50',
                iconColor: 'text-red-500',
                borderColor: 'border-red-100'
            };
        }
        
        if (isAudio) {
            return {
                icon: (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,3V13.55C11.41,13.21 10.73,13 10,13A3,3 0 0,0 7,16A3,3 0 0,0 10,19A3,3 0 0,0 13,16V7H17V5H12Z"/>
                    </svg>
                ),
                bgColor: 'bg-purple-50',
                iconColor: 'text-purple-500',
                borderColor: 'border-purple-100'
            };
        }
        
        if (isPDF) {
            return {
                icon: (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                ),
                bgColor: 'bg-orange-50',
                iconColor: 'text-orange-500',
                borderColor: 'border-orange-100'
            };
        }
        
        // Default file icon
        return {
            icon: (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
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
                    {/* Header */}
                    <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-xl font-semibold text-gray-900">Connected Successfully</h1>
                                    <p className="text-gray-600 text-sm" >Client ID: <span className="font-mono">{currentInstance.clientId}</span></p>
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
                                                        {/* <button 
                                                            onClick={() => window.open(url, '_blank')}
                                                            className="flex-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-2  rounded-lg transition-colors flex items-center justify-center"
                                                        >
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                                            </svg>
                                                            
                                                        </button> */}
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
        <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-orange-100 flex items-center justify-center relative overflow-hidden">
        
            {/* Central Connection Card */}
            <div className="relative z-10  backdrop-blur-md p-12 rounded-3xl border-0 max-w-md w-full mx-4">
                {/* Glowing accent */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-orange-600/20 rounded-3xl blur-xl"></div>
                
                <div className="relative z-10">
                    {/* Header */}
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
                                    onChange={(e) => handleCodeChange(index, e.target.value.toUpperCase())}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all duration-200 bg-white/50 backdrop-blur-sm"
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
                                    : 'bg-gray-300 cursor-not-allowed'
                            }`}
                        >
                            {code.join('').length === 6 ? 'Establish Connection' : 'Enter 6-Digit Code'}
                        </button>
                    </div>

                    {/* Status Indicator */}
                    <div className="mt-6 text-center">
                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                            <span>Searching for connections...</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Keep original file handling logic for later use
    
}

export default ResourceShare;