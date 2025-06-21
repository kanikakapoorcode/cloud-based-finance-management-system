export type AuthContextType = {
  user: any | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<{ 
    success: boolean; 
    user?: any;
    token?: string;
    error?: string; 
    status?: number;
  }>;
  signup: (userData: any) => Promise<{ 
    success: boolean; 
    error?: string;
    status?: number;
  }>;
  logout: () => void;
  updateUser: (userData: Partial<any>) => void;
  clearError: () => void;
  clearAuthData: () => void;
  isLoading: boolean;
  hasError: boolean;
};
