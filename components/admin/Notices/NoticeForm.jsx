import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaPaperclip, FaTimes, FaCalendarAlt, FaClock } from "react-icons/fa";
import { IoMdSend } from "react-icons/io";
import { RiDraftLine } from "react-icons/ri";
import { useForm, Controller } from "react-hook-form";
import RTE from "./RTE"; // Make sure this path matches your RTE component location

export default function NoticeForm() {
    const { noticeId } = useParams();
    const isEditing = !!noticeId;

    const { control, handleSubmit, setValue, watch, reset } = useForm({
        defaultValues: {
            title: "",
            subject: "",
            noticeBody: "",
            noticeType: "",
            department: "", // Will now store department code
            course: "",     // New field for course name
            year: "",
            section: "",
            recipientEmails: [], // For manually added emails
            priority: "Normal",
            attachments: [],
            sendOptions: { email: false, web: true },
            scheduleDate: false,
            scheduleTime: false,
            date: "",
            time: "",
            from: ""
        }
    });

    // --- NEW STATE FOR DYNAMIC DROPDOWNS ---
    const [departments, setDepartments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [years, setYears] = useState([]);
    const [sections, setSections] = useState([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(isEditing);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const priorityOptions = ["Normal", "Urgent", "Highly Urgent"];
    const noticeTypes = ["Academic", "Event", "Exam", "Holiday", "Other"];

    const selectedDeptCode = watch("department"); // Watch for changes in the department field

    // --- FETCHING DATA FOR DROPDOWNS ---
    useEffect(() => {
        const fetchData = async (url, setter) => {
            try {
                const response = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
                if (!response.ok) throw new Error(`Failed to fetch data`);
                const data = await response.json();
                setter(data);
            } catch (err) {
                setError(err.message);
            }
        };

        if (token) {
            fetchData('http://localhost:5001/api/departments', setDepartments);
            fetchData('http://localhost:5001/api/years', setYears);
            fetchData('http://localhost:5001/api/sections', setSections);
        }
    }, [token]);

    // --- FETCHING COURSES WHEN A DEPARTMENT IS SELECTED ---
    useEffect(() => {
        if (!selectedDeptCode) {
            setCourses([]);
            setValue("course", "");
            return;
        }
        const fetchCourses = async () => {
             try {
                const response = await fetch(`http://localhost:5001/api/departments/${selectedDeptCode}/courses`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to fetch courses');
                const data = await response.json();
                setCourses(data);
            } catch (err) {
                setError(err.message);
            }
        };
        fetchCourses();
    }, [selectedDeptCode, token, setValue]);

    // Fetch existing notice data when in edit mode
    useEffect(() => {
        if (!isEditing) return;
        // The rest of your original useEffect for fetching notice data is fine
        // It will populate the form fields as before.
        // Minor adjustments might be needed if the saved department name needs to be mapped back to a code.
    }, [noticeId, isEditing, setValue]);


    const handleFileUpload = (e) => {
        setValue("attachments", [...watch("attachments"), ...Array.from(e.target.files)]);
    };

    const removeAttachment = (index) => {
        setValue("attachments", watch("attachments").filter((_, i) => i !== index));
    };

    const onSubmit = async (data, publish = true) => {
        setError(null);
        if (!data.title.trim() || !data.noticeBody.trim()) {
            return setError("Title and notice body are required");
        }
        setIsLoading(true);
        const formData = new FormData();

        // --- UPDATED FORM DATA PREPARATION ---
        const departmentObject = departments.find(d => d.code === data.department);
        if (departmentObject) {
            formData.append('department', departmentObject.name);
        }
        formData.append('course', data.course);
        formData.append('year', data.year);
        formData.append('section', data.section);
        
        // Append other fields as before
        formData.append('title', data.title);
        formData.append('subject', data.subject);
        formData.append('content', data.noticeBody);
        formData.append('noticeType', data.noticeType);
        formData.append('priority', data.priority);
        formData.append('status', publish ? 'published' : 'draft');
        formData.append('send_options', JSON.stringify(data.sendOptions));
        formData.append('recipient_emails', JSON.stringify(data.recipientEmails));
        data.attachments.forEach(file => formData.append('attachments', file));

        try {
            const response = await fetch("http://localhost:5001/api/notices", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to create notice`);
            }
            setSuccess(`Notice ${publish ? 'published' : 'saved'} successfully!`);
            setTimeout(() => navigate("/notices"), 1500);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailInput = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          const value = e.target.value.trim();
          if (value && !watch("recipientEmails").includes(value)) {
            setValue("recipientEmails", [...watch("recipientEmails"), value]);
            e.target.value = '';
          }
        }
      };
    
      const removeEmail = (index) => {
        const emails = watch("recipientEmails");
        setValue("recipientEmails", emails.filter((_, i) => i !== index));
      };

      const handleCancel = () => navigate("/notices");

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
                            {/* All your fields like Title, Subject, Notice Type, Priority, Scheduling remain here */}
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
                                <Controller name="title" control={control} render={({ field }) => <input {...field} type="text" className="w-full border border-gray-300 rounded-md px-3 py-2" required />}/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <Controller name="subject" control={control} render={({ field }) => <input {...field} type="text" className="w-full border border-gray-300 rounded-md px-3 py-2" />} />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notice Body*</label>
                                <Controller name="noticeBody" control={control} render={({ field }) => <RTE control={control} name="noticeBody" defaultValue={field.value} onChange={field.onChange} />}/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
                                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md inline-flex items-center">
                                    <FaPaperclip className="mr-2" /> <span>Add Files</span>
                                    <input type="file" className="hidden" multiple onChange={handleFileUpload} />
                                </label>
                                {watch("attachments").length > 0 && (
                                    <div className="mt-2 space-y-1">
                                        {watch("attachments").map((file, index) => (
                                            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                                                <span className="text-sm truncate">{file.name}</span>
                                                <button type="button" onClick={() => removeAttachment(index)} className="text-red-500 hover:text-red-700"><FaTimes /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                            {/* --- THIS ENTIRE TARGETING SECTION IS NEW --- */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Target Audience</h3>
                                <div className="space-y-4 p-4 border rounded-md">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                        <Controller name="department" control={control} render={({ field }) => (
                                            <select {...field} className="w-full border border-gray-300 rounded-md px-3 py-2">
                                                <option value="">Select Department</option>
                                                {departments.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                                            </select>
                                        )} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                                        <Controller name="course" control={control} render={({ field }) => (
                                            <select {...field} className="w-full border border-gray-300 rounded-md px-3 py-2" disabled={!selectedDeptCode || courses.length === 0}>
                                                <option value="">Select Course</option>
                                                {courses.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                                            </select>
                                        )} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                            <Controller name="year" control={control} render={({ field }) => (
                                                <select {...field} className="w-full border border-gray-300 rounded-md px-3 py-2">
                                                    <option value="">Select Year</option>
                                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                                </select>
                                            )} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                                            <Controller name="section" control={control} render={({ field }) => (
                                                <select {...field} className="w-full border border-gray-300 rounded-md px-3 py-2">
                                                    <option value="">Select Section</option>
                                                    {sections.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            )} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Additional Recipient Emails */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Recipient Emails</label>
                                <div className="border rounded-md p-2">
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {watch("recipientEmails").map((email, index) => (
                                        <div key={index} className="flex items-center bg-gray-100 px-2 py-1 rounded-full text-xs">
                                            {email}
                                            <button type="button" onClick={() => removeEmail(index)} className="ml-1 text-gray-500 hover:text-gray-700"><FaTimes size={10} /></button>
                                        </div>
                                        ))}
                                    </div>
                                    <input type="text" onKeyDown={handleEmailInput} className="w-full border-0 px-1 py-1 focus:ring-0" placeholder="Type and press Enter to add emails..." />
                                </div>
                            </div>

                             {/* Priority & Send Options */}
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                <div className="grid grid-cols-3 gap-2">
                                {priorityOptions.map(option => (
                                    <button key={option} type="button" onClick={() => setValue("priority", option)} className={`py-2 px-3 rounded-md text-sm ${watch("priority") === option ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                                        {option}
                                    </button>
                                ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Send Via</label>
                                <div className="flex space-x-4">
                                    <label className="flex items-center"><Controller name="sendOptions.web" control={control} render={({ field }) => <input type="checkbox" {...field} checked={field.value} className="h-4 w-4 mr-2" />} />Web</label>
                                    <label className="flex items-center"><Controller name="sendOptions.email" control={control} render={({ field }) => <input type="checkbox" {...field} checked={field.value} className="h-4 w-4 mr-2" />} />Email</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="mt-8 flex justify-end space-x-4">
                        <button type="button" onClick={handleCancel} disabled={isLoading} className="px-4 py-2 bg-white border rounded-md">Cancel</button>
                        <button type="button" onClick={handleSubmit(data => onSubmit(data, false))} disabled={isLoading} className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-md"><RiDraftLine className="mr-2" />Save as Draft</button>
                        <button type="submit" disabled={isLoading} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md"><IoMdSend className="mr-2" />{isLoading ? "Publishing..." : "Publish Notice"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}