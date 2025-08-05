import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaPaperclip,
  FaTimes,
  FaCalendarAlt,
  FaClock,
  FaUser,
  FaBuilding,
  FaGraduationCap,
  FaUsers,
  FaEnvelope,
  FaExclamationTriangle,
  FaBell,
  FaTag,
  FaEye,
  FaSave,
  FaSpinner,
  FaCheck,
  FaArrowLeft,
  FaUpload,
  FaFileAlt,
  FaBullhorn,
  FaTrophy,
  FaBriefcase,
  FaMicrophone,
  FaBroadcastTower,
  FaUserGraduate,
  FaSearch,
  FaSignature,
} from "react-icons/fa";
import { IoMdSend, IoMdTime } from "react-icons/io";
import { RiDraftLine } from "react-icons/ri";
import { useForm, Controller } from "react-hook-form";
import RTE from "./RTE";
import SignaturePad from "react-signature-canvas";
import axios from "axios";
import ApprovalWorkflow from "../digitalSign/ApprovalWorkflow.jsx";
import ApprovalStatusBadge from "../digitalSign/ApprovalStatusBadge.jsx";

const roleConfigurations = {
  academic: {
    gradient: "from-blue-600 to-indigo-600",
    color: "blue",
    categories: [
      { value: "lecture", label: "Lecture", icon: FaGraduationCap },
      { value: "assignment", label: "Assignment", icon: FaFileAlt },
      { value: "exam_schedule", label: "Exam Schedule", icon: FaClock },
    ],
  },
  fees: {
    gradient: "from-green-600 to-emerald-600",
    color: "green",
    categories: [
      { value: "payment", label: "Payment", icon: FaTag },
      { value: "deadline", label: "Deadline", icon: FaClock },
      { value: "scholarship", label: "Scholarship", icon: FaTrophy },
    ],
  },
  exam: {
    gradient: "from-purple-600 to-violet-600",
    color: "purple",
    categories: [
      { value: "schedule", label: "Schedule", icon: FaCalendarAlt },
      { value: "guidelines", label: "Guidelines", icon: FaFileAlt },
      { value: "result", label: "Result", icon: FaCheck },
    ],
  },
  placement: {
    gradient: "from-orange-600 to-red-600",
    color: "orange",
    categories: [
      { value: "opportunity", label: "Opportunity", icon: FaBriefcase },
      { value: "workshop", label: "Workshop", icon: FaGraduationCap },
      { value: "interview", label: "Interview", icon: FaUser },
    ],
  },
};

const quickOptions = [
  {
    id: "simple",
    title: "Simple Notice",
    icon: FaFileAlt,
    description: "Create a standard notice with basic formatting",
    preset: {
      noticeType: "general",
      priority: "Normal",
      sendOptions: { email: false, web: true },
    },
  },
  {
    id: "speech",
    title: "Notice via Speech",
    icon: FaMicrophone,
    description: "Record or upload audio to create a notice",
    preset: {
      noticeType: "announcement",
      priority: "Normal",
      sendOptions: { email: false, web: true },
      attachments: [],
    },
  },
  {
    id: "broadcast",
    title: "Broadcast to All",
    icon: FaBroadcastTower,
    description: "Send immediately to all departments",
    preset: {
      department: "",
      course: "",
      year: "",
      section: "",
      noticeType: "broadcast",
      priority: "Urgent",
      sendOptions: { email: true, web: true },
    },
  },
];

const priorityOptions = [
  { value: "Normal", label: "Normal", color: "green", icon: FaCheck },
  { value: "Urgent", label: "Urgent", color: "yellow", icon: FaClock },
  {
    value: "Highly Urgent",
    label: "Critical",
    color: "red",
    icon: FaExclamationTriangle,
  },
];

