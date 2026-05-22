import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AnimeDetail from './pages/AnimeDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

// Himoyalangan yo'nalish (Faqat admin uchun)
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  
  try {
    const decoded: any = jwtDecode(token);
    if (!decoded.is_admin) {
      return <Navigate to="/" replace />;
    }
  } catch (err) {
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Himoyalangan yo'nalish (Barcha ro'yxatdan o'tgan foydalanuvchilar uchun)
const UserProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

import Animes from './pages/Animes';
import Genres from './pages/Genres';
import About from './pages/About';
import EpisodeWatch from './pages/EpisodeWatch';

function App() {
  return (
    <Router>
      <div className="bg-background text-white min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/anime/:id" element={
              <UserProtectedRoute>
                <AnimeDetail />
              </UserProtectedRoute>
            } />
            <Route path="/anime/:animeId/episode/:episodeId" element={
              <UserProtectedRoute>
                <EpisodeWatch />
              </UserProtectedRoute>
            } />
            <Route path="/animes" element={<Animes />} />
            <Route path="/genres" element={<Genres />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={
              <UserProtectedRoute>
                <Profile />
              </UserProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
