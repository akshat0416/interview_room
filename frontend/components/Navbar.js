import { useState, useEffect, useRef } from 'react';
import { usersAPI, settingsAPI } from '../services/api';
import { useRouter } from 'next/router';
import BrandLockup, { BrandLogo } from './BrandLockup';
import n from '../styles/navbar.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Navbar({ role, currentPage, onPageChange, profileData, onProfileSave, onResumeUpload, onPhotoUpload, profileMsg, notifications = [], onNotificationsOpened }) {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const panelRef = useRef(null);

  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

  const [candidateSettings, setCandidateSettings] = useState({
    camera: 'default',
    microphone: 'default',
    showWarnings: true,
    showOverlay: false,
    darkMode: false,
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    passwordMsg: ''
  });

  const [adminSettings, setAdminSettings] = useState({
    phoneDetect: true,
    multiFaceDetect: true,
    noFaceDetect: true,
    warningLimit: 3,
    warningCooldown: 5,
    defaultDuration: 30,
    difficulty: 'Medium',
    autoTerminate: true,
    enableLogs: false,
    showScores: false,
    showBoxes: false,
    sessionTimeout: 60
  });

  const [adminProfileData, setAdminProfileData] = useState({ name: '', oldPassword: '', newPassword: '' });
  const [adminProfileMsg, setAdminProfileMsg] = useState('');
  const [adminSettingsMsg, setAdminSettingsMsg] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const uName = localStorage.getItem('userName') || 'User';
      setUserName(uName);
      setAdminProfileData(prev => ({ ...prev, name: uName }));

      const fetchAdminConfig = async () => {
        try {
          const res = await settingsAPI.get();
          if (res.data) setAdminSettings(res.data);
        } catch (e) {
          console.error("Failed to load global settings", e);
        }
      };
      if (role === 'admin') fetchAdminConfig();
    }
  }, [role]);

  const handleAdminSettingsSave = async () => {
    setAdminSettingsMsg('Saving parameter configuration...');
    try {
      const res = await settingsAPI.update(adminSettings);
      if (res.data.settings) {
        setAdminSettingsMsg('Configuration updated successfully!');
        setAdminSettings(res.data.settings);
      } else {
        setAdminSettingsMsg('Configuration update failed.');
      }
    } catch (e) {
      setAdminSettingsMsg('Failed to update configuration.');
    }
    setTimeout(() => setAdminSettingsMsg(''), 4000);
  };

  const handleCandidatePasswordChange = async () => {
    if (!candidateSettings.oldPassword || !candidateSettings.newPassword || !candidateSettings.confirmPassword) {
      setCandidateSettings(prev => ({ ...prev, passwordMsg: 'All fields are required.' }));
      return;
    }
    if (candidateSettings.newPassword !== candidateSettings.confirmPassword) {
      setCandidateSettings(prev => ({ ...prev, passwordMsg: 'New passwords do not match.' }));
      return;
    }
    setCandidateSettings(prev => ({ ...prev, passwordMsg: 'Updating...' }));
    try {
      const formData = new FormData();
      formData.append('user_id', localStorage.getItem('userId'));
      formData.append('old_password', candidateSettings.oldPassword);
      formData.append('new_password', candidateSettings.newPassword);

      const res = await usersAPI.updatePassword(formData);
      if (res.data.error) {
        setCandidateSettings(prev => ({ ...prev, passwordMsg: res.data.error }));
      } else {
        setCandidateSettings(prev => ({
          ...prev,
          passwordMsg: 'Password updated successfully!',
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }
    } catch (err) {
      setCandidateSettings(prev => ({ ...prev, passwordMsg: 'Failed to update password.' }));
    }
  };

  const handleAdminSave = async () => {
    setAdminProfileMsg('Saving...');
    try {
      const formData = new FormData();
      formData.append('user_id', localStorage.getItem('userId'));
      if (adminProfileData.name) formData.append('new_name', adminProfileData.name);
      if (adminProfileData.oldPassword) formData.append('old_password', adminProfileData.oldPassword);
      if (adminProfileData.newPassword) formData.append('new_password', adminProfileData.newPassword);

      const res = await usersAPI.updateAdmin(formData);
      if (res.data.error) {
        setAdminProfileMsg(res.data.error);
      } else {
        setAdminProfileMsg('Profile updated successfully!');
        if (res.data.user && res.data.user.name) {
          localStorage.setItem('userName', res.data.user.name);
          setUserName(res.data.user.name);
        }
        setAdminProfileData(prev => ({ ...prev, oldPassword: '', newPassword: '' }));
      }
    } catch (err) {
      setAdminProfileMsg('Failed to update profile.');
    }
  };

  // Close panels on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    };
    if (profileOpen || notifOpen || settingsOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [profileOpen, notifOpen, settingsOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    router.push('/login');
  };

  const topNavItems = role === 'admin'
    ? ['Dashboard', 'Interviews', 'Candidates', 'Analytics']
    : ['Dashboard', 'Interviews', 'Results'];

  const sidebarItems = role === 'admin'
    ? [
      { key: 'overview', label: 'Overview', icon: 'home' },
      { key: 'roles', label: 'Roles', icon: 'briefcase' },
      { key: 'applications', label: 'Applications', icon: 'inbox' },
      { key: 'interviews', label: 'Interview Cards', icon: 'video' },
      { key: 'candidates', label: 'Candidates', icon: 'users' },
      { key: 'qa', label: 'Q&A Panel', icon: 'message' },
      { key: 'progress', label: 'Progress', icon: 'chart' },
    ]
    : [
      { key: 'roles', label: 'Available Roles', icon: 'search' },
      { key: 'interviews', label: 'My Interviews', icon: 'video' },
      { key: 'progress', label: 'My Progress', icon: 'chart' },
    ];

  const getIcon = (icon) => {
    const icons = {
      home: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      briefcase: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
      inbox: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
          <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </svg>
      ),
      search: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
      video: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
      monitor: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
      users: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      message: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      chart: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
      settings: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    };
    return icons[icon] || null;
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <header className={n.topbar}>
        <div className={n.topbarLeft}>
          <BrandLockup className={n.logoArea} theme="dark" size="sm" />
        </div>
        <div className={n.topbarRight}>
          <div className={n.notifWrap} ref={notifRef}>
            <button className={n.iconBtn} onClick={() => {
              const wasOpen = notifOpen;
              setNotifOpen(!notifOpen);
              if (!wasOpen && onNotificationsOpened) {
                onNotificationsOpened();
              }
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {(() => { const unreadCount = notifications.filter(notif => !notif.is_read).length; return unreadCount > 0 ? <span className={n.bellBadge}>{unreadCount > 99 ? '99+' : unreadCount}</span> : null; })()}
            </button>
            {notifOpen && (
              <div className={n.notifPanel}>
                <div className={n.notifHeader}>
                  <h3 className={n.notifTitle}>Notifications</h3>
                </div>
                <div className={n.notifBody}>
                  {notifications.length === 0 ? (
                    <p className={n.notifEmpty}>No new notifications.</p>
                  ) : (
                    notifications.map((notif, idx) => (
                      <div className={n.notifItem} key={notif.id || idx}>
                        <div className={n.notifDot}></div>
                        <p className={n.notifText}>{notif.message || notif}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <div className={n.profileWrap} ref={settingsRef}>
            <button className={n.iconBtn} onClick={() => {
              const wasOpen = settingsOpen;
              setSettingsOpen(!settingsOpen);
              if (!wasOpen) { setProfileOpen(false); setNotifOpen(false); }
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            {settingsOpen && (
              <div className={n.profilePanel} style={{ width: '400px', cursor: 'default' }}>
                <div className={n.ppHeader}>
                  <h3 className={n.ppTitle}>Settings</h3>
                  <button className={n.ppClose} onClick={() => setSettingsOpen(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
                <div className={n.ppBody} style={{ padding: '20px 24px', position: 'relative' }}>
                  {role === 'candidate' ? (
                    <>
                      <div className={n.ppField}>
                        <label className={n.ppLabel} style={{ fontSize: '13px', color: '#0A2540' }}>Interview Setup</label>
                      </div>
                      <div className={n.ppField}>
                        <label className={n.ppLabel} style={{ fontWeight: 'normal', marginTop: '-4px' }}>Camera</label>
                        <select className={n.ppInput} value={candidateSettings.camera} onChange={e => setCandidateSettings({ ...candidateSettings, camera: e.target.value })}>
                          <option value="default">Default Camera</option>
                        </select>
                      </div>
                      <div className={n.ppField}>
                        <label className={n.ppLabel} style={{ fontWeight: 'normal', marginTop: '-4px' }}>Microphone</label>
                        <select className={n.ppInput} value={candidateSettings.microphone} onChange={e => setCandidateSettings({ ...candidateSettings, microphone: e.target.value })}>
                          <option value="default">Default Microphone</option>
                        </select>
                      </div>
                      <div className={n.ppField}>
                        <button className={n.ppResumeBtn} style={{ marginTop: '4px' }}>Test Audio Output</button>
                      </div>
                      <div className={n.ppDivider} style={{ margin: '14px 0' }}></div>
                      
                      <div className={n.ppField}>
                        <label className={n.ppLabel} style={{ fontSize: '13px', color: '#0A2540' }}>AI Preferences</label>
                      </div>
                      <div className={n.ppField} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                        <span style={{ fontSize: '13px', color: '#1F2937' }}>Show real-time warnings</span>
                        <input type="checkbox" checked={candidateSettings.showWarnings} onChange={e => setCandidateSettings({ ...candidateSettings, showWarnings: e.target.checked })} style={{ accentColor: '#00A3E0', width: '16px', height: '16px' }} />
                      </div>
                      <div className={n.ppField} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#1F2937' }}>Show detection overlay</span>
                        <input type="checkbox" checked={candidateSettings.showOverlay} onChange={e => setCandidateSettings({ ...candidateSettings, showOverlay: e.target.checked })} style={{ accentColor: '#00A3E0', width: '16px', height: '16px' }} />
                      </div>
                      <div className={n.ppDivider} style={{ margin: '14px 0' }}></div>

                      <div className={n.ppField}>
                        <label className={n.ppLabel} style={{ fontSize: '13px', color: '#0A2540' }}>Appearance</label>
                      </div>
                      <div className={n.ppField} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                        <span style={{ fontSize: '13px', color: '#1F2937' }}>Dark Mode</span>
                        <input type="checkbox" checked={candidateSettings.darkMode} onChange={e => setCandidateSettings({ ...candidateSettings, darkMode: e.target.checked })} style={{ accentColor: '#00A3E0', width: '16px', height: '16px' }} />
                      </div>
                      <div className={n.ppDivider} style={{ margin: '14px 0' }}></div>

                      <div className={n.ppField}>
                        <label className={n.ppLabel} style={{ fontSize: '13px', color: '#0A2540' }}>Security</label>
                      </div>
                      <div className={n.ppField} style={{ marginTop: '2px', display: 'flex', flexDirection: 'column' }}>
                        <input className={n.ppInput} type="password" placeholder="Previous Password" value={candidateSettings.oldPassword} onChange={e => setCandidateSettings({ ...candidateSettings, oldPassword: e.target.value, passwordMsg: '' })} style={{ marginBottom: '8px' }} />
                        <input className={n.ppInput} type="password" placeholder="New Password" value={candidateSettings.newPassword} onChange={e => setCandidateSettings({ ...candidateSettings, newPassword: e.target.value, passwordMsg: '' })} style={{ marginBottom: '8px' }} />
                        <input className={n.ppInput} type="password" placeholder="Confirm Password" value={candidateSettings.confirmPassword} onChange={e => setCandidateSettings({ ...candidateSettings, confirmPassword: e.target.value, passwordMsg: '' })} />
                        <button className={n.ppSaveBtn} style={{ marginTop: '8px' }} onClick={handleCandidatePasswordChange}>Change Password</button>
                        {candidateSettings.passwordMsg && <p style={{ fontSize: '12px', color: candidateSettings.passwordMsg.includes('success') ? '#10B981' : '#EF4444', marginTop: '8px', textAlign: 'center' }}>{candidateSettings.passwordMsg}</p>}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={n.ppField}>
                        <label className={n.ppLabel} style={{ fontSize: '13px', color: '#0A2540' }}>AI Proctoring Control</label>
                      </div>
                      <div className={n.ppField} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                        <span style={{ fontSize: '13px', color: '#1F2937' }}>Phone Detection</span>
                        <input type="checkbox" checked={adminSettings.phoneDetect} onChange={e => setAdminSettings({ ...adminSettings, phoneDetect: e.target.checked })} style={{ accentColor: '#00A3E0', width: '16px', height: '16px' }} />
                      </div>
                      <div className={n.ppField} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#1F2937' }}>Multiple Faces Detection</span>
                        <input type="checkbox" checked={adminSettings.multiFaceDetect} onChange={e => setAdminSettings({ ...adminSettings, multiFaceDetect: e.target.checked })} style={{ accentColor: '#00A3E0', width: '16px', height: '16px' }} />
                      </div>
                      <div className={n.ppField} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#1F2937' }}>No Face Detection</span>
                        <input type="checkbox" checked={adminSettings.noFaceDetect} onChange={e => setAdminSettings({ ...adminSettings, noFaceDetect: e.target.checked })} style={{ accentColor: '#00A3E0', width: '16px', height: '16px' }} />
                      </div>

                      <div className={n.ppField} style={{ marginTop: '8px' }}>
                        <label className={n.ppLabel} style={{ fontWeight: 'normal' }}>Warning Limit</label>
                        <input className={n.ppInput} type="number" min="1" value={adminSettings.warningLimit} onChange={e => setAdminSettings({ ...adminSettings, warningLimit: Number(e.target.value) })} />
                      </div>
                      <div className={n.ppField}>
                        <label className={n.ppLabel} style={{ fontWeight: 'normal' }}>Warning Cooldown (s)</label>
                        <input className={n.ppInput} type="number" min="1" value={adminSettings.warningCooldown} onChange={e => setAdminSettings({ ...adminSettings, warningCooldown: Number(e.target.value) })} />
                      </div>
                      <div className={n.ppDivider} style={{ margin: '14px 0' }}></div>

                      <div className={n.ppField}>
                        <label className={n.ppLabel} style={{ fontSize: '13px', color: '#0A2540' }}>Interview Control</label>
                      </div>
                      <div className={n.ppField} style={{ marginTop: '2px' }}>
                        <label className={n.ppLabel} style={{ fontWeight: 'normal' }}>Default Duration (mins)</label>
                        <input className={n.ppInput} type="number" min="5" value={adminSettings.defaultDuration} onChange={e => setAdminSettings({ ...adminSettings, defaultDuration: Number(e.target.value) })} />
                      </div>
                      <div className={n.ppField}>
                        <label className={n.ppLabel} style={{ fontWeight: 'normal' }}>Difficulty Level</label>
                        <select className={n.ppInput} value={adminSettings.difficulty} onChange={e => setAdminSettings({ ...adminSettings, difficulty: e.target.value })}>
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>
                      <div className={n.ppField} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                        <span style={{ fontSize: '13px', color: '#1F2937' }}>Auto-terminate Interview</span>
                        <input type="checkbox" checked={adminSettings.autoTerminate} onChange={e => setAdminSettings({ ...adminSettings, autoTerminate: e.target.checked })} style={{ accentColor: '#00A3E0', width: '16px', height: '16px' }} />
                      </div>
                      <div className={n.ppDivider} style={{ margin: '14px 0' }}></div>

                      <div className={n.ppField}>
                        <label className={n.ppLabel} style={{ fontSize: '13px', color: '#0A2540' }}>Advanced / Debug</label>
                      </div>
                      <div className={n.ppField} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                        <span style={{ fontSize: '13px', color: '#1F2937' }}>Enable Detection Logs</span>
                        <input type="checkbox" checked={adminSettings.enableLogs} onChange={e => setAdminSettings({ ...adminSettings, enableLogs: e.target.checked })} style={{ accentColor: '#00A3E0', width: '16px', height: '16px' }} />
                      </div>
                      <div className={n.ppField} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#1F2937' }}>Show Confidence Scores</span>
                        <input type="checkbox" checked={adminSettings.showScores} onChange={e => setAdminSettings({ ...adminSettings, showScores: e.target.checked })} style={{ accentColor: '#00A3E0', width: '16px', height: '16px' }} />
                      </div>
                      <div className={n.ppField} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#1F2937' }}>Show Bounding Boxes</span>
                        <input type="checkbox" checked={adminSettings.showBoxes} onChange={e => setAdminSettings({ ...adminSettings, showBoxes: e.target.checked })} style={{ accentColor: '#00A3E0', width: '16px', height: '16px' }} />
                      </div>
                      <div className={n.ppDivider} style={{ margin: '14px 0' }}></div>

                      <div className={n.ppField}>
                        <label className={n.ppLabel} style={{ fontSize: '13px', color: '#0A2540' }}>Security</label>
                      </div>
                      <div className={n.ppField} style={{ marginTop: '2px' }}>
                        <label className={n.ppLabel} style={{ fontWeight: 'normal' }}>Session Timeout (mins)</label>
                        <input className={n.ppInput} type="number" min="1" value={adminSettings.sessionTimeout} onChange={e => setAdminSettings({ ...adminSettings, sessionTimeout: Number(e.target.value) })} />
                      </div>
                      <div className={n.ppField}>
                        <button className={n.ppSaveBtn} style={{ marginTop: '12px' }} onClick={handleAdminSettingsSave}>Save Configuration</button>
                        {adminSettingsMsg && <p style={{ fontSize: '12px', color: adminSettingsMsg.includes('success') ? '#10B981' : '#EF4444', marginTop: '8px', textAlign: 'center' }}>{adminSettingsMsg}</p>}
                        <button className={n.ppSignOut} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #EF4444', justifyContent: 'center', marginTop: '12px' }}>Force Logout Users</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className={n.profileWrap} ref={panelRef}>
            <button className={n.profileBtn} onClick={() => setProfileOpen(!profileOpen)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>{role === 'admin' ? 'Admin' : 'Profile'}</span>
            </button>
            {profileOpen && (
              <div className={n.profilePanel}>
                {role === 'candidate' && profileData && onProfileSave ? (
                  <>
                    <div className={n.ppHeader}>
                      <h3 className={n.ppTitle}>My Profile</h3>
                      <button className={n.ppClose} onClick={() => setProfileOpen(false)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>
                    <div className={n.ppBody}>
                      <div className={n.ppPhotoRow}>
                        <div className={n.ppPhotoWrap} onClick={() => document.getElementById('ppPhotoInput')?.click()}>
                          {profileData.profile_picture ? (
                            <img className={n.ppPhotoImg} src={`${API_URL}${profileData.profile_picture}`} alt="Profile" />
                          ) : (
                            <div className={n.ppPhotoPlaceholder}>
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            </div>
                          )}
                          <span className={n.ppPhotoLabel}>Change</span>
                        </div>
                        <input id="ppPhotoInput" type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => { if (onPhotoUpload) onPhotoUpload(e); }} />
                      </div>
                      <div className={n.ppField}>
                        <label className={n.ppLabel}>Full Name</label>
                        <input className={n.ppInput} type="text" value={profileData.full_name} onChange={(e) => onProfileSave('full_name', e.target.value)} placeholder="Enter your full name" />
                      </div>
                      <div className={n.ppField}>
                        <label className={n.ppLabel}>Email</label>
                        <input className={n.ppInput} type="email" value={profileData.email} onChange={(e) => onProfileSave('email', e.target.value)} placeholder="Enter your email" />
                      </div>
                      <div className={n.ppField}>
                        <label className={n.ppLabel}>Mobile Number</label>
                        <input className={n.ppInput} type="tel" value={profileData.mobile} onChange={(e) => onProfileSave('mobile', e.target.value)} placeholder="Enter mobile number" />
                      </div>
                      <div className={n.ppField}>
                        <label className={n.ppLabel}>Location</label>
                        <input className={n.ppInput} type="text" value={profileData.location || ''} onChange={(e) => onProfileSave('location', e.target.value)} placeholder="e.g. San Francisco, CA" />
                      </div>
                      <div className={n.ppField}>
                        <label className={n.ppLabel}>Experience</label>
                        <input className={n.ppInput} type="text" value={profileData.experience || ''} onChange={(e) => onProfileSave('experience', e.target.value)} placeholder="e.g. 5+ years in full-stack" />
                      </div>
                      <div className={n.ppField}>
                        <label className={n.ppLabel}>Education</label>
                        <input className={n.ppInput} type="text" value={profileData.education || ''} onChange={(e) => onProfileSave('education', e.target.value)} placeholder="e.g. MS Computer Science, Stanford" />
                      </div>
                      <div className={n.ppField}>
                        <label className={n.ppLabel}>Availability</label>
                        <select className={n.ppInput} value={profileData.availability || ''} onChange={(e) => onProfileSave('availability', e.target.value)}>
                          <option value="">Select availability</option>
                          <option value="Remote">Remote</option>
                          <option value="In Office">In Office</option>
                          <option value="Both (Remote + In Office)">Both (Remote + In Office)</option>
                        </select>
                      </div>
                      <div className={n.ppField}>
                        <label className={n.ppLabel}>LinkedIn URL</label>
                        <input className={n.ppInput} type="url" value={profileData.linkedin_url || ''} onChange={(e) => onProfileSave('linkedin_url', e.target.value)} placeholder="https://linkedin.com/..." />
                      </div>
                      <div className={n.ppField}>
                        <label className={n.ppLabel}>GitHub URL</label>
                        <input className={n.ppInput} type="url" value={profileData.github_url || ''} onChange={(e) => onProfileSave('github_url', e.target.value)} placeholder="https://github.com/..." />
                      </div>
                      <div className={n.ppField}>
                        <label className={n.ppLabel}>Role Applied For</label>
                        <input className={n.ppInput} type="text" value={profileData.role_applied || ''} onChange={(e) => onProfileSave('role_applied', e.target.value)} placeholder="e.g. Senior Software Engineer" />
                      </div>
                      <div className={n.ppField}>
                        <label className={n.ppLabel}>Key Skills (comma-separated)</label>
                        <input className={n.ppInput} type="text" value={profileData._skillsInput || ''} onChange={(e) => onProfileSave('_skillsInput', e.target.value)} placeholder="e.g. React, Node.js, Python" />
                      </div>
                      <div className={n.ppField}>
                        <label className={n.ppLabel}>Resume (PDF only)</label>
                        <div className={n.ppResumeRow}>
                          <button className={n.ppResumeBtn} onClick={() => document.getElementById('ppResumeInput')?.click()}>Upload Resume</button>
                          {profileData.resume_url && (
                            <a className={n.ppResumeLink} href={`${API_URL}${profileData.resume_url}`} target="_blank" rel="noopener noreferrer">View</a>
                          )}
                        </div>
                        <input id="ppResumeInput" type="file" style={{ display: 'none' }} accept=".pdf" onChange={(e) => { if (onResumeUpload) onResumeUpload(e); }} />
                      </div>
                      <button className={n.ppSaveBtn} onClick={() => onProfileSave('_save')}>Save Profile</button>
                      {profileMsg && <p className={n.ppMsg}>{profileMsg}</p>}
                    </div>
                    <div className={n.ppDivider}></div>
                  </>
                ) : null}

                {role === 'admin' ? (
                  <>
                    <div className={n.ppHeader}>
                      <h3 className={n.ppTitle}>Admin Settings</h3>
                      <button className={n.ppClose} onClick={() => setProfileOpen(false)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>
                    <div className={n.ppBody}>
                      <div className={n.ppField}>
                        <label className={n.ppLabel}>Admin Name</label>
                        <input className={n.ppInput} type="text" value={adminProfileData.name} onChange={(e) => setAdminProfileData({ ...adminProfileData, name: e.target.value })} placeholder="Enter name" />
                      </div>
                      <div className={n.ppField}>
                        <label className={n.ppLabel}>Old Password (to verify)</label>
                        <input className={n.ppInput} type="password" value={adminProfileData.oldPassword} onChange={(e) => setAdminProfileData({ ...adminProfileData, oldPassword: e.target.value })} placeholder="Enter old password" />
                      </div>
                      <div className={n.ppField}>
                        <label className={n.ppLabel}>New Password</label>
                        <input className={n.ppInput} type="password" value={adminProfileData.newPassword} onChange={(e) => setAdminProfileData({ ...adminProfileData, newPassword: e.target.value })} placeholder="Enter new password" />
                      </div>
                      <button className={n.ppSaveBtn} onClick={handleAdminSave}>Save Changes</button>
                      {adminProfileMsg && <p className={n.ppMsg}>{adminProfileMsg}</p>}
                    </div>
                    <div className={n.ppDivider}></div>
                  </>
                ) : null}

                <button className={n.ppSignOut} onClick={handleLogout}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={n.sidebar}>
        <nav className={n.sidebarNav}>
          {sidebarItems.map((item) => (
            <a
              key={item.key}
              className={currentPage === item.key ? n.sidebarLinkActive : n.sidebarLink}
              onClick={() => {
                if (onPageChange) {
                  onPageChange(item.key);
                }
              }}
            >
              <span className={n.sidebarIcon}>{getIcon(item.icon)}</span>
              <span className={n.sidebarText}>{item.label}</span>
            </a>
          ))}
        </nav>
        <div className={n.sidebarFooter}>
          <div className={n.sidebarUserCard}>
            <div className={n.sidebarUserAvatar}>
              <BrandLogo size="avatar" />
            </div>
            <div className={n.sidebarUserInfo}>
              <span className={n.sidebarUserName}>Blue Planet InfoSolutions</span>
              <span className={n.sidebarUserRole}>{role === 'admin' ? 'Admin' : 'Candidate'}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
