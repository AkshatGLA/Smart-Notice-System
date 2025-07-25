import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout } from '../../../src/store/authSlice'
import { FaUser, FaBell, FaSignOutAlt } from 'react-icons/fa'

const UserHeader = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const userData = useSelector(state => state.auth.userData)

  const handleLogout = () => {
    dispatch(logout())
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    navigate('/login')
  }

  return (
    <header className='bg-white shadow-sm border-b border-gray-200 px-6 py-4'>
      <div className='flex items-center justify-between'>
        {/* Logo/Brand */}
        <div className='flex items-center'>
          <h1 className='text-2xl font-bold text-blue-600'>Smart Notice</h1>
          <span className='ml-2 text-sm text-gray-500'>User Portal</span>
        </div>

        {/* User Actions */}
        <div className='flex items-center space-x-4'>
          {/* Notifications */}
          <button className='relative p-2 text-gray-600 hover:text-blue-600 transition-colors'>
            <FaBell className='w-5 h-5' />
            <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center'>
              3
            </span>
          </button>

          {/* User Profile */}
          <div className='flex items-center space-x-3'>
            <div className='flex items-center space-x-2'>
              <FaUser className='w-4 h-4 text-gray-600' />
              <span className='text-sm font-medium text-gray-700'>
                {userData?.name || 'User'}
              </span>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className='flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors'
            >
              <FaSignOutAlt className='w-4 h-4' />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default UserHeader