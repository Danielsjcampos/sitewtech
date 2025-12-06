import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, User as UserIcon, LogIn } from 'lucide-react';
import { ASSETS } from '../constants';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import CartDrawer from './CartDrawer';
import LoginModal from './LoginModal';
import { motion, AnimatePresence } from 'framer-motion';

const Layout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { toggleCart, items } = useCart();
  const { user, setShowLoginModal, logout } = useAuth();

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Cursos', path: '/courses' },
    { label: 'Mecânicos', path: '/mechanics-map' },
    // { label: 'Planos', path: '/plans' }, // Removed
    { label: 'Blog', path: '/blog' },
    { label: 'Glossário', path: '/glossary' },
    { label: 'Contato', path: '/contact' },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800">
      <CartDrawer />
      <LoginModal />
      
      {/* Top Bar */}
      <div className="bg-wtech-black text-white text-xs py-2 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <span>Especialistas em Suspensão e Performance</span>
          <div className="flex gap-4 items-center">
            {user ? (
               <div className="flex items-center gap-2">
                 <Link to="/admin" className="hover:text-wtech-gold text-wtech-gold font-bold transition-colors">
                    Olá, {user.name.split(' ')[0]}
                 </Link>
                 <span className="text-gray-600">|</span>
                 <button onClick={logout} className="hover:text-gray-300">Sair</button>
               </div>
            ) : (
                <button 
                    onClick={() => setShowLoginModal(true)} 
                    className="hover:text-wtech-gold transition-colors flex items-center gap-1"
                >
                    <UserIcon size={12} /> Área do Parceiro
                </button>
            )}
            <a href="#" className="hover:text-wtech-gold transition-colors">Suporte</a>
          </div>
        </div>
      </div>

      {/* Header - Modern Standardized */}
      <nav className="sticky top-0 w-full z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100 transition-all duration-300">
        <div className="container mx-auto px-6 h-24 flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 z-50">
                <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-bold text-2xl rounded-lg">W</div>
                <span className="font-bold text-2xl tracking-tighter text-wtech-black">W-TECH <span className="text-wtech-gold">BRASIL</span></span>
            </Link>
            
            {/* Desktop Menu */}
            <div className="hidden lg:flex gap-8 text-sm font-bold text-gray-600 uppercase tracking-wide">
                <Link to="/" className="hover:text-wtech-gold hover:scale-105 transition-all">Início</Link>
                <Link to="/courses" className="hover:text-wtech-gold hover:scale-105 transition-all">Cursos</Link>
                <Link to="/mechanics-map" className="hover:text-wtech-gold hover:scale-105 transition-all">Rede Credenciada</Link>
                <Link to="/blog" className="hover:text-wtech-gold hover:scale-105 transition-all">Blog</Link>
                <Link to="/courses" className="hover:text-wtech-gold hover:scale-105 transition-all">Agenda</Link>
                <Link to="/contact" className="hover:text-wtech-gold hover:scale-105 transition-all">Contato</Link>
            </div>

            <div className="hidden lg:flex gap-4 items-center">
                {/* Cart Trigger */}
                <button 
                  onClick={toggleCart}
                  className="relative p-2 text-gray-700 hover:text-wtech-gold transition-colors"
                >
                  <ShoppingCart size={22} />
                  {items.length > 0 && (
                    <span className="absolute top-0 right-0 bg-wtech-gold text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {items.length}
                    </span>
                  )}
                </button>

                <button 
                    onClick={() => user ? null : setShowLoginModal(true)}
                    className="px-6 py-3 rounded-full border border-gray-200 text-sm font-bold hover:bg-gray-50 transition-colors uppercase"
                >
                    {user ? <Link to="/admin">Painel Admin</Link> : 'Área do Membro'}
                </button>
                <Link to="/courses" className="px-6 py-3 rounded-full bg-wtech-black text-white text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 uppercase">
                    Ver Agenda
                </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="lg:hidden flex items-center gap-4">
                <button 
                  onClick={toggleCart}
                  className="relative p-2 text-gray-700"
                >
                  <ShoppingCart size={22} />
                  {items.length > 0 && (
                    <span className="absolute top-0 right-0 bg-wtech-gold text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {items.length}
                    </span>
                  )}
                </button>
                <button 
                    className="z-50 p-2 text-black"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>
        </div>

        {/* Mobile Menu Overlay */}
         <AnimatePresence>
            {isMobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-0 left-0 w-full h-screen bg-white/95 backdrop-blur-xl z-40 flex flex-col items-center justify-center gap-8 pt-20"
                >
                    <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-black uppercase hover:text-wtech-gold">Início</Link>
                    <Link to="/courses" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-black uppercase hover:text-wtech-gold">Cursos</Link>
                    <Link to="/mechanics-map" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-black uppercase hover:text-wtech-gold">Rede Credenciada</Link>
                    <Link to="/blog" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-black uppercase hover:text-wtech-gold">Blog</Link>
                    <Link to="/courses" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-black uppercase hover:text-wtech-gold">Agenda</Link>
                    <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-black uppercase hover:text-wtech-gold">Contato</Link>
                    <div className="flex flex-col gap-4 mt-8 w-64">
                        <button onClick={() => { setIsMobileMenuOpen(false); if(!user) setShowLoginModal(true); }} className="w-full py-4 rounded-xl border border-gray-200 text-center font-bold uppercase hover:bg-gray-50">
                            {user ? <Link to="/admin">Painel Admin</Link> : 'Área do Membro'}
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="flex-grow bg-slate-50">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-wtech-black text-gray-400 py-12 border-t-4 border-wtech-gold">
        <div className="container mx-auto px-4 grid md:grid-cols-4 gap-8">
          <div>
            <img src={ASSETS.LOGO_URL} alt="W-TECH" className="h-10 mb-6 brightness-0 invert opacity-80" />
            <p className="text-sm leading-relaxed">
              Referência nacional em tecnologia de suspensão, oferecendo produtos de alta performance e educação técnica especializada.
            </p>
          </div>
          <div>
            <h3 className="text-white font-bold uppercase mb-4">Acesso Rápido</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/courses" className="hover:text-wtech-gold">Cursos e Eventos</Link></li>
              <li><Link to="/mechanics-map" className="hover:text-wtech-gold">Encontrar Mecânico</Link></li>
              <li><Link to="/glossary" className="hover:text-wtech-gold">Glossário Técnico</Link></li>
              <li><button onClick={() => setShowLoginModal(true)} className="hover:text-wtech-gold text-left">Painel Administrativo</button></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold uppercase mb-4">Contato</h3>
            <ul className="space-y-2 text-sm">
              <li>comercial@w-techbrasil.com.br</li>
              <li>(11) 99999-9999</li>
              <li>São Paulo, SP</li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold uppercase mb-4">Newsletter</h3>
            <p className="text-xs mb-4">Receba dicas técnicas e agenda de cursos.</p>
            <form className="flex flex-col gap-2">
              <input 
                type="email" 
                placeholder="Seu e-mail" 
                className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-wtech-gold"
              />
              <button className="bg-wtech-gold text-wtech-black font-bold py-2 rounded hover:bg-white transition-colors">
                Inscrever
              </button>
            </form>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-12 pt-8 border-t border-gray-800 text-center text-xs">
          <p>&copy; {new Date().getFullYear()} W-TECH Brasil. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;