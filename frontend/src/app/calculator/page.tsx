'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/store/useStore';
import { 
  Calculator as CalcIcon, Building2, Wrench, Layers, 
  Download, Printer, Sparkles, Check, ChevronRight, 
  Info, PieChart, Hammer, Compass, DollarSign, 
  Plus, Minus, RefreshCw, FileSpreadsheet, Clock, Users,
  Sliders, ArrowUpRight, ShieldCheck
} from 'lucide-react';

// Admin panelda kiritilmagan bo'lsa ishlatiladigan standart narxlar
const DEFAULT_CALC = {
  usd_rate: 12850,
  construction: {
    base_m2: 3300000,
    basement_m2: 1150000,
    roof_tile: 140000,
    roof_soft: 90000,
    heating_floor: 180000,
    heating_combined: 250000,
    wall_brick: 1.15,
    wall_aerated: 1.05,
    wall_cinder: 0.95,
    wall_monolit: 1.25,
    finish_rough: 0.65,
    finish_standard: 1.0,
    finish_premium: 1.45,
  } as Record<string, number>,
  renovation: {
    base_cosmetic: 950000,
    base_standard: 1800000,
    base_euro: 2950000,
    plumbing: 240000,
    electric: 200000,
    ceiling_stretch: 120000,
    ceiling_drywall: 210000,
    floor_laminate: 140000,
    floor_tile: 240000,
    floor_parquet: 480000,
    wall_decorative: 180000,
    door_standard: 1300000,
    door_euro: 2200000,
  } as Record<string, number>,
};

