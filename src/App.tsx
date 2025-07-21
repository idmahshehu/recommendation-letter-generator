import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardPage } from './pages/dashboard';
import { LettersPage } from './pages/letters';
import { LoginPage } from './pages/auth';
import { RegisterPage } from './pages/auth';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/letters" element={<LettersPage />} />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
