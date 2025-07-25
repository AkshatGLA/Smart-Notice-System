import React from 'react'
import { NavLink } from 'react-router-dom'
import { FaHome, FaBell, FaUser, FaFileAlt } from 'react-icons/fa'

const UserNavigation = () => {
  const navItems = [
    { path: '/HomePage', label: 'Home', icon: FaHome },
    { path: '/UserNotices', label: 'My Notices', icon: FaBell },
    { path: '/UserProfile', label: 'Profile', icon: FaUser },
  ]

  return (
    <nav className='bg-white border-b border-gray-200 px-6 py-3'>
      <div className='flex space-x-8'>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`
            }
          >
            <item.icon className='w-4 h-4' />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default UserNavigation