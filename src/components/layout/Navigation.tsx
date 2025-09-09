// import React from "react";
// import { Settings, LogOut, Mail } from "lucide-react";
// import { User } from "../../context/AuthContext";

// interface NavigationProps {
//   user: User | null;
//   currentView: string;
//   onNavigate: (view: string) => void;
//   onLogout: () => void;
// }

// export const Navigation: React.FC<NavigationProps> = ({
//   user,
//   currentView,
//   onNavigate,
//   onLogout,
// }) => {
//   return (
//     <nav className="bg-white shadow-lg border-b">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between items-center h-16">
//           <div className="flex items-center space-x-4">
//             <div className="flex-shrink-0">
//               <h1 className="text-2xl font-bold gradient-bg bg-clip-text text-transparent">
//                 LetterForge
//               </h1>
//             </div>
//             <nav className="hidden md:flex space-x-8">
//               <button
//                 onClick={() => onNavigate("dashboard")}
//                 className={`px-3 py-2 text-sm font-medium transition-colors ${
//                   currentView === "dashboard"
//                     ? "text-gray-900"
//                     : "text-gray-500 hover:text-blue-600"
//                 }`}
//               >
//                 Dashboard
//               </button>
//               <button
//                 onClick={() => onNavigate("letters")}
//                 className={`px-3 py-2 text-sm font-medium transition-colors ${
//                   currentView === "letters"
//                     ? "text-gray-900"
//                     : "text-gray-500 hover:text-blue-600"
//                 }`}
//               >
//                 Letters
//               </button>
//               <button
//                 onClick={() => onNavigate("templates")}
//                 className={`px-3 py-2 text-sm font-medium transition-colors ${
//                   currentView === "templates"
//                     ? "text-gray-900"
//                     : "text-gray-500 hover:text-blue-600"
//                 }`}
//               >
//                 Templates
//               </button>
//             </nav>
//           </div>

//           <div className="flex items-center space-x-4">
//             {user && (
//               <div className="flex items-center space-x-2">
//                 <span
//                   className={`text-white px-3 py-1 rounded-full text-xs font-semibold ${
//                     user.role === "applicant"
//                       ? "role-badge-applicant"
//                       : "role-badge-referee"
//                   }`}
//                 >
//                   {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
//                 </span>
//                 <span className="text-sm text-gray-700">
//                   {user.firstName} {user.lastName}
//                 </span>
//               </div>
//             )}
//             <button className="text-gray-500 hover:text-gray-700 transition-colors">
//               <Settings className="w-5 h-5" />
//             </button>
//             <button
//               onClick={onLogout}
//               className="text-gray-500 hover:text-gray-700 transition-colors"
//             >
//               <LogOut className="w-5 h-5" />
//             </button>
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// };

import React, { useState } from "react";
import { Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { User, useAuth } from "../../context/AuthContext";

interface NavigationProps {
  user: User | null;
}

export const Navigation: React.FC<NavigationProps> = ({ user }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [currentView, setCurrentView] = useState<"dashboard" | "letters" | "templates">("dashboard");

  const handleNavigate = (view: "dashboard" | "letters" | "templates") => {
    setCurrentView(view);
    navigate(`/${view}`);
  };

  const handleLogout = () => {
    logout();          
    navigate("/login"); 
  };

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <h1
              onClick={() => handleNavigate("dashboard")}
              className="cursor-pointer text-2xl font-bold gradient-bg bg-clip-text text-transparent"
            >
              LetterForge
            </h1>

            <div className="hidden md:flex space-x-8">
              {["dashboard", "letters", "templates"].map((view) => (
                <button
                  key={view}
                  onClick={() => handleNavigate(view as any)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    currentView === view
                      ? "text-gray-900"
                      : "text-gray-500 hover:text-blue-600"
                  }`}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-2">
                <span
                  className={`text-white px-3 py-1 rounded-full text-xs font-semibold ${
                    user.role === "applicant"
                      ? "role-badge-applicant"
                      : "role-badge-referee"
                  }`}
                >
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
                <span className="text-sm text-gray-700">
                  {user.firstName} {user.lastName}
                </span>
              </div>
            )}
            <button className="text-gray-500 hover:text-gray-700">
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
