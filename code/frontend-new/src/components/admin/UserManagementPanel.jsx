import { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Table from '../common/Table';

export default function UserManagementPanel({ users, setUsers }) {
  const [editingUserId, setEditingUserId] = useState(null);
  const [editRole, setEditRole] = useState('');

  const handleApprove = (email) => {
    setUsers(users.map((u) => (u.email === email ? { ...u, status: 'Enabled' } : u)));
  };

  const handleRemove = (email) => {
    if (window.confirm(`Are you sure you want to remove user ${email}?`)) {
      setUsers(users.filter((u) => u.email !== email));
    }
  };

  const startEditRole = (user) => {
    setEditingUserId(user.email);
    setEditRole(user.role);
  };

  const saveRole = (email) => {
    setUsers(users.map((u) => (u.email === email ? { ...u, role: editRole } : u)));
    setEditingUserId(null);
  };

  return (
    <div className="dashboard-stack">
      <Card className="user-management-card">
        <div className="panel-card__title-row">
          <div>
            <span className="section-label">User Management</span>
            <h2 className="panel-card__title">Registered Users & Approvals</h2>
          </div>
          <Button>Add User</Button>
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
            {users.map((user) => (
              <tr key={user.email}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  {editingUserId === user.email ? (
                    <select 
                      value={editRole} 
                      onChange={(e) => setEditRole(e.target.value)}
                      style={{ padding: '0.25rem' }}
                    >
                      <option value="admin">Admin</option>
                      <option value="researcher">Researcher</option>
                      <option value="resident">Resident</option>
                    </select>
                  ) : (
                    <span>{user.role}</span>
                  )}
                </td>
                <td>
                  <span className={`status-pill status-pill--${user.status === 'Enabled' ? 'good' : 'warn'}`}>
                    {user.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {editingUserId === user.email ? (
                      <>
                        <Button variant="outline" onClick={() => saveRole(user.email)}>Save</Button>
                        <Button variant="ghost" onClick={() => setEditingUserId(null)}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" onClick={() => startEditRole(user)}>Edit Role</Button>
                        {user.status === 'Pending' && (
                          <Button variant="outline" onClick={() => handleApprove(user.email)}>Approve</Button>
                        )}
                        <Button variant="ghost" onClick={() => handleRemove(user.email)}>Remove</Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center' }}>No users found.</td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
