import { ref } from 'vue'
import { defineStore } from 'pinia'
import { db, auth } from '@/firebase'
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, writeBatch, doc, serverTimestamp } from 'firebase/firestore'

export async function createNotification({ userId, groupId, type, message }) {
  await addDoc(collection(db, 'notifications'), {
    userId,
    groupId,
    type,
    message,
    read: false,
    createdAt: serverTimestamp(),
  })
}

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref([])
  const unreadCount = ref(0)
  const loading = ref(false)
  const error = ref(null)

  let unsubscribe = null
  let currentUid = null

  function resetNotifications() {
    notifications.value = []
    unreadCount.value = 0
    loading.value = false
    error.value = null
  }

  function unsubscribeNotifications() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    currentUid = null
  }

  function subscribeNotifications() {
    const uid = auth.currentUser?.uid
    if (!uid || (unsubscribe && currentUid === uid)) return
    if (unsubscribe) unsubscribe()

    currentUid = uid
    loading.value = true
    error.value = null

    unsubscribe = onSnapshot(
      query(
        collection(db, 'notifications'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc'),
      ),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        notifications.value = list
        unreadCount.value = list.filter((n) => !n.read).length
        loading.value = false
      },
      (err) => {
        error.value = err.message
        loading.value = false
      },
    )
  }

  async function markAsRead(id) {
    const uid = auth.currentUser?.uid
    if (!uid) return
    await updateDoc(doc(db, 'notifications', id), { read: true })
    const target = notifications.value.find((n) => n.id === id)
    if (target) {
      target.read = true
      unreadCount.value = notifications.value.filter((n) => !n.read).length
    }
  }

  async function markAllAsRead() {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const unread = notifications.value.filter((n) => !n.read)
    if (!unread.length) return
    const batch = writeBatch(db)
    for (const n of unread) {
      batch.update(doc(db, 'notifications', n.id), { read: true })
    }
    await batch.commit()
    notifications.value.forEach((n) => {
      n.read = true
    })
    unreadCount.value = 0
  }

  return {
    notifications,
    unreadCount,
    loading,
    error,
    resetNotifications,
    unsubscribeNotifications,
    subscribeNotifications,
    markAsRead,
    markAllAsRead,
  }
})
