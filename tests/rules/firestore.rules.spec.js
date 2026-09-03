import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing'
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore'

const PROJECT_ID = 'circlo-rules-test'
const rulesPath = fileURLToPath(new URL('../../firestore.rules', import.meta.url))
const rules = readFileSync(rulesPath, 'utf8')

const uid = {
  admin: 'admin',
  member: 'member1',
  stranger: 'stranger',
  joiner: 'joiner',
}

let testEnv

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { host: '127.0.0.1', port: 8080, rules },
  })
})

afterEach(async () => {
  await testEnv.clearFirestore()
})

afterAll(async () => {
  await testEnv.cleanup()
})

function db(authed) {
  return authed
    ? testEnv.authenticatedContext(authed).firestore()
    : testEnv.unauthenticatedContext().firestore()
}

// Seeds a group whose admin is uid.admin, with one approved member (uid.member),
// matching the shape produced by createGroup (no currentCycleRecipientId yet).
async function seedGroup() {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const d = ctx.firestore()
    await setDoc(doc(d, 'groups', 'g1'), {
      name: 'Test Group',
      adminId: uid.admin,
      contributionAmount: 1000,
      frequency: 'weekly',
      totalMembers: 2,
      currentCycle: 0,
      status: 'active',
      inviteCode: 'abc12345',
      pendingCount: 0,
    })
    await setDoc(doc(d, 'groups', 'g1', 'members', uid.admin), {
      userId: uid.admin,
      displayName: 'Admin',
      rotationOrder: 1,
      hasReceived: false,
      status: 'approved',
      joinedCycle: 1,
    })
    await setDoc(doc(d, 'groups', 'g1', 'members', uid.member), {
      userId: uid.member,
      displayName: 'Member',
      rotationOrder: 2,
      hasReceived: false,
      status: 'approved',
      joinedCycle: 1,
    })
    await setDoc(doc(d, 'invites', 'abc12345'), {
      groupId: 'g1',
      groupName: 'Test Group',
      adminId: uid.admin,
    })
    await setDoc(doc(d, 'users', uid.admin), { displayName: 'Admin', memberGroupIds: ['g1'] })
    await setDoc(doc(d, 'users', uid.member), { displayName: 'Member', memberGroupIds: ['g1'] })
  })
}

describe('invites collection', () => {
  beforeEach(seedGroup)

  it('is readable by unauthenticated users (invite-link lookup)', async () => {
    await assertSucceeds(getDoc(doc(db(), 'invites', 'abc12345')))
  })

  it('is readable by a signed-in non-member', async () => {
    await assertSucceeds(getDoc(doc(db(uid.stranger), 'invites', 'abc12345')))
  })

  it('cannot be created by a non-admin', async () => {
    await assertFails(
      setDoc(doc(db(uid.stranger), 'invites', 'xyz'), {
        groupId: 'g1',
        groupName: 'Test Group',
        adminId: uid.stranger,
      }),
    )
  })

  it('can be created by the group admin', async () => {
    await assertSucceeds(
      setDoc(doc(db(uid.admin), 'invites', 'newcode'), {
        groupId: 'g1',
        groupName: 'Test Group',
        adminId: uid.admin,
      }),
    )
  })
})

describe('groups collection', () => {
  it('is not readable by unauthenticated users', async () => {
    await seedGroup()
    await assertFails(getDoc(doc(db(), 'groups', 'g1')))
  })

  it('is not readable by a non-member', async () => {
    await seedGroup()
    await assertFails(getDoc(doc(db(uid.stranger), 'groups', 'g1')))
  })

  it('is readable by the admin', async () => {
    await seedGroup()
    await assertSucceeds(getDoc(doc(db(uid.admin), 'groups', 'g1')))
  })

  it('is readable by an approved member', async () => {
    await seedGroup()
    await assertSucceeds(getDoc(doc(db(uid.member), 'groups', 'g1')))
  })

  it('lets an admin list their groups via where(adminId == uid)', async () => {
    await seedGroup()
    const q = query(collection(db(uid.admin), 'groups'), where('adminId', '==', uid.admin))
    const snap = await assertSucceeds(getDocs(q))
    expect(snap.docs.map((d) => d.id)).toEqual(['g1'])
  })

  it('lets a member run the admin query safely (returns empty, not an error)', async () => {
    await seedGroup()
    const q = query(collection(db(uid.member), 'groups'), where('adminId', '==', uid.member))
    const snap = await assertSucceeds(getDocs(q))
    expect(snap.docs.length).toBe(0)
  })

  it('blocks listing all groups without a filter', async () => {
    await seedGroup()
    await assertFails(getDocs(collection(db(uid.stranger), 'groups')))
    await assertFails(getDocs(collection(db(uid.member), 'groups')))
  })

  it('can be deleted by the admin', async () => {
    await seedGroup()
    await assertSucceeds(deleteDoc(doc(db(uid.admin), 'groups', 'g1')))
  })

  it('cannot be deleted by a member or non-member', async () => {
    await seedGroup()
    await assertFails(deleteDoc(doc(db(uid.member), 'groups', 'g1')))
    await assertFails(deleteDoc(doc(db(uid.stranger), 'groups', 'g1')))
  })
})