export default function CalculatorPage() {
  // Asosiy rejim: 'construction' (Uy qurish) yoki 'renovation' (Ta'mirlash)
  const [activeTab, setActiveTab] = useState<'construction' | 'renovation'>('construction');
  const [currency, setCurrency] = useState<'UZS' | 'USD'>('UZS');

  // Narxlar admin paneldan yuklanadi
  const [calcCfg, setCalcCfg] = useState(DEFAULT_CALC);

  useEffect(() => {
    api.get('/dashboard/settings/')
      .then((res) => {
        const c = res.data?.calculator;
        if (c) {
          setCalcCfg({
            usd_rate: Number(c.usd_rate) || DEFAULT_CALC.usd_rate,
            construction: { ...DEFAULT_CALC.construction, ...(c.construction || {}) },
            renovation: { ...DEFAULT_CALC.renovation, ...(c.renovation || {}) },
          });
        }
      })
      .catch(() => {});
  }, []);

  const USD_RATE = calcCfg.usd_rate;

  // ==========================================
  // 1. UY QURILISHI HOLATI (CONSTRUCTION)
  // ==========================================
  const [cArea, setCArea] = useState(120); // Maydon m²
  const [cFloors, setCFloors] = useState(1); // Qavatlar soni
  const [cWallMaterial, setCWallMaterial] = useState<'brick' | 'aerated' | 'cinder' | 'monolit'>('brick');
  const [cRoofType, setCRoofType] = useState('metal'); // 'metal' | 'tile' | 'soft'
  const [cFinishLevel, setCFinishLevel] = useState<'rough' | 'standard' | 'premium'>('standard');
  const [cHeating, setCHeating] = useState('floor'); // 'radiator' | 'floor' | 'combined'
  const [cHasBasement, setCHasBasement] = useState(false);

  // ==========================================
  // 2. UYNI TA'MIRLASH HOLATI (RENOVATION)
  // ==========================================
  const [rArea, setRArea] = useState(65); // Maydon m²
  const [rType, setRType] = useState<'cosmetic' | 'standard' | 'euro'>('standard');
  const [rWallFinish, setRWallFinish] = useState('wallpaper'); // 'wallpaper' | 'paint' | 'decorative'
  const [rFloorType, setRFloorType] = useState('laminate'); // 'linoleum' | 'laminate' | 'tile' | 'parquet'
  const [rCeilingType, setRCeilingType] = useState('stretch'); // 'plaster' | 'stretch' | 'drywall'
  const [rPlumbing, setRPlumbing] = useState(true);
  const [rElectric, setRElectric] = useState(true);
  const [rDoorsCount, setRDoorsCount] = useState(4);

  // ==========================================
  // TEZKOR SHABLONLAR (PRESETS)
  // ==========================================
  const applyConstructionPreset = (preset: string) => {
    if (preset === 'compact') {
      setCArea(80);
      setCFloors(1);
      setCWallMaterial('brick');
      setCFinishLevel('standard');
      setCHasBasement(false);
    } else if (preset === 'family') {
      setCArea(140);
      setCFloors(1);
      setCWallMaterial('brick');
      setCFinishLevel('standard');
      setCHeating('floor');
      setCHasBasement(false);
    } else if (preset === 'cottage') {
      setCArea(240);
      setCFloors(2);
      setCWallMaterial('brick');
      setCFinishLevel('premium');
      setCRoofType('tile');
      setCHeating('combined');
      setCHasBasement(true);
    }
  };

  const applyRenovationPreset = (preset: string) => {
    if (preset === '1room') {
      setRArea(42);
      setRType('standard');
      setRDoorsCount(2);
    } else if (preset === '2room') {
      setRArea(65);
      setRType('standard');
      setRDoorsCount(4);
    } else if (preset === '3room') {
      setRArea(90);
      setRType('euro');
      setRDoorsCount(5);
    } else if (preset === 'bathOnly') {
      setRArea(12);
      setRType('standard');
      setRFloorType('tile');
      setRPlumbing(true);
      setRDoorsCount(1);
    }
  };

  // ==========================================
  // HISOBLASHLAR: UY QURILISHI (CONSTRUCTION)
  // ==========================================
  const constructionData = useMemo(() => {
    const cc = calcCfg.construction;
    const baseM2 = cc.base_m2;

    const wallMultiplier: Record<string, number> = {
      brick: cc.wall_brick,
      aerated: cc.wall_aerated,
      cinder: cc.wall_cinder,
      monolit: cc.wall_monolit,
    };

    const finishMultiplier: Record<string, number> = {
      rough: cc.finish_rough,
      standard: cc.finish_standard,
      premium: cc.finish_premium,
    };

    const floorFactor = 1.0 + (cFloors - 1) * 0.12;
    let perM2 = baseM2 * (wallMultiplier[cWallMaterial] || 1.1) * (finishMultiplier[cFinishLevel] || 1.0) * floorFactor;

    if (cRoofType === 'tile') perM2 += cc.roof_tile;
    if (cRoofType === 'soft') perM2 += cc.roof_soft;
    if (cHeating === 'floor') perM2 += cc.heating_floor;
    if (cHeating === 'combined') perM2 += cc.heating_combined;

    let totalCost = perM2 * cArea;
    if (cHasBasement) totalCost += cArea * cc.basement_m2;

    const totalBricks = cWallMaterial === 'brick' ? Math.round(cArea * 260 * cFloors) : Math.round(cArea * 40 * cFloors);
    const cementBags = Math.round(cArea * 2.2 * cFloors + (cHasBasement ? cArea * 1.5 : 0));
    const rebarTons = Number(((cArea * 0.028 * cFloors) + (cHasBasement ? cArea * 0.015 : 0)).toFixed(1));
    const sandTrucks = Math.max(2, Math.round((cArea / 30) * cFloors));
    const roofArea = Math.round(cArea * 1.25);
    const timberM3 = Number((cArea * 0.065).toFixed(1));
    const buildDays = Math.round(cArea * 0.9 * cFloors + (cFinishLevel === 'premium' ? 40 : 20));

    const foundation = totalCost * 0.18;
    const wallsAndFrame = totalCost * 0.32;
    const roofing = totalCost * 0.12;
    const finishing = cFinishLevel === 'rough' ? totalCost * 0.08 : totalCost * 0.22;
    const engineering = totalCost * 0.11;
    const permitsAndTransport = totalCost * 0.05;

    const materialsSum = totalCost * 0.62;
    const laborSum = totalCost * 0.38;

    return {
      perM2: Math.round(perM2),
      totalCost: Math.round(totalCost),
      materialsSum: Math.round(materialsSum),
      laborSum: Math.round(laborSum),
      buildDays,
      materialsList: [
        { name: cWallMaterial === 'brick' ? "Pishgan g'isht (dona)" : "Gazoblok bloklari (dona)", qty: totalBricks.toLocaleString(), unit: 'dona', icon: '🧱' },
        { name: "Sement M-400 (50 kg)", qty: cementBags.toLocaleString(), unit: 'qop', icon: '🏗️' },
        { name: "Armatura (12-14 mm)", qty: rebarTons, unit: 'tonna', icon: '⛓️' },
        { name: "Qum va shag'al (KAMAZ)", qty: sandTrucks, unit: 'mashina', icon: '🪨' },
        { name: "Tom yopish qoplamasi", qty: roofArea, unit: 'm²', icon: '🏠' },
        { name: "Yog'och va reykalar", qty: timberM3, unit: 'm³', icon: '🪵' },
      ],
      breakdown: [
        { title: "Poydevor va yer ishlari", amount: Math.round(foundation), pct: 18, color: 'bg-amber-500' },
        { title: "Devorlar, ustunlar va karkas", amount: Math.round(wallsAndFrame), pct: 32, color: 'bg-blue-600' },
        { title: "Tom yopish konstruksiyasi", amount: Math.round(roofing), pct: 12, color: 'bg-indigo-500' },
        { title: "Ichki va tashqi pardozlash", amount: Math.round(finishing), pct: cFinishLevel === 'rough' ? 8 : 22, color: 'bg-emerald-500' },
        { title: "Santexnika, isitish va elektr", amount: Math.round(engineering), pct: 11, color: 'bg-purple-500' },
        { title: "Logistika va kutilmagan zaxira", amount: Math.round(permitsAndTransport), pct: 5, color: 'bg-slate-400' },
      ],
    };
  }, [cArea, cFloors, cWallMaterial, cRoofType, cFinishLevel, cHeating, cHasBasement, calcCfg]);

  // ==========================================
  // HISOBLASHLAR: UYNI TA'MIRLASH (RENOVATION)
  // ==========================================
  const renovationData = useMemo(() => {
    const rc = calcCfg.renovation;
    const baseRates: Record<string, number> = {
      cosmetic: rc.base_cosmetic,
      standard: rc.base_standard,
      euro: rc.base_euro,
    };
    let perM2 = baseRates[rType] || rc.base_standard;

    if (rPlumbing) perM2 += rc.plumbing;
    if (rElectric) perM2 += rc.electric;

    if (rCeilingType === 'stretch') perM2 += rc.ceiling_stretch;
    if (rCeilingType === 'drywall') perM2 += rc.ceiling_drywall;

    if (rFloorType === 'laminate') perM2 += rc.floor_laminate;
    if (rFloorType === 'tile') perM2 += rc.floor_tile;
    if (rFloorType === 'parquet') perM2 += rc.floor_parquet;

    if (rWallFinish === 'decorative') perM2 += rc.wall_decorative;

    const doorsTotal = rDoorsCount * (rType === 'euro' ? rc.door_euro : rc.door_standard);
    const totalCost = perM2 * rArea + doorsTotal;

    const wallpaperRolls = Math.round((rArea * 2.8) / 5);
    const paintLiters = Math.round(rArea * 0.7);
    const laminatePacks = Math.round((rArea * 1.08) / 2.2);
    const tileSqm = Math.round(rFloorType === 'tile' ? rArea * 1.1 : rArea * 0.25);
    const puttyBags = Math.round(rArea * 0.45);
    const socketsCount = Math.round(rArea * 0.4);
    const renovDays = Math.round(rArea * 0.45 + (rType === 'euro' ? 25 : 15));

    const demolition = totalCost * 0.08;
    const plumbingElectric = totalCost * 0.22;
    const wallsCeiling = totalCost * 0.36;
    const flooring = totalCost * 0.22;
    const cleaningTransport = totalCost * 0.12;

    const materialsSum = totalCost * 0.58;
    const laborSum = totalCost * 0.42;

    return {
      perM2: Math.round(totalCost / rArea),
      totalCost: Math.round(totalCost),
      materialsSum: Math.round(materialsSum),
      laborSum: Math.round(laborSum),
      renovDays,
      materialsList: [
        { name: rWallFinish === 'wallpaper' ? "Gulqog'oz (oboy) rulonlari" : "Devor bo'yog'i / emulsiya", qty: rWallFinish === 'wallpaper' ? wallpaperRolls : paintLiters, unit: rWallFinish === 'wallpaper' ? 'rulon' : 'litr', icon: '🎨' },
        { name: "Pol qoplamasi (laminat/kafel)", qty: laminatePacks, unit: 'pachka', icon: '🪵' },
        { name: "Shpaklyovka va quruq qorishmalar", qty: puttyBags, unit: 'qop', icon: '🧱' },
        { name: "Plitka va kafel yelimi", qty: Math.round(tileSqm * 0.5), unit: 'qop', icon: '🛁' },
        { name: "Rozetka va o'chirgichlar", qty: socketsCount, unit: 'dona', icon: '⚡' },
        { name: "Xonalararo eshiklar", qty: rDoorsCount, unit: 'dona', icon: '🚪' },
      ],
      breakdown: [
        { title: "Buzish va tozalash ishlari", amount: Math.round(demolition), pct: 8, color: 'bg-rose-500' },
        { title: "Santexnika va elektr montaji", amount: Math.round(plumbingElectric), pct: 22, color: 'bg-purple-500' },
        { title: "Devorlar va shift pardozlash", amount: Math.round(wallsCeiling), pct: 36, color: 'bg-blue-600' },
        { title: "Pol qoplamasi va plintuslar", amount: Math.round(flooring), pct: 22, color: 'bg-amber-500' },
        { title: "Chiqindi tashish va tozalash", amount: Math.round(cleaningTransport), pct: 12, color: 'bg-slate-400' },
      ],
    };
  }, [rArea, rType, rWallFinish, rFloorType, rCeilingType, rPlumbing, rElectric, rDoorsCount, calcCfg]);

  const current = activeTab === 'construction' ? constructionData : renovationData;

  const formatMoney = (sum: number) => {
    if (currency === 'USD') {
      const usd = Math.round(sum / USD_RATE);
      return `$${usd.toLocaleString('en-US')}`;
    }
    return `${sum.toLocaleString('uz-UZ')} so'm`;
  };

  const downloadCSV = () => {
    const isConst = activeTab === 'construction';
    const title = isConst ? "Uy_Qurilishi_Smetasi" : "Uyni_Tamirlash_Smetasi";
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Mening Uyim - Smeta hisoboti\n`;
    csvContent += `Turi:;${isConst ? "Yangi Uy Qurilishi" : "Uyni Ta'mirlash (Remont)"}\n`;
    csvContent += `Maydoni:;${isConst ? cArea : rArea} m2\n`;
    csvContent += `Umumiy taxminiy summa:;${formatMoney(current.totalCost)}\n`;
    csvContent += `1 m2 narxi:;${formatMoney(current.perM2)}\n\n`;
    csvContent += `MATERIALLAR RO'YXATI\nNomi;Miqdori;Birligi\n`;
    current.materialsList.forEach((m) => {
      csvContent += `${m.name};${m.qty};${m.unit}\n`;
    });
    csvContent += `\nXARAJATLAR BO'LINISHI\nBo'lim;Summa;Ulush\n`;
    current.breakdown.forEach((b) => {
      csvContent += `${b.title};${formatMoney(b.amount)};${b.pct}%\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-8 py-6">
      {/* Sarlavha */}
      <div className="text-center max-w-3xl mx-auto flex flex-col gap-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mx-auto border border-blue-200 dark:border-blue-500/20">
          <CalcIcon size={14} />
          <span>Sodda & Keng Qamrovli Kalkulyator</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          Xarajatlarni Oson Hisoblang
        </h1>
        <p className="text-slate-500 text-sm sm:text-base">
          Kerakli yo&apos;nalishni tanlang: Yangi uy qurish smetasi yoki mavjud uyni ta&apos;mirlash (remont) xarajatlari.
        </p>
      </div>

      {/* 2 TA ASOSIY KATALOG KARTASI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto w-full">
        <button
          onClick={() => setActiveTab('construction')}
          className={`p-5 rounded-3xl border-2 text-left transition-all duration-300 flex items-start gap-4 ${
            activeTab === 'construction'
              ? 'border-blue-600 bg-white dark:bg-slate-900 shadow-xl shadow-blue-600/10 ring-4 ring-blue-600/10'
              : 'border-slate-200 dark:border-white/10 glass hover:border-slate-300'
          }`}
        >
          <div className={`p-3.5 rounded-2xl ${activeTab === 'construction' ? 'bg-blue-600 text-white' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600'}`}>
            <Building2 size={26} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-lg font-black text-slate-900 dark:text-white">1. Uy Qurilishi</span>
              {activeTab === 'construction' && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                  Faol
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Poydevordan tomgacha: g&apos;isht, sement, armatura, usta haqi va to&apos;liq smeta.
            </p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('renovation')}
          className={`p-5 rounded-3xl border-2 text-left transition-all duration-300 flex items-start gap-4 ${
            activeTab === 'renovation'
              ? 'border-blue-600 bg-white dark:bg-slate-900 shadow-xl shadow-blue-600/10 ring-4 ring-blue-600/10'
              : 'border-slate-200 dark:border-white/10 glass hover:border-slate-300'
          }`}
        >
          <div className={`p-3.5 rounded-2xl ${activeTab === 'renovation' ? 'bg-blue-600 text-white' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600'}`}>
            <Wrench size={26} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-lg font-black text-slate-900 dark:text-white">2. Uyni Ta&apos;mirlash (Remont)</span>
              {activeTab === 'renovation' && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                  Faol
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Kvartira yoki hovli remonti: pol, shift, devorlar, oboy, santexnika va usta haqi.
            </p>
          </div>
        </button>
      </div>

      {/* Shablonlar va Valyuta paneli */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass p-4 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Tayyor shablon:</span>
          {activeTab === 'construction' ? (
            <>
              <button onClick={() => applyConstructionPreset('compact')} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/5 hover:bg-blue-50 text-slate-700 dark:text-slate-300 hover:text-blue-600 transition shrink-0">
                🏡 80 m² (Ixcham)
              </button>
              <button onClick={() => applyConstructionPreset('family')} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/5 hover:bg-blue-50 text-slate-700 dark:text-slate-300 hover:text-blue-600 transition shrink-0">
                🏠 140 m² (Oila uchun)
              </button>
              <button onClick={() => applyConstructionPreset('cottage')} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/5 hover:bg-blue-50 text-slate-700 dark:text-slate-300 hover:text-blue-600 transition shrink-0">
                🏰 240 m² (2 qavatli kottej)
              </button>
            </>
          ) : (
            <>
              <button onClick={() => applyRenovationPreset('1room')} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/5 hover:bg-blue-50 text-slate-700 dark:text-slate-300 hover:text-blue-600 transition shrink-0">
                🏢 1 xonali (42 m²)
              </button>
              <button onClick={() => applyRenovationPreset('2room')} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/5 hover:bg-blue-50 text-slate-700 dark:text-slate-300 hover:text-blue-600 transition shrink-0">
                🏢 2 xonali (65 m²)
              </button>
              <button onClick={() => applyRenovationPreset('3room')} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/5 hover:bg-blue-50 text-slate-700 dark:text-slate-300 hover:text-blue-600 transition shrink-0">
                🏢 3 xonali (90 m²)
              </button>
              <button onClick={() => applyRenovationPreset('bathOnly')} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/5 hover:bg-blue-50 text-slate-700 dark:text-slate-300 hover:text-blue-600 transition shrink-0">
                🛁 Faqat vanna/hojatxona
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setCurrency('UZS')}
              className={`px-3 py-1 rounded-lg transition ${currency === 'UZS' ? 'bg-blue-600 text-white shadow' : 'text-slate-500'}`}
            >
              SO&apos;M
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1 rounded-lg transition ${currency === 'USD' ? 'bg-blue-600 text-white shadow' : 'text-slate-500'}`}
            >
              USD ($)
            </button>
          </div>

          <button
            onClick={downloadCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-emerald-50 text-slate-700 dark:text-slate-300 hover:text-emerald-600 text-xs font-bold transition"
            title="Excel formatida yuklab olish"
          >
            <FileSpreadsheet size={16} />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-blue-50 text-slate-700 dark:text-slate-300 hover:text-blue-600 text-xs font-bold transition"
            title="Chop etish"
          >
            <Printer size={16} />
            <span className="hidden sm:inline">Chop etish</span>
          </button>
        </div>
      </div>

      {/* Parametrlar & Smeta Natijasi */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Chap blok: Sozlamalar */}
        <div className="lg:col-span-7 glass p-6 sm:p-8 rounded-3xl flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="text-blue-600" size={20} />
              {activeTab === 'construction' ? 'Qurilish Parametrlari' : 'Ta\'mirlash Parametrlari'}
            </h2>
          </div>

          {activeTab === 'construction' ? (
            <div className="flex flex-col gap-6">
              {/* Maydon */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm font-bold text-slate-700 dark:text-slate-300">
                  <span>Umumiy maydon:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCArea(Math.max(30, cArea - 10))}
                      className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 flex items-center justify-center font-bold"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-2xl font-black text-blue-600 min-w-[80px] text-center">{cArea} m²</span>
                    <button
                      onClick={() => setCArea(Math.min(800, cArea + 10))}
                      className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 flex items-center justify-center font-bold"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min="30"
                  max="600"
                  step="5"
                  value={cArea}
                  onChange={(e) => setCArea(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Qavatlar soni */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Qavatlar soni</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setCFloors(f)}
                      className={`py-3 rounded-2xl text-xs font-bold border transition-all ${
                        cFloors === f
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10 text-blue-600 ring-2 ring-blue-600/20'
                          : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {f} {f === 1 ? 'qavat' : 'qavatli'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Devor materiali */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Devor materiali</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'brick', name: "Pishgan g'isht", desc: 'Mustahkam' },
                    { id: 'aerated', name: "Gazoblok", desc: 'Issiq, yengil' },
                    { id: 'cinder', name: "Shlakoblok", desc: 'Hamyonbop' },
                    { id: 'monolit', name: "Monolit beton", desc: 'Seysmik' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setCWallMaterial(m.id as any)}
                      className={`p-3 rounded-2xl text-left border transition-all ${
                        cWallMaterial === m.id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10 text-blue-600 ring-2 ring-blue-600/20'
                          : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="text-xs font-black">{m.name}</div>
                      <div className="text-[10px] text-slate-500">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pardozlash darajasi */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Pardozlash holati</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'rough', title: 'Korobka (Qora suvoq)', note: 'Poydevor, devor, tom' },
                    { id: 'standard', title: 'Standart (Tayyor)', note: 'Oqlangan, laminat, kafel' },
                    { id: 'premium', title: 'Premium (Lyuks)', note: 'Yevro-dizayn' },
                  ].map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCFinishLevel(q.id as any)}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        cFinishLevel === q.id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10 text-blue-600 ring-2 ring-blue-600/20'
                          : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="text-xs font-black">{q.title}</div>
                      <div className="text-[10px] text-slate-500">{q.note}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tom va Isitish */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tom qoplamasi</label>
                  <select
                    value={cRoofType}
                    onChange={(e) => setCRoofType(e.target.value)}
                    className="glass-input px-3.5 py-2.5 rounded-xl text-xs font-medium"
                  >
                    <option value="metal">Profnastil / Tunuka</option>
                    <option value="tile">Cherepitsa (Metall)</option>
                    <option value="soft">Yumshoq tom (Bitum)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Isitish tizimi</label>
                  <select
                    value={cHeating}
                    onChange={(e) => setCHeating(e.target.value)}
                    className="glass-input px-3.5 py-2.5 rounded-xl text-xs font-medium"
                  >
                    <option value="radiator">Oddiy radiatorlar</option>
                    <option value="floor">Issiq pol (Tyoply pol)</option>
                    <option value="combined">Kombinatsiyalangan</option>
                  </select>
                </div>
              </div>

              {/* Yerto'la */}
              <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cHasBasement}
                  onChange={(e) => setCHasBasement(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Yerto&apos;la (Podval) qo&apos;shish</div>
                  <div className="text-[11px] text-slate-500">Chuqur poydevor, beton quyish va gidroizolyatsiya</div>
                </div>
              </label>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Remont maydoni */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm font-bold text-slate-700 dark:text-slate-300">
                  <span>Ta&apos;mirlanadigan maydon:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRArea(Math.max(10, rArea - 5))}
                      className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 flex items-center justify-center font-bold"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-2xl font-black text-blue-600 min-w-[70px] text-center">{rArea} m²</span>
                    <button
                      onClick={() => setRArea(Math.min(500, rArea + 5))}
                      className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 flex items-center justify-center font-bold"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min="10"
                  max="350"
                  step="5"
                  value={rArea}
                  onChange={(e) => setRArea(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Toifa */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Ta&apos;mirlash toifasi</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'cosmetic', name: 'Kosmetik (Yuzaki)', desc: 'Oboy, bo\'yoq' },
                    { id: 'standard', name: 'Kapital ta\'mir', desc: 'Devor, pol to\'liq' },
                    { id: 'euro', name: 'Yevro / Dizayn', desc: 'Premium material' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setRType(item.id as any)}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        rType === item.id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10 text-blue-600 ring-2 ring-blue-600/20'
                          : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="text-xs font-black">{item.name}</div>
                      <div className="text-[10px] text-slate-500">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Devor, Pol, Shift */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Devor qoplamasi</label>
                  <select
                    value={rWallFinish}
                    onChange={(e) => setRWallFinish(e.target.value)}
                    className="glass-input px-3 py-2.5 rounded-xl text-xs font-medium"
                  >
                    <option value="wallpaper">Gulqog&apos;oz (Oboy)</option>
                    <option value="paint">Bo&apos;yoq / Emulsiya</option>
                    <option value="decorative">Dekorativ suvoq</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Pol qoplamasi</label>
                  <select
                    value={rFloorType}
                    onChange={(e) => setRFloorType(e.target.value)}
                    className="glass-input px-3 py-2.5 rounded-xl text-xs font-medium"
                  >
                    <option value="linoleum">Linoleum</option>
                    <option value="laminate">Laminat (33-klass)</option>
                    <option value="tile">Kafel / Granit</option>
                    <option value="parquet">Parket taxta</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Shift (Potolok)</label>
                  <select
                    value={rCeilingType}
                    onChange={(e) => setRCeilingType(e.target.value)}
                    className="glass-input px-3 py-2.5 rounded-xl text-xs font-medium"
                  >
                    <option value="plaster">Oddiy suvoq</option>
                    <option value="stretch">Natyajnoy</option>
                    <option value="drywall">Gipsokarton</option>
                  </select>
                </div>
              </div>

              {/* Santexnika, Elektr va Eshiklar */}
              <div className="flex flex-col gap-2.5 pt-1">
                <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rPlumbing}
                    onChange={(e) => setRPlumbing(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Santexnika va quvurlarni yangilash
                  </span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rElectric}
                    onChange={(e) => setRElectric(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Elektr simlari va rozetkalarni noldan o&apos;tkazish
                  </span>
                </label>

                <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-white/10">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Almashtiriladigan eshiklar soni:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRDoorsCount(Math.max(0, rDoorsCount - 1))}
                      className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 font-bold"
                    >
                      -
                    </button>
                    <span className="text-sm font-black w-6 text-center">{rDoorsCount}</span>
                    <button
                      onClick={() => setRDoorsCount(Math.min(15, rDoorsCount + 1))}
                      className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* O'ng blok: Natija va Smeta Tafsilotlari */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Asosiy xulosa */}
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-100">
                  {activeTab === 'construction' ? "Qurilishning Umumiy Smetasi" : "Ta'mirlashning Umumiy Smetasi"}
                </span>
                <div className="text-3xl sm:text-4xl font-black mt-1">
                  {formatMoney(current.totalCost)}
                </div>
              </div>
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                <CalcIcon size={24} />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] text-blue-100">1 m² uchun xarajat:</div>
                <div className="text-base font-bold mt-0.5">{formatMoney(current.perM2)}</div>
              </div>
              <div>
                <div className="text-[11px] text-blue-100 flex items-center gap-1">
                  <Clock size={12} />
                  <span>Taxminiy muddat:</span>
                </div>
                <div className="text-base font-bold mt-0.5">
                  {activeTab === 'construction'
                    ? `~${'buildDays' in current ? current.buildDays : 0} kun`
                    : `~${'renovDays' in current ? current.renovDays : 0} kun`}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/10 rounded-2xl p-2.5">
                <div className="text-blue-100 text-[10px]">Materiallar:</div>
                <div className="font-bold text-sm mt-0.5">{formatMoney(current.materialsSum)} (60%)</div>
              </div>
              <div className="bg-white/10 rounded-2xl p-2.5">
                <div className="text-blue-100 text-[10px]">Ustalar ish haqi:</div>
                <div className="font-bold text-sm mt-0.5">{formatMoney(current.laborSum)} (40%)</div>
              </div>
            </div>
          </div>

          {/* Aniq materiallar ro'yxati */}
          <div className="glass p-6 sm:p-7 rounded-3xl flex flex-col gap-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Hammer className="text-blue-600" size={18} />
                Zarur Materiallar Miqdori
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Fizik hisob-kitob</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {current.materialsList.map((m, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{m.icon}</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{m.name}</span>
                  </div>
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400 shrink-0">
                    {m.qty} {m.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Xarajatlar taqsimoti */}
          <div className="glass p-6 sm:p-7 rounded-3xl flex flex-col gap-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <PieChart className="text-blue-600" size={18} />
              Bosqichma-bosqich Xarajatlar
            </h3>

            <div className="space-y-3">
              {current.breakdown.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-400">{item.title}</span>
                    <span className="text-slate-900 dark:text-white font-bold">
                      {formatMoney(item.amount)} ({item.pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                    <div
                      className={`${item.color} h-full rounded-full transition-all duration-300`}
                      style={{ width: `${item.pct}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-white/10 grid grid-cols-2 gap-2.5">
              <Link
                href="/materials"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-3 rounded-xl text-center text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition"
              >
                <Hammer size={14} />
                <span>Materiallar do&apos;koni</span>
              </Link>
              <Link
                href="/workers"
                className="bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-800 dark:text-white font-bold py-2.5 px-3 rounded-xl text-center text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Compass size={14} />
                <span>Usta topish</span>
              </Link>
            </div>
          </div>

          {/* Eslatma */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2.5 leading-relaxed">
            <Info size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Maslahat:</strong> Qurilish va ta&apos;mirlash ishlarida doim kutilmagan qo&apos;shimcha xarajatlar uchun 
              kamida 5-10% moliyaviy zaxira saqlash tavsiya etiladi.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
