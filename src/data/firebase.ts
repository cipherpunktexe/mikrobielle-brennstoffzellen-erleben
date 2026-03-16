import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyCRLRl1JW7tV3Jj-RXUQurJZaTBgUFgleY',
  authDomain: 'mikrobielle-brennstoffzellen.firebaseapp.com',
  projectId: 'mikrobielle-brennstoffzellen',
  storageBucket: 'mikrobielle-brennstoffzellen.firebasestorage.app',
  messagingSenderId: '558310527229',
  appId: '1:558310527229:web:bbc35eff5c869578f5ae94',
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
