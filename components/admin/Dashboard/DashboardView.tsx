import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, TrendingUp, Users, ShoppingBag, Filter, MapPin, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabaseClient';

declare const L: any;

const DashboardView = () => {
    const [stats, setStats] = useState({
        revenue: 0,
        futureRevenue: 0,
        leads: 0,
        students: 0,
        activeCourses: 0,
        totalCapacity: 0 // New: for speedometer
    });
    
    // Funnel State
    const [funnelData, setFunnelData] = useState({
        total: 0,
        contacted: 0,
        negotiating: 0,
        won: 0
    });

    const [revenueHistory, setRevenueHistory] = useState<{ date: string, value: number }[]>([]);
    const [leadsHistory, setLeadsHistory] = useState<{ date: string, value: number }[]>([]);
    const [mechanics, setMechanics] = useState<any[]>([]);
    const [filterPeriod, setFilterPeriod] = useState('YYYY');

    useEffect(() => {
        async function fetchData() {
            // Date Filter Logic
            const now = new Date();
            let startDate = new Date(0).toISOString(); // Default All Time

            if (filterPeriod === '30d') {
                const d = new Date();
                d.setDate(d.getDate() - 30);
                startDate = d.toISOString();
            } else if (filterPeriod === '90d') {
                const d = new Date();
                d.setDate(d.getDate() - 90);
                startDate = d.toISOString();
            } else if (filterPeriod === 'YYYY') {
                startDate = new Date(now.getFullYear(), 0, 1).toISOString();
            }

            // 1. Leads (Modified to fetch status for Funnel)
            const { data: leadsData } = await supabase
                .from('SITE_Leads')
                .select('status') // Fetch status for funnel
                .gte('created_at', startDate);

            const fetchedLeads = leadsData || [];
            const leadsCountValue = fetchedLeads.length;

            // Calculate Funnel Breakdown
            const funnel = {
                total: fetchedLeads.length,
                contacted: fetchedLeads.filter(l => l.status === 'Contacted').length,
                negotiating: fetchedLeads.filter(l => l.status === 'Qualified' || l.status === 'Negotiating').length,
                won: fetchedLeads.filter(l => l.status === 'Converted' || l.status === 'Matriculated').length
            };
            setFunnelData(funnel);

            // 2. Enrollments & Revenue
            const { data: enrollments } = await supabase
                .from('SITE_Enrollments')
                .select('*, course:SITE_Courses(price)')
                .gte('created_at', startDate);

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

            // 3. Active Courses & Capacity (Modified for Speedometer)
            const { data: coursesData } = await supabase.from('SITE_Courses').select('id, capacity');
            const coursesCount = coursesData?.length || 0;
            const totalCapacity = coursesData?.reduce((acc: number, curr: any) => acc + (curr.capacity || 0), 0) || 0;


            // 4. Mechanics (For Map)
            const { data: mechanicsData } = await supabase.from('SITE_Mechanics').select('*');
            if (mechanicsData) setMechanics(mechanicsData);

            setStats({
                revenue: realized,
                futureRevenue: future,
                leads: leadsCountValue,
                students: studentsCount,
                activeCourses: coursesCount,
                totalCapacity
            });

            // Mock Revenue History for Chart
            setRevenueHistory([
                { date: 'Jan', value: realized * 0.1 },
                { date: 'Fev', value: realized * 0.15 },
                { date: 'Mar', value: realized * 0.2 },
                { date: 'Abr', value: realized * 0.3 },
                { date: 'Mai', value: realized * 0.6 },
                { date: 'Jun', value: realized } // Current
            ]);

            // Leads History (Mock for now, normally grouped by created_at)
            setLeadsHistory([
                { date: 'Jan', value: Math.floor(fetchedLeads.length * 0.1) },
                { date: 'Fev', value: Math.floor(fetchedLeads.length * 0.3) },
                { date: 'Mar', value: Math.floor(fetchedLeads.length * 0.5) },
                { date: 'Abr', value: Math.floor(fetchedLeads.length * 0.8) },
                { date: 'Jun', value: fetchedLeads.length }
            ]);
        }
        fetchData();
    }, [filterPeriod]); // Re-fetch when filter changes (logic to filter leads/revenue would go inside fetch)

    // Calculate Conversion Rate
    const conversionRate = stats.leads > 0 ? ((stats.students / stats.leads) * 100).toFixed(1) : '0.0';

    // --- Components ---

    const Speedometer = ({ value, max }: { value: number, max: number }) => {
        const percentage = Math.min(Math.max((value / (max || 1)), 0), 1); // 0 to 1
        
        return (
            <div className="relative w-[280px] h-[140px] overflow-hidden mx-auto group">
                 {/* Glow Background */}
                 <div className="absolute inset-0 bg-wtech-gold/20 blur-[60px] rounded-full opacity-50 group-hover:opacity-80 transition-opacity"></div>
                
                <svg viewBox="0 0 200 110" className="absolute top-0 left-0 w-full h-full drop-shadow-lg"> 
                    <defs>
                        <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ef4444" /> {/* Red - Low */}
                            <stop offset="50%" stopColor="#eab308" /> {/* Yellow - Mid */}
                            <stop offset="100%" stopColor="#22c55e" /> {/* Green - Full */}
                        </linearGradient>
                    </defs>
                    {/* Background Arc */}
                    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#f3f4f6" strokeWidth="15" strokeLinecap="round" />
                    
                    {/* Progress Arc */}
                    <path 
                        d="M 20 100 A 80 80 0 0 1 180 100" 
                        fill="none" 
                        stroke="url(#gauge-gradient)" 
                        strokeWidth="15" 
                        strokeLinecap="round"
                        strokeDasharray="251.2" // Circumference of half circle r=80 is pi*80 = 251.2
                        strokeDashoffset={251.2 * (1 - percentage)}
                        className="transition-all duration-1000 ease-out"
                    />
                    
                    {/* Needle */}
                     <g transform={`rotate(${(percentage * 180) - 90}, 100, 100)`} className="transition-transform duration-1000 ease-out drop-shadow-md">
                         <polygon points="100,105 95,90 100,15 105,90" fill="#1f2937"/>
                         <circle cx="100" cy="100" r="6" fill="#1f2937"/>
                         <circle cx="100" cy="100" r="2" fill="#d4af37"/>
                     </g>
                </svg>

                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center translate-y-1">
                    <span className="text-4xl font-black text-gray-900 leading-none tracking-tighter">{(percentage * 100).toFixed(0)}%</span>
                </div>
            </div>
        )
    }

    const Funnel3D = () => {
        const max = Math.max(funnelData.total, 1);
        
        const layers = [
           { label: 'Visitantes', sub: 'Total Leads', value: funnelData.total, color: '#fbbf24', width: 280 }, // Top
           { label: 'Oportunidades', sub: 'Em Atendimento', value: funnelData.contacted, color: '#ef4444', width: 220 },
           { label: 'Negociação', sub: 'Propostas', value: funnelData.negotiating, color: '#22c55e', width: 160 },
           { label: 'Clientes', sub: 'Fechamento', value: funnelData.won, color: '#3b82f6', width: 100 }, // Bottom
        ];

        return (
            <div className="flex flex-col items-center justify-center py-4 relative">
                 {/* SVG Funnel */}
                 <div className="relative">
                    {layers.map((layer, i) => {
                        const h = 45;
                        const wTop = layer.width;
                        const wBottom = layers[i+1]?.width || (layer.width - 40); // Ensure bottom is smaller for funnel shape
                        const xOffset = (300 - wTop) / 2;
                        const xOffsetBottom = (300 - wBottom) / 2;
                        
                        return (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="relative flex justify-center group cursor-pointer"
                                style={{ zIndex: layers.length - i }}
                            >
                                <div className="relative drop-shadow-xl transition-transform transform group-hover:scale-105">
                                     <svg width="300" height={h + 10} className="overflow-visible">
                                         <defs>
                                             <linearGradient id={`grad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                                 <stop offset="0%" stopColor={layer.color} stopOpacity="1" />
                                                 <stop offset="50%" stopColor={layer.color} stopOpacity="0.8" />
                                                 <stop offset="100%" stopColor={layer.color} stopOpacity="0.6" />
                                             </linearGradient>
                                             <filter id="glow">
                                                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                                                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                                             </filter>
                                         </defs>
                                         {/* Funnel Segment */}
                                         <path 
                                            d={`M ${xOffset},0 L ${300 - xOffset},0 L ${300 - xOffsetBottom},${h} L ${xOffsetBottom},${h} Z`} 
                                            fill={`url(#grad-${i})`}
                                            stroke="white"
                                            strokeWidth="2"
                                            strokeOpacity="0.3"
                                         />
                                     </svg>
                                     <div className="absolute inset-0 flex items-center justify-center text-white pointer-events-none">
                                         <div className="text-center">
                                             <span className="block text-lg font-black leading-none drop-shadow-md">{layer.value}</span>
                                             <span className="text-[10px] font-bold uppercase tracking-widest opacity-90 drop-shadow-sm">{layer.label}</span>
                                         </div>
                                     </div>
                                </div>
                                
                                {/* Status/Sub Label on Hover (Tooltip) */}
                                <div className="absolute right-[-140px] top-1/2 -translate-y-1/2 bg-white p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity text-xs border border-gray-100 z-50 w-32">
                                    <div className="font-bold text-gray-800">{layer.sub}</div>
                                    <div className="text-gray-500">{(layer.value / Math.max(funnelData.total,1) * 100).toFixed(0)}% conversão</div>
                                </div>
                            </motion.div>
                        )
                    })}
                 </div>
                 
                 {/* Connection Pipe Visual */}
                 <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-transparent opacity-30 mt-[-5px] rounded-full blur-[2px]"></div>
            </div>
        )
    };

    const MechanicsGlobalMap = ({ data }: { data: any[] }) => {
        const mapContainerRef = useRef<HTMLDivElement>(null);
        const mapRef = useRef<any>(null);

        // Brazil State Centers (Approximate)
        const stateCenters: Record<string, [number, number]> = {
            'SP': [-23.55, -46.63], 'RJ': [-22.90, -43.17], 'MG': [-19.92, -43.93], 'ES': [-20.31, -40.31],
            'PR': [-25.42, -49.27], 'SC': [-27.59, -48.54], 'RS': [-30.03, -51.22],
            'MS': [-20.44, -54.64], 'MT': [-15.60, -56.09], 'GO': [-16.68, -49.26], 'DF': [-15.78, -47.92],
            'BA': [-12.97, -38.50], 'SE': [-10.94, -37.07], 'AL': [-9.66, -35.73], 'PE': [-8.04, -34.87],
            'PB': [-7.11, -34.86], 'RN': [-5.79, -35.20], 'CE': [-3.71, -38.54], 'PI': [-5.08, -42.80], 'MA': [-2.53, -44.30],
            'AM': [-3.10, -60.02], 'PA': [-1.45, -48.50], 'AP': [0.03, -51.06], 'RR': [2.82, -60.67],
            'AC': [-9.97, -67.81], 'RO': [-8.76, -63.90], 'TO': [-10.17, -48.33]
        };

        useEffect(() => {
            if (mapContainerRef.current && !mapRef.current) {
                mapRef.current = L.map(mapContainerRef.current).setView([-15.78, -47.92], 3); // Reduce zoom to see whole country
                L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                    attribution: '©OpenStreetMap, ©CartoDB',
                    subdomains: 'abcd',
                    maxZoom: 19
                }).addTo(mapRef.current);
            }

            if (mapRef.current) {
                // Clear existing
                mapRef.current.eachLayer((layer: any) => {
                    if (layer instanceof L.Marker || layer instanceof L.CircleMarker) mapRef.current.removeLayer(layer);
                });

                // 1. Group Data by State
                const stateCounts: Record<string, number> = {};
                data.forEach((m) => {
                    const uf = m.state ? m.state.trim().toUpperCase() : 'UNKNOWN';
                    // Basic cleanup: if state is full name, try to map (skip for now, assume 2 letters or handle commonly)
                    // Assuming 'state' field is like 'SP', 'RJ'.
                    if (uf.length === 2 && stateCenters[uf]) {
                         stateCounts[uf] = (stateCounts[uf] || 0) + 1;
                    }
                });

                // 2. Plot Circles
                Object.entries(stateCounts).forEach(([uf, count]) => {
                    const coords = stateCenters[uf];
                    if (coords) {
                         const size = Math.min(20 + (count * 2), 60); // Dynamic size
                         
                         // Custom Icon for Number Bubble
                         const icon = L.divIcon({
                             className: 'custom-map-icon',
                             html: `
                                <div style="
                                    background-color: rgba(212, 175, 55, 0.2);
                                    border: 2px solid #D4AF37;
                                    border-radius: 50%;
                                    width: ${size}px;
                                    height: ${size}px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    color: #fff;
                                    font-weight: bold;
                                    font-size: ${Math.max(10, size/3)}px;
                                    box-shadow: 0 0 15px rgba(212, 175, 55, 0.4);
                                    transition: transform 0.3s;
                                " class="hover:scale-110">
                                    ${count}
                                </div>
                             `,
                             iconSize: [size, size],
                             iconAnchor: [size/2, size/2]
                         });

                         const marker = L.marker(coords, { icon: icon }).addTo(mapRef.current);
                         
                         // Tooltip effect
                         marker.bindTooltip(`
                             <div class="text-center">
                                 <strong class="text-wtech-gold text-lg block">${uf}</strong>
                                 <span class="text-white">${count} Credenciados</span>
                             </div>
                         `, { 
                             direction: 'top', 
                             className: 'bg-black/80 border border-wtech-gold/30 text-white rounded-lg p-2 backdrop-blur-md',
                             offset: [0, -size/2]
                         });
                    }
                });
            }
        }, [data]);

        return <div ref={mapContainerRef} className="w-full h-full rounded-2xl overflow-hidden z-0 bg-[#111]" />;
    };

    const ChartArea = ({ data, color }: { data: any[], color: string }) => {
         // Simple Area Chart Mock
         if (!data.length) return null;
         const max = Math.max(...data.map(d => d.value), 1);
         const points = data.map((d, i) => {
             const x = (i / (data.length - 1)) * 100;
             const y = 100 - (d.value / max) * 100;
             return `${x},${y}`;
         }).join(' ');

         return (
             <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                 <defs>
                     <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                         <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                         <stop offset="100%" stopColor={color} stopOpacity="0" />
                     </linearGradient>
                 </defs>
                 <path d={`M0,100 ${points} 100,100 Z`} fill={`url(#grad-${color})`} />
                 <polyline points={points} fill="none" stroke={color} strokeWidth="3" vectorEffect="non-scaling-stroke" />
             </svg>
         )
    }

    return (
        <div className="space-y-6 animate-fade-in text-gray-900 pb-10">
            {/* Filter Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-wtech-black to-gray-800 text-white rounded-lg shadow-lg">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Dashboard Executivo</h2>
                        <p className="text-xs text-gray-500 font-medium">Visão em tempo real da operação.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={filterPeriod}
                        onChange={(e) => setFilterPeriod(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2 pl-3 text-sm font-bold text-gray-700 bg-gray-50 hover:bg-white transition-all outline-none focus:ring-2 focus:ring-wtech-gold/50"
                    >
                        <option value="YYYY">Ano Atual</option>
                        <option value="30d">Últimos 30 dias</option>
                        <option value="90d">Últimos 3 Meses</option>
                    </select>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Receita Realizada', value: `R$ ${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, sub: 'Total recebido', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-500/10' },
                    { label: 'Receita Futura', value: `R$ ${stats.futureRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, sub: 'A receber de alunos', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-500/10' },
                    { label: 'Total de Leads', value: stats.leads, sub: 'Potenciais clientes', icon: Users, color: 'text-wtech-gold', bg: 'bg-yellow-500/10' },
                    { label: 'Alunos Matriculados', value: stats.students, sub: `${stats.activeCourses} Cursos ativos`, icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-500/10' },
                ].map((kpi, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 p-16 rounded-full opacity-10 blur-2xl transform translate-x-1/2 -translate-y-1/2 ${kpi.bg.replace('/10', '/30')}`}></div>
                        <div className="relative z-10">
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2">{kpi.label}</p>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">{kpi.value}</h3>
                            <span className="text-xs font-semibold text-gray-400 mt-1 block">{kpi.sub}</span>
                        </div>
                        <div className={`p-3 rounded-xl ${kpi.bg} ${kpi.color} shadow-inner`}>
                            <kpi.icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Interactive Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* 3D Funnel */}
                 <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-wtech-gold to-yellow-600"></div>
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Funil de Vendas</h2>
                            <p className="text-sm text-gray-500">Jornada do cliente em tempo real.</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                           <Users size={12} /> {funnelData.total} Total
                        </div>
                    </div>
                    <Funnel3D />
                 </div>

                 {/* Speedometer Gauge */}
                 <div className="bg-white p-8 rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-green-400/20 to-transparent rounded-bl-full"></div>
                    <div className="text-center mb-6 relative z-10">
                        <h2 className="text-lg font-bold text-gray-900">Taxa de Ocupação</h2>
                        <p className="text-xs text-gray-500">Efficiency Meter</p>
                    </div>
                    
                    <Speedometer value={stats.students} max={stats.totalCapacity || 100} />

                    <div className="grid grid-cols-2 gap-4 w-full mt-6 pt-6 border-t border-gray-100">
                        <div className="text-center group cursor-default">
                            <span className="block text-2xl font-bold text-gray-900 group-hover:text-wtech-gold transition-colors">{stats.students}</span>
                            <span className="text-[10px] text-gray-400 uppercase font-bold">Matriculados</span>
                        </div>
                        <div className="text-center group cursor-default">
                            <span className="block text-2xl font-bold text-gray-400 group-hover:text-gray-600 transition-colors">{stats.totalCapacity}</span>
                            <span className="text-[10px] text-gray-400 uppercase font-bold">Capacidade</span>
                        </div>
                    </div>
                 </div>
            </div>

            {/* Interactive Map Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
                {/* Revenue Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                     <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Performance Financeira</h3>
                            <p className="text-gray-500 text-xs">Ano atual</p>
                        </div>
                        <div className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded text-xs flex items-center gap-1">
                            <TrendingUp size={12} /> +24%
                        </div>
                    </div>
                    <div className="flex-1 relative">
                        <ChartArea data={revenueHistory} color="#d4af37" />
                    </div>
                </div>

                {/* Map */}
                <div className="lg:col-span-2 bg-gray-900 p-1 rounded-2xl shadow-xl border border-gray-800 relative overflow-hidden group">
                     <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur text-white px-4 py-2 rounded-lg border border-white/10 shadow-lg pointer-events-none">
                        <h2 className="font-bold text-sm flex items-center gap-2"><MapPin size={16} className="text-wtech-gold"/> Rede Credenciada</h2>
                        <p className="text-[10px] text-gray-400">{mechanics.length} Oficinas parceiras</p>
                     </div>
                     <MechanicsGlobalMap data={mechanics} />
                </div>
            </div>
        </div>
    );
};


export default DashboardView;
