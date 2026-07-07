import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Award,
  ShieldCheck,
  Zap,
  Clock,
  Target,
  TrendingUp,
  Sparkles,
  Lock,
  Unlock,
  CheckCircle2,
  Building,
  ChevronRight,
  HelpCircle,
  Play,
  Check,
  Star,
  Activity,
  ArrowUpRight,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { DacRequest, Finding, SelloType, DacState, FindingState, UserRole } from '../types';

interface GamificacionViewProps {
  dacs: DacRequest[];
  findings: Finding[];
  currentRole: UserRole;
  onUpdateFindingState?: (id: string, newState: FindingState) => void;
  onUpdateDacState?: (id: string, newState: DacState) => void;
  onUpdateFindingFields?: (id: string, fields: Partial<Finding>) => void;
}

interface SupplierGamifyData {
  companyName: string;
  points: number;
  level: string;
  nextLevelPoints: number;
  progressToNext: number;
  stats: {
    completedDacs: number;
    resolvedFindings: number;
    findingsOnTime: number;
    greenSeals: number;
    yellowSeals: number;
  };
  badges: {
    id: string;
    title: string;
    description: string;
    unlocked: boolean;
    unlockedAt?: string;
    requirement: string;
    icon: React.ComponentType<any>;
    color: string;
  }[];
}

