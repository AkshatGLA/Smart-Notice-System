import { FaPlus } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import LogoutBtn from "./LogoutBtn";

const Topbar = () => {
  const navigate = useNavigate();
  const { status, userData } = useSelector((state) => state.auth);  

  const handleSignUp = () => {
    navigate("/signup");
  };

  return (
    <div className="w-full  bg-white border-b px-6 py-4 flex  justify-between items-center">

      {/* Title */}
      <h1 className="text-xl font-bold text-gray-800 cursor-pointer" onClick={()=> navigate("/")}>Logo</h1>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        {/* Create Notice Button - Only show if logged in */}
        {status && (
          <Link to={"/CreateNotice"}>
            <button className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition text-sm font-medium">
              <FaPlus className="mr-2" />
              Create Notice
            </button>
          </Link>
        )}

        {/* Avatar and Username - Only show if logged in */}
        {status ? (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold">
                {userData?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-sm text-gray-800 font-medium">
                {userData?.name || 'User'}
              </span>
            </div>
            <LogoutBtn />
          </div>
        ) : (
          <button 
            onClick={handleSignUp} 
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 text-sm font-medium"
          >
            Sign Up
          </button>
        )}
      </div>
    </div>
  );
};

export default Topbar;