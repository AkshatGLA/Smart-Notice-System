import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter } from 'react-router-dom'
import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from './store/store.js'

// pages
import Signup from "./pages/Signup.jsx"
import Login from './pages/Login.jsx'
import { DashBoard } from '../components/index.js'
import Notices from "./pages/NoticesList.jsx"
import AllNotice from "./pages/Notices.jsx"
import { MainDashBoard } from "../components/index.js"
import UserHome from '../components/User/Home/Home.jsx'
import UserProfile from '../components/User/Profile.jsx'

// Components
import AuthLayout from "../components/AuthLayout/AuthLayout.jsx"
import CreateNoticeTable from '../components/admin/Notices/NoticeForm.jsx'
import DashboardPage from '../components/admin/DashBoard/DashBoard.jsx'
import PublicLayout from '../components/publicLayout/publicLayout.jsx'
import RoleBasedRedirect from '../components/RoleBasedRedirect/RoleBasedRedirect.jsx'
import NoticeDetailPage from '../components/User/Notices/NoticeDtail.jsx'
import MyDashboard from '../components/admin/DashBoard/MyDashBoard.jsx'
import NoticeReadAnalytics from '../components/admin/Notices/NoticeReadAnalytics.jsx'
// --- STEP 1: Change the import from the old component... ---
// import UploadStudents from '../components/admin/StudentDetails/UploadStudents.jsx' 
// --- ...to the new, combined component. ---
import UploadData from '../components/admin/StudentDetails/UploadData.jsx'; // Make sure this path is correct

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: <RoleBasedRedirect />
      },
      {
        path: "/login",
        element: (
          <AuthLayout authentication={false}>
            <Login />
          </AuthLayout>
        ),
      },
      {
        path: "/signup",
        element: (
          <AuthLayout authentication={false}>
            <Signup />
          </AuthLayout>
        )
      },
      // Admin-only routes
      {
        path: "/notices/:noticeId/analytics",
        element: (
          <AuthLayout authentication={true} allowedRoles={['admin']}>
            <DashboardPage />
          </AuthLayout>
        )
      },
      {
        path: "/CreateNotice",
        element: (
          <AuthLayout authentication={true} allowedRoles={['admin']}>
            <CreateNoticeTable />
          </AuthLayout>
        )
      },
      {
        path: "/AllNotices",
        element: (
          <AuthLayout authentication={true} allowedRoles={['admin']}>
            <Notices />
          </AuthLayout>
        )
      },
      // Both admin and user can access
      {
        path: "/notices",
        element: (
          <AuthLayout authentication={true} allowedRoles={['admin', 'user']}>
            <AllNotice />
          </AuthLayout>
        )
      },
      // User-only routes
      {
        path: '/HomePage',
        element: (
          <AuthLayout authentication={true} allowedRoles={['user']}>
            <UserHome />
          </AuthLayout>
        )
      },
      {
        path: '/UserProfile',
        element: (
          <AuthLayout authentication={true} allowedRoles={['user']}>
            <UserProfile />
          </AuthLayout>
        )
      },
      {
        path: '/UserNotices',
        element: (
          <AuthLayout authentication={true} allowedRoles={['user']}>
            <div>User Notices Page</div>
          </AuthLayout>
        )
      },
      // Admin dashboard
      {
        path: "/AdminDashboard",
        element: (
          <AuthLayout authentication={true} allowedRoles={['admin']}>
            <MainDashBoard />
          </AuthLayout>
        )
      },
      {
        path: "/notices/:noticeId",
        element: (
          <AuthLayout authentication={true} allowedRoles={['user']}>
            <NoticeDetailPage />
          </AuthLayout>
        )
      },
      {
        path: "/my-dashBoard",
        element: (
          <AuthLayout authentication={true} allowedRoles={['admin']}>
            <MyDashboard />
          </AuthLayout>
        )
      },
      {
        path: "/notices/edit/:noticeId",
        element: (
          <AuthLayout authentication={true} allowedRoles={['admin']}>
            <CreateNoticeTable />
          </AuthLayout>
        )
      },
      {
        path: "/notices/:noticeId/read-analytics",
        element: (
          <AuthLayout authentication={true} allowedRoles={['admin']}>
            <NoticeReadAnalytics />
          </AuthLayout>
        )
      },
      {
        path: "/add-student-details",
        element: (
          <AuthLayout authentication={true} allowedRoles={['admin']}>
            {/* --- STEP 2: Use the new UploadData component here --- */}
            <UploadData />
          </AuthLayout>
        )
      }
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
)
