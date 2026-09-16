import { useState, useEffect } from 'react';

export interface CategoryStats {
  sold: number;
  capacity: number;
  revenue: number;
  avgPrice: number;
  percentage: number;
}

export interface TicketStats {
  totalRevenue: number;
  totalSold: number;
  categoryStats: {
    GA?: CategoryStats;
    VIP?: CategoryStats;
    BACKSTAGE?: CategoryStats;
  };
}

export const useTicketStats = () => {
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem('untold_token') || sessionStorage.getItem('token') || '';
        const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8080';
        
        const response = await fetch(`${apiBaseUrl}/api/tickets/stats`, {
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
          setStats(data.data);
          setError(null);
        } else {
          throw new Error(data?.message || 'Failed to fetch ticket stats');
        }
      } catch (err: any) {
        console.warn("Failed to fetch live ticket stats, falling back to mock data:", err.message || err);
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
};
export default useTicketStats;
