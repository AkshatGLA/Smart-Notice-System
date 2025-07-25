import React, { useState } from "react";

export default function CreateNoticeTable() {
  const [text, setText] = useState("");
  const [entities, setEntities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setEntities([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:5000/ner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        throw new Error("Failed to analyze text");
      }

      const data = await res.json();
      setEntities(data.entities);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching entities:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-md shadow-sm border mt-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Notice</h2>

      {/* Title Input */}
      <div className="mb-4">
        <label className="block font-semibold text-gray-700 mb-1">Notice Title</label>
        <input
          type="text"
          placeholder="Enter notice title..."
          className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Content Textarea */}
      <div className="mb-4">
        <label className="block font-semibold text-gray-700 mb-1">Notice Content</label>
        <textarea
          placeholder="Enter notice content..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-4 py-2 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
      </div>

      {/* Analyze Button */}
      <div className="mb-4">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition text-sm font-medium disabled:opacity-50"
        >
          {isLoading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {/* Entities + Errors */}
      <div className="mb-6">
        {error && (
          <div className="text-red-600 font-medium mb-2">{error}</div>
        )}

        {entities.length > 0 && (
          <div className="bg-gray-100 p-4 rounded-md">
            <strong className="block mb-2 text-gray-700">Detected Entities:</strong>
            <ul className="list-disc pl-6 text-gray-600">
              {entities.map((entity, idx) => (
                <li key={idx}>
                  <span className="font-semibold">{entity.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block font-semibold text-gray-700 mb-1">Priority Level</label>
          <select className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none">
            <option>Low</option>
            <option selected>Medium</option>
            <option>High</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold text-gray-700 mb-1">Category</label>
          <select className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none">
            <option selected>Academic</option>
            <option>Event</option>
            <option>General</option>
          </select>
        </div>
      </div>

      {/* Toggles */}
      <div className="mb-6 space-y-2">
        <label className="flex items-center space-x-2 text-gray-700 font-medium">
          <input type="checkbox" defaultChecked className="form-checkbox h-5 w-5 text-blue-600" />
          <span>Publish immediately</span>
        </label>
        <label className="flex items-center space-x-2 text-gray-700 font-medium">
          <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600" />
          <span>Schedule for later</span>
        </label>
      </div>

      {/* Submit Button */}
      <button className="w-full bg-blue-500 text-white py-2 rounded-md text-sm font-semibold hover:bg-blue-600 transition">
        Create & Send Notice
      </button>
    </div>
  );
}