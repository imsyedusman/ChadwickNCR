import API_URL from '../config';

export interface Department {
  id: string;
  name: string;
  primaryHandlerId?: string | null;
  createdAt: string;
}

export const departmentService = {
  getAll: async (): Promise<Department[]> => {
    const response = await fetch(`${API_URL}/departments`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch departments');
    return response.json();
  },

  create: async (name: string): Promise<Department> => {
    const response = await fetch(`${API_URL}/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ name })
    });
    if (!response.ok) throw new Error('Failed to create department');
    return response.json();
  },

  update: async (id: string, data: Partial<Department>): Promise<Department> => {
    const response = await fetch(`${API_URL}/departments/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update department');
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/departments/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to delete department');
    }
  }
};
