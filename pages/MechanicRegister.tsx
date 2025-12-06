import React, { useState } from 'react';
import { Check, Upload, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { triggerWebhook } from '../lib/webhooks';

const MechanicRegister: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    workshopName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    specialty: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        // Geocode Address
        let lat = null;
        let lng = null;
        if (formData.city && formData.state) {
            try {
                const addressQuery = `${formData.city}, ${formData.state}, Brazil`;
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}`);
                const data = await response.json();
                if (data && data.length > 0) {
                    lat = parseFloat(data[0].lat);
                    lng = parseFloat(data[0].lon);
                }
            } catch (geoError) {
                console.error("Geocoding error:", geoError);
                // Continue without coords if fails
            }
        }

        const payload = {
            name: formData.name,
            workshop_name: formData.workshopName,
            email: formData.email,
            phone: formData.phone,
            city: formData.city,
            state: formData.state,
            specialty: formData.specialty.split(',').map(s => s.trim()), // Convert to array
            description: formData.description,
            status: 'Pending',
            photo: `https://ui-avatars.com/api/?name=${formData.name}&background=random`, // Placeholder
            latitude: lat,
            longitude: lng
        };

        const { error } = await supabase
            .from('SITE_Mechanics')
            .insert([payload]);

        if (error) throw error;

        // Trigger Webhook
        await triggerWebhook('webhook_mechanic', payload);

        setSubmitted(true);
    } catch (err) {
        alert('Erro ao enviar cadastro. Tente novamente.');
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  if (submitted) {
    return (
        <div className="container mx-auto px-4 py-20 text-center max-w-lg">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check size={40} />
            </div>
            <h1 className="text-3xl font-bold text-wtech-black mb-4">Cadastro Enviado!</h1>
            <p className="text-gray-600 mb-8">
                Recebemos sua solicitação para ser um parceiro Credenciado W-TECH. Nossa equipe analisará seus dados e entrará em contato em breve.
            </p>
            <Link to="/" className="bg-wtech-gold text-black font-bold py-3 px-8 rounded hover:bg-yellow-500 transition-colors">
                Voltar para Home
            </Link>
        </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-wtech-black">Seja um Credenciado W-TECH</h1>
            <p className="text-gray-600 mt-2">Junte-se à rede de especialistas em suspensão mais respeitada do Brasil.</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-wtech-black text-white p-6">
                <h2 className="text-xl font-bold">Ficha de Solicitação</h2>
                <p className="text-gray-400 text-sm">Preencha os dados da sua oficina</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Nome do Responsável</label>
                        <input 
                            required
                            type="text" 
                            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:border-wtech-gold"
                            placeholder="Seu nome completo"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Nome da Oficina</label>
                        <input 
                            required
                            type="text" 
                            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:border-wtech-gold"
                            placeholder="Nome fantasia"
                            value={formData.workshopName}
                            onChange={e => setFormData({...formData, workshopName: e.target.value})}
                        />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">E-mail</label>
                        <input 
                            required
                            type="email" 
                            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:border-wtech-gold"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Telefone / WhatsApp</label>
                        <input 
                            required
                            type="tel" 
                            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:border-wtech-gold"
                            placeholder="(00) 00000-0000"
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                        />
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Cidade</label>
                        <input 
                            required
                            type="text" 
                            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:border-wtech-gold"
                            value={formData.city}
                            onChange={e => setFormData({...formData, city: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Estado</label>
                        <input 
                            required
                            type="text" 
                            maxLength={2}
                            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:border-wtech-gold uppercase"
                            placeholder="UF"
                            value={formData.state}
                            onChange={e => setFormData({...formData, state: e.target.value})}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Especialidades (separe por vírgula)</label>
                    <input 
                        type="text" 
                        className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:border-wtech-gold"
                        placeholder="Ex: Suspensão, Freios, Preparação..."
                        value={formData.specialty}
                        onChange={e => setFormData({...formData, specialty: e.target.value})}
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Fotos da Oficina</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-wtech-gold transition-colors cursor-pointer bg-gray-50">
                        <Upload className="mx-auto text-gray-400 mb-2" />
                        <span className="text-gray-500 text-sm">Clique para fazer upload ou arraste arquivos</span>
                    </div>
                </div>

                <div className="flex items-start bg-blue-50 p-4 rounded text-sm text-blue-800">
                    <AlertCircle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
                    <p>Ao enviar, você concorda que seus dados passarão por uma análise técnica da W-TECH antes de serem publicados no portal.</p>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-wtech-gold text-black font-bold py-4 rounded hover:bg-yellow-500 transition-colors text-lg flex justify-center"
                >
                    {loading ? 'Enviando...' : 'ENVIAR SOLICITAÇÃO'}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default MechanicRegister;