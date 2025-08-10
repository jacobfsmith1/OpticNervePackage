import React, { useEffect, useMemo, useState } from 'react'

const PLATES = Array.from({length:16}, (_,i)=>{
  const n = String(i+1).padStart(2,'0')
  return { id:i+1, src:`/plates/plate${n}.jpg` }
})

export default function App(){
  const [patient, setPatient] = useState({name:'', mrn:'', dob:'', note:''})
  const [testEye, setTestEye] = useState('OD')
  const [plateIdx, setPlateIdx] = useState(0)
  const [ishiharaResults, setIshiharaResults] = useState({ OD:Array(16).fill(null), OS:Array(16).fill(null) }) // true/false/null
  const [answerEntry, setAnswerEntry] = useState('')
  const [timer, setTimer] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(()=>{
    if(!running) return
    const id = setInterval(()=>setTimer(t=>t+1),1000)
    return ()=>clearInterval(id)
  },[running])

  // hotkeys
  useEffect(()=>{
    const onKey = (e)=>{
      const k = e.key.toLowerCase()
      if(k==='c'){ e.preventDefault(); mark(true); }
      else if(k==='x'){ e.preventDefault(); mark(false); }
      else if(k==='n' || k==='arrowright'){ e.preventDefault(); setPlateIdx(p=>Math.min(15,p+1)) }
      else if(k==='p' || k==='arrowleft'){ e.preventDefault(); setPlateIdx(p=>Math.max(0,p-1)) }
      else if(/^[0-9]$/.test(k)){ e.preventDefault(); setAnswerEntry(prev => (prev + k).slice(0,3)) }
      else if(k==='backspace'){ setAnswerEntry(prev=>prev.slice(0,-1)) }
      else if(k==='enter'){ e.preventDefault(); submitAnswer() }
    }
    window.addEventListener('keydown', onKey)
    return ()=>window.removeEventListener('keydown', onKey)
  },[plateIdx, testEye, answerEntry])

  const mark = (ok)=>{
    const arr = [...ishiharaResults[testEye]]
    arr[plateIdx] = ok
    setIshiharaResults({...ishiharaResults, [testEye]:arr})
    if(plateIdx<15) setPlateIdx(plateIdx+1)
  }

  const submitAnswer = ()=>{
    // store typed answers into results as true/false? We keep answers out-of-band; here we just clear typed field.
    setAnswerEntry('')
    if(plateIdx<15) setPlateIdx(plateIdx+1)
  }

  const score = (E)=> ishiharaResults[E].filter(x=>x===true).length

  // clinical sections
  const [brightMode, setBrightMode] = useState('WNL')
  const [brightRef, setBrightRef] = useState('OD')
  const [brightPct, setBrightPct] = useState(100)

  const [redMode, setRedMode] = useState('WNL')
  const [redOD, setRedOD] = useState(100)
  const [redOS, setRedOS] = useState(100)

  const [pupilStatus, setPupilStatus] = useState('PERRLA')
  const [apdEye, setApdEye] = useState('OD')
  const [apdGrade, setApdGrade] = useState('1+')

  const [eomsFull, setEomsFull] = useState(true)
  const [eomPain, setEomPain] = useState(false)
  const [diplopia, setDiplopia] = useState(false)

  const [cvfOD, setCvfOD] = useState('Full to CFs')
  const [cvfOS, setCvfOS] = useState('Full to CFs')
  const [disc, setDisc] = useState({color:'pink', perf:'perfused', margins:'sharp', edema:'none', cup:'physiologic', notes:''})
  const [colorNotes, setColorNotes] = useState('')

  const flags = useMemo(()=>{
    const out = []
    if(score('OD')<13) out.push(`OD Ishihara low (${score('OD')}/16)`)
    if(score('OS')<13) out.push(`OS Ishihara low (${score('OS')}/16)`)
    if(brightMode==='Percent' && Math.abs(100-brightPct)>=10){
      const other = brightRef==='OD'?'OS':'OD'
      out.push(`${other} appears ${brightPct}% vs ${brightRef}`)
    }
    if(redMode==='Percent'){ if(redOD<90) out.push(`OD red ${redOD}%`); if(redOS<90) out.push(`OS red ${redOS}%`) }
    if(pupilStatus!=='PERRLA') out.push(`RAPD ${apdEye} ${apdGrade}`)
    if(disc.edema!=='none') out.push(`Disc edema ${disc.edema}`)
    if(disc.color!=='pink') out.push(`Disc color ${disc.color}`)
    return out
  },[ishiharaResults, brightMode, brightPct, brightRef, redMode, redOD, redOS, pupilStatus, apdEye, apdGrade, disc])

  const exportCSV = ()=>{
    const rows = [
      ['Name', patient.name],
      ['MRN', patient.mrn],
      ['DOB', patient.dob],
      ['Ishihara OD', `${score('OD')}/16`],
      ['Ishihara OS', `${score('OS')}/16`],
      ['Brightness', brightMode==='WNL'?'WNL':`ref ${brightRef}, other ${brightPct}%`],
      ['Red desat OD', redMode==='WNL'?'WNL':`${redOD}%`],
      ['Red desat OS', redMode==='WNL'?'WNL':`${redOS}%`],
      ['Pupils', pupilStatus==='PERRLA'?'PERRLA':`APD ${apdEye} ${apdGrade}`],
      ['EOMs', `${eomsFull?'Full':'Limited'}${eomPain?', pain':''}${diplopia?', diplopia':''}`],
      ['CVF OD', cvfOD],
      ['CVF OS', cvfOS],
      ['Disc', `${disc.color}, ${disc.perf}, ${disc.margins}, edema ${disc.edema}, ${disc.cup}`],
      ['Disc notes', disc.notes],
      ['Color notes', colorNotes],
      ['Flags', flags.join(' | ')],
    ]
    const csv = rows.map(([k,v]) => `${k},"${String(v).replaceAll('"','""')}"`).join('\n')
    const blob = new Blob([csv], { type:'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='optic-nerve.csv'; a.click(); URL.revokeObjectURL(url)
  }

  const exportJSON = ()=>{
    const payload = {
      patient,
      ishihara: ishiharaResults,
      brightness: { mode: brightMode, ref: brightRef, pct: brightPct },
      red: { mode: redMode, OD: redOD, OS: redOS },
      pupils: { status:pupilStatus, apdEye, apdGrade },
      eoms: { full:eomsFull, pain:eomPain, diplopia },
      cvf: { OD:cvfOD, OS:cvfOS },
      disc,
      colorNotes,
      flags,
      timestamp: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(payload,null,2)], { type:'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='optic-nerve.json'; a.click(); URL.revokeObjectURL(url)
  }

  // red overlay
  const [redShow, setRedShow] = useState(false)

  return (
    <div>
      <div className="toolbar">
        <div className="brand">
          <div className="icon">👁️</div>
          <div>
            <div className="title">Optic Nerve Package</div>
            <div className="subtitle">Administer + record a full bedside screen</div>
          </div>
        </div>
        <div className="actions">
          <button onClick={exportCSV}>Export CSV</button>
          <button onClick={exportJSON}>Export JSON</button>
        </div>
      </div>

      <div className="container">
        <section className="card">
          <div className="head"><h2>Patient</h2></div>
          <div className="grid g3">
            <label className="field">Name<input value={patient.name} onChange={e=>setPatient({...patient,name:e.target.value})} placeholder="Last, First" /></label>
            <label className="field">MRN<input value={patient.mrn} onChange={e=>setPatient({...patient,mrn:e.target.value})} /></label>
            <label className="field">DOB<input value={patient.dob} onChange={e=>setPatient({...patient,dob:e.target.value})} placeholder="YYYY-MM-DD" /></label>
            <label className="field">Chief note<input value={patient.note} onChange={e=>setPatient({...patient,note:e.target.value})} placeholder="painless ↓VA OD x2d" /></label>
          </div>
        </section>

        <section className="card">
          <div className="head"><h2>Ishihara 16-plate Runner</h2><div className="hint">Plates load from /public/plates</div></div>
          <div className="row">
            <span className="hint">Test eye</span>
            <div className="seg">
              <button className={testEye==='OD'?'active':''} onClick={()=>setTestEye('OD')}>OD</button>
              <button className={testEye==='OS'?'active':''} onClick={()=>setTestEye('OS')}>OS</button>
            </div>
            <button onClick={()=>{setRunning(true); setTimer(0)}}>Start timer</button>
            <button onClick={()=>{setRunning(false); setTimer(0)}}>Stop</button>
            <span className="hint">{timer}s</span>
            <span className="hint">Plate {plateIdx+1} / 16</span>
            <button onClick={()=>setPlateIdx(p=>Math.max(0,p-1))}>Prev</button>
            <button onClick={()=>setPlateIdx(p=>Math.min(15,p+1))}>Next</button>
          </div>
          <div className="imagewrap">
            <img className="img" alt={`Plate ${plateIdx+1}`} src={PLATES[plateIdx].src} />
          </div>
          <div className="row" style={{justifyContent:'center'}}>
            <button className="primary" onClick={()=>mark(true)}>Correct (C)</button>
            <button onClick={()=>mark(false)}>Incorrect (X)</button>
          </div>
          <div className="card" style={{marginTop:12}}>
            <div className="row" style={{justifyContent:'space-between'}}>
              <div>
                <div className="hint">Answer (typed):</div>
                <div className="mono big">{answerEntry || '—'}</div>
              </div>
              <div className="hint">Hotkeys: digits • ⌫ • Enter • C • X • N/→ • P/←</div>
            </div>
            <div className="keypad">
              {[1,2,3,4,5,6,7,8,9,0].map(n=> <button key={n} onClick={()=>setAnswerEntry(prev => (prev+String(n)).slice(0,3))}>{n}</button>)}
              <button onClick={()=>setAnswerEntry(s=>s.slice(0,-1))}>⌫</button>
              <button className="primary" onClick={submitAnswer}>Submit ⏎</button>
            </div>
          </div>
          <div className="grid g2">
            <div className="field"><div>OD score</div><div className="mono big">{score('OD')}/16</div></div>
            <div className="field"><div>OS score</div><div className="mono big">{score('OS')}/16</div></div>
          </div>
        </section>

        <section className="card">
          <div className="head"><h2>Bright Red Dot</h2><button onClick={()=>setRedShow(true)}>Fullscreen</button></div>
          <div className="hint">Use for red desaturation / brightness comparison at a fixed distance.</div>
          <div className="dot"></div>
        </section>

        <section className="card">
          <div className="head"><h2>Brightness / Red Desat</h2></div>
          <div className="row">
            <label className="row"><input type="radio" checked={brightMode==='WNL'} onChange={()=>setBrightMode('WNL')} /> WNL</label>
            <label className="row"><input type="radio" checked={brightMode==='Percent'} onChange={()=>setBrightMode('Percent')} /> Percent</label>
            {brightMode==='Percent' && (<>
              <label className="row">Ref
                <select value={brightRef} onChange={e=>setBrightRef(e.target.value)}><option>OD</option><option>OS</option></select>
              </label>
              <label className="row">% <input type="number" min={0} max={100} value={brightPct} onChange={e=>setBrightPct(Number(e.target.value))} /></label>
            </>)}
          </div>
          <div className="row">
            <label className="row"><input type="radio" checked={redMode==='WNL'} onChange={()=>setRedMode('WNL')} /> WNL</label>
            <label className="row"><input type="radio" checked={redMode==='Percent'} onChange={()=>setRedMode('Percent')} /> Percent</label>
            {redMode==='Percent' && (<>
              <label className="row">OD % <input type="number" min={0} max={100} value={redOD} onChange={e=>setRedOD(Number(e.target.value))} /></label>
              <label className="row">OS % <input type="number" min={0} max={100} value={redOS} onChange={e=>setRedOS(Number(e.target.value))} /></label>
            </>)}
          </div>
        </section>

        <section className="card">
          <div className="head"><h2>Pupils / EOMs / CVF / Disc</h2></div>
          <div className="grid g3">
            <label className="field">Pupils
              <select value={pupilStatus} onChange={e=>setPupilStatus(e.target.value)}>
                <option value="PERRLA">PERRLA</option>
                <option value="APD">APD present</option>
              </select>
            </label>
            {pupilStatus!=='PERRLA' && (<>
              <label className="field">APD eye
                <select value={apdEye} onChange={e=>setApdEye(e.target.value)}><option>OD</option><option>OS</option></select>
              </label>
              <label className="field">APD grade
                <select value={apdGrade} onChange={e=>setApdGrade(e.target.value)}><option>1+</option><option>2+</option><option>3+</option><option>4+</option></select>
              </label>
            </>)}
            <label className="row"><input type="checkbox" checked={eomsFull} onChange={e=>setEomsFull(e.target.checked)} /> EOMs full</label>
            <label className="row"><input type="checkbox" checked={eomPain} onChange={e=>setEomPain(e.target.checked)} /> Pain with EOMs</label>
            <label className="row"><input type="checkbox" checked={diplopia} onChange={e=>setDiplopia(e.target.checked)} /> Diplopia</label>
            <label className="field">CVF OD<input value={cvfOD} onChange={e=>setCvfOD(e.target.value)} /></label>
            <label className="field">CVF OS<input value={cvfOS} onChange={e=>setCvfOS(e.target.value)} /></label>
            <label className="field">Disc color
              <select value={disc.color} onChange={e=>setDisc(d=>({...d,color:e.target.value}))}>
                <option>pink</option><option>pale</option><option>hyperemic</option>
              </select>
            </label>
            <label className="field">Perfusion
              <select value={disc.perf} onChange={e=>setDisc(d=>({...d,perf:e.target.value}))}>
                <option>perfused</option><option>hypoperfused</option>
              </select>
            </label>
            <label className="field">Margins
              <select value={disc.margins} onChange={e=>setDisc(d=>({...d,margins:e.target.value}))}>
                <option>sharp</option><option>blurred</option>
              </select>
            </label>
            <label className="field">Edema
              <select value={disc.edema} onChange={e=>setDisc(d=>({...d,edema:e.target.value}))}>
                <option>none</option><option>trace</option><option>1+</option><option>2+</option><option>3+</option><option>4+</option>
              </select>
            </label>
            <label className="field">Cupping
              <select value={disc.cup} onChange={e=>setDisc(d=>({...d,cup:e.target.value}))}>
                <option>physiologic</option><option>increased</option><option>notching</option>
              </select>
            </label>
            <label className="field">Disc notes<input value={disc.notes} onChange={e=>setDisc(d=>({...d,notes:e.target.value}))} /></label>
          </div>
        </section>

        <section className="card">
          <div className="head"><h2>Summary & Flags</h2></div>
          <ul className="mono">
            {flags.length===0 ? <li>No flags.</li> : flags.map((f,i)=><li key={i}>{f}</li>)}
          </ul>
          <label className="field">EMR paste
            <textarea rows={10} className="mono" value={
`Optic nerve package:
VA: OD ${patient.vaOD||'-'}, OS ${patient.vaOS||'-'}
Ishihara: OD ${score('OD')}/16, OS ${score('OS')}/16
Brightness: ${brightMode==='WNL' ? 'WNL' : `ref ${brightRef}, other ${brightPct}%`}
Red desaturation: ${redMode==='WNL' ? 'WNL' : `OD ${redOD}%, OS ${redOS}%`}
Pupils: ${pupilStatus==='PERRLA' ? 'PERRLA' : `APD ${apdEye} ${apdGrade}`}
EOMs: ${eomsFull ? 'full' : 'limited'}${eomPain ? ', pain' : ''}${diplopia ? ', diplopia' : ''}
CVF: OD ${cvfOD}; OS ${cvfOS}
Disc: ${disc.color}, ${disc.perf}, ${disc.margins}, edema ${disc.edema}, ${disc.cup}. ${disc.notes || ''}
Color notes: ${colorNotes || ''}
Flags: ${flags.join(' | ') || 'none'}`
            } onChange={()=>{}} />
          </section>
      </div>

      <div className={redShow?'overlay show':'overlay'}>
        <button className="ghost" onClick={()=>setRedShow(false)} style={{position:'absolute',top:12,right:12}}>Exit</button>
        <div className="dot"></div>
      </div>

      <footer>Built for fast ER use. Plates load from /public/plates.</footer>
    </div>
  )
}
