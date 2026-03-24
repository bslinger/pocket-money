import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

const ACTIVE_FAMILY_KEY = 'active_family_id';

interface Family {
  id: string;
  name: string;
}

interface FamilyContextValue {
  families: Family[];
  activeFamily: Family | null;
  isLoading: boolean;
  switchFamily: (familyId: string) => Promise<void>;
}

const FamilyContext = createContext<FamilyContextValue | null>(null);

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [activeFamilyId, setActiveFamilyId] = useState<string | null>(null);
  const [storageLoaded, setStorageLoaded] = useState(false);

  // Load stored active family on mount
  useEffect(() => {
    AsyncStorage.getItem(ACTIVE_FAMILY_KEY).then((id) => {
      if (id) setActiveFamilyId(id);
      setStorageLoaded(true);
    });
  }, []);

  const { data: families = [], isLoading: familiesLoading } = useQuery({
    queryKey: ['families'],
    queryFn: async () => {
      const res = await api.get('/families');
      return res.data.data as Family[];
    },
  });

  // Default to first family if stored ID is invalid or not set
  const activeFamily = families.find((f) => f.id === activeFamilyId) ?? families[0] ?? null;

  // Sync active family to storage when it changes
  useEffect(() => {
    if (activeFamily && activeFamily.id !== activeFamilyId) {
      setActiveFamilyId(activeFamily.id);
      AsyncStorage.setItem(ACTIVE_FAMILY_KEY, activeFamily.id);
    }
  }, [activeFamily?.id]);

  const switchFamily = useCallback(async (familyId: string) => {
    setActiveFamilyId(familyId);
    await AsyncStorage.setItem(ACTIVE_FAMILY_KEY, familyId);
    // Tell the backend too
    await api.post(`/families/${familyId}/switch`).catch(() => {});
    // Invalidate all data so screens refetch for the new family
    queryClient.invalidateQueries();
  }, [queryClient]);

  return (
    <FamilyContext.Provider
      value={{
        families,
        activeFamily,
        isLoading: !storageLoaded || familiesLoading,
        switchFamily,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily(): FamilyContextValue {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
}
