import api from '../lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'QA_MANAGER' | 'HANDLER' | 'VIEWER';
  departmentId: string;
  isActive: boolean;
  createdAt: string;
  department?: {
    id: string;
    name: string;
  };
}

export const userService = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },

  create: async (data: Partial<User>): Promise<{ user: User; tempPassword?: string }> => {
    const response = await api.post('/users', data);
    return response.data;
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },

  setStatus: async (id: string, isActive: boolean): Promise<User> => {
    const response = await api.patch(`/users/${id}/status`, { isActive });
    return response.data;
  },

  resetPassword: async (id: string): Promise<{ tempPassword: string }> => {
    const response = await api.post(`/users/${id}/reset-password`);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.patch('/users/me/password', { currentPassword, newPassword });
  }
};
