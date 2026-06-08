import { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Table from '../common/Table';
import ConfirmModal from '../common/ConfirmModal';
import {
  getAllUsers,
  getRegistrationRequests,
  createUser,
  deleteUser,
  updateUserRole,
  approveRegistrationRequest,
  rejectRegistrationRequest,
  getCurrentUser,
} from '../../services/api/adminUserService';

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

export default function UserManagementPanel({ probes }) {
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  const [editingUserId, setEditingUserId] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [userToRemove, setUserToRemove] = useState(null);

  // Add User State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ fullName: '', email: '', password: '', phoneNumber: '', address: '', requestedRole: 'RESIDENT', probeId: '', reason: 'Created by Admin' });

  // Approve Request State
  const [requestToApprove, setRequestToApprove] = useState(null);
  const [approveForm, setApproveForm] = useState({ probeId: '', verificationNotes: '' });

  // Modal States for Alerts and Confirms
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [successModalMessage, setSuccessModalMessage] = useState('');
  const [requestToReject, setRequestToReject] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, requestsData, currentUserData] = await Promise.all([
        getAllUsers(),
        getRegistrationRequests(),
        getCurrentUser()
      ]);
      setUsers(usersData);
      setRequests(requestsData);
      setCurrentUser(currentUserData);
    } catch (err) {
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRemoveUser = async () => {
    if (!userToRemove) return;
    try {
      await deleteUser(userToRemove.id);
      setUserToRemove(null);
      loadData();
      setSuccessModalMessage('User deleted successfully.');
    } catch (err) {
      setErrorModalMessage(err.message);
    }
  };

  const startEditRole = (user) => {
    setEditingUserId(user.id);
    setEditRole(user.role);
  };

  const saveRole = async (userId) => {
    try {
      await updateUserRole(userId, editRole);
      setEditingUserId(null);
      loadData();
    } catch (err) {
      setErrorModalMessage(err.message);
    }
  };

  const submitAddUser = async (e) => {
    e.preventDefault();
    try {
      await createUser(addForm);
      setShowAddModal(false);
      setAddForm({ fullName: '', email: '', password: '', phoneNumber: '', address: '', requestedRole: 'RESIDENT', probeId: '', reason: 'Created by Admin' });
      loadData();
      setSuccessModalMessage('User created successfully.');
    } catch (err) {
      setErrorModalMessage(err.message);
    }
  };

  const submitApprove = async (e) => {
    e.preventDefault();
    if (!requestToApprove) return;
    try {
      await approveRegistrationRequest(requestToApprove.id, approveForm.probeId, approveForm.verificationNotes);
      setRequestToApprove(null);
      setApproveForm({ probeId: '', verificationNotes: '' });
      loadData();
    } catch (err) {
      setErrorModalMessage(err.message);
    }
  };

  const confirmReject = async () => {
    if (!requestToReject) return;
    try {
      await rejectRegistrationRequest(requestToReject.id, 'Rejected by admin');
      setRequestToReject(null);
      loadData();
    } catch (err) {
      setErrorModalMessage(err.message);
    }
  };

  return (
    <div className="dashboard-stack">
      {error && <div style={{ color: 'red', padding: '1rem' }}>{error}</div>}
      
      {/* Pending Requests Table */}
      <Card className="user-management-card">
        <div className="panel-card__title-row">
          <div>
            <span className="section-label">Pending</span>
            <h2 className="panel-card__title">Registration Requests</h2>
          </div>
        </div>
        <Table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Requested Role</th>
              <th>Reason</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id}>
                <td>{req.userEmail}</td>
                <td>{req.requestedRole}</td>
                <td>{req.reason}</td>
                <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button variant="outline" onClick={() => setRequestToApprove(req)}>Approve</Button>
                    <Button variant="ghost" onClick={() => setRequestToReject(req)}>Reject</Button>
                  </div>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: 'center' }}>No pending requests.</td></tr>
            )}
          </tbody>
        </Table>
      </Card>

      {/* Active Users Table */}
      <Card className="user-management-card">
        <div className="panel-card__title-row">
          <div>
            <span className="section-label">User Management</span>
            <h2 className="panel-card__title">Registered Users</h2>
          </div>
          <Button title="Add User" onClick={() => setShowAddModal(true)}><PlusIcon /></Button>
        </div>

        <Table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.filter(u => u.registrationStatus === 'APPROVED').map((user) => (
              <tr key={user.id}>
                <td>{user.fullName}</td>
                <td>{user.email}</td>
                <td>
                  {editingUserId === user.id ? (
                    <select value={editRole} onChange={(e) => setEditRole(e.target.value)} style={{ padding: '0.25rem' }}>
                      <option value="ADMIN">Admin</option>
                      <option value="RESEARCHER">Researcher</option>
                      <option value="RESIDENT">Resident</option>
                    </select>
                  ) : (
                    <span>{user.role}</span>
                  )}
                </td>
                <td>
                  <span className={`status-pill status-pill--good`}>{user.registrationStatus}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {editingUserId === user.id ? (
                      <>
                        <Button variant="outline" onClick={() => saveRole(user.id)}>Save</Button>
                        <Button variant="ghost" onClick={() => setEditingUserId(null)}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" title="Edit Role" onClick={() => startEditRole(user)}><EditIcon /></Button>
                        {currentUser?.id !== user.id && (
                          <Button variant="ghost" title="Remove User" onClick={() => setUserToRemove(user)}><TrashIcon /></Button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.filter(u => u.registrationStatus === 'APPROVED').length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: 'center' }}>No active users found.</td></tr>
            )}
          </tbody>
        </Table>
      </Card>

      {/* Approve Request Modal */}
      {requestToApprove && (
        <div className="modal-overlay" onClick={() => setRequestToApprove(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Approve {requestToApprove.userEmail}</h2>
              <button className="modal-close" onClick={() => setRequestToApprove(null)}>&times;</button>
            </div>
            <form onSubmit={submitApprove}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {requestToApprove.requestedRole === 'RESIDENT' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label>Assign Probe (Required for Resident)</label>
                    <select required value={approveForm.probeId} onChange={e => setApproveForm({...approveForm, probeId: e.target.value})} style={{ padding: '0.5rem' }}>
                      <option value="">Select a probe...</option>
                      {probes.map(p => (
                        <option key={p.id} value={p.id}>{p.id}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label>Verification Notes</label>
                  <textarea value={approveForm.verificationNotes} onChange={e => setApproveForm({...approveForm, verificationNotes: e.target.value})} style={{ padding: '0.5rem' }} />
                </div>
              </div>
              <div className="modal-footer">
                <Button variant="outline" type="button" onClick={() => setRequestToApprove(null)}>Cancel</Button>
                <Button type="submit">Approve User</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New User</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            <form onSubmit={submitAddUser}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input required placeholder="Full Name" value={addForm.fullName} onChange={e => setAddForm({...addForm, fullName: e.target.value})} style={{ padding: '0.5rem' }} />
                <input required type="email" placeholder="Email" value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} style={{ padding: '0.5rem' }} />
                <input required type="password" placeholder="Password" value={addForm.password} onChange={e => setAddForm({...addForm, password: e.target.value})} minLength={8} style={{ padding: '0.5rem' }} />
                <input placeholder="Phone Number" value={addForm.phoneNumber} onChange={e => setAddForm({...addForm, phoneNumber: e.target.value})} style={{ padding: '0.5rem' }} />
                <input placeholder="Address" value={addForm.address} onChange={e => setAddForm({...addForm, address: e.target.value})} style={{ padding: '0.5rem' }} />
                <select value={addForm.requestedRole} onChange={e => setAddForm({...addForm, requestedRole: e.target.value})} style={{ padding: '0.5rem' }}>
                  <option value="RESIDENT">Resident</option>
                  <option value="RESEARCHER">Researcher</option>
                </select>
                {addForm.requestedRole === 'RESIDENT' && (
                  <select required value={addForm.probeId} onChange={e => setAddForm({...addForm, probeId: e.target.value})} style={{ padding: '0.5rem' }}>
                    <option value="">Select a probe...</option>
                    {probes.map(p => (
                      <option key={p.id} value={p.id}>{p.id}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="modal-footer">
                <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit">Create User</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!userToRemove}
        onClose={() => setUserToRemove(null)}
        onConfirm={handleRemoveUser}
        title="Remove User"
        message={`Are you sure you want to remove user ${userToRemove?.email}? This action cannot be undone.`}
        confirmText="Remove User"
        cancelText="Cancel"
        isDestructive={true}
      />

      <ConfirmModal
        isOpen={!!errorModalMessage}
        onClose={() => setErrorModalMessage('')}
        onConfirm={() => setErrorModalMessage('')}
        title="Error"
        message={errorModalMessage}
        confirmText="OK"
        cancelText="Close"
      />

      <ConfirmModal
        isOpen={!!successModalMessage}
        onClose={() => setSuccessModalMessage('')}
        onConfirm={() => setSuccessModalMessage('')}
        title="Success"
        message={successModalMessage}
        confirmText="OK"
        cancelText="Close"
      />

      <ConfirmModal
        isOpen={!!requestToReject}
        onClose={() => setRequestToReject(null)}
        onConfirm={confirmReject}
        title="Reject Request"
        message={`Are you sure you want to reject the registration request for ${requestToReject?.userEmail}?`}
        confirmText="Reject"
        cancelText="Cancel"
        isDestructive={true}
      />
    </div>
  );
}
