import { useEffect, useState } from 'react'
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import * as Linking from 'expo-linking'
import { supabase } from './src/supabase'
import { C, s } from './src/theme'
import Feed from './src/Feed'
import Publish from './src/Publish'

const pending = { code: '' } // code d'invitation en attente d'être utilisé après connexion

function Auth() {
  const [signup, setSignup] = useState(false)
  const [name, setName] = useState(''); const [email, setEmail] = useState('')
  const [pass, setPass] = useState(''); const [code, setCode] = useState(pending.code)
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false)

  useEffect(() => {
    const read = ({ url }) => { const m = /invite[/=]([\w-]+)/.exec(url || ''); if (m) { setCode(m[1]); setSignup(true) } }
    Linking.getInitialURL().then(u => u && read({ url: u }))
    const sub = Linking.addEventListener('url', read)
    return () => sub.remove()
  }, [])

  async function go() {
    setBusy(true); setMsg(''); pending.code = code.trim()
    const { error } = signup
      ? await supabase.auth.signUp({ email: email.trim(), password: pass, options: { data: { display_name: name.trim() } } })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password: pass })
    if (error) setMsg(error.message)
    setBusy(false)
  }
  return (
    <View style={s.centre}>
      <Text style={s.titre}>MD ZEZAYE</Text>
      <Text style={s.doux}>Communauté privée</Text>
      {signup && <TextInput style={s.input} placeholder="Nom affiché" placeholderTextColor="#777" value={name} onChangeText={setName} />}
      <TextInput style={s.input} placeholder="E-mail" placeholderTextColor="#777" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={s.input} placeholder="Mot de passe (8 caractères min.)" placeholderTextColor="#777" secureTextEntry value={pass} onChangeText={setPass} />
      {signup && <TextInput style={s.input} placeholder="Code d'invitation" placeholderTextColor="#777" autoCapitalize="none" value={code} onChangeText={setCode} />}
      {!!msg && <Text style={s.erreur}>{msg}</Text>}
      <TouchableOpacity style={s.bouton} onPress={go} disabled={busy}>
        <Text style={s.boutonTxt}>{signup ? "S'INSCRIRE" : 'SE CONNECTER'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setSignup(!signup)}>
        <Text style={s.lien}>{signup ? 'Déjà inscrit ? Se connecter' : 'Pas de compte ? Créer un compte'}</Text>
      </TouchableOpacity>
    </View>
  )
}

function Message({ titre, texte }) {
  return (
    <View style={s.centre}>
      <Text style={s.titre}>{titre}</Text>
      <Text style={s.doux}>{texte}</Text>
      <TouchableOpacity onPress={() => supabase.auth.signOut()}><Text style={s.lien}>Se déconnecter</Text></TouchableOpacity>
    </View>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [ready, setReady] = useState(false)
  const [err, setErr] = useState('')
  const [tab, setTab] = useState('feed')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    const { data } = supabase.auth.onAuthStateChange((_e, sess) => setSession(sess))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) { setProfile(null); return }
    ;(async () => {
      if (pending.code) {
        const { error } = await supabase.rpc('join_with_code', { p_code: pending.code })
        if (error) setErr(error.message)
        pending.code = ''
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(data)
    })()
  }, [session])

  let body
  if (!ready || (session && !profile)) body = <View style={s.centre}><ActivityIndicator color={C.or} /></View>
  else if (!session) body = <Auth />
  else if (profile.status === 'suspendu') body = <Message titre="Compte suspendu" texte="Contactez l'administrateur." />
  else if (profile.status === 'en_attente') body = <Message titre="Accès en attente" texte={err || "Saisissez un code d'invitation valide ou attendez la validation."} />
  else {
    const peutPublier = profile.role === 'proprietaire' || (profile.role === 'administrateur' && profile.can_publish)
    body = (
      <View style={s.fond}>
        <View style={{ flex: 1 }}>
          {tab === 'publish' && peutPublier
            ? <Publish userId={profile.id} onDone={() => setTab('feed')} />
            : <Feed userId={profile.id} peutPublier={peutPublier} />}
        </View>
        <View style={s.barre}>
          <TouchableOpacity style={{ flex: 1, padding: 16 }} onPress={() => setTab('feed')}><Text style={{ color: tab === 'feed' ? C.or : C.doux, textAlign: 'center', fontWeight: '700' }}>COUPONS</Text></TouchableOpacity>
          {peutPublier && <TouchableOpacity style={{ flex: 1, padding: 16 }} onPress={() => setTab('publish')}><Text style={{ color: tab === 'publish' ? C.or : C.doux, textAlign: 'center', fontWeight: '700' }}>+ PUBLIER UN COUPON</Text></TouchableOpacity>}
          <TouchableOpacity style={{ flex: 1, padding: 16 }} onPress={() => supabase.auth.signOut()}><Text style={{ color: C.doux, textAlign: 'center' }}>Quitter</Text></TouchableOpacity>
        </View>
      </View>
    )
  }
  return <SafeAreaView style={s.fond}><StatusBar style="light" />{body}</SafeAreaView>
}
