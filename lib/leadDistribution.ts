import { supabase } from './supabaseClient';

export const distributeLead = async () => {
    // 1. Check Mode
    const { data: setting } = await supabase.from('SITE_SystemSettings').select('value').eq('key', 'crm_distribution_mode').single();
    const mode = setting?.value || 'Manual';

    if (mode === 'Manual') return null;

    // 2. Fetch Active Collaborators
    // We fetch users who have permission 'crm_access' or simple role check. 
    // Assuming 'SITE_Users' table holds our collaborators.
    const { data: users } = await supabase.from('SITE_Users').select('id').eq('role', 'COLLABORATOR'); // Or filter by permission if available

    if (!users || users.length === 0) return null;

    // 3. Random Pick
    const randomIndex = Math.floor(Math.random() * users.length);
    return users[randomIndex].id;
};
