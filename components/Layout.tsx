import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, User as UserIcon, LogIn, Instagram, Facebook, Youtube, MessageCircle, Mail, Phone, MapPin, Home, GraduationCap, FileText, Calendar, ArrowRight } from 'lucide-react';
import { ASSETS } from '../constants';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import CartDrawer from './CartDrawer';
import LoginModal from './LoginModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { toggleCart, items } = useCart();
  const { user, setShowLoginModal, logout } = useAuth();
  const { get } = useSettings();

  const siteTitle = get('site_title', 'W-TECH');
  const logoUrl = get('logo_url', ASSETS.LOGO_URL);
  const contactEmail = get('email_contato', 'comercial@w-techbrasil.com.br');
  const contactPhone = get('phone_main', '(11) 99999-9999');
  const contactAddr = get('address', 'São Paulo, SP');

  // Fetch Socials
  const instagram = get('instagram', '');
  const facebook = get('facebook', '');
  const youtube = get('youtube', ''); 
  const whatsapp = get('whatsapp_phone', '');



  const MobileMenuItem = ({ icon: Icon, label, to, onClick }: { icon: any, label: string, to: string, onClick: () => void }) => (
    <Link to={to} onClick={onClick} className="flex flex-col items-center gap-3 group">
        <motion.div 
            whileTap={{ scale: 0.9 }}
            className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-lg group-hover:bg-white/20 transition-colors"
        >
            <Icon size={28} />
        </motion.div>
        <span className="text-xs font-medium text-white/90 text-center">{label}</span>
    </Link>
  );

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
            <Link to="/suporte" className="hover:text-wtech-gold transition-colors">Suporte</Link>
          </div>
        </div>
      </div>

      {/* Header - Modern Standardized */}
      <nav className="sticky top-0 w-full z-[1000] bg-white/95 backdrop-blur-xl border-b border-gray-100 transition-all duration-300">
        <div className="container mx-auto px-6 h-24 flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 z-50">
                {logoUrl ? (
                    <img src={logoUrl} alt={siteTitle} className="h-12 w-auto object-contain" />
                ) : (
                    <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-bold text-2xl rounded-lg">W</div>
                )}
            </Link>
            
            {/* Desktop Menu */}
            <div className="hidden lg:flex gap-8 text-sm font-bold text-gray-600 uppercase tracking-wide">
                <Link to="/" className="hover:text-wtech-gold hover:scale-105 transition-all">Início</Link>
                <Link to="/cursos" className="hover:text-wtech-gold hover:scale-105 transition-all">Cursos</Link>
                <Link to="/mapa" className="hover:text-wtech-gold hover:scale-105 transition-all">Rede Credenciada</Link>
                <Link to="/blog" className="hover:text-wtech-gold hover:scale-105 transition-all">Blog</Link>
                <Link to="/cursos" className="hover:text-wtech-gold hover:scale-105 transition-all">Agenda</Link>
                <Link to="/contato" className="hover:text-wtech-gold hover:scale-105 transition-all">Contato</Link>
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
                <Link to="/cursos" className="px-6 py-3 rounded-full bg-wtech-black text-white text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 uppercase">
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

      </nav>

              {/* Mobile Menu Overlay (iOS Glass Style) - Moved OUTSIDE nav to fix z-index/fixed positioning issues */}
         <AnimatePresence>
            {isMobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    animate={{ opacity: 1, backdropFilter: "blur(16px)" }}
                    exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    className="fixed inset-0 z-[9999] bg-black/90 flex flex-col pt-24 px-6 items-center"
                >
                    {/* Close Button Area (Invisible click handler for top part if needed, or just X button within layout) */}
                    
                    {/* Grid Layout - iPhone App Style */}
                    <div className="w-full max-w-sm grid grid-cols-3 gap-y-8 gap-x-4">
                        <MobileMenuItem icon={Home} label="Início" to="/" onClick={() => setIsMobileMenuOpen(false)} />
                        <MobileMenuItem icon={GraduationCap} label="Cursos" to="/cursos" onClick={() => setIsMobileMenuOpen(false)} />
                        <MobileMenuItem icon={MapPin} label="Rede" to="/mapa" onClick={() => setIsMobileMenuOpen(false)} />
                        <MobileMenuItem icon={FileText} label="Blog" to="/blog" onClick={() => setIsMobileMenuOpen(false)} />
                        <MobileMenuItem icon={Calendar} label="Agenda" to="/cursos" onClick={() => setIsMobileMenuOpen(false)} />
                        <MobileMenuItem icon={MessageCircle} label="Contato" to="/contato" onClick={() => setIsMobileMenuOpen(false)} />
                        
                        {/* Member Area Special Item */}
                        <motion.button 
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { setIsMobileMenuOpen(false); if(!user) setShowLoginModal(true); }}
                            className="col-span-3 mt-4 bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-wtech-gold flex items-center justify-center text-black font-bold shadow-lg">
                                    {user ? <UserIcon size={24} /> : <LogIn size={24} />}
                                </div>
                                <div className="text-left">
                                    <div className="text-white font-bold text-lg">{user ? 'Painel Admin' : 'Área do Membro'}</div>
                                    <div className="text-white/60 text-xs">{user ? 'Gerenciar Sistema' : 'Fazer Login'}</div>
                                </div>
                            </div>
                            <ArrowRight className="text-white/40" />
                        </motion.button>
                        
                         {/* Socials Row */}
                         <div className="col-span-3 flex justify-center gap-6 mt-8">
                            {instagram && <a href={instagram} target="_blank" className="text-white/80 hover:text-white transition-colors"><Instagram size={24} /></a>}
                            {whatsapp && <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" className="text-white/80 hover:text-white transition-colors"><MessageCircle size={24} /></a>}
                            {youtube && <a href={youtube} target="_blank" className="text-white/80 hover:text-white transition-colors"><Youtube size={24} /></a>}
                         </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>


      {/* Main Content */}
      <main className="flex-grow bg-slate-50">
        {children || <Outlet />}
      </main>

      {/* Footer */}
      <footer className="bg-wtech-black text-gray-400 py-12 border-t-4 border-wtech-gold">
        <div className="container mx-auto px-4 grid md:grid-cols-4 gap-8">
          <div>
            <img src={logoUrl} alt={siteTitle} className="h-10 mb-6 brightness-0 invert opacity-80" />
            <p className="text-sm leading-relaxed mb-6">
              Referência nacional em tecnologia de suspensão, oferecendo produtos de alta performance e educação técnica especializada.
            </p>
            {/* Social Icons */}
            <div className="flex gap-4">
                {instagram && (
                    <a href={instagram} target="_blank" rel="noreferrer" className="w-10 h-10 rounded bg-gray-800 flex items-center justify-center hover:bg-wtech-gold hover:text-black transition-all">
                        <Instagram size={20} />
                    </a>
                )}
                {facebook && (
                    <a href={facebook} target="_blank" rel="noreferrer" className="w-10 h-10 rounded bg-gray-800 flex items-center justify-center hover:bg-wtech-gold hover:text-black transition-all">
                        <Facebook size={20} />
                    </a>
                )}
                {youtube && (
                    <a href={youtube} target="_blank" rel="noreferrer" className="w-10 h-10 rounded bg-gray-800 flex items-center justify-center hover:bg-wtech-gold hover:text-black transition-all">
                        <Youtube size={20} />
                    </a>
                )}
                 {whatsapp && (
                    <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded bg-gray-800 flex items-center justify-center hover:bg-wtech-gold hover:text-black transition-all">
                        <MessageCircle size={20} />
                    </a>
                )}
            </div>
          </div>
          <div>
            <h3 className="text-white font-bold uppercase mb-4">Acesso Rápido</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/cursos" className="hover:text-wtech-gold">Cursos e Eventos</Link></li>
              <li><Link to="/mapa" className="hover:text-wtech-gold">Encontrar Mecânico</Link></li>
              <li><Link to="/glossario" className="hover:text-wtech-gold">Glossário Técnico</Link></li>
              <li><button onClick={() => setShowLoginModal(true)} className="hover:text-wtech-gold text-left">Painel Administrativo</button></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold uppercase mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/termos" className="hover:text-wtech-gold">Termos de Uso</Link></li>
              <li><Link to="/privacidade" className="hover:text-wtech-gold">Privacidade</Link></li>
              <li><Link to="/cancelamento" className="hover:text-wtech-gold">Política de Cancelamento</Link></li>
              <li><Link to="/suporte" className="hover:text-wtech-gold">Suporte</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold uppercase mb-4">Contato</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><Mail size={16} className="text-wtech-gold"/> {contactEmail}</li>
              <li className="flex items-center gap-2"><Phone size={16} className="text-wtech-gold"/> {contactPhone}</li>
              <li className="flex items-start gap-2"><MapPin size={16} className="text-wtech-gold shrink-0 mt-1"/> <span dangerouslySetInnerHTML={{__html: contactAddr}} /></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-12 pt-8 border-t border-gray-800 text-center text-xs">
          <p>&copy; {new Date().getFullYear()} {siteTitle}. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;