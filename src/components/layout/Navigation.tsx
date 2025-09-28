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

  const [currentView, setCurrentView] = useState<"dashboard" | "letters" | "templates" | "profile">("dashboard");

   const tabs =
    user?.role === "applicant"
      ? (["dashboard", "letters"] as const)
      : (["dashboard", "letters", "templates", "profile"] as const);

  const handleNavigate = (view: typeof tabs[number]) => {
    setCurrentView(view);

    // simple role-aware switch
    if (user?.role === "applicant") {
      if (view === "dashboard") return navigate("/applicant-dashboard");
      if (view === "letters") return navigate("/view-letters");
    } else {
      if (view === "dashboard") return navigate("/dashboard");
      if (view === "letters") return navigate("/letters");
      if (view === "templates") return navigate("/templates");
      if (view === "profile") return navigate("/profile");
    }
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
              {tabs.map((view) => (
                <button
                  key={view}
                  onClick={() => handleNavigate(view)}
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
