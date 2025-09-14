
import React, { useEffect, useState } from 'react';

function msToMinutes(ms) {
  return Math.round(ms / 60000);
}

export default function App() {
  const [goal, setGoal] = useState(60);
  const [siteInput, setSiteInput] = useState('');
  const [trackedSites, setTrackedSites] = useState([]);
  const [todayData, setTodayData] = useState({});

  useEffect(() => {
    chrome.storage.local.get(['dailyGoal','trackedSites','trackedData'], (res) => {
      if (res.dailyGoal) setGoal(res.dailyGoal);
      if (res.trackedSites) setTrackedSites(res.trackedSites);
      if (res.trackedData) {
        const today = new Date().toISOString().slice(0,10);
        setTodayData(res.trackedData[today] || {});
      }
    });
  }, []);

  useEffect(() => {
    const listener = (changes, area) => {
      if (area === 'local' && changes.trackedData) {
        const today = new Date().toISOString().slice(0,10);
        setTodayData(changes.trackedData.newValue[today] || {});
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  function saveGoal() {
    chrome.storage.local.set({ dailyGoal: goal });
  }

  function addSite() {
    const domain = siteInput.trim().replace(/^https?:\/\//,'').replace(/\/.*$/,'');
    if (!domain) return;
    const normalized = domain.replace('www.','');
    if (!trackedSites.includes(normalized)) {
      const next = [...trackedSites, normalized];
      setTrackedSites(next);
      chrome.storage.local.set({ trackedSites: next });
    }
    setSiteInput('');
  }

  function removeSite(d) {
    const next = trackedSites.filter(s => s !== d);
    setTrackedSites(next);
    chrome.storage.local.set({ trackedSites: next });
  }

  return (
    <div style={{width:320,padding:16,fontFamily:'Inter,Arial'}}>
      <h2>Productivity Tracker</h2>

      <div style={{marginBottom:12}}>
        <label>Daily goal (minutes)</label>
        <div style={{display:'flex',gap:8,marginTop:6}}>
          <input type="number" value={goal} onChange={e=>setGoal(Number(e.target.value))} style={{flex:1,padding:8}} />
          <button onClick={saveGoal}>Save</button>
        </div>
      </div>

      <div style={{marginBottom:12}}>
        <label>Add site to track</label>
        <div style={{display:'flex',gap:8,marginTop:6}}>
          <input value={siteInput} onChange={e=>setSiteInput(e.target.value)} placeholder="example.com" style={{flex:1,padding:8}} />
          <button onClick={addSite}>Add</button>
        </div>
        <div style={{marginTop:8}}>
          {trackedSites.map(s=>(
            <div key={s} style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
              <span>{s}</span>
              <button onClick={()=>removeSite(s)}>Remove</button>
            </div>
          ))}
        </div>
      </div>

      <h3>Today's activity</h3>
      {Object.keys(todayData).length===0 && <p>No tracked activity yet.</p>}
      {Object.entries(todayData).map(([domain, ms])=>(
        <div key={domain} style={{display:'flex',justifyContent:'space-between'}}>
          <span>{domain}</span>
          <span>{msToMinutes(ms)} min</span>
        </div>
      ))}
    </div>
  );
}
