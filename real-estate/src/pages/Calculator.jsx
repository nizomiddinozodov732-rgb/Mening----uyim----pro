import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { 
  Calculator as CalcIcon, Building2, Wrench, Layers, 
  Download, Printer, Sparkles, Check, ChevronRight, 
  Info, PieChart, Hammer, Compass, DollarSign, 
  Plus, Minus, RefreshCw, FileSpreadsheet, Clock, Users,
  Sliders, ArrowUpRight, ShieldCheck
} from 'lucide-react'

export default function Calculator() {
  // Asosiy rejim: 'construction' (Uy qurish) yoki 'renovation' (Ta'mirlash)
  const [activeTab, setActiveTab] = useState('construction')
  const [currency, setCurrency] = useState('UZS') // 'UZS' | 'USD'
  const USD_RATE = 12850

  // ==========================================
  // 1. UY QURILISHI HOLATI (CONSTRUCTION)
  // ==========================================
  const [cArea, setCArea] = useState(120) // Maydon m²
  const [cFloors, setCFloors] = useState(1) // Qavatlar soni
  const [cWallMaterial, setCWallMaterial] = useState('brick') // 'brick' | 'aerated' | 'cinder' | 'monolit'
  const [cRoofType, setCRoofType] = useState('metal') // 'metal' | 'tile' | 'soft'
  const [cFinishLevel, setCFinishLevel] = useState('standard') // 'rough' (korobka) | 'standard' | 'premium'
  const [cHeating, setCHeating] = useState('floor') // 'radiator' | 'floor' | 'combined'
  const [cHasBasement, setCHasBasement] = useState(false)
  const [cCustomPriceMode, setCCustomPriceMode] = useState(false)

  // Material narxlari (tahrirlash mumkin)
  const [cPrices, setCPrices] = useState({
    brickPerUnit: 1200,      // 1 dona pishgan g'isht
    aeratedPerM3: 750000,    // 1 m³ gazoblok
    cementPerBag: 55000,     // 1 qop (50kg) sement
    rebarPerTon: 9500000,    // 1 tonna armatura
    sandPerTruck: 900000,    // 1 mashina qum
    roofPerSqm: 110000,      // 1 m² tom qoplamasi
    builderDailyRate: 250000 // 1 usta kunlik haqi
  })

  // ==========================================
  // 2. UYNI TA'MIRLASH HOLATI (RENOVATION)
  // ==========================================
  const [rArea, setRArea] = useState(65) // Maydon m²
  const [rType, setRType] = useState('standard') // 'cosmetic' | 'standard' | 'euro'
  const [rRooms, setRRooms] = useState(3)
  const [rWallFinish, setRWallFinish] = useState('wallpaper') // 'wallpaper' | 'paint' | 'decorative'
  const [rFloorType, setRFloorType] = useState('laminate') // 'linoleum' | 'laminate' | 'tile' | 'parquet'
  const [rCeilingType, setRCeilingType] = useState('stretch') // 'plaster' | 'stretch' | 'drywall'
  const [rPlumbing, setRPlumbing] = useState(true)
  const [rElectric, setRElectric] = useState(true)
  const [rDoorsCount, setRDoorsCount] = useState(4)

  // ==========================================
  // TEZKOR SHABLONLAR (PRESETS)
  // ==========================================
  const applyConstructionPreset = (preset) => {
    if (preset === 'compact') {
      setCArea(80)
      setCFloors(1)
      setCWallMaterial('brick')
      setCFinishLevel('standard')
      setCHasBasement(false)
    } else if (preset === 'family') {
      setCArea(140)
      setCFloors(1)
      setCWallMaterial('brick')
      setCFinishLevel('standard')
      setCHeating('floor')
      setCHasBasement(false)
    } else if (preset === 'cottage') {
      setCArea(240)
      setCFloors(2)
      setCWallMaterial('brick')
      setCFinishLevel('premium')
      setCRoofType('tile')
      setCHeating('combined')
      setCHasBasement(true)
    }
  }

  const applyRenovationPreset = (preset) => {
    if (preset === '1room') {
      setRArea(42)
      setRRooms(1)
      setRType('standard')
      setRDoorsCount(2)
    } else if (preset === '2room') {
      setRArea(65)
      setRRooms(2)
      setRType('standard')
      setRDoorsCount(4)
    } else if (preset === '3room') {
      setRArea(90)
      setRRooms(3)
      setRType('euro')
      setRDoorsCount(5)
    } else if (preset === 'bathOnly') {
      setRArea(12)
      setRRooms(1)
      setRType('standard')
      setRFloorType('tile')
      setRPlumbing(true)
      setRDoorsCount(1)
    }
  }

  // ==========================================
  // HISOBLASHLAR: UY QURILISHI (CONSTRUCTION)
  // ==========================================
  const constructionData = useMemo(() => {
    // 1 m² uchun poydevor va karkas bazasi
    let baseM2 = 3300000

    const wallMultiplier = {
      brick: 1.15,
      aerated: 1.05,
      cinder: 0.95,
      monolit: 1.25
    }[cWallMaterial] || 1.1

    const finishMultiplier = {
      rough: 0.65,    // faqat korobka, qora suvoq
      standard: 1.0,  // to'liq tayyor
      premium: 1.45   // yevro dizayn
    }[cFinishLevel] || 1.0

    const floorFactor = 1.0 + (cFloors - 1) * 0.12
    let perM2 = baseM2 * wallMultiplier * finishMultiplier * floorFactor

    // Tom va isitish qo'shimchalari
    if (cRoofType === 'tile') perM2 += 140000
    if (cRoofType === 'soft') perM2 += 90000
    if (cHeating === 'floor') perM2 += 180000
    if (cHeating === 'combined') perM2 += 250000

    let totalCost = perM2 * cArea
    if (cHasBasement) {
      totalCost += cArea * 1150000
    }

    // Materiallar miqdorini aniq fizik hisoblash
    // Masalan: 1 m² devor uchun ~55 ta g'isht (1.5 g'isht qalinlikda)
    const wallVolumeArea = cArea * 2.8 * (cFloors * 0.7) // devor yuzasi taxminiy m²
    const totalBricks = cWallMaterial === 'brick' ? Math.round(cArea * 260 * cFloors) : Math.round(cArea * 40 * cFloors)
    const cementBags = Math.round(cArea * 2.2 * cFloors + (cHasBasement ? cArea * 1.5 : 0))
    const rebarTons = Number(((cArea * 0.028 * cFloors) + (cHasBasement ? cArea * 0.015 : 0)).toFixed(1))
    const sandTrucks = Math.max(2, Math.round(cArea / 30 * cFloors))
    const roofArea = Math.round(cArea * 1.25)
    const timberM3 = Number((cArea * 0.065).toFixed(1))
    const buildDays = Math.round((cArea * 0.9 * cFloors) + (cFinishLevel === 'premium' ? 40 : 20))
    const workersCount = cArea > 200 ? 8 : cArea > 100 ? 5 : 4

    // Xarajatlar taqsimoti
    const foundation = totalCost * 0.18
    const wallsAndFrame = totalCost * 0.32
    const roofing = totalCost * 0.12
    const finishing = cFinishLevel === 'rough' ? totalCost * 0.08 : totalCost * 0.22
    const engineering = totalCost * 0.11
    const permitsAndTransport = totalCost * 0.05

    const materialsSum = totalCost * 0.62
    const laborSum = totalCost * 0.38

    return {
      perM2: Math.round(perM2),
      totalCost: Math.round(totalCost),
      materialsSum: Math.round(materialsSum),
      laborSum: Math.round(laborSum),
      buildDays,
      workersCount,
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
        { title: "Logistika va kutilmagan zaxira", amount: Math.round(permitsAndTransport), pct: 5, color: 'bg-gray-400' },
      ]
    }
  }, [cArea, cFloors, cWallMaterial, cRoofType, cFinishLevel, cHeating, cHasBasement])

  // ==========================================
  // HISOBLASHLAR: UYNI TA'MIRLASH (RENOVATION)
  // ==========================================
  const renovationData = useMemo(() => {
    const baseRates = {
      cosmetic: 950000,
      standard: 1800000,
      euro: 2950000
    }
    let perM2 = baseRates[rType] || 1800000

    if (rPlumbing) perM2 += 240000
    if (rElectric) perM2 += 200000

    // Shift
    if (rCeilingType === 'stretch') perM2 += 120000
    if (rCeilingType === 'drywall') perM2 += 210000

    // Pol
    if (rFloorType === 'laminate') perM2 += 140000
    if (rFloorType === 'tile') perM2 += 240000
    if (rFloorType === 'parquet') perM2 += 480000

    // Devor
    if (rWallFinish === 'decorative') perM2 += 180000

    // Eshiklar qo'shimchasi
    const doorsTotal = rDoorsCount * (rType === 'euro' ? 2200000 : 1300000)
    let totalCost = (perM2 * rArea) + doorsTotal

    // Materiallar sarfi
    const wallpaperRolls = Math.round((rArea * 2.8) / 5) // 0.53x10m rulonlar
    const paintLiters = Math.round(rArea * 0.7)
    const laminatePacks = Math.round((rArea * 1.08) / 2.2) // ~2.2 m² per pack
    const tileSqm = Math.round(rFloorType === 'tile' ? rArea * 1.1 : rArea * 0.25)
    const puttyBags = Math.round(rArea * 0.45) // shpaklyovka qoplari
    const socketsCount = Math.round(rArea * 0.4) // rozetkalar
    const renovDays = Math.round((rArea * 0.45) + (rType === 'euro' ? 25 : 15))
    const workersCount = rArea > 100 ? 4 : 2

    const demolition = totalCost * 0.08
    const plumbingElectric = totalCost * 0.22
    const wallsCeiling = totalCost * 0.36
    const flooring = totalCost * 0.22
    const cleaningTransport = totalCost * 0.12

    const materialsSum = totalCost * 0.58
    const laborSum = totalCost * 0.42

    return {
      perM2: Math.round(totalCost / rArea),
      totalCost: Math.round(totalCost),
      materialsSum: Math.round(materialsSum),
      laborSum: Math.round(laborSum),
      renovDays,
      workersCount,
      materialsList: [
        { name: rWallFinish === 'wallpaper' ? "Gulqog'oz (oboy) rulonlari" : "Devor bo'yog'i / emulsiya", qty: rWallFinish === 'wallpaper' ? wallpaperRolls : paintLiters, unit: rWallFinish === 'wallpaper' ? 'rulon' : 'litr', icon: '🎨' },
        { name: "Pol qoplamasi (laminat/kafel)", qty: laminatePacks, unit: 'pachka', icon: '🪵' },
        { name: "Shpaklyovka va quruq qorishmalar", qty: puttyBags, unit: 'qop', icon: '🧱' },
        { name: "Plitka va kafel yelimi", qty: Math.round(tileSqm * 0.5), unit: 'qop', icon: '🛁' },
        { name: "Rozetka va o'chirgichlar", qty: socketsCount, unit: 'dona', icon: '⚡' },
        { name: "Xonalararo eshiklar", qty: rDoorsCount, unit: 'dona', icon: '🚪' }
      ],
      breakdown: [
        { title: "Buzish va tozalash ishlari", amount: Math.round(demolition), pct: 8, color: 'bg-rose-500' },
        { title: "Santexnika va elektr montaji", amount: Math.round(plumbingElectric), pct: 22, color: 'bg-purple-500' },
        { title: "Devorlar va shift pardozlash", amount: Math.round(wallsCeiling), pct: 36, color: 'bg-blue-600' },
        { title: "Pol qoplamasi va plintuslar", amount: Math.round(flooring), pct: 22, color: 'bg-amber-500' },
        { title: "Chiqindi tashish va tozalash", amount: Math.round(cleaningTransport), pct: 12, color: 'bg-gray-400' },
      ]
    }
  }, [rArea, rType, rRooms, rWallFinish, rFloorType, rCeilingType, rPlumbing, rElectric, rDoorsCount])

  // Joriy faol hisob-kitob
  const current = activeTab === 'construction' ? constructionData : renovationData

  // Valyuta formatlash
  const formatMoney = (sum) => {
    if (currency === 'USD') {
      const usd = Math.round(sum / USD_RATE)
      return `$${usd.toLocaleString('en-US')}`
    }
    return `${sum.toLocaleString('uz-UZ')} so'm`
  }

  // CSV yuklab olish
  const downloadCSV = () => {
    const isConst = activeTab === 'construction'
    const title = isConst ? "Uy_Qurilishi_Smetasi" : "Uyni_Tamirlash_Smetasi"
    let csvContent = "data:text/csv;charset=utf-8,"
    csvContent += `Ko'chmas mulk smeta hisoboti - House Shop\n`
    csvContent += `Hisoblash turi:;${isConst ? "Yangi Uy Qurilishi" : "Uyni Ta'mirlash (Remont)"}\n`
    csvContent += `Umumiy maydoni:;${isConst ? cArea : rArea} m2\n`
    csvContent += `Umumiy taxminiy summa:;${formatMoney(current.totalCost)}\n`
    csvContent += `1 m2 uchun narx:;${formatMoney(current.perM2)}\n`
    csvContent += `Materiallar ulushi:;${formatMoney(current.materialsSum)}\n`
    csvContent += `Ustalar ish haqi:;${formatMoney(current.laborSum)}\n\n`
    csvContent += `KERAKLI MATERIALLAR RO'YXATI\nMaterial;Miqdori;Birligi\n`
    current.materialsList.forEach(m => {
      csvContent += `${m.name};${m.qty};${m.unit}\n`
    })
    csvContent += `\nXARAJATLAR TAQSIMOTI\nBo'lim;Summa;Ulush\n`
    current.breakdown.forEach(b => {
      csvContent += `${b.title};${formatMoney(b.amount)};${b.pct}%\n`
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${title}_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ========================================================= */}
        {/* YUQORI SARLAVHA VA IKKITA ASOSIY TANLOV KARTASI */}
        {/* ========================================================= */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-800">
            <CalcIcon className="h-4 w-4" />
            <span>Oddiy & Keng Qamrovli Smeta Kalkulyatori</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
            Xarajatlarni Oson Hisoblang
          </h1>
          <p className="text-gray-600 dark:text-slate-400 text-sm sm:text-base">
            O'zingizga kerakli bo'limni tanlang: Yangi uy qurish smetasi yoki mavjud xonadonni ta'mirlash (remont) xarajatlari.
          </p>
        </div>

        {/* 2 TA ASOSIY KATALOG TUGMASI (KATTA, SODDA, TUSHUNARLI) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {/* 1. UY QURILISHI KARTASI */}
          <button
            onClick={() => setActiveTab('construction')}
            className={`p-5 rounded-3xl border-2 text-left transition-all duration-300 relative overflow-hidden flex items-start gap-4 ${
              activeTab === 'construction'
                ? 'border-blue-600 bg-white dark:bg-slate-900 shadow-xl shadow-blue-600/10 ring-4 ring-blue-600/10'
                : 'border-gray-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:border-gray-300 dark:hover:border-slate-700'
            }`}
          >
            <div className={`p-3.5 rounded-2xl ${activeTab === 'construction' ? 'bg-blue-600 text-white' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600'}`}>
              <Building2 className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-gray-900 dark:text-white">1. Uy Qurilishi</span>
                {activeTab === 'construction' && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                    Faol
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Poydevordan to tomgacha: g'isht, sement, armatura, ustalar va to'liq smeta.
              </p>
            </div>
          </button>

          {/* 2. UYNI TA'MIRLASH KARTASI */}
          <button
            onClick={() => setActiveTab('renovation')}
            className={`p-5 rounded-3xl border-2 text-left transition-all duration-300 relative overflow-hidden flex items-start gap-4 ${
              activeTab === 'renovation'
                ? 'border-blue-600 bg-white dark:bg-slate-900 shadow-xl shadow-blue-600/10 ring-4 ring-blue-600/10'
                : 'border-gray-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:border-gray-300 dark:hover:border-slate-700'
            }`}
          >
            <div className={`p-3.5 rounded-2xl ${activeTab === 'renovation' ? 'bg-blue-600 text-white' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600'}`}>
              <Wrench className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-gray-900 dark:text-white">2. Uyni Ta'mirlash (Remont)</span>
                {activeTab === 'renovation' && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                    Faol
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Kvartira yoki hovli remonti: pol, shift, devorlar, oboy, santexnika va usta haqi.
              </p>
            </div>
          </button>
        </div>

        {/* Valyuta va tezkor eksport paneli */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
          {/* Tezkor shablonlar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0">Tayyor shablon:</span>
            {activeTab === 'construction' ? (
              <>
                <button onClick={() => applyConstructionPreset('compact')} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-slate-300 hover:text-blue-600 transition shrink-0">
                  🏡 80 m² (Ixcham)
                </button>
                <button onClick={() => applyConstructionPreset('family')} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-slate-300 hover:text-blue-600 transition shrink-0">
                  🏠 140 m² (Oila uchun)
                </button>
                <button onClick={() => applyConstructionPreset('cottage')} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-slate-300 hover:text-blue-600 transition shrink-0">
                  🏰 240 m² (2 qavatli kottej)
                </button>
              </>
            ) : (
              <>
                <button onClick={() => applyRenovationPreset('1room')} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-slate-300 hover:text-blue-600 transition shrink-0">
                  🏢 1 xonali (42 m²)
                </button>
                <button onClick={() => applyRenovationPreset('2room')} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-slate-300 hover:text-blue-600 transition shrink-0">
                  🏢 2 xonali (65 m²)
                </button>
                <button onClick={() => applyRenovationPreset('3room')} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-slate-300 hover:text-blue-600 transition shrink-0">
                  🏢 3 xonali (90 m²)
                </button>
                <button onClick={() => applyRenovationPreset('bathOnly')} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-slate-300 hover:text-blue-600 transition shrink-0">
                  🛁 Faqat vanna/hojatxona
                </button>
              </>
            )}
          </div>

          {/* Valyuta va fayl saqlash */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setCurrency('UZS')}
                className={`px-3 py-1 rounded-lg transition ${currency === 'UZS' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 dark:text-slate-400'}`}
              >
                SO'M
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-3 py-1 rounded-lg transition ${currency === 'USD' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 dark:text-slate-400'}`}
              >
                USD ($)
              </button>
            </div>

            <button
              onClick={downloadCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-700 dark:text-slate-300 hover:text-emerald-600 text-xs font-bold transition border border-transparent hover:border-emerald-200"
              title="Excel (CSV) formatida yuklab olish"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-slate-300 hover:text-blue-600 text-xs font-bold transition border border-transparent hover:border-blue-200"
              title="Chop etish yoki PDF qilib saqlash"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Chop etish</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ASOSIY QISM: PARAMETRLAR (CHAPDA) + SMETA NATIJASI (O'NGDA) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* CHAP USTUN: SOZLAMALAR */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200 dark:border-slate-800 space-y-6">
              
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
                <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-blue-600" />
                  <span>{activeTab === 'construction' ? "Qurilish Parametrlari" : "Ta'mirlash Parametrlari"}</span>
                </h2>
                <span className="text-xs font-semibold text-gray-500">
                  {activeTab === 'construction' ? "1/2-bosqich: Qurilish" : "1/2-bosqich: Remont"}
                </span>
              </div>

              {/* ---------------------------------------------------- */}
              {/* UY QURILISHI INPUTLARI */}
              {/* ---------------------------------------------------- */}
              {activeTab === 'construction' ? (
                <div className="space-y-6">
                  {/* Maydon (m²) */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-slate-300">
                        Umumiy maydon:
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCArea(Math.max(30, cArea - 10))}
                          className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700 dark:text-slate-200"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-2xl font-black text-blue-600 min-w-[80px] text-center">
                          {cArea} m²
                        </span>
                        <button
                          onClick={() => setCArea(Math.min(800, cArea + 10))}
                          className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700 dark:text-slate-200"
                        >
                          <Plus className="h-3.5 w-3.5" />
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
                      className="w-full h-2.5 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                      <span>30 m²</span>
                      <span>200 m²</span>
                      <span>600 m²</span>
                    </div>
                  </div>

                  {/* Qavatlar soni */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">
                      Qavatlar soni:
                    </label>
                    <div className="grid grid-cols-4 gap-2.5">
                      {[1, 2, 3, 4].map(f => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setCFloors(f)}
                          className={`py-3 rounded-2xl border text-sm font-bold transition-all ${
                            cFloors === f
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-600 ring-2 ring-blue-600/20'
                              : 'border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 hover:border-gray-300'
                          }`}
                        >
                          {f} {f === 1 ? 'qavat' : 'qavatli'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Asosiy devor materiali */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">
                      Devor materiali:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { id: 'brick', name: "Pishgan g'isht", desc: 'Klassik, mustahkam' },
                        { id: 'aerated', name: "Gazoblok", desc: 'Issiq, yengil' },
                        { id: 'cinder', name: "Shlakoblok", desc: 'Eng tejamkor' },
                        { id: 'monolit', name: "Monolit beton", desc: 'Yuqori seysmik' }
                      ].map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setCWallMaterial(item.id)}
                          className={`p-3 rounded-2xl border text-left transition-all ${
                            cWallMaterial === item.id
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300 ring-2 ring-blue-600/20'
                              : 'border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-xs font-black">{item.name}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">{item.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Qurilish holati / Pardozlash */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">
                      Topshirish holati (Pardozlash darajasi):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        { id: 'rough', title: 'Korobka (Qora suvoq)', note: 'Foydali: poydevor, devor, tom' },
                        { id: 'standard', title: 'Standart (To\'liq tayyor)', note: 'Oqlangan, laminat, santexnika' },
                        { id: 'premium', title: 'Premium (Lyuks)', note: 'Yevro-ta\'mir, import material' }
                      ].map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setCFinishLevel(item.id)}
                          className={`p-3.5 rounded-2xl border text-left transition-all ${
                            cFinishLevel === item.id
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-600/20'
                              : 'border-gray-200 dark:border-slate-800 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-xs font-black text-gray-900 dark:text-white">{item.title}</div>
                          <div className="text-[11px] text-gray-500 mt-1">{item.note}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tom va Isitish */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                        Tom qoplamasi:
                      </label>
                      <select
                        value={cRoofType}
                        onChange={(e) => setCRoofType(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      >
                        <option value="metal">Profnastil / Tunuka</option>
                        <option value="tile">Cherepitsa (Metall)</option>
                        <option value="soft">Yumshoq tom (Bitum)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                        Isitish tizimi:
                      </label>
                      <select
                        value={cHeating}
                        onChange={(e) => setCHeating(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      >
                        <option value="radiator">Oddiy radiatorlar</option>
                        <option value="floor">To'liq issiq pol (Tyoply pol)</option>
                        <option value="combined">Kombinatsiyalangan tizim</option>
                      </select>
                    </div>
                  </div>

                  {/* Yerto'la */}
                  <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cHasBasement}
                      onChange={(e) => setCHasBasement(e.target.checked)}
                      className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-gray-900 dark:text-white">Yerto'la (Podval) qo'shish</div>
                      <div className="text-[11px] text-gray-500">Chuqur poydevor, beton quyish va gidroizolyatsiya</div>
                    </div>
                  </label>
                </div>
              ) : (
                /* ---------------------------------------------------- */
                /* UYNI TA'MIRLASH (RENOVATION) INPUTLARI */
                /* ---------------------------------------------------- */
                <div className="space-y-6">
                  {/* Maydon (m²) */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-slate-300">
                        Ta'mirlanadigan maydon:
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setRArea(Math.max(10, rArea - 5))}
                          className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700 dark:text-slate-200"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-2xl font-black text-blue-600 min-w-[70px] text-center">
                          {rArea} m²
                        </span>
                        <button
                          onClick={() => setRArea(Math.min(500, rArea + 5))}
                          className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700 dark:text-slate-200"
                        >
                          <Plus className="h-3.5 w-3.5" />
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
                      className="w-full h-2.5 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                      <span>10 m²</span>
                      <span>150 m²</span>
                      <span>350 m²</span>
                    </div>
                  </div>

                  {/* Ta'mirlash toifasi */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">
                      Ta'mirlash toifasi:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        { id: 'cosmetic', name: 'Kosmetik (Yuzaki)', desc: 'Oboy, bo\'yoq, yengil yangilash' },
                        { id: 'standard', name: 'Kapital ta\'mirlash', desc: 'Devor, pol tekislash, yangi jihozlar' },
                        { id: 'euro', name: 'Yevro / Dizaynerlik', desc: 'Premium materiallar, 3D dizayn' }
                      ].map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setRType(item.id)}
                          className={`p-3.5 rounded-2xl border text-left transition-all ${
                            rType === item.id
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-600/20'
                              : 'border-gray-200 dark:border-slate-800 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-xs font-black text-gray-900 dark:text-white">{item.name}</div>
                          <div className="text-[10px] text-gray-500 mt-1">{item.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Devor, Pol va Shift */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                        Devor qoplamasi:
                      </label>
                      <select
                        value={rWallFinish}
                        onChange={(e) => setRWallFinish(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="wallpaper">Gulqog'oz (Oboy)</option>
                        <option value="paint">Bo'yoq / Emulsiya</option>
                        <option value="decorative">Dekorativ suvoq (Venetsiyanka)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                        Pol qoplamasi:
                      </label>
                      <select
                        value={rFloorType}
                        onChange={(e) => setRFloorType(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="linoleum">Linoleum</option>
                        <option value="laminate">Laminat (33-klass)</option>
                        <option value="tile">Kafel / Keramogranit</option>
                        <option value="parquet">Parket taxta</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                        Shift (Potolok):
                      </label>
                      <select
                        value={rCeilingType}
                        onChange={(e) => setRCeilingType(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="plaster">Oddiy suvoq va bo'yoq</option>
                        <option value="stretch">Natyajnoy (Cho'ziluvchan)</option>
                        <option value="drywall">Gipsokarton (Ko'p bosqichli)</option>
                      </select>
                    </div>
                  </div>

                  {/* Muhandislik tarmoqlari & Eshiklar */}
                  <div className="space-y-2.5 pt-1">
                    <label className="flex items-center gap-3 p-3 rounded-2xl border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rPlumbing}
                        onChange={(e) => setRPlumbing(e.target.checked)}
                        className="h-5 w-5 text-blue-600 rounded border-gray-300"
                      />
                      <span className="text-xs font-bold text-gray-800 dark:text-slate-200">
                        Santexnika va kanalizatsiya quvurlarini yangilash
                      </span>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-2xl border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rElectric}
                        onChange={(e) => setRElectric(e.target.checked)}
                        className="h-5 w-5 text-blue-600 rounded border-gray-300"
                      />
                      <span className="text-xs font-bold text-gray-800 dark:text-slate-200">
                        Elektr simlari, avtomat shchit va rozetkalarni noldan montaj qilish
                      </span>
                    </label>

                    <div className="flex items-center justify-between p-3 rounded-2xl border border-gray-200 dark:border-slate-800">
                      <span className="text-xs font-bold text-gray-800 dark:text-slate-200">
                        Almashtiriladigan eshiklar soni:
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setRDoorsCount(Math.max(0, rDoorsCount - 1))}
                          className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-slate-800 font-bold"
                        >
                          -
                        </button>
                        <span className="text-sm font-black w-6 text-center">{rDoorsCount}</span>
                        <button
                          onClick={() => setRDoorsCount(Math.min(15, rDoorsCount + 1))}
                          className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-slate-800 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* O'NG USTUN: NATIJA VA SMETA TAFSILOTLARI */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* 1. ASOSIY XULOSA KARTASI (TOTAL CARD) */}
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
                  <CalcIcon className="h-6 w-6 text-white" />
                </div>
              </div>

              {/* 1 m2 narxi va muddat */}
              <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] text-blue-100">1 m² uchun xarajat:</div>
                  <div className="text-base font-bold mt-0.5">{formatMoney(current.perM2)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-blue-100 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Taxminiy muddat:</span>
                  </div>
                  <div className="text-base font-bold mt-0.5">
                    {activeTab === 'construction' ? `~${current.buildDays} kun` : `~${current.renovDays} kun`}
                  </div>
                </div>
              </div>

              {/* Material vs Labor */}
              <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/10 rounded-2xl p-2.5">
                  <div className="text-blue-100 text-[10px]">Materiallar xarajati:</div>
                  <div className="font-bold text-sm mt-0.5">{formatMoney(current.materialsSum)} (60%)</div>
                </div>
                <div className="bg-white/10 rounded-2xl p-2.5">
                  <div className="text-blue-100 text-[10px]">Ustalar ish haqi:</div>
                  <div className="font-bold text-sm mt-0.5">{formatMoney(current.laborSum)} (40%)</div>
                </div>
              </div>
            </div>

            {/* 2. ANIQLANGAN MATERIALLAR MIQDORI (MATERIAL LIST) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-200 dark:border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Hammer className="h-4 w-4 text-blue-600" />
                  <span>Zarur Materiallar Miqdori</span>
                </span>
                <span className="text-[11px] text-gray-400 font-normal">Fizik hisob-kitob</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {current.materialsList.map((m, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{m.icon}</span>
                      <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">{m.name}</span>
                    </div>
                    <span className="text-xs font-black text-blue-600 dark:text-blue-400 shrink-0">
                      {m.qty} {m.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. XARAJATLAR TAQSIMOTI (SMETA BO'LIMLARI) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-200 dark:border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <PieChart className="h-4 w-4 text-blue-600" />
                <span>Bosqichma-bosqich Xarajatlar</span>
              </h3>

              <div className="space-y-3">
                {current.breakdown.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-600 dark:text-slate-400">{item.title}</span>
                      <span className="text-gray-900 dark:text-white font-bold">
                        {formatMoney(item.amount)} ({item.pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`${item.color} h-full rounded-full transition-all duration-300`}
                        style={{ width: `${item.pct}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Aloqa / Xarid tugmalari */}
              <div className="pt-4 border-t border-gray-100 dark:border-slate-800 grid grid-cols-2 gap-2.5">
                <Link
                  to="/construction-materials"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-3 rounded-xl text-center text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition"
                >
                  <Hammer className="h-3.5 w-3.5" />
                  <span>Materiallar sotib olish</span>
                </Link>
                <Link
                  to="/architects"
                  className="bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-white font-bold py-2.5 px-3 rounded-xl text-center text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>Usta & Arxitektor topish</span>
                </Link>
              </div>
            </div>

            {/* Eslatma */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5 leading-relaxed">
              <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Maslahat:</strong> Qurilish va ta'mirlash ishlarida doim kutilmagan qo'shimcha xarajatlar uchun 
                kamida 5-10% moliyaviy zaxira saqlash tavsiya etiladi.
              </span>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