export default function GamificacionView({
  dacs,
  findings,
  currentRole,
  onUpdateFindingState,
  onUpdateDacState,
  onUpdateFindingFields
}: GamificacionViewProps) {
  // We'll manage a list of dynamic simulations here if needed to inject mock performance points
  const [simulationPoints, setSimulationPoints] = useState<Record<string, number>>({});
  const [simulationHistory, setSimulationHistory] = useState<{ company: string; text: string; points: number; date: string }[]>([]);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // List of all unique companies in the ecosystem
  const companies = useMemo(() => {
    const list = new Set<string>();
    
    // Scan DACs
    dacs.forEach(d => {
      if (d.companyName && d.companyName !== 'Evaluación de Licitación') {
        list.add(d.companyName);
      }
      if (d.suppliers) {
        d.suppliers.forEach(s => {
          if (s.name) list.add(s.name);
        });
      }
    });

    // Default fallbacks in case lists are filtered or empty
    list.add('Siemens Chile S.A.');
    list.add('Cloud Services Inc');
    list.add('Tech Solutions SpA');
    list.add('Hexagon Mining Chile');
    list.add('Software del Cono Sur SpA');
    list.add('Backup Solutions SpA');
    list.add('Tech Backup Ltd');

    return Array.from(list);
  }, [dacs]);

  // Selected company to inspect
  const [selectedCompany, setSelectedCompany] = useState<string>(() => {
    // Default to the first company or Tech Solutions
    return 'Tech Solutions SpA';
  });

  // Gamification Engine: Dynamically calculates points, levels, and badges for a company
  const calculateGamificationData = (company: string): SupplierGamifyData => {
    // 1. Base levels and points from mock static achievements
    let basePoints = 0;
    let completedDacs = 0;
    let resolvedFindings = 0;
    let findingsOnTime = 0;
    let greenSeals = 0;
    let yellowSeals = 0;

    // Apply baseline weights based on their profile status to create a realistic initial state
    if (company === 'Siemens Chile S.A.') {
      basePoints += 1500; // Historic audits
      completedDacs += 1;
      greenSeals += 1;
    } else if (company === 'Cloud Services Inc') {
      basePoints += 1200;
      completedDacs += 1;
      greenSeals += 1;
    } else if (company === 'Backup Solutions SpA') {
      basePoints += 800;
      completedDacs += 1;
      yellowSeals += 1;
    } else if (company === 'Hexagon Mining Chile') {
      basePoints += 500;
    } else if (company === 'Tech Solutions SpA') {
      basePoints += 200;
    } else if (company === 'Software del Cono Sur SpA') {
      basePoints += 150;
    }

    // Add simulated points
    basePoints += simulationPoints[company] || 0;

    // 2. Scan live DACs in the application state
    const companyDacs = dacs.filter(d => d.companyName === company);
    companyDacs.forEach(dac => {
      // Completed states
      const isCompleted = [
        'CERRADO',
        'APROBADO POR GERENCIA',
        'RESULTADO LICITACIÓN APROBADO',
        'APROBADO POR JP',
        'INFORME ENTREGADO',
        'RESULTADO EMITIDO'
      ].includes(dac.state);

      if (isCompleted) {
        completedDacs += 1;
        basePoints += 500; // 500 points for completing DAC
      }

      if (dac.seal === 'Verde') {
        greenSeals += 1;
        basePoints += 2000; // 2000 points for Green Seal
      } else if (dac.seal === 'Amarillo') {
        yellowSeals += 1;
        basePoints += 1000; // 1000 points for Yellow Seal
      } else if (dac.seal === 'Rojo') {
        basePoints += 100; // 100 points for Red Seal
      }
    });

    // Scan suppliers inside licitaciones
    dacs.forEach(d => {
      if (d.suppliers) {
        const matchingSupplier = d.suppliers.find(s => s.name === company);
        if (matchingSupplier) {
          completedDacs += 1;
          basePoints += 500; // completed evaluation
          basePoints += Math.floor(matchingSupplier.score * 5); // score points

          if (matchingSupplier.seal === 'Verde') {
            greenSeals += 1;
            basePoints += 2000;
          } else if (matchingSupplier.seal === 'Amarillo') {
            yellowSeals += 1;
            basePoints += 1000;
          } else if (matchingSupplier.seal === 'Rojo') {
            basePoints += 100;
          }
        }
      }
    });

    // 3. Scan findings
    // We map DAC ID to company
    const dacIdToCompany: Record<string, string> = {};
    dacs.forEach(d => {
      if (d.companyName) dacIdToCompany[d.id] = d.companyName;
    });

    findings.forEach(f => {
      const fCompany = dacIdToCompany[f.dacId];
      if (fCompany === company) {
        if (f.state === 'CORREGIDO') {
          resolvedFindings += 1;
          
          // Determine points by severity
          let severityPoints = 250; // media by default
          if (f.criticidad === 'CRÍTICA') severityPoints = 1000;
          else if (f.criticidad === 'ALTA') severityPoints = 500;
          else if (f.criticidad === 'BAJA') severityPoints = 100;

          basePoints += severityPoints;

          // Check SLA (simulate on-time if not overdue or has logs indicating correct delivery)
          // For simplicity, we assume resolved findings are on time if they aren't explicitly flagged
          findingsOnTime += 1;
          basePoints += 200; // SLA Bonus
        } else if (f.state === 'EN REVISIÓN CORRECCIÓN') {
          basePoints += 100; // Points for uploading evidence
        }
      }
    });

    // Determine level of maturity based on points
    // Bronce: 0-1500, Plata: 1500-3500, Oro: 3500-5500, Platino: 5500+
    let level = 'BRONCE';
    let nextLevelPoints = 1500;
    let progressToNext = 0;

    if (basePoints >= 5500) {
      level = 'PLATINO';
      nextLevelPoints = 5500;
      progressToNext = 100;
    } else if (basePoints >= 3500) {
      level = 'ORO';
      nextLevelPoints = 5500;
      progressToNext = Math.min(100, Math.floor(((basePoints - 3500) / 2000) * 100));
    } else if (basePoints >= 1500) {
      level = 'PLATA';
      nextLevelPoints = 3500;
      progressToNext = Math.min(100, Math.floor(((basePoints - 1500) / 2000) * 100));
    } else {
      level = 'BRONCE';
      nextLevelPoints = 1500;
      progressToNext = Math.min(100, Math.floor((basePoints / 1500) * 100));
    }

    // 4. Badges (Insignias) checklist
    const badgeList = [
      {
        id: 'prim_sello_verde',
        title: 'Primer Sello Verde',
        description: 'Otorgado por alcanzar la máxima categoría de ciberseguridad industrial en Codelco.',
        requirement: 'Obtener un Sello de categoría "Verde" en algún proceso.',
        unlocked: greenSeals >= 1,
        icon: ShieldCheck,
        color: 'from-emerald-500 to-teal-600'
      },
      {
        id: 'resolucion_rapida',
        title: 'Fuego Contrarrestado',
        description: 'Corregir un hallazgo de nivel Crítico o Alto de forma ágil y conforme al estándar.',
        requirement: 'Resolver un hallazgo crítico o alto con evidencias aprobadas.',
        // Siemens, Cloud Services, and also if anyone resolves a critical/high finding
        unlocked: company === 'Siemens Chile S.A.' || company === 'Cloud Services Inc' || (() => {
          return findings.some(f => {
            const fComp = dacIdToCompany[f.dacId];
            return fComp === company && f.state === 'CORREGIDO' && (f.criticidad === 'CRÍTICA' || f.criticidad === 'ALTA');
          });
        })(),
        icon: Zap,
        color: 'from-amber-500 to-orange-600'
      },
      {
        id: 'dac_impecable',
        title: 'Formulario Impecable',
        description: 'Completar el formulario técnico DAC sin observaciones ni brechas severas iniciales.',
        requirement: 'Aprobación del Formulario DAC sin registrar hallazgos de criticidad crítica o alta.',
        unlocked: company === 'Siemens Chile S.A.' || company === 'Cloud Services Inc' || (completedDacs >= 1 && resolvedFindings === 0 && company !== 'Tech Solutions SpA' && company !== 'Software del Cono Sur SpA'),
        icon: Star,
        color: 'from-blue-500 to-indigo-600'
      },
      {
        id: 'sla_imbatible',
        title: 'SLA Imbatible',
        description: 'Demostrar un compromiso excepcional solucionando múltiples hallazgos antes de sus fechas de vencimiento.',
        requirement: 'Resolver 2 o más hallazgos de ciberseguridad dentro del tiempo SLA establecido.',
        unlocked: resolvedFindings >= 2 || company === 'Siemens Chile S.A.',
        icon: Clock,
        color: 'from-purple-500 to-pink-600'
      },
      {
        id: 'campeon_ciber',
        title: 'Líder Ciberseguridad',
        description: 'Consolidarse en el ecosistema Codelco como proveedor de alto estándar y madurez ciber-operacional.',
        requirement: 'Acumular un total de 3,500 puntos o más en la plataforma de gamificación.',
        unlocked: basePoints >= 3500,
        icon: Trophy,
        color: 'from-yellow-500 to-amber-600'
      },
      {
        id: 'cero_brechas',
        title: 'Blindaje Total',
        description: 'Mantener un estado óptimo de seguridad sin incidencias ni brechas críticas abiertas.',
        requirement: 'Tener todos los hallazgos del proyecto remediados o cerrados.',
        unlocked: (completedDacs >= 1 || resolvedFindings >= 1) && (() => {
          // Are there any open findings for this company?
          const companyDacIds = dacs.filter(d => d.companyName === company).map(d => d.id);
          const openCompanyFindings = findings.filter(f => companyDacIds.includes(f.dacId) && f.state !== 'CORREGIDO' && f.state !== 'NO APLICA');
          return openCompanyFindings.length === 0;
        })(),
        icon: Award,
        color: 'from-cyan-500 to-blue-600'
      }
    ];

    return {
      companyName: company,
      points: basePoints,
      level,
      nextLevelPoints,
      progressToNext,
      stats: {
        completedDacs,
        resolvedFindings,
        findingsOnTime,
        greenSeals,
        yellowSeals
      },
      badges: badgeList
    };
  };

  // Compile full leaderboard (sorted by points descending)
  const leaderboard = useMemo(() => {
    return companies
      .map(c => calculateGamificationData(c))
      .sort((a, b) => b.points - a.points);
  }, [companies, dacs, findings, simulationPoints]);

  // Selected company data
  const selectedData = useMemo(() => {
    return calculateGamificationData(selectedCompany);
  }, [selectedCompany, dacs, findings, simulationPoints]);

  // Current company position in ranking
  const rankingPosition = useMemo(() => {
    const idx = leaderboard.findIndex(item => item.companyName === selectedCompany);
    return idx !== -1 ? idx + 1 : 0;
  }, [leaderboard, selectedCompany]);

  // SIMULATOR ACTIONS HANDLERS
  const triggerSimulation = (company: string, actionType: string) => {
    let ptsGained = 0;
    let description = '';

    if (actionType === 'dac_ontime') {
      ptsGained = 500;
      description = 'Completó Formulario DAC a tiempo';
      showToast(`¡Excelente! +500 Puntos para ${company} por completar DAC a tiempo.`);
    } else if (actionType === 'resolve_critical') {
      ptsGained = 1200; // 1000 points + 200 SLA bonus
      description = 'Solucionó Hallazgo CRÍTICO a tiempo (SLA)';

      // Actually try to update findings in parent state if possible!
      const companyDacIds = dacs.filter(d => d.companyName === company).map(d => d.id);
      const openCriticalFinding = findings.find(f => companyDacIds.includes(f.dacId) && f.criticidad === 'CRÍTICA' && f.state !== 'CORREGIDO');
      
      if (openCriticalFinding && onUpdateFindingState) {
        onUpdateFindingState(openCriticalFinding.id, 'CORREGIDO');
        if (onUpdateFindingFields) {
          onUpdateFindingFields(openCriticalFinding.id, { 
            state: 'CORREGIDO',
            logs: [
              {
                id: `log_gamify_${Date.now()}`,
                date: new Date().toLocaleString('es-CL', { hour12: false }),
                text: `Hallazgo remediado a tiempo mediante Simulador de Logros de Ciberseguridad.`,
                user: 'Simulador'
              },
              ...openCriticalFinding.logs
            ]
          });
        }
        showToast(`¡Remediado! Hallazgo ${openCriticalFinding.id} marcado como CORREGIDO en sistema y se otorgaron +1200 Puntos.`);
      } else {
        showToast(`¡Simulado! Se otorgaron +1200 Puntos a ${company} por resolver un hallazgo crítico a tiempo.`);
      }
    } else if (actionType === 'sello_verde') {
      ptsGained = 2000;
      description = 'Obtuvo Sello Ciberseguridad Categoría VERDE';

      // Try to find a DAC of this company to mark as Sello Verde
      const companyDac = dacs.find(d => d.companyName === company && d.seal !== 'Verde');
      if (companyDac && onUpdateDacState) {
        // We can inject seal update or similar. Let's award directly as points.
        showToast(`¡Espectacular! Se otorgó Sello de Cobre Verde a ${company}. (+2000 Puntos)`);
      } else {
        showToast(`¡Simulado! +2000 Puntos a ${company} por obtención de Sello Verde.`);
      }
    } else if (actionType === 'evidence_upload') {
      ptsGained = 150;
      description = 'Cargó evidencias conformes para revisión técnica';
      showToast(`¡Evidencias! +150 Puntos para ${company} por cargar evidencias de mitigación.`);
    }

    setSimulationPoints(prev => ({
      ...prev,
      [company]: (prev[company] || 0) + ptsGained
    }));

    setSimulationHistory(prev => [
      {
        company,
        text: description,
        points: ptsGained,
        date: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
      },
      ...prev.slice(0, 9) // keep last 10 entries
    ]);
  };

  const showToast = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4500);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'PLATINO': return 'text-cyan-600 bg-cyan-50 border-cyan-200';
      case 'ORO': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'PLATA': return 'text-slate-500 bg-slate-50 border-slate-200';
      default: return 'text-amber-700 bg-amber-50 border-amber-200';
    }
  };

  const getSealBadge = (seal: SelloType | 'Pendiente') => {
    switch (seal) {
      case 'Verde':
        return <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded">Sello Verde</span>;
      case 'Amarillo':
        return <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 rounded">Sello Amarillo</span>;
      case 'Rojo':
        return <span className="px-2 py-0.5 text-[9px] font-bold bg-rose-100 text-rose-800 rounded">Sello Rojo</span>;
      default:
        return <span className="px-2 py-0.5 text-[9px] font-bold bg-gray-100 text-gray-800 rounded">Pendiente</span>;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto overflow-y-auto h-[calc(100vh-4rem)] bg-gray-50/50" id="gamificacion-container">
      
      {/* Dynamic Success Toast */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-gris-azulado text-white p-4 rounded-lg shadow-2xl flex items-center space-x-3 border-l-4 border-cobre max-w-md font-sans"
            id="gamify-toast"
          >
            <div className="bg-cobre/20 p-2 rounded-full text-cobre shrink-0">
              <Sparkles className="w-5 h-5 text-cobre" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-100 uppercase tracking-wider">Logro Alcanzado / Puntos Otorgados</p>
              <p className="text-xs text-white/95 mt-0.5 font-medium">{successToast}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Heading Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4" id="gamify-heading-block">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-cobre uppercase font-sans">
            Codelco Cybersecurity Gamification System
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gris-azulado tracking-tight m-0 normal-case mb-2 font-display">
            Sello de Oro y Logros de Proveedores
          </h2>
          <p className="text-xs text-secundario max-w-3xl font-sans m-0 leading-relaxed">
            Reconocemos y premiamos a los proveedores que demuestran excelencia operacional, completan formularios DAC a tiempo y resuelven brechas técnicas con celeridad.
          </p>
        </div>

        {/* Global Stats Quick-View */}
        <div className="flex items-center space-x-3 bg-white border border-crema/20 p-3 rounded-lg shrink-0 shadow-xs" id="quick-global-status">
          <div className="bg-surface-container-custom p-2.5 rounded-md text-cobre">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[9px] font-extrabold text-gris-azulado/50 uppercase tracking-widest">Líder del Ecosistema</p>
            <p className="text-xs font-extrabold text-gris-azulado truncate max-w-[150px]">
              {leaderboard[0]?.companyName || 'Cargando...'}
            </p>
            <p className="text-[10px] text-cobre font-bold">{leaderboard[0]?.points || 0} pts acumulados</p>
          </div>
        </div>
      </div>

      {/* Top Selector Card */}
      <div className="bg-white border border-crema/20 p-4 rounded-lg mb-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4" id="supplier-selector-card">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-slate-100 rounded-md text-slate-600">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gris-azulado/50 uppercase tracking-widest">
              Seleccionar Proveedor para Inspección Detallada
            </label>
            <p className="text-xs text-secundario">Visualice el puntaje, nivel y logros específicos de cada empresa.</p>
          </div>
        </div>
        <div className="w-full md:w-auto shrink-0">
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="w-full md:w-80 px-3.5 py-2 text-xs font-semibold text-gris-azulado bg-white border border-crema/30 rounded-md focus:outline-none focus:ring-1 focus:ring-cobre cursor-pointer"
            id="company-gamify-selector"
          >
            {companies.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 2 Column Layout for Selected Supplier Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8" id="gamify-detail-grid">
        
        {/* Column 1: Progress, Levels, and Stats Card */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white border border-crema/20 rounded-lg p-6 shadow-xs flex flex-col justify-between h-full" id="stats-summary-card">
            <div>
              <div className="flex items-start justify-between mb-4">
                <span className={`px-2.5 py-1 text-[10px] font-extrabold tracking-widest rounded-full uppercase ${getLevelColor(selectedData.level)}`} id="maturity-level-badge">
                  NIVEL {selectedData.level}
                </span>
                <span className="text-xs font-bold text-cobre flex items-center">
                  Rango #{rankingPosition} <TrendingUp className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>

              <h3 className="text-lg font-bold text-gris-azulado font-display leading-tight truncate normal-case mb-1">
                {selectedData.companyName}
              </h3>
              <p className="text-xs text-secundario mb-6">Mapeo dinámico de madurez y SLAs</p>

              {/* Total Points Display */}
              <div className="bg-surface-custom/60 border border-surface-dim-custom/30 rounded-lg p-5 mb-6 text-center">
                <p className="text-[10px] font-bold text-gris-azulado/40 uppercase tracking-widest">Puntaje Total Acumulado</p>
                <div className="flex items-baseline justify-center space-x-1 mt-1">
                  <span className="text-3xl font-extrabold text-cobre tracking-tight">{selectedData.points.toLocaleString('es-CL')}</span>
                  <span className="text-xs font-bold text-gris-azulado/60">puntos</span>
                </div>
              </div>

              {/* Level Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-[11px] font-semibold text-gris-azulado/75 mb-1.5">
                  <span>Progreso al siguiente nivel</span>
                  <span>{selectedData.points} / {selectedData.nextLevelPoints} pts</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-cobre h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${selectedData.progressToNext}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[9px] text-gris-azulado/40 uppercase font-bold mt-1 tracking-wider">
                  <span>BRONCE</span>
                  <span>PLATA</span>
                  <span>ORO</span>
                  <span>PLATINO</span>
                </div>
              </div>
            </div>

            {/* Micro Metrics Breakdown */}
            <div className="border-t border-crema/10 pt-5 mt-4 space-y-3.5">
              <h4 className="text-[10px] font-bold text-gris-azulado/40 tracking-wider uppercase">Métricas Clave de Cumplimiento</h4>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-secundario flex items-center"><Briefcase className="w-3.5 h-3.5 mr-2 text-gris-azulado/40" /> Formularios DAC / Licitación</span>
                <span className="font-bold text-gris-azulado">{selectedData.stats.completedDacs} completados</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-secundario flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-500" /> Hallazgos Remediados</span>
                <span className="font-bold text-gris-azulado">{selectedData.stats.resolvedFindings} hallazgos</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-secundario flex items-center"><Clock className="w-3.5 h-3.5 mr-2 text-amber-500" /> SLA de Resolución a Tiempo</span>
                <span className="font-bold text-gris-azulado">{selectedData.stats.findingsOnTime > 0 ? '100%' : 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-secundario flex items-center"><Award className="w-3.5 h-3.5 mr-2 text-cobre" /> Sellos Verdes Obtenidos</span>
                <span className="font-bold text-emerald-600">{selectedData.stats.greenSeals} verdes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Badge Collection Grid */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-crema/20 rounded-lg p-6 shadow-xs h-full" id="badges-collection-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-gris-azulado font-display normal-case tracking-tight">
                  Insignias y Desafíos de Seguridad
                </h3>
                <p className="text-xs text-secundario">Inspección de logros específicos obtenidos o bloqueados.</p>
              </div>
              <span className="text-xs font-bold text-gris-azulado/60 bg-gray-100 px-2.5 py-1 rounded-full">
                {selectedData.badges.filter(b => b.unlocked).length} de {selectedData.badges.length} Desbloqueados
              </span>
            </div>

            {/* Badges Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="badges-grid-layout">
              {selectedData.badges.map(badge => {
                const BadgeIcon = badge.icon;
                return (
                  <div
                    key={badge.id}
                    className={`border rounded-lg p-4 transition-all duration-300 relative flex items-start space-x-3.5 ${
                      badge.unlocked 
                        ? 'bg-white border-crema/30 shadow-xs hover:border-cobre/20' 
                        : 'bg-gray-50/50 border-gray-200/60 opacity-65'
                    }`}
                    id={`badge-card-${badge.id}`}
                  >
                    {/* Badge Icon styled based on locked/unlocked state */}
                    <div className="shrink-0">
                      {badge.unlocked ? (
                        <div className={`p-3 rounded-lg bg-gradient-to-br ${badge.color} text-white shadow-sm`}>
                          <BadgeIcon className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-gray-200 text-gray-400 relative">
                          <BadgeIcon className="w-5 h-5" />
                          <div className="absolute -top-1 -right-1 bg-gray-500 text-white p-0.5 rounded-full border border-white">
                            <Lock className="w-2.5 h-2.5" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className={`text-xs font-bold truncate ${badge.unlocked ? 'text-gris-azulado' : 'text-gray-400'}`}>
                          {badge.title}
                        </h4>
                        {badge.unlocked && (
                          <span className="shrink-0 bg-emerald-100 text-emerald-800 text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded-xs tracking-wider">
                            OBTENIDO
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-secundario leading-relaxed mt-1 line-clamp-2">
                        {badge.description}
                      </p>
                      
                      {/* Requirements and criteria */}
                      <div className="mt-2.5 pt-2 border-t border-gray-100/60">
                        <p className="text-[9px] font-semibold text-gris-azulado/40 uppercase tracking-wider">
                          Requisito de Obtención
                        </p>
                        <p className="text-[10px] text-secundario font-medium mt-0.5">
                          {badge.requirement}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Ranking of Suppliers (Leaderboard) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8" id="leaderboard-interactive-grid">
        
        {/* Left Area: Ranking Table */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-crema/20 rounded-lg p-6 shadow-xs" id="leaderboard-table-card">
            <div className="mb-6">
              <h3 className="text-base font-bold text-gris-azulado font-display normal-case tracking-tight">
                Ranking Oficial de Ciberseguridad de Proveedores
              </h3>
              <p className="text-xs text-secundario">Clasificación consolidada de proveedores según puntos de cumplimiento, sellos y SLAs.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" id="leaderboard-table">
                <thead>
                  <tr className="border-b border-crema/10 text-[9px] font-bold text-gris-azulado/50 uppercase tracking-widest">
                    <th className="py-3 px-4 text-center">Posición</th>
                    <th className="py-3 px-4">Proveedor</th>
                    <th className="py-3 px-4">Sello Actual</th>
                    <th className="py-3 px-4 text-center">Insignias</th>
                    <th className="py-3 px-4 text-right">Puntos Totales</th>
                    <th className="py-3 px-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {leaderboard.map((item, index) => {
                    const isSelected = item.companyName === selectedCompany;
                    const pos = index + 1;
                    return (
                      <tr
                        key={item.companyName}
                        onClick={() => setSelectedCompany(item.companyName)}
                        className={`hover:bg-surface-custom/30 transition-colors cursor-pointer ${
                          isSelected ? 'bg-surface-container-low/40 font-semibold border-l-4 border-l-cobre' : ''
                        }`}
                        id={`ranking-row-${item.companyName.replace(/\s+/g, '-')}`}
                      >
                        <td className="py-3.5 px-4 text-center font-bold">
                          {pos === 1 && <span className="inline-flex items-center justify-center bg-yellow-100 text-yellow-800 rounded-full w-6 h-6 border border-yellow-200">🥇</span>}
                          {pos === 2 && <span className="inline-flex items-center justify-center bg-slate-100 text-slate-800 rounded-full w-6 h-6 border border-slate-200">🥈</span>}
                          {pos === 3 && <span className="inline-flex items-center justify-center bg-amber-50 text-amber-800 rounded-full w-6 h-6 border border-amber-200">🥉</span>}
                          {pos > 3 && <span className="text-gris-azulado/60">{pos}º</span>}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-gris-azulado">
                          <div className="flex flex-col">
                            <span>{item.companyName}</span>
                            <span className="text-[10px] font-normal text-secundario">Nivel {item.level}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {getSealBadge(
                            item.stats.greenSeals > 0 
                              ? 'Verde' 
                              : item.stats.yellowSeals > 0 
                                ? 'Amarillo' 
                                : 'Pendiente'
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center -space-x-1">
                            {item.badges.filter(b => b.unlocked).slice(0, 3).map((badge, bIdx) => {
                              const SIcon = badge.icon;
                              return (
                                <div 
                                  key={badge.id}
                                  title={badge.title}
                                  className={`p-1 rounded-full bg-gradient-to-br ${badge.color} text-white border-2 border-white w-5 h-5 flex items-center justify-center text-[8px]`}
                                >
                                  <SIcon className="w-3.5 h-3.5" />
                                </div>
                              );
                            })}
                            {item.badges.filter(b => b.unlocked).length > 3 && (
                              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 border-2 border-white flex items-center justify-center text-[8px] font-bold">
                                +{item.badges.filter(b => b.unlocked).length - 3}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-cobre">
                          {item.points.toLocaleString('es-CL')} pts
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCompany(item.companyName);
                            }}
                            className="p-1 text-cobre hover:bg-surface-container-custom/50 rounded transition-colors"
                            id={`btn-inspect-${item.companyName.replace(/\s+/g, '-')}`}
                          >
                            <ChevronRight className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Area: Interactive Achievements Simulator */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-crema/20 rounded-lg p-6 shadow-xs flex flex-col justify-between h-full" id="achievements-simulator-card">
            <div>
              <div className="flex items-center space-x-2 text-cobre mb-4">
                <Activity className="w-5 h-5" />
                <h3 className="text-sm font-bold text-gris-azulado font-display uppercase tracking-wider">
                  Simulador de Ciberseguridad
                </h3>
              </div>
              <p className="text-xs text-secundario mb-5 leading-relaxed">
                Interactúe con la simulación de eventos en tiempo real. Al simular acciones, se otorgarán puntos, se desbloquearán insignias y se actualizarán los rangos de inmediato en la plataforma.
              </p>

              {/* Selector for Simulation Target */}
              <div className="mb-4">
                <label className="block text-[9px] font-bold text-gris-azulado/50 uppercase tracking-widest mb-1.5">
                  Proveedor de Destino de la Simulación
                </label>
                <div className="text-xs font-bold text-gris-azulado bg-gray-50 border border-gray-200 px-3 py-2 rounded-md truncate">
                  {selectedCompany}
                </div>
              </div>

              {/* Simulation Buttons List */}
              <div className="space-y-3">
                <button
                  onClick={() => triggerSimulation(selectedCompany, 'evidence_upload')}
                  className="w-full text-left border border-crema/20 hover:border-cobre/40 p-3 rounded-lg hover:bg-surface-custom/30 transition-all flex items-start space-x-3 cursor-pointer group"
                  id="sim-action-evidence"
                >
                  <div className="bg-blue-100 text-blue-600 p-1.5 rounded group-hover:scale-105 transition-transform shrink-0">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gris-azulado">Subir Evidencia de Cierre</h4>
                    <p className="text-[10px] text-secundario mt-0.5">Simula carga de mitigaciones de auditoría. (+150 pts)</p>
                  </div>
                </button>

                <button
                  onClick={() => triggerSimulation(selectedCompany, 'dac_ontime')}
                  className="w-full text-left border border-crema/20 hover:border-cobre/40 p-3 rounded-lg hover:bg-surface-custom/30 transition-all flex items-start space-x-3 cursor-pointer group"
                  id="sim-action-dac-ontime"
                >
                  <div className="bg-emerald-100 text-emerald-600 p-1.5 rounded group-hover:scale-105 transition-transform shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gris-azulado">Completar DAC a Tiempo</h4>
                    <p className="text-[10px] text-secundario mt-0.5">Cierra el ciclo del Formulario antes del plazo. (+500 pts)</p>
                  </div>
                </button>

                <button
                  onClick={() => triggerSimulation(selectedCompany, 'resolve_critical')}
                  className="w-full text-left border border-crema/20 hover:border-cobre/40 p-3 rounded-lg hover:bg-surface-custom/30 transition-all flex items-start space-x-3 cursor-pointer group"
                  id="sim-action-resolve-critical"
                >
                  <div className="bg-amber-100 text-amber-600 p-1.5 rounded group-hover:scale-105 transition-transform shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gris-azulado">Remediar Hallazgo Crítico / Alto</h4>
                    <p className="text-[10px] text-secundario mt-0.5">Corrige brechas severas en sistema (SLA). (+1,200 pts)</p>
                  </div>
                </button>

                <button
                  onClick={() => triggerSimulation(selectedCompany, 'sello_verde')}
                  className="w-full text-left border border-crema/20 hover:border-cobre/40 p-3 rounded-lg hover:bg-surface-custom/30 transition-all flex items-start space-x-3 cursor-pointer group"
                  id="sim-action-seal-green"
                >
                  <div className="bg-yellow-100 text-yellow-600 p-1.5 rounded group-hover:scale-105 transition-transform shrink-0">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gris-azulado">Otorgar Sello de Cobre Verde</h4>
                    <p className="text-[10px] text-secundario mt-0.5">Alcanza máxima certificación corporativa. (+2,000 pts)</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Sim History Log */}
            <div className="mt-6 border-t border-crema/10 pt-4">
              <h4 className="text-[9px] font-bold text-gris-azulado/40 tracking-wider uppercase mb-2">Historial de Simulación</h4>
              {simulationHistory.length === 0 ? (
                <p className="text-[10px] text-secundario/60 italic">Sin acciones simuladas en esta sesión.</p>
              ) : (
                <div className="space-y-2 max-h-24 overflow-y-auto pr-1" id="sim-history-log">
                  {simulationHistory.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-[10px] bg-slate-50 border border-gray-100 px-2 py-1.5 rounded">
                      <div className="truncate pr-2">
                        <span className="font-bold text-gris-azulado">{item.company}:</span>{' '}
                        <span className="text-secundario">{item.text}</span>
                      </div>
                      <div className="text-emerald-600 font-extrabold shrink-0">
                        +{item.points}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rules Explainer Alert Panel */}
      <div className="bg-surface-container-low border border-surface-dim-custom/50 rounded-lg p-5 flex items-start space-x-4" id="rules-explainer-panel">
        <HelpCircle className="w-6 h-6 text-cobre shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-gris-azulado font-display uppercase tracking-wide mb-1">
            Reglas Oficiales del Sistema de Puntos y Sello de Oro
          </h4>
          <p className="text-xs text-secundario leading-relaxed font-sans">
            La gamificación incentiva el cumplimiento temprano y la reducción de riesgos. Los puntos influyen en la clasificación técnica de licitaciones y otorgan beneficios de reputación en la plataforma SharePoint de Codelco. Los puntos se estructuran en: <strong className="text-cobre">Formulario a Tiempo (+500 pts)</strong>, <strong className="text-emerald-700">Resolución de Hallazgos por SLA (Crítico: +1200 pts, Alto: +700 pts, Medio: +450 pts)</strong>, y <strong className="text-yellow-700">Sello Ciberseguridad Verde (+2000 pts)</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
