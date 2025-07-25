import React from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../../../src/store/authSlice'; // Adjust the import path as necessary
import { useNavigate } from 'react-router-dom';

function LogoutBtn() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className='inline-block font-sans px-6 py-2 duration-200 hover:text-blue-600 cursor-pointer'
    >
      Logout
    </button>
  );
}

export default LogoutBtn;