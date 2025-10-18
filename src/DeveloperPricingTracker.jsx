import React, { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, Plus, Trash2, ChevronDown, ChevronRight, Home, Calculator, Save, Edit2, LogOut } from "lucide-react";

export default function DeveloperPricingTracker({ currentUser = "user", onLogout }) {
  const [currentPage, setCurrentPage] = useState("home");
  const [exchangeRate, setExchangeRate] = useState(0.92);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [savedCalculations, setSavedCalculations] = useState([]);
  const [currentCalculation, setCurrentCalculation] = useState(null);
  const [calculationName, setCalculationName] = useState("");
  const [projects, setProjects] = useState([{
    id: 1,
    name: "", clientName: "", startDate: "", endDate: "", status: "active", notes: "",
    expanded: true,
    developers: [{ id: 1, name: "", buyingPriceUSD: 0, sellingPriceEUR: 0, workingDays: 0 }]
  }]);

  useEffect(() => {
    fetch("/.netlify/functions/loadData")
      .then(r => r.json())
      .then(arr => Array.isArray(arr) ? setSavedCalculations(arr) : setSavedCalculations([]))
      .catch(() => setSavedCalculations([]));
  }, []);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
        const data = await res.json();
        if (data?.rates?.EUR) {
          setExchangeRate(data.rates.EUR);
          setLastUpdate(new Date().toLocaleString());
        }
      } catch {
        setLastUpdate("Using default rate");
      }
    };
    fetchRate();
    const id = setInterval(fetchRate, 60000);
    return () => clearInterval(id);
  }, []);

  const calculateMetrics = (buyingUSD, sellingEUR, workingDays) => {
    const buyingEUR = buyingUSD * exchangeRate;
    const monthlyBuyEUR = buyingEUR * workingDays;
    const earningsPerDay = sellingEUR - buyingEUR;
    const monthlyEarnings = earningsPerDay * workingDays;
    const commissions = [monthlyEarnings * 0.30, monthlyEarnings * 0.30, monthlyEarnings * 0.30, monthlyEarnings * 0.10];
    return { buyingEUR, monthlyBuyEUR, earningsPerDay, monthlyEarnings, commissions, total: commissions.reduce((a,b)=>a+b,0) };
  };

  const calculateProjectTotals = (project) => {
    return project.developers.reduce((acc, dev) => {
      const m = calculateMetrics(dev.buyingPriceUSD, dev.sellingPriceEUR, dev.workingDays);
      return {
        monthlyBuy: acc.monthlyBuy + m.monthlyBuyEUR,
        monthlyEarnings: acc.monthlyEarnings + m.monthlyEarnings,
        totalCommissions: acc.totalCommissions + m.total,
      };
    }, { monthlyBuy:0, monthlyEarnings:0, totalCommissions:0 });
  };

  const calculateGrandTotals = (list) => list.reduce((acc, p) => {
    const t = calculateProjectTotals(p);
    return { monthlyBuy: acc.monthlyBuy + t.monthlyBuy, monthlyEarnings: acc.monthlyEarnings + t.monthlyEarnings, totalCommissions: acc.totalCommissions + t.totalCommissions };
  }, { monthlyBuy:0, monthlyEarnings:0, totalCommissions:0 });

  const grandTotals = useMemo(() => calculateGrandTotals(projects), [projects, exchangeRate]);

  const persistAll = async (arr) => {
    await fetch("/.netlify/functions/saveData", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(arr),
    });
    setSavedCalculations(arr);
  };

  const newCalculation = () => {
    setProjects([{
      id: 1, name: "", clientName: "", startDate: "", endDate: "", status: "active", notes: "", expanded: true,
      developers: [{ id: 1, name: "", buyingPriceUSD: 0, sellingPriceEUR: 0, workingDays: 0 }]
    }]);
    setCurrentCalculation(null);
    setCalculationName("");
    setCurrentPage("calculator");
  };

  const saveCalculation = async () => {
    const now = new Date().toISOString();
    const calc = {
      id: currentCalculation ? currentCalculation.id : Date.now(),
      name: calculationName || ("Calculation " + new Date().toLocaleDateString()),
      date: now,
      projects,
      exchangeRate,
      createdBy: currentCalculation?.createdBy || currentUser,
      createdAt: currentCalculation?.createdAt || now,
      modifiedBy: currentUser,
      modifiedAt: now
    };

    let out = [...savedCalculations];
    const i = out.findIndex(c => c.id === calc.id);
    if (i >= 0) out[i] = calc; else out.push(calc);
    await persistAll(out);
    setCurrentCalculation(calc);
    alert("Calculation saved successfully!");
  };

  const loadCalculation = (calc) => {
    setProjects(calc.projects || []);
    setExchangeRate(calc.exchangeRate || exchangeRate);
    setCurrentCalculation(calc);
    setCalculationName(calc.name || "");
    setCurrentPage("calculator");
  };

  const deleteCalculation = async (id) => {
    if (!window.confirm("Delete this calculation?")) return;
    const out = savedCalculations.filter(c => c.id !== id);
    await persistAll(out);
  };

  const addProject = () => setProjects(prev => [...prev, {
    id: Date.now(), name: "", clientName: "", startDate: "", endDate: "", status: "active", notes: "", expanded: true,
    developers: [{ id: Date.now()+1, name: "", buyingPriceUSD: 0, sellingPriceEUR: 0, workingDays: 0 }]
  }]);

  const removeProject = (id) => setProjects(prev => prev.length>1 ? prev.filter(p=>p.id!==id) : prev);

  const updateProject = (id, field, value) => setProjects(prev => prev.map(p => p.id===id ? {...p, [field]: value} : p));

  const toggleProject = (id) => setProjects(prev => prev.map(p => p.id===id ? {...p, expanded: !p.expanded} : p));

  const addDeveloper = (pid) => setProjects(prev => prev.map(p => p.id===pid ? {...p, developers:[...p.developers, { id: Date.now(), name:"", buyingPriceUSD:0, sellingPriceEUR:0, workingDays:0 }]} : p));

  const updateDeveloper = (pid, did, field, value) => setProjects(prev => prev.map(p => p.id===pid ? {...p, developers: p.developers.map(d => d.id===did ? {...d, [field]: value} : d)} : p));

  const removeDeveloper = (pid, did) => setProjects(prev => prev.map(p => p.id===pid && p.developers.length>1 ? {...p, developers: p.developers.filter(d=>d.id!==did)} : p));

  const exportToCSV = () => {
    let csv = "Project Name,Client Name,Start Date,End Date,Status,Developer Name,Daily Buying USD,Daily Buying EUR,Monthly Buying EUR,Daily Selling EUR,Days/Month,Daily Earnings EUR,Monthly Earnings EUR,Comm 1,Comm 2,Comm 3,Comm 4,Total Comm\n";
    projects.forEach(p => p.developers.forEach(d => {
      const m = calculateMetrics(d.buyingPriceUSD, d.sellingPriceEUR, d.workingDays);
      csv += [p.name, p.clientName, p.startDate, p.endDate, p.status, d.name, d.buyingPriceUSD, m.buyingEUR.toFixed(2), m.monthlyBuyEUR.toFixed(2),
        d.sellingPriceEUR, d.workingDays, m.earningsPerDay.toFixed(2), m.monthlyEarnings.toFixed(2), m.commissions[0].toFixed(2), m.commissions[1].toFixed(2), m.commissions[2].toFixed(2), m.commissions[3].toFixed(2), m.total.toFixed(2)].join(",") + "\n";
    }));
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "projects_pricing.csv";
    a.click();
  };

  const TopBar = () => (
    <div className="bg-white/80 backdrop-blur sticky top-0 z-20 border-b">
      <div className="container py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-indigo-700">Developers Offshore</h1>
          <nav className="hidden sm:flex gap-2">
            <button onClick={() => setCurrentPage('home')} className={"btn " + (currentPage==='home' ? 'btn-primary' : 'btn-ghost')}><Home size={16} className="mr-2" />Home</button>
            <button onClick={newCalculation} className="btn btn-ghost"><Plus size={16} className="mr-2" />New Calculation</button>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Logged in as <span className="font-semibold text-indigo-700">{currentUser}</span></span>
          <button onClick={onLogout} className="btn btn-ghost"><LogOut size={16} className="mr-2" />Logout</button>
        </div>
      </div>
      <div className="container sm:hidden pb-3 flex gap-2">
        <button onClick={() => setCurrentPage('home')} className={"btn w-full " + (currentPage==='home' ? 'btn-primary' : 'btn-ghost')}><Home size={16} className="mr-2" />Home</button>
        <button onClick={newCalculation} className="btn w-full btn-ghost"><Plus size={16} className="mr-2" />New</button>
      </div>
    </div>
  );

  if (currentPage === "home") {
    return (
      <div className="min-h-screen">
        <TopBar />
        <div className="container py-6">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Saved Calculations</h2>
            <p className="text-gray-600">Everyone can see all calculations. Create, edit, or delete.</p>
          </div>
          {savedCalculations.length === 0 ? (
            <div className="card p-12 text-center">
              <Calculator size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No calculations yet</h3>
              <p className="text-gray-500 mb-6">Create your first calculation to get started</p>
              <button onClick={newCalculation} className="btn btn-primary inline-flex items-center gap-2">
                <Plus size={20} />Create New Calculation
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedCalculations.map(calc => {
                const totals = calculateGrandTotals(calc.projects || []);
                return (
                  <div key={calc.id} className="card">
                    <div className="p-6">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">{calc.name}</h3>
                          <p className="text-xs text-gray-500">
                            Created by <span className="font-semibold">{calc.createdBy || '—'}</span> on {calc.createdAt ? new Date(calc.createdAt).toLocaleString() : '—'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Last modified by <span className="font-semibold">{calc.modifiedBy || '—'}</span> on {calc.modifiedAt ? new Date(calc.modifiedAt).toLocaleString() : '—'}
                          </p>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          <div>{new Date(calc.date).toLocaleDateString()} {new Date(calc.date).toLocaleTimeString()}</div>
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Projects:</span>
                          <span className="font-semibold">{(calc.projects || []).length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Monthly Cost:</span>
                          <span className="font-semibold text-purple-600">€{totals.monthlyBuy.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Monthly Earnings:</span>
                          <span className="font-semibold text-green-600">€{totals.monthlyEarnings.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Commissions:</span>
                          <span className="font-semibold text-blue-600">€{totals.totalCommissions.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => loadCalculation(calc)} className="flex-1 btn btn-primary flex items-center justify-center gap-2 text-sm">
                          <Edit2 size={16} />Edit
                        </button>
                        <button onClick={() => deleteCalculation(calc.id)} className="btn bg-red-50 text-red-600 hover:bg-red-100">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TopBar />
      <div className="container py-6 space-y-6">
        <div className="card p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <input type="text" value={calculationName} onChange={(e)=>setCalculationName(e.target.value)} placeholder="Calculation name" className="input sm:flex-1" />
            <button onClick={saveCalculation} className="btn btn-primary flex items-center gap-2"><Save size={18} />Save</button>
            {currentCalculation && <p className="text-sm text-gray-600">Last saved: {new Date(currentCalculation.date).toLocaleString()}</p>}
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="bg-blue-50 px-4 py-2 rounded flex items-center gap-2">
              <span className="font-semibold">Rate:</span>
              <span>1 USD = {exchangeRate.toFixed(4)} EUR</span>
            </div>
            <div className="text-gray-600 text-sm">{lastUpdate}</div>
            <button onClick={() => window.location.reload()} className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <RefreshCw size={14} />Refresh
            </button>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="text-xl font-bold mb-3">Grand Totals</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-purple-50 p-3 rounded">
              <div className="text-sm text-gray-600">Monthly Costs</div>
              <div className="text-2xl font-bold text-purple-700">€{grandTotals.monthlyBuy.toFixed(2)}</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded">
              <div className="text-sm text-gray-600">Monthly Earnings</div>
              <div className="text-2xl font-bold text-yellow-700">€{grandTotals.monthlyEarnings.toFixed(2)}</div>
            </div>
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-sm text-gray-600">Total Commissions</div>
              <div className="text-2xl font-bold text-blue-700">€{grandTotals.totalCommissions.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button onClick={addProject} className="btn btn-primary flex items-center gap-2"><Plus size={18} />Add Project</button>
          <button onClick={exportToCSV} className="btn btn-ghost flex items-center gap-2"><Download size={18} />Export CSV</button>
        </div>

        {projects.map(project => {
          const pt = calculateProjectTotals(project);
          return (
            <div key={project.id} className="card overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <button onClick={() => setProjects(prev => prev.map(p => p.id===project.id ? {...p, expanded: !p.expanded} : p))} className="hover:bg-indigo-800 p-1 rounded">
                      {project.expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 w-full">
                      <input type="text" value={project.name} onChange={(e) => setProjects(prev => prev.map(p => p.id===project.id ? {...p, name: e.target.value} : p))} placeholder="Project Name" className="px-3 py-1 rounded text-gray-800 font-semibold" />
                      <input type="text" value={project.clientName} onChange={(e) => setProjects(prev => prev.map(p => p.id===project.id ? {...p, clientName: e.target.value} : p))} placeholder="Client" className="px-3 py-1 rounded text-gray-800" />
                      <input type="date" value={project.startDate} onChange={(e) => setProjects(prev => prev.map(p => p.id===project.id ? {...p, startDate: e.target.value} : p))} className="px-3 py-1 rounded text-gray-800" />
                      <input type="date" value={project.endDate} onChange={(e) => setProjects(prev => prev.map(p => p.id===project.id ? {...p, endDate: e.target.value} : p))} className="px-3 py-1 rounded text-gray-800" />
                      <select value={project.status} onChange={(e) => setProjects(prev => prev.map(p => p.id===project.id ? {...p, status: e.target.value} : p))} className="px-3 py-1 rounded text-gray-800">
                        <option value="active">Active</option>
                        <option value="on-hold">On Hold</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={() => setProjects(prev => prev.length>1 ? prev.filter(p => p.id!==project.id) : prev)} className="ml-3 hover:bg-red-600 p-2 rounded" disabled={projects.length===1}>
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="mt-2">
                  <input type="text" value={project.notes} onChange={(e) => setProjects(prev => prev.map(p => p.id===project.id ? {...p, notes: e.target.value} : p))} placeholder="Notes..." className="w-full px-3 py-1 rounded text-gray-800 text-sm" />
                </div>
                <div className="mt-3 flex gap-4 text-sm">
                  <div>Cost: <span className="font-bold">€{pt.monthlyBuy.toFixed(2)}</span></div>
                  <div>Earnings: <span className="font-bold">€{pt.monthlyEarnings.toFixed(2)}</span></div>
                  <div>Commissions: <span className="font-bold">€{pt.totalCommissions.toFixed(2)}</span></div>
                </div>
              </div>
              {project.expanded && (
                <div className="p-4 overflow-x-auto">
                  <button onClick={() => setProjects(prev => prev.map(p => p.id===project.id ? {...p, developers:[...p.developers, { id: Date.now(), name:"", buyingPriceUSD:0, sellingPriceEUR:0, workingDays:0 }]} : p))} className="mb-3 bg-green-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1">
                    <Plus size={16} />Add Developer
                  </button>
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Developer</th>
                        <th className="border p-2 text-right">Daily Buy USD</th>
                        <th className="border p-2 text-right">Daily Buy EUR</th>
                        <th className="border p-2 text-right bg-purple-50">Monthly Buy EUR</th>
                        <th className="border p-2 text-right">Daily Sell EUR</th>
                        <th className="border p-2 text-right">Days</th>
                        <th className="border p-2 text-right">Daily Earn</th>
                        <th className="border p-2 text-right bg-yellow-50">Monthly Earn</th>
                        <th className="border p-2 text-right">Total Comm</th>
                        <th className="border p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.developers.map(dev => {
                        const m = calculateMetrics(dev.buyingPriceUSD, dev.sellingPriceEUR, dev.workingDays);
                        return (
                          <tr key={dev.id} className="hover:bg-gray-50">
                            <td className="border p-2">
                              <input type="text" value={dev.name} onChange={(e) => setProjects(prev => prev.map(p => p.id===project.id ? {...p, developers: p.developers.map(d => d.id===dev.id ? {...d, name: e.target.value} : d)} : p))} placeholder="Name" className="w-full px-2 py-1 border rounded text-sm" />
                            </td>
                            <td className="border p-2">
                              <input type="number" value={dev.buyingPriceUSD || ''} onChange={(e) => setProjects(prev => prev.map(p => p.id===project.id ? {...p, developers: p.developers.map(d => d.id===dev.id ? {...d, buyingPriceUSD: parseFloat(e.target.value) || 0} : d)} : p))} className="w-24 px-2 py-1 border rounded text-right text-sm" min="0" step="0.01" />
                            </td>
                            <td className="border p-2 text-right font-mono bg-gray-50">€{m.buyingEUR.toFixed(2)}</td>
                            <td className="border p-2 text-right font-mono font-semibold bg-purple-50">€{m.monthlyBuyEUR.toFixed(2)}</td>
                            <td className="border p-2">
                              <input type="number" value={dev.sellingPriceEUR || ''} onChange={(e) => setProjects(prev => prev.map(p => p.id===project.id ? {...p, developers: p.developers.map(d => d.id===dev.id ? {...d, sellingPriceEUR: parseFloat(e.target.value) || 0} : d)} : p))} className="w-24 px-2 py-1 border rounded text-right text-sm" min="0" step="0.01" />
                            </td>
                            <td className="border p-2">
                              <input type="number" value={dev.workingDays || ''} onChange={(e) => setProjects(prev => prev.map(p => p.id===project.id ? {...p, developers: p.developers.map(d => d.id===dev.id ? {...d, workingDays: parseInt(e.target.value) || 0} : d)} : p))} className="w-20 px-2 py-1 border rounded text-right text-sm" min="0" max="31" />
                            </td>
                            <td className={'border p-2 text-right font-mono ' + (m.earningsPerDay >= 0 ? 'text-green-700' : 'text-red-700')}>€{m.earningsPerDay.toFixed(2)}</td>
                            <td className={'border p-2 text-right font-mono font-semibold bg-yellow-50 ' + (m.monthlyEarnings >= 0 ? 'text-green-700' : 'text-red-700')}>€{m.monthlyEarnings.toFixed(2)}</td>
                            <td className="border p-2 text-right font-mono font-bold bg-blue-50">€{m.total.toFixed(2)}</td>
                            <td className="border p-2 text-center">
                              <button onClick={() => setProjects(prev => prev.map(p => p.id===project.id && p.developers.length>1 ? {...p, developers: p.developers.filter(d => d.id!==dev.id)} : p))} className="text-red-600 hover:text-red-800 p-1">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
