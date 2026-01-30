"use client";

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { createClient } from '@supabase/supabase-js';

// Supabase setup
const supabaseUrl = 'https://kzxcykitixhzkqfnzjpm.supabase.co';
const supabaseKey = 'sb_publishable_Ev2jrbl4nMmreq8QSTGqag_YB_OoxkQ';
const supabase = createClient(supabaseUrl, supabaseKey);

// Set data with names
const SET_DATA = [
  { id: 'op-01', code: 'OP-01', name: 'Romance Dawn', type: 'main' },
  { id: 'op-02', code: 'OP-02', name: 'Paramount War', type: 'main' },
  { id: 'op-03', code: 'OP-03', name: 'Pillars of Strength', type: 'main' },
  { id: 'op-04', code: 'OP-04', name: 'Kingdoms of Intrigue', type: 'main' },
  { id: 'op-05', code: 'OP-05', name: 'Awakening of the New Era', type: 'main' },
  { id: 'op-06', code: 'OP-06', name: 'Wings of the Captain', type: 'main' },
  { id: 'op-07', code: 'OP-07', name: '500 Years in the Future', type: 'main' },
  { id: 'op-08', code: 'OP-08', name: 'Two Legends', type: 'main' },
  { id: 'op-09', code: 'OP-09', name: 'Emperors of the New World', type: 'main' },
  { id: 'op-10', code: 'OP-10', name: 'Royal Blood', type: 'main' },
  { id: 'op-11', code: 'OP-11', name: 'Fist of a Divine Speed', type: 'main' },
  { id: 'op-12', code: 'OP-12', name: 'Legacy of the Master', type: 'main' },
  { id: 'op-13', code: 'OP-13', name: 'Carrying On His Will', type: 'main' },
  { id: 'op-14', code: 'OP-14', name: 'The Azure Sea\'s Seven', type: 'main' },
  { id: 'prb-01', code: 'PRB-01', name: 'Premium Booster Vol. 1', type: 'premium' },
  { id: 'prb-02', code: 'PRB-02', name: 'Premium Booster Vol. 2', type: 'premium' },
  { id: 'eb-01', code: 'EB-01', name: 'Extra Booster: Memorial Collection', type: 'extra' },
  { id: 'eb-02', code: 'EB-02', name: 'Extra Booster Vol. 2', type: 'extra' },
  { id: 'eb-03', code: 'EB-03', name: 'Extra Booster Vol. 3', type: 'extra' },
];

const SYNC_CODE_KEY = 'optcg-sync-code';

