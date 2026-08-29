import React, { useState, useMemo, useEffect, useCallback } from "react";
import { AlertTriangle, Ticket, Users, Clock, MapPin, X, ChevronRight, Activity, LogIn, ShieldCheck, Hand, Swords, MoreHorizontal, FileDown, Bell, BellOff, Copy, WifiOff, Trash2, Phone, Search, Navigation } from "lucide-react";
import { supabase } from "./supabaseClient";
import AdminPanel from "./AdminPanel";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');`;

// ---- Réseau réel (tronc commun, sans branches secondaires, pour la démo) ----
const LINES = {
  "1": { name: "Ligne 1", color: "#FFCE00", dark: false, stations: ["La Défense", "Esplanade de la Défense", "Pont de Neuilly", "Les Sablons", "Porte Maillot", "Argentine", "Charles de Gaulle–Étoile", "George V", "Franklin D. Roosevelt", "Champs-Élysées–Clemenceau", "Concorde", "Tuileries", "Palais Royal–Musée du Louvre", "Louvre-Rivoli", "Châtelet", "Hôtel de Ville", "Saint-Paul", "Bastille", "Gare de Lyon", "Reuilly–Diderot", "Nation", "Porte de Vincennes", "Saint-Mandé", "Bérault", "Château de Vincennes"] },
  "2": { name: "Ligne 2", color: "#0064B0", dark: true, stations: ["Porte Dauphine", "Victor Hugo", "Charles de Gaulle–Étoile", "Ternes", "Courcelles", "Monceau", "Villiers", "Rome", "Place de Clichy", "Blanche", "Pigalle", "Anvers", "Barbès–Rochechouart", "La Chapelle", "Stalingrad", "Jaurès", "Colonel Fabien", "Belleville", "Couronnes", "Ménilmontant", "Père Lachaise", "Philippe Auguste", "Alexandre Dumas", "Avron", "Nation"] },
  "3": { name: "Ligne 3", color: "#9F9825", dark: true, stations: ["Pont de Levallois–Bécon", "Anatole France", "Louise Michel", "Porte de Champerret", "Pereire", "Wagram", "Malesherbes", "Courcelles", "Villiers", "Europe", "Saint-Lazare", "Havre–Caumartin", "Opéra", "Quatre-Septembre", "Bourse", "Sentier", "Réaumur–Sébastopol", "Arts et Métiers", "République", "Temple", "Rue Saint-Maur", "Parmentier", "Rue des Boulets", "Nation", "Porte de Bagnolet", "Gallieni"] },
  "4": { name: "Ligne 4", color: "#C04191", dark: false, stations: ["Porte de Clignancourt", "Simplon", "Marcadet–Poissonniers", "Château Rouge", "Barbès–Rochechouart", "Gare du Nord", "Gare de l'Est", "Château d'Eau", "Strasbourg–Saint-Denis", "Réaumur–Sébastopol", "Étienne Marcel", "Les Halles", "Châtelet", "Cité", "Saint-Michel", "Odéon", "Saint-Germain-des-Prés", "Saint-Sulpice", "Saint-Placide", "Montparnasse–Bienvenüe", "Vavin", "Raspail", "Denfert-Rochereau", "Mouton-Duvernet", "Alésia", "Porte d'Orléans", "Mairie de Montrouge", "Barbara", "Bagneux–Lucie Aubrac"] },
  "5": { name: "Ligne 5", color: "#F28E42", dark: false, stations: ["Bobigny–Pablo Picasso", "Bobigny–Pantin–Raymond Queneau", "Église de Pantin", "Hoche", "Porte de Pantin", "Ourcq", "Laumière", "Jaurès", "Stalingrad", "Gare du Nord", "Gare de l'Est", "Jacques Bonsergent", "République", "Oberkampf", "Richard-Lenoir", "Bréguet–Sabin", "Bastille", "Quai de la Rapée", "Gare d'Austerlitz", "Saint-Marcel", "Campo-Formio", "Place d'Italie"] },
  "6": { name: "Ligne 6", color: "#83C491", dark: false, stations: ["Charles de Gaulle–Étoile", "Kléber", "Boissière", "Trocadéro", "Passy", "Bir-Hakeim", "Dupleix", "La Motte-Picquet–Grenelle", "Cambronne", "Sèvres–Lecourbe", "Pasteur", "Montparnasse–Bienvenüe", "Edgar Quinet", "Raspail", "Denfert-Rochereau", "Saint-Jacques", "Glacière", "Corvisart", "Place d'Italie", "Nationale", "Chevaleret", "Quai de la Gare", "Bercy", "Dugommier", "Daumesnil", "Bel-Air", "Picpus", "Nation"] },
  "7": { name: "Ligne 7", color: "#F3A4BA", dark: false, stations: ["La Courneuve–8 Mai 1945", "Fort d'Aubervilliers", "Aubervilliers–Pantin–Quatre Chemins", "Porte de la Villette", "Corentin Cariou", "Crimée", "Riquet", "Stalingrad", "Louis Blanc", "Château-Landon", "Gare de l'Est", "Poissonnière", "Cadet", "Le Peletier", "Chaussée d'Antin–La Fayette", "Opéra", "Pyramides", "Palais Royal–Musée du Louvre", "Pont Neuf", "Châtelet", "Pont Marie", "Sully–Morland", "Jussieu", "Place Monge", "Censier–Daubenton", "Les Gobelins", "Place d'Italie", "Tolbiac", "Maison Blanche", "Mairie d'Ivry"] },
  "8": { name: "Ligne 8", color: "#CEADD2", dark: false, stations: ["Balard", "Lourmel", "Boucicaut", "Félix Faure", "Commerce", "Avenue Émile Zola", "La Motte-Picquet–Grenelle", "École Militaire", "La Tour-Maubourg", "Invalides", "Concorde", "Madeleine", "Opéra", "Richelieu–Drouot", "Grands Boulevards", "Bonne Nouvelle", "Strasbourg–Saint-Denis", "République", "Filles du Calvaire", "Chemin Vert", "Bastille", "Ledru-Rollin", "Faidherbe–Chaligny", "Reuilly–Diderot", "Montgallet", "Daumesnil", "Michel Bizot", "Porte Dorée", "Porte de Charenton", "Charenton–Écoles", "Créteil–Université", "Créteil–Préfecture"] },
  "9": { name: "Ligne 9", color: "#D5C900", dark: true, stations: ["Pont de Sèvres", "Billancourt", "Marcel Sembat", "Porte de Saint-Cloud", "Exelmans", "Michel-Ange–Molitor", "Michel-Ange–Auteuil", "Jasmin", "Ranelagh", "La Muette", "Rue de la Pompe", "Trocadéro", "Iéna", "Alma–Marceau", "Franklin D. Roosevelt", "Saint-Philippe-du-Roule", "Miromesnil", "Saint-Augustin", "Havre–Caumartin", "Chaussée d'Antin–La Fayette", "Richelieu–Drouot", "Grands Boulevards", "Bonne Nouvelle", "Strasbourg–Saint-Denis", "République", "Oberkampf", "Saint-Ambroise", "Voltaire", "Charonne", "Rue des Boulets", "Nation", "Buzenval", "Maraîchers", "Porte de Montreuil", "Robespierre", "Croix de Chavaux", "Mairie de Montreuil"] },
  "10": { name: "Ligne 10", color: "#E3B32A", dark: true, stations: ["Boulogne–Pont de Saint-Cloud", "Boulogne–Jean Jaurès", "Michel-Ange–Molitor", "Michel-Ange–Auteuil", "Chardon-Lagache", "Mirabeau", "Église d'Auteuil", "Javel", "Charles Michels", "Avenue Émile Zola", "La Motte-Picquet–Grenelle", "Ségur", "Duroc", "Vaneau", "Sèvres–Babylone", "Mabillon", "Odéon", "Cluny–La Sorbonne", "Maubert-Mutualité", "Cardinal Lemoine", "Jussieu", "Gare d'Austerlitz"] },
  "11": { name: "Ligne 11", color: "#8D5E2A", dark: false, stations: ["Châtelet", "Hôtel de Ville", "Rambuteau", "Arts et Métiers", "République", "Goncourt", "Belleville", "Pyrénées", "Jourdain", "Place des Fêtes", "Télégraphe", "Porte des Lilas", "Mairie des Lilas"] },
  "12": { name: "Ligne 12", color: "#00814F", dark: true, stations: ["Front Populaire", "Porte de la Chapelle", "Marx Dormoy", "Marcadet–Poissonniers", "Jules Joffrin", "Lamarck–Caulaincourt", "Abbesses", "Pigalle", "Saint-Georges", "Notre-Dame-de-Lorette", "Trinité–d'Estienne d'Orves", "Saint-Lazare", "Madeleine", "Concorde", "Assemblée Nationale", "Solférino", "Rue du Bac", "Sèvres–Babylone", "Rennes", "Notre-Dame-des-Champs", "Montparnasse–Bienvenüe", "Falguière", "Pasteur", "Volontaires", "Vaugirard", "Convention", "Porte de Versailles", "Corentin Celton", "Mairie d'Issy"] },
  "13": { name: "Ligne 13", color: "#98D4E2", dark: false, stations: ["Asnières–Gennevilliers Les Courtilles", "Les Agnettes", "Gabriel Péri", "Mairie de Clichy", "Porte de Clichy", "Brochant", "La Fourche", "Place de Clichy", "Liège", "Saint-Lazare", "Miromesnil", "Champs-Élysées–Clemenceau", "Invalides", "Varenne", "Saint-François-Xavier", "Duroc", "Montparnasse–Bienvenüe", "Gaîté", "Pernety", "Plaisance", "Porte de Vanves", "Malakoff–Plateau de Vanves", "Malakoff–Rue Étienne Dolet", "Châtillon–Montrouge"] },
  "14": { name: "Ligne 14", color: "#662483", dark: true, stations: ["Saint-Denis–Pleyel", "Mairie de Saint-Ouen", "Saint-Ouen", "Porte de Clichy", "Pont Cardinet", "Saint-Lazare", "Madeleine", "Pyramides", "Châtelet", "Gare de Lyon", "Bercy", "Cour Saint-Émilion", "Bibliothèque François Mitterrand", "Olympiades", "Maison Blanche", "Kremlin-Bicêtre Hôpital", "Villejuif Institut Gustave Roussy", "L'Haÿ-les-Roses", "Chevilly Trois Communes", "Thiais–Orly", "Aéroport d'Orly"] },
  "A": { name: "RER A", color: "#E3051C", dark: true, stations: ["La Défense", "Charles de Gaulle–Étoile", "Auber", "Châtelet–Les Halles", "Gare de Lyon", "Nation", "Vincennes", "Val de Fontenay", "Marne-la-Vallée–Chessy"] },
  "B": { name: "RER B", color: "#5291CE", dark: true, stations: ["Aéroport Charles de Gaulle 2", "Aéroport Charles de Gaulle 1", "Parc des Expositions", "Villepinte", "Sevran–Beaudottes", "Aulnay-sous-Bois", "Le Blanc-Mesnil", "Drancy", "Le Bourget", "La Courneuve–Aubervilliers", "La Plaine–Stade de France", "Gare du Nord", "Châtelet–Les Halles", "Saint-Michel–Notre-Dame", "Luxembourg", "Port-Royal", "Denfert-Rochereau", "Cité Universitaire", "Gentilly", "Laplace", "Bourg-la-Reine", "Massy–Palaiseau", "Saint-Rémy-lès-Chevreuse"] },
};

