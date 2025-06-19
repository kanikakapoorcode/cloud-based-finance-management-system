export type AuthContextType = {
  user: any | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ 
    success: boolean; 
    user?: any; 
    error?: string; 
    status?: number 
  }>;
  signup: (userData: any) => Promise<{ 
    success: boolean; 
    error?: string 
  }>;
  logout: () => void;
  updateUser: (userData: Partial<any>) => void;
  clearError: () => void;
  isLoading: boolean;
  hasError: boolean;
};
