import { Header, SideBar } from '../components/index.js'
import { Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import UserHeader from '../components/User/Header/Header.jsx'
import UserNavigation from '../components/User/Navigation.jsx'

const App = () => {
  const location = useLocation()
  const userRole = useSelector(state => state.auth.userRole)
  const authStatus = useSelector(state => state.auth.status)
  
  // Routes where no layout should be shown (auth pages)
  const isAuthRoute = ['/login', '/signup'].includes(location.pathname)
  
  // User portal routes - these should have no admin components
  const isUserRoute = ['/HomePage', '/UserProfile', '/UserNotices'].includes(location.pathname)
  
  // Admin routes - these should have admin components
  const isAdminRoute = [
    '/AdminDashboard', 
    '/CreateNotice', 
    '/AllNotices', 
    '/notices'
  ].includes(location.pathname) || location.pathname.includes('/notices/') // for dynamic routes like /notices/:id/analytics

  const shouldShowAdminLayout = authStatus && !isAuthRoute && (userRole === 'admin')
  const shouldShowUserLayout = authStatus && !isAuthRoute  && userRole === 'user'

  return (
    <div className='min-h-screen flex flex-col bg-white'>
      {/* Admin Layout */}
      {shouldShowAdminLayout && (
        <>
          <header className='w-full'>
            <Header />
          </header>
          <div className='flex flex-1'>
            <aside className='w-64 fixed h-[calc(100vh-4rem)] top-16'>
              <SideBar />
            </aside>
            <main className='flex-1 ml-64 p-4'>
              <Outlet />
            </main>
          </div>
        </>
      )}
      
      {/* User Layout - Clean layout without admin components */}
      {shouldShowUserLayout && (
        <>
          <UserHeader />
          <UserNavigation />
          <div className='flex flex-1'>
            <main className='flex-1 p-6 bg-gray-50'>
              <Outlet />
            </main>
          </div>
        </>
      )}
      
      {/* Auth Layout - No header/sidebar for login/signup */}
      {!authStatus && (
        <main className='flex-1'>
          <Outlet />
        </main>
      )}
      
      {/* Default Layout - For routes that don't match above conditions */}
      {!shouldShowAdminLayout && !shouldShowUserLayout && !isAuthRoute && (
        <main className='flex-1'>
          <Outlet />
        </main>
      )}
    </div>
  )
}

export default App