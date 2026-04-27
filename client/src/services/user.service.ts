import API_URL from '../config';

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
    const response = await fetch(`${API_URL}/users`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  create: async (data: Partial<User>): Promise<{ user: User; tempPassword?: string }> => {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create user');
    }
    return response.json();
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  },

  setStatus: async (id: string, isActive: boolean): Promise<User> => {
    const response = await fetch(`${API_URL}/users/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ isActive })
    });
    if (!response.ok) throw new Error('Failed to update status');
    return response.json();
  },

  resetPassword: async (id: string): Promise<{ tempPassword: string }> => {
    const response = await fetch(`${API_URL}/users/${id}/reset-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Failed to reset password');
    return response.json();
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    const response = await fetch(`${API_URL}/users/me/password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to change password');
    }
  }
};
