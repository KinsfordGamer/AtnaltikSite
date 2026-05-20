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

// Placeholder sahifalar (Hozircha)
const Animes = () => <div className="pt-32 pb-20 text-center text-gray-400">Barcha animelar sahifasi tez kunda...</div>;
const Genres = () => <div className="pt-32 pb-20 text-center text-gray-400">Janrlar sahifasi tez kunda...</div>;
const About = () => <div className="pt-32 pb-20 text-center text-gray-400">Biz haqimizda sahifasi tez kunda...</div>;

function App() {
  return (
    <Router>
      <div className="bg-background text-white min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/anime/:id" element={<AnimeDetail />} />
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