const TYPES = {
  pickpocket: { label: "Vol à la tire", short: "VOL", icon: AlertTriangle, color: "#FF5A2E" },
  vente: { label: "Vente illégale de titres", short: "VTT", icon: Ticket, color: "#FFC145" },
  attouchement: { label: "Attouchement", short: "ATT", icon: Hand, color: "#E1306C" },
  agression: { label: "Agression", short: "AGR", icon: Swords, color: "#DC2626" },
  autre: { label: "Autre", short: "AUTRE", icon: MoreHorizontal, color: "#8AA0B4" },
};

// Pictogramme distinct par statut (forme + couleur), en plus du texte —
// plus lisible qu'un simple code couleur, notamment en un coup d'œil sur le terrain.
const STATUTS = {
  nouveau: { label: "Nouveau", color: "#FF5A2E", icon: AlertTriangle },
  pris_en_charge: { label: "Pris en charge", color: "#FFC145", icon: Clock, action: "Pris en charge par" },
  interpellation: { label: "Interpellation", color: "#23C9A7", icon: ShieldCheck, action: "Interpellé par" },
  faux_positif: { label: "Faux positif", color: "#8F99A3", icon: X, action: "Classé faux positif par" },
};

// Niveau de gravité, configurable indépendamment du type — sert à faire
// remonter les urgences en tête du fil. "rank" plus élevé = plus prioritaire.
const PRIORITES = {
  normale: { label: "Normale", short: "NORM.", color: "#8F99A3", rank: 0 },
  urgente: { label: "Urgente", short: "URGENT", color: "#FFC145", rank: 1 },
  critique: { label: "Critique", short: "CRITIQUE", color: "#DC2626", rank: 2 },
};

// Numéros d'appel rapide affichés sur les signalements graves — à adapter
// aux numéros réels du PC de ta structure.
const PC_PHONE = "0100000000";
const POLICE_PHONE = "17";

function freshness(tsMs) {
  const mins = (Date.now() - tsMs) / 60000;
  if (mins < 15) return { label: "< 15 min", color: "#FF5A2E", pulse: true };
  if (mins < 60) return { label: "< 1 h", color: "#FFC145", pulse: false };
  return { label: `${Math.round(mins / 60)} h`, color: "#8F99A3", pulse: false };
}

function fmtTime(tsMs) {
  return new Date(tsMs).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
function fmtDateTime(tsMs) {
  const d = new Date(tsMs);
  return `${d.toLocaleDateString("fr-FR")} ${fmtTime(tsMs)}`;
}

// Regroupe les signalements liés (même station, descriptions partageant au
// moins 2 mots-clés) en un seul groupe transitif par phénomène détecté,
// plutôt qu'une liste de paires — beaucoup plus lisible dès qu'il y a plus
// de 2 signalements pour le même fait.
function computeRecurrence(signalements) {
  const byLigne = {};
  for (const s of signalements) {
    const words = new Set(s.description.toLowerCase().split(/[^a-zàâçéèêëîïôûùüÿñæœ]+/).filter((w) => w.length > 3));
    // Regroupement par ligne : un même groupe/individu qui se déplace change
    // de station mais reste souvent sur la même ligne — utile notamment avec
    // le suivi de position en direct des opérateurs vidéo.
    if (!byLigne[s.ligne]) byLigne[s.ligne] = [];
    byLigne[s.ligne].push({ ...s, words });
  }

  const result = [];
  Object.entries(byLigne).forEach(([ligne, items]) => {
    if (items.length < 2) return;
    const parent = items.map((_, i) => i);
    const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
    const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb; };
    const edgeWords = {};
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const shared = [...items[i].words].filter((w) => items[j].words.has(w));
        if (shared.length >= 2) {
          union(i, j);
          edgeWords[`${i}-${j}`] = shared;
        }
      }
    }
    const byRoot = {};
    items.forEach((_, i) => {
      const root = find(i);
      if (!byRoot[root]) byRoot[root] = [];
      byRoot[root].push(i);
    });
    Object.values(byRoot).forEach((indices) => {
      if (indices.length < 2) return;
      const groupItems = indices.map((i) => items[i]).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      const sharedWords = new Set();
      indices.forEach((i) => indices.forEach((j) => { if (i < j && edgeWords[`${i}-${j}`]) edgeWords[`${i}-${j}`].forEach((w) => sharedWords.add(w)); }));
      result.push({ ligne, items: groupItems, sharedWords: [...sharedWords] });
    });
  });
  return result;
}

// Échelle de couleur à 4 paliers nets, basés sur le nombre exact de faits dans
// la case (pas un ratio relatif au max) : plus simple à lire et plus stable
// d'une période à l'autre.
function heatColor(count) {
  if (count <= 0) return { bg: "#1E262D", fg: "#8F99A3" };
  if (count === 1) return { bg: "#D9A63B", fg: "#0A0D10" }; // modéré — jaune
  if (count === 2) return { bg: "#E5342E", fg: "#FFFFFF" }; // élevé — rouge
  return { bg: "#7A1512", fg: "#FFFFFF" }; // pic (3+) — rouge foncé
}

// Libellés de rôle affichés dans le bandeau — à garder cohérents avec ROLES dans AdminPanel.jsx
const ROLE_LABELS = {
  agent_gpsr_civil: "Agent civil",
  agent_gpsr_tenue: "Agent tenue",
  agent_station: "Agent de station",
  operateur_video: "Opérateur vidéo",
  autre: "Autre",
  admin: "Administrateur",
};

function equipeLabel(s) {
  if (!s.agents) return "Équipe inconnue";
  return `${s.agents.equipe} (${s.agents.nom})`;
}

export default function Sentinelle() {
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [profile, setProfile] = useState(null); // ligne de public.agents pour l'utilisateur connecté

  const [authForm, setAuthForm] = useState({ matricule: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  const [signalements, setSignalements] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState("");

  const [activeLine, setActiveLine] = useState("1");
  const todayStr = () => new Date().toLocaleDateString("en-CA"); // format YYYY-MM-DD en heure locale
  const [searchStart, setSearchStart] = useState(todayStr());
  const [searchEnd, setSearchEnd] = useState(todayStr());
  const [searchType, setSearchType] = useState("all");
  const [searchLine, setSearchLine] = useState("all");
  const [tab, setTab] = useState("carte");
  const [showForm, setShowForm] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  // ---- Mode hors-ligne basique : file d'attente locale, envoi auto au retour réseau ----
  const OFFLINE_QUEUE_KEY = "sentinelle_offline_queue";
  const [pendingCount, setPendingCount] = useState(() => {
    try { return (JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]")).length; } catch { return 0; }
  });

  function readQueue() {
    try { return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]"); } catch { return []; }
  }
  function writeQueue(q) {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(q));
    setPendingCount(q.length);
  }
  function queueOffline(payload) {
    const q = readQueue();
    q.push({ ...payload, _localId: `${Date.now()}-${Math.random().toString(36).slice(2)}` });
    writeQueue(q);
  }
  async function flushOfflineQueue() {
    const q = readQueue();
    if (q.length === 0) return;
    const remaining = [];
    for (const item of q) {
      const { _localId, ...payload } = item;
      const { error } = await supabase.from("signalements").insert(payload);
      if (error) remaining.push(item); // toujours pas de réseau (ou erreur transitoire) : on la garde pour le prochain essai
    }
    writeQueue(remaining);
    if (remaining.length < q.length) fetchSignalements();
  }
  const [selectedPin, setSelectedPin] = useState(null);
  const [form, setForm] = useState({ line: "1", station: LINES["1"].stations[7], type: "pickpocket", priorite: "normale", nb: 1, desc: "" });
  const [formError, setFormError] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);

  // ---- Notifications (son + notif navigateur sur nouveau signalement) ----
  const [notifEnabled, setNotifEnabled] = useState(() => localStorage.getItem("sentinelle_notif") !== "off");
  const [notifScope, setNotifScope] = useState(() => localStorage.getItem("sentinelle_notif_scope") || "active"); // "active" | "all"
  const audioCtxRef = React.useRef(null);
  const profileRef = React.useRef(profile);
  const activeLineRef = React.useRef(activeLine);
  const notifEnabledRef = React.useRef(notifEnabled);
  const notifScopeRef = React.useRef(notifScope);
  const sessionRef = React.useRef(session);

  useEffect(() => { profileRef.current = profile; }, [profile]);
  useEffect(() => {
    if (profile?.role === "agent_station" && tab === "stats") setTab("carte");
  }, [profile, tab]);
  useEffect(() => { activeLineRef.current = activeLine; }, [activeLine]);
  useEffect(() => { notifEnabledRef.current = notifEnabled; }, [notifEnabled]);
  useEffect(() => { notifScopeRef.current = notifScope; }, [notifScope]);
  useEffect(() => { sessionRef.current = session; }, [session]);

  function playBeep() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;
      [0, 0.18].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.28, now + offset + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.16);
      });
    } catch { /* silence si le contexte audio n'est pas disponible */ }
  }

  function duplicateSignalement(s) {
    setActiveLine(s.ligne);
    setForm({ line: s.ligne, station: s.station, type: s.type, priorite: s.priorite || "normale", nb: s.nb_personnes, desc: s.description });
    setShowForm(true);
  }

  function toggleNotifications() {
    const next = !notifEnabled;
    setNotifEnabled(next);
    localStorage.setItem("sentinelle_notif", next ? "on" : "off");
    if (next) {
      // Le clic utilisateur débloque l'audio + déclenche la demande de permission navigateur
      playBeep();
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }

  function cycleNotifScope() {
    const next = notifScope === "active" ? "all" : "active";
    setNotifScope(next);
    localStorage.setItem("sentinelle_notif_scope", next);
  }

  function notifyNewSignalement(row) {
    if (!notifEnabledRef.current) return;
    if (row.agent_id && row.agent_id === sessionRef.current?.user?.id) return; // pas de notif pour son propre signalement
    const prof = profileRef.current;
    const isStationAgent = prof?.role === "agent_station";
    const relevant = isStationAgent
      ? row.ligne === prof.ligne_affectee
      : notifScopeRef.current === "all" || row.ligne === activeLineRef.current;
    if (!relevant) return;
    playBeep();
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      const lineName = LINES[row.ligne]?.name || row.ligne;
      const typeLabel = TYPES[row.type]?.label || row.type;
      try {
        new Notification("Nouveau signalement", {
          body: `${lineName} · ${row.station} · ${typeLabel}`,
          tag: row.id,
        });
      } catch { /* notif indisponible, le son suffit */ }
    }
  }

  // ---- Auth : écoute la session Supabase ----
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // ---- Charge le profil agent (nom, équipe, rôle) de l'utilisateur connecté ----
  useEffect(() => {
    if (!session) { setProfile(null); return; }
    supabase.from("agents").select("*").eq("id", session.user.id).single().then(({ data }) => {
      setProfile(data || null);
      if (data?.role === "agent_station" && data.ligne_affectee) {
        setActiveLine(data.ligne_affectee);
      }
    });
  }, [session]);

  // ---- Chargement des signalements + abonnement temps réel ----
  const fetchSignalements = useCallback(async () => {
    const { data, error } = await supabase
      .from("signalements")
      .select("*, agents!signalements_agent_id_fkey(nom, equipe), statut_agent:agents!signalements_statut_agent_id_fkey(nom, equipe)")
      .order("created_at", { ascending: false });
    if (error) {
      setDataError("Impossible de charger les signalements : " + error.message);
    } else {
      setDataError("");
      setSignalements(data || []);
    }
    setDataLoading(false);
  }, []);

  useEffect(() => {
    if (!session) return;
    setDataLoading(true);
    fetchSignalements();

    const channel = supabase
      .channel("signalements-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "signalements" }, (payload) => {
        notifyNewSignalement(payload.new);
        fetchSignalements();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "signalements" }, () => {
        fetchSignalements();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [session, fetchSignalements]);

  // Retente l'envoi des signalements mis en attente hors-ligne dès que le
  // réseau revient, et une fois au chargement au cas où la connexion est
  // déjà là mais que des signalements ont été mis en attente en fermant
  // l'appli précédemment.
  useEffect(() => {
    if (!session) return;
    flushOfflineQueue();
    window.addEventListener("online", flushOfflineQueue);
    return () => window.removeEventListener("online", flushOfflineQueue);
  }, [session]);

  async function handleAuth() {
    setAuthError("");
    if (!authForm.matricule.trim() || !authForm.password.trim()) {
      setAuthError("Merci de renseigner le matricule et le mot de passe.");
      return;
    }
    setAuthBusy(true);
    const email = `${authForm.matricule.trim().toLowerCase()}@sentinelle.local`;
    const { error } = await supabase.auth.signInWithPassword({ email, password: authForm.password });
    setAuthBusy(false);
    if (error) setAuthError("Matricule ou mot de passe incorrect.");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setTab("carte");
  }

  // ---- Carte Live : uniquement les signalements des dernières 24h ----
  const last24h = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return signalements
      .filter((s) => new Date(s.created_at).getTime() >= cutoff)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [signalements]);

  // ---- Recherche / filtre / tri par priorité pour le fil des signalements ----
  const [filSearch, setFilSearch] = useState("");
  const [filTypeFilter, setFilTypeFilter] = useState("tous");
  const filFeed = useMemo(() => {
    const q = filSearch.trim().toLowerCase();
    return last24h
      .filter((s) => filTypeFilter === "tous" || s.type === filTypeFilter)
      .filter((s) => !q || s.station.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
      .sort((a, b) => {
        const rankA = PRIORITES[a.priorite || "normale"]?.rank ?? 0;
        const rankB = PRIORITES[b.priorite || "normale"]?.rank ?? 0;
        if (rankA !== rankB) return rankB - rankA; // priorité la plus haute en premier
        return new Date(b.created_at) - new Date(a.created_at);
      });
  }, [last24h, filSearch, filTypeFilter]);

  const lineSignalements = useMemo(() => last24h.filter((s) => s.ligne === activeLine), [last24h, activeLine]);

  const liveStationCounts = useMemo(() => {
    const counts = {};
    last24h.forEach((s) => {
      const key = `${s.ligne}__${s.station}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [last24h]);

  // ---- Statistiques : scope piloté par le filtre (par défaut : aujourd'hui 00h–24h) ----
  const searchResults = useMemo(() => {
    const start = searchStart ? new Date(`${searchStart}T00:00:00`) : null;
    const end = searchEnd ? new Date(`${searchEnd}T23:59:59`) : null;
    return signalements
      .filter((s) => {
        const ts = new Date(s.created_at);
        if (start && ts < start) return false;
        if (end && ts > end) return false;
        if (searchType !== "all" && s.type !== searchType) return false;
        if (searchLine !== "all" && s.ligne !== searchLine) return false;
        return true;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [signalements, searchStart, searchEnd, searchType, searchLine]);

  const searchBreakdown = useMemo(() => {
    const counts = { pickpocket: 0, vente: 0, attouchement: 0, agression: 0, autre: 0 };
    searchResults.forEach((s) => { counts[s.type] = (counts[s.type] || 0) + 1; });
    return counts;
  }, [searchResults]);

  const statsStationCounts = useMemo(() => {
    const counts = {};
    searchResults.forEach((s) => {
      const key = `${s.ligne}__${s.station}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [searchResults]);

  const byHourBucket = useMemo(() => {
    const buckets = {};
    searchResults.forEach((s) => {
      const h = new Date(s.created_at).getHours();
      const bucket = `${h}h–${(h + 1) % 24}h`;
      buckets[bucket] = (buckets[bucket] || 0) + 1;
    });
    return Object.entries(buckets).sort((a, b) => b[1] - a[1]);
  }, [searchResults]);

  // ---- Carte de chaleur station × heure (complète les compteurs, ne les remplace pas) ----
  const heatmapData = useMemo(() => {
    const matrix = {};
    let max = 0;
    searchResults.forEach((s) => {
      const key = `${s.ligne}__${s.station}`;
      const h = new Date(s.created_at).getHours();
      if (!matrix[key]) matrix[key] = new Array(24).fill(0);
      matrix[key][h] += 1;
      if (matrix[key][h] > max) max = matrix[key][h];
    });
    const rows = Object.entries(matrix)
      .map(([key, hours]) => ({ key, hours, total: hours.reduce((a, b) => a + b, 0) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
    return { rows, max };
  }, [searchResults]);

  const clusters = useMemo(() => computeRecurrence(searchResults), [searchResults]);
  // Un agent de station ou un opérateur vidéo peut uniquement signaler — il ne
  // traite pas l'intervention lui-même, donc pas de changement de statut.
  const canEditStatut = profile?.role !== "agent_station" && profile?.role !== "operateur_video";

  async function submitForm() {
    if (!form.desc.trim()) {
      setFormError("Merci de renseigner une description.");
      return;
    }
    setFormError("");
    const payload = {
      ligne: form.line,
      station: form.station,
      type: form.type,
      priorite: form.priorite || "normale",
      nb_personnes: Number(form.nb) || 1,
      description: form.desc.trim(),
      agent_id: session.user.id,
    };

    if (!navigator.onLine) {
      queueOffline(payload);
      setForm({ ...form, desc: "", nb: 1 });
      setShowForm(false);
      setActiveLine(form.line);
      setTab("carte");
      return;
    }

    const { error } = await supabase.from("signalements").insert(payload);
    if (error) {
      // Panne réseau au moment de l'envoi (pas une erreur applicative type RLS) :
      // on met en attente plutôt que de faire perdre la saisie à l'agent.
      if (error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError") || error.message?.includes("fetch")) {
        queueOffline(payload);
        setForm({ ...form, desc: "", nb: 1 });
        setShowForm(false);
        setActiveLine(form.line);
        setTab("carte");
        return;
      }
      setFormError("Erreur à l'envoi : " + error.message);
      return;
    }
    setForm({ ...form, desc: "", nb: 1 });
    setShowForm(false);
    setActiveLine(form.line);
    setTab("carte");
    // le canal temps réel rafraîchit la liste automatiquement pour tout le monde,
    // mais on force un refetch immédiat pour l'auteur du signalement
    fetchSignalements();
  }

  async function updateStatut(id, statut) {
    const { error } = await supabase.from("signalements").update({
      statut,
      statut_agent_id: session.user.id,
      statut_updated_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) setDataError("Erreur de mise à jour : " + error.message);
    else fetchSignalements();
  }

  async function deleteSignalement(id) {
    if (!confirm("Supprimer définitivement ce signalement ? Cette action est irréversible.")) return;
    const { error } = await supabase.from("signalements").delete().eq("id", id);
    if (error) setDataError("Erreur à la suppression : " + error.message);
    else {
      setSelectedPin(null);
      fetchSignalements();
    }
  }

  // ---- Suivi de position en direct — réservé aux opérateurs vidéo pour l'instant ----
  const [trackingId, setTrackingId] = useState(null);
  const [trackStation, setTrackStation] = useState("");

  async function updatePosition(s) {
    if (!trackStation) return;
    const entry = { ligne: s.ligne, station: trackStation, at: new Date().toISOString(), par: profile?.equipe ? `${profile.equipe} (${profile.nom})` : profile?.matricule };
    const trajectoire = [...(s.trajectoire || []), entry];
    const { error } = await supabase.from("signalements").update({
      trajectoire,
      derniere_position_ligne: s.ligne,
      derniere_position_station: trackStation,
      derniere_position_at: entry.at,
    }).eq("id", s.id);
    if (error) setDataError("Erreur de mise à jour de la position : " + error.message);
    else {
      setTrackingId(null);
      fetchSignalements();
    }
  }

  async function loadLogoBase64() {
    try {
      const res = await fetch("/logo.png");
      if (!res.ok) return null;
      const blob = await res.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  async function exportStatsPDF() {
    setPdfBusy(true);
    try {
      const logo = await loadLogoBase64();
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const navy = [11, 31, 58];
      const red = [227, 5, 28];
      const gray = [91, 102, 112];
      const left = 15;

      if (logo) {
        try { doc.addImage(logo, "PNG", left, 10, 16, 16); } catch { /* logo illisible, on continue sans */ }
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(...navy);
      doc.text("SENTINELLE TRANSPORT", left + 20, 18);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(...gray);
      doc.text("Rapport statistique — sûreté réseau", left + 20, 24);

      doc.setDrawColor(...red);
      doc.setLineWidth(0.8);
      doc.line(left, 30, pageWidth - left, 30);

      const periodLabel = searchStart === searchEnd
        ? `Période : ${new Date(searchStart).toLocaleDateString("fr-FR")}`
        : `Période : du ${new Date(searchStart).toLocaleDateString("fr-FR")} au ${new Date(searchEnd).toLocaleDateString("fr-FR")}`;
      const filtersLabel = [
        searchType !== "all" ? `Type : ${TYPES[searchType].label}` : null,
        searchLine !== "all" ? `Ligne : ${LINES[searchLine].name}` : null,
      ].filter(Boolean).join(" · ");

      doc.setFontSize(9.5);
      doc.setTextColor(...navy);
      doc.text(periodLabel + (filtersLabel ? ` — ${filtersLabel}` : ""), left, 37);
      doc.setTextColor(...gray);
      doc.text(`Généré le ${new Date().toLocaleString("fr-FR")}`, pageWidth - left, 37, { align: "right" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...navy);
      doc.text(`${searchResults.length} signalement${searchResults.length > 1 ? "s" : ""}`, left, 47);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...gray);
      const breakdownLine = Object.entries(TYPES).filter(([k]) => searchBreakdown[k] > 0).map(([k, v]) => `${searchBreakdown[k]} ${v.label.toLowerCase()}`).join(" · ") || "aucun détail";
      doc.text(breakdownLine, left, 53);

      autoTable(doc, {
        startY: 60,
        head: [["Ligne", "Station", "Signalements"]],
        body: Object.entries(statsStationCounts).sort((a, b) => b[1] - a[1]).map(([key, count]) => {
          const [lineId, station] = key.split("__");
          return [LINES[lineId].name, station, String(count)];
        }),
        headStyles: { fillColor: navy, textColor: 255, fontSize: 9 },
        styles: { fontSize: 9 },
        margin: { left, right: left },
      });

      let y = doc.lastAutoTable.finalY + 12;
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...navy);
      doc.text("Créneaux horaires", left, y);
      autoTable(doc, {
        startY: y + 4,
        head: [["Créneau", "Signalements"]],
        body: byHourBucket.map(([b, c]) => [b, String(c)]),
        headStyles: { fillColor: navy, textColor: 255, fontSize: 9 },
        styles: { fontSize: 9 },
        margin: { left, right: left },
      });

      y = doc.lastAutoTable.finalY + 12;
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...navy);
      doc.text("Récurrences détectées", left, y);
      autoTable(doc, {
        startY: y + 4,
        head: [["Groupe", "Ligne", "Mots communs", "Station", "Description", "Date/heure"]],
        body: clusters.length > 0
          ? clusters.flatMap((c, gi) =>
              c.items.map((item, idx) => [
                idx === 0 ? `#${gi + 1}` : "",
                idx === 0 ? LINES[c.ligne].name : "",
                idx === 0 ? c.sharedWords.join(", ") : "",
                item.station,
                item.description.slice(0, 55),
                fmtDateTime(new Date(item.created_at).getTime()),
              ])
            )
          : [["—", "Aucune récurrence détectée sur cette période", "", "", "", ""]],
        headStyles: { fillColor: red, textColor: 255, fontSize: 9 },
        styles: { fontSize: 8 },
        margin: { left, right: left },
      });

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...gray);
        doc.text("Sentinelle Transport — document généré automatiquement, usage interne", left, 290);
        doc.text(`Page ${i}/${pageCount}`, pageWidth - left, 290, { align: "right" });
      }

      doc.save(`sentinelle-transport-rapport-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setPdfBusy(false);
    }
  }

  // ---- Écrans de chargement / auth ----
  if (sessionLoading) {
    return (
      <div style={{ background: "#0A0D10", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#8F99A3", fontFamily: "'Inter', sans-serif" }}>
        <style>{FONT_IMPORT}</style>
        Chargement…
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ background: "#0A0D10", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", padding: 16 }}>
        <style>{FONT_IMPORT}</style>
        <div style={{ background: "#12171C", border: "1px solid #1E262D", borderRadius: 10, padding: 28, width: 380, maxWidth: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <img src="/logo.png" alt="" width={32} height={32} style={{ borderRadius: 8 }} />
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 800, color: "#E8ECEF", textTransform: "uppercase" }}>Sentinelle Transport</span>
          </div>

          <div style={{ fontSize: 12, color: "#8F99A3", marginBottom: 18 }}>Connexion avec le matricule et le mot de passe fournis par un administrateur.</div>

          <label style={{ fontSize: 12, color: "#A3ADB6" }}>Matricule</label>
          <input value={authForm.matricule} onChange={(e) => setAuthForm({ ...authForm, matricule: e.target.value })} placeholder="Ex. GP4521" style={{ width: "100%", background: "#0A0D10", color: "#E8ECEF", border: "1px solid #1E262D", borderRadius: 6, padding: 9, marginTop: 4, marginBottom: 14 }} />

          <label style={{ fontSize: 12, color: "#A3ADB6" }}>Mot de passe</label>
          <input type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} placeholder="••••••••" style={{ width: "100%", background: "#0A0D10", color: "#E8ECEF", border: "1px solid #1E262D", borderRadius: 6, padding: 9, marginTop: 4, marginBottom: 14 }} />

          {authError && <div style={{ fontSize: 12, color: "#FF5A2E", marginBottom: 12 }}>{authError}</div>}

          <button type="button" disabled={authBusy} onClick={handleAuth} style={{ width: "100%", background: "#FF5A2E", color: "#0A0D10", border: "none", borderRadius: 6, padding: 11, fontWeight: 700, fontSize: 14, cursor: authBusy ? "default" : "pointer", opacity: authBusy ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <LogIn size={16} />
            {authBusy ? "Patiente…" : "Se connecter"}
          </button>
        </div>
      </div>
    );
  }

  const line = LINES[activeLine];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#0A0D10", minHeight: "100vh", color: "#E8ECEF", overflowX: "hidden" }}>
      <style>{FONT_IMPORT}{`
        @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(255,90,46,0.55);} 70% { box-shadow: 0 0 0 10px rgba(255,90,46,0);} 100% { box-shadow: 0 0 0 0 rgba(255,90,46,0);} }
        .disp { font-family: 'Barlow Condensed', sans-serif; letter-spacing: 0.02em; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .pin:hover { transform: scale(1.15); }
        ::selection { background: #FF5A2E; color: #0A0D10; }
        select option { color: #0A0D10; }
        .legend-toggle-btn { display: none; }
        .agents-cards { display: none; }
        @media (max-width: 760px) {
          .legend-toggle-btn { display: inline-flex !important; }
          .legend-body.collapsed { display: none !important; }
          .agents-table { display: none !important; }
          .agents-cards { display: block !important; }
        }
      `}</style>

      {/* Top bar */}
      <div style={{ borderBottom: "1px solid #1E262D", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#0A0D10", zIndex: 20, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo.png" alt="" width={26} height={26} style={{ borderRadius: 6 }} />
          <span className="disp" style={{ fontSize: 21, fontWeight: 800, textTransform: "uppercase" }}>Sentinelle Transport</span>
          {dataError && <span style={{ fontSize: 11, color: "#FF5A2E" }}>{dataError}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <span className="mono" style={{ fontSize: 12, color: "#A3ADB6" }}>{profile ? `${profile.matricule} · ${ROLE_LABELS[profile.role] || profile.role}` : "…"}</span>
          {pendingCount > 0 && (
            <span title="Signalement(s) en attente d'envoi — seront transmis automatiquement dès que le réseau revient" className="mono" style={{ fontSize: 11, color: "#FFC145", border: "1px solid #FFC145", borderRadius: 6, padding: "5px 9px", display: "flex", alignItems: "center", gap: 5 }}>
              <WifiOff size={12} /> {pendingCount} en attente
            </span>
          )}
          {profile?.role !== "agent_station" && notifEnabled && (
            <button onClick={cycleNotifScope} title="Portée des alertes sonores" style={{ background: "none", border: "1px solid #1E262D", color: "#8F99A3", borderRadius: 6, padding: "6px 10px", fontSize: 11, cursor: "pointer" }}>
              {notifScope === "active" ? "Alertes : ma ligne" : "Alertes : toutes lignes"}
            </button>
          )}
          <button onClick={toggleNotifications} title={notifEnabled ? "Désactiver les alertes" : "Activer les alertes"} style={{ background: "none", border: "1px solid #1E262D", color: notifEnabled ? "#FF5A2E" : "#8F99A3", borderRadius: 6, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
            {notifEnabled ? <Bell size={15} /> : <BellOff size={15} />}
          </button>
          {profile?.role === "admin" && (
            <button onClick={() => setTab("admin")} style={{ background: "none", border: "1px solid #1E262D", color: tab === "admin" ? "#FF5A2E" : "#8F99A3", borderRadius: 6, padding: "6px 10px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <ShieldCheck size={13} /> Administration
            </button>
          )}
          <button onClick={signOut} style={{ background: "none", border: "1px solid #1E262D", color: "#8F99A3", borderRadius: 6, padding: "6px 10px", fontSize: 12, cursor: "pointer" }}>Fin de service</button>
          <button onClick={() => { setForm({ line: activeLine, station: LINES[activeLine].stations[0], type: "pickpocket", priorite: "normale", nb: 1, desc: "" }); setShowForm(true); }} style={{ background: "#FF5A2E", color: "#0A0D10", border: "none", borderRadius: 6, padding: "9px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={16} /> Signaler
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, padding: "12px 20px 0", borderBottom: "1px solid #1E262D" }}>
        {[["carte", "Carte live"], ...(profile?.role === "agent_station" ? [] : [["stats", "Statistiques"]])].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className="disp" style={{ background: "none", border: "none", color: tab === key ? "#E8ECEF" : "#8F99A3", fontSize: 17, fontWeight: 700, textTransform: "uppercase", padding: "6px 14px 12px", cursor: "pointer", borderBottom: tab === key ? "2px solid #FF5A2E" : "2px solid transparent" }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "admin" && profile?.role === "admin" ? (
        <AdminPanel onClose={() => setTab("carte")} />
      ) : dataLoading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#8F99A3" }}>Chargement des signalements…</div>
      ) : tab === "carte" ? (
        <>
          {/* Line selector — verrouillé sur sa ligne pour un agent de station */}
          {profile?.role === "agent_station" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 20px 0" }}>
              <span style={{
                width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: LINES[activeLine].color, color: LINES[activeLine].dark ? "#fff" : "#0A0D10", fontWeight: 700, fontSize: 12,
              }} className="mono">{activeLine}</span>
              <span style={{ fontSize: 12, color: "#8F99A3" }}>Ligne affectée — accès limité à {LINES[activeLine].name}</span>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 6, padding: "14px 20px 0", flexWrap: "wrap" }}>
              {Object.entries(LINES).map(([id, l]) => (
                <button key={id} onClick={() => setActiveLine(id)} className="mono" style={{
                  width: 30, height: 30, borderRadius: "50%", border: activeLine === id ? "2px solid #E8ECEF" : "2px solid transparent",
                  background: l.color, color: l.dark ? "#fff" : "#0A0D10", fontWeight: 700, fontSize: 12, cursor: "pointer",
                }}>{id}</button>
              ))}
            </div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 20, padding: 20 }}>
            {/* Plan vertical de la ligne */}
            <div style={{ flex: "1 1 560px", background: "#12171C", border: "1px solid #1E262D", borderRadius: 10, padding: "28px 24px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                <div className="disp" style={{ fontSize: 15, fontWeight: 800, color: line.color, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                  <MapPin size={14} /> {line.name} — {line.stations[0]} ↔ {line.stations[line.stations.length - 1]}
                </div>
                <button className="legend-toggle-btn" onClick={() => setShowLegend((v) => !v)} style={{ background: "#FFC14522", border: "1.5px solid #FFC145", color: "#FFC145", borderRadius: 8, padding: "9px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", alignItems: "center", gap: 6 }}>
                  {showLegend ? <X size={14} /> : <ChevronRight size={14} style={{ transform: "rotate(90deg)" }} />} Légende
                </button>
              </div>

              <div className={`legend-body${showLegend ? "" : " collapsed"}`} style={{ background: "#0A0D10", border: "1px solid #1E262D", borderRadius: 8, padding: "12px 14px", marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    {Object.entries(TYPES).map(([k, v]) => (
                      <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#A3ADB6" }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: v.color }} /> {v.short} — {v.label}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
                    {Object.entries(STATUTS).map(([k, v]) => {
                      const Icon = v.icon;
                      return (
                        <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#A3ADB6" }}>
                          <div style={{ width: 16, height: 16, borderRadius: "50%", background: v.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Icon size={9} color="#0A0D10" />
                          </div>
                          {v.label}
                        </div>
                      );
                    })}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#A3ADB6" }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid #FF5A2E" }} /> Signalement &lt; 15 min
                    </div>
                  </div>
                </div>

              <div>
                {line.stations.map((name, i) => {
                  const count = liveStationCounts[`${activeLine}__${name}`] || 0;
                  const isLast = i === line.stations.length - 1;
                  const pins = lineSignalements.filter((s) => s.station === name && s.statut !== "faux_positif");
                  return (
                    <div key={name} style={{ display: "flex", gap: 14 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 16, flexShrink: 0 }}>
                        <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#0A0D10", border: `3px solid ${line.color}`, flexShrink: 0 }} />
                        {!isLast && <div style={{ width: 3, flex: 1, minHeight: 26, background: line.color, opacity: 0.5 }} />}
                      </div>
                      <div style={{ flex: 1, paddingBottom: 18 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 14, fontWeight: 600 }}>{name}</span>
                          {count > 0 && <span className="mono" style={{ fontSize: 10, color: "#8F99A3" }}>{count} sign.</span>}
                        </div>
                        {pins.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                            {pins.map((s) => {
                              const tsMs = new Date(s.created_at).getTime();
                              const fresh = freshness(tsMs);
                              const StatutIcon = STATUTS[s.statut].icon;
                              const statutColor = STATUTS[s.statut].color;
                              return (
                                <div key={s.id} className="pin" onClick={() => setSelectedPin(s)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: `${statutColor}1A`, border: "1px solid #1E262D", borderLeft: `4px solid ${statutColor}`, borderRadius: 6, padding: "6px 10px 6px 8px", transition: "transform 0.15s" }}>
                                  <div title={STATUTS[s.statut].label} style={{ width: 22, height: 22, borderRadius: "50%", background: statutColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, animation: fresh.pulse ? "pulse-ring 1.6s infinite" : "none" }}>
                                    <StatutIcon size={12} color="#0A0D10" />
                                  </div>
                                  <span title={TYPES[s.type].label} className="mono" style={{ fontSize: 9, fontWeight: 700, background: TYPES[s.type].color, color: "#0A0D10", borderRadius: 4, padding: "2px 6px", flexShrink: 0 }}>{TYPES[s.type].short}</span>
                                  <span style={{ fontSize: 12, color: "#B4BCC4", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.description}</span>
                                  <span className="mono" style={{ fontSize: 9, color: statutColor, flexShrink: 0, textTransform: "uppercase" }}>{STATUTS[s.statut].label}</span>
                                  <span className="mono" style={{ fontSize: 10, color: fresh.color, flexShrink: 0 }}>{fresh.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fil de tous les signalements */}
            <div style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", gap: 10, maxHeight: 780, overflowY: "auto" }}>
              <div>
                <div className="disp" style={{ fontSize: 14, color: "#8F99A3", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                  <Activity size={14} /> Fil de tous les signalements
                </div>
                <div style={{ fontSize: 11, color: "#8F99A3", marginTop: 2 }}>Signalements des dernières 24 heures</div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: "1 1 160px" }}>
                  <Search size={13} style={{ position: "absolute", left: 9, top: 9, color: "#8F99A3" }} />
                  <input
                    value={filSearch}
                    onChange={(e) => setFilSearch(e.target.value)}
                    placeholder="Station, mot-clé…"
                    style={{ width: "100%", background: "#0A0D10", color: "#E8ECEF", border: "1px solid #1E262D", borderRadius: 6, padding: "7px 9px 7px 28px", fontSize: 12, boxSizing: "border-box" }}
                  />
                </div>
                <select value={filTypeFilter} onChange={(e) => setFilTypeFilter(e.target.value)} style={{ background: "#0A0D10", color: "#E8ECEF", border: "1px solid #1E262D", borderRadius: 6, padding: "7px 8px", fontSize: 12 }}>
                  <option value="tous" style={{ color: "#0A0D10", background: "#FFFFFF" }}>Tous les types</option>
                  {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k} style={{ color: "#0A0D10", background: "#FFFFFF" }}>{v.label}</option>)}
                </select>
              </div>

              {filFeed.map((s) => {
                const tsMs = new Date(s.created_at).getTime();
                const fresh = freshness(tsMs);
                const Icon = TYPES[s.type].icon;
                const statutInfo = STATUTS[s.statut];
                const StatutIcon = statutInfo.icon;
                const priosInfo = PRIORITES[s.priorite || "normale"];
                const showCall = s.type === "agression" || priosInfo.rank === 2;
                return (
                  <div key={s.id} style={{ background: "#12171C", border: "1px solid #1E262D", borderLeft: `4px solid ${priosInfo.rank === 2 ? priosInfo.color : statutInfo.color}`, borderRadius: 8, padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span className="mono" style={{ fontSize: 10, background: LINES[s.ligne].color, color: LINES[s.ligne].dark ? "#fff" : "#0A0D10", borderRadius: 4, padding: "1px 5px" }}>{s.ligne}</span>
                        <Icon size={15} color={TYPES[s.type].color} />
                        <span title={TYPES[s.type].label} className="mono" style={{ fontSize: 9, fontWeight: 700, background: TYPES[s.type].color, color: "#0A0D10", borderRadius: 4, padding: "2px 6px" }}>{TYPES[s.type].short}</span>
                        {priosInfo.rank > 0 && (
                          <span title={`Priorité ${priosInfo.label}`} className="mono" style={{ fontSize: 9, fontWeight: 700, background: `${priosInfo.color}22`, color: priosInfo.color, border: `1px solid ${priosInfo.color}`, borderRadius: 4, padding: "2px 6px" }}>{priosInfo.short}</span>
                        )}
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{s.station}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div title={statutInfo.label} style={{ width: 16, height: 16, borderRadius: "50%", background: statutInfo.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <StatutIcon size={9} color="#0A0D10" />
                        </div>
                        <span className="mono" style={{ fontSize: 10, color: fresh.color }}>{fresh.label}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: "#B4BCC4", marginTop: 6, lineHeight: 1.4 }}>{s.description}</div>
                    {showCall && (
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <a href={`tel:${PC_PHONE}`} style={{ flex: 1, background: "#DC262622", border: "1px solid #DC2626", color: "#DC2626", borderRadius: 6, padding: "7px 0", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, textDecoration: "none" }}>
                          <Phone size={13} /> Appeler PC
                        </a>
                        <a href={`tel:${POLICE_PHONE}`} style={{ flex: 1, background: "#DC262622", border: "1px solid #DC2626", color: "#DC2626", borderRadius: 6, padding: "7px 0", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, textDecoration: "none" }}>
                          <Phone size={13} /> Police (17)
                        </a>
                      </div>
                    )}
                    <div style={{ display: "flex", flexWrap: "wrap", rowGap: 8, justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                      <span className="mono" style={{ fontSize: 11, color: "#8F99A3" }}>
                        <Users size={11} style={{ verticalAlign: -2, marginRight: 3 }} />{s.nb_personnes} · {equipeLabel(s)} · {fmtTime(tsMs)}
                      </span>
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                        <button onClick={() => duplicateSignalement(s)} title="Dupliquer ce signalement — pré-remplit un nouveau signalement avec les mêmes infos" style={{ background: "none", border: "1px solid #1E262D", color: "#A3ADB6", borderRadius: 4, padding: "3px 7px", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                          <Copy size={11} /> Dupliquer
                        </button>
                        {profile?.role === "admin" && (
                          <button onClick={() => deleteSignalement(s.id)} title="Supprimer définitivement ce signalement (admin)" style={{ background: "none", border: "1px solid #DC2626", color: "#DC2626", borderRadius: 4, padding: "3px 7px", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                            <Trash2 size={11} />
                          </button>
                        )}
                        {profile?.role === "operateur_video" && (
                          <button onClick={() => { setTrackingId(trackingId === s.id ? null : s.id); setTrackStation(s.derniere_position_station || s.station); }} title="Mettre à jour la position suivie de cet individu" style={{ background: trackingId === s.id ? "#38BDF822" : "none", border: "1px solid #38BDF8", color: "#38BDF8", borderRadius: 4, padding: "3px 7px", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                            <Navigation size={11} /> Suivre
                          </button>
                        )}
                        {canEditStatut ? (
                        <select value={s.statut} onChange={(e) => updateStatut(s.id, e.target.value)} style={{ background: "#0A0D10", color: statutInfo.color, border: `1px solid ${statutInfo.color}`, borderRadius: 4, fontSize: 11, padding: "3px 6px", colorScheme: "light" }}>
                          {Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k} style={{ color: "#0A0D10", background: "#FFFFFF" }}>{v.label}</option>)}
                        </select>
                        ) : (
                          <span className="mono" style={{ fontSize: 11, color: statutInfo.color, border: `1px solid ${statutInfo.color}`, borderRadius: 4, padding: "3px 6px" }}>{statutInfo.label}</span>
                        )}
                      </div>
                    </div>
                    {trackingId === s.id && (
                      <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center" }}>
                        <select value={trackStation} onChange={(e) => setTrackStation(e.target.value)} style={{ flex: 1, background: "#0A0D10", color: "#E8ECEF", border: "1px solid #38BDF8", borderRadius: 4, padding: "5px 6px", fontSize: 12, colorScheme: "light" }}>
                          {LINES[s.ligne].stations.map((st) => <option key={st} value={st} style={{ color: "#0A0D10", background: "#FFFFFF" }}>{st}</option>)}
                        </select>
                        <button onClick={() => updatePosition(s)} style={{ background: "#38BDF8", color: "#0A0D10", border: "none", borderRadius: 4, padding: "6px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>OK</button>
                      </div>
                    )}
                    {s.derniere_position_station && (
                      <div style={{ fontSize: 11, color: "#38BDF8", marginTop: 6 }}>
                        <Navigation size={10} style={{ verticalAlign: -1, marginRight: 3 }} />
                        Dernière position suivie : <span style={{ fontWeight: 600 }}>{s.derniere_position_station}</span>
                        {s.derniere_position_at && <> · {fmtTime(new Date(s.derniere_position_at).getTime())}</>}
                        {s.trajectoire?.length > 1 && <span className="mono" style={{ color: "#8F99A3" }}> · {s.trajectoire.length} positions enregistrées</span>}
                      </div>
                    )}
                    {s.statut !== "nouveau" && s.statut_agent && (
                      <div style={{ fontSize: 11, color: "#8F99A3", marginTop: 6 }}>
                        {statutInfo.action} <span style={{ color: "#B4BCC4" }}>{canEditStatut ? `${s.statut_agent.equipe} (${s.statut_agent.nom})` : s.statut_agent.equipe}</span>
                        {s.statut_updated_at && <> · {fmtTime(new Date(s.statut_updated_at).getTime())}</>}
                      </div>
                    )}
                  </div>
                );
              })}
              {filFeed.length === 0 && <div style={{ fontSize: 13, color: "#8F99A3" }}>Aucun signalement ne correspond.</div>}
            </div>
          </div>
        </>
      ) : (
        <div style={{ padding: 20, display: "flex", flexWrap: "wrap", gap: 20 }}>
          <div style={{ flex: "1 1 100%", background: "#12171C", border: "1px solid #1E262D", borderRadius: 10, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div className="disp" style={{ fontSize: 14, color: "#8F99A3", textTransform: "uppercase" }}>Recherche par période</div>
              <button onClick={exportStatsPDF} disabled={pdfBusy} style={{ background: "none", border: "1px solid #FF5A2E", color: "#FF5A2E", borderRadius: 6, padding: "7px 12px", fontSize: 12, fontWeight: 600, cursor: pdfBusy ? "default" : "pointer", opacity: pdfBusy ? 0.6 : 1, display: "flex", alignItems: "center", gap: 6 }}>
                <FileDown size={14} /> {pdfBusy ? "Génération…" : "Exporter en PDF"}
              </button>
            </div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: "#A3ADB6", display: "block", marginBottom: 4 }}>Du</label>
                <input type="date" value={searchStart} onChange={(e) => setSearchStart(e.target.value)} style={{ background: "#0A0D10", color: "#E8ECEF", border: "1px solid #1E262D", borderRadius: 6, padding: "8px 10px", colorScheme: "dark" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#A3ADB6", display: "block", marginBottom: 4 }}>Au</label>
                <input type="date" value={searchEnd} onChange={(e) => setSearchEnd(e.target.value)} style={{ background: "#0A0D10", color: "#E8ECEF", border: "1px solid #1E262D", borderRadius: 6, padding: "8px 10px", colorScheme: "dark" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#A3ADB6", display: "block", marginBottom: 4 }}>Type</label>
                <select value={searchType} onChange={(e) => setSearchType(e.target.value)} style={{ background: "#0A0D10", color: "#E8ECEF", border: "1px solid #1E262D", borderRadius: 6, padding: "8px 10px", colorScheme: "light" }}>
                  <option value="all" style={{ color: "#0A0D10", background: "#FFFFFF" }}>Tous types</option>
                  {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k} style={{ color: "#0A0D10", background: "#FFFFFF" }}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#A3ADB6", display: "block", marginBottom: 4 }}>Ligne</label>
                <select value={searchLine} onChange={(e) => setSearchLine(e.target.value)} style={{ background: "#0A0D10", color: "#E8ECEF", border: "1px solid #1E262D", borderRadius: 6, padding: "8px 10px", colorScheme: "light" }}>
                  <option value="all" style={{ color: "#0A0D10", background: "#FFFFFF" }}>Toutes lignes</option>
                  {Object.entries(LINES).map(([id, l]) => <option key={id} value={id} style={{ color: "#0A0D10", background: "#FFFFFF" }}>{l.name}</option>)}
                </select>
              </div>
              {(searchStart !== todayStr() || searchEnd !== todayStr() || searchType !== "all" || searchLine !== "all") && (
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <button onClick={() => { setSearchStart(todayStr()); setSearchEnd(todayStr()); setSearchType("all"); setSearchLine("all"); }} style={{ background: "none", border: "1px solid #1E262D", color: "#8F99A3", borderRadius: 6, padding: "8px 12px", fontSize: 12, cursor: "pointer" }}>
                    Réinitialiser
                  </button>
                </div>
              )}
            </div>

            <div style={{ fontSize: 14, marginBottom: 12 }}>
              <strong>{searchResults.length}</strong> signalement{searchResults.length > 1 ? "s" : ""} trouvé{searchResults.length > 1 ? "s" : ""}
              <span style={{ color: "#8F99A3" }}> — {Object.entries(TYPES).filter(([k]) => searchBreakdown[k] > 0).map(([k, v]) => `${searchBreakdown[k]} ${v.label.toLowerCase()}`).join(" · ") || "aucun détail"}</span>
            </div>

            {searchResults.length > 0 && (
              <div style={{ maxHeight: 260, overflowY: "auto", border: "1px solid #1E262D", borderRadius: 8 }}>
                {searchResults.map((s) => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderBottom: "1px solid #1E262D", fontSize: 12 }}>
                    <span className="mono" style={{ fontSize: 10, background: LINES[s.ligne].color, color: LINES[s.ligne].dark ? "#fff" : "#0A0D10", borderRadius: 4, padding: "1px 5px" }}>{s.ligne}</span>
                    <span style={{ flex: 1 }}>{s.station} — {TYPES[s.type].label}</span>
                    <span className="mono" style={{ color: STATUTS[s.statut].color }}>{STATUTS[s.statut].label}</span>
                    <span className="mono" style={{ color: "#8F99A3" }}>{new Date(s.created_at).toLocaleDateString("fr-FR")} {fmtTime(new Date(s.created_at).getTime())}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ flex: "1 1 320px", background: "#12171C", border: "1px solid #1E262D", borderRadius: 10, padding: 20 }}>
            <div className="disp" style={{ fontSize: 14, color: "#8F99A3", textTransform: "uppercase", marginBottom: 16 }}>Signalements par station</div>
            {Object.entries(statsStationCounts).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([key, count]) => {
              const [lineId, station] = key.split("__");
              const max = Math.max(...Object.values(statsStationCounts));
              return (
                <div key={key} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span><span className="mono" style={{ fontSize: 10, background: LINES[lineId].color, color: LINES[lineId].dark ? "#fff" : "#0A0D10", borderRadius: 4, padding: "1px 5px", marginRight: 6 }}>{lineId}</span>{station}</span>
                    <span className="mono" style={{ color: "#A3ADB6" }}>{count}</span>
                  </div>
                  <div style={{ height: 6, background: "#1E262D", borderRadius: 3 }}>
                    <div style={{ height: 6, width: `${(count / max) * 100}%`, background: "#FF5A2E", borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
            {Object.keys(statsStationCounts).length === 0 && <div style={{ fontSize: 13, color: "#8F99A3" }}>Pas de données sur cette période.</div>}
          </div>

          <div style={{ flex: "1 1 280px", background: "#12171C", border: "1px solid #1E262D", borderRadius: 10, padding: 20 }}>
            <div className="disp" style={{ fontSize: 14, color: "#8F99A3", textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={14} /> Créneaux horaires
            </div>
            {byHourBucket.map(([bucket, count]) => (
              <div key={bucket} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid #1E262D" }}>
                <span className="mono">{bucket}</span>
                <span style={{ color: "#A3ADB6" }}>{count} signalement{count > 1 ? "s" : ""}</span>
              </div>
            ))}
            {byHourBucket.length === 0 && <div style={{ fontSize: 13, color: "#8F99A3" }}>Pas de données sur cette période.</div>}
          </div>

          <div style={{ flex: "1 1 100%", minWidth: 0, background: "#12171C", border: "1px solid #1E262D", borderRadius: 10, padding: 20 }}>
            <div className="disp" style={{ fontSize: 14, color: "#8F99A3", textTransform: "uppercase", marginBottom: 4 }}>Carte de chaleur — station × heure</div>
            <div style={{ fontSize: 12, color: "#8F99A3", marginBottom: 16 }}>Top 10 stations sur la période, intensité par tranche horaire (0h–23h). Vient en complément des compteurs ci-dessus, ne les remplace pas.</div>
            {heatmapData.rows.length === 0 && <div style={{ fontSize: 13, color: "#8F99A3" }}>Pas de données sur cette période.</div>}
            {heatmapData.rows.length > 0 && (
              <>
                <div style={{ overflowX: "auto", maxWidth: "100%" }}>
                  <div style={{ display: "grid", gridTemplateColumns: `150px repeat(24, 24px)`, gap: 3, alignItems: "center", minWidth: 150 + 24 * 27 }}>
                    <div />
                    {Array.from({ length: 24 }).map((_, h) => (
                      <div key={`h-${h}`} className="mono" style={{ fontSize: 9, color: "#8F99A3", textAlign: "center" }}>{h % 3 === 0 ? h : ""}</div>
                    ))}
                    {heatmapData.rows.map(({ key, hours }) => {
                      const [lineId, station] = key.split("__");
                      return (
                        <React.Fragment key={key}>
                          <div style={{ fontSize: 11, color: "#E8ECEF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: 4 }}>
                            <span className="mono" style={{ fontSize: 9, background: LINES[lineId].color, color: LINES[lineId].dark ? "#fff" : "#0A0D10", borderRadius: 3, padding: "0 4px", flexShrink: 0 }}>{lineId}</span>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{station}</span>
                          </div>
                          {hours.map((count, h) => {
                            const { bg, fg } = heatColor(count);
                            return (
                              <div
                                key={h}
                                title={`${station} · ${h}h–${(h + 1) % 24}h · ${count} signalement${count > 1 ? "s" : ""}`}
                                style={{ width: 24, height: 22, borderRadius: 4, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}
                              >
                                {count > 0 && <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: fg }}>{count}</span>}
                              </div>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: "#8F99A3" }}>Intensité :</span>
                  {[
                    { count: 0, label: "Aucun" },
                    { count: 1, label: "Modéré (1 fait)" },
                    { count: 2, label: "Élevé (2 faits)" },
                    { count: 3, label: "Pic (3 faits et +)" },
                  ].map(({ count, label }) => {
                    const { bg } = heatColor(count);
                    return (
                      <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#A3ADB6" }}>
                        <span style={{ width: 14, height: 14, borderRadius: 3, background: bg, display: "inline-block" }} />
                        {label}
                      </span>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div style={{ flex: "1 1 100%", background: "#12171C", border: "1px solid #1E262D", borderRadius: 10, padding: 20 }}>
            <div className="disp" style={{ fontSize: 14, color: "#8F99A3", textTransform: "uppercase", marginBottom: 4 }}>Récurrences détectées</div>
            <div style={{ fontSize: 12, color: "#8F99A3", marginBottom: 16 }}>Signalements probablement liés au même groupe : même ligne (toutes stations confondues, utile pour un groupe qui se déplace), descriptions partageant au moins 2 mots-clés.</div>
            {clusters.length === 0 && <div style={{ fontSize: 13, color: "#8F99A3" }}>Aucune récurrence détectée sur cette période.</div>}
            {clusters.map((c, i) => (
              <div key={i} style={{ background: "#0A0D10", border: "1px solid #1E262D", borderLeft: "4px solid #FFC145", borderRadius: 8, padding: 14, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="mono" style={{ fontSize: 11, background: LINES[c.ligne].color, color: LINES[c.ligne].dark ? "#fff" : "#0A0D10", borderRadius: 4, padding: "2px 7px" }}>{LINES[c.ligne].name}</span>
                    <span style={{ fontWeight: 400, color: "#A3ADB6", fontSize: 13 }}>— {c.items.length} signalements liés</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {c.sharedWords.map((w) => (
                      <span key={w} className="mono" style={{ fontSize: 10, background: "#FFC1451A", color: "#FFC145", border: "1px solid #FFC14555", borderRadius: 4, padding: "2px 7px" }}>{w}</span>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {c.items.map((item, idx) => (
                    <div key={item.id} style={{ display: "flex", gap: 10, fontSize: 13, alignItems: "flex-start", flexWrap: "wrap" }}>
                      <span className="mono" style={{ fontSize: 10, color: "#8F99A3", flexShrink: 0, paddingTop: 2 }}>{idx + 1}.</span>
                      <span style={{ fontWeight: 600, flexShrink: 0 }}>{item.station}</span>
                      <span className="mono" style={{ fontSize: 9, fontWeight: 700, background: TYPES[item.type].color, color: "#0A0D10", borderRadius: 3, padding: "2px 5px", flexShrink: 0 }}>{TYPES[item.type].short}</span>
                      <span style={{ color: "#B4BCC4", flex: 1, minWidth: 120 }}>{item.description}</span>
                      <span className="mono" style={{ fontSize: 11, color: "#8F99A3", flexShrink: 0, whiteSpace: "nowrap" }}>{fmtDateTime(new Date(item.created_at).getTime())}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal signalement */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 30, padding: 16 }}>
          <div style={{ background: "#12171C", border: "1px solid #1E262D", borderRadius: 10, padding: 24, width: 420, maxWidth: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <span className="disp" style={{ fontSize: 20, fontWeight: 800, textTransform: "uppercase" }}>Nouveau signalement</span>
              <X size={18} style={{ cursor: "pointer", color: "#8F99A3" }} onClick={() => setShowForm(false)} />
            </div>

            <label style={{ fontSize: 12, color: "#A3ADB6" }}>Ligne</label>
            <select disabled={profile?.role === "agent_station"} value={form.line} onChange={(e) => setForm({ ...form, line: e.target.value, station: LINES[e.target.value].stations[0] })} style={{ width: "100%", background: profile?.role === "agent_station" ? "#161B21" : "#0A0D10", color: profile?.role === "agent_station" ? "#8F99A3" : "#E8ECEF", border: "1px solid #1E262D", borderRadius: 6, padding: 9, marginTop: 4, marginBottom: 14, colorScheme: "light" }}>
              {Object.entries(LINES).map(([id, l]) => <option key={id} value={id} style={{ color: "#0A0D10", background: "#FFFFFF" }}>{l.name}</option>)}
            </select>

            <label style={{ fontSize: 12, color: "#A3ADB6" }}>Station</label>
            <select value={form.station} onChange={(e) => setForm({ ...form, station: e.target.value })} style={{ width: "100%", background: "#0A0D10", color: "#E8ECEF", border: "1px solid #1E262D", borderRadius: 6, padding: 9, marginTop: 4, marginBottom: 14 }}>
              {LINES[form.line].stations.map((s) => <option key={s} value={s} style={{ color: "#0A0D10", background: "#FFFFFF" }}>{s}</option>)}
            </select>

            <label style={{ fontSize: 12, color: "#A3ADB6" }}>Type</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4, marginBottom: 14 }}>
              {Object.entries(TYPES).map(([k, v]) => (
                <button type="button" key={k} onClick={() => setForm({ ...form, type: k })} style={{ padding: "8px 10px", borderRadius: 6, border: form.type === k ? `1px solid ${v.color}` : "1px solid #1E262D", background: form.type === k ? `${v.color}22` : "#0A0D10", color: form.type === k ? v.color : "#A3ADB6", fontSize: 13, cursor: "pointer" }}>
                  {v.label}
                </button>
              ))}
            </div>

            <label style={{ fontSize: 12, color: "#A3ADB6" }}>Priorité</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 4, marginBottom: 14 }}>
              {Object.entries(PRIORITES).map(([k, v]) => (
                <button type="button" key={k} onClick={() => setForm({ ...form, priorite: k })} style={{ padding: "8px 10px", borderRadius: 6, border: form.priorite === k ? `1px solid ${v.color}` : "1px solid #1E262D", background: form.priorite === k ? `${v.color}22` : "#0A0D10", color: form.priorite === k ? v.color : "#A3ADB6", fontSize: 13, fontWeight: form.priorite === k ? 700 : 400, cursor: "pointer" }}>
                  {v.label}
                </button>
              ))}
            </div>

            <label style={{ fontSize: 12, color: "#A3ADB6" }}>Nombre de personnes</label>
            <input type="number" min={1} value={form.nb} onChange={(e) => setForm({ ...form, nb: e.target.value })} style={{ width: "100%", background: "#0A0D10", color: "#E8ECEF", border: "1px solid #1E262D", borderRadius: 6, padding: 9, marginTop: 4, marginBottom: 14 }} />

            <label style={{ fontSize: 12, color: "#A3ADB6" }}>Description opérationnelle</label>
            <textarea value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="Vêtements, position précise, comportement observé..." rows={3} style={{ width: "100%", background: "#0A0D10", color: "#E8ECEF", border: "1px solid #1E262D", borderRadius: 6, padding: 9, marginTop: 4, marginBottom: 6, resize: "vertical" }} />
            <div style={{ fontSize: 11, color: "#8F99A3", marginBottom: 6 }}>Signalé par {profile ? `${profile.equipe} (${profile.nom})` : "…"}</div>
            {formError && <div style={{ fontSize: 12, color: "#FF5A2E", marginBottom: 8 }}>{formError}</div>}

            <button type="button" onClick={submitForm} style={{ width: "100%", background: "#FF5A2E", color: "#0A0D10", border: "none", borderRadius: 6, padding: 11, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Envoyer le signalement
            </button>
          </div>
        </div>
      )}

      {/* Détail d'un signalement */}
      {selectedPin && (() => {
        const pin = signalements.find((s) => s.id === selectedPin.id) || selectedPin;
        const statutInfo = STATUTS[pin.statut];
        const StatutIcon = statutInfo.icon;
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 30, padding: 16 }} onClick={() => setSelectedPin(null)}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: "#12171C", border: "1px solid #1E262D", borderRadius: 10, padding: 20, width: 380, maxWidth: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span className="disp" style={{ fontSize: 18, fontWeight: 800 }}>{pin.station}</span>
                <X size={18} style={{ cursor: "pointer", color: "#8F99A3" }} onClick={() => setSelectedPin(null)} />
              </div>
              <div style={{ fontSize: 13, color: "#B4BCC4", marginBottom: 10 }}>{pin.description}</div>
              <div className="mono" style={{ fontSize: 11, color: "#8F99A3", marginBottom: 14 }}>
                {LINES[pin.ligne].name} · {TYPES[pin.type].short} — {TYPES[pin.type].label} · {pin.nb_personnes} pers. · {equipeLabel(pin)} · {fmtTime(new Date(pin.created_at).getTime())}
              </div>

              <label style={{ fontSize: 12, color: "#A3ADB6", display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 15, height: 15, borderRadius: "50%", background: statutInfo.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <StatutIcon size={9} color="#0A0D10" />
                </div>
                Statut
              </label>
              {canEditStatut ? (
                <select value={pin.statut} onChange={(e) => updateStatut(pin.id, e.target.value)} style={{ width: "100%", background: "#0A0D10", color: statutInfo.color, border: `1px solid ${statutInfo.color}`, borderRadius: 6, padding: 9, marginTop: 4, marginBottom: 10, colorScheme: "light" }}>
                  {Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k} style={{ color: "#0A0D10", background: "#FFFFFF" }}>{v.label}</option>)}
                </select>
              ) : (
                <div className="mono" style={{ fontSize: 13, color: statutInfo.color, border: `1px solid ${statutInfo.color}`, borderRadius: 6, padding: 9, marginTop: 4, marginBottom: 10 }}>{statutInfo.label}</div>
              )}

              {pin.statut !== "nouveau" && pin.statut_agent && (
                <div style={{ fontSize: 12, color: "#A3ADB6" }}>
                  {statutInfo.action} <span style={{ color: "#E8ECEF" }}>{pin.statut_agent.equipe} ({pin.statut_agent.nom})</span>
                  {pin.statut_updated_at && <> · {fmtTime(new Date(pin.statut_updated_at).getTime())}</>}
                </div>
              )}

              {profile?.role === "admin" && (
                <button onClick={() => deleteSignalement(pin.id)} style={{ width: "100%", background: "none", border: "1px solid #DC2626", color: "#DC2626", borderRadius: 6, padding: 9, marginTop: 14, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Trash2 size={14} /> Supprimer ce signalement
                </button>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
