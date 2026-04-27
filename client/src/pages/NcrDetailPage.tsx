import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ncrService } from '../services/ncr.service';
import { 
  Clock, 
  AlertTriangle,
  FileText,
  MapPin,
  Tag,
  User,
  ChevronRight,
  Printer,
  ShieldAlert,
  Search,
  UploadCloud,
  FileIcon,
  Download,
  Building2,
  Paperclip,
  Trash2
} from 'lucide-react';
import axios from 'axios';
import { API_URL, BASE_URL } from '../config';
import Timeline from '../components/Timeline';
import RcaWidget from '../components/RcaWidget';
import CapaActionList from '../components/CapaActionList';
import SignOffModal from '../components/SignOffModal';
import ReasonModal from '../components/ReasonModal';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { cn } from '../lib/utils';

const NcrDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ncr, setNcr] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSignOff, setShowSignOff] = useState<{ stage: string, title: string, desc: string } | null>(null);
  const [showReason, setShowReason] = useState<{ status: string, title: string, desc: string } | null>(null);
  const [signing, setSigning] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (id) {
      console.log('Fetching NCR with ID:', id);
      ncrService.getById(id).then(data => {
        console.log('NCR data received:', data);
        setNcr(data);
        setLoading(false);
      }).catch(err => {
        console.error('Error fetching NCR:', err);
        setLoading(false);
      });
      axios.get(`${API_URL}/ncrs/departments`).then(res => {
        setDepartments(res.data);
      }).catch(err => console.error(err));
    } else {
      console.warn('No ID provided in params');
      setLoading(false);
    }
  }, [id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const uploadedFiles = await ncrService.uploadFiles(Array.from(e.target.files));
      const newAttachments = [...(ncr.attachments || []), ...uploadedFiles];
      const updated = await ncrService.update(ncr.id, { attachments: newAttachments });
      setNcr(updated);
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!window.confirm('Are you sure you want to remove this attachment? This action cannot be undone.')) return;
    try {
      const newAttachments = ncr.attachments.filter((a: any) => a.id !== attachmentId);
      const updated = await ncrService.update(ncr.id, { attachments: newAttachments });
      setNcr(updated);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete attachment');
    }
  };

  const updateIssuedTo = async (deptId: string) => {
    try {
      const updated = await ncrService.update(ncr.id, { issuedToDepartmentId: deptId });
      setNcr(updated);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Update failed');
    }
  };

  const handleStatusChange = async (newStatus: string, reason?: string) => {
    try {
      await ncrService.updateStatus(ncr.id, newStatus, reason);
      const updated = await ncrService.getById(ncr.id);
      setNcr(updated);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  const promptStatusChange = async (newStatus: string) => {
    if (newStatus === 'REJECTED' || newStatus === 'CANCELLED') {
      setShowReason({
        status: newStatus,
        title: `${newStatus === 'REJECTED' ? 'Reject' : 'Cancel'} Record`,
        desc: `Please provide a formal justification for ${newStatus.toLowerCase()} this NCR.`
      });
    } else if (newStatus === 'CLOSED') {
      setShowSignOff({
        stage: 'CLOSED',
        title: 'Close Record',
        desc: 'Confirm formal closure of this NCR.'
      });
    } else {
      handleStatusChange(newStatus);
    }
  };

  const getStatusStep = (status: string) => {
    const steps = ['DRAFT', 'ASSIGNED', 'AWAITING_APPROVAL', 'APPROVED', 'CLOSED'];
    return steps.indexOf(status);
  };

  const canTransitionTo = (newStatus: string) => {
    const role = user?.role;
    const isQA = role === 'ADMIN' || role === 'QA_MANAGER';
    if (isQA) return true;
    
    // Handlers can move to Awaiting Approval
    if (role === 'HANDLER') {
      if (newStatus === 'AWAITING_APPROVAL' && ncr.status === 'ASSIGNED') return true;
      if (newStatus === 'ASSIGNED' && ncr.status === 'DRAFT') return true;
    }
    
    return false;
  };

  const handleSignOff = async (metadata: any) => {
    if (!showSignOff) return;
    setSigning(true);
    try {
      await ncrService.signOff(ncr.id, showSignOff.stage, metadata);
      let nextStatus = ncr.status;
      if (showSignOff.stage === 'CORRECTIVE_ACTION') nextStatus = 'VERIFICATION';
      if (showSignOff.stage === 'VERIFICATION') nextStatus = 'CLOSED';
      if (showSignOff.stage === 'CLOSED') nextStatus = 'CLOSED';
      
      await ncrService.updateStatus(ncr.id, nextStatus);
      const updated = await ncrService.getById(ncr.id);
      setNcr(updated);
      setShowSignOff(null);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to sign off');
    } finally {
      setSigning(false);
    }
  };

  const handleSaveRca = async (whys: string[]) => {
    try {
      await ncrService.saveRca(ncr.id, whys);
      const updated = await ncrService.getById(ncr.id);
      setNcr(updated);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save analysis');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  if (!ncr) return (
    <div className="text-center py-20 space-y-4">
      <Search size={48} className="mx-auto mb-4 text-muted-foreground opacity-20" />
      <h2 className="text-xl font-bold">Non-Conformance Not Found</h2>
      <Button variant="outline" onClick={() => navigate('/ncrs')}>Return to Non-Conformances</Button>
    </div>
  );

  const statusSteps = [
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Assigned', value: 'ASSIGNED' },
    { label: 'Review', value: 'AWAITING_APPROVAL' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Closed', value: 'CLOSED' }
  ];

  return (
    <div className="min-h-[80vh] space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-20 px-4 sm:px-6">
      {/* Header Area */}
      <div className="flex flex-col space-y-6 border-b border-border/40 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <Link to="/ncrs" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Non-Conformances</Link>
              <ChevronRight size={12} className="text-muted-foreground/40" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">{ncr.autoId}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter leading-none">{ncr.title}</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="font-black h-10 px-4">
              <Printer size={16} className="mr-2" />
              Print Report
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="font-black h-10 px-6 shadow-lg shadow-primary/20"
              onClick={() => navigate(`/ncrs/${ncr.id}/edit`)}
            >
              Edit Report
            </Button>
          </div>
        </div>

        {/* Status Workflow Indicator */}
        <div className="bg-muted/30 p-1.5 rounded-xl border border-border/40 flex flex-wrap items-center gap-1">
          {statusSteps.map((step, idx) => {
            const isCurrent = ncr.status === step.value;
            const isPast = getStatusStep(ncr.status) > idx;
            const isQA = user?.role === 'ADMIN' || user?.role === 'QA_MANAGER';
            
            // Linear progression check
            const isNextStep = idx === getStatusStep(ncr.status) + 1;
            const isReturnFromRejected = ncr.status === 'REJECTED' && step.value === 'ASSIGNED';
            
            const canMove = canTransitionTo(step.value) && (isNextStep || isReturnFromRejected || isQA);
            
            return (
              <div key={step.value} className="flex items-center gap-1 flex-1 min-w-[120px]">
                <button
                  disabled={!canMove}
                  onClick={() => promptStatusChange(step.value)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border",
                    isCurrent ? "bg-primary text-white border-primary shadow-md" : 
                    isPast ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                    canMove ? "bg-background text-primary border-primary/20 hover:border-primary hover:bg-primary/5" :
                    "bg-transparent text-muted-foreground border-transparent opacity-40 cursor-not-allowed"
                  )}
                >
                  {isPast ? <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> : null}
                  {step.label}
                </button>
                {idx < statusSteps.length - 1 && (
                  <ChevronRight size={14} className="text-muted-foreground/20 shrink-0" />
                )}
              </div>
            );
          })}
          
          {(ncr.status === 'REJECTED' || ncr.status === 'CANCELLED') && (
            <div className="ml-auto px-4">
              <Badge variant="destructive" className="font-black uppercase tracking-widest">
                {ncr.status}
              </Badge>
            </div>
          )}
          
          {(ncr.status === 'AWAITING_APPROVAL' || ncr.status === 'APPROVED') && (user?.role === 'ADMIN' || user?.role === 'QA_MANAGER') && (
            <div className="flex items-center gap-1 ml-auto">
              <Button size="sm" variant="destructive" className="h-9 px-4 font-black uppercase text-[10px]" onClick={() => promptStatusChange('REJECTED')}>Reject</Button>
              {ncr.status === 'AWAITING_APPROVAL' && (
                <Button size="sm" className="h-9 px-4 font-black uppercase text-[10px] bg-emerald-600 hover:bg-emerald-700" onClick={() => promptStatusChange('APPROVED')}>Approve</Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        <div className="lg:col-span-2 space-y-12">
          {/* Main Description */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border/40 pb-2">
              <FileText size={18} className="text-primary/60" />
              <h2 className="text-xl font-bold tracking-tight mb-0">Occurrence Description</h2>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="text-base leading-relaxed text-muted-foreground whitespace-pre-wrap">{ncr.description}</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 p-6 bg-muted/10 rounded-2xl border border-border/40">
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <Tag size={10} /> Project
                </p>
                <div>
                  <p className="text-xs font-black">{ncr.projectId}</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase truncate">{ncr.projectName || 'Main Project'}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <MapPin size={10} /> Location
                </p>
                <p className="text-xs font-black">{ncr.location}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <AlertTriangle size={10} /> Severity
                </p>
                <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-tight px-2 py-0", 
                  ncr.severity === 'CRITICAL' ? "text-red-600 border-red-200 bg-red-50" : 
                  ncr.severity === 'MAJOR' ? "text-amber-600 border-amber-200 bg-amber-50" : 
                  "text-blue-600 border-blue-200 bg-blue-50"
                )}>
                  {ncr.severity}
                </Badge>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <User size={10} /> Issuer
                </p>
                <p className="text-xs font-black">{ncr.issuedBy?.name || 'Unknown'}</p>
              </div>
              <div className="space-y-1.5 col-span-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <Building2 size={10} /> Issued To
                </p>
                {ncr.status === 'DRAFT' ? (
                  <div className="max-w-[200px]">
                    <Select 
                      value={ncr.issuedToDepartmentId || ''}
                      onValueChange={(val) => updateIssuedTo(val)}
                    >
                      <SelectTrigger className="h-8 text-[11px] font-bold border-border/60">
                        <SelectValue placeholder="Select Dept..." />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(d => (
                          <SelectItem key={d.id} value={d.id} className="text-[11px] font-bold">{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <p className="text-xs font-black">{ncr.issuedToDepartment?.name || 'Unknown'}</p>
                )}
              </div>
            </div>
          </section>

          {/* Root Cause Analysis */}
          <section className="space-y-6 pt-6 border-t border-border/40">
            <div className="flex items-center gap-3 border-b border-border/40 pb-2">
              <ShieldAlert size={18} className="text-primary/60" />
              <h2 className="text-xl font-bold tracking-tight mb-0">Root Cause Analysis</h2>
            </div>
            <RcaWidget 
              initialData={ncr.rootCauseAnalysis} 
              onSave={handleSaveRca} 
            />
          </section>

          {/* CAPA Section */}
          <section className="space-y-6 pt-6 border-t border-border/40">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <div className="flex items-center gap-3">
                <Clock size={18} className="text-primary/60" />
                <h2 className="text-xl font-bold tracking-tight mb-0">Action Management (CAPA)</h2>
              </div>
            </div>
            <CapaActionList 
              ncrId={ncr.id} 
              actions={ncr.capaActions} 
              onUpdate={async () => {
                const updated = await ncrService.getById(ncr.id);
                setNcr(updated);
              }}
              canEdit={['ADMIN', 'QA_MANAGER', 'HANDLER'].includes(user?.role || '')}
            />
          </section>

          {/* Attachments */}
          <section className="space-y-6 pt-6 border-t border-border/40">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <div className="flex items-center gap-3">
                <Paperclip size={18} className="text-primary/60" />
                <h2 className="text-xl font-bold tracking-tight mb-0">Attachments</h2>
              </div>
              <div>
                <input type="file" id="file-upload" multiple className="hidden" onChange={handleFileUpload} />
                <label htmlFor="file-upload">
                  <Button variant="outline" size="sm" className="cursor-pointer h-9 px-4 font-black text-[10px] uppercase tracking-widest" asChild disabled={uploading}>
                    <span>
                      {uploading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" /> : <UploadCloud size={14} className="mr-2" />}
                      Add Files
                    </span>
                  </Button>
                </label>
              </div>
            </div>
            
            {(!ncr.attachments || ncr.attachments.length === 0) ? (
              <div className="text-center py-12 text-muted-foreground bg-muted/5 rounded-2xl border border-dashed border-border/40">
                <Paperclip size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest opacity-40">No attachments uploaded</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ncr.attachments.map((file: any) => (
                  <div key={file.id} className="flex items-center justify-between p-4 border rounded-xl bg-background hover:border-primary/50 transition-all group">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="p-2.5 bg-primary/5 text-primary rounded-lg shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                        <FileIcon size={18} />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-black truncate" title={file.name}>{file.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{new Date(file.uploadedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <a href={`${BASE_URL}${file.url}`} target="_blank" rel="noreferrer" className="p-2 text-muted-foreground hover:text-primary transition-colors">
                        <Download size={18} />
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                        onClick={() => handleDeleteAttachment(file.id)}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-8 lg:sticky lg:top-10">
          <Card className="border-border/40 shadow-none overflow-hidden rounded-2xl">
            <CardHeader className="bg-muted/30 border-b py-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Audit Log</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Timeline logs={ncr.auditLogs} />
            </CardContent>
          </Card>

          <Card className="border-red-100 shadow-none bg-red-50/30 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-red-100 bg-red-100/20 py-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-red-700 flex items-center gap-2">
                <AlertTriangle size={14} />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-[10px] font-bold text-red-600/70 leading-relaxed uppercase tracking-tight">
                Cancellation requires formal justification and will be permanently logged.
              </p>
              <Button 
                variant="outline" 
                onClick={() => promptStatusChange('CANCELLED')}
                disabled={ncr.status === 'CANCELLED' || ncr.status === 'CLOSED'}
                className="w-full text-[11px] font-black uppercase tracking-widest text-red-600 hover:bg-red-600 hover:text-white border-red-200 h-11 transition-all"
              >
                Cancel Record
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      {showReason && (
        <ReasonModal 
          title={showReason.title}
          description={showReason.desc}
          isLoading={loading}
          onConfirm={(reason) => {
            handleStatusChange(showReason.status, reason);
            setShowReason(null);
          }}
          onClose={() => setShowReason(null)}
        />
      )}

      {showSignOff && (
        <SignOffModal 
          title={showSignOff.title}
          description={showSignOff.desc}
          isLoading={signing}
          onConfirm={handleSignOff}
          onClose={() => setShowSignOff(null)}
        />
      )}
    </div>
  );
};

export default NcrDetailPage;
