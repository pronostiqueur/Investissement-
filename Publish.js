import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import { decode } from 'base64-arraybuffer'
import { supabase } from './supabase'
import { C, s } from './theme'

export default function Publish({ userId, onDone }) {
  const [images, setImages] = useState([])
  const [titre, setTitre] = useState(''); const [desc, setDesc] = useState(''); const [date, setDate] = useState('')
  const [busy, setBusy] = useState(false)

  async function choisir() {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 10, quality: 1 })
    if (!r.canceled) setImages(prev => [...prev, ...r.assets.map(a => a.uri)])
  }

  async function publier() {
    if (!titre.trim()) return Alert.alert('Titre obligatoire')
    if (!images.length) return Alert.alert('Ajoutez au moins une image')
    setBusy(true)
    try {
      const paths = []
      for (let i = 0; i < images.length; i++) {
        // redimensionne (1600 px max) et compresse sans déformer
        const m = await ImageManipulator.manipulateAsync(images[i], [{ resize: { width: 1600 } }], { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG, base64: true })
        const path = `${userId}/${Date.now()}-${i}.jpg`
        const { error } = await supabase.storage.from('coupons').upload(path, decode(m.base64), { contentType: 'image/jpeg' })
        if (error) throw error
        paths.push(path)
      }
      const d = date.trim() ? new Date(date.trim().replace(' ', 'T')) : new Date()
      const { error } = await supabase.from('posts').insert({
        kind: 'coupon', title: titre.trim(), description: desc.trim() || null,
        image_paths: paths, scheduled_at: isNaN(d) ? new Date() : d, author_id: userId
      })
      if (error) throw error
      onDone()
    } catch (e) { Alert.alert('Échec de la publication', e.message) }
    setBusy(false)
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <TouchableOpacity style={s.bouton} onPress={choisir}><Text style={s.boutonTxt}>CHOISIR DES IMAGES (GALERIE)</Text></TouchableOpacity>
      <ScrollView horizontal style={{ marginVertical: 12 }}>
        {images.map((u, i) => (
          <View key={u + i} style={{ marginRight: 8 }}>
            <Image source={{ uri: u }} style={{ width: 110, height: 150, borderRadius: 8 }} resizeMode="cover" />
            <TouchableOpacity onPress={() => setImages(images.filter((_, k) => k !== i))}><Text style={{ color: C.rouge, textAlign: 'center', padding: 4 }}>Retirer</Text></TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      <TextInput style={s.input} placeholder="Nom de la publication" placeholderTextColor="#777" value={titre} onChangeText={setTitre} maxLength={120} />
      <TextInput style={[s.input, { height: 90 }]} multiline placeholder="Description (facultative)" placeholderTextColor="#777" value={desc} onChangeText={setDesc} />
      <TextInput style={s.input} placeholder="Date et heure (AAAA-MM-JJ HH:MM), facultatif" placeholderTextColor="#777" value={date} onChangeText={setDate} />
      <TouchableOpacity style={s.bouton} onPress={publier} disabled={busy}>
        {busy ? <ActivityIndicator color="#111" /> : <Text style={s.boutonTxt}>PUBLIER</Text>}
      </TouchableOpacity>
    </ScrollView>
  )
}
