import React, { useState, useMemo } from 'react';
import { DacRequest, DacType, SelloType } from '../types';
import { 
  BarChart2, 
  Filter, 
  RefreshCw, 
  ShieldCheck, 
  Folder, 
  Download, 
  ChevronRight, 
  Building,
  User,
  AlertTriangle
} from 'lucide-react';

interface PowerBiMockupProps {
  dacs: DacRequest[];
  onSelectDac?: (id: string) => void;
}

export default function PowerBiMockup({ dacs, onSelectDac }: PowerBiMockupProps) {
  // Power BI Embedded Mockup Interactive Slicers State
  const [pbiDivision, setPbiDivision] = useState<string>('ALL');
  const [pbiGerencia, setPbiGerencia] = useState<string>('ALL');
  const [pbiType, setPbiType] = useState<string>('ALL');
  const [pbiCriticidad, setPbiCriticidad] = useState<string>('ALL');
  const [pbiPage, setPbiPage] = useState<number>(1);

  // Helper to determine Seal status based on the DAC process stage
  const getDacSealByStage = (dac: DacRequest): SelloType => {
    // If the state is closed, approved by gerencia or resultado licitacion aprobado, it's Verde
    if (dac.state === 'RESULTADO LICITACIÓN APROBADO' || dac.state === 'APROBADO POR GERENCIA' || dac.state === 'CERRADO') {
      return 'Verde';
    }
    // If the state is in retest or retest aprobado, it is Amarillo
    if (dac.state === 'EN EJECUCIÓN TÉCNICA' || dac.state === 'EN RETEST' || dac.state === 'RETEST APROBADO') {
      return 'Amarillo';
    }
    // If the state is brechas identificadas, en corrección, devuelto para corrección or rechazado, it is Rojo
    if (dac.state === 'BRECHAS IDENTIFICADAS' || dac.state === 'EN CORRECCIÓN' || dac.state === 'DEVUELTO PARA CORRECCIÓN' || dac.state === 'RECHAZADO') {
      return 'Rojo';
    }
    // Early stages are Pendiente
    return 'Pendiente';
  };

  // Power BI Filtered Data & KPIs
  const pbiFilteredDacs = useMemo(() => {
    return dacs.filter(dac => {
      // Filter by Division
      const matchesDivision = pbiDivision === 'ALL' || (() => {
        const divLower = pbiDivision.toLowerCase();
        
        // Prefer explicit division field if present
        if (dac.division) {
          return dac.division.toLowerCase() === divLower;
        }
        
        // Direct matching check for legacy mock IDs
        if (dac.id === '20260001' && divLower === 'corporativa') return true;
        if (dac.id === 'L-20260002' && divLower === 'chuquicamata') return true;
        if (dac.id === '20260003' && divLower === 'el teniente') return true;
        if (dac.id === '20260004' && divLower === 'andina') return true;

        // General search in text fields
        const textToSearch = `${dac.projectName} ${dac.justification} ${dac.description}`.toLowerCase();
        return textToSearch.includes(divLower);
      })();

      // Filter by Gerencia
      const matchesGerencia = pbiGerencia === 'ALL' || (() => {
        const gLower = pbiGerencia.toLowerCase();
        
        // Prefer explicit gerencia field if present
        if (dac.gerencia) {
          return dac.gerencia.toLowerCase() === gLower || dac.gerencia.toLowerCase().includes(gLower);
        }
        
        if (dac.id === '20260001') return gLower.includes('ti');
        if (dac.id === 'L-20260002') return gLower.includes('ti') || gLower.includes('ciberseguridad');
        if (dac.id === '20260003') return gLower.includes('operaciones') || gLower.includes('proyectos');
        if (dac.id === '20260004') return gLower.includes('abastecimiento');
        if (dac.id === '20260005') return gLower.includes('operaciones') || gLower.includes('ciberseguridad');
        
        const textToSearch = `${dac.projectName} ${dac.justification} ${dac.jpCargo} ${dac.description}`.toLowerCase();
        if (gLower.includes('ti') && (textToSearch.includes('ti ') || textToSearch.includes('tecnología') || textToSearch.includes('erp') || textToSearch.includes('backup') || textToSearch.includes('cloud') || textToSearch.includes('infraestructura'))) return true;
        if (gLower.includes('ciberseguridad') && (textToSearch.includes('ciberseguridad') || textToSearch.includes('seguridad') || textToSearch.includes('hack') || textToSearch.includes('scada'))) return true;
        if (gLower.includes('operaciones') && (textToSearch.includes('operación') || textToSearch.includes('taludes') || textToSearch.includes('concentradora') || textToSearch.includes('planta') || textToSearch.includes('scada'))) return true;
        if (gLower.includes('abastecimiento') && (textToSearch.includes('abastecimiento') || textToSearch.includes('proveedor') || textToSearch.includes('compras') || textToSearch.includes('licitaci'))) return true;
        if (gLower.includes('proyectos') && (textToSearch.includes('proyecto') || textToSearch.includes('implementación'))) return true;
        return false;
      })();

      // Filter by Type
      const matchesType = pbiType === 'ALL' || dac.type === pbiType;

      // Filter by Criticidad
      const matchesCriticidad = pbiCriticidad === 'ALL' || dac.criticidad.toUpperCase() === pbiCriticidad.toUpperCase();

      return matchesDivision && matchesGerencia && matchesType && matchesCriticidad;
    });
  }, [dacs, pbiDivision, pbiGerencia, pbiType, pbiCriticidad]);

  const pbiStats = useMemo(() => {
    const total = pbiFilteredDacs.length;
    const licitaciones = pbiFilteredDacs.filter(d => d.type === 'Licitación').length;
    const operacionImplementacion = pbiFilteredDacs.filter(d => d.type !== 'Licitación').length;
    
    // Severity breakdown
    const critical = pbiFilteredDacs.filter(d => d.criticidad.toUpperCase() === 'CRÍTICO' || d.criticidad.toUpperCase() === 'CRÍTICA').length;
    const high = pbiFilteredDacs.filter(d => d.criticidad.toUpperCase() === 'ALTO' || d.criticidad.toUpperCase() === 'ALTA').length;
    const medium = pbiFilteredDacs.filter(d => d.criticidad.toUpperCase() === 'MEDIO' || d.criticidad.toUpperCase() === 'MEDIA').length;
    const low = pbiFilteredDacs.filter(d => d.criticidad.toUpperCase() === 'BAJO' || d.criticidad.toUpperCase() === 'BAJA').length;

    // Seals breakdown
    const sealGreen = pbiFilteredDacs.filter(d => getDacSealByStage(d) === 'Verde').length;
    const sealYellow = pbiFilteredDacs.filter(d => getDacSealByStage(d) === 'Amarillo').length;
    const sealRed = pbiFilteredDacs.filter(d => getDacSealByStage(d) === 'Rojo').length;
    const sealPending = pbiFilteredDacs.filter(d => getDacSealByStage(d) === 'Pendiente').length;

    // Sum estimated budget of filtered DACs
    const totalBudget = pbiFilteredDacs.reduce((sum, d) => sum + (d.budgetEstimate || 0), 0);

    return {
      total,
      licitaciones,
      operacionImplementacion,
      critical,
      high,
      medium,
      low,
      sealGreen,
      sealYellow,
      sealRed,
      sealPending,
      totalBudget
    };
  }, [pbiFilteredDacs]);

  return (
    <div className="border border-gray-300 rounded-sm shadow-xl overflow-hidden bg-gray-100 flex flex-col font-sans" id="pbi-embedded-canvas">
      {/* Power BI Fake Ribbon Header */}
      <div className="bg-[#f3f2f1] border-b border-gray-300 px-4 py-3 flex flex-wrap gap-2 items-center justify-between text-xs select-none">
        <div className="flex items-center space-x-3">
          <div className="bg-[#f2c811] text-black font-extrabold px-2 py-1 rounded-sm text-center text-xs leading-none shrink-0 shadow-sm">
            PBI
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-800 tracking-tight leading-none text-xs sm:text-sm uppercase">Power BI Embedded - Reportería DAC</p>
            <p className="text-[9px] text-gray-500 font-semibold leading-none mt-1">Sello de Ciberseguridad Industrial Codelco • Prototipo de Exhibición Interactivo</p>
          </div>
        </div>

        {/* Power BI Action Bar */}
        <div className="flex items-center space-x-3 text-gray-600 font-semibold text-[11px]">
          <button 
            onClick={() => {
              setPbiDivision('ALL');
              setPbiGerencia('ALL');
              setPbiType('ALL');
              setPbiCriticidad('ALL');
            }} 
            className="hover:bg-gray-200 p-1.5 rounded-sm flex items-center space-x-1 border border-gray-300 bg-white cursor-pointer focus:outline-none text-[10px]"
            title="Restablecer todos los filtros"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restablecer</span>
          </button>
        </div>
      </div>

      {/* Power BI Workspace */}
      <div className="flex flex-col min-h-[500px] bg-[#eae9e8]" id="pbi-workspace-container">
        {/* Ultra-Compact Symmetrical Filter Bar */}
        <div className="bg-white border-b border-gray-300 py-1.5 px-3 shadow-sm flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
          {/* Title / Label */}
          <div className="flex items-center space-x-1.5 text-gray-500 font-extrabold uppercase text-[9px] tracking-wider md:border-r md:border-gray-200 md:pr-3 shrink-0">
            <Filter className="w-3.5 h-3.5 text-cobre shrink-0" />
            <span>Filtros</span>
          </div>

          {/* 4 Homogeneous Dropdowns Distributed Evenly in a single row on larger screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 w-full flex-1">
            {/* Slicer 1: Division Codelco */}
            <div className="flex items-center space-x-2 bg-gray-50 px-2 py-1 rounded border border-gray-200">
              <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider shrink-0">
                División:
              </label>
              <select
                value={pbiDivision}
                onChange={(e) => setPbiDivision(e.target.value)}
                className="bg-white border border-gray-300 rounded px-2 py-1 text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#f2c811] focus:border-[#f2c811] flex-1 min-w-0"
              >
                <option value="ALL">🏢 Todas</option>
                <option value="Corporativa">🏢 Corp. (Casa Matriz)</option>
                <option value="El Teniente">⛏️ El Teniente</option>
                <option value="Chuquicamata">🌋 Chuquicamata</option>
                <option value="Radomiro Tomic">🚜 R. Tomic</option>
                <option value="Ministro Hales">🏭 M. Hales</option>
                <option value="Andina">❄️ Andina</option>
                <option value="Salvador">☀️ Salvador</option>
                <option value="Gabriela Mistral">🏜️ G. Mistral</option>
              </select>
            </div>

            {/* Slicer 2: Gerencia */}
            <div className="flex items-center space-x-2 bg-gray-50 px-2 py-1 rounded border border-gray-200">
              <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider shrink-0">
                Gerencia:
              </label>
              <select
                value={pbiGerencia}
                onChange={(e) => setPbiGerencia(e.target.value)}
                className="bg-white border border-gray-300 rounded px-2 py-1 text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#f2c811] focus:border-[#f2c811] flex-1 min-w-0"
              >
                <option value="ALL">📁 Todas</option>
                <option value="Gerencia de TI">💻 G. TI</option>
                <option value="Gerencia de Ciberseguridad">🛡️ G. Ciberseguridad</option>
                <option value="Gerencia de Operaciones">⚙️ G. Operaciones</option>
                <option value="Gerencia de Abastecimiento">📦 G. Abastecimiento</option>
                <option value="Gerencia de Proyectos">📐 G. Proyectos</option>
              </select>
            </div>

            {/* Slicer 3: Tipo Proceso */}
            <div className="flex items-center space-x-2 bg-gray-50 px-2 py-1 rounded border border-gray-200">
              <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider shrink-0">
                Proceso:
              </label>
              <select
                value={pbiType}
                onChange={(e) => setPbiType(e.target.value)}
                className="bg-white border border-gray-300 rounded px-2 py-1 text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#f2c811] focus:border-[#f2c811] flex-1 min-w-0"
              >
                <option value="ALL">⚡ Todos</option>
                <option value="Licitación">⚖️ Licitación</option>
                <option value="Implementación">🛠️ Implementación</option>
                <option value="Renovación">🔄 Renovación</option>
              </select>
            </div>

            {/* Slicer 4: Criticidad */}
            <div className="flex items-center space-x-2 bg-gray-50 px-2 py-1 rounded border border-gray-200">
              <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider shrink-0">
                Criticidad:
              </label>
              <select
                value={pbiCriticidad}
                onChange={(e) => setPbiCriticidad(e.target.value)}
                className="bg-white border border-gray-300 rounded px-2 py-1 text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#f2c811] focus:border-[#f2c811] flex-1 min-w-0"
              >
                <option value="ALL">📋 Todas</option>
                <option value="Crítico">🔴 Crítico</option>
                <option value="Alto">🟠 Alto</option>
                <option value="Medio">🟡 Medio</option>
                <option value="Bajo">🟢 Bajo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Canvas Area: Power BI Visualizations dashboard (Spans full width now) */}
        <div className="p-5 flex flex-col justify-between flex-1">
          
          {/* PAGE 1: RESUMEN GENERAL */}
          {pbiPage === 1 && (
            <div className="space-y-5 flex-1">
              
              {/* KPI Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* KPI 1: DACs Totales */}
                <div className="bg-white border border-gray-200 p-4 rounded-xs shadow-xs text-center relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-[#f2c811]"></div>
                  <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">Total DAC</span>
                  <span className="text-3xl font-extrabold text-gray-800 font-display block mt-1">
                    {pbiStats.total}
                  </span>
                  <span className="text-[9px] text-emerald-600 block font-semibold mt-0.5">Sincronizado</span>
                </div>

                {/* KPI 2: DACs Licitaciones */}
                <div className="bg-white border border-gray-200 p-4 rounded-xs shadow-xs text-center relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-azul"></div>
                  <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">Por Licitación</span>
                  <span className="text-3xl font-extrabold text-azul font-display block mt-1">
                    {pbiStats.licitaciones}
                  </span>
                  <span className="text-[9px] text-gray-400 block font-semibold mt-0.5">Licitaciones</span>
                </div>

                {/* KPI 3: DACs Operación & Implementación */}
                <div className="bg-white border border-gray-200 p-4 rounded-xs shadow-xs text-center relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-cobre"></div>
                  <span className="text-[8px] sm:text-[9px] text-gray-400 uppercase font-bold tracking-wider block">Operación / Implementación</span>
                  <span className="text-3xl font-extrabold text-cobre font-display block mt-1">
                    {pbiStats.operacionImplementacion}
                  </span>
                  <span className="text-[9px] text-gray-400 block font-semibold mt-0.5">Operación e Implementación</span>
                </div>
              </div>

              {/* Middle row: Multi-Visualizations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Visual: Bar Chart of DACs by Division */}
                <div className="bg-white border border-gray-200 rounded-xs p-4 shadow-xs">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-3">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-tight">Solicitudes DAC por División Codelco</span>
                  </div>

                  <div className="space-y-2.5 pt-1 overflow-y-auto max-h-[175px] pr-1">
                    {[
                      { name: 'Corporativa / TI', key: 'Corporativa', color: 'bg-azul' },
                      { name: 'Div. Chuquicamata', key: 'Chuquicamata', color: 'bg-cobre' },
                      { name: 'Div. Radomiro Tomic', key: 'Radomiro Tomic', color: 'bg-[#4f46e5]' },
                      { name: 'Div. Ministro Hales', key: 'Ministro Hales', color: 'bg-[#06b6d4]' },
                      { name: 'Div. Salvador', key: 'Salvador', color: 'bg-[#10b981]' },
                      { name: 'Div. Andina', key: 'Andina', color: 'bg-amber-500' },
                      { name: 'Div. El Teniente', key: 'El Teniente', color: 'bg-verde-petroleo' },
                      { name: 'Div. Gabriela Mistral', key: 'Gabriela Mistral', color: 'bg-[#ec4899]' }
                    ].map((div) => {
                      const currentCount = pbiFilteredDacs.filter(d => {
                        if (!d.division) return false;
                        return d.division.toLowerCase() === div.key.toLowerCase();
                      }).length;

                      const percentage = pbiStats.total > 0 ? (currentCount / pbiStats.total) * 100 : 0;

                      return (
                        <div key={div.key} className="space-y-0.5">
                          <div className="flex justify-between text-[10px] font-semibold text-gray-600">
                            <span>{div.name}</span>
                            <span>{currentCount} DACs ({percentage.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2.5 rounded-sm overflow-hidden flex">
                            <div
                              className={`${div.color} h-full rounded-sm transition-all duration-500`}
                              style={{ width: `${Math.max(4, percentage)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Visual: Stacked Bar Chart of Sellos DAC por Gerencia */}
                <div className="bg-white border border-gray-200 rounded-xs p-4 shadow-xs">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-3">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-tight">Distribución de Sellos DAC por Gerencia</span>
                    <span className="text-[9px] text-gray-400 italic">Estatus por Gerencia</span>
                  </div>

                  <div className="space-y-2.5 pt-1 overflow-y-auto max-h-[175px] pr-1 font-sans">
                    {[
                      { name: 'G. TI', key: 'Gerencia de TI' },
                      { name: 'G. Ciberseguridad', key: 'Gerencia de Ciberseguridad' },
                      { name: 'G. Operaciones', key: 'Gerencia de Operaciones' },
                      { name: 'G. Abastecimiento', key: 'Gerencia de Abastecimiento' },
                      { name: 'G. Proyectos', key: 'Gerencia de Proyectos' }
                    ].map((ger) => {
                      const belongsToGerencia = (dac: any, gerenciaKey: string) => {
                        const gLower = gerenciaKey.toLowerCase();
                        if (dac.gerencia) {
                          return dac.gerencia.toLowerCase() === gLower || dac.gerencia.toLowerCase().includes(gLower);
                        }
                        if (dac.id === '20260001') return gLower.includes('ti');
                        if (dac.id === 'L-20260002') return gLower.includes('ti') || gLower.includes('ciberseguridad');
                        if (dac.id === '20260003') return gLower.includes('operaciones') || gLower.includes('proyectos');
                        if (dac.id === '20260004') return gLower.includes('abastecimiento');
                        if (dac.id === '20260005') return gLower.includes('operaciones') || gLower.includes('ciberseguridad');
                        
                        const textToSearch = `${dac.projectName} ${dac.justification} ${dac.jpCargo} ${dac.description}`.toLowerCase();
                        if (gLower.includes('ti') && (textToSearch.includes('ti ') || textToSearch.includes('tecnología') || textToSearch.includes('erp') || textToSearch.includes('backup') || textToSearch.includes('cloud') || textToSearch.includes('infraestructura'))) return true;
                        if (gLower.includes('ciberseguridad') && (textToSearch.includes('ciberseguridad') || textToSearch.includes('seguridad') || textToSearch.includes('hack') || textToSearch.includes('scada'))) return true;
                        if (gLower.includes('operaciones') && (textToSearch.includes('operación') || textToSearch.includes('taludes') || textToSearch.includes('concentradora') || textToSearch.includes('planta') || textToSearch.includes('scada'))) return true;
                        if (gLower.includes('abastecimiento') && (textToSearch.includes('abastecimiento') || textToSearch.includes('proveedor') || textToSearch.includes('compras') || textToSearch.includes('licitaci'))) return true;
                        if (gLower.includes('proyectos') && (textToSearch.includes('proyecto') || textToSearch.includes('implementación'))) return true;
                        return false;
                      };

                      const gerDacs = pbiFilteredDacs.filter(d => belongsToGerencia(d, ger.key));
                      const total = gerDacs.length;
                      
                      const green = gerDacs.filter(d => getDacSealByStage(d) === 'Verde').length;
                      const yellow = gerDacs.filter(d => getDacSealByStage(d) === 'Amarillo').length;
                      const red = gerDacs.filter(d => getDacSealByStage(d) === 'Rojo').length;
                      const pending = gerDacs.filter(d => getDacSealByStage(d) === 'Pendiente').length;

                      const pctG = total > 0 ? (green / total) * 100 : 0;
                      const pctY = total > 0 ? (yellow / total) * 100 : 0;
                      const pctR = total > 0 ? (red / total) * 100 : 0;
                      const pctP = total > 0 ? (pending / total) * 100 : 0;

                      return (
                        <div key={ger.key} className="space-y-1 pb-1 border-b border-gray-50 last:border-0">
                          <div className="flex justify-between items-center text-[10px] font-semibold text-gray-600">
                            <span>{ger.name}</span>
                            <span className="text-gray-400">{total} {total === 1 ? 'DAC' : 'DACs'}</span>
                          </div>
                          
                          {total > 0 ? (
                            <div className="w-full bg-gray-100 h-3 rounded-xs overflow-hidden flex">
                              {green > 0 && (
                                <div 
                                  className="bg-[#22c55e] h-full transition-all duration-500 flex items-center justify-center text-[8px] text-white font-extrabold"
                                  style={{ width: `${pctG}%` }}
                                  title={`Sello Verde: ${green}`}
                                >
                                  {pctG > 15 && green}
                                </div>
                              )}
                              {yellow > 0 && (
                                <div 
                                  className="bg-[#f2c811] h-full transition-all duration-500 flex items-center justify-center text-[8px] text-amber-950 font-extrabold"
                                  style={{ width: `${pctY}%` }}
                                  title={`Sello Amarillo: ${yellow}`}
                                >
                                  {pctY > 15 && yellow}
                                </div>
                              )}
                              {red > 0 && (
                                <div 
                                  className="bg-[#a91d22] h-full transition-all duration-500 flex items-center justify-center text-[8px] text-white font-extrabold"
                                  style={{ width: `${pctR}%` }}
                                  title={`Sello Rojo: ${red}`}
                                >
                                  {pctR > 15 && red}
                                </div>
                              )}
                              {pending > 0 && (
                                <div 
                                  className="bg-gray-400 h-full transition-all duration-500 flex items-center justify-center text-[8px] text-white font-extrabold"
                                  style={{ width: `${pctP}%` }}
                                  title={`Pendiente: ${pending}`}
                                >
                                  {pctP > 15 && pending}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-full bg-gray-50 h-3 rounded-xs flex items-center pl-1">
                              <span className="text-[9px] text-gray-400 italic font-medium">Sin datos para los filtros seleccionados</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend below */}
                  <div className="flex items-center justify-between text-[9px] font-bold text-gray-500 mt-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-[#22c55e] rounded-full" />
                      <span>Verde ({pbiStats.sealGreen})</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-[#f2c811] rounded-full" />
                      <span>Amarillo ({pbiStats.sealYellow})</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-[#a91d22] rounded-full" />
                      <span>Rojo ({pbiStats.sealRed})</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full" />
                      <span>Pendiente ({pbiStats.sealPending})</span>
                    </div>
                  </div>
                </div>
              </div>


            </div>
          )}

          {/* PAGE 2: ANÁLISIS DE LICITACIONES */}
          {pbiPage === 2 && (
            <div className="space-y-5 flex-1">
              
              {/* Detailed comparisons panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 p-4 rounded-xs shadow-xs text-center">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Licitaciones Activas</span>
                  <span className="text-3xl font-extrabold text-[#004e59] block mt-1">{pbiStats.licitaciones}</span>
                  <p className="text-[10px] text-gray-500 mt-2 font-medium">Evaluando proveedores de manera previa al inicio contractual.</p>
                </div>

                <div className="bg-white border border-gray-200 p-4 rounded-xs shadow-xs text-center">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Operación & Implementación</span>
                  <span className="text-3xl font-extrabold text-cobre block mt-1">{pbiStats.operacionImplementacion}</span>
                  <p className="text-[10px] text-gray-500 mt-2 font-medium">Auditorías a proyectos contratados e infraestructuras instaladas.</p>
                </div>

                <div className="bg-white border border-gray-200 p-4 rounded-xs shadow-xs text-center">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Tasa de Sello Verde Pre-Contractual</span>
                  <span className="text-3xl font-extrabold text-blue-600 block mt-1">92%</span>
                  <p className="text-[10px] text-gray-500 mt-2 font-medium">Porcentaje de éxito en primer retest para licitaciones.</p>
                </div>
              </div>

              {/* Licitaciones Table Matrix */}
              <div className="bg-white border border-gray-200 rounded-xs p-4 shadow-xs">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-3">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-tight">Resumen de Solicitudes DAC</span>
                </div>

                <div className="overflow-x-auto text-xs max-h-[300px] overflow-y-auto pr-1">
                  <table className="w-full text-left text-xs table-fixed">
                    <colgroup>
                      <col className="w-[12%]" />
                      <col className="w-[38%]" />
                      <col className="w-[22%]" />
                      <col className="w-[15%]" />
                      <col className="w-[13%]" />
                    </colgroup>
                    <thead className="sticky top-0 bg-white z-10 shadow-xs">
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                        <th className="p-2">ID DAC</th>
                        <th className="p-2">Proyecto / Servicio</th>
                        <th className="p-2">Proveedor principal</th>
                        <th className="p-2">Estado Sello</th>
                        <th className="p-2">Resultado Sello</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pbiFilteredDacs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center p-8 text-gray-400 font-medium">No hay DACs registradas con los segmentadores seleccionados</td>
                        </tr>
                      ) : (
                        pbiFilteredDacs.map((dac) => (
                          <tr key={dac.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => onSelectDac && onSelectDac(dac.id)}>
                            <td className="p-2 font-mono text-[10px] text-cobre font-semibold truncate" title={dac.id}>{dac.id}</td>
                            <td className="p-2 font-bold text-gray-700 truncate" title={dac.projectName}>{dac.projectName}</td>
                            <td className="p-2 font-semibold text-gray-600 truncate" title={dac.companyName || 'Licitación Multitáctil'}>{dac.companyName || 'Licitación Multitáctil'}</td>
                            <td className="p-2 truncate">
                              <span 
                                className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold truncate block text-center ${
                                  dac.type === 'Licitación' 
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                    : dac.type === 'Implementación'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : 'bg-teal-50 text-teal-700 border border-teal-200'
                                }`} 
                                title={
                                  dac.type === 'Licitación' 
                                    ? 'Licitación' 
                                    : dac.type === 'Implementación'
                                    ? 'Implementación'
                                    : 'Operación'
                                }
                              >
                                {dac.type === 'Licitación' 
                                  ? 'Licitación' 
                                  : dac.type === 'Implementación'
                                  ? 'Implementación'
                                  : 'Operación'}
                              </span>
                            </td>
                            <td className="p-2 whitespace-nowrap truncate">
                              {(() => {
                                const seal = getDacSealByStage(dac);
                                const stageText = dac.state.split(' ').map(word => {
                                  const lower = word.toLowerCase();
                                  if (lower === 'ti' || lower === 'ot' || lower === 'jp' || lower === 'ey' || lower === 'mfa' || lower === 'erp') {
                                    return word.toUpperCase();
                                  }
                                  return word.charAt(0).toUpperCase() + lower.slice(1);
                                }).join(' ');
                                if (seal === 'Verde') {
                                  return <span className="text-emerald-700 font-bold">🟢 Verde</span>;
                                }
                                if (seal === 'Amarillo') {
                                  return <span className="text-amber-600 font-bold">🟡 Amarillo</span>;
                                }
                                if (seal === 'Rojo') {
                                  return <span className="text-rose-600 font-bold">🔴 Rojo</span>;
                                }
                                return <span className="text-gray-400 font-semibold" title={stageText}>⌛ {stageText}</span>;
                              })()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PAGE 3: CRITICIDADES Y RIESGOS */}
          {pbiPage === 3 && (
            <div className="space-y-5 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Criticidad breakdown chart */}
                <div className="bg-white border border-gray-200 p-4 rounded-xs shadow-xs">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-tight block border-b border-gray-100 pb-2 mb-3">Distribución por Criticidad del Sistema</span>
                  
                  <div className="space-y-3.5 pt-2">
                    {[
                      { name: '🔴 Crítico (Core Minero OT)', count: pbiStats.critical, color: 'bg-[#a91d22]' },
                      { name: '🟠 Criticidad Alta', count: pbiStats.high, color: 'bg-orange-500' },
                      { name: '🟡 Criticidad Media', count: pbiStats.medium, color: 'bg-amber-400' },
                      { name: '🟢 Criticidad Baja', count: pbiStats.low, color: 'bg-emerald-500' }
                    ].map((item) => {
                      const percentage = pbiStats.total > 0 ? (item.count / pbiStats.total) * 100 : 0;
                      return (
                        <div key={item.name} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-semibold text-gray-600">
                            <span>{item.name}</span>
                            <span>{item.count} procesos ({percentage.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2.5 rounded-sm overflow-hidden flex">
                            <div
                              className={`${item.color} h-full rounded-sm transition-all duration-500`}
                              style={{ width: `${Math.max(4, percentage)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Security Gauge simulation in Power BI style */}
                <div className="bg-white border border-gray-200 p-4 rounded-xs shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-tight block border-b border-gray-100 pb-2 mb-3">Cumplimiento General SLAs</span>
                    <p className="text-[11px] text-gray-500 leading-relaxed mb-4">
                      Porcentaje de hitos técnicos cerrados dentro de los plazos establecidos por el estándar corporativo de Codelco.
                    </p>
                  </div>

                  <div className="text-center space-y-2 py-4 bg-gray-50 border border-gray-100 rounded-sm">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider">KPI CUMPLIMIENTO CONSOLIDADO</span>
                    <div className="text-4xl font-extrabold text-[#004e59] font-display">87.5%</div>
                    <span className="text-[11px] text-emerald-600 font-bold block">🟢 Rango Seguro (Meta Corporativa &gt;85%)</span>
                  </div>
                </div>
              </div>

              {/* Operational disclaimer */}
              <div className="bg-[#fcf8e3] border border-[#faebcc] text-[#8a6d3b] rounded-sm p-4 text-xs font-medium">
                ⚠️ <strong>Información Regulatoria:</strong> El Sello de Cobre de Ciberseguridad otorga una visibilidad clave para el directorio de Codelco. El incumplimiento de mitigaciones obligatorias (Sello Rojo) puede resultar en penalizaciones administrativas para el proveedor de hasta 50 UF diarias y suspensión temporal del registro de proveedores de la Corporación.
              </div>
            </div>
          )}

          {/* Power BI Fake Embedded Page Strip Footer */}
          <div className="bg-[#f3f2f1] border-t border-gray-300 px-4 py-2 flex flex-col sm:flex-row items-center justify-between text-xs font-sans mt-4 shrink-0 select-none">
            {/* Embedded Page buttons */}
            <div className="flex flex-wrap gap-1.5 items-center justify-center">
              {[
                { pageNum: 1, label: 'Resumen Ejecutivo DAC' },
                { pageNum: 2, label: 'Licitaciones y Operaciones' },
                { pageNum: 3, label: 'Criticidades y Riesgos OT' }
              ].map((p) => (
                <button
                  key={p.pageNum}
                  onClick={() => setPbiPage(p.pageNum)}
                  className={`px-3 py-1 text-[11px] font-bold border rounded-xs transition-colors cursor-pointer focus:outline-none ${
                    pbiPage === p.pageNum
                      ? 'bg-[#f2c811] text-gray-900 border-[#f2c811] shadow-xs'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Page Navigation details */}
            <div className="flex items-center space-x-3 mt-2 sm:mt-0 text-gray-500 font-semibold text-[11px]">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setPbiPage(prev => Math.max(1, prev - 1))}
                  disabled={pbiPage === 1}
                  className="p-1 hover:bg-gray-200 rounded-sm disabled:opacity-40"
                >
                  ◀
                </button>
                <span>Página {pbiPage} de 3</span>
                <button
                  onClick={() => setPbiPage(prev => Math.min(3, prev + 1))}
                  disabled={pbiPage === 3}
                  className="p-1 hover:bg-gray-200 rounded-sm disabled:opacity-40"
                >
                  ▶
                </button>
              </div>
              <span className="text-gray-300">|</span>
              <span className="text-[10px] uppercase font-bold text-gray-400">Microsoft Power BI Embedded</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
