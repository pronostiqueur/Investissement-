import { useCallback, useEffect, useState } from 'react'
import { FlatList, View, Text, Image, TouchableOpacity, Dimensions, RefreshControl } from 'react-native'
import { supabase } from './supabase'
import { C, s } from './theme'

const STICKERS = { excellent: '🔥', jaime: '❤️', bravo: '👏', merci: '🙏', objectif: '💰', magnifique: '😍', bien_joue: '🎯', dommage: '😢' }
const STATUTS = { en_attente: ['EN ATTENTE', C.or], gagne: ['GAGNÉ', C.vert], perdu: ['PERDU', C.rouge] }
const W = Dimensions.get('window').width - 24

export default function Feed({ userId, peutPublier }) {
  const [posts, setPosts] = useState([])
  const [urls, setUrls] = useState({})
  const [reacts, setReacts] = useState([])
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setBusy(true)
    const { data: p } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(50)
    const list = p || []
    const all = list.flatMap(x => x.image_paths)
    if (all.length) {
      const { data: signed } = await supabase.storage.from('coupons').createSignedUrls(all, 3600)
      setUrls(Object.fromEntries((signed || []).map(x => [x.path, x.signedUrl])))
    }
    const { data: r } = await supabase.from('reactions').select('post_id,user_id,sticker').in('post_id', list.map(x => x.id))
    setReacts(r || []); setPosts(list); setBusy(false)
  }, [])

  useEffect(() => {
    load()
    const ch = supabase.channel('flux').on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, load).subscribe()
    return () => supabase.removeChannel(ch)
  }, [load])

  async function reagir(postId, sticker, mien) {
    if (mien === sticker) await supabase.from('reactions').delete().match({ post_id: postId, user_id: userId })
    else await supabase.from('reactions').upsert({ post_id: postId, user_id: userId, sticker })
    load()
  }
  const statut = async (id, st) => { await supabase.from('posts').update({ status: st }).eq('id', id); load() }
  const supprimer = async id => { await supabase.from('posts').delete().eq('id', id); load() }

  return (
    <FlatList data={posts} keyExtractor={x => x.id} refreshControl={<RefreshControl refreshing={busy} onRefresh={load} tintColor={C.or} />}
      ListEmptyComponent={<Text style={s.doux}>Aucune publication pour le moment.</Text>}
      renderItem={({ item }) => {
        const mine = reacts.find(r => r.post_id === item.id && r.user_id === userId)?.sticker
        const [lib, col] = STATUTS[item.status]
        return (
          <View style={s.carte}>
            {item.image_paths.map(p => urls[p] && <Image key={p} source={{ uri: urls[p] }} style={{ width: W, height: W * 1.25 }} resizeMode="contain" />)}
            <View style={{ padding: 12 }}>
              <Text style={{ color: C.texte, fontSize: 17, fontWeight: '700' }}>{item.title}</Text>
              {!!item.description && <Text style={{ color: C.doux, marginTop: 4 }}>{item.description}</Text>}
              <Text style={{ color: C.doux, marginTop: 6 }}>{new Date(item.scheduled_at || item.created_at).toLocaleString('fr-FR')}</Text>
              <Text style={{ color: col, fontWeight: '800', marginTop: 6 }}>{lib}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
                {Object.entries(STICKERS).map(([k, e]) => {
                  const n = reacts.filter(r => r.post_id === item.id && r.sticker === k).length
                  return (
                    <TouchableOpacity key={k} onPress={() => reagir(item.id, k, mine)} style={{ padding: 8, margin: 3, borderRadius: 18, borderWidth: 1, borderColor: mine === k ? C.or : C.bord }}>
                      <Text style={{ fontSize: 18 }}>{e}{n ? ` ${n}` : ''}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
              {peutPublier && (
                <View style={{ flexDirection: 'row', marginTop: 10, flexWrap: 'wrap' }}>
                  {Object.entries(STATUTS).map(([k, [l]]) => <TouchableOpacity key={k} onPress={() => statut(item.id, k)} style={{ marginRight: 14 }}><Text style={{ color: C.or }}>{l}</Text></TouchableOpacity>)}
                  <TouchableOpacity onPress={() => supprimer(item.id)}><Text style={{ color: C.rouge }}>Supprimer</Text></TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )
      }} />
  )
}
