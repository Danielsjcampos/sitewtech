import { GoogleGenAI } from "@google/genai";
import { supabase } from './supabaseClient';

export const generateBlogPost = async (topic: string, keywords: string[]) => {
  try {
    // 1. Fetch API Key from Settings
    const { data } = await supabase
      .from('SITE_Settings')
      .select('value')
      .eq('key', 'gemini_api_key')
      .single();

    if (!data || !data.value) {
      throw new Error('Chave de API do Gemini não configurada. Vá em Configurações > gemini_api_key.');
    }

    const ai = new GoogleGenAI({ apiKey: data.value });

    // 2. Construct the Prompt
    const prompt = `
      Atue como um especialista em SEO e Mecânica de Motos de Alta Performance.
      Escreva um artigo de blog completo e profissional sobre o tema: "${topic}".
      
      Palavras-chave obrigatórias: ${keywords.join(', ')}.
      
      Regras:
      1. O conteúdo deve ser técnico, autoritário, mas acessível.
      2. Use formatação HTML (<h2>, <h3>, <p>, <ul>, <strong>). NÃO use Markdown.
      3. O artigo deve ter entre 500 e 800 palavras.
      4. Otimize para SEO.

      Retorne APENAS um objeto JSON com a seguinte estrutura (sem markdown code blocks):
      {
        "title": "Título chamativo e otimizado para SEO",
        "slug": "url-amigavel-do-post",
        "seo_description": "Meta description com max 160 caracteres",
        "content": "O corpo do artigo em HTML...",
        "excerpt": "Um resumo curto de 2 linhas",
        "tags": ["tag1", "tag2", "tag3"],
        "image_prompt": "Uma descrição detalhada em inglês para gerar uma imagem fotorealista sobre este artigo"
      }
    `;

    // 3. Call Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    if (response.text) {
        return JSON.parse(response.text);
    }
    
    throw new Error("Sem resposta da IA");

  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw error;
  }
};