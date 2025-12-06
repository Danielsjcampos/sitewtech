import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Glossary from './pages/Glossary';
import Admin from './pages/Admin';
import MechanicRegister from './pages/MechanicRegister';
import MechanicsMap from './pages/MechanicsMap';
import Checkout from './pages/Checkout';
import Contact from './pages/Contact';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import LandingPageViewer from './pages/LandingPageViewer';
import HomeP2 from './pages/HomeP2';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="courses" element={<Courses />} />
              <Route path="courses/:id" element={<CourseDetail />} />
              <Route path="glossary" element={<Glossary />} />
              <Route path="register-mechanic" element={<MechanicRegister />} />
              <Route path="mechanics-map" element={<MechanicsMap />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="contact" element={<Contact />} />
              
              {/* Blog Routes */}
              <Route path="blog" element={<Blog />} />
              <Route path="blog/:slug" element={<BlogPost />} />
            </Route>
            
            {/* Landing Page Route (No Layout) */}
            <Route path="/lp/:slug" element={<LandingPageViewer />} />
            
  {/* Admin Route */}
            <Route path="/admin" element={<Admin />} />

            {/* Test Modern Home Route */}
            <Route path="/p2" element={<HomeP2 />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;