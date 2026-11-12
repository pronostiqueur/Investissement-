import { StyleSheet } from 'react-native'
export const C = { noir: '#0a0a0a', gris: '#161616', or: '#d4af37', orClair: '#f6e27a', texte: '#f5f0e1', doux: '#a89f84', bord: '#3a2f0b', rouge: '#ff7b7b', vert: '#5ad17a' }
export const s = StyleSheet.create({
  fond: { flex: 1, backgroundColor: C.noir },
  centre: { flex: 1, backgroundColor: C.noir, justifyContent: 'center', padding: 24 },
  titre: { color: C.or, fontSize: 26, fontWeight: '800', letterSpacing: 2, textAlign: 'center' },
  doux: { color: C.doux, textAlign: 'center', marginTop: 6, marginBottom: 18 },
  input: { backgroundColor: '#0f0f0f', borderColor: C.bord, borderWidth: 1, borderRadius: 10, padding: 14, color: '#fff', marginBottom: 12, fontSize: 16 },
  bouton: { backgroundColor: C.or, borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 4 },
  boutonTxt: { color: '#111', fontWeight: '800', letterSpacing: 1 },
  lien: { color: C.or, textAlign: 'center', marginTop: 16 },
  erreur: { color: C.rouge, textAlign: 'center', marginBottom: 8 },
  carte: { backgroundColor: C.gris, borderColor: C.bord, borderWidth: 1, borderRadius: 14, margin: 12, marginBottom: 4, overflow: 'hidden' },
  barre: { flexDirection: 'row', borderTopColor: C.bord, borderTopWidth: 1, backgroundColor: C.gris }
})
