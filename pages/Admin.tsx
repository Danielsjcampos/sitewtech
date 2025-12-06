
import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, BookOpen, DollarSign, LayoutDashboard, 
  KanbanSquare, FileText, Settings, Bell, Search, 
  MoreVertical, ArrowRight, TrendingUp, Calendar as CalendarIcon,
  Plus, ChevronRight, ChevronLeft, CheckCircle, XCircle,
  Wrench, BadgeCheck, GraduationCap, ShoppingBag, Shield,
  CreditCard, ArrowUpRight, ArrowDownRight, Briefcase, Database,
  LogOut, Edit, Sparkles, Wand2, Trash2, List, Grid, Save, X, MapPin, Building,
  Image as ImageIcon, Loader2, Eye, MessageSquare, BarChart3, Globe, PenTool, Lock,
  Upload, Download, Monitor, Printer, Copy, UserPlus, TrendingDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lead, Mechanic, Order, User, UserRole, Transaction, Course, BlogPost, PostComment, LandingPage, Enrollment } from '../types';
import { supabase } from '../lib/supabaseClient';
import { seedDatabase } from '../lib/seedData';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { generateBlogPost } from '../lib/gemini';
import { LandingPageEditor } from './LandingPageEditor';

// --- Types for Local State ---
declare const L: any;

const MapPreview = ({ lat, lng }: { lat: number, lng: number }) => {
    const mapRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current && !mapRef.current) {
            mapRef.current = L.map(containerRef.current).setView([lat, lng], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);
            L.marker([lat, lng]).addTo(mapRef.current);
        } else if (mapRef.current) {
            mapRef.current.setView([lat, lng], 15);
            // Clear existing markers
            mapRef.current.eachLayer((layer: any) => {
                if (layer instanceof L.Marker) {
                    mapRef.current.removeLayer(layer);
                }
            });
            L.marker([lat, lng]).addTo(mapRef.current);
        }
    }, [lat, lng]);

    return <div ref={containerRef} className="w-full h-48 rounded-lg border border-gray-300 mt-2" />;
};

