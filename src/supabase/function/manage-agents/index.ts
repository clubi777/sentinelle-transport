// supabase/functions/manage-agents/index.ts
//
// Déploiement : supabase functions deploy manage-agents
// Secrets requis (supabase secrets set) :
//   SUPABASE_URL              (auto-fourni par la plateforme)
//   SUPABASE_ANON_KEY         (auto-fourni)
//   SUPABASE_SERVICE_ROLE_KEY (à définir manuellement — Settings > API > service_role)
//
// Appel depuis le front : POST avec header "Authorization: Bearer <access_token de l'admin>"
// Body JSON : { action: "create" | "update" | "delete" | "reset_password", payload: {...} }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const EMAIL_DOMAIN = 'sentinelle.local';
const toEmail = (matricule: string) =>
  `${matricule.trim().toLowerCase()}@${EMAIL_DOMAIN}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return json({ error: 'Non authentifié.' }, 401);

    // Client "caller" : sert uniquement à identifier qui appelle
    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await callerClient.auth.getUser(
      token
    );
    if (userErr || !userData?.user)
      return json({ error: 'Session invalide.' }, 401);

    // Client "admin" : clé service_role, ne jamais exposer au front
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Vérifie que l'appelant est bien admin
    const { data: callerAgent, error: agentErr } = await admin
      .from('agents')
      .select('role')
      .eq('id', userData.user.id)
      .single();
    if (agentErr || callerAgent?.role !== 'admin') {
      return json({ error: 'Accès réservé aux administrateurs.' }, 403);
    }

    const { action, payload } = await req.json();

    if (action === 'create') {
      const { matricule, nom, equipe, role, password, ligne_affectee } =
        payload;
      if (!matricule || !nom || !equipe || !role || !password) {
        return json({ error: 'Champs manquants.' }, 400);
      }
      if (role === 'agent_station' && !ligne_affectee) {
        return json(
          {
            error:
              'Merci de préciser la ligne affectée pour un agent de station.',
          },
          400
        );
      }
      const { data, error } = await admin.auth.admin.createUser({
        email: toEmail(matricule),
        password,
        email_confirm: true, // pas d'email de confirmation à envoyer
        user_metadata: {
          matricule,
          nom,
          equipe,
          role,
          ligne_affectee: role === 'agent_station' ? ligne_affectee : null,
        },
      });
      if (error) return json({ error: error.message }, 400);

      // Écrit explicitement les champs dans public.agents : on ne dépend pas
      // du trigger de synchronisation auth.users -> public.agents, qui peut
      // ne pas recopier tous les champs (c'est ce qui causait ligne_affectee
      // = NULL en base malgré une création "réussie").
      const { error: agentWriteError } = await admin
        .from('agents')
        .update({
          matricule,
          nom,
          equipe,
          role,
          ligne_affectee: role === 'agent_station' ? ligne_affectee : null,
        })
        .eq('id', data.user!.id);
      if (agentWriteError) return json({ error: agentWriteError.message }, 400);

      return json({ ok: true, id: data.user?.id });
    }

    if (action === 'update') {
      const { id, nom, equipe, role, actif, ligne_affectee } = payload;
      if (!id) return json({ error: 'id manquant.' }, 400);
      if (role === 'agent_station' && !ligne_affectee) {
        return json(
          {
            error:
              'Merci de préciser la ligne affectée pour un agent de station.',
          },
          400
        );
      }
      const { error } = await admin
        .from('agents')
        .update({
          nom,
          equipe,
          role,
          actif,
          ligne_affectee: role === 'agent_station' ? ligne_affectee : null,
        })
        .eq('id', id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === 'reset_password') {
      const { id, password } = payload;
      if (!id || !password) return json({ error: 'Champs manquants.' }, 400);
      const { error } = await admin.auth.admin.updateUserById(id, { password });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === 'delete') {
      const { id } = payload;
      if (!id) return json({ error: 'id manquant.' }, 400);
      // La suppression de l'utilisateur Auth cascade sur public.agents (on delete cascade)
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ error: 'Action inconnue.' }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
