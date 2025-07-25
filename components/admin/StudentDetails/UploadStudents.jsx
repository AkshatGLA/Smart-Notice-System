import React, { useState, useEffect } from 'react';
import { FaUserGraduate, FaFileUpload, FaPaperPlane, FaExclamationTriangle } from 'react-icons/fa';

export default function UploadStudentData() {
    // State for dropdown data
    const [departments, setDepartments] = useState([]);
    const [courses, setCourses] = useState([]);
    
    // State for selected form fields
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');
    const [year, setYear] = useState('');
    const [section, setSection] = useState('');
    const [file, setFile] = useState(null);

    // --- NEW STATE TO STORE SKIPPED STUDENTS ---
    const [skippedStudents, setSkippedStudents] = useState([]);

    // State for UI feedback
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState({ deps: false, courses: false });
    const [message, setMessage] = useState({ text: '', type: '' });

    const years = ['1st', '2nd', '3rd', '4th', '5th'];
    const token = localStorage.getItem('token');

    // Effect to fetch departments (no changes here)
    useEffect(() => {
        if (!token) return;
        const fetchDepartments = async () => {
            setIsLoading(prev => ({ ...prev, deps: true }));
            try {
                const response = await fetch('http://localhost:5001/api/departments', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to fetch departments');
                const data = await response.json();
                setDepartments(data);
            } catch (error) {
                setMessage({ text: error.message, type: 'error' });
            } finally {
                setIsLoading(prev => ({ ...prev, deps: false }));
            }
        };
        fetchDepartments();
    }, [token]);

    // Effect to fetch courses (no changes here)
    useEffect(() => {
        if (!selectedDept) {
            setCourses([]);
            setSelectedCourse('');
            return;
        }
        const fetchCourses = async () => {
            setIsLoading(prev => ({ ...prev, courses: true }));
            try {
                const response = await fetch(`http://localhost:5001/api/departments/${selectedDept}/courses`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to fetch courses');
                const data = await response.json();
                setCourses(data);
            } catch (error) {
                setMessage({ text: error.message, type: 'error' });
            } finally {
                setIsLoading(prev => ({ ...prev, courses: false }));
            }
        };
        fetchCourses();
    }, [selectedDept, token]);
    
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const validExtensions = ['.xlsx', '.xls', '.csv'];
            const fileExt = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
            if (validExtensions.includes(fileExt)) {
                setFile(selectedFile);
                setMessage({ text: '', type: '' });
            } else {
                setFile(null);
                setMessage({ text: 'Invalid file type.', type: 'error' });
            }
        }
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    setSkippedStudents([]);

    if (!selectedDept || !selectedCourse || !year || !section || !file) {
        setMessage({ text: 'All fields, including the file, are required.', type: 'error' });
        return;
    }
    setIsUploading(true);
    setMessage({ text: 'Uploading data...', type: 'info' });
    const formData = new FormData();
    const departmentName = departments.find(d => d.code === selectedDept)?.name;
    formData.append('department', departmentName);
    formData.append('course', selectedCourse);
    formData.append('year', year);
    formData.append('section', section);
    formData.append('file', file);

    try {
        const response = await fetch('http://localhost:5001/api/students/upload-details', {
            method: 'POST',
            body: formData,
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (!response.ok) {
            throw data;
        }

        // --- THIS IS THE KEY LOGIC CHANGE ---
        // Handle the successful response from the backend
        
        // Set the main message (e.g., "Successfully created 50 students")
        // Use a success or info style depending on whether any students were added.
        const messageType = data.message.includes("Successfully created") ? 'success' : 'info';
        setMessage({ text: data.message, type: messageType });

        // If the backend sent back a list of skipped students, display them
        if (data.errors && Array.isArray(data.errors)) {
            const rollNoRegex = /'(\d+)'/;
            const skipped = data.errors
                .map(err => {
                    const match = err.match(rollNoRegex);
                    return match ? { rollNo: match[1] } : null;
                })
                .filter(Boolean);
            setSkippedStudents(skipped);
        }

        e.target.reset();
        setFile(null);

    } catch (errorData) {
        // This will now only catch major server errors (500) or validation errors (400)
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
                    <FaUserGraduate className="mr-3 text-blue-600" />
                    Upload Student Data
                </h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Form fields (no changes here) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                            <select id="department" value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} disabled={isLoading.deps} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200">
                                <option value="">{isLoading.deps ? 'Loading...' : 'Select Department'}</option>
                                {departments.map(dep => <option key={dep.code} value={dep.code}>{dep.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                            <select id="course" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} disabled={!selectedDept || isLoading.courses} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200">
                                <option value="">{isLoading.courses ? 'Loading...' : 'Select Course'}</option>
                                {courses.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                            <select id="year" value={year} onChange={(e) => setYear(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="" disabled>Select Year</option>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                            <input type="text" id="section" placeholder="e.g., A, B, C1" value={section} onChange={(e) => setSection(e.target.value.toUpperCase())} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Upload Student File</label>
                        <label className="cursor-pointer w-full flex items-center justify-center px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-md hover:border-blue-500 hover:bg-gray-100 transition-colors">
                            <FaFileUpload className="mr-3 text-gray-500" />
                            <span className="text-gray-700">{file ? file.name : 'Click to select Excel or CSV file'}</span>
                            <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileChange} />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">Supported formats: .xlsx, .xls, .csv</p>
                    </div>

                    {/* Message Display */}
                    {message.text && (
                        <div className={`p-3 rounded-md text-sm ${
                            message.type === 'error' ? 'bg-red-100 border border-red-300 text-red-800' :
                            message.type === 'success' ? 'bg-green-100 border border-green-300 text-green-800' :
                            'bg-blue-100 border border-blue-300 text-blue-800'
                        }`}>
                            {message.text}
                        </div>
                    )}
                    
                    <div className="pt-2">
                        <button type="submit" className="w-full flex justify-center items-center px-4 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isUploading}>
                            <FaPaperPlane className="mr-2" />
                            {isUploading ? 'Uploading...' : 'Submit Data'}
                        </button>
                    </div>
                </form>

                {/* --- NEW SECTION TO DISPLAY SKIPPED STUDENTS --- */}
                {skippedStudents.length > 0 && (
                    <div className="mt-8 p-4 border border-yellow-300 bg-yellow-50 rounded-lg">
                        <h3 className="text-lg font-semibold text-yellow-800 flex items-center mb-3">
                            <FaExclamationTriangle className="mr-2" />
                            Skipped Students (Already Exist in Database)
                        </h3>
                        <div className="overflow-x-auto max-h-60">
                            <table className="min-w-full bg-white border">
                                <thead className="bg-gray-100 sticky top-0">
                                    <tr>
                                        <th className="py-2 px-3 border text-left text-sm">Roll Number</th>
                                        <th className="py-2 px-3 border text-left text-sm">Department</th>
                                        <th className="py-2 px-3 border text-left text-sm">Course</th>
                                        <th className="py-2 px-3 border text-left text-sm">Year</th>
                                        <th className="py-2 px-3 border text-left text-sm">Section</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {skippedStudents.map((student, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="py-2 px-3 border text-sm font-mono">{student.rollNo}</td>
                                            <td className="py-2 px-3 border text-sm">{departments.find(d => d.code === selectedDept)?.name}</td>
                                            <td className="py-2 px-3 border text-sm">{selectedCourse}</td>
                                            <td className="py-2 px-3 border text-sm">{year}</td>
                                            <td className="py-2 px-3 border text-sm">{section}</td>
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