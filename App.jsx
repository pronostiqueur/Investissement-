import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import './style.css'

// Le code du lien d'invitation (?invite=CODE) est gardé jusqu'à la connexion
const urlCode = new URLSearchParams(location.search).get('invite')
if (urlCode) localStorage.setItem('invite', urlCode)

function Auth() {
  const [mode, setMode] = useState(localStorage.getItem('invite') ? 'signup' : 'login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setMsg('')
    const { error } = mode === 'signup'
      ? await supabase.auth.signUp({ email, password: pass, options: { data: { display_name: name } } })
      : await supabase.auth.signInWithPassword({ email, password: pass })
    if (error) setMsg(error.message)
    setBusy(false)
  }

  return (
    <main className="card">
      <h1>MD ZEZAYE</h1>
      <p className="sub">Communauté privée</p>
      <form onSubmit={submit}>
        {mode === 'signup' && (
          <input placeholder="Nom affiché" value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={40} />
        )}
        <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Mot de passe (8 caractères min.)" value={pass} onChange={e => setPass(e.target.value)} required minLength={8} />
        <button disabled={busy}>{mode === 'signup' ? "S'INSCRIRE" : 'SE CONNECTER'}</button>
      </form>
      {msg && <p className="err">{msg}</p>}
      <button className="link" onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>
        {mode === 'signup' ? 'Déjà inscrit ? Se connecter' : 'Pas de compte ? Créer un compte'}
      </button>
    </main>
  )
}

function Message({ title, text, onOut }) {
  return (
    <main className="card">
      <h1>{title}</h1>
      <p className="sub">{text}</p>
      <button className="link" onClick={onOut}>Se déconnecter</button>
    </main>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) { setProfile(null); return }
    ;(async () => {
      const code = localStorage.getItem('invite')
      if (code) {
        const { error } = await supabase.rpc('join_with_code', { p_code: code })
        if (error) setError(error.message)
        localStorage.removeItem('invite')
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(data)
    })()
  }, [session])

  const out = () => supabase.auth.signOut()
  if (!ready) return <main className="card"><p className="sub">Chargement…</p></main>
  if (!session) return <Auth />
  if (!profile) return <main className="card"><p className="sub">Chargement…</p></main>
  if (profile.status === 'suspendu') return <Message title="Compte suspendu" text="Contacte l'administrateur." onOut={out} />
  if (profile.status === 'en_attente')
    return <Message title="Accès en attente" text={error || "Utilise le lien d'invitation, ou attends la validation de l'administrateur."} onOut={out} />

  const isAdmin = profile.role !== 'membre'
  return (
    <main className="card">
      <h1>Bienvenue, {profile.display_name}</h1>
      <p className="sub">{isAdmin ? 'Espace administrateur (étape 4 : publication)' : 'Fil des coupons (étape 5)'}</p>
      <button className="link" onClick={out}>Se déconnecter</button>
    </main>
  )
}
