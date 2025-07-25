import React, { useState } from 'react';
import { FaChalkboardTeacher, FaFileUpload, FaPaperPlane, FaExclamationTriangle } from 'react-icons/fa';

export default function UploadTeachers() {
    const [file, setFile] = useState(null);
    const [skippedTeachers, setSkippedTeachers] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const token = localStorage.getItem('token');

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const validExtensions = ['.xlsx', '.xls', '.csv'];
            const fileExt = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
            if (validExtensions.includes(fileExt)) {
                setFile(selectedFile);
                setMessage({ text: '', type: '' });
                setSkippedTeachers([]); // Clear previous results
            } else {
                setFile(null);
                setMessage({ text: 'Invalid file type. Please upload an Excel or CSV file.', type: 'error' });
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSkippedTeachers([]);

        if (!file) {
            setMessage({ text: 'Please select a file to upload.', type: 'error' });
            return;
        }
        setIsUploading(true);
        setMessage({ text: 'Uploading teacher data...', type: 'info' });
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:5001/api/teachers/upload-details', {
                method: 'POST',
                body: formData,
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (!response.ok) {
                throw data;
            }

            const messageType = data.message.includes("Successfully created") ? 'success' : 'info';
            setMessage({ text: data.message, type: messageType });

            if (data.errors && Array.isArray(data.errors)) {
                const idRegex = /'([^']+)'/; // Regex to extract employee ID
                const skipped = data.errors
                    .map(err => {
                        const match = err.match(idRegex);
                        return match ? { id: match[1] } : null;
                    })
                    .filter(Boolean);
                setSkippedTeachers(skipped);
            }

            e.target.reset();
            setFile(null);

        } catch (errorData) {
            const mainMessage = errorData.error || errorData.message || 'An unknown server error occurred.';
            setMessage({ text: mainMessage, type: 'error' });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
                <h1 className="text-2xl font-bold mb-6 flex items-center text-gray-800">
                    <FaChalkboardTeacher className="mr-3 text-blue-600" />
                    Upload Teacher Data
                </h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Upload Teacher File</label>
                        <label className="cursor-pointer w-full flex items-center justify-center px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-md hover:border-blue-500 hover:bg-gray-100 transition-colors">
                            <FaFileUpload className="mr-3 text-gray-500" />
                            <span className="text-gray-700">{file ? file.name : 'Click to select Excel or CSV file'}</span>
                            <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileChange} />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">Supported formats: .xlsx, .xls, .csv</p>
                    </div>

                    {message.text && (
                        <div className={`p-3 rounded-md text-sm ${
                            message.type === 'error' ? 'bg-red-100 border border-red-300 text-red-800' :
                            message.type === 'success' ? 'bg-green-100 border-green-300 text-green-800' :
                            'bg-blue-100 border border-blue-300 text-blue-800'
                        }`}>
                            {message.text}
                        </div>
                    )}
                    
                    <div className="pt-2">
                        <button type="submit" className="w-full flex justify-center items-center px-4 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 disabled:opacity-50" disabled={isUploading}>
                            <FaPaperPlane className="mr-2" />
                            {isUploading ? 'Uploading...' : 'Submit Data'}
                        </button>
                    </div>
                </form>

                {skippedTeachers.length > 0 && (
                    <div className="mt-8 p-4 border border-yellow-300 bg-yellow-50 rounded-lg">
                        <h3 className="text-lg font-semibold text-yellow-800 flex items-center mb-3">
                            <FaExclamationTriangle className="mr-2" />
                            Skipped Teachers (Already Exist)
                        </h3>
                        <div className="overflow-x-auto max-h-60">
                            <table className="min-w-full bg-white border">
                                <thead className="bg-gray-100 sticky top-0">
                                    <tr>
                                        <th className="py-2 px-3 border text-left text-sm">Employee ID</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {skippedTeachers.map((teacher, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="py-2 px-3 border text-sm font-mono">{teacher.id}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
