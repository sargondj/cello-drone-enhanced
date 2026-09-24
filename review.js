'use strict';
// Only derived pitch measurements are retained, in memory, for the current report.
const PracticeReview=(()=>{
  const median=a=>{const s=[...a].sort((a,b)=>a-b),m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2;};
  function summarize(row){
    const enough=!row.skipped&&row.samples.length>=3&&row.samples.at(-1).time-row.samples[0].time>=.15;
    if(!enough)return {name:row.name,status:'Unscored',reason:row.skipped?'Skipped':row.started===null?'Not reached':'Not enough steady pitch',samples:row.samples.length};
    const values=row.samples.map(s=>s.cents),bias=median(values);
    const absoluteCents=median(values.map(Math.abs));
    return {name:row.name,status:Math.abs(bias)<=10?(absoluteCents<=10?'Centered':'Mixed'):bias<0?'Tends flat':'Tends sharp',cents:bias,absoluteCents,inTunePercent:Math.round(100*values.filter(v=>Math.abs(v)<=10).length/values.length),samples:values.length,steadyAfter:(row.firstSteady??row.samples[0].time)-row.started};
  }
  let session=null,active=false;
  function begin(notes,settings){
    session={settings,rows:notes.map(n=>({name:n.name,samples:[],started:null,skipped:false})),current:-1};active=true;
    $('practice-report').hidden=true;$('practice-report').open=false;
  }
  function target(index,time){if(active){session.current=index;session.rows[index].started=time;}}
  function add(cents,time){
    if(!active||session.current<0||!Number.isFinite(cents)||Math.abs(cents)>100)return;
    const row=session.rows[session.current];
    // Bound memory during a long pause. Keep the latest ~80 seconds at 80 ms/sample.
    if(row.firstSteady===undefined)row.firstSteady=time;
    row.samples.push({cents,time});if(row.samples.length>1000)row.samples.shift();
  }
  function skip(){if(active&&session.current>=0)session.rows[session.current].skipped=true;}
  function finish(complete){
    if(!active)return;active=false;
    const rows=session.rows.map(summarize),scored=rows.filter(r=>r.status!=='Unscored');
    const mean=scored.length?Math.round(scored.reduce((sum,r)=>sum+r.inTunePercent,0)/scored.length):null;
    $('report-heading').textContent=complete?'Scale review':'Partial scale review';
    $('report-summary').textContent=`${scored.length} of ${rows.length} notes reviewed · ${mean===null?'No score available':mean+'% of steady readings within ±10¢ (equal weight per reviewed note)'}. ${session.settings}`;
    $('report-rows').replaceChildren();
    rows.forEach((r,i)=>{
      const tr=document.createElement('tr');
      const fields=[`${i+1}. ${r.name}`,r.status,r.status==='Unscored'?r.reason:`${r.cents>0?'+':''}${Math.round(r.cents)}¢ · ${r.inTunePercent}% · ${r.samples} samples`,r.steadyAfter===undefined?'—':r.steadyAfter.toFixed(2)+' s'];
      fields.forEach(value=>{const td=document.createElement('td');td.textContent=value;tr.append(td);});$('report-rows').append(tr);
    });
    $('practice-report').hidden=false;$('practice-report').open=true;
  }
  return {begin,target,add,skip,finish,summarize};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=PracticeReview;
