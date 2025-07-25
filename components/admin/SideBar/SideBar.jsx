import { FaChartBar, FaPlus, FaFileAlt } from "react-icons/fa";
import { FaGear } from "react-icons/fa6";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="w-64 h-screen bg-white border-r shadow-sm">
      {/* Header */}
      <div className="p-6 flex items-start space-x-3 border-b">
        <FaGear className="text-blue-500 text-2xl mt-1" />
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Notice Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col mt-6 space-y-1 text-sm font-medium">

        {/* Dashboard */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center px-6 py-2 transition rounded-md ${
              isActive
                ? "bg-blue-500 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          <FaChartBar className="mr-3 text-base" />
          <span className="text-[15px]">Dashboard</span>
        </NavLink>

        {/* Create Notice */}
        <NavLink
          to="/CreateNotice"
          className={({ isActive }) =>
            `flex items-center px-6 py-2 transition rounded-md ${
              isActive
                ? "bg-blue-500 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          <FaPlus className="mr-3 text-base" />
          <span className="text-[15px]">Create Notice</span>
        </NavLink>

        {/* All Notices */}
        {/* <NavLink
          to="/AllNotices"
          className={({ isActive }) =>
            `flex items-center px-6 py-2 transition rounded-md ${
              isActive
                ? "bg-blue-500 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          <FaFileAlt className="mr-3 text-base" />
          <span className="text-[15px]">All Notices</span>
        </NavLink> */}



        {/* userNotice */}
          <NavLink
          to="/notices"
          className={({ isActive }) =>
            `flex items-center px-6 py-2 transition rounded-md ${
              isActive
                ? "bg-blue-500 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          <FaFileAlt className="mr-3 text-base" />
          <span className="text-[15px]">User Notices</span>
        </NavLink>

          {/* userNotice */}
          <NavLink
          to="/my-dashBoard"
          className={({ isActive }) =>
            `flex items-center px-6 py-2 transition rounded-md ${
              isActive
                ? "bg-blue-500 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          <FaFileAlt className="mr-3 text-base" />
          <span className="text-[15px]">MyDashBoard</span>
        </NavLink>


          {/* userNotice */}
          <NavLink
          to="/add-student-details"
          className={({ isActive }) =>
            `flex items-center px-6 py-2 transition rounded-md ${
              isActive
                ? "bg-blue-500 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          <FaFileAlt className="mr-3 text-base" />
          <span className="text-[15px]">Upload Data</span>
        </NavLink>

      </nav>
    </div>
  );
};

export default Sidebar; 