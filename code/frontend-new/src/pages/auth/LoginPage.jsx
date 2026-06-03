import Card from '../../components/common/Card';
import { getRoleOptions } from '../../services/api/dashboardService';
import { useEffect, useState } from 'react';

const ROLE_OPTIONS_DEFAULT = [];

function useRoleOptions() {
  const [options, setOptions] = useState(ROLE_OPTIONS_DEFAULT);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getRoleOptions();
        if (!active) return;
        setOptions(Array.isArray(data) ? data : ROLE_OPTIONS_DEFAULT);
      } catch (e) {
        // keep default
      }
    })();
    return () => { active = false; };
  }, []);
  return options;
}
import Button from '../../components/common/Button';

export default function LoginPage({ onLogin }) {
  const ROLE_OPTIONS = useRoleOptions();
  return (
    <div className="login-page">
      <div className="login-page__hero">
        <span className="section-label">Landslide monitoring platform</span>
        <h1>Choose the role that matches your access level.</h1>
        <p>
          Residents see safety guidance, researchers analyze live and historical probe data, and admins manage the full system.
        </p>
      </div>

      <div className="login-role-grid">
        {ROLE_OPTIONS.map((role) => (
          <Card key={role.id} className="login-role-card">
            <span className="section-label">{role.id}</span>
            <h2>{role.title}</h2>
            <p>{role.description}</p>
            <Button onClick={() => onLogin(role.id)}>Continue as {role.title}</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}