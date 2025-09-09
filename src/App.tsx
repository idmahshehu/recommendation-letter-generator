import { AppRoutes } from './routes';

function App() {
  return <AppRoutes />;
};

export default App;
// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "./context/AuthContext";
// import { StatsCards } from "./components/dashboard/StatsCards";
// import { Navigation } from "./components/layout/Navigation";
// // import { LoginPage } from "./pages/auth/LoginPage";
// import axios from "axios";
// import LoginPage from "./pages/auth/LoginPage";

// interface Letter {
//   id: string;
//   status: "requested" | "draft" | "in_review" | "completed" | string;
//   // Add other fields if needed
// }

// const App: React.FC = () => {
//   const { user, token, logout, loading } = useAuth();
//   const navigate = useNavigate();

//   const [currentView, setCurrentView] = useState("dashboard");
//   const [stats, setStats] = useState({
//     total: 0,
//     pending: 0,
//     inReview: 0,
//     completed: 0,
//   });

//   // ✅ All hooks must be at top level (no early returns before this)
//   useEffect(() => {
//     const fetchLetters = async () => {
//       if (!token) return;

//       try {
//         const res = await axios.get<{ letters: Letter[] }>(
//           "http://localhost:5000/api/letters",
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//           }
//         );

//         const letters = res.data.letters || [];

//         const newStats = {
//           total: letters.length,
//           pending: letters.filter((l: Letter) => l.status === "requested").length,
//           inReview: letters.filter(
//             (l: Letter) => l.status === "draft" || l.status === "in_review"
//           ).length,
//           completed: letters.filter((l: Letter) => l.status === "completed").length,
//         };

//         setStats(newStats);
//       } catch (err) {
//         console.error("❌ Failed to fetch letters:", err);
//       }
//     };

//     if (token) {
//       fetchLetters();
//     }
//   }, [token]);

//   // ✅ Handle return conditionally *after* hooks
//   if (loading) return <div>Loading...</div>;
//   if (!token || !user) return <LoginPage />;

//   const handleLogout = () => {
//     logout();
//     navigate("/login");
//   };

//   return (
//     <div className="bg-gray-50 min-h-screen">
//       <Navigation
//         user={user}
//         currentView={currentView}
//         onNavigate={setCurrentView}
//         onLogout={handleLogout}
//       />

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {currentView === "dashboard" && (
//           <div className="animate-fade-in">
//             <div className="mb-8">
//               <h2 className="text-3xl font-bold text-gray-900">
//                 Welcome back, {user?.firstName}!
//               </h2>
//               <p className="mt-2 text-gray-600">
//                 Manage your recommendation letter requests
//               </p>
//             </div>
//             <StatsCards stats={stats} />
//           </div>
//         )}

//         {currentView === "letters" && (
//           <div className="animate-fade-in">
//             <h2 className="text-3xl font-bold text-gray-900 mb-6">My Letters</h2>
//             {/* Letters component */}
//           </div>
//         )}

//         {currentView === "templates" && (
//           <div className="animate-fade-in">
//             <h2 className="text-3xl font-bold text-gray-900 mb-6">Templates</h2>
//             {/* Templates component */}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default App;