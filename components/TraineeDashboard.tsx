
import React, { useState, useEffect } from 'react';
import { AppData, User, ClassSession, AttendanceRecord, ActivityLog } from '../types';
import { Card, Button, Badge, Input, Modal, ImageUpload } from './Shared';

interface Props {
  data: AppData;
  currentUser: User;
  activeTab: string;
  onUpdateData: (newData: AppData) => void;
  setActiveTab: (tab: any) => void;
}

const TraineeDashboard: React.FC<Props> = ({ data, currentUser, activeTab, onUpdateData, setActiveTab }) => {
  const [purchaseConfirm, setPurchaseConfirm] = useState<any>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState('');

  const isBooked = (classId: string) => data.attendance.some(a => a.classId === classId && a.traineeId === currentUser.id);

  const canCancel = (classTime: string, classDate: string) => {
    const sessionDate = new Date(`${classDate}T${classTime}`);
    const now = new Date();
    const diffInMs = sessionDate.getTime() - now.getTime();
    const diffInMins = diffInMs / (1000 * 60);
    return diffInMins > 30;
  };

  const handleBooking = (session: ClassSession) => {
    if (currentUser.credits <= 0) {
      alert("Insufficient credits. Trainee must top up.");
      return;
    }
    const updatedUsers = data.users.map(u => u.id === currentUser.id ? { ...u, credits: u.credits - 1 } : u);
    const newRecord: AttendanceRecord = {
      id: `att${Date.now()}`, traineeId: currentUser.id, classId: session.id,
      status: 'BOOKED', method: 'SELF', timestamp: Date.now()
    };
    const log: ActivityLog = {
      id: `log${Date.now()}`, traineeId: currentUser.id, traineeName: currentUser.name,
      className: session.name, location: session.location, date: session.date,
      time: session.time, method: 'SELF', type: 'BOOKING', timestamp: Date.now()
    };
    onUpdateData({ ...data, users: updatedUsers, attendance: [...data.attendance, newRecord], activityLogs: [...data.activityLogs, log] });
  };

  const handleCancellation = (session: ClassSession) => {
    if (!canCancel(session.time, session.date)) {
      alert("Cancellation Locked (30m Rule).");
      return;
    }
    const existing = data.attendance.find(a => a.classId === session.id && a.traineeId === currentUser.id);
    if (!existing) return;
    const updatedUsers = data.users.map(u => u.id === currentUser.id ? { ...u, credits: u.credits + 1 } : u);
    const updatedAttendance = data.attendance.filter(a => a.id !== existing.id);
    const log: ActivityLog = {
      id: `log${Date.now()}`, traineeId: currentUser.id, traineeName: currentUser.name,
      className: session.name, location: session.location, date: session.date,
      time: session.time, method: 'SELF', type: 'CANCELLATION', timestamp: Date.now()
    };
    onUpdateData({ ...data, users: updatedUsers, attendance: updatedAttendance, activityLogs: [...data.activityLogs, log] });
  };

  const handleBuyPackage = (pkg: any) => {
    const updatedUsers = data.users.map(u => u.id === currentUser.id ? { ...u, credits: u.credits + pkg.credits } : u);
    const log: ActivityLog = {
      id: `log${Date.now()}`, traineeId: currentUser.id, traineeName: currentUser.name,
      className: `Package: ${pkg.name}`, location: 'Online Store', date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      method: 'SELF', type: 'PURCHASE', timestamp: Date.now(), amount: pkg.price
    };
    onUpdateData({ ...data, users: updatedUsers, activityLogs: [...data.activityLogs, log] });
    setPurchaseSuccess(`Added ${pkg.credits} credits to your account!`);
    setPurchaseConfirm(null);
    setTimeout(() => setPurchaseSuccess(''), 4000);
  };

  const filteredClasses = data.classes.filter(c => {
    const sessionDate = new Date(`${c.date}T${c.time}`);
    const now = new Date();
    return sessionDate.getTime() + (30 * 60 * 1000) > now.getTime();
  });

  if (activeTab === 'dashboard') {
    return (
      <div className="space-y-6 pb-24">
        <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl p-7 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg></div>
          <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Available Units</p>
          <div className="flex items-end justify-between">
            <h2 className="text-5xl font-black leading-none">{currentUser.credits}</h2>
            <button onClick={() => setActiveTab('wallet')} className="px-6 py-2.5 bg-white/20 text-white rounded-xl hover:bg-white/30 font-black text-[10px] tracking-widest uppercase transition-all backdrop-blur-sm border border-white/10">Top Up</button>
          </div>
        </div>
        <h3 className="text-xl font-black text-gray-900 px-1">Open Sessions</h3>
        <div className="space-y-4">
          {filteredClasses.length > 0 ? filteredClasses.map(c => {
            const booked = isBooked(c.id);
            return (
              <Card key={c.id} className="border-l-4 border-l-blue-600 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-gray-900 leading-tight">{c.name}</h4>
                    <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">{c.date} • {c.time}</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mt-1">📍 {c.location}</p>
                  </div>
                  {booked ? <Badge variant="green">Booked</Badge> : <Badge variant="blue">1 CREDIT</Badge>}
                </div>
                {booked ? (
                  <Button variant="danger" className="py-3 text-[10px] uppercase font-black tracking-widest" onClick={() => handleCancellation(c)} disabled={!canCancel(c.time, c.date)}>
                    {canCancel(c.time, c.date) ? 'Cancel Session' : 'Locked (30m Rule)'}
                  </Button>
                ) : (
                  <Button className="py-3 text-[10px] uppercase font-black tracking-widest" onClick={() => handleBooking(c)}>Book Program</Button>
                )}
              </Card>
            )
          }) : (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100"><p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Schedule Empty</p></div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'wallet') {
    return (
      <div className="space-y-6 pb-24">
        <h2 className="text-2xl font-black text-gray-900 px-1">Unit Wallet</h2>
        <Card className="bg-gray-50 border-none py-14 flex flex-col items-center shadow-inner relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600 opacity-20" />
          <p className="text-gray-400 font-black uppercase text-[10px] mb-3 tracking-[0.3em]">Live Balance</p>
          <h3 className="text-7xl font-black text-blue-600 leading-none">{currentUser.credits}</h3>
          <p className="text-blue-400 text-[10px] font-black mt-3 uppercase tracking-widest">CREDITS LOADED</p>
        </Card>
        {purchaseSuccess && <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-center animate-pulse">{purchaseSuccess}</div>}
        <h3 className="text-lg font-black text-gray-900 px-1 mt-8">Purchase Bundles</h3>
        <div className="grid grid-cols-1 gap-4">
          {data.packages.map(pkg => (
            <Card key={pkg.id} className="flex justify-between items-center py-5 px-6 active:scale-[0.98] transition-all cursor-pointer border-l-4 border-l-blue-600 hover:shadow-md">
              <div className="space-y-1">
                <p className="font-bold text-gray-900 leading-none text-sm">{pkg.name}</p>
                <p className="text-blue-600 font-black text-lg leading-tight">{pkg.credits} <span className="text-[9px] uppercase tracking-tighter">Units</span></p>
              </div>
              <button onClick={() => setPurchaseConfirm(pkg)} className="bg-blue-600 text-white px-7 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition-transform">${pkg.price}</button>
            </Card>
          ))}
        </div>
        <Modal isOpen={!!purchaseConfirm} onClose={() => setPurchaseConfirm(null)} title="Finalize Purchase">
          <div className="space-y-6 text-center">
            <p className="text-sm font-medium text-gray-600">You are about to add <span className="font-black text-blue-600">{purchaseConfirm?.credits} Credits</span> to your wallet for <span className="font-black text-gray-900">${purchaseConfirm?.price}</span>.</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setPurchaseConfirm(null)}>Cancel</Button>
              <Button onClick={() => handleBuyPackage(purchaseConfirm)}>Purchase Now</Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  if (activeTab === 'logs') {
    const myLogs = data.activityLogs.filter(l => l.traineeId === currentUser.id);
    return (
      <div className="space-y-4 pb-24">
        <h2 className="text-2xl font-black px-1">Activity History</h2>
        <div className="space-y-3">
          {[...myLogs].reverse().map(log => (
            <Card key={log.id} className="text-sm border-l-4 border-l-blue-100">
              <div className="flex justify-between items-start mb-2">
                <Badge variant={log.type === 'REFUND' || log.type === 'CANCELLATION' ? 'red' : 'green'}>{log.type}</Badge>
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{new Date(log.timestamp).toLocaleDateString()}</span>
              </div>
              <p className="font-black text-gray-900 text-base leading-tight">{log.className}</p>
              <div className="flex items-center gap-3 mt-1.5"><span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">📍 {log.location}</span><span className="text-[9px] text-blue-500 font-black uppercase tracking-widest">{log.date} @ {log.time}</span></div>
              <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center"><span className="text-[9px] text-gray-400 font-black uppercase tracking-tighter italic">Source: {log.method === 'SELF' ? 'Self' : 'Staff Marked'}</span><span className={`text-[10px] font-black uppercase tracking-widest ${log.type === 'BOOKING' || log.type === 'ATTENDANCE' ? 'text-red-500' : 'text-green-600'}`}>{log.type === 'BOOKING' || log.type === 'ATTENDANCE' ? '-1 Credit' : '+1 Credit'}</span></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === 'profile') {
    return (
      <TraineeProfileView user={currentUser} onUpdate={(u) => {
        const updatedUsers = data.users.map(usr => usr.id === u.id ? u : usr);
        onUpdateData({ ...data, users: updatedUsers });
      }} />
    );
  }
  return null;
};

const TraineeProfileView: React.FC<{ user: User, onUpdate: (u: User) => void }> = ({ user, onUpdate }) => {
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
    setSuccess('Member Registry Synchronized.');
    setEmailWarning(false);
    setTimeout(() => setSuccess(''), 3000);
  };
  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col items-center gap-4">
        <ImageUpload currentImage={image} onImageChange={setImage} />
        <div className="text-center">
          <h2 className="text-2xl font-black text-gray-900 leading-tight">{user.name}</h2>
          <Badge variant="green">Active Member</Badge>
        </div>
      </div>
      <Card className="space-y-5">
        <div className="p-5 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-100 text-center shadow-sm">
          <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Live Balance</p>
          <p className="text-3xl font-black text-blue-800">{user.credits} CREDITS</p>
        </div>
        <Input label="Display Name" value={name} onChange={e => setName(e.target.value)} />
        <Input label="Login Identity (Email)" value={email} onChange={e => setEmail(e.target.value)} />
        <Input label="Contact Line" value={phone} onChange={e => setPhone(e.target.value)} />
        <Input label="Access Passphrase" type="text" value={pass} onChange={e => setPass(e.target.value)} />
        {emailWarning && <p className="text-[10px] text-red-500 font-black uppercase tracking-widest bg-red-50 p-4 rounded-xl border border-red-100 leading-relaxed">Warning: Identity change detected. Login credentials will update. Click Save again to confirm.</p>}
        {success && <p className="text-[10px] text-green-600 font-black uppercase tracking-widest bg-green-50 p-4 rounded-xl border border-green-100">{success}</p>}
        <Button onClick={handleUpdate}>Synchronize Member Data</Button>
      </Card>
    </div>
  );
};
export default TraineeDashboard;
