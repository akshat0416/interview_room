import { useState, useEffect, useRef } from 'react';
import { usersAPI } from '../services/api';
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

  const [adminProfileData, setAdminProfileData] = useState({ name: '', oldPassword: '', newPassword: '' });
  const [adminProfileMsg, setAdminProfileMsg] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const uName = localStorage.getItem('userName') || 'User';
      setUserName(uName);
      setAdminProfileData(prev => ({ ...prev, name: uName }));
    }
  }, []);

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
    };
    if (profileOpen || notifOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [profileOpen, notifOpen]);

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
          <button className={n.iconBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
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
