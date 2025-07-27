import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaPaperclip, FaTimes } from "react-icons/fa";
import { IoMdSend } from "react-icons/io";
import { RiDraftLine } from "react-icons/ri";
import { useForm, Controller } from "react-hook-form";
import RTE from "./RTE";
import MultiSelectDropdown from "./MultiSelectDropdown";

export default function NoticeForm() {
    const { noticeId } = useParams();
    const isEditing = !!noticeId;

    const { control, handleSubmit, setValue, watch, reset } = useForm({
        defaultValues: {
            title: "",
            subject: "",
            noticeBody: "",
            noticeType: "",
            department: [],
            course: [],
            year: [],
            section: [],
            recipientEmails: [],
            priority: "Normal",
            attachments: [],
            sendOptions: { email: true, web: true },
        }
    });

    // --- STATE FOR DROPDOWN OPTIONS ---
    const [departmentOptions, setDepartmentOptions] = useState([]);
    const [courseOptions, setCourseOptions] = useState([]);
    const [yearOptions, setYearOptions] = useState([]);
    const [sectionOptions, setSectionOptions] = useState([]);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const priorityOptions = ["Normal", "Urgent", "Highly Urgent"];

    // --- WATCH FOR CHANGES IN SELECTED VALUES ---
    const selectedDeptCodes = watch("department");
    const selectedCourseNames = watch("course");
    const selectedYears = watch("year");
    const attachments = watch("attachments");
    const recipientEmails = watch("recipientEmails"); // Watch for UI updates

    // --- STABLE DEPENDENCIES FOR USEEFFECT ---
    const stringifiedDeptCodes = useMemo(() => JSON.stringify(selectedDeptCodes), [selectedDeptCodes]);
    const stringifiedCourseNames = useMemo(() => JSON.stringify(selectedCourseNames), [selectedCourseNames]);
    const stringifiedYears = useMemo(() => JSON.stringify(selectedYears), [selectedYears]);

    // --- CHAINED DATA FETCHING LOGIC ---
    useEffect(() => {
        if (!token) return;
        const fetchDepartments = async () => {
            try {
                const response = await fetch('http://localhost:5001/api/departments', { headers: { "Authorization": `Bearer ${token}` } });
                if (!response.ok) throw new Error(`Failed to fetch departments`);
                const data = await response.json();
                setDepartmentOptions(data);
            } catch (err) { setError(err.message); }
        };
        fetchDepartments();
    }, [token]);

    useEffect(() => {
        const localSelectedDeptCodes = JSON.parse(stringifiedDeptCodes);
        setValue("course", []); setCourseOptions([]);
        if (!localSelectedDeptCodes || localSelectedDeptCodes.length === 0) return;
        const fetchCourses = async () => {
            try {
                const response = await fetch(`http://localhost:5001/api/courses-by-departments`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ departments: localSelectedDeptCodes })
                });
                if (!response.ok) throw new Error('Failed to fetch courses');
                const data = await response.json();
                setCourseOptions(data);
            } catch (err) { setError(err.message); }
        };
        fetchCourses();
    }, [stringifiedDeptCodes, token, setValue]);

    useEffect(() => {
        const localSelectedDeptCodes = JSON.parse(stringifiedDeptCodes);
        const localSelectedCourseNames = JSON.parse(stringifiedCourseNames);
        setValue("year", []); setYearOptions([]);
        const selectedDeptNames = departmentOptions.filter(opt => localSelectedDeptCodes.includes(opt.code)).map(opt => opt.name);
        if (selectedDeptNames.length === 0 || localSelectedCourseNames.length === 0) return;
        const params = new URLSearchParams();
        selectedDeptNames.forEach(name => params.append('department', name));
        localSelectedCourseNames.forEach(name => params.append('course', name));
        const fetchYears = async () => {
            try {
                const response = await fetch(`http://localhost:5001/api/years?${params.toString()}`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!response.ok) throw new Error('Failed to fetch years');
                const data = await response.json();
                setYearOptions(data);
            } catch (err) { setError(err.message); }
        };
        fetchYears();
    }, [stringifiedDeptCodes, stringifiedCourseNames, token, setValue, departmentOptions]);

    useEffect(() => {
        const localSelectedDeptCodes = JSON.parse(stringifiedDeptCodes);
        const localSelectedCourseNames = JSON.parse(stringifiedCourseNames);
        const localSelectedYears = JSON.parse(stringifiedYears);
        setValue("section", []); setSectionOptions([]);
        const selectedDeptNames = departmentOptions.filter(opt => localSelectedDeptCodes.includes(opt.code)).map(opt => opt.name);
        if (selectedDeptNames.length === 0 || localSelectedCourseNames.length === 0 || localSelectedYears.length === 0) return;
        const params = new URLSearchParams();
        selectedDeptNames.forEach(name => params.append('department', name));
        localSelectedCourseNames.forEach(name => params.append('course', name));
        localSelectedYears.forEach(year => params.append('year', year));
        const fetchSections = async () => {
             try {
                const response = await fetch(`http://localhost:5001/api/sections?${params.toString()}`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!response.ok) throw new Error('Failed to fetch sections');
                const data = await response.json();
                setSectionOptions(data);
            } catch (err) { setError(err.message); }
        };
        fetchSections();
    }, [stringifiedDeptCodes, stringifiedCourseNames, stringifiedYears, token, setValue, departmentOptions]);

    const onSubmit = async (data, publish = true) => {
        // ... (onSubmit logic is correct and remains unchanged) ...
        setIsLoading(true);
        const formData = new FormData();
        const departmentObjects = departmentOptions.filter(d => data.department.includes(d.code));
        const departmentNames = departmentObjects.map(d => d.name);
        formData.append('departments', JSON.stringify(departmentNames));
        formData.append('courses', JSON.stringify(data.course));
        formData.append('years', JSON.stringify(data.year));
        formData.append('sections', JSON.stringify(data.section));
        formData.append('title', data.title);
        formData.append('subject', data.subject);
        formData.append('content', data.noticeBody);
        formData.append('priority', data.priority);
        formData.append('status', publish ? 'published' : 'draft');
        formData.append('send_options', JSON.stringify(data.sendOptions));
        formData.append('recipient_emails', JSON.stringify(data.recipientEmails));
        if (data.attachments && data.attachments.length > 0) {
            data.attachments.forEach(file => formData.append('attachments', file));
        }
        try {
            const response = await fetch("http://localhost:5001/api/notices", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });
            if (!response.ok) throw new Error((await response.json()).error);
            setSuccess(`Notice ${publish ? 'published' : 'saved'} successfully!`);
            setTimeout(() => navigate("/notices"), 1500);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // --- HANDLERS ---
    const handleFileUpload = (e) => setValue("attachments", [...watch("attachments"), ...Array.from(e.target.files)]);
    const removeAttachment = (index) => setValue("attachments", watch("attachments").filter((_, i) => i !== index));
    const handleCancel = () => navigate("/notices");
    
    // RESTORED: Handlers for the email input
    const handleEmailInput = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          const value = e.target.value.trim().replace(/,/g, '');
          if (value && !recipientEmails.includes(value)) {
            setValue("recipientEmails", [...recipientEmails, value]);
            e.target.value = '';
          }
        }
    };
    const removeEmail = (index) => setValue("recipientEmails", recipientEmails.filter((_, i) => i !== index));

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
                    {isEditing ? "Edit Notice" : "Create New Notice"}
                </h2>
                {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
                {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">{success}</div>}
                <form onSubmit={handleSubmit(data => onSubmit(data, true))}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-4">
                           <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
                                <Controller name="title" control={control} render={({ field }) => <input {...field} type="text" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" required />}/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <Controller name="subject" control={control} render={({ field }) => <input {...field} type="text" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />} />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notice Body*</label>
                                <Controller name="noticeBody" control={control} render={({ field }) => <RTE control={control} name="noticeBody" defaultValue={field.value} onChange={field.onChange} />}/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
                                <div className="mt-2 flex items-center justify-center w-full">
                                    <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <FaPaperclip className="w-8 h-8 mb-2 text-gray-500" />
                                            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                        </div>
                                        <input id="file-upload" type="file" className="hidden" multiple onChange={handleFileUpload} />
                                    </label>
                                </div>
                                {attachments && attachments.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        {attachments.map((file, index) => (
                                            <div key={index} className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
                                                <span className="text-sm text-gray-700 truncate">{file.name}</span>
                                                <button type="button" onClick={() => removeAttachment(index)} className="text-red-500 hover:text-red-700">
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Target Audience</h3>
                                <div className="space-y-4 p-4 border rounded-md bg-gray-50">
                                    <Controller name="department" control={control} render={({ field }) => ( <MultiSelectDropdown {...field} placeholder="Select Department(s)" options={departmentOptions.map(d => ({ label: d.name, value: d.code }))} /> )}/>
                                    <Controller name="course" control={control} render={({ field }) => ( <MultiSelectDropdown {...field} placeholder="Select Course(s)" options={courseOptions.map(c => ({ label: c.name, value: c.name }))} disabled={courseOptions.length === 0} /> )}/>
                                    <Controller name="year" control={control} render={({ field }) => ( <MultiSelectDropdown {...field} placeholder="Select Year(s)" options={yearOptions.map(y => ({ label: y, value: y }))} disabled={yearOptions.length === 0} /> )}/>
                                    <Controller name="section" control={control} render={({ field }) => ( <MultiSelectDropdown {...field} placeholder="Select Section(s)" options={sectionOptions.map(s => ({ label: s, value: s }))} disabled={sectionOptions.length === 0} /> )}/>
                                </div>
                            </div>
                            
                            {/* RESTORED: Additional Recipients Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Recipients</label>
                                <div className="p-2 border border-gray-300 rounded-md">
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {recipientEmails.map((email, index) => (
                                            <div key={index} className="flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                                                {email}
                                                <button type="button" onClick={() => removeEmail(index)} className="ml-2 text-blue-800 hover:text-blue-900">
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        onKeyDown={handleEmailInput}
                                        placeholder="Add emails and press Enter..."
                                        className="w-full border-0 p-1 focus:ring-0 text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                <div className="grid grid-cols-3 gap-2">
                                {priorityOptions.map(option => (
                                    <button key={option} type="button" onClick={() => setValue("priority", option)} className={`py-2 px-3 rounded-md text-sm transition-colors ${watch("priority") === option ? 'bg-blue-500 text-white shadow' : 'bg-gray-100 hover:bg-gray-200'}`}>
                                        {option}
                                    </button>
                                ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Send Via</label>
                                <div className="flex items-center space-x-4 mt-2">
                                    <label className="flex items-center cursor-pointer">
                                        <Controller name="sendOptions.web" control={control} render={({ field }) => <input type="checkbox" {...field} checked={field.value} className="h-4 w-4 mr-2 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />} />
                                        <span className="text-sm">Web Platform</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <Controller name="sendOptions.email" control={control} render={({ field }) => <input type="checkbox" {...field} checked={field.value} className="h-4 w-4 mr-2 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />} />
                                        <span className="text-sm">Email</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end space-x-4">
                        <button type="button" onClick={handleCancel} disabled={isLoading} className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                        <button type="button" onClick={handleSubmit(data => onSubmit(data, false))} disabled={isLoading} className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50"><RiDraftLine className="mr-2" />Save as Draft</button>
                        <button type="submit" disabled={isLoading} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"><IoMdSend className="mr-2" />{isLoading ? "Publishing..." : "Publish Notice"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
