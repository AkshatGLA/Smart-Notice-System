//
// File: UploadData.jsx
//

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FaUserGraduate, FaChalkboardTeacher, FaFileUpload, FaPaperPlane, FaExclamationTriangle, FaPlus, FaSyncAlt, FaTrash } from 'react-icons/fa';

// This is the component for uploading student data
function StudentUploader() {
    const [entryMode, setEntryMode] = useState('file');
    const { register, handleSubmit: handleManualSubmit, reset: resetManualForm, getValues } = useForm();
    
    const [departments, setDepartments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');
    const [year, setYear] = useState('');
    const [section, setSection] = useState('');
    
    const [file, setFile] = useState(null);
    // --- STATE CHANGES for student conflicts ---
    const [conflictingStudents, setConflictingStudents] = useState([]);
    const [selectedStudentConflicts, setSelectedStudentConflicts] = useState(new Set());
    const [conflictingStudent, setConflictingStudent] = useState(null); // For manual entry

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState({ deps: false, courses: false });
    const [message, setMessage] = useState({ text: '', type: '' });

    const years = ['1st', '2nd', '3rd', '4th', '5th'];
    const token = localStorage.getItem('token');

    // useEffect hooks for fetching departments and courses remain the same...
    useEffect(() => {
        if (!token) return;
        const fetchDepartments = async () => {
            setIsLoading(prev => ({ ...prev, deps: true }));
            try {
                const response = await fetch('http://localhost:5001/api/departments', { headers: { 'Authorization': `Bearer ${token}` }});
                if (!response.ok) throw new Error('Failed to fetch departments');
                setDepartments(await response.json());
            } catch (error) { setMessage({ text: error.message, type: 'error' }); } 
            finally { setIsLoading(prev => ({ ...prev, deps: false })); }
        };
        fetchDepartments();
    }, [token]);

    useEffect(() => {
        const deptCodeForFile = selectedDept;
        const deptCodeForManual = getValues("department");
        const activeDeptCode = entryMode === 'file' ? deptCodeForFile : deptCodeForManual;

        if (!activeDeptCode) {
            setCourses([]);
            return;
        }
        const fetchCourses = async () => {
            setIsLoading(prev => ({ ...prev, courses: true }));
            try {
                const response = await fetch(`http://localhost:5001/api/departments/${activeDeptCode}/courses`, { headers: { 'Authorization': `Bearer ${token}` }});
                if (!response.ok) throw new Error('Failed to fetch courses');
                setCourses(await response.json());
            } catch (error) { setMessage({ text: error.message, type: 'error' }); } 
            finally { setIsLoading(prev => ({ ...prev, courses: false })); }
        };
        fetchCourses();
    }, [selectedDept, getValues, token, entryMode]);
    
    // handleUpdate and onManualSubmit remain the same...
    const handleUpdate = async () => {
        setIsSubmitting(true);
        setMessage({ text: 'Updating student...', type: 'info' });
        const manualData = getValues();
        const departmentName = departments.find(d => d.code === manualData.department)?.name;
        const payload = { ...manualData, department: departmentName };

        try {
            const response = await fetch(`http://localhost:5001/api/students/update-manual/${conflictingStudent.univ_roll_no}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok) throw result;
            setMessage({ text: result.message, type: 'success' });
            resetManualForm({ department: '', course: '', year: '', section: '', name: '', univ_roll_no: '', official_email: '', father_name: '', father_mobile: '' });
            setConflictingStudent(null);
        } catch (errorData) {
            setMessage({ text: errorData.error || 'Update failed.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const onManualSubmit = async (data) => {
        setIsSubmitting(true);
        setConflictingStudent(null);
        setMessage({ text: 'Adding student...', type: 'info' });
        try {
            const departmentName = departments.find(d => d.code === data.department)?.name;
            const payload = { ...data, department: departmentName };

            const response = await fetch('http://localhost:5001/api/students/add-manual', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok) {
                if (response.status === 409) {
                    setConflictingStudent(result.existing_data);
                }
                throw result;
            }
            setMessage({ text: result.message, type: 'success' });
            resetManualForm({ department: '', course: '', year: '', section: '', name: '', univ_roll_no: '', official_email: '', father_name: '', father_mobile: '' });
        } catch (errorData) {
            setMessage({ text: errorData.error || 'An unknown error occurred.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // --- UPDATED onFileSubmit for students ---
    const onFileSubmit = async (e) => {
        e.preventDefault();
        setConflictingStudents([]);
        setSelectedStudentConflicts(new Set());
        if (!selectedDept || !selectedCourse || !year || !section || !file) {
            setMessage({ text: 'All fields and the file are required.', type: 'error' });
            return;
        }
        setIsSubmitting(true);
        setMessage({ text: 'Uploading student data...', type: 'info' });
        const formData = new FormData();
        const departmentName = departments.find(d => d.code === selectedDept)?.name;
        formData.append('department', departmentName);
        formData.append('course', selectedCourse);
        formData.append('year', year);
        formData.append('section', section);
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:5001/api/students/upload-details', { method: 'POST', body: formData, headers: { 'Authorization': `Bearer ${token}` }});
            const data = await response.json();
            if (!response.ok && response.status !== 201) throw data;
            
            let fullMessage = data.message || "Upload processed.";
            if (data.conflicts && data.conflicts.length > 0) {
                fullMessage += ` Found ${data.conflicts.length} conflicting records that need review.`;
                setConflictingStudents(data.conflicts);
            }
             if (data.errors && data.errors.length > 0) {
                fullMessage += ` Encountered ${data.errors.length} errors.`;
            }

            setMessage({ text: fullMessage, type: data.conflicts?.length > 0 ? 'info' : 'success' });

            setFile(null);
            document.getElementById('student-file-input').value = '';
        } catch (errorData) {
            setMessage({ text: errorData.error || errorData.message || 'An unknown server error occurred.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setMessage({ text: '', type: '' });
            setConflictingStudents([]);
        }
    };

    // --- NEW HANDLERS for student conflict resolution ---
    const handleStudentSelectRow = (rollNo) => {
        const newSelection = new Set(selectedStudentConflicts);
        if (newSelection.has(rollNo)) {
            newSelection.delete(rollNo);
        } else {
            newSelection.add(rollNo);
        }
        setSelectedStudentConflicts(newSelection);
    };

    const handleStudentSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedStudentConflicts(new Set(conflictingStudents.map(s => s.univ_roll_no)));
        } else {
            setSelectedStudentConflicts(new Set());
        }
    };

    const handleStudentBatchUpdate = async () => {
        const studentsToUpdate = conflictingStudents.filter(s => selectedStudentConflicts.has(s.univ_roll_no));
        if (studentsToUpdate.length === 0) {
            setMessage({ text: 'Please select students to update.', type: 'error' });
            return;
        }
        
        setIsSubmitting(true);
        setMessage({ text: `Updating ${studentsToUpdate.length} selected students...`, type: 'info' });

        try {
            // NOTE: We re-use the manual update endpoint in a loop.
            // For a large number of updates, a dedicated batch endpoint would be better.
            const updatePromises = studentsToUpdate.map(student => 
                fetch(`http://localhost:5001/api/students/update-manual/${student.univ_roll_no}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(student)
                })
            );
            
            const results = await Promise.all(updatePromises);
            const successfulUpdates = results.filter(res => res.ok).length;

            setMessage({ text: `Successfully updated ${successfulUpdates} student(s).`, type: 'success' });
            setConflictingStudents(prev => prev.filter(s => !selectedStudentConflicts.has(s.univ_roll_no)));
            setSelectedStudentConflicts(new Set());

        } catch (error) {
            setMessage({ text: 'An error occurred during batch update.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // --- JSX Return with updated conflict table ---
    return (
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center text-gray-800"><FaUserGraduate className="mr-3 text-blue-600" /> Student Data</h1>
                <div className="flex border border-gray-300 rounded-md"><button onClick={() => setEntryMode('file')} className={`px-3 py-1 text-sm rounded-l-md ${entryMode === 'file' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}>Upload File</button><button onClick={() => setEntryMode('manual')} className={`px-3 py-1 text-sm rounded-r-md ${entryMode === 'manual' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}>Add Manually</button></div>
            </div>

            {entryMode === 'file' ? (
                <form onSubmit={onFileSubmit} className="space-y-6">
                    {/* Form fields remain the same */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Department</label><select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="">Select Department</option>{departments.map(dep => <option key={dep.code} value={dep.code}>{dep.name}</option>)}</select></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Course</label><select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} disabled={!selectedDept} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="">Select Course</option>{courses.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}</select></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Year</label><select value={year} onChange={(e) => setYear(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="">Select Year</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Section</label><input type="text" value={section} onChange={(e) => setSection(e.target.value.toUpperCase())} className="w-full px-3 py-2 border border-gray-300 rounded-md"/></div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Upload Student File</label>
                        <label className="cursor-pointer w-full flex items-center justify-center px-4 py-3 bg-gray-50 border-2 border-dashed rounded-md"><FaFileUpload className="mr-3" /><span>{file ? file.name : 'Click to select file'}</span><input id="student-file-input" type="file" className="hidden" onChange={handleFileChange} /></label>
                    </div>
                    <button type="submit" className="w-full flex justify-center items-center py-3 bg-blue-600 text-white rounded-md" disabled={isSubmitting}><FaPaperPlane className="mr-2" />{isSubmitting ? 'Uploading...' : 'Submit Student Data'}</button>
                </form>
            ) : (
                <form onSubmit={handleManualSubmit(onManualSubmit)} className="space-y-4">
                    {/* Manual entry form remains the same */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium">Department*</label><select {...register("department")} className="w-full mt-1 px-3 py-2 border rounded-md"><option value="">Select...</option>{departments.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}</select></div>
                        <div><label className="block text-sm font-medium">Course*</label><select {...register("course")} className="w-full mt-1 px-3 py-2 border rounded-md"><option value="">Select...</option>{courses.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}</select></div>
                        <div><label className="block text-sm font-medium">Year*</label><select {...register("year")} className="w-full mt-1 px-3 py-2 border rounded-md"><option value="">Select...</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
                        <div><label className="block text-sm font-medium">Section*</label><input type="text" {...register("section")} className="w-full mt-1 px-3 py-2 border rounded-md"/></div>
                    </div>
                    <hr className="my-4"/>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium">Full Name*</label><input type="text" {...register("name")} className="w-full mt-1 px-3 py-2 border rounded-md"/></div>
                        <div><label className="block text-sm font-medium">University Roll No.*</label><input type="text" {...register("univ_roll_no")} className="w-full mt-1 px-3 py-2 border rounded-md"/></div>
                        <div><label className="block text-sm font-medium">Official Email*</label><input type="email" {...register("official_email")} className="w-full mt-1 px-3 py-2 border rounded-md"/></div>
                        {/* ADD THIS NEW INPUT FIELD */}
                        <div><label className="block text-sm font-medium">Mobile Number</label><input type="text" {...register("student_mobile")} className="w-full mt-1 px-3 py-2 border rounded-md"/></div>
                        <div className="md:col-span-2"><label className="block text-sm font-medium">Father's Name</label><input type="text" {...register("father_name")} className="w-full mt-1 px-3 py-2 border rounded-md"/></div>                        <div><label className="block text-sm font-medium">Father's Name</label><input type="text" {...register("father_name")} className="w-full mt-1 px-3 py-2 border rounded-md"/></div>
                        <div><label className="block text-sm font-medium">Father's Mobile</label><input type="text" {...register("father_mobile")} className="w-full mt-1 px-3 py-2 border rounded-md"/></div>
                    </div>
                    {conflictingStudent ? (
                        <button type="button" onClick={handleUpdate} className="w-full flex justify-center items-center py-2 bg-yellow-500 text-white rounded-md" disabled={isSubmitting}><FaSyncAlt className="mr-2" />{isSubmitting ? 'Updating...' : 'Confirm and Update Student'}</button>
                    ) : (
                        <button type="submit" className="w-full flex justify-center items-center py-2 bg-blue-600 text-white rounded-md" disabled={isSubmitting}><FaPlus className="mr-2" />{isSubmitting ? 'Adding...' : 'Add Student'}</button>
                    )}
                </form>
            )}
            {message.text && <div className={`mt-4 p-3 rounded-md text-sm ${ message.type === 'error' ? 'bg-red-100 text-red-800' : message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800' }`}>{message.text}</div>}
            
            {/* --- NEW CONFLICT TABLE FOR STUDENTS --- */}
            {conflictingStudents.length > 0 && (
                <div className="mt-6 p-4 border border-yellow-300 bg-yellow-50 rounded-lg">
                    <h3 className="font-semibold text-yellow-800 flex items-center mb-3"><FaExclamationTriangle className="mr-2" />Review Conflicting Students (Already Exist)</h3>
                    <p className="text-sm text-yellow-700 mb-4">The following students from your file already exist. Select the ones you wish to update with the new data from the file.</p>
                    <div className="overflow-x-auto max-h-96">
                        <table className="min-w-full bg-white border">
                            <thead className="bg-gray-100 sticky top-0">
                                <tr>
                                    <th className="p-2 border text-left"><input type="checkbox" onChange={handleStudentSelectAll} checked={conflictingStudents.length > 0 && selectedStudentConflicts.size === conflictingStudents.length} /></th>
                                    <th className="py-2 px-3 border text-left text-sm">Roll Number</th>
                                    <th className="py-2 px-3 border text-left text-sm">Name</th>
                                    <th className="py-2 px-3 border text-left text-sm">Email</th>
                                    <th className="py-2 px-3 border text-left text-sm">Father's Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                {conflictingStudents.map((student) => (
                                    <tr key={student.univ_roll_no} className={`hover:bg-gray-50 ${selectedStudentConflicts.has(student.univ_roll_no) ? 'bg-blue-50' : ''}`}>
                                        <td className="p-2 border text-center"><input type="checkbox" checked={selectedStudentConflicts.has(student.univ_roll_no)} onChange={() => handleStudentSelectRow(student.univ_roll_no)} /></td>
                                        <td className="py-2 px-3 border text-sm font-mono">{student.univ_roll_no}</td>
                                        <td className="py-2 px-3 border text-sm">{student.name}</td>
                                        <td className="py-2 px-3 border text-sm">{student.official_email}</td>
                                        <td className="py-2 px-3 border text-sm">{student.father_name}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4 flex gap-4">
                         <button onClick={handleStudentBatchUpdate} disabled={isSubmitting || selectedStudentConflicts.size === 0} className="flex items-center justify-center px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed">
                            <FaSyncAlt className="mr-2" /> {isSubmitting ? 'Updating...' : `Update Selected (${selectedStudentConflicts.size})`}
                        </button>
                        <button onClick={() => { setConflictingStudents([]); setSelectedStudentConflicts(new Set()); }} disabled={isSubmitting} className="flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-400">
                            <FaTrash className="mr-2" /> Discard Conflicts
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// TeacherUploader and the main export remain unchanged.
// Paste the existing TeacherUploader function here.
function TeacherUploader() {
    const [entryMode, setEntryMode] = useState('file');
    const { register, handleSubmit: handleManualSubmit, reset: resetManualForm, getValues } = useForm();

    const [file, setFile] = useState(null);
    const [conflictingTeachers, setConflictingTeachers] = useState([]);
    const [selectedConflicts, setSelectedConflicts] = useState(new Set());
    const [conflictingTeacher, setConflictingTeacher] = useState(null);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const token = localStorage.getItem('token');
    
    const [departments, setDepartments] = useState([]);
    const [selectedDept, setSelectedDept] = useState('');
    const [isLoadingDeps, setIsLoadingDeps] = useState(false);
    
    const designations = ["Professor", "Associate Professor", "Assistant Professor", "HOD", "Dean", "Director", "Lecturer"];

    useEffect(() => {
        if (!token) return;
        const fetchDepartments = async () => {
            setIsLoadingDeps(true);
            try {
                const response = await fetch('http://localhost:5001/api/departments', { headers: { 'Authorization': `Bearer ${token}` }});
                if (!response.ok) throw new Error('Failed to fetch departments');
                setDepartments(await response.json());
            } catch (error) { setMessage({ text: error.message, type: 'error' }); } 
            finally { setIsLoadingDeps(false); }
        };
        fetchDepartments();
    }, [token]);
    
    const handleUpdate = async () => {
        setIsSubmitting(true);
        setMessage({ text: 'Updating teacher...', type: 'info' });
        const manualData = getValues();
        const departmentName = departments.find(d => d.code === manualData.department)?.name;
        const payload = { ...manualData, department: departmentName };
        try {
            const response = await fetch(`http://localhost:5001/api/teachers/update-manual/${conflictingTeacher.employee_id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok) throw result;
            setMessage({ text: result.message, type: 'success' });
            resetManualForm({ department: '', name: '', employee_id: '', official_email: '', post: '' });
            setConflictingTeacher(null);
        } catch (errorData) {
            setMessage({ text: errorData.error || 'Update failed.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const onManualSubmit = async (data) => {
        setIsSubmitting(true);
        setConflictingTeacher(null);
        setMessage({ text: 'Adding teacher...', type: 'info' });
        try {
            const departmentName = departments.find(d => d.code === data.department)?.name;
            const payload = { ...data, department: departmentName };
            const response = await fetch('http://localhost:5001/api/teachers/add-manual', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok) {
                if (response.status === 409) {
                    setConflictingTeacher(result.existing_data);
                }
                throw result;
            }
            setMessage({ text: result.message, type: 'success' });
            resetManualForm({ department: '', name: '', employee_id: '', official_email: '', post: '' });
        } catch (errorData) {
            setMessage({ text: errorData.error || 'An unknown error occurred.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const onFileSubmit = async (e) => {
        e.preventDefault();
        setConflictingTeachers([]);
        setSelectedConflicts(new Set());

        const departmentName = departments.find(d => d.code === selectedDept)?.name;
        if (!departmentName || !file) {
            setMessage({ text: 'Department and file are required.', type: 'error' });
            return;
        }
        setIsSubmitting(true);
        setMessage({ text: 'Uploading teacher data...', type: 'info' });
        const formData = new FormData();
        formData.append('department', departmentName);
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:5001/api/teachers/upload-details', { method: 'POST', body: formData, headers: { 'Authorization': `Bearer ${token}` }});
            const data = await response.json();
            if (!response.ok) throw data;

            let fullMessage = data.message || "Upload processed.";
            if (data.conflicts && data.conflicts.length > 0) {
                fullMessage += ` Found ${data.conflicts.length} conflicting records that need review.`;
                setConflictingTeachers(data.conflicts);
            }
             if (data.errors && data.errors.length > 0) {
                fullMessage += ` Encountered ${data.errors.length} errors.`;
            }

            setMessage({ text: fullMessage, type: data.conflicts?.length > 0 ? 'info' : 'success' });
            
            setFile(null);
            document.getElementById('teacher-file-input').value = ''; 
        } catch (errorData) {
            setMessage({ text: errorData.error || errorData.message || 'An unknown error occurred.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleSelectRow = (employeeId) => {
        const newSelection = new Set(selectedConflicts);
        if (newSelection.has(employeeId)) {
            newSelection.delete(employeeId);
        } else {
            newSelection.add(employeeId);
        }
        setSelectedConflicts(newSelection);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedConflicts(new Set(conflictingTeachers.map(t => t.employee_id)));
        } else {
            setSelectedConflicts(new Set());
        }
    };

    const handleBatchUpdate = async () => {
        const teachersToUpdate = conflictingTeachers.filter(t => selectedConflicts.has(t.employee_id));
        if (teachersToUpdate.length === 0) {
            setMessage({ text: 'Please select teachers to update.', type: 'error' });
            return;
        }
        
        setIsSubmitting(true);
        setMessage({ text: `Updating ${teachersToUpdate.length} selected teachers...`, type: 'info' });

        try {
            const response = await fetch('http://localhost:5001/api/teachers/batch-update', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(teachersToUpdate)
            });
            const result = await response.json();
            if (!response.ok) throw result;

            setMessage({ text: result.message, type: 'success' });
            setConflictingTeachers(prev => prev.filter(t => !selectedConflicts.has(t.employee_id)));
            setSelectedConflicts(new Set());

        } catch (errorData) {
            setMessage({ text: errorData.error || 'Update failed.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setMessage({ text: '', type: '' });
            setConflictingTeachers([]);
        }
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center text-gray-800"><FaChalkboardTeacher className="mr-3 text-blue-600" /> Teacher Data</h1>
                <div className="flex border border-gray-300 rounded-md"><button onClick={() => setEntryMode('file')} className={`px-3 py-1 text-sm rounded-l-md ${entryMode === 'file' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}>Upload File</button><button onClick={() => setEntryMode('manual')} className={`px-3 py-1 text-sm rounded-r-md ${entryMode === 'manual' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}>Add Manually</button></div>
            </div>

            {entryMode === 'file' ? (
                 <form onSubmit={onFileSubmit} className="space-y-6">
                    <div><label htmlFor="teacher-department" className="block text-sm font-medium">Department</label><select id="teacher-department" value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} disabled={isLoadingDeps} className="w-full px-3 py-2 border border-gray-300 rounded-md"><option value="">{isLoadingDeps ? 'Loading...' : 'Select Department'}</option>{departments.map(dep => <option key={dep.code} value={dep.code}>{dep.name}</option>)}</select></div>
                    <div><label className="block text-sm font-medium">Upload Teacher File</label><label className="cursor-pointer w-full flex items-center justify-center px-4 py-3 bg-gray-50 border-2 border-dashed rounded-md"><FaFileUpload className="mr-3" /><span>{file ? file.name : 'Click to select file'}</span><input type="file" id="teacher-file-input" className="hidden" onChange={handleFileChange} /></label></div>
                    <button type="submit" className="w-full flex justify-center items-center py-3 bg-blue-600 text-white rounded-md" disabled={isSubmitting}><FaPaperPlane className="mr-2" />{isSubmitting ? 'Uploading...' : 'Submit Teacher Data'}</button>
                </form>
            ) : (
                <form onSubmit={handleManualSubmit(onManualSubmit)} className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium">Department*</label><select {...register("department")} className="w-full mt-1 px-3 py-2 border rounded-md"><option value="">Select...</option>{departments.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}</select></div>
                        <div><label className="block text-sm font-medium">Designation*</label><select {...register("post")} className="w-full mt-1 px-3 py-2 border rounded-md"><option value="">Select...</option>{designations.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                    </div>
                    <hr className="my-4"/>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium">Full Name*</label><input type="text" {...register("name")} className="w-full mt-1 px-3 py-2 border rounded-md"/></div>
                        <div><label className="block text-sm font-medium">Employee ID*</label><input type="text" {...register("employee_id")} className="w-full mt-1 px-3 py-2 border rounded-md"/></div>
                        <div><label className="block text-sm font-medium">Official Email*</label><input type="email" {...register("official_email")} className="w-full mt-1 px-3 py-2 border rounded-md"/></div>
                        <div><label className="block text-sm font-medium">Mobile</label><input type="text" {...register("mobile")} className="w-full mt-1 px-3 py-2 border rounded-md"/></div>
                        <div className="md:col-span-2"><label className="block text-sm font-medium">Specialization</label><input type="text" {...register("specialization")} className="w-full mt-1 px-3 py-2 border rounded-md"/></div>
                    </div>
                    {conflictingTeacher ? (
                        <button type="button" onClick={handleUpdate} className="w-full flex justify-center items-center py-2 bg-yellow-500 text-white rounded-md" disabled={isSubmitting}><FaSyncAlt className="mr-2" />{isSubmitting ? 'Updating...' : 'Confirm and Update Teacher'}</button>
                    ) : (
                        <button type="submit" className="w-full flex justify-center items-center py-2 bg-blue-600 text-white rounded-md" disabled={isSubmitting}><FaPlus className="mr-2" />{isSubmitting ? 'Adding...' : 'Add Teacher'}</button>
                    )}
                </form>
            )}

            {message.text && <div className={`mt-4 p-3 rounded-md text-sm ${ message.type === 'error' ? 'bg-red-100 text-red-800' : message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800' }`}>{message.text}</div>}
            
            {conflictingTeachers.length > 0 && (
                <div className="mt-6 p-4 border border-yellow-300 bg-yellow-50 rounded-lg">
                    <h3 className="font-semibold text-yellow-800 flex items-center mb-3"><FaExclamationTriangle className="mr-2" />Review Conflicting Records (Already Exist)</h3>
                    <p className="text-sm text-yellow-700 mb-4">The following records from your file already exist in the database. Select the ones you wish to update with the new data from the file.</p>
                    <div className="overflow-x-auto max-h-96">
                        <table className="min-w-full bg-white border">
                            <thead className="bg-gray-100 sticky top-0">
                                <tr>
                                    <th className="p-2 border text-left"><input type="checkbox" onChange={handleSelectAll} checked={conflictingTeachers.length > 0 && selectedConflicts.size === conflictingTeachers.length} /></th>
                                    <th className="py-2 px-3 border text-left text-sm">Employee ID</th>
                                    <th className="py-2 px-3 border text-left text-sm">Name</th>
                                    <th className="py-2 px-3 border text-left text-sm">Designation</th>
                                    <th className="py-2 px-3 border text-left text-sm">Email</th>
                                    <th className="py-2 px-3 border text-left text-sm">Mobile</th>
                                </tr>
                            </thead>
                            <tbody>
                                {conflictingTeachers.map((teacher) => (
                                    <tr key={teacher.employee_id} className={`hover:bg-gray-50 ${selectedConflicts.has(teacher.employee_id) ? 'bg-blue-50' : ''}`}>
                                        <td className="p-2 border text-center"><input type="checkbox" checked={selectedConflicts.has(teacher.employee_id)} onChange={() => handleSelectRow(teacher.employee_id)} /></td>
                                        <td className="py-2 px-3 border text-sm font-mono">{teacher.employee_id}</td>
                                        <td className="py-2 px-3 border text-sm">{teacher.name}</td>
                                        <td className="py-2 px-3 border text-sm">{teacher.post}</td>
                                        <td className="py-2 px-3 border text-sm">{teacher.official_email}</td>
                                        <td className="py-2 px-3 border text-sm">{teacher.mobile}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4 flex gap-4">
                         <button onClick={handleBatchUpdate} disabled={isSubmitting || selectedConflicts.size === 0} className="flex items-center justify-center px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed">
                            <FaSyncAlt className="mr-2" /> {isSubmitting ? 'Updating...' : `Update Selected (${selectedConflicts.size})`}
                        </button>
                        <button onClick={() => { setConflictingTeachers([]); setSelectedConflicts(new Set()); }} disabled={isSubmitting} className="flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-400">
                            <FaTrash className="mr-2" /> Discard Conflicts
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}


export default function UploadData() {
    return (
        <div className="container mx-auto p-4 max-w-4xl space-y-8">
            <StudentUploader />
            <TeacherUploader />
        </div>
    );
}