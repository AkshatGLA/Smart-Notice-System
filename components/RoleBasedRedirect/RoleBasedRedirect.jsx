import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

const RoleBasedRedirect = () => {
  const navigate = useNavigate()
  const userRole = useSelector(state => state.auth.userRole)
  const authStatus = useSelector(state => state.auth.status)

  useEffect(() => {
    if (authStatus) {
      if (userRole === 'admin') {
        navigate("/AdminDashboard")
      } else if (userRole === 'user') {
        navigate("/HomePage")
      } else {
        navigate("/login") // fallback if role is not recognized
      }
    } else {
      navigate("/login")
    }
  }, [authStatus, userRole, navigate])

  return <div>Redirecting...</div>
}

export default RoleBasedRedirect