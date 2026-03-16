import { GoogleAuthProvider } from 'firebase/auth'
import { collection, doc } from 'firebase/firestore'
import { auth, db } from './firebase'
export {
  formatSequentialGeneratorCode,
  getEntityLifecycleStatus,
  getNextGeneratorSequence,
  isActiveEntity,
} from './firebaseData.helpers'

export { auth, db }

export const usersCollection = collection(db, 'users')
export const generatorsCollection = collection(db, 'generators')
export const measurementsCollection = collection(db, 'measurements')
const adminStateCollection = collection(db, 'adminState')
export const qrExportCounterRef = doc(adminStateCollection, 'qr-export-counter')
export const googleProvider = new GoogleAuthProvider()
