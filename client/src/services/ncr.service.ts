import api from '../lib/api';

export interface NCR {
  id: string;
  autoId: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  status: 'DRAFT' | 'ASSIGNED' | 'AWAITING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CLOSED' | 'CANCELLED';
  projectId: string;
  projectName?: string;
  location: string;
  category: string;
  issuedToDepartmentId?: string;
  attachments?: any[];
  dateClosed?: string;
  createdAt: string;
  updatedAt: string;
}

export const ncrService = {
  getAll: async () => {
    const res = await api.get<NCR[]>('/ncrs');
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get<NCR>(`/ncrs/${id}`);
    return res.data;
  },
  create: async (data: Partial<NCR>) => {
    const res = await api.post<NCR>('/ncrs', data);
    return res.data;
  },
  update: async (id: string, data: Partial<NCR>) => {
    const res = await api.patch<NCR>(`/ncrs/${id}`, data);
    return res.data;
  },
  uploadFiles: async (files: File[]) => {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    const res = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  updateStatus: async (id: string, status: string, reason?: string) => {
    const res = await api.patch(`/ncrs/${id}/status`, { status, reason });
    return res.data;
  },
  saveRca: async (id: string, whys: string[]) => {
    const res = await api.patch(`/ncrs/${id}/rca`, { rootCauseAnalysis: whys });
    return res.data;
  },
  addCapaAction: async (id: string, data: { description: string, ownerId: string, dueDate: string }) => {
    const res = await api.post(`/ncrs/${id}/capa`, data);
    return res.data;
  },
  updateCapaAction: async (actionId: string, data: { status: string, completionPercentage?: number }) => {
    const res = await api.patch(`/ncrs/capa/${actionId}`, data);
    return res.data;
  },
  signOff: async (id: string, stage: string, metadata: any) => {
    const res = await api.post(`/ncrs/${id}/sign`, { stage, metadata });
    return res.data;
  },
  getMyCapaActions: async () => {
    const res = await api.get('/ncrs/capa-actions');
    return res.data;
  },
  getAuditLogs: async () => {
    const res = await api.get('/ncrs/audit-logs');
    return res.data;
  }
};
