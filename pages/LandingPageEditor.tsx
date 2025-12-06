import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Course, LandingPage } from '../types';
import { X, Save, Plus, Trash2, Layout, Video, User, CheckSquare, Loader2, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

interface LandingPageEditorProps {
    course: Course;
    onClose: () => void;
}

export const LandingPageEditor: React.FC<LandingPageEditorProps> = ({ course, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'hero' | 'content' | 'instructor'>('hero');
    
    // Initial State Template
    const [lp, setLp] = useState<Partial<LandingPage>>({
        courseId: course.id,
        title: course.title,
        subtitle: 'Domine a arte da suspensão de motos com a metodologia W-Tech.',
        slug: course.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
        heroImage: course.image || '',
        benefits: [
            { title: 'Fundamentos Teóricos', description: 'Hidráulica, Mola, SAG, Atrito e Qualidade de Trabalho.' },
            { title: 'Técnica de Revalvulação', description: 'Aprenda a personalizar e preparar suspensões para alta performance.' },
            { title: 'Prática de Oficina', description: 'Montagem, desmontagem e dicas essenciais para o dia-a-dia.' },
            { title: 'Análise de Modelos', description: 'Variações entre suspensões atuais e tradicionais. Diagnóstico técnico.' },
            { title: 'Peças e Ferramentas', description: 'Acesso a projetos e desenvolvimentos próprios da W-Tech.' },
            { title: 'Seja um Credenciado', description: 'Tabela de preços exclusiva e suporte técnico contínuo para parceiros.' }
        ],
        instructorName: 'Alex Crepaldi',
        instructorBio: 'Referência nacional em suspensões, Alex Crepaldi ensina as técnicas de acerto e ajuste em todos os modelos. Torne-se um profissional diferenciado ao associar-se à empresa líder no mercado nacional e desfrute de todas as vantagens de ser um credenciado W-Tech!',
        instructorImage: 'https://w-techbrasil.com.br/wp-content/uploads/2021/05/alex-crepaldi.jpg', // Placeholder valid URL if available, or keep empty
        whatsappNumber: '5511999999999'
    });

    useEffect(() => {
        fetchLandingPage();
    }, [course.id]);

    const fetchLandingPage = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('SITE_LandingPages')
            .select('*')
            .eq('course_id', course.id)
            .single();

        if (data) {
            setLp({
                ...data,
                // Explicit mapping because DB is snake_case and interface is camelCase
                courseId: data.course_id,
                heroImage: data.hero_image,
                videoUrl: data.video_url,
                instructorName: data.instructor_name,
                instructorBio: data.instructor_bio,
                instructorImage: data.instructor_image,
                whatsappNumber: data.whatsapp_number
            });
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        console.log("Saving Landing Page...", lp);
        try {
            const { data, error } = await supabase
                .from('SITE_LandingPages')
                .upsert({
                    course_id: course.id,
                    slug: lp.slug,
                    title: lp.title,
                    subtitle: lp.subtitle,
                    hero_image: lp.heroImage,
                    video_url: lp.videoUrl,
                    benefits: lp.benefits,
                    instructor_name: lp.instructorName,
                    instructor_bio: lp.instructorBio,
                    instructor_image: lp.instructorImage,
                    whatsapp_number: lp.whatsappNumber
                }, { onConflict: 'course_id' })
                .select()
                .single();

            if (error) {
                console.error("Save Error:", error);
                throw error;
            }

            console.log("Save Success, returned:", data);
            
            // Update local state with the confirmed data from DB
            if (data) {
                setLp(prev => ({
                    ...prev,
                    ...data,
                    // Map back snake_case to camelCase where necessary if data returns raw keys
                    // Note: Supabase JS client usually returns keys matching the query or table columns (snake_case)
                    // We need to ensure we map them back to our internal camelCase state if we use it for rendering.
                    
                    // Actually, the 'lp' state uses camelCase (heroImage), but DB returns snake_case (hero_image).
                    // We must map it back manually to avoid breaking the UI.
                    heroImage: data.hero_image,
                    videoUrl: data.video_url,
                    instructorName: data.instructor_name,
                    instructorBio: data.instructor_bio,
                    instructorImage: data.instructor_image,
                    whatsappNumber: data.whatsapp_number
                }));
            }

            alert('Página salva com sucesso! (Dados confirmados)');
        } catch (err: any) {
            console.error("Catch Error:", err);
            alert('Erro ao salvar: ' + (err.message || JSON.stringify(err)));
        } finally {
            setSaving(false);
        }
    };

    const updateBenefit = (index: number, field: string, value: string) => {
        const newBenefits = [...(lp.benefits || [])];
        newBenefits[index] = { ...newBenefits[index], [field]: value };
        setLp({ ...lp, benefits: newBenefits });
    };

    const addBenefit = () => {
        setLp({ ...lp, benefits: [...(lp.benefits || []), { title: 'Novo Benefício', description: 'Descrição...' }] });
    };

    const removeBenefit = (index: number) => {
        const newBenefits = [...(lp.benefits || [])];
        newBenefits.splice(index, 1);
        setLp({ ...lp, benefits: newBenefits });
    };

    if (loading) return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white p-8 rounded-lg flex items-center gap-4">
                <Loader2 className="animate-spin text-wtech-gold" /> Carregando editor...
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white text-gray-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Layout className="text-wtech-gold" /> Editor de Landing Page
                        </h2>
                        <p className="text-gray-500 text-sm">Editando página para: <span className="font-semibold text-black">{course.title}</span></p>
                    </div>
                    <div className="flex gap-3">
                         <a href={`#/lp/${lp.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm">
                            <LinkIcon size={16} /> Visualizar
                        </a>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex flex-1 overflow-hidden">
                    
                    {/* Sidebar Tabs */}
                    <div className="w-64 bg-gray-50 border-r border-gray-100 p-4 space-y-2">
                        <button onClick={() => setActiveTab('hero')} className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'hero' ? 'bg-black text-white shadow-lg' : 'text-gray-600 hover:bg-gray-200'}`}>
                            <Layout size={18} /> Hero & Capa
                        </button>
                        <button onClick={() => setActiveTab('content')} className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'content' ? 'bg-black text-white shadow-lg' : 'text-gray-600 hover:bg-gray-200'}`}>
                            <CheckSquare size={18} /> Conteúdo & Vídeo
                        </button>
                        <button onClick={() => setActiveTab('instructor')} className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'instructor' ? 'bg-black text-white shadow-lg' : 'text-gray-600 hover:bg-gray-200'}`}>
                            <User size={18} /> Instrutor
                        </button>
                    </div>

                    {/* Form Area */}
                    <div className="flex-1 p-8 overflow-y-auto">
                        
                        {activeTab === 'hero' && (
                            <div className="space-y-6 animate-fade-in">
                                <h3 className="text-xl font-bold border-b pb-2 mb-4">Informações Principais</h3>
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 mb-1">Título da Página (H1)</label>
                                    <input className="w-full bg-gray-50 border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all" value={lp.title || ''} onChange={e => setLp({ ...lp, title: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 mb-1">Subtítulo (Headline)</label>
                                    <textarea rows={3} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all" value={lp.subtitle || ''} onChange={e => setLp({ ...lp, subtitle: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 mb-1">URL Slug (ex: curso-bh)</label>
                                    <div className="flex items-center">
                                        <span className="p-3 bg-gray-100 border border-r-0 border-gray-200 text-gray-500 rounded-l-lg text-sm">w-tech.com/curso/</span>
                                        <input className="flex-1 bg-white border border-gray-200 p-3 rounded-r-lg focus:ring-2 focus:ring-black outline-none transition-all" value={lp.slug || ''} onChange={e => setLp({ ...lp, slug: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 mb-1">Imagem de Capa (URL)</label>
                                    <div className="flex gap-2">
                                        <input className="flex-1 bg-gray-50 border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all" value={lp.heroImage || ''} onChange={e => setLp({ ...lp, heroImage: e.target.value })} placeholder="https://..." />
                                        {lp.heroImage && <img src={lp.heroImage} className="w-12 h-12 object-cover rounded shadow" alt="Preview" />}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'content' && (
                            <div className="space-y-6 animate-fade-in">
                                <h3 className="text-xl font-bold border-b pb-2 mb-4">Conteúdo e Benefícios</h3>
                                
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <label className="block text-sm font-bold text-gray-500 mb-1 flex items-center gap-2"><Video size={16} /> Vídeo de Vendas (Youtube URL)</label>
                                    <input className="w-full bg-white border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all" value={lp.videoUrl || ''} onChange={e => setLp({ ...lp, videoUrl: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="block text-sm font-bold text-gray-500">Módulos / Benefícios</label>
                                        <button onClick={addBenefit} className="text-xs bg-black text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-gray-800"><Plus size={12} /> Adicionar Item</button>
                                    </div>
                                    <div className="space-y-4">
                                        {lp.benefits?.map((benefit, idx) => (
                                            <div key={idx} className="flex gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 group">
                                                <div className="flex-1 space-y-2">
                                                    <input className="w-full bg-white border border-gray-200 p-2 rounded text-sm font-bold" value={benefit.title} placeholder="Título do Benefício" onChange={e => updateBenefit(idx, 'title', e.target.value)} />
                                                    <input className="w-full bg-white border border-gray-200 p-2 rounded text-sm text-gray-600" value={benefit.description} placeholder="Descrição curta" onChange={e => updateBenefit(idx, 'description', e.target.value)} />
                                                </div>
                                                <button onClick={() => removeBenefit(idx)} className="self-center p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'instructor' && (
                            <div className="space-y-6 animate-fade-in">
                                <h3 className="text-xl font-bold border-b pb-2 mb-4">Quem é o Instrutor?</h3>
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 mb-1">Nome do Instrutor</label>
                                    <input className="w-full bg-gray-50 border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all" value={lp.instructorName || ''} onChange={e => setLp({ ...lp, instructorName: e.target.value })} />
                                </div>
                                <div className="flex gap-6">
                                    <div className="flex-1">
                                        <label className="block text-sm font-bold text-gray-500 mb-1">Biografia</label>
                                        <textarea rows={5} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all" value={lp.instructorBio || ''} onChange={e => setLp({ ...lp, instructorBio: e.target.value })} />
                                    </div>
                                    <div className="w-1/3">
                                        <label className="block text-sm font-bold text-gray-500 mb-1">Foto (URL)</label>
                                        <div className="space-y-2">
                                            <input className="w-full bg-gray-50 border border-gray-200 p-2 rounded-lg text-sm" value={lp.instructorImage || ''} onChange={e => setLp({ ...lp, instructorImage: e.target.value })} placeholder="http://..." />
                                            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                                                {lp.instructorImage ? <img src={lp.instructorImage} className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-300" />}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                    </div>
                </div>

                {/* Footer Save Actions */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 transition-colors">
                     <button onClick={onClose} className="px-6 py-3 rounded-lg font-bold text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors">
                         Cancelar
                     </button>
                     <button onClick={handleSave} disabled={saving} className="px-8 py-3 bg-black text-wtech-gold rounded-lg font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg flex items-center gap-2">
                         {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Salvar Página
                     </button>
                </div>
            </div>
        </div>
    );
};
