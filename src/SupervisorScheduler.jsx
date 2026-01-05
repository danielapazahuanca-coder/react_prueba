// src/SupervisorScheduler.jsx
import React, { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import styles from './SupervisorScheduler.module.css';

const SupervisorScheduler = () => {
  const [workDays, setWorkDays] = useState(14);
  const [restDays, setRestDays] = useState(7);
  const [inductionDays, setInductionDays] = useState(5);
  const [totalDrillingDays, setTotalDrillingDays] = useState(90);
  const [schedule, setSchedule] = useState(null);
  const [errors, setErrors] = useState([]);

  const generateSchedule = () => {
    const days = Math.ceil(totalDrillingDays * 1.8);
    const s1 = [];
    const s2 = [];
    const s3 = [];

    // Generar S1
    let s1Day = 0;
    while (s1Day < days) {
      s1.push('S');
      s1Day++;

      if (s1Day <= inductionDays) {
        for (let i = 0; i < inductionDays && s1Day < days; i++) {
          s1.push('I');
          s1Day++;
        }
      }

      const drillingDaysThisCycle = s1Day <= inductionDays + 1
        ? workDays - inductionDays
        : workDays;

      for (let i = 0; i < drillingDaysThisCycle && s1Day < days; i++) {
        s1.push('P');
        s1Day++;
      }

      if (s1Day < days) {
        s1.push('B');
        s1Day++;
      }

      const realRestDays = restDays - 2;
      for (let i = 0; i < realRestDays && s1Day < days; i++) {
        s1.push('D');
        s1Day++;
      }
    }

    // Inicializar S2 y S3 con '-'
    for (let i = 0; i < days; i++) {
      s2.push('-');
      s3.push('-');
    }

    // S2 empieza igual que S1
    let s2Day = 0;
    s2[s2Day] = 'S';
    s2Day++;

    for (let i = 0; i < inductionDays && s2Day < days; i++) {
      s2[s2Day] = 'I';
      s2Day++;
    }

    const s1FirstEnd = 1 + workDays;
    const s3EntryDay = s1FirstEnd - inductionDays - 1;

    while (s2Day < s3EntryDay && s2Day < days) {
      s2[s2Day] = 'P';
      s2Day++;
    }

    const s3StartDrilling = s3EntryDay + 1 + inductionDays;
    if (s2Day < s3StartDrilling - 1) {
      while (s2Day < s3StartDrilling - 1 && s2Day < days) {
        s2[s2Day] = 'P';
        s2Day++;
      }
    }

    s2[s2Day] = 'B';
    s2Day++;

    // S3 entra
    s3[s3EntryDay] = 'S';
    for (let i = 0; i < inductionDays && s3EntryDay + 1 + i < days; i++) {
      s3[s3EntryDay + 1 + i] = 'I';
    }

    for (let i = s3StartDrilling; i < s3StartDrilling + workDays && i < days; i++) {
      s3[i] = 'P';
    }

    // Rotación continua
    let s2NextStart = s2Day;
    let s3NextStart = s3StartDrilling + workDays;

    const s2RestDays = restDays - 2;
    for (let i = 0; i < s2RestDays && s2Day < days; i++) {
      s2[s2Day] = 'D';
      s2Day++;
    }
    s2NextStart = s2Day;

    const maxIterations = 50;
    let iterations = 0;

    while (iterations < maxIterations) {
      iterations++;

      // S2 vuelve
      if (s2NextStart < days) {
        s2[s2NextStart] = 'S';
        s2NextStart++;

        let s2DrillingCount = 0;
        while (s2NextStart < days && s2DrillingCount < workDays) {
          s2[s2NextStart] = 'P';
          s2NextStart++;
          s2DrillingCount++;
        }

        if (s2NextStart < days) {
          s2[s2NextStart] = 'B';
          s2NextStart++;

          for (let i = 0; i < s2RestDays && s2NextStart < days; i++) {
            s2[s2NextStart] = 'D';
            s2NextStart++;
          }
        }
      }

      // S3 baja y vuelve
      if (s3NextStart < days) {
        s3[s3NextStart] = 'B';
        s3NextStart++;

        const s3RestDays = restDays - 2;
        for (let i = 0; i < s3RestDays && s3NextStart < days; i++) {
          s3[s3NextStart] = 'D';
          s3NextStart++;
        }

        if (s3NextStart < days) {
          s3[s3NextStart] = 'S';
          s3NextStart++;

          let s3DrillingCount = 0;
          while (s3NextStart < days && s3DrillingCount < workDays) {
            s3[s3NextStart] = 'P';
            s3NextStart++;
            s3DrillingCount++;
          }
        }
      }

      if (s2NextStart >= days && s3NextStart >= days) break;
    }

    // Validación de errores
    const newErrors = [];
    let s3Started = false;

    for (let i = 0; i < days; i++) {
      if (s3[i] !== '-') s3Started = true;

      const drilling = [s1[i], s2[i], s3[i]].filter(x => x === 'P').length;

      if (drilling === 3) {
        newErrors.push(`Día ${i}: 3 supervisores perforando (ERROR CRÍTICO)`);
      }

      if (s3Started && drilling === 1) {
        newErrors.push(`Día ${i}: Solo 1 supervisor perforando`);
      }

      if (drilling === 0 && s3Started) {
        newErrors.push(`Día ${i}: Ningún supervisor perforando`);
      }
    }

    setSchedule({ s1, s2, s3, days });
    setErrors(newErrors);
  };

  const getCellStyle = (state) => {
    switch (state) {
      case 'S': return styles.cellS;
      case 'I': return styles.cellI;
      case 'P': return styles.cellP;
      case 'B': return styles.cellB;
      case 'D': return styles.cellD;
      default: return styles.cellEmpty;
    }
  };

  const countDrilling = (day) => {
    if (!schedule) return 0;
    return [schedule.s1[day], schedule.s2[day], schedule.s3[day]].filter(x => x === 'P').length;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Sistema de Cronograma de Supervisores Mineros</h1>
        <p>Planificación automática de turnos de perforación</p>
      </div>

      <div className={styles.configSection}>
        <h2>Configuración</h2>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Días de Trabajo</label>
            <input
              type="number"
              value={workDays}
              onChange={(e) => setWorkDays(Math.max(7, parseInt(e.target.value) || 7))}
              min="7"
              max="30"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Días de Descanso Total</label>
            <input
              type="number"
              value={restDays}
              onChange={(e) => setRestDays(Math.max(5, parseInt(e.target.value) || 5))}
              min="5"
              max="14"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Días de Inducción</label>
            <input
              type="number"
              value={inductionDays}
              onChange={(e) => setInductionDays(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              max="5"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Total Días Perforación</label>
            <input
              type="number"
              value={totalDrillingDays}
              onChange={(e) => setTotalDrillingDays(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              max="365"
            />
          </div>
        </div>
        <button onClick={generateSchedule} className={styles.btnCalculate}>
          Calcular Cronograma
        </button>
      </div>

      {schedule && (
        <>
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <div className={`${styles.legendBox} ${styles.stateS}`}></div>
              <span><strong>S</strong> - Subida</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendBox} ${styles.stateI}`}></div>
              <span><strong>I</strong> - Inducción</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendBox} ${styles.stateP}`}></div>
              <span><strong>P</strong> - Perforación</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendBox} ${styles.stateB}`}></div>
              <span><strong>B</strong> - Bajada</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendBox} ${styles.stateD}`}></div>
              <span><strong>D</strong> - Descanso</span>
            </div>
          </div>

          <div className={styles.resultsSection}>
            <h2>Cronograma Generado</h2>
            <div className={styles.tableContainer}>
              <table>
                <thead>
                  <tr>
                    <th className={styles.supervisorLabel}>Día</th>
                    {Array.from({ length: schedule.days }).map((_, i) => (
                      <th key={i}>{i}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={styles.supervisorLabel}>S1</td>
                    {schedule.s1.map((state, i) => (
                      <td key={i} className={getCellStyle(state)}>
                        {state}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className={styles.supervisorLabel}>S2</td>
                    {schedule.s2.map((state, i) => (
                      <td key={i} className={getCellStyle(state)}>
                        {state}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className={styles.supervisorLabel}>S3</td>
                    {schedule.s3.map((state, i) => (
                      <td key={i} className={getCellStyle(state)}>
                        {state}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className={`${styles.supervisorLabel} ${styles.countRow}`}>#P</td>
                    {Array.from({ length: schedule.days }).map((_, i) => {
                      const count = countDrilling(i);
                      const s3Active = schedule.s3[i] !== '-';
                      const isError = count !== 2 && s3Active;
                      return (
                        <td
                          key={i}
                          className={`${styles.countRow} ${isError ? styles.countError : ''}`}
                        >
                          {count}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
                {errors.length > 0 && (
        <div className={`${styles.alert} ${styles.alertError} ${styles.show}`}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <AlertCircle size={20} style={{ color: '#c33', marginRight: '8px' }} />
            <h3>⚠️ Errores Detectados ({errors.length})</h3>
          </div>
          <ul style={{ marginLeft: '20px', listStyle: 'disc', color: '#c33' }}>
            {errors.slice(0, 100).map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
            {errors.length > 100 && (
              <li style={{ fontWeight: 'bold' }}>
                ... y {errors.length - 10} errores más
              </li>
            )}
          </ul>
        </div>
      )}

      {errors.length === 0 && schedule && (
        <div className={`${styles.alert} ${styles.alertSuccess} ${styles.show}`}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircle size={20} style={{ color: '#3c3', marginRight: '8px' }} />
            <h3>✅ Cronograma válido - Sin errores detectados</h3>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default SupervisorScheduler;