import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';
import { ncrService } from '../services/ncr.service';
import { ArrowLeft, AlertTriangle, ShieldAlert, MapPin, Tag, Building2, Paperclip, X, Trash2, CloudUpload } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { cn } from '../lib/utils';

const NcrFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'MINOR' as 'MINOR' | 'MAJOR' | 'CRITICAL',
    projectId: '',
    projectName: '',
    location: 'FACTORY',
    category: 'QUALITY',
    issuedToDepartmentId: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);

  useEffect(() => {
    setFetching(true);
    axios.get(`${API_URL}/ncrs/departments`).then(res => {
      setDepartments(res.data);
    }).catch(err => {
      console.error('Failed to fetch departments:', err);
    });

    if (id) {
      ncrService.getById(id).then(data => {
        setFormData({
          title: data.title,
          description: data.description,
          severity: data.severity,
          projectId: data.projectId,
          projectName: data.projectName || '',
          location: data.location,
          category: data.category,
          issuedToDepartmentId: data.issuedToDepartmentId || '',
        });
        setExistingAttachments(data.attachments || []);
        setFetching(false);
      }).catch(err => {
        console.error('Failed to fetch NCR:', err);
        setError('Failed to load NCR data');
        setFetching(false);
      });
    } else {
      setFetching(false);
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.issuedToDepartmentId) {
      setError('Please select a department to issue the NCR to.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      let attachments = [...existingAttachments];
      if (selectedFiles.length > 0) {
        const newAttachments = await ncrService.uploadFiles(selectedFiles);
        attachments = [...attachments, ...newAttachments];
      }
      
      if (id) {
        await ncrService.update(id, { ...formData, attachments });
        navigate(`/ncrs/${id}`);
      } else {
        const ncr = await ncrService.create({ ...formData, attachments });
        navigate(`/ncrs/${ncr.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${id ? 'update' : 'create'} NCR`);
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="hover:bg-transparent -ml-2 text-muted-foreground hover:text-foreground font-bold">
          <ArrowLeft size={16} className="mr-2" />
          Back to list
        </Button>
        <Badge variant="outline" className="text-xs font-black tracking-widest px-4 py-1 border-2">{id ? 'EDITING REPORT' : 'DRAFT REPORT'}</Badge>
      </div>

      <header>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tighter">{id ? 'Update Report' : 'Issue New Report'}</h1>
        <p className="text-lg text-muted-foreground mt-2 font-medium italic">{id ? 'Modify the details of this non-conformance record.' : 'Record a quality or safety non-conformance for formal review.'}</p>
      </header>

      {error && (
        <div className="bg-destructive/10 p-6 rounded-xl flex items-center gap-4 text-destructive text-sm font-bold border-2 border-destructive/20 animate-bounce">
          <AlertTriangle size={24} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b-2 pb-2 border-primary/10">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ShieldAlert className="text-primary" size={20} />
              </div>
              <h2 className="text-2xl font-black tracking-tight mb-0">Incident Details</h2>
            </div>
            
            <Card className="shadow-xl border-2 overflow-hidden bg-muted/5">
              <CardContent className="p-4 sm:p-8 space-y-8">
                <div className="space-y-3">
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Title / Short Description</p>
                  <Input 
                    required
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g. Defective weld on Main Frame"
                    className="h-12 bg-background font-bold text-lg border-2 focus-visible:ring-primary/20"
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Detailed Description</p>
                  <textarea 
                    required
                    rows={8}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Provide a comprehensive explanation of the non-conformance, including expected vs actual results..."
                    className="flex min-h-[160px] w-full rounded-md border-2 border-input bg-background px-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between ml-1">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Supporting Evidence</p>
                    <span className="text-xs text-muted-foreground font-medium">Photos, Documents, Logs</span>
                  </div>
                  <div 
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="border-2 border-dashed border-primary/20 bg-primary/5 rounded-xl p-8 transition-all hover:bg-primary/10 hover:border-primary/40 cursor-pointer group"
                  >
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="p-4 bg-background rounded-full shadow-sm border border-border group-hover:scale-110 transition-transform">
                        <CloudUpload size={28} className="text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-base font-bold">Drag and drop files, or click to browse</p>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">Maximum file size: 10MB per file</p>
                      </div>
                      <Input
                        type="file"
                        multiple
                        className="hidden"
                        id="file-upload"
                        onChange={(e) => {
                          if (e.target.files) {
                            setSelectedFiles([...selectedFiles, ...Array.from(e.target.files)]);
                          }
                        }}
                      />
                      <Button type="button" variant="outline" className="bg-background font-black border-2 text-[10px] uppercase tracking-widest px-6">
                        Select Files
                      </Button>
                    </div>
                  </div>

                  {(existingAttachments.length > 0 || selectedFiles.length > 0) && (
                    <div className="space-y-3 mt-6">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Current Attachments</p>
                      
                      {existingAttachments.map((file, idx) => (
                        <div key={`existing-${idx}`} className="flex items-center justify-between p-3 bg-muted/20 border-2 border-transparent rounded-xl hover:border-primary/20 transition-all">
                          <div className="flex items-center gap-3 truncate">
                            <Paperclip size={16} className="text-primary/60 flex-shrink-0" />
                            <div className="truncate">
                              <span className="text-sm font-bold truncate block">{file.name}</span>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase">Existing Attachment</span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExistingAttachments(existingAttachments.filter((_, i) => i !== idx));
                            }}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      ))}

                      {selectedFiles.map((file, idx) => (
                        <div key={`new-${idx}`} className="flex items-center justify-between p-3 bg-primary/5 border-2 border-primary/10 rounded-xl animate-in zoom-in-95 duration-200">
                          <div className="flex items-center gap-3 truncate">
                            <Paperclip size={16} className="text-primary flex-shrink-0" />
                            <div className="truncate">
                              <span className="text-sm font-bold truncate block">{file.name}</span>
                              <span className="text-[10px] font-black text-primary uppercase">New Upload</span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFiles(selectedFiles.filter((_, i) => i !== idx));
                            }}
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b-2 pb-2 border-primary/10">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Tag className="text-primary" size={20} />
              </div>
              <h2 className="text-2xl font-black tracking-tight mb-0">Classification & Assignment</h2>
            </div>

            <Card className="shadow-xl border-2 bg-muted/5">
              <CardContent className="p-4 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Project ID</p>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input 
                        required
                        value={formData.projectId}
                        onChange={e => setFormData({...formData, projectId: e.target.value})}
                        placeholder="e.g. P-12345"
                        className="h-12 bg-background pl-10 border-2 font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Project Name</p>
                    <Input 
                      required
                      value={formData.projectName}
                      onChange={e => setFormData({...formData, projectName: e.target.value})}
                      placeholder="e.g. Western Highway Expansion"
                      className="h-12 bg-background border-2 font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Issue to Department</p>
                  <Select 
                    value={formData.issuedToDepartmentId} 
                    onValueChange={v => setFormData({...formData, issuedToDepartmentId: v})}
                  >
                    <SelectTrigger className="h-12 bg-background border-2 font-bold">
                      <SelectValue placeholder="Select Department..." />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        <div className="space-y-6 lg:sticky lg:top-10">
          <Card className="shadow-xl border-2 bg-background overflow-hidden">
            <div className="bg-muted/30 px-6 py-3 border-b-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Classification Metadata</p>
            </div>
            <CardContent className="p-6 space-y-8">
              <div className="space-y-3">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Severity Level</p>
                <Select 
                  value={formData.severity} 
                  onValueChange={v => setFormData({...formData, severity: v as any})}
                >
                  <SelectTrigger className="h-11 border-2 font-black">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2 w-2 rounded-full", 
                        formData.severity === 'CRITICAL' ? "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]" : 
                        formData.severity === 'MAJOR' ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" : "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                      )} />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MINOR">Minor (Low Risk)</SelectItem>
                    <SelectItem value="MAJOR">Major (Moderate Risk)</SelectItem>
                    <SelectItem value="CRITICAL">Critical (High Risk)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2">
                  <MapPin size={12} /> Work Location
                </p>
                <Select 
                  value={formData.location} 
                  onValueChange={v => setFormData({...formData, location: v})}
                >
                  <SelectTrigger className="h-11 border-2 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FACTORY">Factory Floor</SelectItem>
                    <SelectItem value="SITE">On Site</SelectItem>
                    <SelectItem value="SUPPLIER">Supplier Premise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Audit Category</p>
                <Select 
                  value={formData.category} 
                  onValueChange={v => setFormData({...formData, category: v})}
                >
                  <SelectTrigger className="h-11 border-2 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QUALITY">Quality Control</SelectItem>
                    <SelectItem value="SAFETY">Health & Safety</SelectItem>
                    <SelectItem value="ENVIRONMENTAL">Environmental</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            
            <div className="bg-primary/5 border-t-2 border-primary/10 p-6 space-y-4">
              <Button type="submit" size="lg" className="w-full h-14 font-black text-lg shadow-xl shadow-primary/10 tracking-tight" disabled={loading}>
                {loading ? 'Processing...' : id ? 'Update Record' : 'Register Formal NCR'}
              </Button>
              <Button type="button" variant="ghost" className="w-full font-bold text-muted-foreground hover:text-foreground" onClick={() => navigate(-1)}>
                Discard Changes
              </Button>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default NcrFormPage;