export default function Home() {
  const [syncCode, setSyncCode] = useState('');
  const [tempSyncCode, setTempSyncCode] = useState('');
  const [showSyncSetup, setShowSyncSetup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mainTab, setMainTab] = useState('prices');
  const [view, setView] = useState('list');
  const [selectedSet, setSelectedSet] = useState(null);
  const [priceData, setPriceData] = useState({});
  const [portfolio, setPortfolio] = useState({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [costEditMode, setCostEditMode] = useState(false);
  const [tempBoxPrice, setTempBoxPrice] = useState('');
  const [tempCasePrice, setTempCasePrice] = useState('');
  const [tempBoxCost, setTempBoxCost] = useState('');
  const [tempCaseCost, setTempCaseCost] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [saveStatus, setSaveStatus] = useState('');

  // Check for existing sync code on mount
  useEffect(() => {
    const existingCode = localStorage.getItem(SYNC_CODE_KEY);
    if (existingCode) {
      setSyncCode(existingCode);
      loadDataFromSupabase(existingCode);
    } else {
      setShowSyncSetup(true);
      setLoading(false);
    }
  }, []);

  const generateSyncCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateNewCode = async () => {
    const newCode = generateSyncCode();
    localStorage.setItem(SYNC_CODE_KEY, newCode);
    setSyncCode(newCode);
    setShowSyncSetup(false);
    setLoading(false);
  };

  const handleUseExistingCode = async () => {
    if (tempSyncCode.length < 4) {
      setSaveStatus('Code must be at least 4 characters');
      setTimeout(() => setSaveStatus(''), 2000);
      return;
    }
    const code = tempSyncCode.toUpperCase();
    localStorage.setItem(SYNC_CODE_KEY, code);
    setSyncCode(code);
    setShowSyncSetup(false);
    await loadDataFromSupabase(code);
  };

  const loadDataFromSupabase = async (code) => {
    setLoading(true);
    setSyncing(true);
    
    try {
      // Load prices
      const { data: pricesData, error: pricesError } = await supabase
        .from('prices')
        .select('*')
        .eq('user_id', code);

      if (pricesError) throw pricesError;

      // Convert to our format
      const pricesObj = {};
      pricesData?.forEach((row) => {
        if (!pricesObj[row.set_id]) {
          pricesObj[row.set_id] = [];
        }
        pricesObj[row.set_id].push({
          date: row.date,
          boosterBox: row.booster_box ? parseFloat(row.booster_box) : null,
          case: row.case_price ? parseFloat(row.case_price) : null,
        });
      });
      
      // Sort by date
      Object.keys(pricesObj).forEach(key => {
        pricesObj[key].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      });
      
      setPriceData(pricesObj);

      // Load portfolio
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolio')
        .select('*')
        .eq('user_id', code);

      if (portfolioError) throw portfolioError;

      const portfolioObj = {};
      portfolioData?.forEach((row) => {
        portfolioObj[row.set_id] = {
          boxes: row.boxes || 0,
          cases: row.cases || 0,
          boxCost: row.box_cost ? parseFloat(row.box_cost) : 0,
          caseCost: row.case_cost ? parseFloat(row.case_cost) : 0,
        };
      });
      setPortfolio(portfolioObj);

      setSaveStatus('Synced!');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Error loading data:', error);
      setSaveStatus('Sync failed');
      setTimeout(() => setSaveStatus(''), 2000);
    }
    
    setLoading(false);
    setSyncing(false);
  };

  const savePriceToSupabase = async (setId, date, boosterBox, casePrice) => {
    if (!syncCode) return;
    
    setSyncing(true);
    try {
      const { error } = await supabase
        .from('prices')
        .upsert({
          user_id: syncCode,
          set_id: setId,
          date: date,
          booster_box: boosterBox,
          case_price: casePrice,
        }, {
          onConflict: 'user_id,set_id,date'
        });

      if (error) throw error;
      setSaveStatus('Saved!');
    } catch (error) {
      console.error('Error saving price:', error);
      setSaveStatus('Save failed');
    }
    setTimeout(() => setSaveStatus(''), 2000);
    setSyncing(false);
  };

  const savePortfolioToSupabase = async (setId, data) => {
    if (!syncCode) return;
    
    setSyncing(true);
    try {
      const { error } = await supabase
        .from('portfolio')
        .upsert({
          user_id: syncCode,
          set_id: setId,
          boxes: data.boxes,
          cases: data.cases,
          box_cost: data.boxCost,
          case_cost: data.caseCost,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,set_id'
        });

      if (error) throw error;
      setSaveStatus('Saved!');
    } catch (error) {
      console.error('Error saving portfolio:', error);
      setSaveStatus('Save failed');
    }
    setTimeout(() => setSaveStatus(''), 2000);
    setSyncing(false);
  };

  const getCurrentPrice = (setId) => {
    const history = priceData[setId] || [];
    if (history.length === 0) return { boosterBox: null, case: null };
    return history[history.length - 1];
  };

  const getPortfolioItem = (setId) => {
    return portfolio[setId] || { boxes: 0, cases: 0, boxCost: 0, caseCost: 0 };
  };

  const updatePortfolioQuantity = async (setId, type, delta) => {
    const current = getPortfolioItem(setId);
    const newQuantity = Math.max(0, (type === 'boxes' ? current.boxes : current.cases) + delta);

    const newData = {
      ...current,
      [type]: newQuantity,
    };

    const newPortfolio = {
      ...portfolio,
      [setId]: newData,
    };

    setPortfolio(newPortfolio);
    await savePortfolioToSupabase(setId, newData);
  };

  const updatePortfolioCost = async (setId) => {
    const current = getPortfolioItem(setId);
    const boxCost = tempBoxCost ? parseFloat(tempBoxCost) : current.boxCost || 0;
    const caseCost = tempCaseCost ? parseFloat(tempCaseCost) : current.caseCost || 0;

    const newData = {
      ...current,
      boxCost,
      caseCost,
    };

    const newPortfolio = {
      ...portfolio,
      [setId]: newData,
    };

    setPortfolio(newPortfolio);
    await savePortfolioToSupabase(setId, newData);
    setCostEditMode(false);
    setTempBoxCost('');
    setTempCaseCost('');
  };

  const handleAddPrice = async () => {
    if (!selectedSet) return;

    const boxPrice = tempBoxPrice ? parseFloat(tempBoxPrice) : null;
    const casePrice = tempCasePrice ? parseFloat(tempCasePrice) : null;

    if (boxPrice === null && casePrice === null) return;

    const today = new Date().toISOString().split('T')[0];
    const newEntry = {
      date: today,
      boosterBox: boxPrice,
      case: casePrice,
    };

    const newData = { ...priceData };
    if (!newData[selectedSet.id]) {
      newData[selectedSet.id] = [];
    }

    const existingIndex = newData[selectedSet.id].findIndex((e) => e.date === today);
    if (existingIndex >= 0) {
      newData[selectedSet.id][existingIndex] = newEntry;
    } else {
      newData[selectedSet.id].push(newEntry);
    }

    setPriceData(newData);
    await savePriceToSupabase(selectedSet.id, today, boxPrice, casePrice);
    setEditMode(false);
    setTempBoxPrice('');
    setTempCasePrice('');
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined || price === 0) return '—';
    return `$${price.toFixed(2)}`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getFilteredSets = () => {
    if (filterType === 'all') return SET_DATA;
    return SET_DATA.filter((s) => s.type === filterType);
  };

  const getPriceChange = (setId) => {
    const history = priceData[setId] || [];
    if (history.length < 2) return null;
    const current = history[history.length - 1].boosterBox;
    const previous = history[history.length - 2].boosterBox;
    if (!current || !previous) return null;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const calculatePortfolioTotals = () => {
    let totalValue = 0;
    let totalCost = 0;
    let totalBoxes = 0;
    let totalCases = 0;
    let itemizedSets = [];

    SET_DATA.forEach((set) => {
      const item = getPortfolioItem(set.id);
      const prices = getCurrentPrice(set.id);

      if (item.boxes > 0 || item.cases > 0) {
        const boxValue = (prices.boosterBox || 0) * item.boxes;
        const caseValue = (prices.case || 0) * item.cases;
        const setTotal = boxValue + caseValue;

        const boxCostTotal = (item.boxCost || 0) * item.boxes;
        const caseCostTotal = (item.caseCost || 0) * item.cases;
        const setCostTotal = boxCostTotal + caseCostTotal;

        totalBoxes += item.boxes;
        totalCases += item.cases;
        totalValue += setTotal;
        totalCost += setCostTotal;

        itemizedSets.push({
          ...set,
          boxes: item.boxes,
          cases: item.cases,
          boxCost: item.boxCost || 0,
          caseCost: item.caseCost || 0,
          boxValue,
          caseValue,
          totalValue: setTotal,
          totalCost: setCostTotal,
          profit: setTotal - setCostTotal,
          prices,
        });
      }
    });

    return { totalValue, totalCost, totalProfit: totalValue - totalCost, totalBoxes, totalCases, itemizedSets };
  };

  // Sync Setup Screen
  if (showSyncSetup) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4">
        <div className="max-w-md mx-auto pt-10">
          <h1 className="text-2xl font-bold text-amber-400 text-center mb-2">
            🏴‍☠️ OP TCG Tracker
          </h1>
          <p className="text-slate-400 text-center mb-8">Cloud Sync Setup</p>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-4">
            <h2 className="text-lg font-medium text-white mb-4">New Device?</h2>
            <p className="text-slate-400 text-sm mb-4">
              Create a new sync code to start fresh, or enter an existing code to sync your data from another device.
            </p>
            
            <button
              onClick={handleCreateNewCode}
              className="w-full bg-amber-500 text-slate-900 py-3 rounded-lg font-medium mb-4"
            >
              Create New Sync Code
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-800 text-slate-400">or</span>
              </div>
            </div>

            <p className="text-slate-400 text-sm mb-2">Enter existing sync code:</p>
            <input
              type="text"
              value={tempSyncCode}
              onChange={(e) => setTempSyncCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={10}
              className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-3 text-white text-center text-xl tracking-widest mb-4"
            />
            <button
              onClick={handleUseExistingCode}
              className="w-full bg-slate-700 text-white py-3 rounded-lg font-medium"
            >
              Sync with Code
            </button>
          </div>
        </div>
        
        {saveStatus && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg text-sm">
            {saveStatus}
          </div>
        )}
      </div>
    );
  }

  // Settings Modal
  const renderSettings = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 max-w-sm w-full">
        <h2 className="text-lg font-medium text-amber-400 mb-4">Settings</h2>
        
        <div className="mb-4">
          <p className="text-slate-400 text-sm mb-2">Your Sync Code:</p>
          <div className="bg-slate-700 rounded px-4 py-3 text-center">
            <span className="text-2xl font-mono text-white tracking-widest">{syncCode}</span>
          </div>
          <p className="text-slate-500 text-xs mt-2">
            Use this code on other devices to sync your data
          </p>
        </div>

        <button
          onClick={() => loadDataFromSupabase(syncCode)}
          disabled={syncing}
          className="w-full bg-slate-700 text-white py-2 rounded-lg font-medium mb-3"
        >
          {syncing ? 'Syncing...' : '🔄 Refresh Data'}
        </button>

        <button
          onClick={() => setShowSettings(false)}
          className="w-full bg-amber-500 text-slate-900 py-2 rounded-lg font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );

  // Main Tab Navigation
  const renderMainTabs = () => (
    <div className="flex bg-slate-800 border-b border-amber-500/30">
      <button
        onClick={() => {
          setMainTab('prices');
          setView('list');
          setSelectedSet(null);
          setFilterType('all');
        }}
        className={`flex-1 py-3 text-sm font-medium transition-colors ${
          mainTab === 'prices'
            ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-700/50'
            : 'text-slate-400 hover:text-slate-300'
        }`}
      >
        📊 Prices
      </button>
      <button
        onClick={() => {
          setMainTab('portfolio');
          setView('list');
          setSelectedSet(null);
          setFilterType('all');
        }}
        className={`flex-1 py-3 text-sm font-medium transition-colors ${
          mainTab === 'portfolio'
            ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-700/50'
            : 'text-slate-400 hover:text-slate-300'
        }`}
      >
        💰 Portfolio
      </button>
    </div>
  );

  // Portfolio List View
  const renderPortfolioList = () => {
    const { totalValue, totalCost, totalProfit, totalBoxes, totalCases, itemizedSets } = calculatePortfolioTotals();

    return (
      <div className="min-h-screen bg-slate-900 text-white">
        {/* Header */}
        <div className="bg-slate-800 border-b border-amber-500/30 p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-amber-400">
                🏴‍☠️ OP TCG Tracker
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                Sealed Product Prices
              </p>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="text-slate-400 hover:text-white p-2"
            >
              ⚙️
            </button>
          </div>
        </div>

        {renderMainTabs()}

        {/* Portfolio Summary */}
        <div className="p-4">
          <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 rounded-lg p-4 border border-amber-500/30">
            <h2 className="text-amber-400 font-medium text-sm mb-3">Portfolio Summary</h2>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="text-slate-400 text-xs">Market Value</div>
                <div className="text-2xl font-bold text-white">
                  ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-xs">Total Cost</div>
                <div className="text-2xl font-bold text-slate-300">
                  ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-amber-500/20">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Profit/Loss:</span>
                <span className={`text-xl font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalProfit >= 0 ? '+' : ''}{formatPrice(totalProfit)}
                </span>
              </div>
            </div>
            <div className="flex gap-4 text-sm mt-3 pt-3 border-t border-amber-500/20">
              <div>
                <span className="text-slate-400">Boxes: </span>
                <span className="text-white font-medium">{totalBoxes}</span>
              </div>
              <div>
                <span className="text-slate-400">Cases: </span>
                <span className="text-white font-medium">{totalCases}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-slate-700 px-2">
          {[
            { key: 'all', label: 'All Sets' },
            { key: 'owned', label: 'Owned Only' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                filterType === tab.key
                  ? 'text-amber-400 border-b-2 border-amber-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Set List for Portfolio */}
        <div className="p-3 space-y-2 pb-20">
          {(filterType === 'owned'
            ? itemizedSets
            : SET_DATA.map((set) => {
                const item = getPortfolioItem(set.id);
                const prices = getCurrentPrice(set.id);
                const boxValue = (prices.boosterBox || 0) * item.boxes;
                const caseValue = (prices.case || 0) * item.cases;
                const boxCostTotal = (item.boxCost || 0) * item.boxes;
                const caseCostTotal = (item.caseCost || 0) * item.cases;
                const totalVal = boxValue + caseValue;
                const totalCst = boxCostTotal + caseCostTotal;
                return {
                  ...set,
                  boxes: item.boxes,
                  cases: item.cases,
                  boxCost: item.boxCost || 0,
                  caseCost: item.caseCost || 0,
                  boxValue,
                  caseValue,
                  totalValue: totalVal,
                  totalCost: totalCst,
                  profit: totalVal - totalCst,
                  prices,
                };
              })
          ).map((set) => (
            <div 
              key={set.id} 
              className="bg-slate-800 rounded-lg p-3 border border-slate-700 cursor-pointer hover:border-amber-500/50 transition-colors"
              onClick={() => {
                setSelectedSet(set);
                setView('portfolio-detail');
              }}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold text-sm">{set.code}</span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        set.type === 'main'
                          ? 'bg-blue-500/20 text-blue-400'
                          : set.type === 'premium'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}
                    >
                      {set.type}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs mt-0.5">{set.name}</p>
                </div>
                <div className="text-right">
                  <div className="text-white font-medium">${set.totalValue.toFixed(2)}</div>
                  <div className={`text-xs ${set.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {set.profit >= 0 ? '+' : ''}{formatPrice(set.profit)}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-700/50 rounded p-2">
                  <span className="text-slate-400">Boxes: </span>
                  <span className="text-white font-medium">{set.boxes}</span>
                  {set.boxCost > 0 && (
                    <span className="text-slate-500 ml-1">@ {formatPrice(set.boxCost)}</span>
                  )}
                </div>
                <div className="bg-slate-700/50 rounded p-2">
                  <span className="text-slate-400">Cases: </span>
                  <span className="text-white font-medium">{set.cases}</span>
                  {set.caseCost > 0 && (
                    <span className="text-slate-500 ml-1">@ {formatPrice(set.caseCost)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Save Status */}
        {saveStatus && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg text-sm">
            {syncing ? '🔄 ' : ''}{saveStatus}
          </div>
        )}
        
        {showSettings && renderSettings()}
      </div>
    );
  };

  // Portfolio Detail View
  const renderPortfolioDetailView = () => {
    if (!selectedSet) return null;
    const current = getCurrentPrice(selectedSet.id);
    const portfolioItem = getPortfolioItem(selectedSet.id);
    
    const boxValue = (current.boosterBox || 0) * portfolioItem.boxes;
    const caseValue = (current.case || 0) * portfolioItem.cases;
    const totalValue = boxValue + caseValue;
    
    const boxCostTotal = (portfolioItem.boxCost || 0) * portfolioItem.boxes;
    const caseCostTotal = (portfolioItem.caseCost || 0) * portfolioItem.cases;
    const totalCost = boxCostTotal + caseCostTotal;
    const profit = totalValue - totalCost;

    return (
      <div className="min-h-screen bg-slate-900 text-white">
        {/* Header */}
        <div className="bg-slate-800 border-b border-amber-500/30 p-4">
          <button
            onClick={() => {
              setView('list');
              setSelectedSet(null);
              setCostEditMode(false);
            }}
            className="text-amber-400 text-sm mb-2 flex items-center gap-1"
          >
            ← Back to Portfolio
          </button>
          <h1 className="text-xl font-bold text-amber-400">{selectedSet.code}</h1>
          <p className="text-slate-400 text-sm">{selectedSet.name}</p>
        </div>

        <div className="p-4 pb-20">
          {/* Value Summary */}
          <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 rounded-lg p-4 border border-amber-500/30 mb-4">
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="text-slate-400 text-xs">Market Value</div>
                <div className="text-xl font-bold text-white">{formatPrice(totalValue)}</div>
              </div>
              <div>
                <div className="text-slate-400 text-xs">Total Cost</div>
                <div className="text-xl font-bold text-slate-300">{formatPrice(totalCost)}</div>
              </div>
            </div>
            <div className="pt-3 border-t border-amber-500/20">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Profit/Loss:</span>
                <span className={`text-lg font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {profit >= 0 ? '+' : ''}{formatPrice(profit)}
                </span>
              </div>
            </div>
          </div>

          {/* Holdings with Quantity Controls */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-4">
            <h2 className="text-amber-400 font-medium mb-3">Your Holdings</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-700/50 rounded p-3">
                <div className="text-xs text-slate-400 mb-2">Booster Boxes</div>
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => updatePortfolioQuantity(selectedSet.id, 'boxes', -1)}
                    className="w-10 h-10 rounded bg-slate-600 text-white font-bold text-lg hover:bg-slate-500"
                  >
                    −
                  </button>
                  <span className="text-white font-bold text-2xl">{portfolioItem.boxes}</span>
                  <button
                    onClick={() => updatePortfolioQuantity(selectedSet.id, 'boxes', 1)}
                    className="w-10 h-10 rounded bg-amber-500 text-slate-900 font-bold text-lg hover:bg-amber-400"
                  >
                    +
                  </button>
                </div>
                <div className="text-center text-xs text-slate-400">
                  Value: {formatPrice(boxValue)}
                </div>
              </div>
              <div className="bg-slate-700/50 rounded p-3">
                <div className="text-xs text-slate-400 mb-2">Cases</div>
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => updatePortfolioQuantity(selectedSet.id, 'cases', -1)}
                    className="w-10 h-10 rounded bg-slate-600 text-white font-bold text-lg hover:bg-slate-500"
                  >
                    −
                  </button>
                  <span className="text-white font-bold text-2xl">{portfolioItem.cases}</span>
                  <button
                    onClick={() => updatePortfolioQuantity(selectedSet.id, 'cases', 1)}
                    className="w-10 h-10 rounded bg-amber-500 text-slate-900 font-bold text-lg hover:bg-amber-400"
                  >
                    +
                  </button>
                </div>
                <div className="text-center text-xs text-slate-400">
                  Value: {formatPrice(caseValue)}
                </div>
              </div>
            </div>
          </div>

          {/* Cost Basis */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-amber-400 font-medium">Cost Basis</h2>
              {!costEditMode && (
                <button
                  onClick={() => {
                    setCostEditMode(true);
                    setTempBoxCost(portfolioItem.boxCost?.toString() || '');
                    setTempCaseCost(portfolioItem.caseCost?.toString() || '');
                  }}
                  className="text-xs bg-amber-500 text-slate-900 px-3 py-1 rounded font-medium"
                >
                  Edit
                </button>
              )}
            </div>

            {costEditMode ? (
              <div className="space-y-3">
                <div>
                  <label className="text-slate-400 text-xs block mb-1">
                    Cost per Box ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={tempBoxCost}
                    onChange={(e) => setTempBoxCost(e.target.value)}
                    placeholder="89.99"
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs block mb-1">Cost per Case ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tempCaseCost}
                    onChange={(e) => setTempCaseCost(e.target.value)}
                    placeholder="450.00"
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updatePortfolioCost(selectedSet.id)}
                    className="flex-1 bg-amber-500 text-slate-900 py-2 rounded font-medium"
                  >
                    Save Cost
                  </button>
                  <button
                    onClick={() => {
                      setCostEditMode(false);
                      setTempBoxCost('');
                      setTempCaseCost('');
                    }}
                    className="flex-1 bg-slate-700 text-slate-300 py-2 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/50 rounded p-3">
                  <div className="text-slate-400 text-xs mb-1">Per Box</div>
                  <div className="text-white font-medium">{formatPrice(portfolioItem.boxCost)}</div>
                  <div className="text-slate-500 text-xs mt-1">
                    Total: {formatPrice(boxCostTotal)}
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded p-3">
                  <div className="text-slate-400 text-xs mb-1">Per Case</div>
                  <div className="text-white font-medium">{formatPrice(portfolioItem.caseCost)}</div>
                  <div className="text-slate-500 text-xs mt-1">
                    Total: {formatPrice(caseCostTotal)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Current Market Prices */}
          <div className="mt-4 bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h2 className="text-amber-400 font-medium mb-3">Current Market Prices</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-700/50 rounded p-3 text-center">
                <div className="text-xl font-bold text-white">
                  {formatPrice(current.boosterBox)}
                </div>
                <div className="text-slate-400 text-xs mt-1">Booster Box</div>
              </div>
              <div className="bg-slate-700/50 rounded p-3 text-center">
                <div className="text-xl font-bold text-white">{formatPrice(current.case)}</div>
                <div className="text-slate-400 text-xs mt-1">Case</div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Status */}
        {saveStatus && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg text-sm">
            {syncing ? '🔄 ' : ''}{saveStatus}
          </div>
        )}
      </div>
    );
  };

  // Price List View
  const renderPriceList = () => (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-amber-500/30 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-amber-400">
              🏴‍☠️ OP TCG Tracker
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Sealed Product Prices
            </p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="text-slate-400 hover:text-white p-2"
          >
            ⚙️
          </button>
        </div>
      </div>

      {renderMainTabs()}

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-700">
        {[
          { key: 'all', label: 'All' },
          { key: 'main', label: 'Main' },
          { key: 'premium', label: 'Premium' },
          { key: 'extra', label: 'Extra' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              filterType === tab.key
                ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-800/50'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Set List */}
      <div className="p-3 space-y-2 pb-20">
        {getFilteredSets().map((set) => {
          const current = getCurrentPrice(set.id);
          const change = getPriceChange(set.id);

          return (
            <div
              key={set.id}
              onClick={() => {
                setSelectedSet(set);
                setView('detail');
              }}
              className="bg-slate-800 rounded-lg p-3 border border-slate-700 hover:border-amber-500/50 transition-colors cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold text-sm">{set.code}</span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        set.type === 'main'
                          ? 'bg-blue-500/20 text-blue-400'
                          : set.type === 'premium'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}
                    >
                      {set.type}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs mt-0.5">{set.name}</p>
                </div>
                <div className="text-right">
                  <div className="text-white font-medium">{formatPrice(current.boosterBox)}</div>
                  <div className="text-slate-400 text-xs">Box</div>
                  {change !== null && (
                    <div
                      className={`text-xs ${
                        parseFloat(change) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {parseFloat(change) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(change))}%
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-700/50 flex justify-between text-xs">
                <span className="text-slate-500">Case:</span>
                <span className="text-slate-300">{formatPrice(current.case)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Status */}
      {saveStatus && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg text-sm">
          {syncing ? '🔄 ' : ''}{saveStatus}
        </div>
      )}
      
      {showSettings && renderSettings()}
    </div>
  );

  // Detail View
  const renderDetailView = () => {
    if (!selectedSet) return null;
    const current = getCurrentPrice(selectedSet.id);
    const history = priceData[selectedSet.id] || [];
    const portfolioItem = getPortfolioItem(selectedSet.id);

    return (
      <div className="min-h-screen bg-slate-900 text-white">
        {/* Header */}
        <div className="bg-slate-800 border-b border-amber-500/30 p-4">
          <button
            onClick={() => {
              setView('list');
              setSelectedSet(null);
              setEditMode(false);
            }}
            className="text-amber-400 text-sm mb-2 flex items-center gap-1"
          >
            ← Back to List
          </button>
          <h1 className="text-xl font-bold text-amber-400">{selectedSet.code}</h1>
          <p className="text-slate-400 text-sm">{selectedSet.name}</p>
        </div>

        {/* Current Prices */}
        <div className="p-4 pb-20">
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-amber-400 font-medium">Current Prices</h2>
              {!editMode && (
                <button
                  onClick={() => {
                    setEditMode(true);
                    setTempBoxPrice(current.boosterBox?.toString() || '');
                    setTempCasePrice(current.case?.toString() || '');
                  }}
                  className="text-xs bg-amber-500 text-slate-900 px-3 py-1 rounded font-medium"
                >
                  Update
                </button>
              )}
            </div>

            {editMode ? (
              <div className="space-y-3">
                <div>
                  <label className="text-slate-400 text-xs block mb-1">
                    Booster Box Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={tempBoxPrice}
                    onChange={(e) => setTempBoxPrice(e.target.value)}
                    placeholder="89.99"
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs block mb-1">Case Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tempCasePrice}
                    onChange={(e) => setTempCasePrice(e.target.value)}
                    placeholder="450.00"
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddPrice}
                    className="flex-1 bg-amber-500 text-slate-900 py-2 rounded font-medium"
                  >
                    Save Price
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setTempBoxPrice('');
                      setTempCasePrice('');
                    }}
                    className="flex-1 bg-slate-700 text-slate-300 py-2 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/50 rounded p-3 text-center">
                  <div className="text-2xl font-bold text-white">
                    {formatPrice(current.boosterBox)}
                  </div>
                  <div className="text-slate-400 text-xs mt-1">Booster Box</div>
                </div>
                <div className="bg-slate-700/50 rounded p-3 text-center">
                  <div className="text-2xl font-bold text-white">{formatPrice(current.case)}</div>
                  <div className="text-slate-400 text-xs mt-1">Case</div>
                </div>
              </div>
            )}
          </div>

          {/* Your Holdings */}
          <div className="mt-4 bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h2 className="text-amber-400 font-medium mb-3">Your Holdings</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-700/50 rounded p-3">
                <div className="text-xs text-slate-400 mb-2">Booster Boxes</div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => updatePortfolioQuantity(selectedSet.id, 'boxes', -1)}
                    className="w-10 h-10 rounded bg-slate-600 text-white font-bold text-lg hover:bg-slate-500"
                  >
                    −
                  </button>
                  <span className="text-white font-bold text-2xl">{portfolioItem.boxes}</span>
                  <button
                    onClick={() => updatePortfolioQuantity(selectedSet.id, 'boxes', 1)}
                    className="w-10 h-10 rounded bg-amber-500 text-slate-900 font-bold text-lg hover:bg-amber-400"
                  >
                    +
                  </button>
                </div>
                <div className="text-center text-xs text-slate-400 mt-2">
                  Value: {formatPrice((current.boosterBox || 0) * portfolioItem.boxes)}
                </div>
              </div>
              <div className="bg-slate-700/50 rounded p-3">
                <div className="text-xs text-slate-400 mb-2">Cases</div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => updatePortfolioQuantity(selectedSet.id, 'cases', -1)}
                    className="w-10 h-10 rounded bg-slate-600 text-white font-bold text-lg hover:bg-slate-500"
                  >
                    −
                  </button>
                  <span className="text-white font-bold text-2xl">{portfolioItem.cases}</span>
                  <button
                    onClick={() => updatePortfolioQuantity(selectedSet.id, 'cases', 1)}
                    className="w-10 h-10 rounded bg-amber-500 text-slate-900 font-bold text-lg hover:bg-amber-400"
                  >
                    +
                  </button>
                </div>
                <div className="text-center text-xs text-slate-400 mt-2">
                  Value: {formatPrice((current.case || 0) * portfolioItem.cases)}
                </div>
              </div>
            </div>
          </div>

          {/* Price History Chart */}
          {history.length > 1 && (
            <div className="mt-4 bg-slate-800 rounded-lg p-4 border border-slate-700">
              <h2 className="text-amber-400 font-medium mb-3">Price History</h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      stroke="#64748b"
                      fontSize={10}
                    />
                    <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                      labelFormatter={formatDate}
                      formatter={(value) => [`$${Number(value)?.toFixed(2)}`, '']}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="boosterBox"
                      name="Box"
                      stroke="#D4AA4B"
                      strokeWidth={2}
                      dot={{ fill: '#D4AA4B' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="case"
                      name="Case"
                      stroke="#60a5fa"
                      strokeWidth={2}
                      dot={{ fill: '#60a5fa' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Price History Table */}
          <div className="mt-4 bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h2 className="text-amber-400 font-medium mb-3">History Log</h2>
            {history.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">
                No price entries yet. Tap "Update" to add your first price.
              </p>
            ) : (
              <div className="space-y-2">
                {[...history].reverse().map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0"
                  >
                    <span className="text-slate-400 text-sm">{formatDate(entry.date)}</span>
                    <div className="text-right text-sm">
                      <span className="text-amber-400">{formatPrice(entry.boosterBox)}</span>
                      <span className="text-slate-500 mx-2">/</span>
                      <span className="text-blue-400">{formatPrice(entry.case)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Save Status */}
        {saveStatus && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg text-sm">
            {syncing ? '🔄 ' : ''}{saveStatus}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-amber-400 text-xl mb-2">🏴‍☠️</div>
          <div className="text-amber-400">Loading...</div>
        </div>
      </div>
    );
  }

  // Render based on current state
  if (view === 'detail') {
    return renderDetailView();
  }
  
  if (view === 'portfolio-detail') {
    return renderPortfolioDetailView();
  }

  return mainTab === 'prices' ? renderPriceList() : renderPortfolioList();
}
