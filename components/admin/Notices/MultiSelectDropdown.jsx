// src/components/MultiSelectDropdown.jsx

import React, { useState, useEffect, useRef } from 'react';
import { FaChevronDown } from 'react-icons/fa';

export default function MultiSelectDropdown({ options, selected, onChange, placeholder, disabled = false }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Effect to handle clicking outside the dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectAll = (e) => {
        e.stopPropagation();
        onChange(options.map(opt => opt.value));
    };

    const handleDeselectAll = (e) => {
        e.stopPropagation();
        onChange([]);
    };

    const handleOptionToggle = (value) => {
        if (selected.includes(value)) {
            onChange(selected.filter(item => item !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    const getButtonText = () => {
        if (selected.length === 0) return placeholder;
        if (selected.length === options.length) return `All ${placeholder} Selected`;
        if (selected.length === 1) {
             const selectedOption = options.find(opt => opt.value === selected[0]);
             return selectedOption ? selectedOption.label : '1 item selected';
        }
        return `${selected.length} ${placeholder} Selected`;
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center bg-white border border-gray-300 rounded-md px-3 py-2 text-left disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
                <span className="truncate">{getButtonText()}</span>
                <FaChevronDown className={`transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    <div className="flex justify-between p-2 border-b">
                        <button type="button" onClick={handleSelectAll} className="text-sm text-blue-600 hover:underline">Select All</button>
                        <button type="button" onClick={handleDeselectAll} className="text-sm text-blue-600 hover:underline">Deselect All</button>
                    </div>
                    <ul className="max-h-60 overflow-y-auto p-1">
                        {options.map(option => (
                            <li key={option.value}>
                                <label className="flex items-center w-full px-2 py-1.5 space-x-2 rounded-md hover:bg-gray-100 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        checked={selected.includes(option.value)}
                                        onChange={() => handleOptionToggle(option.value)}
                                    />
                                    <span className="text-sm text-gray-700">{option.label}</span>
                                </label>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}