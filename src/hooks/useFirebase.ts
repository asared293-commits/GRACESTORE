/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, where, orderBy, QueryConstraint } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export function useCollection<T>(collectionName: string, constraints: QueryConstraint[] = []) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!collectionName || collectionName === '') {
       setLoading(false);
       return;
    }
    const q = query(collection(db, collectionName), ...constraints);
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T)));
        setLoading(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, collectionName);
        setError(err as Error);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [collectionName, JSON.stringify(constraints)]);

  return { data, loading, error };
}

export function useDocument<T>(collectionName: string, id: string | undefined) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id || !collectionName) return;
    const unsubscribe = onSnapshot(doc(db, collectionName, id), 
      (docSnap) => {
        if (docSnap.exists()) {
          setData({ id: docSnap.id, ...docSnap.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `${collectionName}/${id}`);
        setError(err as Error);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [collectionName, id]);

  return { data, loading, error };
}
