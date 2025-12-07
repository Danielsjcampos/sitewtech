import React, { useState, useEffect } from 'react';
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
import LPEuropa from './pages/LPEuropa';
import Termos from './pages/Termos';
import Privacidade from './pages/Privacidade';
import Cancelamento from './pages/Cancelamento';
import Suporte from './pages/Suporte';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { WhatsAppInterceptor } from './components/WhatsAppInterceptor';
import { supabase } from './lib/supabaseClient'; // Assuming supabaseClient.ts exists

// Extend Window interface to add hasInjectedScripts property
declare global {
  interface Window {
    hasInjectedScripts?: boolean;
  }
}

const App = () => {
    // Logic moved to SettingsContext


  return (
    <SettingsProvider>
    <Router>
        <AuthProvider>
            <CartProvider>
                <div className="flex flex-col min-h-screen">
                    <WhatsAppInterceptor />
                    <Routes>
                        <Route path="/" element={<Layout><Home /></Layout>} />
                        <Route path="/home-p2" element={<HomeP2 />} />
                        <Route path="/cursos" element={<Layout><Courses /></Layout>} />
                        <Route path="/cursos/:id" element={<Layout><CourseDetail /></Layout>} />
                        <Route path="/glossario" element={<Glossary />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/sou-mecanico" element={<MechanicRegister />} />
                        <Route path="/mapa" element={<Layout><MechanicsMap /></Layout>} />
                        <Route path="/checkout/:planId" element={<Layout><Checkout /></Layout>} />
                        <Route path="/contato" element={<Layout><Contact /></Layout>} />
                        <Route path="/blog" element={<Layout><Blog /></Layout>} />
                        <Route path="/blog/:slug" element={<Layout><BlogPost /></Layout>} />
                        
                        {/* Landing Pages */}
                        <Route path="/lp/europa" element={<LPEuropa />} />
                        <Route path="/lp/:slug" element={<LandingPageViewer />} />

                        {/* Legal Pages */}
                        <Route path="/termos" element={<Termos />} />
                        <Route path="/privacidade" element={<Privacidade />} />
                        <Route path="/cancelamento" element={<Cancelamento />} />
                        <Route path="/suporte" element={<Suporte />} />

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </CartProvider>
        </AuthProvider>
    </Router>
    </SettingsProvider>
  );
};

export default App;