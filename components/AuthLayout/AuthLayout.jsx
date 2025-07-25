import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

export default function AuthLayout({ 
  children, 
  authentication = true, 
  allowedRoles = [] // Array of roles that can access this route
}) {
  const navigate = useNavigate()
  const [loader, setLoader] = useState(true)
  const authStatus = useSelector(state => state.auth.status)
  const userRole = useSelector(state => state.auth.userRole)

  useEffect(() => {
    // Check authentication first
    if (authentication && authStatus !== authentication) {
      navigate("/login")
      setLoader(false)
      return
    } else if (!authentication && authStatus !== authentication) {
      navigate("/")
      setLoader(false)
      return
    }

    // If authenticated and allowedRoles is specified, check role-based access
    if (authentication && authStatus && allowedRoles.length > 0) {
      if (!userRole || !allowedRoles.includes(userRole)) {
        // Redirect based on user role
        if (userRole === 'admin') {
          navigate("/AdminDashboard") // or wherever admin should go
        } else if (userRole === 'user') {
          navigate("/HomePage") // or wherever user should go
        } else {
          navigate("/") // fallback
        }
        setLoader(false)
        return
      }
    }

    setLoader(false)
  }, [authStatus, userRole, navigate, authentication, allowedRoles])

  return loader ? <h1>Loading...</h1> : <>{children}</>
}