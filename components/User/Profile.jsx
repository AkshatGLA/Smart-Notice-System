import React from 'react'
import { useSelector } from 'react-redux'
import { FaUser, FaEnvelope, FaUserTag } from 'react-icons/fa'

const UserProfile = () => {
  const userData = useSelector(state => state.auth.userData)

  return (
    <div className='max-w-2xl mx-auto'>
      <div className='bg-white rounded-lg shadow-sm p-6'>
        <h2 className='text-2xl font-bold text-gray-900 mb-6'>My Profile</h2>
        
        <div className='space-y-4'>
          <div className='flex items-center space-x-3 p-4 bg-gray-50 rounded-lg'>
            <FaUser className='w-5 h-5 text-blue-600' />
            <div>
              <label className='block text-sm font-medium text-gray-700'>Name</label>
              <p className='text-gray-900'>{userData?.name || 'Not provided'}</p>
            </div>
          </div>

          <div className='flex items-center space-x-3 p-4 bg-gray-50 rounded-lg'>
            <FaEnvelope className='w-5 h-5 text-blue-600' />
            <div>
              <label className='block text-sm font-medium text-gray-700'>Email</label>
              <p className='text-gray-900'>{userData?.email || 'Not provided'}</p>
            </div>
          </div>

          <div className='flex items-center space-x-3 p-4 bg-gray-50 rounded-lg'>
            <FaUserTag className='w-5 h-5 text-blue-600' />
            <div>
              <label className='block text-sm font-medium text-gray-700'>Role</label>
              <p className='text-gray-900 capitalize'>{userData?.role || 'Not provided'}</p>
            </div>
          </div>
        </div>

        <div className='mt-6 pt-6 border-t border-gray-200'>
          <button className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'>
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserProfile