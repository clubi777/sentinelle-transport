import React, { useState, useEffect, useCallback } from "react";
import { UserPlus, Pencil, Trash2, KeyRound, X } from "lucide-react";
import { supabase } from "./supabaseClient";

const LINE_IDS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "A", "B"];

const ROLES = {
  agent_gpsr_civil: "Agent civil",
  agent_gpsr_tenue: "Agent tenue",
  agent_station: "Agent de station",
  operateur_video: "Opérateur vidéo",
  autre: "Autre",
  admin: "Administrateur",
};

// URL de l'Edge Function — remplace <PROJECT_REF> une fois déployée
// (supabase functions deploy manage-agents)
const FUNCTION_URL = "https://ltqpxyysvjcrmsvivoib.supabase.co/functions/v1/rapid-responder";

async function callFunction(action, payload) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({ action, payload }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Erreur inconnue");
  return json;
}

export default function AdminPanel({ onClose }) {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // { mode: "create" | "edit" | "password", agent? }

  const loadAgents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("agents").select("*").order("nom");
    if (error) setError(error.message);
    else setAgents(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadAgents(); }, [loadAgents]);

  async function handleDelete(agent) {
    if (!confirm(`Supprimer le compte de ${agent.nom} (${agent.matricule}) ? Cette action est irréversible.`)) return;
    try {
      await callFunction("delete", { id: agent.id });
      loadAgents();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div className="disp" style={{ fontSize: 22, fontWeight: 800, textTransform: "uppercase" }}>Administration — Comptes agents</div>
        <button onClick={() => setModal({ mode: "create" })} style={{ background: "#FF5A2E", color: "#0A0D10", border: "none", borderRadius: 6, padding: "9px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <UserPlus size={15} /> Nouveau compte
        </button>
      </div>

      {error && <div style={{ fontSize: 13, color: "#FF5A2E", marginBottom: 12 }}>{error}</div>}

      <div style={{ background: "#12171C", border: "1px solid #1E262D", borderRadius: 10, overflow: "hidden" }}>
        {loading && <div style={{ padding: 16, fontSize: 13, color: "#8F99A3" }}>Chargement…</div>}
        {!loading && agents.length === 0 && <div style={{ padding: 16, fontSize: 13, color: "#8F99A3" }}>Aucun compte pour l'instant.</div>}

        {/* Tableau — desktop uniquement */}
        <div className="agents-table">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr 1.3fr 0.6fr 0.6fr 100px", gap: 10, padding: "10px 16px", borderBottom: "1px solid #1E262D", fontSize: 11, color: "#8F99A3", textTransform: "uppercase" }}>
            <span>Matricule</span><span>Équipe</span><span>Rôle</span><span>Ligne</span><span>Actif</span><span></span>
          </div>
          {agents.map((a) => (
            <div key={a.id} style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr 1.3fr 0.6fr 0.6fr 100px", gap: 10, padding: "12px 16px", borderBottom: "1px solid #1E262D", alignItems: "center", fontSize: 13 }}>
              <span className="mono">{a.matricule}</span>
              <span style={{ color: "#B4BCC4" }}>{a.equipe}</span>
              <span style={{ color: "#B4BCC4" }}>{ROLES[a.role] || a.role}</span>
              <span className="mono" style={{ color: "#A3ADB6" }}>{a.role === "agent_station" ? (a.ligne_affectee || "—") : "—"}</span>
              <span style={{ color: a.actif ? "#23C9A7" : "#8F99A3" }}>{a.actif ? "Oui" : "Non"}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <Pencil size={15} style={{ cursor: "pointer", color: "#A3ADB6" }} onClick={() => setModal({ mode: "edit", agent: a })} />
                <KeyRound size={15} style={{ cursor: "pointer", color: "#A3ADB6" }} onClick={() => setModal({ mode: "password", agent: a })} />
                <Trash2 size={15} style={{ cursor: "pointer", color: "#FF5A2E" }} onClick={() => handleDelete(a)} />
              </div>
            </div>
          ))}
        </div>

        {/* Cartes — mobile uniquement */}
        <div className="agents-cards">
          {agents.map((a) => (
            <div key={a.id} style={{ padding: 14, borderBottom: "1px solid #1E262D" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{a.matricule}</span>
                <span style={{ fontSize: 11, fontWeight: 700, background: "#FF5A2E22", color: "#FF5A2E", border: "1px solid #FF5A2E55", borderRadius: 4, padding: "3px 8px" }}>{ROLES[a.role] || a.role}</span>
              </div>
              <div style={{ fontSize: 13, color: "#B4BCC4", marginBottom: 4 }}>{a.equipe}</div>
              <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#8F99A3", marginBottom: 12 }}>
                {a.role === "agent_station" && <span>Ligne <span className="mono" style={{ color: "#A3ADB6" }}>{a.ligne_affectee || "—"}</span></span>}
                <span style={{ color: a.actif ? "#23C9A7" : "#8F99A3" }}>{a.actif ? "● Actif" : "● Inactif"}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setModal({ mode: "edit", agent: a })} style={{ flex: 1, background: "none", border: "1px solid #1E262D", color: "#A3ADB6", borderRadius: 6, padding: "8px 0", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <Pencil size={13} /> Modifier
                </button>
                <button onClick={() => setModal({ mode: "password", agent: a })} style={{ flex: 1, background: "none", border: "1px solid #1E262D", color: "#A3ADB6", borderRadius: 6, padding: "8px 0", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <KeyRound size={13} /> Mot de passe
                </button>
                <button onClick={() => handleDelete(a)} style={{ background: "none", border: "1px solid #FF5A2E", color: "#FF5A2E", borderRadius: 6, padding: "8px 10px", fontSize: 12, cursor: "pointer" }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modal && (
        <AgentModal
          modal={modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); loadAgents(); }}
        />
      )}
    </div>
  );
}

function AgentModal({ modal, onClose, onSaved }) {
  const { mode, agent } = modal;
  const [form, setForm] = useState({
    matricule: agent?.matricule || "",
    nom: agent?.nom || "",
    equipe: agent?.equipe || "",
    role: agent?.role || "agent_gpsr_civil",
    ligne_affectee: agent?.ligne_affectee || "1",
    actif: agent?.actif ?? true,
    password: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    setError("");
    setBusy(true);
    try {
      if (mode === "create") {
        if (!form.matricule.trim() || !form.equipe.trim() || !form.password.trim()) {
          throw new Error("Merci de remplir tous les champs, dont le mot de passe temporaire.");
        }
        if (form.role === "agent_station" && !form.ligne_affectee) {
          throw new Error("Merci de choisir la ligne affectée.");
        }
        await callFunction("create", {
          matricule: form.matricule.trim(),
          nom: form.matricule.trim(), // le matricule identifie déjà l'agent, pas besoin d'un nom distinct à la création
          equipe: form.equipe.trim(),
          role: form.role,
          password: form.password,
          ligne_affectee: form.role === "agent_station" ? form.ligne_affectee : null,
        });
      } else if (mode === "edit") {
        if (form.role === "agent_station" && !form.ligne_affectee) {
          throw new Error("Merci de choisir la ligne affectée.");
        }
        await callFunction("update", {
          id: agent.id,
          nom: form.nom.trim(),
          equipe: form.equipe.trim(),
          role: form.role,
          actif: form.actif,
          ligne_affectee: form.role === "agent_station" ? form.ligne_affectee : null,
        });
      } else if (mode === "password") {
        if (!form.password.trim()) throw new Error("Merci de renseigner le nouveau mot de passe.");
        await callFunction("reset_password", { id: agent.id, password: form.password });
      }
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const titles = { create: "Nouveau compte agent", edit: "Modifier le compte", password: "Réinitialiser le mot de passe" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 40, padding: 16 }}>
      <div style={{ background: "#12171C", border: "1px solid #1E262D", borderRadius: 10, padding: 24, width: 400, maxWidth: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span className="disp" style={{ fontSize: 18, fontWeight: 800, textTransform: "uppercase" }}>{titles[mode]}</span>
          <X size={18} style={{ cursor: "pointer", color: "#8F99A3" }} onClick={onClose} />
        </div>

        {mode !== "password" && (
          <>
            <label style={{ fontSize: 12, color: "#A3ADB6" }}>Matricule</label>
            <input disabled={mode === "edit"} value={form.matricule} onChange={(e) => setForm({ ...form, matricule: e.target.value })} placeholder="Ex. 789999" style={{ width: "100%", background: mode === "edit" ? "#161B21" : "#0A0D10", color: mode === "edit" ? "#8F99A3" : "#E8ECEF", border: "1px solid #1E262D", borderRadius: 6, padding: 9, marginTop: 4, marginBottom: 14 }} />

            <label style={{ fontSize: 12, color: "#A3ADB6" }}>Équipe / unité</label>
            <input value={form.equipe} onChange={(e) => setForm({ ...form, equipe: e.target.value })} placeholder="Ex. k9999" style={{ width: "100%", background: "#0A0D10", color: "#E8ECEF", border: "1px solid #1E262D", borderRadius: 6, padding: 9, marginTop: 4, marginBottom: 14 }} />

            <label style={{ fontSize: 12, color: "#A3ADB6" }}>Rôle / accès</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={{ width: "100%", background: "#0A0D10", color: "#E8ECEF", border: "1px solid #1E262D", borderRadius: 6, padding: 9, marginTop: 4, marginBottom: 14, colorScheme: "light" }}>
              {Object.entries(ROLES).map(([k, label]) => <option key={k} value={k} style={{ color: "#0A0D10", background: "#FFFFFF" }}>{label}</option>)}
            </select>

            {form.role === "agent_station" && (
              <>
                <label style={{ fontSize: 12, color: "#A3ADB6" }}>Ligne affectée</label>
                <select value={form.ligne_affectee} onChange={(e) => setForm({ ...form, ligne_affectee: e.target.value })} style={{ width: "100%", background: "#0A0D10", color: "#E8ECEF", border: "1px solid #1E262D", borderRadius: 6, padding: 9, marginTop: 4, marginBottom: 14, colorScheme: "light" }}>
                  {LINE_IDS.map((id) => <option key={id} value={id} style={{ color: "#0A0D10", background: "#FFFFFF" }}>{["A", "B"].includes(id) ? `RER ${id}` : `Ligne ${id}`}</option>)}
                </select>
                <div style={{ fontSize: 11, color: "#8F99A3", marginTop: -10, marginBottom: 14 }}>Cet agent ne verra et ne signalera que sur cette ligne.</div>
              </>
            )}

            {mode === "edit" && (
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#B4BCC4", marginBottom: 14, cursor: "pointer" }}>
                <input type="checkbox" checked={form.actif} onChange={(e) => setForm({ ...form, actif: e.target.checked })} />
                Compte actif
              </label>
            )}
          </>
        )}

        {(mode === "create" || mode === "password") && (
          <>
            <label style={{ fontSize: 12, color: "#A3ADB6" }}>{mode === "create" ? "Mot de passe temporaire" : "Nouveau mot de passe"}</label>
            <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="À transmettre à l'agent" style={{ width: "100%", background: "#0A0D10", color: "#E8ECEF", border: "1px solid #1E262D", borderRadius: 6, padding: 9, marginTop: 4, marginBottom: 6 }} />
            <div style={{ fontSize: 11, color: "#8F99A3", marginBottom: 14 }}>L'agent se connecte avec son matricule comme identifiant.</div>
          </>
        )}

        {error && <div style={{ fontSize: 12, color: "#FF5A2E", marginBottom: 12 }}>{error}</div>}

        <button type="button" disabled={busy} onClick={handleSubmit} style={{ width: "100%", background: "#FF5A2E", color: "#0A0D10", border: "none", borderRadius: 6, padding: 11, fontWeight: 700, fontSize: 14, cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1 }}>
          {busy ? "Patiente…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
