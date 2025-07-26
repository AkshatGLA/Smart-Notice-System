import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';

/**
 * A more robust MultiSelectDropdown component.
 * It correctly handles props from react-hook-form's Controller.
 * @param {string} label - An optional label to display above the dropdown.
 * @param {Array<object>} options - The array of options, e.g., [{ label: 'B.Tech', value: 'BTECH_CSE' }]
 * @param {Array<string>} value - The array of selected values (from react-hook-form). Renamed to selectedValues internally.
 * @param {Function} onChange - The function to call when the selection changes (from react-hook-form).
 * @param {string} placeholder - The placeholder text to show when no items are selected.
 * @param {boolean} disabled - Whether the dropdown is disabled.
 */
export default function MultiSelectDropdown({
    label,
    options,
    value: selectedValues = [], // Rename `value` to `selectedValues` and provide a default empty array
    onChange,
    placeholder, // Accept the placeholder prop
    disabled = false
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleToggle = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
        }
    };

    const handleCheckboxChange = (optionValue) => {
        // Check if the value is already in the array
        const newSelectedValues = selectedValues.includes(optionValue)
            ? selectedValues.filter((v) => v !== optionValue) // Remove it
            : [...selectedValues, optionValue]; // Add it
        onChange(newSelectedValues); // This is the function from react-hook-form's Controller
    };

    // Effect to close the dropdown when clicking outside of it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Determines the text to display on the dropdown button
    const getDisplayText = () => {
        if (disabled) return placeholder || `Select ${label || 'an option'}`;
        if (!selectedValues || selectedValues.length === 0) {
            return placeholder || `Select ${label || 'an option'}(s)`;
        }
        if (selectedValues.length === 1) {
             const selectedOption = options.find(opt => opt.value === selectedValues[0]);
             return selectedOption ? selectedOption.label : selectedValues[0];
        }
        return `${selectedValues.length} selected`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Only display the label if it's provided */}
            {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
            <button
                type="button"
                onClick={handleToggle}
                disabled={disabled}
                className={`w-full flex justify-between items-center border border-gray-300 rounded-md px-3 py-2 bg-white text-left
                    ${disabled ? 'bg-gray-200 cursor-not-allowed text-gray-500' : 'focus:ring-blue-500 focus:border-blue-500'}`}
            >
                <span className="truncate">{getDisplayText()}</span>
                <FaChevronDown className={`transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {options && options.length > 0 ? (
                        <ul>
                            {options.map((option) => (
                                <li key={option.value} className="px-3 py-2 hover:bg-gray-100">
                                    <label className="flex items-center w-full cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedValues.includes(option.value)}
                                            onChange={() => handleCheckboxChange(option.value)}
                                            className="h-4 w-4 mr-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="text-sm text-gray-700">{option.label}</span>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="px-3 py-2 text-sm text-gray-500">No options available</div>
                    )}
                </div>
            )}
        </div>
    );
}