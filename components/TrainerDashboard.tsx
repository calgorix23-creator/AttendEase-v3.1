
import React, { useState, useEffect } from 'react';
import { AppData, User, UserRole, ClassSession, AttendanceRecord, ActivityLog } from '../types';
import { Card, Button, Badge, Input, Modal, ImageUpload } from './Shared';

interface Props {
  data: AppData;
  currentUser: User;
  activeTab: string;
  onUpdateData: (newData: AppData) => void;
  setActiveTab: (tab: any) => void;
}

const TrainerDashboard: React.FC<Props> = ({ data, currentUser, activeTab, onUpdateData, setActiveTab }) => {
  const [isRosterOpen, setIsRosterOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassSession | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState('');
  
  const [classForm, setClassForm] = useState({ name: '', date: '', time: '', location: '', trainerId: currentUser.id });

  useEffect(() => {
    if (!isClassModalOpen) {
      setInlineError('');
    }
  }, [isClassModalOpen]);

  const getCreatorRole = (creatorId?: string) => {
    const creator = data.users.find(u => u.id === creatorId);
    return creator?.role || UserRole.ADMIN;
  };

  const toggleAttendance = (traineeId: string) => {
    if (!selectedClass) return;
    const trainee = data.users.find(u => u.id === traineeId);
    if (!trainee) return;
    const existing = data.attendance.find(a => a.classId === selectedClass.id && a.traineeId === traineeId);
    if (existing) {
      const updatedUsers = data.users.map(u => u.id === traineeId ? { ...u, credits: u.credits + 1 } : u);
      const updatedAttendance = data.attendance.filter(a => a.id !== existing.id);
      const log: ActivityLog = {
        id: `log${Date.now()}`, traineeId: trainee.id, traineeName: trainee.name,
        className: selectedClass.name, location: selectedClass.location,
        date: selectedClass.date, time: selectedClass.time,
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
        id: `att${Date.now()}`, traineeId, classId: selectedClass.id,
        status: 'ATTENDED', method: 'STAFF', timestamp: Date.now()
      };
      const log: ActivityLog = {
        id: `log${Date.now()}`, traineeId: trainee.id, traineeName: trainee.name,
        className: selectedClass.name, location: selectedClass.location,
        date: selectedClass.date, time: selectedClass.time,
        method: 'STAFF', type: 'ATTENDANCE', timestamp: Date.now()
      };
      onUpdateData({ ...data, users: updatedUsers, attendance: [...data.attendance, newRecord], activityLogs: [...data.activityLogs, log] });
    }
  };

  const openClassModal = (cls?: ClassSession) => {
    if (cls) {
      setEditingId(cls.id);
      setClassForm({ name: cls.name, date: cls.date, time: cls.time, location: cls.location, trainerId: cls.trainerId });
    } else {
      setEditingId(null);
      setClassForm({ name: '', date: new Date().toISOString().split('T')[0], time: '', location: '', trainerId: currentUser.id });
    }
    setIsClassModalOpen(true);
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
      setInlineError("Duplicate Class: This slot is already taken.");
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
    setIsClassModalOpen(false);
  };

  const handleDeleteClass = (id: string) => {
    if (confirm('Permanently delete your class session?')) {
      onUpdateData({ ...data, classes: data.classes.filter(c => c.id !== id) });
    }
  };

  if (activeTab === 'dashboard' || activeTab === 'schedule') {
    const myClasses = data.classes.filter(c => c.trainerId === currentUser.id || c.creatorId === currentUser.id);
    return (
      <div className="space-y-6 pb-24">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-2xl font-black text-gray-900 leading-tight">Assigned Roster</h2>
          <button onClick={() => openClassModal()} className="text-blue-600 text-[10px] font-black uppercase tracking-widest">+ New Class</button>
        </div>
        <div className="space-y-4">
          {myClasses.map(c => (
            <Card key={c.id} className="border-l-4 border-l-purple-500 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-gray-900 leading-tight">{c.name}</h3>
                    <Badge variant={getCreatorRole(c.creatorId) === UserRole.ADMIN ? 'red' : 'purple'}>
                      {getCreatorRole(c.creatorId)}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-purple-600 font-black uppercase tracking-widest">{c.date} @ {c.time}</p>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">📍 {c.location}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => { setSelectedClass(c); setIsRosterOpen(true); }}>Take Attendance</Button>
                {c.creatorId === currentUser.id && (
                  <>
                    <button onClick={() => openClassModal(c)} className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-blue-600 transition-all"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                    <button onClick={() => handleDeleteClass(c.id)} className="p-3 bg-red-50 rounded-xl text-red-400 hover:text-red-600 transition-all"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </>
                )}
              </div>
            </Card>
          ))}
          {myClasses.length === 0 && (
             <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200"><p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No Scheduled Assignments</p></div>
          )}
        </div>
        <Modal isOpen={isRosterOpen} onClose={() => setIsRosterOpen(false)} title={`Attendance: ${selectedClass?.name}`}>
          <div className="space-y-4">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest bg-gray-50 p-3 rounded-xl text-center">Tap absent/present to toggle credit deduction</p>
            {data.users.filter(u => u.role === UserRole.TRAINEE).map(t => {
              const isPresent = data.attendance.some(a => a.classId === selectedClass?.id && a.traineeId === t.id);
              return (
                <div key={t.id} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0 px-1">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0"><img src={t.profileImage || `https://picsum.photos/seed/${t.id}/100/100`} alt="" className="w-full h-full object-cover" /></div>
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
        <Modal isOpen={isClassModalOpen} onClose={() => setIsClassModalOpen(false)} title={editingId ? "Update Session" : "Schedule New Session"}>
          <div className="space-y-5">
            <Input label="Session Label" value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})} />
            <Input label="Event Date" type="date" value={classForm.date} onChange={e => setClassForm({...classForm, date: e.target.value})} />
            <Input label="Start Time" type="time" value={classForm.time} onChange={e => setClassForm({...classForm, time: e.target.value})} />
            <Input label="Studio/Room" value={classForm.location} onChange={e => setClassForm({...classForm, location: e.target.value})} />
            {inlineError && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest bg-red-50 p-3 rounded-xl border border-red-100">{inlineError}</p>}
            <Button onClick={handleSaveClass}>Confirm Program</Button>
          </div>
        </Modal>
      </div>
    );
  }

  if (activeTab === 'profile') {
    return (
      <TrainerProfileView user={currentUser} onUpdate={(u) => {
        const updatedUsers = data.users.map(usr => usr.id === u.id ? u : usr);
        onUpdateData({ ...data, users: updatedUsers });
      }} />
    );
  }
  return null;
};

const TrainerProfileView: React.FC<{ user: User, onUpdate: (u: User) => void }> = ({ user, onUpdate }) => {
  const [email, setEmail] = useState(user.email);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phoneNumber);
  const [pass, setPass] = useState(user.password);
  const [image, setImage] = useState(user.profileImage);
  const [emailWarning, setEmailWarning] = useState(false);
  const [success, setSuccess] = useState('');
  useEffect(() => { if (email === user.email) setEmailWarning(false); }, [email, user.email]);
  const handleUpdate = () => {
    if (email !== user.email && !emailWarning) { setEmailWarning(true); return; }
    onUpdate({ ...user, name, email, phoneNumber: phone, password: pass, profileImage: image });
    setSuccess('Trainer Registry Synchronized.');
    setEmailWarning(false);
    setTimeout(() => setSuccess(''), 3000);
  };
  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col items-center gap-4">
        <ImageUpload currentImage={image} onImageChange={setImage} />
        <div className="text-center">
          <h2 className="text-2xl font-black text-gray-900 leading-tight">{user.name}</h2>
          <Badge variant="purple">Lead Trainer</Badge>
        </div>
      </div>
      <Card className="space-y-5">
        <Input label="Registry Name" value={name} onChange={e => setName(e.target.value)} />
        <Input label="Direct Email" value={email} onChange={e => setEmail(e.target.value)} />
        <Input label="Contact #" value={phone} onChange={e => setPhone(e.target.value)} />
        <Input label="Access Key (Password)" type="text" value={pass} onChange={e => setPass(e.target.value)} />
        {emailWarning && <p className="text-[10px] text-red-500 font-black uppercase tracking-widest bg-red-50 p-4 rounded-xl border border-red-100 leading-relaxed">Warning: Email change affects identity. Click Save again.</p>}
        {success && <p className="text-[10px] text-green-600 font-black uppercase tracking-widest bg-green-50 p-4 rounded-xl border border-green-100">{success}</p>}
        <Button onClick={handleUpdate}>Synchronize Credentials</Button>
      </Card>
    </div>
  );
};
export default TrainerDashboard;