export default function NoticeForm({ role = "academic" }) {
  const { noticeId } = useParams();
  const isEditing = !!noticeId;
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const config = roleConfigurations[role] || roleConfigurations.academic;
  const [creationMode, setCreationMode] = useState(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [noticeData, setNoticeData] = useState(null);
  const sigCanvas = useRef(null);

  // New state to hold the classified category
  const [classifiedCategory, setClassifiedCategory] = useState(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm({
    defaultValues: {
      title: "",
      subject: "",
      noticeBody: "",
      noticeType: "",
      department: "",
      course: "",
      year: "",
      section: "",
      recipientEmails: [],
      priority: "Normal",
      attachments: [],
      sendOptions: { email: false, web: true },
      scheduleDate: false,
      scheduleTime: false,
      date: "",
      time: "",
      requiresApproval: false,
    },
  });

  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [years, setYears] = useState([]);
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditing);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState("basic");

  const selectedDeptCode = watch("department");
  const selectedCategory = watch("noticeType");
  const currentPriority = watch("priority");
  const requiresApproval = watch("requiresApproval");

  const tabs = [
    { id: "basic", label: "Basic Info", icon: FaFileAlt },
    { id: "audience", label: "Audience", icon: FaUsers },
    { id: "settings", label: "Settings", icon: FaClock },
  ];

  useEffect(() => {
    const fetchNoticeData = async () => {
      if (!isEditing) return;

      try {
        setIsFetching(true);
        const response = await fetch(
          `${import.meta.env.VITE_NOTICES_GET}/${noticeId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await response.json();
        setNoticeData(data);

        reset({
          title: data.title,
          subject: data.subject || "",
          noticeBody: data.content,
          noticeType: data.notice_type,
          department: data.departments?.[0] || "",
          course: data.program_course || "",
          year: data.year || "",
          section: data.section || "",
          priority: data.priority || "Normal",
          sendOptions: data.send_options || { email: false, web: true },
          recipientEmails: data.recipient_emails || [],
          attachments: data.attachments || [],
          requiresApproval: data.requires_approval || false,
        });
      } catch (err) {
        setError(`Failed to load notice: ${err.message}`);
      } finally {
        setIsFetching(false);
      }
    };

    if (isEditing) {
      fetchNoticeData();
    }
  }, [noticeId, isEditing, reset, token]);

  const applyQuickOption = (option) => {
    setCreationMode(option.id);
    reset({
      ...watch(),
      ...option.preset,
    });
  };

  const handleClassify = async () => {
    const noticeBody = watch("noticeBody");

    const textToClassify = noticeBody.trim();

    if (!textToClassify) {
      setClassifiedCategory(null);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: textToClassify }),
      });

      const data = await res.json();
      setClassifiedCategory(data.category);
    } catch (error) {
      console.error("Classification Error:", error);
      setClassifiedCategory(null);
    }
  };

  useEffect(() => {
    if (classifiedCategory) {
      const existingCategory = config.categories.find(
        (cat) => cat.value === classifiedCategory
      );

      if (existingCategory) {
        setValue("noticeType", existingCategory.value);
      } else {
        setValue("noticeType", classifiedCategory);
      }
    }
  }, [classifiedCategory, config.categories, setValue]);

  const calculateCompletion = () => {
    const fields = ["title", "noticeBody", "noticeType"];
    const completed = fields.filter(
      (field) => watch(field) && watch(field).trim() !== ""
    ).length;
    return Math.round((completed / fields.length) * 100);
  };

  useEffect(() => {
    const fetchData = async (url, setter) => {
      try {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(`Failed to fetch data`);
        const data = await response.json();
        setter(data);
      } catch (err) {
        setError(err.message);
      }
    };

    if (token) {
      fetchData(`${import.meta.env.VITE_GET_DEPARTMENTS}`, setDepartments);
      fetchData(`${import.meta.env.VITE_GET_YEARS}`, setYears);
      fetchData(`${import.meta.env.VITE_GET_SECTIONS}`, setSections);
    }
  }, [token]);

  useEffect(() => {
    if (!selectedDeptCode) {
      setCourses([]);
      setValue("course", "");
      return;
    }
    const fetchCourses = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_GET_DEPARTMENTS}/${selectedDeptCode}/courses`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch courses");
        const data = await response.json();
        setCourses(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchCourses();
  }, [selectedDeptCode, token, setValue]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setValue("attachments", [...watch("attachments"), ...files]);
  };

  const removeAttachment = (index) => {
    setValue(
      "attachments",
      watch("attachments").filter((_, i) => i !== index)
    );
  };

  const handleEmailInput = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const value = e.target.value.trim();
      if (value && !watch("recipientEmails").includes(value)) {
        setValue("recipientEmails", [...watch("recipientEmails"), value]);
        e.target.value = "";
      }
    }
  };

  const removeEmail = (index) => {
    const emails = watch("recipientEmails");
    setValue(
      "recipientEmails",
      emails.filter((_, i) => i !== index)
    );
  };

  const handleRequestApproval = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_GET_APPROVALS}/${noticeId}/request-approval`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(response.data.message);
      setShowApprovalDialog(false);
      // Refresh notice data
      const noticeResponse = await fetch(
        `${import.meta.env.VITE_NOTICES_GET}/${noticeId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const noticeData = await noticeResponse.json();
      setNoticeData(noticeData);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to request approval");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignApproval = async () => {
    try {
      setIsLoading(true);
      const signature = sigCanvas.current.getCanvas().toDataURL("image/png");

      await axios.post(
        `${import.meta.env.VITE_GET_APPROVALS_BASE}/${
          noticeData.currentApprovalId
        }/sign`,
        {
          signature,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setShowSignatureDialog(false);
      // Refresh notice data
      const noticeResponse = await fetch(
        `${import.meta.env.VITE_NOTICES_GET}/${noticeId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const noticeData = await noticeResponse.json();
      setNoticeData(noticeData);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit signature");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data, publish = true) => {
    setError(null);
    if (!data.title.trim() || !data.noticeBody.trim()) {
      return setError("Title and notice body are required");
    }
    setIsLoading(true);
    const formData = new FormData();

    const departmentObject = departments.find(
      (d) => d.code === data.department
    );
    if (departmentObject) {
      formData.append("department", departmentObject.name);
    }

    formData.append("title", data.title);
    formData.append("subject", data.subject);
    formData.append("content", data.noticeBody);
    formData.append("noticeType", data.noticeType);
    formData.append("course", data.course);
    formData.append("year", data.year);
    formData.append("section", data.section);
    formData.append("priority", data.priority);
    formData.append("status", publish ? "published" : "draft");
    formData.append("send_options", JSON.stringify(data.sendOptions));
    formData.append("recipient_emails", JSON.stringify(data.recipientEmails));
    formData.append("requires_approval", data.requiresApproval);
    data.attachments.forEach((file) => formData.append("attachments", file));

    try {
      const url = isEditing
        ? `${import.meta.env.VITE_NOTICES_GET}/${noticeId}`
        : import.meta.env.VITE_NOTICES_GET;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Failed to ${isEditing ? "update" : "create"} notice`
        );
      }

      const result = await response.json();
      setSuccess(
        `Notice ${
          isEditing ? "updated" : publish ? "published" : "saved"
        } successfully!`
      );

      if (isEditing) {
        // Refresh notice data
        const noticeResponse = await fetch(
          `http://localhost:5001/api/notices/${noticeId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const noticeData = await noticeResponse.json();
        setNoticeData(noticeData);
      } else {
        setTimeout(() => navigate("/notices"), 1500);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => navigate("/notices");

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className={`w-16 h-16 rounded-full bg-gradient-to-r ${config.gradient} flex items-center justify-center mb-4 mx-auto animate-pulse`}
          >
            <FaSpinner className="text-white text-2xl animate-spin" />
          </div>
          <p className="text-gray-600 font-medium">Loading notice data...</p>
        </div>
      </div>
    );
  }

  // UPDATED LOGIC HERE
  const categoriesToRender = [...config.categories];
  const isClassifiedOther = classifiedCategory && !config.categories.some((cat) => cat.value === classifiedCategory);

  const otherCategory = {
      value: classifiedCategory || 'other',
      label: classifiedCategory ? `Other (${classifiedCategory})` : 'Other',
      icon: FaTag, // Default icon for other
  };

  categoriesToRender.push(otherCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {!isEditing && (
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Quick Create Options
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickOptions.map((option) => {
                const Icon = option.icon;
                const isActive = creationMode === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => applyQuickOption(option)}
                    className={`p-4 border rounded-xl text-left transition-all ${
                      isActive
                        ? `border-${config.color}-500 bg-${config.color}-50 shadow-inner`
                        : "border-gray-300 hover:border-gray-400 bg-white"
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`p-2 rounded-lg bg-${config.color}-100`}>
                        <Icon className={`text-${config.color}-600`} />
                      </div>
                      <h3 className="font-medium text-gray-900">
                        {option.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditing ? "Edit Notice" : "Create New Notice"}
            <span className="block text-sm font-normal text-gray-500 mt-1">
              {role.charAt(0).toUpperCase() + role.slice(1)} Portal
            </span>
          </h1>
          <div className="flex items-center space-x-2">
            {noticeData?.approval_status && (
              <ApprovalStatusBadge status={noticeData.approval_status} />
            )}
            <span
              className={`text-sm font-medium ${
                isValid ? "text-green-600" : "text-yellow-600"
              }`}
            >
              {isValid ? "Ready to publish" : "Missing required fields"}
            </span>
          </div>
        </div>

        {noticeData?.approval_status &&
          noticeData.approval_status !== "not_required" && (
            <ApprovalWorkflow
              notice={noticeData}
              currentUser={{ id: "current_user_id" }} // Replace with actual current user
              onUpdate={() => {
                // Refresh notice data
                fetch(`http://localhost:5001/api/notices/${noticeId}`, {
                  headers: { Authorization: `Bearer ${token}` },
                })
                  .then((res) => res.json())
                  .then((data) => setNoticeData(data));
              }}
              onRequestSignature={() => setShowSignatureDialog(true)}
            />
          )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-4">
            <div className="lg:col-span-1 bg-gray-50 p-6 border-r border-gray-200">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                        isActive
                          ? `bg-gradient-to-r ${config.gradient} text-white shadow-md`
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="text-lg" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-8">
                <div className="text-sm font-medium text-gray-700 mb-1">
                  Completion: {calculateCompletion()}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r ${config.gradient}`}
                    style={{ width: `${calculateCompletion()}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 p-8">
              {activeTab === "basic" && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notice Title <span className="text-red-500">*</span>
                      </label>
                      <Controller
                        name="title"
                        control={control}
                        rules={{ required: "Title is required" }}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="text"
                            className={`w-full border rounded-lg px-4 py-3 ${
                              errors.title
                                ? "border-red-300"
                                : "border-gray-300"
                            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                            placeholder="Enter notice title..."
                          />
                        )}
                      />
                      {errors.title && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors.title.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject Line
                      </label>
                      <Controller
                        name="subject"
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="text"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Brief subject for email notifications..."
                          />
                        )}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category{" "}
                        <span className="text-red-500">
                          *{" "}
                          {classifiedCategory && watch("noticeBody")
                            ? `(AI Suggestion: ${classifiedCategory})`
                            : ""}
                        </span>
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {categoriesToRender.map((category) => {
                          const Icon = category.icon;
                          const isSelected = selectedCategory === category.value;
                          return (
                            <div
                              key={category.value}
                              onClick={() => setValue("noticeType", category.value)}
                              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                isSelected
                                  ? `border-${config.color}-500 bg-${config.color}-50`
                                  : "border-gray-300 hover:border-gray-400"
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`p-2 rounded-lg bg-${config.color}-100`}
                                >
                                  <Icon
                                    className={`text-${config.color}-600`}
                                  />
                                </div>
                                <div className="font-medium text-gray-900">
                                  {category.label}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notice Content <span className="text-red-500">*</span>
                      </label>
                      <Controller
                        name="noticeBody"
                        control={control}
                        rules={{ required: "Content is required" }}
                        render={({ field }) => (
                          <RTE
                            control={control}
                            name="noticeBody"
                            defaultValue={field.value}
                            onBlur={handleClassify}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      {errors.noticeBody && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors.noticeBody.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Attachments
                      </label>
                      <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                        <FaUpload className="mr-2 text-gray-600" />
                        <span className="text-sm font-medium">
                          Upload Files
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          onChange={handleFileUpload}
                        />
                      </label>
                      {watch("attachments").length > 0 && (
                        <div className="mt-3 space-y-2">
                          {watch("attachments").map((file, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <div className="flex items-center space-x-3">
                                <FaFileAlt className="text-gray-500" />
                                <span className="text-sm font-medium truncate max-w-xs">
                                  {file.name}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeAttachment(index)}
                                className="text-gray-500 hover:text-red-500 p-1 rounded-md hover:bg-gray-100 transition-colors"
                              >
                                <FaTimes size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "audience" && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department
                      </label>
                      <Controller
                        name="department"
                        control={control}
                        render={({ field }) => (
                          <select
                            {...field}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            <option value="">All Departments</option>
                            {departments.map((d) => (
                              <option key={d.code} value={d.code}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Course
                      </label>
                      <Controller
                        name="course"
                        control={control}
                        render={({ field }) => (
                          <select
                            {...field}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            disabled={!selectedDeptCode || courses.length === 0}
                          >
                            <option value="">All Courses</option>
                            {courses.map((c) => (
                              <option key={c.code} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Year
                        </label>
                        <Controller
                          name="year"
                          control={control}
                          render={({ field }) => (
                            <select
                              {...field}
                              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">All Years</option>
                              {years.map((y) => (
                                <option key={y} value={y}>
                                  {y}
                                </option>
                              ))}
                            </select>
                          )}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Section
                        </label>
                        <Controller
                          name="section"
                          control={control}
                          render={({ field }) => (
                            <select
                              {...field}
                              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">All Sections</option>
                              {sections.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Recipients
                      </label>
                      <div className="border border-gray-300 rounded-lg p-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {watch("recipientEmails").map((email, index) => (
                            <div
                              key={index}
                              className="flex items-center bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-xs font-medium"
                            >
                              {email}
                              <button
                                type="button"
                                onClick={() => removeEmail(index)}
                                className="ml-1.5 text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <FaTimes size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <input
                          type="text"
                          onKeyDown={handleEmailInput}
                          className="w-full border-0 px-0 py-1 focus:ring-0 text-sm placeholder-gray-400"
                          placeholder="Type email and press Enter..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {priorityOptions.map((option) => {
                        const Icon = option.icon;
                        const isSelected = currentPriority === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setValue("priority", option.value)}
                            className={`p-4 rounded-lg border-2 text-left transition-all ${
                              isSelected
                                ? `border-${option.color}-500 bg-${option.color}-50 shadow-sm`
                                : "border-gray-300 hover:border-gray-400"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={`p-2 rounded-lg bg-${option.color}-100`}
                              >
                                <Icon className={`text-${option.color}-600`} />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {option.label}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {option.value === "Normal"
                                    ? "Standard priority"
                                    : option.value === "Urgent"
                                    ? "Important notice"
                                    : "Immediate attention required"}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Options
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-blue-100">
                            <FaBuilding className="text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              Web Portal
                            </div>
                            <div className="text-xs text-gray-500">
                              Publish to notice board
                            </div>
                          </div>
                        </div>
                        <Controller
                          name="sendOptions.web"
                          control={control}
                          render={({ field }) => (
                            <input
                              type="checkbox"
                              {...field}
                              checked={field.value}
                              className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500/20 focus:ring-2"
                            />
                          )}
                        />
                      </label>
                      <label className="flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-blue-100">
                            <FaEnvelope className="text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              Email Notification
                            </div>
                            <div className="text-xs text-gray-500">
                              Send email to recipients
                            </div>
                          </div>
                        </div>
                        <Controller
                          name="sendOptions.email"
                          control={control}
                          render={({ field }) => (
                            <input
                              type="checkbox"
                              {...field}
                              checked={field.value}
                              className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500/20 focus:ring-2"
                            />
                          )}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Approval
                    </label>
                    <label className="flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-purple-100">
                          <FaSignature className="text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            Requires Approval
                          </div>
                          <div className="text-xs text-gray-500">
                            Submit for higher authority approval
                          </div>
                        </div>
                      </div>
                      <Controller
                        name="requiresApproval"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="checkbox"
                            {...field}
                            checked={field.value}
                            className="h-5 w-5 rounded text-purple-600 focus:ring-purple-500/20 focus:ring-2"
                          />
                        )}
                      />
                    </label>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scheduling
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-gray-100">
                            <FaCalendarAlt className="text-gray-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              Schedule Date
                            </div>
                            <div className="text-xs text-gray-500">
                              Publish on specific date
                            </div>
                          </div>
                        </div>
                        <Controller
                          name="scheduleDate"
                          control={control}
                          render={({ field }) => (
                            <input
                              type="checkbox"
                              {...field}
                              checked={field.value}
                              className="h-5 w-5 rounded text-gray-600 focus:ring-gray-500/20 focus:ring-2"
                            />
                          )}
                        />
                      </label>
                      {watch("scheduleDate") && (
                        <div className="pl-16">
                          <Controller
                            name="date"
                            control={control}
                            render={({ field }) => (
                              <input
                                {...field}
                                type="date"
                                min={new Date().toISOString().split("T")[0]}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            )}
                          />
                        </div>
                      )}
                      <label className="flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-gray-100">
                            <FaClock className="text-gray-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              Schedule Time
                            </div>
                            <div className="text-xs text-gray-500">
                              Publish at specific time
                            </div>
                          </div>
                        </div>
                        <Controller
                          name="scheduleTime"
                          control={control}
                          render={({ field }) => (
                            <input
                              type="checkbox"
                              {...field}
                              checked={field.value}
                              className="h-5 w-5 rounded text-gray-600 focus:ring-gray-500/20 focus:ring-2"
                            />
                          )}
                        />
                      </label>
                      {watch("scheduleTime") && (
                        <div className="pl-16">
                          <Controller
                            name="time"
                            control={control}
                            render={({ field }) => (
                              <input
                                {...field}
                                type="time"
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit((data) => onSubmit(data, false))}
                    className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                  >
                    <RiDraftLine className="mr-2" />
                    Save as Draft
                  </button>
                  {isEditing &&
                    noticeData?.approval_status === "not_required" && (
                      <button
                        type="button"
                        onClick={() => setShowApprovalDialog(true)}
                        className="px-5 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                      >
                        Request Approval
                      </button>
                    )}
                  <button
                    type="submit"
                    onClick={handleSubmit((data) => onSubmit(data, true))}
                    disabled={!isValid || isLoading}
                    className={`px-5 py-2.5 bg-gradient-to-r ${
                      config.gradient
                    } text-white rounded-lg hover:shadow-md transition-all flex items-center ${
                      !isValid ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    <IoMdSend className="mr-2" />
                    {isLoading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        {isEditing ? "Updating..." : "Publishing..."}
                      </>
                    ) : isEditing ? (
                      "Update Notice"
                    ) : (
                      "Publish Notice"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Request Dialog */}
      {showApprovalDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Request Approval</h3>
            <p className="mb-4">
              This will submit the notice for approval before publishing.
              Continue?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowApprovalDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestApproval}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? "Submitting..." : "Submit for Approval"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Dialog */}
      {showSignatureDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Digital Signature</h3>
            <div className="border border-gray-300 rounded-lg p-2 mb-4">
              <SignaturePad
                ref={sigCanvas}
                canvasProps={{
                  width: 500,
                  height: 200,
                  className: "w-full bg-white",
                }}
              />
            </div>
            <div className="flex justify-between items-center">
              <button
                onClick={() => sigCanvas.current.clear()}
                className="px-3 py-1 text-sm text-gray-700 border border-gray-300 rounded"
              >
                Clear
              </button>
              <button
                onClick={handleSignApproval}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? "Signing..." : "Submit Signature"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}