describe('members subcollection', () => {
  it('is readable by a member (payment transparency ledger)', async () => {
    await seedGroup()
    await assertSucceeds(getDocs(collection(db(uid.member), 'groups', 'g1', 'members')))
  })

  it('is not readable by a non-member', async () => {
    await seedGroup()
    await assertFails(getDocs(collection(db(uid.stranger), 'groups', 'g1', 'members')))
  })

  it('lets a non-member read their own (missing) member doc during join flow', async () => {
    await seedGroup()
    await assertSucceeds(getDoc(doc(db(uid.joiner), 'groups', 'g1', 'members', uid.joiner)))
  })

  it('blocks a non-member from reading another member doc', async () => {
    await seedGroup()
    await assertFails(getDoc(doc(db(uid.stranger), 'groups', 'g1', 'members', uid.admin)))
  })

  it('allows a self-join (pending) when the rotation has not started', async () => {
    await seedGroup()
    await assertSucceeds(
      setDoc(doc(db(uid.joiner), 'groups', 'g1', 'members', uid.joiner), {
        userId: uid.joiner,
        displayName: 'Joiner',
        email: 'joiner@example.com',
        rotationOrder: 0,
        hasReceived: false,
        status: 'pending',
      }),
    )
  })

  it('blocks a self-join mid-rotation (server-side guard)', async () => {
    await seedGroup()
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'groups', 'g1'), {
        currentCycleRecipientId: uid.admin,
      })
    })
    await assertFails(
      setDoc(doc(db(uid.joiner), 'groups', 'g1', 'members', uid.joiner), {
        userId: uid.joiner,
        displayName: 'Joiner',
        rotationOrder: 0,
        hasReceived: false,
        status: 'pending',
      }),
    )
  })

  it('lets a member update only their own displayName', async () => {
    await seedGroup()
    await assertSucceeds(
      updateDoc(doc(db(uid.member), 'groups', 'g1', 'members', uid.member), {
        displayName: 'New Name',
      }),
    )
  })

  it('blocks a member from changing other fields of their own member doc', async () => {
    await seedGroup()
    await assertFails(
      updateDoc(doc(db(uid.member), 'groups', 'g1', 'members', uid.member), {
        status: 'approved',
        rotationOrder: 1,
      }),
    )
  })

  it('blocks a member from editing another member doc', async () => {
    await seedGroup()
    await assertFails(
      updateDoc(doc(db(uid.member), 'groups', 'g1', 'members', uid.admin), {
        displayName: 'Hacked',
      }),
    )
  })

  it('lets the admin update member docs (approve/remove)', async () => {
    await seedGroup()
    await assertSucceeds(
      updateDoc(doc(db(uid.admin), 'groups', 'g1', 'members', uid.member), {
        status: 'left',
      }),
    )
  })

  it('blocks member doc deletion (delete is denied for everyone)', async () => {
    await seedGroup()
    await assertFails(deleteDoc(doc(db(uid.admin), 'groups', 'g1', 'members', uid.member)))
  })
})

describe('users collection', () => {
  beforeEach(seedGroup)

  it('lets a user read their own profile', async () => {
    await assertSucceeds(getDoc(doc(db(uid.member), 'users', uid.member)))
  })

  it('blocks reading another user profile', async () => {
    await assertFails(getDoc(doc(db(uid.member), 'users', uid.admin)))
  })

  it('lets a user update their own profile (displayName sync)', async () => {
    await assertSucceeds(updateDoc(doc(db(uid.member), 'users', uid.member), { displayName: 'New' }))
  })

  it('blocks updating another user profile', async () => {
    await assertFails(updateDoc(doc(db(uid.member), 'users', uid.admin), { displayName: 'Hacked' }))
  })
})

describe('contributions and cycles', () => {
  beforeEach(seedGroup)

  it('lets members read contributions; blocks non-members', async () => {
    await assertSucceeds(getDocs(collection(db(uid.member), 'groups', 'g1', 'contributions')))
    await assertFails(getDocs(collection(db(uid.stranger), 'groups', 'g1', 'contributions')))
  })

  it('lets only the admin write contributions', async () => {
    await assertSucceeds(
      setDoc(doc(db(uid.admin), 'groups', 'g1', 'contributions', 'c1'), { cycle: 1, userId: uid.admin, amount: 1000 }),
    )
    await assertFails(
      setDoc(doc(db(uid.member), 'groups', 'g1', 'contributions', 'c2'), { cycle: 1, userId: uid.member, amount: 1000 }),
    )
  })

  it('lets only the admin write cycles', async () => {
    await assertSucceeds(
      setDoc(doc(db(uid.admin), 'groups', 'g1', 'cycles', '1'), { cycle: 1, recipientId: uid.admin }),
    )
    await assertFails(
      setDoc(doc(db(uid.member), 'groups', 'g1', 'cycles', '2'), { cycle: 2, recipientId: uid.member }),
    )
  })
})

describe('notifications collection', () => {
  it('lets a user read only their own notifications', async () => {
    await seedGroup()
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const d = ctx.firestore()
      await setDoc(doc(d, 'notifications', 'n1'), { userId: uid.member, groupId: 'g1', type: 'paid', message: 'hi' })
      await setDoc(doc(d, 'notifications', 'n2'), { userId: uid.admin, groupId: 'g1', type: 'paid', message: 'hi' })
    })
    await assertSucceeds(getDoc(doc(db(uid.member), 'notifications', 'n1')))
    await assertFails(getDoc(doc(db(uid.member), 'notifications', 'n2')))
  })

  it('lets the admin create a notification for a group member', async () => {
    await seedGroup()
    await assertSucceeds(
      setDoc(doc(db(uid.admin), 'notifications', 'n3'), {
        userId: uid.member,
        groupId: 'g1',
        type: 'reminder',
        message: 'pay up',
      }),
    )
  })
})
