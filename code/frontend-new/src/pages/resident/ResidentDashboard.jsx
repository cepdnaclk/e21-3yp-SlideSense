import { useMemo, useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Tabs from '../../components/common/Tabs';
import LogoutButton from '../../components/common/LogoutButton';
import RoleLayout from '../../layouts/RoleLayout';
import HistoricalLineChart from '../../components/dashboard/HistoricalLineChart';
import { useProbeNetwork } from '../../shared/hooks/useProbeNetwork';
import { normalizeRiskLevel } from '../../shared/utils/riskUtils';


import { getResidentDashboardData } from '../../services/api/dashboardService';
import { residentTranslations } from './residentTranslations';

const DEFAULT_TABS = [];

function getSnapshot(probes, highRiskProbes, t) {
  const riskScore = highRiskProbes.length > 0 ? 'high' : probes.some((probe) => normalizeRiskLevel(probe.riskLevel) === 'medium') ? 'medium' : 'low';
  const latestTimestamp = probes.reduce((latest, probe) => (probe.lastUpdated > latest ? probe.lastUpdated : latest), '');
  const rainfall = Math.round(probes.reduce((sum, probe) => sum + Number(probe.metrics?.rainfall ?? 0), 0) / Math.max(probes.length, 1));
  const moisture = Math.round(probes.reduce((sum, probe) => sum + Number(probe.metrics?.moisture ?? 0), 0) / Math.max(probes.length, 1));
  const vibration = Math.round(Math.max(...probes.map((probe) => Number(probe.metrics?.vibration ?? 0)), 0));

  return {
    riskScore,
    latestTimestamp: latestTimestamp || t.waitingForUpdates,
    rainfall,
    moisture,
    vibration,
    explanation: riskScore === 'high'
      ? t.explanationHigh
      : riskScore === 'medium'
        ? t.explanationMedium
        : t.explanationLow,
  };
}

function AlertIcon({ kind }) {
  return <span className={`weather-icon weather-icon--${kind}`} aria-hidden="true" />;
}

export default function ResidentDashboard({ onLogout }) {
  const { probes, highRiskProbes, isLoadingLiveData, loadError } = useProbeNetwork();
  const [tabs, setTabs] = useState(DEFAULT_TABS);
  const [activeTab, setActiveTab] = useState('overview');
  const [language, setLanguage] = useState('en');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const t = residentTranslations[language];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const cfg = await getResidentDashboardData();
        if (!active) return;
        
        const translatedTabs = (cfg.tabs ?? DEFAULT_TABS).map(tab => {
          if (tab.id === 'overview') return { ...tab, label: t.currentSituationOverview };
          if (tab.id === 'safety') return { ...tab, label: t.safetyTips };
          return tab;
        });

        setTabs(translatedTabs);
        setActiveTab(translatedTabs?.[0]?.id ?? 'overview');
      } catch (e) {
        // keep defaults
      }
    })();
    return () => { active = false; };
  }, [language, t]);

  const snapshot = useMemo(() => getSnapshot(probes, highRiskProbes, t), [probes, highRiskProbes, t]);
  const activeAlerts = useMemo(
    () => highRiskProbes.slice(0, 4).map((probe, index) => ({
      id: probe.id,
      severity: index === 0 ? t.riskHigh : t.riskMedium,
      time: probe.lastUpdated,
      location: `Monitoring sector ${probe.id}`,
    })),
    [highRiskProbes, t],
  );

  const statusTone = snapshot.riskScore === 'high' ? t.riskHigh : snapshot.riskScore === 'medium' ? t.riskMedium : t.riskLow;

  const topActions = (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      {isMobile ? (
        <select 
          className="language-select-mobile" 
          value={language} 
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="en">EN</option>
          <option value="si">SI</option>
          <option value="ta">TA</option>
        </select>
      ) : (
        <div className="language-segmented-control">
          <button 
            className={`language-btn ${language === 'en' ? 'language-btn--active' : ''}`} 
            onClick={() => setLanguage('en')}
          >
            EN
          </button>
          <button 
            className={`language-btn ${language === 'si' ? 'language-btn--active' : ''}`} 
            onClick={() => setLanguage('si')}
          >
            SI
          </button>
          <button 
            className={`language-btn ${language === 'ta' ? 'language-btn--active' : ''}`} 
            onClick={() => setLanguage('ta')}
          >
            TA
          </button>
        </div>
      )}
      <LogoutButton onLogout={onLogout} label={t.logOut} />
    </div>
  );

  const overviewContent = (
    <section className="dashboard-stack">
      <Card className={`priority-card priority-card--${snapshot.riskScore}`}>
        <span className="section-label">{t.currentSituationOverview}</span>
        <div className="priority-card__row">
          <div>
            <h2>{t.riskLevel} {snapshot.riskScore === 'high' ? t.riskHigh : snapshot.riskScore === 'medium' ? t.riskMedium : t.riskLow}</h2>
            <p>{snapshot.explanation}</p>
          </div>
          <div className="priority-card__status">{t.lastUpdated} {snapshot.latestTimestamp}</div>
        </div>
      </Card>

      <div className="card-grid card-grid--three resident-metrics-grid">
        <Card className="info-card">
          <span className="section-label">{t.rainfallStatus}</span>
          <div className="info-card__headline">
            <AlertIcon kind={snapshot.rainfall > 65 ? 'heavy' : snapshot.rainfall > 25 ? 'light' : 'clear'} />
            <strong>{snapshot.rainfall} {t.mm}</strong>
          </div>
          <div className="status-bar"><span style={{ width: `${Math.min(snapshot.rainfall, 100)}%` }} /></div>
          <p>{snapshot.rainfall > 65 ? t.heavyRain : snapshot.rainfall > 25 ? t.lightRain : t.sunnyOrDryConditions}</p>
        </Card>

        <Card className="info-card">
          <span className="section-label">{t.soilMoisture}</span>
          <div className="info-card__headline"><strong>{snapshot.moisture}{t.moisturePercent}</strong></div>
          <div className="status-bar"><span style={{ width: `${Math.min(snapshot.moisture, 100)}%` }} /></div>
          <p>{snapshot.moisture > 70 ? t.highMoistureWarning : snapshot.moisture > 45 ? t.moderateMoistureWarning : t.lowMoistureWarning}</p>
        </Card>

        <Card className="info-card">
          <span className="section-label">{t.systemAlertStatus}</span>
          <div className="info-card__headline"><strong>{highRiskProbes.length > 0 ? t.active : t.none}</strong></div>
          <p>{highRiskProbes.length > 0 ? `${highRiskProbes.length} ${t.alertsNeedAttention}` : t.noActiveGeneralAlerts}</p>
          <div className="trend-indicator">
            <span className={`trend-indicator__arrow trend-indicator__arrow--${snapshot.vibration > 60 ? 'up' : 'stable'}`}>{snapshot.vibration > 60 ? '↑' : '→'}</span>
            <span>{snapshot.vibration > 60 ? t.risingActivity : t.stableActivity}</span>
          </div>
        </Card>
      </div>

      <Card className="alerts-card">
        <div className="panel-card__title-row">
          <div>
            <span className="section-label">{t.alerts}</span>
            <h2 className="panel-card__title">{t.activeAlerts}</h2>
          </div>
        </div>
        <div className="resident-alert-list">
          {activeAlerts.length === 0 ? (
            <p className="empty-state">{t.noActiveAlertsAtTheMoment}</p>
          ) : activeAlerts.map((alert) => (
            <article key={alert.id} className="resident-alert-row">
              <div>
                <strong>{alert.id}</strong>
                <p>{alert.location}</p>
              </div>
              <div>
                <span>{alert.severity}</span>
                <small>{alert.time}</small>
              </div>
            </article>
          ))}
        </div>
      </Card>

      {probes.map(probe => (
        <Card key={`history-${probe.id}`} className="history-card">
          <div className="panel-card__title-row">
            <div>
              <span className="section-label">{t.historicalTrends}</span>
              <h2 className="panel-card__title">{t.recentDataFor} {probe.id}</h2>
            </div>
          </div>
          <HistoricalLineChart probe={probe} />
        </Card>
      ))}
    </section>
  );

  const safetyContent = (
    <section className="dashboard-stack dashboard-stack--safety">
      <div className="card-grid card-grid--two resident-safety-grid">
        <Card className="guidance-card">
          <span className="section-label">{t.emergencyInstructions}</span>
          <h2>{t.actionsByRiskLevel}</h2>
          <ul>
            <li><strong>{t.moderate}</strong> {t.moderateAction}</li>
            <li><strong>{t.high}</strong> {t.highAction}</li>
            <li><strong>{t.critical}</strong> {t.criticalAction}</li>
          </ul>
        </Card>

        <Card className="guidance-card">
          <span className="section-label">{t.emergencyContacts}</span>
          <h2>{t.whoToCall}</h2>
          <p>{t.disasterManagementCenter}</p>
          <p>{t.localEmergencyAuthority}</p>
          <a className="button button--primary guidance-card__call" href="tel:117">{t.callEmergencyHotline}</a>
        </Card>
      </div>

      <div className="card-grid card-grid--two resident-safety-grid">
        <Card className="guidance-card">
          <span className="section-label">{t.evacuationGuide}</span>
          <h2>{t.howToEvacuateSafely}</h2>
          <ol>
            <li>{t.evac1}</li>
            <li>{t.evac2}</li>
            <li>{t.evac3}</li>
          </ol>
          <p><strong>{t.do}</strong> {t.doAction}</p>
          <p><strong>{t.doNot}</strong> {t.doNotAction}</p>
        </Card>

        <Card className="guidance-card">
          <span className="section-label">{t.safetyTips}</span>
          <h2>{t.watchForWarningSigns}</h2>
          <ul>
            <li>{t.sign1}</li>
            <li>{t.sign2}</li>
            <li>{t.sign3}</li>
            <li>{t.sign4}</li>
          </ul>
          <p>{t.safetyAdvice}</p>
        </Card>
      </div>
    </section>
  );

  return (
    <RoleLayout
      eyebrow={null}
      title={<span className="resident-main-brand">SlideSense</span>}
      status={isLoadingLiveData ? t.loadingLiveConditions : loadError || null}
      actions={topActions}
      sidebar={
        !isMobile ? (
          <Tabs 
            tabs={tabs} 
            activeTabId={activeTab} 
            onChange={setActiveTab} 
            ariaLabel="Resident dashboard tabs"
            variant="vertical"
            hideDescriptions={true}
          />
        ) : null
      }
    >
      <main className="role-dashboard role-dashboard--resident" style={{ paddingBottom: isMobile ? '80px' : '0' }}>
        
        {isMobile ? (
          <>
            {overviewContent}
            <div style={{ padding: '2rem 0', margin: '1rem 0' }}>
              <hr style={{ borderTop: '2px dashed var(--border)', opacity: 0.5 }} />
            </div>
            {safetyContent}
          </>
        ) : (
          activeTab === 'overview' ? overviewContent : safetyContent
        )}

        {isMobile && (
          <a href="tel:117" className="floating-call-btn" aria-label="Call Emergency Hotline">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          </a>
        )}
      </main>
    </RoleLayout>
  );
}