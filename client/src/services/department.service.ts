import api from '../lib/api';

export interface Department {
  id: string;
  name: string;
  primaryHandlerId?: string | null;
  createdAt: string;
}

export const departmentService = {
  getAll: async (): Promise<Department[]> => {
    const response = await api.get('/departments');
    return response.data;
  },

  create: async (name: string): Promise<Department> => {
    const response = await api.post('/departments', { name });
    return response.data;
  },

  update: async (id: string, data: Partial<Department>): Promise<Department> => {
    const response = await api.patch(`/departments/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/departments/${id}`);
  }
};