type View = 'dashboard' | 'crm' | 'ai_generator' | 'blog_manager' | 'settings' | 'students' | 'mechanics' | 'finance' | 'orders' | 'team' | 'courses_manager' | 'lp_builder';

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center p-3 my-1 rounded-lg transition-all duration-200 group ${
      active 
        ? 'bg-gradient-to-r from-wtech-gold to-yellow-600 text-black font-bold shadow-lg shadow-yellow-500/20' 
        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
    }`}
  >
    <Icon size={20} className={`${active ? 'text-black' : 'text-gray-500 group-hover:text-wtech-gold'} mr-3`} />
    <span className="text-sm tracking-wide">{label}</span>
  </button>
);

const RevenueChart = () => {
  const data = [10, 25, 18, 40, 35, 60, 55, 80, 75, 100];
  const max = 100;
  const points = data.map((d, i) => `${i * 100},${100 - (d / max) * 100}`).join(' ');
  
  return (
    <div className="w-full h-full relative overflow-hidden">
      <svg viewBox="0 0 900 100" className="w-full h-full preserve-3d">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`M0,100 ${points} L900,100 Z`} fill="url(#gradient)" />
        <polyline points={points} fill="none" stroke="#D4AF37" strokeWidth="3" />
        {data.map((d, i) => (
          <circle key={i} cx={i * 100} cy={100 - (d / max) * 100} r="4" fill="#111" stroke="#D4AF37" strokeWidth="2" />
        ))}
      </svg>
    </div>
  );
};

// --- View: Dashboard (Command Center) ---
const DashboardView = () => {
  const [stats, setStats] = useState({ 
      revenue: 0, 
      futureRevenue: 0, 
      leads: 0, 
      students: 0,
      activeCourses: 0
  });
  const [revenueHistory, setRevenueHistory] = useState<{date: string, value: number}[]>([]);
  const [mechanicsByState, setMechanicsByState] = useState<{state: string, count: number}[]>([]);

  useEffect(() => {
    async function fetchData() {
      // 1. Leads
      const { count: leadsCount } = await supabase.from('SITE_Leads').select('*', { count: 'exact', head: true });

      // 2. Enrollments & Revenue
      const { data: enrollments } = await supabase.from('SITE_Enrollments').select('*, course:SITE_Courses(price)');
      
      let realized = 0;
      let future = 0;
      let studentsCount = 0;
      
      if (enrollments) {
          studentsCount = enrollments.length;
          enrollments.forEach((e: any) => {
              const paid = e.amount_paid || 0;
              const price = e.course?.price || 0;
              realized += paid;
              future += (price - paid);
          });
      }

      // 3. Active Courses
      const { count: coursesCount } = await supabase.from('SITE_Courses').select('*', { count: 'exact', head: true });

      // 4. Mechanics by State (Mock or Real)
      // For now, let's assume we have state data or fetch it.
      const { data: mechanics } = await supabase.from('SITE_Mechanics').select('state');
      const stateMap: Record<string, number> = {};
      mechanics?.forEach((m:any) => {
          const s = m.state || 'SP'; // Default to SP if missing
          stateMap[s] = (stateMap[s] || 0) + 1;
      });
      const stateData = Object.entries(stateMap).map(([k,v]) => ({state: k, count: v})).sort((a,b) => b.count - a.count).slice(0, 5);

      setStats({ 
          revenue: realized, 
          futureRevenue: future, 
          leads: leadsCount || 0, 
          students: studentsCount,
          activeCourses: coursesCount || 0
      });
      setMechanicsByState(stateData);
      
      // Mock Revenue History for Chart (since we don't have historical sequence easy yet)
      // In real prod, group transactions by date.
      setRevenueHistory([
          { date: 'Jan', value: realized * 0.1 },
          { date: 'Fev', value: realized * 0.15 },
          { date: 'Mar', value: realized * 0.2 },
          { date: 'Abr', value: realized * 0.3 },
          { date: 'Mai', value: realized * 0.6 },
          { date: 'Jun', value: realized } // Current
      ]);
    }
    fetchData();
  }, []);

  // Custom SVG Area Chart
  const AreaChart = ({ data, color = "#d4af37" }: any) => {
      if(!data.length) return null;
      const height = 200;
      const width = 600;
      const max = Math.max(...data.map((d:any) => d.value));
      const points = data.map((d:any, i:number) => {
          const x = (i / (data.length - 1)) * width;
          const y = height - ((d.value / max) * height);
          return `${x},${y}`;
      }).join(' ');
      
      return (
          <div className="w-full overflow-hidden">
             <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
                    <stop offset="100%" stopColor={color} stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <path d={`M0,${height} ${points} ${width},${height}`} fill="url(#gradient)" />
                <polyline fill="none" stroke={color} strokeWidth="3" points={points} />
                {data.map((d:any, i:number) => (
                    <circle key={i} cx={(i / (data.length - 1)) * width} cy={height - ((d.value / max) * height)} r="4" fill="white" stroke={color} strokeWidth="2" />
                ))}
             </svg>
             <div className="flex justify-between mt-2 text-xs text-gray-400 font-bold uppercase">
                 {data.map((d:any) => <span key={d.date}>{d.date}</span>)}
             </div>
          </div>
      );
  };

  return (
    <div className="space-y-6 animate-fade-in text-gray-900 pb-10">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Receita Realizada', value: `R$ ${stats.revenue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, sub: 'Total recebido', icon: DollarSign, color: 'text-green-600 bg-green-50' },
          { label: 'Receita Futura', value: `R$ ${stats.futureRevenue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, sub: 'A receber de alunos', icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
          { label: 'Total de Leads', value: stats.leads, sub: 'Potenciais clientes', icon: Users, color: 'text-wtech-gold bg-yellow-50' },
          { label: 'Alunos Matriculados', value: stats.students, sub: `${stats.activeCourses} Cursos ativos`, icon: ShoppingBag, color: 'text-purple-600 bg-purple-50' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-all">
            <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{kpi.label}</p>
                <h3 className="text-2xl font-black text-gray-900">{kpi.value}</h3>
                <span className="text-xs text-gray-400 mt-1 block">{kpi.sub}</span>
            </div>
            <div className={`p-3 rounded-xl ${kpi.color}`}>
                <kpi.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <div>
                <h2 className="text-xl font-bold text-gray-900">Fluxo de Receita</h2>
                <p className="text-sm text-gray-500">Evolução do faturamento (Semestral)</p>
            </div>
            <div className="flex gap-2">
                <span className="flex items-center gap-1 text-xs font-bold text-gray-500"><div className="w-2 h-2 rounded-full bg-wtech-gold"></div>Receita</span>
            </div>
          </div>
          <div className="h-64 flex items-end">
            <AreaChart data={revenueHistory} color="#d4af37" />
          </div>
        </div>

        {/* Mechanics Distribution */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
             <h2 className="text-lg font-bold text-gray-900 mb-2">Credenciados</h2>
             <p className="text-sm text-gray-500 mb-6">Top 5 Estados com mais oficinas</p>
             
             <div className="space-y-4">
                 {mechanicsByState.map((item, idx) => (
                     <div key={idx} className="flex items-center gap-3">
                         <span className="w-8 text-xs font-bold text-gray-400">#{idx+1}</span>
                         <div className="flex-grow">
                             <div className="flex justify-between text-sm font-bold mb-1">
                                 <span>{item.state}</span>
                                 <span className="text-gray-500">{item.count}</span>
                             </div>
                             <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                 <div className="h-full bg-wtech-black" style={{ width: `${(item.count / (mechanicsByState[0]?.count || 1)) * 100}%` }}></div>
                             </div>
                         </div>
                     </div>
                 ))}
                 {mechanicsByState.length === 0 && <p className="text-sm text-gray-400 italic">Sem dados de localização.</p>}
             </div>
             
             <button className="w-full mt-8 py-3 bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100 rounded-lg">Ver Relatório Completo</button>
        </div>
      </div>
    </div>
  );
}

// --- View: CRM (Kanban) ---
const KanbanColumn = ({ title, leads, status, onMove }: any) => (
    <div className="bg-gray-100 rounded-lg p-3 min-w-[280px] flex flex-col h-full text-gray-900">
      <h3 className="font-bold text-gray-700 mb-3 px-1">{title} ({leads.length})</h3>
      <div className="space-y-3 overflow-y-auto custom-scrollbar flex-grow">
        {leads.map((lead: any) => (
          <div key={lead.id} className="bg-white p-4 rounded shadow-sm border-l-4 border-wtech-gold relative group">
            <h4 className="font-bold text-gray-900">{lead.name}</h4>
            <p className="text-xs text-gray-600">{lead.email}</p>
             <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1">
               {status !== 'New' && <button onClick={() => onMove(lead.id, 'prev')} className="p-1 bg-gray-200 rounded text-gray-700"><ChevronLeft size={14}/></button>}
               {status !== 'Converted' && <button onClick={() => onMove(lead.id, 'next')} className="p-1 bg-wtech-black text-white rounded"><ChevronRight size={14}/></button>}
            </div>
          </div>
        ))}
      </div>
    </div>
);

const CRMView = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  useEffect(() => {
    const fetch = async () => {
        const { data } = await supabase.from('SITE_Leads').select('*');
        if (data) setLeads(data.map((l:any) => ({...l, contextId: l.context_id, createdAt: l.created_at})));
    }
    fetch();
  }, []);
  const moveLead = async (id: string, dir: 'next' | 'prev') => {
      const statuses = ['New', 'Contacted', 'Negotiating', 'Converted'];
      const l = leads.find(x => x.id === id);
      if(!l) return;
      const newIdx = statuses.indexOf(l.status) + (dir === 'next' ? 1 : -1);
      if(newIdx >= 0 && newIdx <= 3) {
          const newStatus = statuses[newIdx];
          setLeads(prev => prev.map(x => x.id === id ? {...x, status: newStatus as any} : x));
          await supabase.from('SITE_Leads').update({status: newStatus}).eq('id', id);
      }
  };
  return (
    <div className="h-[calc(100vh-140px)] flex gap-4 overflow-x-auto pb-4 text-gray-900">
        <KanbanColumn title="Novos" status="New" leads={leads.filter(l => l.status === 'New')} onMove={moveLead} />
        <KanbanColumn title="Em Contato" status="Contacted" leads={leads.filter(l => l.status === 'Contacted')} onMove={moveLead} />
        <KanbanColumn title="Em Negociação" status="Negotiating" leads={leads.filter(l => l.status === 'Negotiating')} onMove={moveLead} />
        <KanbanColumn title="Fechado" status="Converted" leads={leads.filter(l => l.status === 'Converted')} onMove={moveLead} />
    </div>
  );
};




// --- View: Blog Manager (List & Edit + AI) ---
const BlogManagerView = () => {
    const [viewMode, setViewMode] = useState<'list' | 'edit' | 'ai_batch'>('list');
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
    const [comments, setComments] = useState<PostComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const { user } = useAuth();
    const [formData, setFormData] = useState<Partial<BlogPost>>({});
    
    // AI State
    const [showAI, setShowAI] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const [aiGenerating, setAiGenerating] = useState(false);

    // AI Batch State
    const [batchTopic, setBatchTopic] = useState('');
    const [batchKeywords, setBatchKeywords] = useState('');
    const [batchGenerating, setBatchGenerating] = useState(false);
    const [batchSuccess, setBatchSuccess] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        const { data } = await supabase.from('SITE_BlogPosts').select('*').order('date', { ascending: false });
        if (data) setPosts(data.map((p: any) => ({
             ...p, 
             seoScore: p.seo_score, 
             seoDescription: p.seo_description, 
             seoTitle: p.seo_title 
        })));
    };

    const handleEdit = async (post?: BlogPost) => {
        if (post) {
            setSelectedPost(post);
            setFormData(post);
            const { data } = await supabase.from('SITE_PostComments').select('*').eq('post_id', post.id).order('created_at', {ascending: true});
            if(data) setComments(data.map((c:any) => ({...c, postId: c.post_id, userName: c.user_name, createdAt: c.created_at})));
        } else {
            setSelectedPost(null);
            setFormData({ status: 'Draft', content: '', title: '' });
            setComments([]);
        }
        setViewMode('edit');
    };

    const handleSave = async () => {
        const score = calculateSeoScore(formData);
        
        const payload = {
            title: formData.title,
            content: formData.content,
            slug: formData.slug,
            excerpt: formData.excerpt,
            seo_title: formData.seoTitle,
            seo_description: formData.seoDescription,
            status: formData.status,
            seo_score: score,
            image: formData.image,
            author: formData.author || user?.name || 'Admin',
            category: formData.category || 'Blog'
        };

        if(selectedPost && selectedPost.id) {
            await supabase.from('SITE_BlogPosts').update(payload).eq('id', selectedPost.id);
        } else {
             await supabase.from('SITE_BlogPosts').insert([payload]);
        }

        alert('Post salvo com sucesso!');
        setViewMode('list');
        fetchPosts();
    };

    const handleGenerateAI = async () => {
        if (!aiTopic) return alert("Digite um tópico.");
        setAiGenerating(true);
        try {
            const aiPost = await generateBlogPost(aiTopic, []);
            setFormData({
                ...formData,
                title: aiPost.title,
                slug: aiPost.slug,
                excerpt: aiPost.excerpt,
                content: aiPost.content,
                seoTitle: aiPost.title,
                seoDescription: aiPost.seo_description,
                image: `https://image.pollinations.ai/prompt/${encodeURIComponent(aiTopic)}?width=800&height=400&nologo=true`
            });
            setShowAI(false);
        } catch (error: any) {
            alert("Erro IA: " + error.message);
        } finally {
            setAiGenerating(false);
        }
    };

    const handleComment = async () => {
        if(!newComment || !selectedPost || !user) return;
        await supabase.from('SITE_PostComments').insert({
            post_id: selectedPost.id,
            user_name: user.name,
            content: newComment
        });
        setNewComment('');
        // Refresh comments
    };

    const calculateSeoScore = (data: Partial<BlogPost>) => {
        let score = 50; 
        if(data.title && data.title.length > 30 && data.title.length < 60) score += 10;
        if(data.seoDescription && data.seoDescription.length > 120 && data.seoDescription.length < 160) score += 10;
        if(data.content && data.content.length > 500) score += 20;
        if(data.slug && !data.slug.includes(' ')) score += 10;
        return Math.min(100, score);
    };

    const handleGenerateBatch = async () => {
        if (!batchTopic || !batchKeywords) return alert("Preencha os tópicos e palavras-chave");
        
        setBatchGenerating(true);
        setBatchSuccess(false);
        try {
            const keywordList = batchKeywords.split(',').map(k => k.trim());
            const topicsList = batchTopic.split(',').map(t => t.trim());
    
            for (const t of topicsList) {
                 const aiPost = await generateBlogPost(t, keywordList);
                 let coverImage = aiPost.image_prompt 
                    ? `https://image.pollinations.ai/prompt/${encodeURIComponent(aiPost.image_prompt)}?width=800&height=400&nologo=true`
                    : `https://image.pollinations.ai/prompt/${encodeURIComponent(t)}?width=800&height=400&nologo=true`;
    
                 await supabase.from('SITE_BlogPosts').insert([{
                     title: aiPost.title,
                     slug: aiPost.slug,
                     excerpt: aiPost.excerpt,
                     content: aiPost.content,
                     seo_description: aiPost.seo_description,
                     keywords: aiPost.tags,
                     status: 'Draft',
                     author: 'W-TECH AI',
                     category: 'Blog',
                     image: coverImage,
                     seo_score: Math.floor(Math.random() * (95 - 70) + 70), // Initial AI Score mock
                     views: 0,
                     clicks: 0
                 }]);
            }
            setBatchSuccess(true);
            setBatchTopic('');
            setBatchKeywords('');
            // Don't switch view yet, let user see success
        } catch (error: any) {
            alert("Erro: " + error.message);
        } finally {
            setBatchGenerating(false);
        }
    };

    const currentScore = calculateSeoScore(formData);

    if (viewMode === 'edit') {
        return (
            <div className="flex h-full gap-6 text-gray-900">
                <div className="flex-grow bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setViewMode('list')} className="text-gray-500 hover:text-black"><ArrowRight className="rotate-180" /></button>
                            <h2 className="font-bold text-lg text-gray-900">Editor de Postagem</h2>
                            <button onClick={() => setShowAI(!showAI)} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-2 shadow-sm hover:shadow-md transition-all">
                                <Sparkles size={12} /> {showAI ? 'Fechar IA' : 'Gerar com IA'}
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <select 
                                className="border border-gray-300 p-2 rounded text-sm text-gray-900 bg-white" 
                                value={formData.status} 
                                onChange={e => setFormData({...formData, status: e.target.value as any})}
                            >
                                <option value="Draft">Rascunho</option>
                                <option value="Published">Publicado</option>
                            </select>
                            <button onClick={handleSave} className="bg-wtech-gold text-black px-4 py-2 rounded font-bold text-sm flex items-center gap-2">
                                <Save size={16} /> Salvar
                            </button>
                        </div>
                    </div>

                    {showAI && (
                        <div className="bg-purple-50 p-4 border-b border-purple-100 animate-in slide-in-from-top-2">
                            <div className="flex gap-2">
                                <input 
                                    className="flex-grow border border-purple-200 rounded p-2 text-sm" 
                                    placeholder="Sobre o que você quer escrever? Ex: Manutenção de freios ABS em motos esportivas"
                                    value={aiTopic}
                                    onChange={e => setAiTopic(e.target.value)}
                                />
                                <button 
                                    onClick={handleGenerateAI}
                                    disabled={aiGenerating}
                                    className="bg-purple-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {aiGenerating ? <Loader2 className="animate-spin"/> : 'Gerar Conteúdo'}
                                </button>
                            </div>
                            <p className="text-[10px] text-purple-600 mt-1">* A IA vai preencher o título, slug, resumo e conteúdo automaticamente.</p>
                        </div>
                    )}

                    <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título do Post</label>
                            <input className="w-full text-2xl font-bold border-b border-gray-200 text-gray-900 bg-transparent focus:border-wtech-gold outline-none py-2" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
                         </div>

                         <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Slug (URL)</label>
                                <input className="w-full border border-gray-300 p-2 rounded text-sm text-gray-900" value={formData.slug || ''} onChange={e => setFormData({...formData, slug: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Imagem URL</label>
                                <input className="w-full border border-gray-300 p-2 rounded text-sm text-gray-900" value={formData.image || ''} onChange={e => setFormData({...formData, image: e.target.value})} />
                            </div>
                         </div>

                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Resumo (Excerpt)</label>
                            <textarea rows={2} className="w-full border border-gray-300 p-2 rounded text-sm text-gray-900" value={formData.excerpt || ''} onChange={e => setFormData({...formData, excerpt: e.target.value})} />
                         </div>

                         <div className="flex-grow">
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-2">
                                <FileText size={14}/> Conteúdo (HTML)
                             </label>
                             <textarea 
                                className="w-full h-96 border border-gray-300 p-4 rounded font-mono text-sm leading-relaxed text-gray-900 focus:border-wtech-gold outline-none" 
                                value={formData.content || ''} 
                                onChange={e => setFormData({...formData, content: e.target.value})} 
                             />
                         </div>
                    </div>
                </div>

                <div className="w-72 flex-shrink-0 flex flex-col gap-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><BarChart3 size={18} /> SEO Score</h3>
                        <div className="flex items-center justify-center relative w-24 h-24 mx-auto mb-4">
                             <span className="absolute text-xl font-bold text-gray-900">{currentScore}</span>
                             <div className="w-full h-full rounded-full border-4 border-gray-100 border-t-wtech-gold animate-spin-slow"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (viewMode === 'ai_batch') {
        return (
             <div className="flex h-full gap-6 text-gray-900 justify-center items-start pt-10">
                 <div className="max-w-4xl w-full bg-white p-8 rounded-xl shadow-sm border border-gray-100 relative">
                    <button onClick={() => setViewMode('list')} className="absolute top-4 left-4 p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <ArrowRight className="rotate-180" size={24}/>
                    </button>

                    <div className="flex items-center gap-3 mb-6 ml-10">
                        <div className="bg-wtech-black p-2 rounded text-wtech-gold"><Sparkles size={24} /></div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Gerador de Conteúdo IA em Lote</h2>
                            <p className="text-xs text-gray-500">Crie múltiplos artigos otimizados para SEO automaticamente.</p>
                        </div>
                    </div>

                    {batchSuccess && (
                        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg flex justify-between items-center">
                            <div>
                                <strong>Sucesso!</strong> Artigos gerados como rascunho.
                            </div>
                            <button onClick={() => { setViewMode('list'); fetchPosts(); }} className="text-sm font-bold underline hover:text-green-900">
                                Voltar para Lista
                            </button>
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tópicos (Separe por vírgula)</label>
                            <textarea 
                                rows={4}
                                className="w-full border border-gray-300 p-3 rounded text-gray-900 focus:border-wtech-gold focus:ring-1 focus:ring-wtech-gold outline-none" 
                                value={batchTopic} 
                                onChange={e => setBatchTopic(e.target.value)} 
                                placeholder="Ex: Suspensão a Ar, Freios ABS, Troca de Óleo" 
                            />
                            <p className="text-[10px] text-gray-400 mt-1">A IA criará um artigo único com imagem de capa para cada tópico.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Palavras-chave SEO (Separe por vírgula)</label>
                            <textarea 
                                rows={4}
                                className="w-full border border-gray-300 p-3 rounded text-gray-900 focus:border-wtech-gold focus:ring-1 focus:ring-wtech-gold outline-none" 
                                value={batchKeywords} 
                                onChange={e => setBatchKeywords(e.target.value)} 
                                placeholder="Ex: motos, performance, oficina, manutenção" 
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleGenerateBatch} 
                        disabled={batchGenerating} 
                        className="mt-6 w-full bg-gradient-to-r from-wtech-gold to-yellow-600 text-black font-bold py-4 rounded-lg flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                    >
                        {batchGenerating ? <><Loader2 className="animate-spin" /> Gerando Artigos e Imagens...</> : <><Sparkles /> GERAR CONTEÚDO EM LOTE</>}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden text-gray-900">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                 <div>
                    <h2 className="text-xl font-bold text-gray-800">Gerenciador de Blog</h2>
                    <p className="text-xs text-gray-500">Edite, aprove e analise a performance dos posts.</p>
                 </div>
                 <div className="flex gap-2">
                     <button onClick={() => handleEdit()} className="bg-wtech-black text-white px-4 py-2 rounded font-bold text-sm hover:opacity-80">
                         + Novo Post
                     </button>
                     <button onClick={() => setViewMode('ai_batch')} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded font-bold text-sm hover:opacity-80 flex items-center gap-2">
                         <Sparkles size={16}/> Gerar em Lote (IA)
                     </button>
                 </div>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs sticky top-0">
                        <tr>
                            <th className="px-6 py-3">Título</th>
                            <th className="px-6 py-3">Autor</th>
                            <th className="px-6 py-3 text-center">SEO</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {posts.map(post => (
                            <tr key={post.id} className="hover:bg-gray-50 group">
                                <td className="px-6 py-4 font-medium text-gray-900 max-w-xs truncate">{post.title}</td>
                                <td className="px-6 py-4 text-gray-500">{post.author}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`font-bold ${post.seoScore && post.seoScore > 80 ? 'text-green-600' : 'text-yellow-600'}`}>{post.seoScore || '-'}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${post.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {post.status === 'Published' ? 'Publicado' : 'Rascunho'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button 
                                        onClick={() => handleEdit(post)}
                                        className="text-wtech-gold font-bold hover:underline flex items-center gap-1"
                                    >
                                        <Edit size={14} /> Editar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- View: Landing Page Builder (New) ---
const LandingPagesView = () => {
    const [pages, setPages] = useState<LandingPage[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<LandingPage>>({});
    
    // Hardcoded System Links for easier access
    const systemLinks = [
        { label: 'Home (Início)', url: 'https://w-techbrasil.com.br/#/' },
        { label: 'Cursos & Agenda', url: 'https://w-techbrasil.com.br/#/courses' },
        { label: 'Mapa da Rede', url: 'https://w-techbrasil.com.br/#/mechanics-map' },
        { label: 'Blog', url: 'https://w-techbrasil.com.br/#/blog' },
        { label: 'Glossário Técnico', url: 'https://w-techbrasil.com.br/#/glossary' },
        { label: 'Página de Contato', url: 'https://w-techbrasil.com.br/#/contact' },
        { label: 'Cadastro de Mecânico', url: 'https://w-techbrasil.com.br/#/register-mechanic' },
        { label: 'Painel Admin', url: 'https://w-techbrasil.com.br/#/admin' },
    ];

    useEffect(() => {
        fetchPages();
    }, []);

    const fetchPages = async () => {
        const { data } = await supabase.from('SITE_LandingPages').select('*').order('created_at', { ascending: false });
        if (data) setPages(data.map((p: any) => ({
             ...p,
             heroHeadline: p.hero_headline,
             heroSubheadline: p.hero_subheadline,
             heroImage: p.hero_image,
             viewCount: p.view_count,
             conversionCount: p.conversion_count
        })));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            title: formData.title,
            slug: formData.slug,
            hero_headline: formData.heroHeadline,
            hero_subheadline: formData.heroSubheadline,
            hero_image: formData.heroImage,
            features: formData.features,
            status: formData.status || 'Draft'
        };

        if (formData.id) {
            await supabase.from('SITE_LandingPages').update(payload).eq('id', formData.id);
        } else {
            await supabase.from('SITE_LandingPages').insert([payload]);
        }
        setIsEditing(false);
        fetchPages();
    };

    if (isEditing) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm text-gray-900">
                <h2 className="text-xl font-bold mb-6 text-gray-900">{formData.id ? 'Editar LP' : 'Nova Landing Page'}</h2>
                <form onSubmit={handleSave} className="grid grid-cols-2 gap-6 text-gray-900">
                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-700">Título Interno</label>
                        <input className="w-full border border-gray-300 p-2 rounded text-gray-900" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-700">Slug (URL)</label>
                        <div className="flex items-center gap-2">
                             <span className="text-xs text-gray-400">w-tech.com/#/lp/</span>
                             <input className="flex-grow border border-gray-300 p-2 rounded text-gray-900" value={formData.slug || ''} onChange={e => setFormData({...formData, slug: e.target.value})} required />
                        </div>
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-bold mb-1 text-gray-700">Headline (Título Principal)</label>
                        <input className="w-full border border-gray-300 p-2 rounded text-gray-900 font-bold text-lg" value={formData.heroHeadline || ''} onChange={e => setFormData({...formData, heroHeadline: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-bold mb-1 text-gray-700">Subheadline</label>
                        <textarea className="w-full border border-gray-300 p-2 rounded text-gray-900" rows={2} value={formData.heroSubheadline || ''} onChange={e => setFormData({...formData, heroSubheadline: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-bold mb-1 text-gray-700">Imagem de Capa (URL)</label>
                        <input className="w-full border border-gray-300 p-2 rounded text-gray-900" value={formData.heroImage || ''} onChange={e => setFormData({...formData, heroImage: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                         <label className="block text-sm font-bold mb-1 text-gray-700">Lista de Benefícios (Features)</label>
                         <p className="text-xs text-gray-500 mb-2">Separe itens por vírgula</p>
                         <textarea 
                            className="w-full border border-gray-300 p-2 rounded text-gray-900" 
                            rows={4} 
                            value={Array.isArray(formData.features) ? formData.features.join(', ') : formData.features || ''} 
                            onChange={e => setFormData({...formData, features: e.target.value.split(',').map(s=>s.trim())})} 
                         />
                    </div>
                    <div className="col-span-2 flex justify-end gap-2">
                        <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 border rounded text-gray-700">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-wtech-gold font-bold rounded">Salvar LP</button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="text-gray-900">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold">Construtor de Landing Pages</h2>
                    <p className="text-xs text-gray-500">Crie páginas de alta conversão para campanhas específicas.</p>
                </div>
                <button onClick={() => { setFormData({}); setIsEditing(true); }} className="bg-wtech-gold text-black px-4 py-2 rounded font-bold flex items-center gap-2">
                    <Plus size={18} /> Nova LP
                </button>
            </div>



            <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-bold text-gray-700 mb-2 text-sm uppercase">Links Internos do Sistema</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {systemLinks.map((link, idx) => (
                        <div key={idx} className="flex flex-col text-xs">
                            <span className="font-bold text-gray-900">{link.label}</span>
                            <code className="bg-gray-200 p-1 rounded mt-1 truncate hover:text-clip select-all cursor-pointer" title="Clique para selecionar">{link.url}</code>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pages.map(page => (
                    <div key={page.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <div className="h-32 bg-gray-200 relative">
                             {page.heroImage && <img src={page.heroImage} className="w-full h-full object-cover" />}
                             <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold uppercase">
                                 {page.status}
                             </div>
                        </div>
                        <div className="p-4 flex-grow">
                             <h3 className="font-bold text-gray-900 mb-1">{page.title}</h3>
                             <p className="text-xs text-gray-500 mb-4 truncate">/lp/{page.slug}</p>
                             
                             <div className="flex gap-4 text-xs text-gray-600 mb-4">
                                 <span className="flex items-center gap-1"><Eye size={12}/> {page.viewCount} views</span>
                                 <span className="flex items-center gap-1 text-green-600 font-bold"><TrendingUp size={12}/> {page.conversionCount} leads</span>
                             </div>
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                             <button onClick={() => { setFormData(page); setIsEditing(true); }} className="flex-1 py-2 text-xs font-bold bg-white border border-gray-200 rounded hover:bg-gray-100 text-gray-700">Editar</button>
                             <a href={`/#/lp/${page.slug}`} target="_blank" className="flex-1 py-2 text-xs font-bold bg-wtech-black text-white rounded hover:bg-gray-800 text-center flex items-center justify-center gap-1">
                                 Visualizar <ArrowUpRight size={10} />
                             </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


// --- View: Courses Manager (List/Calendar) ---
const CoursesManagerView = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingLandingPage, setEditingLandingPage] = useState<Course | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [formData, setFormData] = useState<Partial<Course>>({});



  const handleBlurCEP = async (e: React.FocusEvent<HTMLInputElement>) => {
      const cep = e.target.value.replace(/\D/g, '');
      if (cep.length === 8) {
          try {
              const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
              const data = await response.json();
              if (!data.erro) {
                  setFormData(prev => ({
                      ...prev,
                      address: data.logradouro,
                      addressNumber: '', // Clear number as it's not in CEP data
                      addressNeighborhood: data.bairro,
                      city: data.localidade,
                      state: data.uf,
                      location: `${data.localidade} - ${data.uf}` // Sync with main location field
                  }));
                  // Optional: Trigger geocode immediately if number is already present (unlikely on fresh paste)
              } else {
                  alert('CEP não encontrado.');
              }
          } catch (error) {
              console.error('Erro ao buscar CEP:', error);
          }
      }
  };

  const handleGeocodeCourse = async () => {
      if(!formData.address || !formData.city) {
          alert('Preencha o endereço e cidade para buscar o PIN.');
          return;
      }
      const query = `${formData.address}, ${formData.addressNumber || ''}, ${formData.city}, ${formData.state || ''}`;
      try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
          const data = await response.json();
          if(data && data.length > 0) {
              const { lat, lon } = data[0];
              setFormData(prev => ({
                  ...prev,
                  latitude: parseFloat(lat),
                  longitude: parseFloat(lon),
                  mapUrl: `https://www.google.com/maps?q=${lat},${lon}` // Auto-generate Map URL
              }));
              alert(`PIN encontrado: ${lat}, ${lon}`);
          } else {
              alert('Endereço não encontrado no mapa.');
          }
      } catch (e) {
          console.error(e);
          alert('Erro na geolocalização.');
      }
  };

  // Enrollment State
  const [showEnrollments, setShowEnrollments] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  
  // Calendar Navigation State
  const [currentDate, setCurrentDate] = useState(new Date());

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showPastCourses, setShowPastCourses] = useState(true);
  const [calendarViewMode, setCalendarViewMode] = useState<'Month' | 'Week' | 'Year'>('Month');

  // Filtered Data
  const filteredCourses = courses.filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.location?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const courseDate = new Date(c.date);
      const isPast = courseDate < new Date(new Date().setHours(0,0,0,0));
      const matchesPast = showPastCourses ? true : !isPast;

      const matchesDateRange = (!dateRange.start || courseDate >= new Date(dateRange.start)) &&
                               (!dateRange.end || courseDate <= new Date(dateRange.end));

      return matchesSearch && matchesPast && matchesDateRange;
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const { data } = await supabase.from('SITE_Courses').select('*, SITE_Enrollments(count)').order('date', { ascending: true });
    if(data) setCourses(data.map((c:any) => ({
        ...c, 
        locationType: c.location_type, 
        registeredCount: c.SITE_Enrollments?.[0]?.count || 0, 
        hotelsInfo: c.hotels_info,
        startTime: c.start_time,
        endTime: c.end_time,
        dateEnd: c.date_end,
        mapUrl: c.map_url,
        zipCode: c.zip_code,
        addressNumber: c.address_number,
        addressNeighborhood: c.address_neighborhood
    })));
  };

  const handleEdit = (course?: Course) => {
    if (course) {
      setFormData(course);
    } else {
      setFormData({});
    }
    setIsEditing(true);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
        title: formData.title,
        description: formData.description,
        instructor: formData.instructor,
        date: formData.date,
        date_end: formData.dateEnd,
        start_time: formData.startTime,
        end_time: formData.endTime,
        location: formData.location, // Defines the "Display Location" (Header)
        location_type: formData.locationType,
        map_url: formData.mapUrl,
        schedule: formData.schedule,
        price: formData.price,
        capacity: formData.capacity,
        image: formData.image,
        hotels_info: formData.hotelsInfo,
        status: formData.status || 'Draft',
        // Address Fields
        zip_code: formData.zipCode,
        address: formData.address,
        address_number: formData.addressNumber,
        address_neighborhood: formData.addressNeighborhood,
        city: formData.city,
        state: formData.state,
        latitude: formData.latitude,
        longitude: formData.longitude
    };

    if (formData.id) {
        await supabase.from('SITE_Courses').update(payload).eq('id', formData.id);
    } else {
        await supabase.from('SITE_Courses').insert([payload]);
    }
    setIsEditing(false);
    fetchCourses();
  };
  
    const handleDuplicate = (course: Course) => {
      const { id, registeredCount, ...rest } = course;
      const newCourse = {
          ...rest,
          title: `Cópia de ${course.title}`,
          status: 'Draft' as const,
          date: '', // Reset date to avoid confusion
          dateEnd: '',
          startTime: '',
          endTime: '',
          registeredCount: 0
      };
      setFormData(newCourse);
      setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
      if(!confirm('Tem certeza?')) return;
      await supabase.from('SITE_Courses').delete().eq('id', id);
      fetchCourses();
  };

  const downloadCoursesReport = () => {
      const headers = ['Título', 'Data', 'Horário', 'Local', 'Alunos Inscritos', 'Capacidade', 'Status', 'Valor Total Previsto'];
      const csvContent = [
          headers.join(','),
          ...courses.map(c => {
              const totalValue = (c.price || 0) * (c.registeredCount || 0);
              return [
                  `"${c.title}"`,
                  new Date(c.date).toLocaleDateString(),
                  `"${c.startTime} - ${c.endTime}"`,
                  `"${c.location} - ${c.city}/${c.state}"`,
                  c.registeredCount || 0,
                  c.capacity || 0,
                  c.status,
                  totalValue.toFixed(2)
              ].join(',');
          })
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `relatorio_cursos_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
  };

  const handlePrintCoursesReport = () => {
      const printWindow = window.open('', '', 'width=900,height=650');
      if (!printWindow) return;

      const html = `
        <html>
        <head>
            <title>Relatório de Cursos - W-TECH</title>
            <style>
                body { font-family: 'Helvetica', sans-serif; padding: 20px; }
                h1 { text-align: center; color: #333; }
                .meta { margin-bottom: 20px; font-size: 12px; color: #666; text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                .status-draft { color: orange; }
                .status-published { color: green; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .total { font-weight: bold; text-align: right; margin-top: 10px; }
            </style>
        </head>
        <body>
            <h1>Relatório de Cursos e Eventos</h1>
            <div class="meta">Gerado em: ${new Date().toLocaleString('pt-BR')}</div>
            
            <table>
                <thead>
                    <tr>
                        <th>Título</th>
                        <th>Data/Hora</th>
                        <th>Local</th>
                        <th>Inscritos</th>
                        <th>Capacidade</th>
                        <th>Status</th>
                        <th>Receita Prevista</th>
                        <th>Receita Realizada</th>
                    </tr>
                </thead>
                <tbody>
                    ${courses.map(c => {
                        const potential = (c.price || 0) * (c.capacity || 0);
                        const expected = (c.price || 0) * (c.registeredCount || 0);
                        return `
                        <tr>
                            <td>${c.title}</td>
                            <td>${new Date(c.date).toLocaleDateString()} ${c.startTime || ''}</td>
                            <td>${c.location}</td>
                            <td>${c.registeredCount || 0}</td>
                            <td>${c.capacity || 0}</td>
                            <td className="status-${c.status?.toLowerCase()}">${c.status}</td>
                            <td>R$ ${expected.toFixed(2)}</td>
                            <td>-</td> 
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            <div class="total">
                <p>Total de Registros: ${courses.length}</p>
            </div>
            <script>
                window.onload = function() { window.print(); window.close(); }
            </script>
        </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
  };



  const handleViewEnrollments = async (course: Course) => {
      setCurrentCourse(course);
      setShowEnrollments(true);
      const { data } = await supabase.from('SITE_Enrollments').select('*').eq('course_id', course.id);
      if(data) setEnrollments(data.map((e:any) => ({...e, courseId: e.course_id, studentName: e.student_name, studentEmail: e.student_email, studentPhone: e.student_phone, createdAt: e.created_at})));
      else setEnrollments([]);
  };

  const toggleCheckIn = async (enrollmentId: string, currentStatus: string) => {
      const newStatus = currentStatus === 'CheckedIn' ? 'Confirmed' : 'CheckedIn';
      await supabase.from('SITE_Enrollments').update({ status: newStatus }).eq('id', enrollmentId);
      setEnrollments(prev => prev.map(e => e.id === enrollmentId ? {...e, status: newStatus as any} : e));
  };

  const handleSettleBalance = async (enrollment: Enrollment, amount: number) => {
      const method = prompt('Qual o método de pagamento para o saldo restante? (Pix, Cartão, Dinheiro...)', 'Cartão');
      if (!method) return;

      if(!confirm(`Confirmar recebimento de R$ ${amount.toFixed(2)} via ${method}? Isso gerará uma nova receita no financeiro.`)) return;

      // 1. Update Enrollment
      const newTotal = (enrollment.amountPaid || 0) + amount;
      const { error: err1 } = await supabase.from('SITE_Enrollments').update({ 
          amount_paid: newTotal, 
          status: 'Confirmed' 
      }).eq('id', enrollment.id);
      
      if (err1) { alert('Erro ao atualizar aluno'); return; }

      // 2. Add Transaction
      const { error: err2 } = await supabase.from('SITE_Transactions').insert([{
          type: 'Income',
          category: 'Course Balance',
          description: `Saldo curso: ${currentCourse?.title} - Aluno: ${enrollment.studentName}`,
          amount: amount,
          payment_method: method,
          enrollment_id: enrollment.id,
          date: new Date().toISOString()
      }]);

      if (err2 && err2.code !== '42P01') { 
          // Ignore 42P01 (relation does not exist) if table missing, but warn user
          console.error(err2); 
          alert('Atenção: Transação não salva (Tabela financeira pode não existir), mas aluno foi atualizado.');
      }

      // Update Local State
      setEnrollments(prev => prev.map(e => e.id === enrollment.id ? {...e, amountPaid: newTotal, status: 'Confirmed'} : e));
      alert('Saldo quitado com sucesso!');
  };

  const printList = () => {
      const printWindow = window.open('', '', 'width=900,height=650');
      if (!printWindow) return;

      const html = `
        <html>
        <head>
            <title>Lista de Presença - ${currentCourse?.title}</title>
            <style>
                body { font-family: 'Helvetica', sans-serif; padding: 20px; }
                h1 { font-size: 20px; margin-bottom: 5px; }
                .subtitle { font-size: 14px; color: #666; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
                th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; text-transform: uppercase; font-size: 10px; }
                .check-col { width: 50px; text-align: center; }
                .check-box { width: 15px; height: 15px; border: 1px solid #333; display: inline-block; }
            </style>
        </head>
        <body>
            <h1>${currentCourse?.title}</h1>
            <div class="subtitle">
                Data: ${new Date(currentCourse?.date || '').toLocaleDateString()} • 
                Local: ${currentCourse?.location} • 
                Instrutor: ${currentCourse?.instructor}
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th class="check-col">Presença</th>
                        <th>Nome do Aluno</th>
                        <th>Contato</th>
                        <th>Status Pagamento</th>
                        <th>Assinatura</th>
                    </tr>
                </thead>
                <tbody>
                    ${enrollments.map((enr, i) => {
                        const balance = (currentCourse?.price || 0) - (enr.amountPaid || 0);
                        const paymentStatus = balance > 0 ? `Restam R$ ${balance.toFixed(2)}` : 'QUITADO';
                        return `
                        <tr>
                            <td class="check-col"><div class="check-box"></div></td>
                            <td><b>${i + 1}.</b> ${enr.studentName}</td>
                            <td>${enr.studentPhone || '-'}</td>
                            <td>${paymentStatus}</td>
                            <td></td> 
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            <script>
                window.onload = function() { window.print(); window.close(); }
            </script>
        </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
  };



  /* ENROLLMENT MANAGEMENT */
  const [editingEnrollment, setEditingEnrollment] = useState<Partial<Enrollment> | null>(null);

  const handleQuickAddStudent = (course: Course) => {
      setCurrentCourse(course);
      setShowEnrollments(true); // Open enrollment view
      setEditingEnrollment({ status: 'Confirmed', amountPaid: 0 }); // Open add modal immediately
  };

  const fetchEnrollments = async (courseId: string) => {
      const { data, error } = await supabase.from('SITE_Enrollments').select('*').eq('course_id', courseId).order('created_at', { ascending: true });
      if (data) {
          setEnrollments(data.map((e: any) => ({
              id: e.id,
              courseId: e.course_id,
              studentName: e.student_name,
              studentEmail: e.student_email,
              studentPhone: e.student_phone,
              status: e.status,
              amountPaid: e.amount_paid,
              paymentMethod: e.payment_method,
              createdAt: e.created_at
          })));
      }
  };

  const handleDeleteEnrollment = async (enrollmentId: string) => {
      if(!confirm('Tem certeza que deseja remover este aluno?')) return;
      
      const { error } = await supabase.from('SITE_Enrollments').delete().eq('id', enrollmentId);
      if(error) {
          alert('Erro ao excluir: ' + error.message);
      } else {
          setEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
      }
  };

  // ... (handleSaveEnrollment remains the same) ...
  const handleSaveEnrollment = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!editingEnrollment || !currentCourse) return;

      const payload = {
          course_id: currentCourse.id,
          student_name: editingEnrollment.studentName,
          student_email: editingEnrollment.studentEmail,
          student_phone: editingEnrollment.studentPhone,
          status: editingEnrollment.status || 'Confirmed',
          amount_paid: Number(editingEnrollment.amountPaid) || 0,
          payment_method: editingEnrollment.paymentMethod
      };

      if(editingEnrollment.id) {
          // Update
          const { error } = await supabase.from('SITE_Enrollments').update(payload).eq('id', editingEnrollment.id);
          if(!error) {
              setEnrollments(prev => prev.map(enr => enr.id === editingEnrollment.id ? {...enr, ...editingEnrollment, amountPaid: payload.amount_paid, paymentMethod: payload.payment_method} as Enrollment : enr));
              setEditingEnrollment(null);
          } else {
              alert('Erro ao atualizar: ' + error.message);
          }
      } else {
          // Insert
          const { data, error } = await supabase.from('SITE_Enrollments').insert([payload]).select().single();
          if(!error && data) {
              const newEnrollment: Enrollment = {
                  id: data.id,
                  courseId: data.course_id,
                  studentName: data.student_name,
                  studentEmail: data.student_email,
                  studentPhone: data.student_phone,
                  status: data.status,
                  amountPaid: data.amount_paid,
                  paymentMethod: data.payment_method,
                  createdAt: data.created_at
              };
              setEnrollments(prev => [...prev, newEnrollment]);
              setEditingEnrollment(null);
          } else {
              alert('Erro ao cadastrar: ' + (error?.message || 'Erro desconhecido'));
          }
      }
  };

  // Calendar Components
  const CalendarYearView = () => {
    const currentYear = currentDate.getFullYear();
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {months.map((month, idx) => {
                const monthEvents = courses.filter(c => {
                    const d = new Date(c.date);
                    return d.getMonth() === idx && d.getFullYear() === currentYear;
                });

                return (
                    <div key={month} className="border p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-all">
                        <h3 className="font-bold text-lg mb-2 text-gray-800">{month}</h3>
                        {monthEvents.length > 0 ? (
                            <ul className="space-y-2">
                                {monthEvents.map(e => (
                                    <li key={e.id} onClick={() => handleEdit(e)} className="text-xs bg-gray-50 p-2 rounded cursor-pointer hover:bg-yellow-50 border-l-2 border-wtech-gold">
                                        <div className="font-bold flex justify-between">
                                            <span>{new Date(e.date).getDate()} - {e.title}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-xs text-gray-400 italic">Sem eventos</div>
                        )}
                    </div>
                );
            })}
        </div>
    );
  };

  const CalendarWeekView = () => {
    // Simply show the next 7 days from today? Or structured Mon-Sun of current week?
    // Let's do current week Mon-Sun
    const curr = new Date(); 
    const first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
    const firstDay = new Date(curr.setDate(first)); // This is Sunday. Let's make it Monday? 
    // Simplified: Show next 7 upcoming days regardless of week start
    const upcomingDays = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
    });

    return (
        <div className="grid grid-cols-7 gap-2 h-[600px]">
            {upcomingDays.map(date => {
                const dayEvents = courses.filter(c => new Date(c.date).toDateString() === date.toDateString());
                const isToday = date.toDateString() === new Date().toDateString();
                return (
                    <div key={date.toString()} className={`border rounded-lg p-2 flex flex-col ${isToday ? 'bg-yellow-50 border-yellow-200' : 'bg-white'}`}>
                        <div className="text-center border-b pb-2 mb-2">
                             <div className="text-xs font-bold uppercase text-gray-500">{date.toLocaleDateString('pt-BR', {weekday: 'short'})}</div>
                             <div className={`text-xl font-black ${isToday ? 'text-wtech-gold' : 'text-gray-800'}`}>{date.getDate()}</div>
                        </div>
                        <div className="flex-1 space-y-2 overflow-y-auto">
                            {dayEvents.map(e => (
                                <div key={e.id} onClick={() => handleEdit(e)} className="bg-wtech-black text-white text-[10px] p-2 rounded cursor-pointer hover:bg-gray-800">
                                    <div className="font-bold">{new Date(e.date).getHours()}h</div>
                                    <div className="line-clamp-3">{e.title}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
  };

  const CalendarGrid = () => {
      if(calendarViewMode === 'Year') return <CalendarYearView />;
      if(calendarViewMode === 'Week') return <CalendarWeekView />;

      // Default Month View
      const today = currentDate;
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      
      const eventsByDay: {[key: number]: Course[]} = {};
      courses.forEach(c => {
          const d = new Date(c.date);
          if(d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
              const day = d.getDate();
              if(!eventsByDay[day]) eventsByDay[day] = [];
              eventsByDay[day].push(c);
          }
      });

      return (
          <div className="grid grid-cols-7 gap-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                  <div key={d} className="font-bold text-center text-xs text-gray-500 py-2 uppercase">{d}</div>
              ))}
              {Array.from({length: daysInMonth}, (_, i) => i + 1).map(day => (
                  <div key={day} className="border border-gray-100 min-h-[100px] p-2 rounded relative hover:bg-gray-50 transition-colors">
                      <span className="text-xs font-bold text-gray-400 absolute top-2 left-2">{day}</span>
                      <div className="mt-6 space-y-1">
                          {eventsByDay[day]?.map(ev => (
                              <div key={ev.id} onClick={() => handleEdit(ev)} className="bg-wtech-gold/20 text-yellow-900 text-[10px] p-1 rounded font-bold cursor-pointer hover:bg-wtech-gold truncate">
                                  {new Date(ev.date).getHours()}h: {ev.title}
                              </div>
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      );
  };

  if (showEnrollments && currentCourse) {
      // ... (Enrollments Code remains same) ...
      // I am keeping the logic intact by referencing the previous code block, 
      // but sticking to the allowed complexity. 
      // Since I replaced the functions above, I'll return the full component logic.
      // Wait, 'showEnrollments' block is large. I will assume it's stable and just return it.
      // Actually, I need to make sure 'return' is reached.
      // IMPORTANT: I need to paste the Enrollments Return Block here because I'm replacing the whole section.
      const totalPaid = enrollments.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
      const totalPotential = enrollments.length * (currentCourse.price || 0);

      return (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 min-h-screen">
              <div className="flex justify-between items-start mb-8 print:hidden">
                  <div>
                      <div className="flex justify-between items-center mb-2">
                          <button onClick={() => setShowEnrollments(false)} className="text-sm font-bold text-gray-500 hover:text-black flex items-center gap-1">
                              <ArrowRight className="rotate-180" size={14} /> Voltar
                          </button>
                          <button onClick={printList} className="text-sm font-bold text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-50 flex items-center gap-2">
                              <Printer size={14} /> Imprimir Lista
                          </button>
                      </div>
                      <h2 className="text-2xl font-black text-gray-900">Lista de Inscritos</h2>
                      <p className="text-gray-500">{currentCourse.title} • {new Date(currentCourse.date).toLocaleDateString()}</p>
                      <div className="mt-2 text-sm flex gap-4">
                        <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded">Recebido: R$ {totalPaid.toFixed(2)}</span>
                        <span className="text-gray-600 font-bold bg-gray-100 px-2 py-1 rounded">Total Previsto: R$ {totalPotential.toFixed(2)}</span>
                      </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingEnrollment({ status: 'Confirmed', amountPaid: 0 })} className="bg-wtech-gold text-black px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-yellow-500">
                        <Plus size={18} /> Adicionar Aluno
                    </button>
                    <button onClick={printList} className="bg-black text-white px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-gray-800">
                        <Printer size={18} /> Imprimir Lista
                    </button>
                  </div>
              </div>
              
              {/* Enrollment Edit Form */}
              {editingEnrollment && (
                  <div className="mb-6 bg-gray-50 p-6 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-2 print:hidden">
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-lg">{editingEnrollment.id ? 'Editar Aluno' : 'Novo Aluno'}</h3>
                          <button onClick={() => setEditingEnrollment(null)}><X size={18} /></button>
                      </div>
                      <form onSubmit={handleSaveEnrollment} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* ... Fields ... reuse previous fields ... */}
                             <div>
                                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nome Completo</label>
                                  <input required className="w-full p-2 border rounded" value={editingEnrollment.studentName || ''} onChange={e => setEditingEnrollment({...editingEnrollment, studentName: e.target.value})} />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email</label>
                                  <input type="email" className="w-full p-2 border rounded" value={editingEnrollment.studentEmail || ''} onChange={e => setEditingEnrollment({...editingEnrollment, studentEmail: e.target.value})} />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Telefone/WhatsApp</label>
                                  <input className="w-full p-2 border rounded" value={editingEnrollment.studentPhone || ''} onChange={e => setEditingEnrollment({...editingEnrollment, studentPhone: e.target.value})} />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Status</label>
                                  <select className="w-full p-2 border rounded" value={editingEnrollment.status || 'Confirmed'} onChange={e => setEditingEnrollment({...editingEnrollment, status: e.target.value as any})}>
                                      <option value="Pending">Pendente</option>
                                      <option value="Confirmed">Confirmado</option>
                                      <option value="CheckedIn">Presente (Check-in)</option>
                                  </select>
                              </div>
                              
                              {/* Financial Fields */}
                              <div className="md:col-span-2 grid grid-cols-3 gap-4 border-t border-gray-200 pt-4 mt-2">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Valor do Curso</label>
                                        <div className="text-lg font-bold text-gray-900">R$ {currentCourse.price?.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Valor Pago (Sinal/Total)</label>
                                        <input type="number" step="0.01" className="w-full p-2 border rounded font-bold text-green-700" value={editingEnrollment.amountPaid || 0} onChange={e => setEditingEnrollment({...editingEnrollment, amountPaid: parseFloat(e.target.value)})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Saldo a Pagar</label>
                                        <div className="text-lg font-bold text-red-600">
                                            R$ {((currentCourse.price || 0) - (editingEnrollment.amountPaid || 0)).toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="col-span-3">
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Método de Pagamento</label>
                                        <div className="flex gap-2">
                                            {['Pix', 'Cartão Crédito', 'Cartão Débito', 'Dinheiro', 'Boleto'].map(method => (
                                                <button 
                                                    key={method}
                                                    type="button" 
                                                    onClick={() => setEditingEnrollment({...editingEnrollment, paymentMethod: method})}
                                                    className={`px-3 py-1 rounded border text-xs font-bold ${editingEnrollment.paymentMethod === method ? 'bg-wtech-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                                >
                                                    {method}
                                                </button>
                                            ))}
                                        </div>
                                        <input placeholder="Outro método..." className="w-full p-2 border rounded mt-2 text-sm" value={editingEnrollment.paymentMethod || ''} onChange={e => setEditingEnrollment({...editingEnrollment, paymentMethod: e.target.value})} />
                                    </div>
                              </div>
    
                              <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                                  <button type="button" onClick={() => setEditingEnrollment(null)} className="px-4 py-2 text-gray-500 font-bold">Cancelar</button>
                                  <button type="submit" className="px-6 py-2 bg-wtech-black text-white rounded font-bold hover:bg-gray-800">Salvar Aluno</button>
                              </div>
                      </form>
                  </div>
              )}

              {/* ... Table ... */}
               <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-800 uppercase font-bold text-xs border-b border-gray-200">
                          <tr>
                              <th className="px-6 py-3">Nome do Aluno</th>
                              <th className="px-6 py-3">Contato</th>
                              <th className="px-6 py-3">Status</th>
                              <th className="px-6 py-3">Financeiro</th>
                              <th className="px-6 py-3 print:hidden">Ações</th>
                              <th className="px-6 py-3 hidden print:table-cell">Assinatura</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-900">
                          {enrollments.length > 0 ? (
                              enrollments.map((enr, idx) => {
                                  const balance = (currentCourse.price || 0) - (enr.amountPaid || 0);
                                  return (
                                  <tr key={enr.id} className="group hover:bg-gray-50">
                                      <td className="px-6 py-4 font-bold">
                                          {idx + 1}. {enr.studentName}
                                      </td>
                                      <td className="px-6 py-4">
                                          <div>{enr.studentEmail}</div>
                                          <div className="text-xs text-gray-500">{enr.studentPhone}</div>
                                      </td>
                                      <td className="px-6 py-4">
                                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${enr.status === 'CheckedIn' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                              {enr.status === 'CheckedIn' ? 'Presente' : 'Confirmado'}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4">
                                          <div className="font-bold text-green-700">Pago: R$ {enr.amountPaid?.toFixed(2)}</div>
                                          {balance > 0 ? (
                                              <div className="text-xs text-red-600 font-bold">Resta: R$ {balance.toFixed(2)}</div>
                                          ) : (
                                              <div className="text-xs text-blue-600 font-bold bg-blue-50 inline-block px-1 rounded">Quitado</div>
                                          )}
                                          <div className="text-[10px] text-gray-400 mt-1">{enr.paymentMethod || '-'}</div>
                                      </td>
                                      <td className="px-6 py-4 print:hidden">
                                          <div className="flex items-center gap-2">
                                            <button onClick={() => toggleCheckIn(enr.id, enr.status)} title="Check-in Rápido" className={`p-1.5 rounded border ${enr.status === 'CheckedIn' ? 'text-green-600 border-green-200 bg-green-50' : 'text-gray-400 border-gray-200 hover:bg-gray-100'}`}>
                                                <CheckCircle size={16} />
                                            </button>
                                            
                                            {balance > 0 && (
                                                <button onClick={() => handleSettleBalance(enr, balance)} title={`Quitar Saldo (R$ ${balance.toFixed(2)})`} className="p-1.5 text-green-600 hover:bg-green-50 rounded bg-green-50/50 border border-green-200">
                                                    <DollarSign size={16} />
                                                </button>
                                            )}

                                            <button onClick={() => setEditingEnrollment(enr)} title="Editar" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteEnrollment(enr.id)} title="Excluir" className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                                                <Trash2 size={16} />
                                            </button>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 hidden print:table-cell border-b border-gray-100 h-16 w-64"></td>
                                  </tr>
                                  );
                              })
                          ) : (
                              <tr>
                                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Nenhum aluno inscrito ainda.</td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      );
  }

  const Table = () => (
      <>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left font-bold text-sm">
                <thead className="bg-[#eff6ff] text-[#1e3a8a] text-xs uppercase">
                    <tr>
                        <th className="p-4">Evento</th>
                        <th className="p-4">Data</th>
                        <th className="p-4 text-center">Inscritos</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-600">
                    {filteredCourses.length > 0 ? (
                        filteredCourses.map(course => (
                            <tr key={course.id} className="hover:bg-gray-50">
                                <td className="p-4">
                                    <div className="text-blue-700 font-bold">{course.title}</div>
                                    <div className="text-xs text-gray-400">{course.location}</div>
                                </td>
                                <td className="p-4 text-gray-800 font-bold">
                                    {new Date(course.date).toLocaleDateString()}
                                    <div className="text-xs text-gray-400 font-normal">{new Date(course.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                </td>
                                <td className="p-4 text-center">
                                    <button 
                                        onClick={() => {
                                            setCurrentCourse(course);
                                            fetchEnrollments(course.id);
                                            setShowEnrollments(true);
                                        }}
                                        className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-blue-100 transition-colors"
                                    >
                                        {course.registeredCount} / {course.capacity} (Ver Lista)
                                    </button>
                                </td>
                                <td className="p-4 text-center">
                                    <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded uppercase font-bold border border-gray-200">
                                        {course.status}
                                    </span>
                                </td>
                                  <td className="p-4 flex gap-2 justify-end">
                                    <button onClick={() => setEditingLandingPage(course)} title="Gerenciar Landing Page" className="p-2 text-purple-600 hover:bg-purple-50 rounded transition-colors"><Globe size={16} /></button>
                                    <button onClick={() => handleQuickAddStudent(course)} title="Adicionar Aluno Rápido" className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"><UserPlus size={16} /></button>
                                    <button onClick={() => handleEdit(course)} title="Editar Curso" className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><Edit size={16} /></button>
                                    <button onClick={() => handleDelete(course.id)} title="Excluir Curso" className="p-2 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-gray-400 italic">
                                {searchTerm ? 'Nenhum curso encontrado.' : 'Nenhum curso cadastrado.'}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>

        {editingLandingPage && (
            <LandingPageEditor 
                course={editingLandingPage} 
                onClose={() => setEditingLandingPage(null)} 
            />
        )}
      </>
  );



  return (
    <div className="text-gray-900 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                 <h2 className="text-xl font-bold">Gestão de Cursos e Eventos</h2>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                {/* Search Bar */}
                <div className="relative">
                    <input 
                        className="pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:border-wtech-gold w-full md:w-64" 
                        placeholder="Buscar curso..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-2 top-2.5 text-gray-400" size={16} />
                </div>

                {/* Date Filter */}
                <div className="flex items-center gap-2 bg-white border rounded-lg px-2 py-1">
                    <span className="text-xs font-bold text-gray-400 uppercase">Período:</span>
                    <input type="date" className="text-sm border-none focus:ring-0 text-gray-600" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                    <span className="text-gray-400">-</span>
                    <input type="date" className="text-sm border-none focus:ring-0 text-gray-600" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
                    {(dateRange.start || dateRange.end) && (
                        <button onClick={() => setDateRange({start:'', end:''})} className="text-gray-400 hover:text-red-500"><X size={14}/></button>
                    )}
                </div>

                <div className="h-8 w-px bg-gray-300 mx-2"></div>

                <button onClick={downloadCoursesReport} className="bg-green-100 text-green-800 border border-green-200 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-green-200 transition-colors" title="Exportar Relatório CSV">
                    <Download size={16} /> Relatório
                </button>

                <button onClick={handlePrintCoursesReport} className="bg-gray-100 text-gray-800 border border-gray-200 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-200 transition-colors" title="Imprimir Lista">
                    <Printer size={16} /> Imprimir
                </button>

                {/* View Toggles */}
                 <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setViewMode('calendar')} className={`px-3 py-1.5 rounded text-sm font-bold ${viewMode==='calendar' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>Calendário</button>
                    <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded text-sm font-bold ${viewMode==='list' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>Lista</button>
                </div>
            </div>
        </div>

        {viewMode === 'list' && (
             <div className="mb-4 flex items-center gap-2">
                 <button 
                    onClick={() => setShowPastCourses(!showPastCourses)} 
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${showPastCourses ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200'}`}
                 >
                    {showPastCourses ? 'Mostrando Histórico Completo' : 'Ocultar Cursos Passados'}
                 </button>
             </div>
        )}

        {viewMode === 'calendar' && (
             <div className="mb-4 flex flex-col md:flex-row items-center justify-between gap-4">
                 <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setCalendarViewMode('Month')} className={`px-3 py-1 rounded text-xs font-bold ${calendarViewMode==='Month' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>Mês</button>
                    <button onClick={() => setCalendarViewMode('Week')} className={`px-3 py-1 rounded text-xs font-bold ${calendarViewMode==='Week' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>Início (7 Dias)</button>
                    <button onClick={() => setCalendarViewMode('Year')} className={`px-3 py-1 rounded text-xs font-bold ${calendarViewMode==='Year' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>Ano</button>
                 </div>
                 
                 <div className="flex items-center gap-4 bg-white border border-gray-200 p-2 rounded-lg shadow-sm">
                     <button onClick={() => setCurrentDate(new Date(currentDate.setFullYear(currentDate.getFullYear() - 1)))} className="p-1 hover:bg-gray-100 rounded" title="Ano Anterior">
                         <ChevronLeft size={16} />
                     </button>
                     <span className="font-bold text-lg min-w-[60px] text-center">{currentDate.getFullYear()}</span>
                     <button onClick={() => setCurrentDate(new Date(currentDate.setFullYear(currentDate.getFullYear() + 1)))} className="p-1 hover:bg-gray-100 rounded" title="Próximo Ano">
                         <ChevronRight size={16} />
                     </button>
                     
                     {calendarViewMode === 'Month' && (
                         <>
                             <div className="h-4 w-px bg-gray-300 mx-2"></div>
                             <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-1 hover:bg-gray-100 rounded" title="Mês Anterior">
                                 <ChevronLeft size={16} />
                             </button>
                             <span className="font-bold w-[100px] text-center capitalize">{currentDate.toLocaleString('default', { month: 'long' })}</span>
                             <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-1 hover:bg-gray-100 rounded" title="Próximo Mês">
                                 <ChevronRight size={16} />
                             </button>
                         </>
                     )}
                 </div>
             </div>
        )}


        {/* INLINE FORM / TOP INSERTION */}
        {isEditing && (
            <div className="mb-8 bg-white p-8 rounded-xl shadow-lg border-2 border-wtech-gold/20 animate-in slide-in-from-top-4 relative">
                 {/* ... Form ... */}
                 <button onClick={() => setIsEditing(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black"><X size={20}/></button>
                 <h2 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                    <GraduationCap className="text-wtech-gold" /> {formData.id ? 'Editar Curso' : 'Novo Curso'}
                </h2>
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-900">
                    <div className="md:col-span-2">
                         <label className="block text-sm font-bold mb-1 text-gray-700">Título do Evento</label>
                         <input className="w-full border border-gray-300 p-2 rounded text-gray-900" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} required />
                    </div>
                    
                    {/* Date & Time */}
                    <div className="grid grid-cols-4 gap-4 md:col-span-2">
                        <div>
                            <label className="block text-sm font-bold mb-1 text-gray-700">Data Início</label>
                            <input type="date" className="w-full border border-gray-300 p-2 rounded text-gray-900" value={formData.date ? formData.date.split('T')[0] : ''} onChange={e => setFormData({...formData, date: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1 text-gray-700">Data Término</label>
                            <input type="date" className="w-full border border-gray-300 p-2 rounded text-gray-900" value={formData.dateEnd ? formData.dateEnd.split('T')[0] : ''} onChange={e => setFormData({...formData, dateEnd: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1 text-gray-700">Hora Início</label>
                            <input type="time" className="w-full border border-gray-300 p-2 rounded text-gray-900" value={formData.startTime || ''} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1 text-gray-700">Hora Fim</label>
                            <input type="time" className="w-full border border-gray-300 p-2 rounded text-gray-900" value={formData.endTime || ''} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                        </div>
                    </div>

                    {/* LOCATION SECTION */}
                    <div className="md:col-span-2 border-t pt-4 mt-2">
                        <label className="block text-sm font-bold mb-3 text-gray-800 uppercase flex items-center gap-2"><MapPin size={16}/> Localização e Endereço</label>
                        <div className="grid grid-cols-4 gap-4">
                             <div>
                                <label className="block text-xs font-bold mb-1 text-gray-500">CEP</label>
                                <input className="w-full border border-gray-300 p-2 rounded text-gray-900" value={formData.zipCode || ''} onChange={e => setFormData({...formData, zipCode: e.target.value})} onBlur={handleBlurCEP} placeholder="00000-000" />
                             </div>
                             <div className="col-span-3">
                                <label className="block text-xs font-bold mb-1 text-gray-500">Endereço (Rua/Av)</label>
                                <input className="w-full border border-gray-300 p-2 rounded text-gray-900" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
                             </div>
                             <div>
                                <label className="block text-xs font-bold mb-1 text-gray-500">Número</label>
                                <input className="w-full border border-gray-300 p-2 rounded text-gray-900" value={formData.addressNumber || ''} onChange={e => setFormData({...formData, addressNumber: e.target.value})} onBlur={handleGeocodeCourse} placeholder="Ex: 123" />
                             </div>
                             <div>
                                <label className="block text-xs font-bold mb-1 text-gray-500">Bairro</label>
                                <input className="w-full border border-gray-300 p-2 rounded text-gray-900" value={formData.addressNeighborhood || ''} onChange={e => setFormData({...formData, addressNeighborhood: e.target.value})} />
                             </div>
                             <div>
                                <label className="block text-xs font-bold mb-1 text-gray-500">Cidade</label>
                                <input className="w-full border border-gray-300 p-2 rounded text-gray-900" value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} />
                             </div>
                             <div>
                                <label className="block text-xs font-bold mb-1 text-gray-500">Estado</label>
                                <input className="w-full border border-gray-300 p-2 rounded text-gray-900" value={formData.state || ''} onChange={e => setFormData({...formData, state: e.target.value})} />
                             </div>
                             <div className="col-span-4">
                                <label className="block text-xs font-bold mb-1 text-gray-500">Local (Exibido no Cabeçalho)</label>
                                <input className="w-full border border-gray-300 p-2 rounded text-gray-900" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} />
                             </div>
                             <div className="col-span-2">
                                <label className="block text-xs font-bold mb-1 text-gray-500">Latitude</label>
                                <input className="w-full border border-gray-300 p-2 rounded text-gray-900 bg-gray-50" value={formData.latitude || ''} readOnly />
                             </div>
                             <div className="col-span-2">
                                <label className="block text-xs font-bold mb-1 text-gray-500">Longitude</label>
                                <input className="w-full border border-gray-300 p-2 rounded text-gray-900 bg-gray-50" value={formData.longitude || ''} readOnly />
                             </div>
                             <div className="col-span-4">
                                 <button type="button" onClick={handleGeocodeCourse} className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded font-bold hover:bg-blue-100 border border-blue-200">
                                     📍 Atualizar Pin no Mapa (Forçar)
                                 </button>
                             </div>
                        </div>
                    </div>

                     <div>
                         <label className="block text-sm font-bold mb-1 text-gray-700">Tipo</label>
                         <select className="w-full border border-gray-300 p-2 rounded text-gray-900" value={formData.locationType || 'Presencial'} onChange={e => setFormData({...formData, locationType: e.target.value as any})}>
                            <option value="Presencial">Presencial</option>
                            <option value="Online">Online</option>
                        </select>
                    </div>

                    <div>
                         <label className="block text-sm font-bold mb-1 text-gray-700">Instrutor</label>
                         <input className="w-full border border-gray-300 p-2 rounded text-gray-900" value={formData.instructor || ''} onChange={e => setFormData({...formData, instructor: e.target.value})} />
                    </div>
                     <div>
                         <label className="block text-sm font-bold mb-1 text-gray-700">Valor (R$)</label>
                         <input type="number" className="w-full border border-gray-300 p-2 rounded text-gray-900" value={formData.price || ''} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} placeholder="0.00" />
                    </div>
                    
                    <div className="md:col-span-2">
                         <label className="block text-sm font-bold mb-1 text-gray-700">Imagem de Capa (URL)</label>
                         <input className="w-full border border-gray-300 p-2 rounded text-gray-900" value={formData.image || ''} onChange={e => setFormData({...formData, image: e.target.value})} placeholder="https://..." />
                    </div>

                    <div className="md:col-span-2">
                         <label className="block text-sm font-bold mb-1 text-gray-700">URL do Mapa (Opcional - Gerado Automático)</label>
                         <input className="w-full border border-gray-300 p-2 rounded text-gray-900" value={formData.mapUrl || ''} onChange={e => setFormData({...formData, mapUrl: e.target.value})} placeholder="https://maps.google.com/..." />
                    </div>

                    <div className="md:col-span-2">
                         <label className="block text-sm font-bold mb-1 text-gray-700">Cronograma / Conteúdo</label>
                         <textarea rows={5} className="w-full border border-gray-300 p-2 rounded text-gray-900" value={formData.schedule || ''} onChange={e => setFormData({...formData, schedule: e.target.value})} placeholder="08:00 - Café da manhã..." />
                    </div>

                    <div className="md:col-span-2 flex justify-end gap-2">
                        <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100">Cancelar</button>
                        <button type="submit" className="px-6 py-2 bg-wtech-black text-white rounded hover:bg-black font-bold">Salvar Curso</button>
                    </div>
                </form>
            </div>
        )}

        {!isEditing && (
             <div className="mb-4">
                 <button onClick={() => handleEdit()} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 font-bold hover:border-wtech-gold hover:text-wtech-gold transition-colors flex items-center justify-center gap-2">
                     <Plus size={20} /> Adicionar Novo Curso no Topo
                 </button>
             </div>
        )}

        {/* DATA DISPLAY */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
            {viewMode === 'list' ? (
                <Table />
            ) : (
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-700">Calendário de {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                        <span className="text-xs text-gray-400">Navegue acima para mudar</span>
                    </div>
                    <CalendarGrid />
                </div>
            )}
        </div>
    </div>
  );
};

const MechanicsView = () => {
    const [mechanics, setMechanics] = useState<Mechanic[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [formData, setFormData] = useState<Partial<Mechanic>>({});
    
    // Search & Selection State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        fetchMechanics();
    }, []);

    const fetchMechanics = async () => {
        const { data, error } = await supabase.from('SITE_Mechanics').select('*').order('created_at', { ascending: false });
        if (error) console.error('Error fetching mechanics:', error);
        if (data) setMechanics(data.map((m: any) => ({ ...m, workshopName: m.workshop_name, cpfCnpj: m.cpf_cnpj })));
    };

    const toggleStatus = async (id: string, current: string) => {
        const newStatus = current === 'Approved' ? 'Pending' : 'Approved';
        await supabase.from('SITE_Mechanics').update({ status: newStatus }).eq('id', id);
        setMechanics(prev => prev.map(m => m.id === id ? { ...m, status: newStatus as any } : m));
    };

    const handleDelete = async (id: string) => {
        if(!confirm('Tem certeza que deseja excluir este credenciado?')) return;
        await supabase.from('SITE_Mechanics').delete().eq('id', id);
        setMechanics(prev => prev.filter(m => m.id !== id));
        setSelectedIds(prev => prev.filter(sid => sid !== id));
    };

    const handleBulkDelete = async () => {
        if(!confirm(`Tem certeza que deseja excluir ${selectedIds.length} credenciados?`)) return;
        await supabase.from('SITE_Mechanics').delete().in('id', selectedIds);
        setMechanics(prev => prev.filter(m => !selectedIds.includes(m.id)));
        setSelectedIds([]);
    };



    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            name: formData.name,
            workshop_name: formData.workshopName,
            city: formData.city,
            state: formData.state,
            email: formData.email,
            phone: formData.phone,
            status: formData.status || 'Pending',
            specialty: formData.specialty || [],
            street: formData.street,
            number: formData.number,
            zip_code: formData.zipCode,
            district: formData.district,
            latitude: formData.latitude,
            longitude: formData.longitude,
            cpf_cnpj: formData.cpfCnpj,
            group: formData.group
        };

        if (formData.id) {
             await supabase.from('SITE_Mechanics').update(payload).eq('id', formData.id);
        } else {
             await supabase.from('SITE_Mechanics').insert([payload]);
        }
        setIsEditing(false);
        fetchMechanics();
    };

    const handleGeocode = async () => {
        if (!formData.city || !formData.state) {
            alert('Preencha Cidade e Estado para buscar coordenadas.');
            return;
        }

        try {
            const addressQuery = `${formData.street || ''}, ${formData.city}, ${formData.state}, Brazil`;
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}`);
            const data = await response.json();
            
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                setFormData({...formData, latitude: lat, longitude: lng});
                alert(`Coordenadas Encontradas!\nLat: ${lat}\nLng: ${lng}`);
            } else {
                alert('Endereço não encontrado no mapa.');
            }
        } catch (error) {
            console.error("Geocoding error:", error);
            alert('Erro ao buscar coordenadas.');
        }
    };

    const [processingCount, setProcessingCount] = useState({ current: 0, total: 0 });

    const handleBatchGeocode = async () => {
        const { data: missingCoords } = await supabase.from('SITE_Mechanics').select('*').is('latitude', null);
        
        if (!missingCoords || missingCoords.length === 0) {
            alert('Todos os credenciados já possuem coordenadas!');
            return;
        }

        if (!confirm(`Desja buscar coordenadas para ${missingCoords.length} credenciados? Isso pode demorar alguns minutos.`)) return;

        setProcessingCount({ current: 0, total: missingCoords.length });
        let updated = 0;

        for (let i = 0; i < missingCoords.length; i++) {
            const mech = missingCoords[i];
            setProcessingCount({ current: i + 1, total: missingCoords.length });

            const addressQuery = `${mech.street || ''}, ${mech.number || ''}, ${mech.district || ''}, ${mech.city}, ${mech.state}, Brazil`;
            
            try {
                // Nominatim Rate Limit: Max 1 request per second
                await new Promise(resolve => setTimeout(resolve, 1200)); 

                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}`);
                const data = await response.json();

                if (data && data.length > 0) {
                    const lat = parseFloat(data[0].lat);
                    const lng = parseFloat(data[0].lon);
                    
                    await supabase.from('SITE_Mechanics').update({
                        latitude: lat,
                        longitude: lng
                    }).eq('id', mech.id);
                    updated++;
                }
            } catch (err) {
                console.error(`Erro ao geocodificar ${mech.name}:`, err);
            }
        }

        alert(`Processo finalizado! ${updated} credenciados atualizados.`);
        setProcessingCount({ current: 0, total: 0 });
        fetchMechanics();
    };

    const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const text = await file.text();
        const rows = text.split('\n');
        
        let successCount = 0;
        let updateCount = 0;

        for (let i = 1; i < rows.length; i++) {
             const row = rows[i];
             if (!row.trim()) continue;

             const cols = row.split(',').map(c => c.replace(/"/g, '').trim()); 
             const values = cols.length < 5 ? row.split(';').map(c => c.replace(/"/g, '').trim()) : cols;

             if (values.length >= 8) { // Strictness
                 // Normalize
                 const cpfRaw = values[10] || '';
                 const emailRaw = values[9] || '';
                 
                 const payload = {
                     name: values[0], 
                     workshop_name: values[1], 
                     phone: values[2],
                     street: values[3],
                     number: values[4],
                     district: values[5],
                     zip_code: values[6]?.replace(/\D/g, ''),
                     city: values[7],
                     state: values[8],
                     email: emailRaw.toLowerCase(), // Normalize Email
                     cpf_cnpj: cpfRaw.replace(/\D/g, ''), // Normalize CPF (numbers only)
                     group: values[11],
                     status: 'Approved', 
                     photo: `https://ui-avatars.com/api/?name=${values[0]}&background=random`
                 };

                 let existingId = null;
                 
                 // 1. Try by Normalized CPF/CNPJ
                 if (payload.cpf_cnpj && payload.cpf_cnpj.length > 5) {
                     // Note: We need to search effectively. If DB has punctuation, this might fail unless we assume DB also normalized.
                     // Ideally we verify strictly. Assuming we store stripped CPFs from now on or check loosely.
                     // The query below assumes 'cpf_cnpj' column stores EXACT match.
                     // To be safe, let's just use what we have. If previous import stored punctuation, we might need to handle that.
                     // For this iteration, assuming standardized input.
                     const { data: existingCpf } = await supabase.from('SITE_Mechanics').select('id').eq('cpf_cnpj', payload.cpf_cnpj).maybeSingle();
                     if (existingCpf) existingId = existingCpf.id;
                 }

                 // 2. Try by Email
                 if (!existingId && payload.email) {
                     const { data: existingEmail } = await supabase.from('SITE_Mechanics').select('id').ilike('email', payload.email).maybeSingle();
                     if (existingEmail) existingId = existingEmail.id;
                 }

                 // 3. Fallback: Workshop Name AND City match (for messy data)
                 if (!existingId && payload.workshop_name && payload.city) {
                      const { data: existingName } = await supabase.from('SITE_Mechanics')
                        .select('id')
                        .ilike('workshop_name', payload.workshop_name)
                        .ilike('city', payload.city)
                        .maybeSingle();
                      if(existingName) existingId = existingName.id;
                 }

                 if (existingId) {
                     await supabase.from('SITE_Mechanics').update(payload).eq('id', existingId);
                     updateCount++;
                 } else {
                     await supabase.from('SITE_Mechanics').insert([payload]);
                     successCount++;
                 }
             }
        }
        alert(`Importação Concluída!\nNovos: ${successCount}\nAtualizados: ${updateCount}`);
        setIsImporting(false);
        fetchMechanics();
    };

    const filteredMechanics = mechanics.filter(m => 
        (m.workshopName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.state || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.group && m.group.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredMechanics.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredMechanics.map(m => m.id));
        }
    };

    const totalPages = Math.ceil(filteredMechanics.length / itemsPerPage);
    const currentMechanics = filteredMechanics.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

    if (isEditing) {
        return (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-gray-900">
                <h2 className="text-2xl font-bold mb-8 text-gray-900 flex items-center gap-2">
                    <Wrench className="text-wtech-gold" /> {formData.id ? 'Editar Credenciado' : 'Novo Credenciado'}
                </h2>
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-700">Nome Responsável</label>
                        <input className="w-full border border-gray-300 p-3 rounded-lg text-gray-900 focus:border-wtech-gold outline-none" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-700">Nome Oficina</label>
                        <input className="w-full border border-gray-300 p-3 rounded-lg text-gray-900 focus:border-wtech-gold outline-none" value={formData.workshopName || ''} onChange={e => setFormData({...formData, workshopName: e.target.value})} required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-700">Email</label>
                        <input className="w-full border border-gray-300 p-3 rounded-lg text-gray-900 focus:border-wtech-gold outline-none" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div>
                         <label className="block text-sm font-bold mb-1 text-gray-700">Telefone</label>
                         <input className="w-full border border-gray-300 p-3 rounded-lg text-gray-900 focus:border-wtech-gold outline-none" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    <div>
                         <label className="block text-sm font-bold mb-1 text-gray-700">CPF/CNPJ</label>
                         <input className="w-full border border-gray-300 p-3 rounded-lg text-gray-900 focus:border-wtech-gold outline-none" value={formData.cpfCnpj || ''} onChange={e => setFormData({...formData, cpfCnpj: e.target.value})} />
                    </div>
                    <div>
                         <label className="block text-sm font-bold mb-1 text-gray-700">Grupo</label>
                         <input className="w-full border border-gray-300 p-3 rounded-lg text-gray-900 focus:border-wtech-gold outline-none" value={formData.group || ''} onChange={e => setFormData({...formData, group: e.target.value})} />
                    </div>
                    
                    {/* Address Section */}
                    <div className="col-span-1 md:col-span-2 mt-4 pt-4 border-t border-gray-100">
                         <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Endereço & Localização</h3>
                         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                             <div>
                                 <label className="block text-xs font-bold text-gray-500 mb-1">CEP</label>
                                 <input className="w-full border border-gray-300 p-2 rounded text-gray-900" value={formData.zipCode || ''} onChange={e => setFormData({...formData, zipCode: e.target.value})} />
                             </div>
                             <div className="md:col-span-2">
                                 <label className="block text-xs font-bold text-gray-500 mb-1">Rua / Logradouro</label>
                                 <input className="w-full border border-gray-300 p-2 rounded text-gray-900" value={formData.street || ''} onChange={e => setFormData({...formData, street: e.target.value})} />
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-gray-500 mb-1">Número</label>
                                 <input className="w-full border border-gray-300 p-2 rounded text-gray-900" value={formData.number || ''} onChange={e => setFormData({...formData, number: e.target.value})} />
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-gray-500 mb-1">Bairro</label>
                                 <input className="w-full border border-gray-300 p-2 rounded text-gray-900" value={formData.district || ''} onChange={e => setFormData({...formData, district: e.target.value})} />
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-gray-500 mb-1">Cidade</label>
                                 <input className="w-full border border-gray-300 p-2 rounded text-gray-900" value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} />
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-gray-500 mb-1">Estado</label>
                                 <input className="w-full border border-gray-300 p-2 rounded text-gray-900" value={formData.state || ''} onChange={e => setFormData({...formData, state: e.target.value})} />
                             </div>
                             <div className="flex items-end">
                                 <button type="button" onClick={handleGeocode} className="w-full bg-gray-100 border border-gray-300 text-gray-700 text-xs font-bold py-2.5 rounded hover:bg-gray-200">
                                     Buscar Coordenadas Real
                                 </button>
                             </div>
                         </div>
                         {formData.latitude && formData.longitude && (
                             <div className="mt-4">
                                 <label className="block text-xs font-bold text-gray-500 mb-1">Pré-visualização do Mapa</label>
                                 <MapPreview lat={formData.latitude} lng={formData.longitude} />
                             </div>
                         )}
                    </div>

                    <div className="col-span-1 md:col-span-2 flex justify-end gap-3 pt-4 border-t border-gray-100">
                         <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50">Cancelar</button>
                         <button type="submit" className="px-8 py-3 bg-wtech-gold text-black font-bold rounded-lg hover:bg-yellow-500 shadow-lg">Salvar</button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="text-gray-900">
            <div className="flex flex-col gap-4 mb-6">
                 {/* Header Row */}
                 <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Oficinas Credenciadas</h2>
                    <div className="flex gap-2">
                        {processingCount.total > 0 && (
                            <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded text-xs font-bold flex items-center gap-2">
                                <span className="animate-spin">⚙️</span> Processando {processingCount.current}/{processingCount.total}
                            </div>
                        )}
                        
                        {!isImporting && processingCount.total === 0 && (
                            <button onClick={handleBatchGeocode} className="bg-blue-100 text-blue-800 border border-blue-200 px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-blue-200">
                                📍 Atualizar PINs (GPS)
                            </button>
                        )}

                        {selectedIds.length > 0 && (
                            <button onClick={handleBulkDelete} className="bg-red-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2 animate-in fade-in">
                                <Trash2 size={18} /> Excluir ({selectedIds.length})
                            </button>
                        )}

                        {isImporting ? (
                             <div className="flex items-center gap-2 bg-gray-100 p-2 rounded">
                                <input type="file" accept=".csv" onChange={handleCSVImport} className="text-xs" />
                                <button onClick={() => setIsImporting(false)}><X size={16}/></button>
                             </div>
                        ) : (
                            <button onClick={() => setIsImporting(true)} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded font-bold flex items-center gap-2">
                                <Upload size={18} /> Importar CSV
                            </button>
                        )}
                        <button onClick={() => { setFormData({}); setIsEditing(true); }} className="bg-wtech-gold text-black px-4 py-2 rounded font-bold flex items-center gap-2">
                            <Plus size={18} /> Novo Credenciado
                        </button>
                    </div>
                </div>

                {/* Filter Row */}
                <div className="flex gap-4">
                    <div className="flex-grow flex items-center bg-white border border-gray-200 rounded px-3 py-2">
                        <Search size={18} className="text-gray-400 mr-2" />
                        <input 
                            placeholder="Buscar por Oficina, Cidade, UF ou Região..." 
                            className="flex-grow outline-none text-sm text-gray-900"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs">
                        <tr>
                            <th className="px-4 py-3 w-10">
                                <input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.length > 0 && selectedIds.length === filteredMechanics.length} />
                            </th>
                            <th className="px-6 py-3">Oficina</th>
                            <th className="px-6 py-3">Responsável</th>
                            <th className="px-6 py-3">Local</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-900">
                        {currentMechanics.map(mech => (
                            <tr key={mech.id} className="hover:bg-gray-50">
                                <td className="px-4 py-4 w-10">
                                    <input type="checkbox" checked={selectedIds.includes(mech.id)} onChange={() => toggleSelect(mech.id)} />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold">{mech.workshopName}</div>
                                    <div className="text-xs text-gray-400">{mech.cpfCnpj}</div>
                                </td>
                                <td className="px-6 py-4">{mech.name}</td>
                                <td className="px-6 py-4">{mech.city}/{mech.state}</td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${mech.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {mech.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 flex gap-2">
                                    <button 
                                        onClick={() => toggleStatus(mech.id, mech.status)}
                                        className={`text-xs font-bold px-3 py-1 rounded ${mech.status === 'Approved' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                                    >
                                        {mech.status === 'Approved' ? 'Revogar' : 'Aprovar'}
                                    </button>
                                     <button onClick={() => { setFormData(mech); setIsEditing(true); }} className="text-gray-500 hover:text-black"><Edit size={16}/></button>
                                     <button onClick={() => handleDelete(mech.id)} className="text-red-400 hover:text-red-700"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredMechanics.length === 0 && (
                    <div className="p-10 text-center text-gray-500">Nenhum credenciado encontrado com os filtros atuais.</div>
                )}
            </div>
            {/* Pagination Controls */}
            {filteredMechanics.length > itemsPerPage && (
                <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
                    <div>
                        Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredMechanics.length)} de {filteredMechanics.length}
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={prevPage} 
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                            Anterior
                        </button>
                        <button 
                            onClick={nextPage} 
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                            Próxima
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

// --- View: Finance System ---
const FinanceView = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [receivables, setReceivables] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTrans, setNewTrans] = useState<Partial<Transaction>>({ type: 'Income', date: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        const fetchFinance = async () => {
            setLoading(true);
            
            // 1. Transactions (Real)
            const { data: trans } = await supabase.from('SITE_Transactions').select('*');
            const realTransactions = trans || [];
            
            // 2. Enrollments (Course Payments)
            const { data: enrollments } = await supabase.from('SITE_Enrollments').select('*, course:SITE_Courses(title, price)');
            
            const virtualTransactions: Transaction[] = [];
            let pending = 0;

            enrollments?.forEach((e: any) => {
                const paidTotal = e.amount_paid || 0;
                const price = e.course?.price || 0;
                
                // Calculate Pending
                if (price > paidTotal) pending += (price - paidTotal);

                // Check for Real Transactions linked to this enrollment
                // Note: We need to ensure enrollment_id is being saved in transactions for this to work perfectly.
                // If the user hasn't run the SQL update, enrollment_id might be missing in older transactions, 
                // but handleSettleBalance sends it.
                const linkedTransAmount = realTransactions
                    .filter(t => t.enrollment_id === e.id && t.type === 'Income')
                    .reduce((acc, curr) => acc + curr.amount, 0);

                // Calculate "Unrecorded" Payment (e.g., Initial Signal paid before we had the transactions table)
                const unrecordedAmount = paidTotal - linkedTransAmount;

                // Create Virtual Transaction ONLY for the unrecorded portion (gap)
                if (unrecordedAmount > 0) {
                    virtualTransactions.push({
                        id: `virt_${e.id}`, // Virtual ID
                        description: `Sinal/Inscrição: ${e.course?.title || 'Curso'} - ${e.student_name}`,
                        category: 'Sales',
                        type: 'Income',
                        amount: unrecordedAmount,
                        date: e.created_at, 
                        payment_method: e.payment_method || 'Indefinido',
                        enrollment_id: e.id
                    });
                }
            });

            // Merge Real + Virtual
            const allTrans = [...realTransactions, ...virtualTransactions].sort((a,b) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            setTransactions(allTrans);
            setReceivables(pending);
            setLoading(false);
        }
        fetchFinance();
    }, []);

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!newTrans.amount || !newTrans.description) return;

        const { data, error } = await supabase.from('SITE_Transactions').insert([newTrans]).select();
        if(error) {
            alert('Erro ao salvar: ' + error.message);
        } else if(data) {
            setTransactions([data[0], ...transactions]);
            setShowAddModal(false);
            setNewTrans({ type: 'Income', date: new Date().toISOString().split('T')[0] });
        }
    };

    const handleExportCSV = () => {
        const headers = ["Data", "Descrição", "Categoria", "Tipo", "Valor", "Método"];
        const rows = transactions.map(t => [
            new Date(t.date).toLocaleDateString(),
            t.description,
            t.category,
            t.type,
            t.amount.toString(),
            t.payment_method
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `financeiro_wtech_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    const filteredTransactions = transactions.filter(t => !filterDate || t.date.startsWith(filterDate));

    // Summary Calcs
    const income = filteredTransactions.filter(t => t.type === 'Income').reduce((acc, curr) => acc + curr.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === 'Expense').reduce((acc, curr) => acc + curr.amount, 0);
    const balance = income - expense;

    return (
        <div className="text-gray-900 animate-fade-in space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900">Gestão Financeira</h2>
                    <p className="text-gray-500 text-sm">Controle de fluxo de caixa e previsões</p>
                </div>
                <div className="flex gap-2">
                    <input type="date" className="border rounded-lg px-3 py-2 text-sm bg-white" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                    <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 font-bold text-sm bg-white">
                        <Download size={16} /> Exportar
                    </button>
                    <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-wtech-black text-white rounded-lg hover:bg-gray-800 font-bold text-sm shadow-lg">
                        <Plus size={16} /> Nova Transação
                    </button>
                </div>
            </div>

            {/* Monthly Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                     <div className="flex justify-between mb-4">
                         <span className="text-xs font-bold uppercase text-gray-400">Saldo Líquido</span>
                         <span className={`p-2 rounded-lg ${balance >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}><DollarSign size={20}/></span>
                     </div>
                     <h3 className={`text-2xl font-black ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>R$ {balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
                 </div>
                 <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                     <div className="flex justify-between mb-4">
                         <span className="text-xs font-bold uppercase text-gray-400">Receitas</span>
                         <span className="p-2 rounded-lg bg-green-50 text-green-600"><TrendingUp size={20}/></span>
                     </div>
                     <h3 className="text-2xl font-black text-gray-900">R$ {income.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
                 </div>
                 <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                     <div className="flex justify-between mb-4">
                         <span className="text-xs font-bold uppercase text-gray-400">Despesas</span>
                         <span className="p-2 rounded-lg bg-red-50 text-red-600"><TrendingDown size={20}/></span>
                     </div>
                     <h3 className="text-2xl font-black text-gray-900">R$ {expense.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
                 </div>
                 <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                     <div className="flex justify-between mb-4">
                         <span className="text-xs font-bold uppercase text-gray-400">A Receber (Previsão)</span>
                         <span className="p-2 rounded-lg bg-blue-50 text-blue-600"><ShoppingBag size={20}/></span>
                     </div>
                     <h3 className="text-2xl font-black text-blue-600">R$ {receivables.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
                     <p className="text-[10px] text-gray-400 mt-1">Saldos de alunos pendentes</p>
                 </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4">Descrição</th>
                            <th className="px-6 py-4">Categoria</th>
                            <th className="px-6 py-4">Data</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-900">
                        {loading ? <tr><td colSpan={5} className="p-8 text-center text-gray-400">Carregando...</td></tr> : 
                         filteredTransactions.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhuma transação encontrada.</td></tr> :
                         filteredTransactions.map(t => (
                            <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-bold">{t.description}</div>
                                    <div className="text-xs text-gray-400">{t.payment_method}</div>
                                </td>
                                <td className="px-6 py-4 text-xs font-bold uppercase text-gray-500">{t.category}</td>
                                <td className="px-6 py-4 text-gray-600">{new Date(t.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${t.type === 'Income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {t.type === 'Income' ? 'Entrada' : 'Saída'}
                                    </span>
                                </td>
                                <td className={`px-6 py-4 text-right font-bold ${t.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                                    {t.type === 'Expense' ? '-' : '+'} R$ {t.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Transaction Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold mb-4">Nova Transação</h3>
                        <form onSubmit={handleAddTransaction} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Tipo</label>
                                    <select className="w-full p-2 border rounded-lg" value={newTrans.type} onChange={e => setNewTrans({...newTrans, type: e.target.value as any})}>
                                        <option value="Income">Receita (Entrada)</option>
                                        <option value="Expense">Despesa (Saída)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Data</label>
                                    <input type="date" required className="w-full p-2 border rounded-lg" value={newTrans.date} onChange={e => setNewTrans({...newTrans, date: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Descrição</label>
                                <input required className="w-full p-2 border rounded-lg" placeholder="Ex: Venda Curso X" value={newTrans.description || ''} onChange={e => setNewTrans({...newTrans, description: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Valor (R$)</label>
                                    <input type="number" step="0.01" required className="w-full p-2 border rounded-lg font-bold" value={newTrans.amount || ''} onChange={e => setNewTrans({...newTrans, amount: parseFloat(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Categoria</label>
                                    <input className="w-full p-2 border rounded-lg" placeholder="Ex: Marketing" value={newTrans.category || ''} onChange={e => setNewTrans({...newTrans, category: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Método Pagamento</label>
                                <select className="w-full p-2 border rounded-lg" value={newTrans.payment_method || ''} onChange={e => setNewTrans({...newTrans, payment_method: e.target.value})}>
                                    <option value="">Selecione...</option>
                                    <option value="Pix">Pix</option>
                                    <option value="Cartão Crédito">Cartão de Crédito</option>
                                    <option value="Boleto">Boleto</option>
                                    <option value="Dinheiro">Dinheiro</option>
                                    <option value="Transferência">Transferência</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-bold">Cancelar</button>
                                <button type="submit" className="px-6 py-2 bg-wtech-black text-white rounded-lg font-bold shadow hover:bg-gray-800">Salvar Transação</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- View: Orders ---
const OrdersView = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase.from('SITE_Orders').select('*').order('date', {ascending: false});
            if (data) setOrders(data.map((o:any) => ({...o, customerName: o.customer_name, customerEmail: o.customer_email})));
        }
        fetch();
    }, []);

    return (
        <div className="text-gray-900">
            <h2 className="text-xl font-bold mb-6">Pedidos Recentes</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs">
                        <tr>
                            <th className="px-6 py-3">ID Pedido</th>
                            <th className="px-6 py-3">Cliente</th>
                            <th className="px-6 py-3">Data</th>
                            <th className="px-6 py-3">Total</th>
                            <th className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-900">
                        {orders.map(order => (
                            <tr key={order.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-mono text-xs">{order.id.slice(0,8).toUpperCase()}</td>
                                <td className="px-6 py-4">
                                    <div className="font-bold">{order.customerName}</div>
                                    <div className="text-xs text-gray-500">{order.customerEmail}</div>
                                </td>
                                <td className="px-6 py-4">{new Date(order.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}</td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${order.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {order.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- View: Settings ---
const SettingsView = () => {
    const [keys, setKeys] = useState<any>({});
    const [webhooks, setWebhooks] = useState<any>({});
    
    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase.from('SITE_Settings').select('*');
            if(data) {
                const map: any = {};
                data.forEach((item: any) => map[item.key] = item.value);
                setKeys(map);
                setWebhooks(map);
            }
        };
        fetchSettings();
    }, []);

    const saveSetting = async (key: string, value: string) => {
        await supabase.from('SITE_Settings').upsert({ key, value });
        alert('Salvo!');
    };

    return (
        <div className="max-w-4xl text-gray-900 space-y-8">
            <h2 className="text-xl font-bold">Configurações do Sistema</h2>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="font-bold mb-4 text-gray-900">Chaves de API (Integrações)</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gemini AI Key (Google)</label>
                        <div className="flex gap-2">
                            <input type="password" className="flex-grow border border-gray-300 p-2 rounded text-sm text-gray-900" defaultValue={keys.gemini_api_key} onBlur={(e) => saveSetting('gemini_api_key', e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Asaas API Key (Pagamentos)</label>
                        <div className="flex gap-2">
                            <input type="password" className="flex-grow border border-gray-300 p-2 rounded text-sm text-gray-900" defaultValue={keys.asaas_api_key} onBlur={(e) => saveSetting('asaas_api_key', e.target.value)} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="font-bold mb-4 text-gray-900">Webhooks (Automação n8n/Zapier)</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Novo Lead (CRM)</label>
                        <input className="w-full border border-gray-300 p-2 rounded text-sm text-gray-900" defaultValue={webhooks.webhook_lead} onBlur={(e) => saveSetting('webhook_lead', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Novo Pedido (Venda)</label>
                        <input className="w-full border border-gray-300 p-2 rounded text-sm text-gray-900" defaultValue={webhooks.webhook_order} onBlur={(e) => saveSetting('webhook_order', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Novo Credenciado</label>
                        <input className="w-full border border-gray-300 p-2 rounded text-sm text-gray-900" defaultValue={webhooks.webhook_mechanic} onBlur={(e) => saveSetting('webhook_mechanic', e.target.value)} />
                    </div>
                </div>
            </div>
            
             <button onClick={seedDatabase} className="bg-gray-200 text-gray-800 px-4 py-2 rounded text-xs font-bold hover:bg-gray-300">
                 (Dev) Resetar/Semear Banco de Dados
             </button>
        </div>
    );
};

// --- View: Team (Collaborators) ---
const TeamView = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Partial<User>>({});

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const { data } = await supabase.from('SITE_Users').select('*');
        if (data) setUsers(data);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            name: editingUser.name,
            email: editingUser.email,
            role: editingUser.role || 'VIEWER',
            permissions: editingUser.permissions || {},
            password: editingUser.password || '123'
        };

        if (editingUser.id) {
             await supabase.from('SITE_Users').update(payload).eq('id', editingUser.id);
        } else {
             await supabase.from('SITE_Users').insert([{
                 ...payload, 
                 avatar: `https://ui-avatars.com/api/?name=${editingUser.name}&background=random`
             }]);
        }
        setIsModalOpen(false);
        fetchUsers();
    };

    const handlePermissionChange = (perm: keyof User['permissions']) => {
        setEditingUser(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions as any,
                [perm]: !prev.permissions?.[perm]
            }
        }));
    };

    return (
        <div className="text-gray-900 relative">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Colaboradores e Permissões</h2>
                <button onClick={() => { setEditingUser({}); setIsModalOpen(true); }} className="bg-wtech-gold text-black px-4 py-2 rounded font-bold flex items-center gap-2">
                    <Plus size={18} /> Novo Usuário
                </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map(u => (
                    <div key={u.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
                        <img src={u.avatar} className="w-16 h-16 rounded-full mb-4" />
                        <h3 className="font-bold text-lg text-gray-900">{u.name}</h3>
                        <p className="text-gray-500 text-sm mb-2">{u.email}</p>
                        <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded uppercase mb-4">{u.role}</span>
                        
                        <div className="w-full text-left space-y-2 mb-6">
                            <p className="text-xs font-bold text-gray-400 uppercase">Acessos:</p>
                            <div className="flex flex-wrap gap-2">
                                {u.permissions?.viewFinance && <span className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded">Financeiro</span>}
                                {u.permissions?.manageContent && <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded">Conteúdo</span>}
                                {u.permissions?.manageOrders && <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-1 rounded">Pedidos</span>}
                            </div>
                        </div>

                        <button onClick={() => { setEditingUser(u); setIsModalOpen(true); }} className="mt-auto w-full border border-gray-200 py-2 rounded text-sm hover:bg-gray-50 text-gray-700">
                            Gerenciar Acesso
                        </button>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md text-gray-900">
                        <h3 className="font-bold text-lg mb-4">{editingUser.id ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <input className="w-full border border-gray-300 p-2 rounded text-gray-900" placeholder="Nome" value={editingUser.name || ''} onChange={e => setEditingUser({...editingUser, name: e.target.value})} required />
                            <input className="w-full border border-gray-300 p-2 rounded text-gray-900" placeholder="E-mail" value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email: e.target.value})} required />
                            {!editingUser.id && <input className="w-full border border-gray-300 p-2 rounded text-gray-900" placeholder="Senha Provisória" value={editingUser.password || ''} onChange={e => setEditingUser({...editingUser, password: e.target.value})} required />}
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Permissões</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-gray-700"><input type="checkbox" checked={editingUser.permissions?.viewFinance || false} onChange={() => handlePermissionChange('viewFinance')} /> Acesso Financeiro</label>
                                    <label className="flex items-center gap-2 text-gray-700"><input type="checkbox" checked={editingUser.permissions?.manageContent || false} onChange={() => handlePermissionChange('manageContent')} /> Acesso Conteúdo (Blog/Cursos)</label>
                                    <label className="flex items-center gap-2 text-gray-700"><input type="checkbox" checked={editingUser.permissions?.manageTeam || false} onChange={() => handlePermissionChange('manageTeam')} /> Gestão de Equipe</label>
                                    <label className="flex items-center gap-2 text-gray-700"><input type="checkbox" checked={editingUser.permissions?.manageOrders || false} onChange={() => handlePermissionChange('manageOrders')} /> Gestão de Pedidos</label>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 border py-2 rounded text-gray-700">Cancelar</button>
                                <button type="submit" className="flex-1 bg-wtech-gold font-bold py-2 rounded">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Main Admin Layout ---

const Admin: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
        navigate('/'); 
    }
  }, [user, loading, navigate]);

  if (loading || !user) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wtech-gold"></div></div>;
  
  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* Sidebar */}
      <aside className="w-64 bg-wtech-black text-white flex flex-col shadow-2xl z-20 flex-shrink-0">
        <div className="p-6 border-b border-gray-800 flex items-center justify-center">
            <span className="text-xl font-bold tracking-tighter">W-TECH <span className="text-wtech-gold">ADMIN</span></span>
        </div>
        
        <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          <div className="mb-6">
            <p className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Principal</p>
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
            <SidebarItem icon={KanbanSquare} label="CRM / Leads" active={currentView === 'crm'} onClick={() => setCurrentView('crm')} />
            <SidebarItem icon={ShoppingBag} label="Pedidos" active={currentView === 'orders'} onClick={() => setCurrentView('orders')} />
          </div>
          
          <div className="mb-6">
            <p className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Conteúdo</p>

            <SidebarItem icon={FileText} label="Gerenciar Blog" active={currentView === 'blog_manager'} onClick={() => setCurrentView('blog_manager')} />
            <SidebarItem icon={GraduationCap} label="Cursos & Agenda" active={currentView === 'courses_manager'} onClick={() => setCurrentView('courses_manager')} />
            <SidebarItem icon={Monitor} label="Landing Pages" active={currentView === 'lp_builder'} onClick={() => setCurrentView('lp_builder')} />
          </div>

          <div className="mb-6">
            <p className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Gestão</p>
            <SidebarItem icon={BadgeCheck} label="Credenciados" active={currentView === 'mechanics'} onClick={() => setCurrentView('mechanics')} />
            <SidebarItem icon={Briefcase} label="Colaboradores" active={currentView === 'team'} onClick={() => setCurrentView('team')} />
            <SidebarItem icon={DollarSign} label="Fluxo de Caixa" active={currentView === 'finance'} onClick={() => setCurrentView('finance')} />
          </div>

          <div>
             <p className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sistema</p>
             <SidebarItem icon={Settings} label="Configurações" active={currentView === 'settings'} onClick={() => setCurrentView('settings')} />
          </div>
        </nav>

        <div className="p-4 border-t border-gray-800">
           <button onClick={logout} className="w-full mb-4 flex items-center justify-center gap-2 bg-gray-800 hover:bg-red-900/50 hover:text-red-200 py-2 rounded text-xs font-bold text-gray-400 transition-colors">
             <LogOut size={14} /> Sair do Sistema
           </button>
          <div className="flex items-center gap-3">
            <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-wtech-gold" alt="Avatar" />
            <div>
              <p className="text-sm font-bold text-white">{user.name}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">{user.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50 text-gray-900">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex justify-between items-center px-8 shadow-sm z-10 flex-shrink-0">
          <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 w-96">
            <Search size={18} className="text-gray-400 mr-2" />
            <input 
              type="text" 
              placeholder="Buscar no sistema..." 
              className="bg-transparent border-none focus:outline-none text-sm w-full text-gray-900"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-wtech-black transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-auto p-8 custom-scrollbar relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {currentView === 'dashboard' && <DashboardView />}
              {currentView === 'crm' && <CRMView />}
              {currentView === 'orders' && <OrdersView />}
              {currentView === 'mechanics' && <MechanicsView />}
              {currentView === 'finance' && <FinanceView />}
              {currentView === 'settings' && <SettingsView />}
              {currentView === 'team' && <TeamView />}

              {currentView === 'blog_manager' && <BlogManagerView />}
              {currentView === 'courses_manager' && <CoursesManagerView />}
              {currentView === 'lp_builder' && <LandingPagesView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Admin;
