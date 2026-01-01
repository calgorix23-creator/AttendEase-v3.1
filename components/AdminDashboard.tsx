
import React, { useState, useEffect } from 'react';
/* Added CreditPackage to the import list from types */
import { AppData, User, UserRole, ClassSession, AttendanceRecord, ActivityLog, CreditPackage } from '../types';
import { Card, Button, Badge, Input, Modal, ImageUpload } from './Shared';
import { api } from '../services/api';

interface Props {
  data: AppData;
  currentUser: User;
  activeTab: string;
  onUpdateData: (newData: AppData) => void;
  setActiveTab: (tab: any) => void;
}

const AdminDashboard: React.FC<Props> = ({ data, currentUser, activeTab, onUpdateData, setActiveTab }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'USER' | 'CLASS' | 'PACKAGE' | 'ROSTER'>('USER');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState('');
  const [emailWarning, setEmailWarning] = useState(false);
  const [selectedClassForRoster, setSelectedClassForRoster] = useState<ClassSession | null>(null);
  
  // Form States
  const [userForm, setUserForm] = useState({ 
    name: '', email: '', phone: '', role: UserRole.TRAINEE, 
    password: '', profileImage: '', credits: 0 
  });
  const [classForm, setClassForm] = useState({ name: '', date: '', time: '', location: '', trainerId: '' });
  const [packageForm, setPackageForm] = useState({ name: '', credits: 0, price: 0 });

  useEffect(() => {
    if (!isModalOpen) {
      setInlineError('');
      setEmailWarning(false);
    }
  }, [isModalOpen]);

  // Statistics Calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const stats = {
    trainees: data.users.filter(u => u.role === UserRole.TRAINEE).length,
    sessionsToday: data.classes.filter(c => c.date === todayStr).length,
    checkIn: data.attendance.length,
    revenue: data.activityLogs
      .filter(l => l.type === 'PURCHASE')
      .reduce((sum, log) => sum + (log.amount || 0), 0)
  };

  const getCreatorRole = (creatorId?: string) => {
    const creator = data.users.find(u => u.id === creatorId);
    return creator?.role || UserRole.ADMIN;
  };

  // --- MODAL TRIGGERS ---
  const openUserModal = (user?: User) => {
    if (user) {
      setEditingId(user.id);
      setUserForm({ 
        name: user.name, 
        email: user.email, 
        phone: user.phoneNumber, 
        role: user.role, 
        password: user.password,
        profileImage: user.profileImage || '',
        credits: user.credits || 0
      });
    } else {
      setEditingId(null);
      setUserForm({ 
        name: '', email: '', phone: '', role: UserRole.TRAINEE, 
        password: api.generateRandomPassword(), 
        profileImage: '', 
        credits: 0 
      });
    }
    setModalType('USER');
    setIsModalOpen(true);
  };

  const openClassModal = (cls?: ClassSession) => {
    if (cls) {
      setEditingId(cls.id);
      setClassForm({ name: cls.name, date: cls.date, time: cls.time, location: cls.location, trainerId: cls.trainerId });
    } else {
      setEditingId(null);
      setClassForm({ name: '', date: todayStr, time: '', location: '', trainerId: '' });
    }
    setModalType('CLASS');
    setIsModalOpen(true);
  };

  const openPackageModal = (pkg?: CreditPackage) => {
    if (pkg) {
      setEditingId(pkg.id);
      setPackageForm({ name: pkg.name, credits: pkg.credits, price: pkg.price });
    } else {
      setEditingId(null);
      setPackageForm({ name: '', credits: 0, price: 0 });
    }
    setModalType('PACKAGE');
    setIsModalOpen(true);
  };

  const openRosterModal = (cls: ClassSession) => {
    setSelectedClassForRoster(cls);
    setModalType('ROSTER');
    setIsModalOpen(true);
  };

  // --- SAVE HANDLERS ---
  const handleSaveUser = () => {
    if (!userForm.name.trim() || !userForm.email.trim() || !userForm.phone.trim()) {
      setInlineError("Name, Email, and Phone are required.");
      return;
    }
    const originalUser = editingId ? data.users.find(u => u.id === editingId) : null;
    if (originalUser && originalUser.email !== userForm.email && !emailWarning) {
      setEmailWarning(true);
      return;
    }
    if (editingId) {
      const updatedUsers = data.users.map(u => u.id === editingId ? { ...u, ...userForm, phoneNumber: userForm.phone } : u);
      onUpdateData({ ...data, users: updatedUsers });
    } else {
      const newUser: User = { ...userForm, id: `u${Date.now()}`, phoneNumber: userForm.phone };
      onUpdateData({ ...data, users: [...data.users, newUser] });
    }
    setIsModalOpen(false);
  };

  const handleSaveClass = () => {
    const trimmedName = classForm.name.trim().toLowerCase();
    const isDuplicate = data.classes.some(c => 
      c.id !== editingId && 
      c.name.trim().toLowerCase() === trimmedName && 
      c.date === classForm.date && 
      c.time === classForm.time
    );
    if (isDuplicate) {
      setInlineError("Duplicate Class: Same Name, Date, and Time already exists.");
      return;
    }
    if (!classForm.name.trim() || !classForm.date || !classForm.time || !classForm.location.trim()) {
      setInlineError("All fields are mandatory.");
      return;
    }
    if (editingId) {
      const updatedClasses = data.classes.map(c => c.id === editingId ? { ...c, ...classForm } : c);
      onUpdateData({ ...data, classes: updatedClasses });
    } else {
      const newClass: ClassSession = { ...classForm, id: `c${Date.now()}`, creatorId: currentUser.id };
      onUpdateData({ ...data, classes: [...data.classes, newClass] });
    }
    setIsModalOpen(false);
  };

  const handleSavePackage = () => {
    if (!packageForm.name.trim() || packageForm.credits < 0 || packageForm.price < 0) {
      setInlineError("Invalid package details.");
      return;
    }
    if (editingId) {
      const updatedPackages = data.packages.map(p => p.id === editingId ? { ...p, ...packageForm } : p);
      onUpdateData({ ...data, packages: updatedPackages });
    } else {
      const newPkg: CreditPackage = { ...packageForm, id: `p${Date.now()}` };
      onUpdateData({ ...data, packages: [...data.packages, newPkg] });
    }
    setIsModalOpen(false);
  };

  const toggleAttendance = (traineeId: string) => {
    if (!selectedClassForRoster) return;
    const trainee = data.users.find(u => u.id === traineeId);
    if (!trainee) return;
    const existing = data.attendance.find(a => a.classId === selectedClassForRoster.id && a.traineeId === traineeId);
    if (existing) {
      const updatedUsers = data.users.map(u => u.id === traineeId ? { ...u, credits: u.credits + 1 } : u);
      const updatedAttendance = data.attendance.filter(a => a.id !== existing.id);
      const log: ActivityLog = {
        id: `log${Date.now()}`, traineeId: trainee.id, traineeName: trainee.name,
        className: selectedClassForRoster.name, location: selectedClassForRoster.location,
        date: selectedClassForRoster.date, time: selectedClassForRoster.time,
        method: 'STAFF', type: 'REFUND', timestamp: Date.now()
      };
      onUpdateData({ ...data, users: updatedUsers, attendance: updatedAttendance, activityLogs: [...data.activityLogs, log] });
    } else {
      if (trainee.credits <= 0) {
        alert("Insufficient credits. Trainee must top up.");
        return;
      }
      const updatedUsers = data.users.map(u => u.id === traineeId ? { ...u, credits: u.credits - 1 } : u);
      const newRecord: AttendanceRecord = {
        id: `att${Date.now()}`, traineeId, classId: selectedClassForRoster.id,
        status: 'ATTENDED', method: 'STAFF', timestamp: Date.now()
      };
      const log: ActivityLog = {
        id: `log${Date.now()}`, traineeId: trainee.id, traineeName: trainee.name,
        className: selectedClassForRoster.name, location: selectedClassForRoster.location,
        date: selectedClassForRoster.date, time: selectedClassForRoster.time,
        method: 'STAFF', type: 'ATTENDANCE', timestamp: Date.now()
      };
      onUpdateData({ ...data, users: updatedUsers, attendance: [...data.attendance, newRecord], activityLogs: [...data.activityLogs, log] });
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-gray-900">Admin Panel</h2>
          <div className="grid grid-cols-2 gap-4">
            <Card className="flex flex-col gap-1 border-l-4 border-l-blue-600 shadow-sm">
              <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Revenue (SGD)</span>
              <span className="text-2xl font-black text-gray-900">${stats.revenue}</span>
            </Card>
            <Card className="flex flex-col gap-1 border-l-4 border-l-purple-600 shadow-sm">
              <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Trainees</span>
              <span className="text-2xl font-black text-gray-900">{stats.trainees}</span>
            </Card>
            <Card className="flex flex-col gap-1 border-l-4 border-l-green-600 shadow-sm">
              <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Sessions Today</span>
              <span className="text-2xl font-black text-gray-900">{stats.sessionsToday}</span>
            </Card>
            <Card className="flex flex-col gap-1 border-l-4 border-l-orange-600 shadow-sm">
              <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Check-in</span>
              <span className="text-2xl font-black text-gray-900">{stats.checkIn}</span>
            </Card>
          </div>
          <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-none shadow-xl">
            <h3 className="text-lg font-black mb-4">Command Center</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => openUserModal()} className="bg-white/10 hover:bg-white/20 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 border border-white/10">+ Trainee</button>
              <button onClick={() => openClassModal()} className="bg-white/10 hover:bg-white/20 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 border border-white/10">+ Session</button>
              <button onClick={() => openPackageModal()} className="bg-white/10 hover:bg-white/20 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 border border-white/10">+ Package</button>
              <button onClick={() => setActiveTab('logs')} className="bg-white/10 hover:bg-white/20 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 border border-white/10">Logs Feed</button>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xl font-black text-gray-900">User Registry</h2>
            <button onClick={() => openUserModal()} className="text-blue-600 text-xs font-black uppercase tracking-widest">+ New User</button>
          </div>
          <div className="space-y-3">
            {data.users.map(u => (
              <Card key={u.id} className="flex justify-between items-center border-l-4 border-l-blue-500">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                    <img src={u.profileImage || `https://picsum.photos/seed/${u.id}/100/100`} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 text-sm leading-none">{u.name}</p>
                      <Badge variant={u.role === UserRole.TRAINEE ? 'blue' : u.role === UserRole.TRAINER ? 'purple' : 'red'}>{u.role}</Badge>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{u.phoneNumber}</p>
                    {u.role === UserRole.TRAINEE && <p className="text-[10px] font-black text-blue-600 uppercase">Credits: {u.credits}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openUserModal(u)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => { if(confirm('Delete user?')) onUpdateData({...data, users: data.users.filter(usr => usr.id !== u.id)}) }} className="p-2 text-red-400 hover:text-red-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xl font-black text-gray-900">Program Schedule</h2>
            <button onClick={() => openClassModal()} className="text-blue-600 text-xs font-black uppercase tracking-widest">+ New Session</button>
          </div>
          <div className="space-y-3">
            {data.classes.map(c => (
              <Card key={c.id}>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 leading-tight">{c.name}</h3>
                      <Badge variant={getCreatorRole(c.creatorId) === UserRole.ADMIN ? 'red' : 'purple'}>
                        {getCreatorRole(c.creatorId)}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">{c.date} • {c.time}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">📍 {c.location}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openRosterModal(c)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    </button>
                    <button onClick={() => openClassModal(c)} className="p-2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button onClick={() => { if(confirm('Delete class?')) onUpdateData({...data, classes: data.classes.filter(cl => cl.id !== c.id)}) }} className="p-2 text-red-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-8 flex justify-between items-center px-1">
            <h2 className="text-xl font-black text-gray-900">Credit Packages</h2>
            <button onClick={() => openPackageModal()} className="text-purple-600 text-xs font-black uppercase tracking-widest">+ New Bundle</button>
          </div>
          <div className="space-y-3">
            {data.packages.map(p => (
              <Card key={p.id} className="border-l-4 border-l-purple-500">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h4 className="font-bold text-gray-900 text-sm leading-none">{p.name}</h4>
                    <p className="text-[10px] text-purple-600 font-black uppercase tracking-widest">{p.credits} Credits • ${p.price}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openPackageModal(p)} className="p-2 text-gray-400 hover:text-blue-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                    <button onClick={() => { if(confirm('Delete package?')) onUpdateData({...data, packages: data.packages.filter(pk => pk.id !== p.id)}) }} className="p-2 text-red-400 hover:text-red-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-4">
          <h2 className="text-xl font-black text-gray-900 px-1">Global Activity Feed</h2>
          <div className="space-y-3">
            {[...data.activityLogs].reverse().map(log => (
              <Card key={log.id} className="text-sm border-l-4 border-l-gray-300">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={log.method === 'STAFF' ? 'red' : 'blue'}>
                    {log.method === 'STAFF' ? 'STAFF' : 'SELF'}
                  </Badge>
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-gray-900 leading-tight">{log.traineeName}</p>
                  <p className="text-[11px] text-gray-500 font-medium">{log.type} : <span className="font-bold text-gray-700">{log.className}</span></p>
                  <div className="pt-2 mt-2 border-t border-gray-50 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider">📍 {log.location}</span>
                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider">📅 {log.date} @ {log.time}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <AdminProfileView user={currentUser} onUpdate={(u) => {
          const updatedUsers = data.users.map(usr => usr.id === u.id ? u : usr);
          onUpdateData({ ...data, users: updatedUsers });
        }} />
      )}

      {/* --- MODALS MOVED TO ROOT OF ADMIN DASHBOARD TO FIX COMMAND CENTER BUG --- */}
      <Modal isOpen={isModalOpen && modalType === 'USER'} onClose={() => setIsModalOpen(false)} title={editingId ? "Update User" : "Add User"}>
        <div className="space-y-5">
          <ImageUpload currentImage={userForm.profileImage} onImageChange={img => setUserForm({...userForm, profileImage: img})} />
          <Input label="Name Label" placeholder="Full Name" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
          <Input label="Email Label" type="email" placeholder="Email Address" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
          <Input label="Phone Label" placeholder="Contact Number" value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})} />
          <Input label="Access Key (Password)" type="text" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
          {userForm.role === UserRole.TRAINEE && <Input label="Wallet Credits" type="number" value={userForm.credits} onChange={e => setUserForm({...userForm, credits: parseInt(e.target.value) || 0})} />}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Access Level</label>
            <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-medium" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})}>
              <option value={UserRole.TRAINEE}>Trainee</option>
              <option value={UserRole.TRAINER}>Trainer</option>
              <option value={UserRole.ADMIN}>Admin</option>
            </select>
          </div>
          {emailWarning && <p className="text-[10px] text-red-500 font-black uppercase tracking-widest bg-red-50 p-4 rounded-xl border border-red-100">Confirm Email Identity Update (Login Change). Click Save again.</p>}
          {inlineError && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest bg-red-50 p-3 rounded-xl border border-red-100">{inlineError}</p>}
          <Button onClick={handleSaveUser}>{editingId ? 'Save Record' : 'Create User'}</Button>
        </div>
      </Modal>

      <Modal isOpen={isModalOpen && modalType === 'CLASS'} onClose={() => setIsModalOpen(false)} title={editingId ? "Modify Session" : "Schedule Entry"}>
        <div className="space-y-5">
          <Input label="Session Name" value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})} />
          <Input label="Event Date" type="date" value={classForm.date} onChange={e => setClassForm({...classForm, date: e.target.value})} />
          <Input label="Start Time" type="time" value={classForm.time} onChange={e => setClassForm({...classForm, time: e.target.value})} />
          <Input label="Studio/Room" value={classForm.location} onChange={e => setClassForm({...classForm, location: e.target.value})} />
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Assign Trainer</label>
            <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-medium" value={classForm.trainerId} onChange={e => setClassForm({...classForm, trainerId: e.target.value})}>
              <option value="">(Unassigned)</option>
              {data.users.filter(u => u.role === UserRole.TRAINER).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          {inlineError && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest bg-red-50 p-3 rounded-xl border border-red-100">{inlineError}</p>}
          <Button onClick={handleSaveClass}>Confirm Entry</Button>
        </div>
      </Modal>

      <Modal isOpen={isModalOpen && modalType === 'PACKAGE'} onClose={() => setIsModalOpen(false)} title="Package Bundling">
        <div className="space-y-5">
          <Input label="Bundle Label" value={packageForm.name} onChange={e => setPackageForm({...packageForm, name: e.target.value})} />
          <Input label="Unit Count" type="number" value={packageForm.credits} onChange={e => setPackageForm({...packageForm, credits: parseInt(e.target.value) || 0})} />
          <Input label="Price Point" type="number" value={packageForm.price} onChange={e => setPackageForm({...packageForm, price: parseInt(e.target.value) || 0})} />
          {inlineError && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest bg-red-50 p-3 rounded-xl border border-red-100">{inlineError}</p>}
          <Button onClick={handleSavePackage}>Store Bundle</Button>
        </div>
      </Modal>

      <Modal isOpen={isModalOpen && modalType === 'ROSTER'} onClose={() => setIsModalOpen(false)} title={`Attendance: ${selectedClassForRoster?.name}`}>
        <div className="space-y-4">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest bg-gray-50 p-3 rounded-xl text-center">Admin Access: Manual Marking</p>
          {data.users.filter(u => u.role === UserRole.TRAINEE).map(t => {
            const isPresent = data.attendance.some(a => a.classId === selectedClassForRoster?.id && a.traineeId === t.id);
            return (
              <div key={t.id} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0 px-1">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                    <img src={t.profileImage || `https://picsum.photos/seed/${t.id}/100/100`} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 leading-none text-sm">{t.name}</p>
                    <p className="text-[9px] text-blue-600 font-black mt-1 uppercase tracking-widest">{t.credits} Available</p>
                  </div>
                </div>
                <button onClick={() => toggleAttendance(t.id)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm border ${isPresent ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'}`}>{isPresent ? 'Present' : 'Absent'}</button>
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};

const AdminProfileView: React.FC<{ user: User, onUpdate: (u: User) => void }> = ({ user, onUpdate }) => {
  const [email, setEmail] = useState(user.email);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phoneNumber);
  const [pass, setPass] = useState(user.password);
  const [image, setImage] = useState(user.profileImage);
  const [emailWarning, setEmailWarning] = useState(false);
  const [success, setSuccess] = useState('');

  const handleUpdate = () => {
    if (email !== user.email && !emailWarning) {
      setEmailWarning(true);
      return;
    }
    onUpdate({ ...user, name, email, phoneNumber: phone, password: pass, profileImage: image });
    setSuccess('Registry updated successfully.');
    setEmailWarning(false);
    setTimeout(() => setSuccess(''), 3000);
  };

  useEffect(() => {
    if (email === user.email) setEmailWarning(false);
  }, [email, user.email]);

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col items-center gap-4">
        <ImageUpload currentImage={image} onImageChange={setImage} />
        <div className="text-center">
          <h2 className="text-2xl font-black text-gray-900 leading-tight">{user.name}</h2>
          <Badge variant="purple">Root Administrator</Badge>
        </div>
      </div>
      <Card className="space-y-5">
        <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} />
        <Input label="Registry Email" value={email} onChange={e => setEmail(e.target.value)} />
        <Input label="Direct Line" value={phone} onChange={e => setPhone(e.target.value)} />
        <Input label="Registry Passkey" type="text" value={pass} onChange={e => setPass(e.target.value)} />
        {emailWarning && <p className="text-[10px] text-red-500 font-black uppercase tracking-widest bg-red-50 p-4 rounded-xl border border-red-100 leading-relaxed">Warning: Identity change impacts login. Click Save again.</p>}
        {success && <p className="text-[10px] text-green-600 font-black uppercase tracking-widest bg-green-50 p-4 rounded-xl border border-green-100">{success}</p>}
        <Button onClick={handleUpdate}>Synchronize Admin Data</Button>
      </Card>
    </div>
  );
};

export default AdminDashboard;
