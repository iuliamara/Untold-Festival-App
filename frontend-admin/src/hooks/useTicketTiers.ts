import { useState, useEffect } from 'react';

export interface TicketTier {
  id: string;
  displayName: string;
  category: 'GA' | 'VIP' | 'BACKSTAGE';
  price: number;
  capacity: number;
  sold: number;
  active: boolean;
}

export const useTicketTiers = () => {
  const [tiers, setTiers] = useState<TicketTier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTiers = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('untold_token') || sessionStorage.getItem('token') || '';
      const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8080';
      
      const response = await fetch(`${apiBaseUrl}/api/tickets/tiers`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data && data.type === 'SUCCESS') {
        setTiers(data.data || []);
        setError(null);
      } else {
        throw new Error(data?.message || 'Failed to fetch ticket tiers');
      }
    } catch (err: any) {
      console.warn("Failed to fetch live ticket tiers, using fallback tiers:", err.message || err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const saveTier = async (tier: TicketTier): Promise<boolean> => {
    try {
      const token = sessionStorage.getItem('untold_token') || sessionStorage.getItem('token') || '';
      const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8080';
      
      const response = await fetch(`${apiBaseUrl}/api/tickets/tiers`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(tier),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data && data.type === 'SUCCESS') {
        await fetchTiers();
        return true;
      } else {
        throw new Error(data?.message || 'Failed to save ticket tier');
      }
    } catch (err: any) {
      console.error("Failed to save ticket tier:", err.message || err);
      alert("Error saving ticket tier: " + err.message);
      return false;
    }
  };

  const deleteTier = async (id: string): Promise<boolean> => {
    try {
      const token = sessionStorage.getItem('untold_token') || sessionStorage.getItem('token') || '';
      const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8080';
      
      const response = await fetch(`${apiBaseUrl}/api/tickets/tiers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data && data.type === 'SUCCESS') {
        await fetchTiers();
        return true;
      } else {
        throw new Error(data?.message || 'Failed to delete ticket tier');
      }
    } catch (err: any) {
      console.error("Failed to delete ticket tier:", err.message || err);
      alert("Error deleting ticket tier: " + err.message);
      return false;
    }
  };

  useEffect(() => {
    fetchTiers();
  }, []);

  return { tiers, loading, error, saveTier, deleteTier, refetch: fetchTiers };
};
export default useTicketTiers;
