'use strict';
// Move shared controls instead of duplicating audio state or event handlers.
const AppNavigation=(()=>{
  const main=document.querySelector('main'),header=document.querySelector('header');
  const instrument=document.querySelector('.instrument'),metro=document.querySelector('.metronome');
  const tuner=$('tuner'),scale=document.querySelector('.scale-guide');
  const tabs=document.createElement('div');tabs.className='mode-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Practice mode');
  const panels={},buttons={};let mode='practice';
  for(const [id,label] of [['practice','Practice'],['tuner','Tuner'],['scales','Scales']]){
    const button=document.createElement('button');button.type='button';button.id='tab-'+id;button.textContent=label;
    button.setAttribute('role','tab');button.setAttribute('aria-controls','panel-'+id);
    button.addEventListener('click',()=>select(id));
    button.addEventListener('keydown',event=>{
      const ids=Object.keys(buttons),i=ids.indexOf(id);let next;
      if(event.key==='ArrowRight')next=ids[(i+1)%ids.length];
      if(event.key==='ArrowLeft')next=ids[(i+ids.length-1)%ids.length];
      if(event.key==='Home')next=ids[0];if(event.key==='End')next=ids.at(-1);
      if(next){event.preventDefault();select(next);buttons[next].focus();}
    });
    tabs.append(button);buttons[id]=button;
    const panel=document.createElement('div');panel.id='panel-'+id;panel.className='mode-panel';
    panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);panels[id]=panel;main.append(panel);
  }
  header.append(tabs);
  // Reference pitch is useful in every mode; keep the original input/handler.
  const reference=$('tuning').parentElement;reference.classList.add('global-reference');
  reference.querySelector('label').textContent='A4 · Hz';header.append(reference);
  panels.practice.append(instrument,metro);panels.tuner.append(tuner);panels.scales.append(scale);
  // Keep help available without consuming the initial viewport.
  for(const section of [metro,tuner,scale]){
    const hint=section.querySelector('.metro-hint');
    if(hint){const details=document.createElement('details');details.className='mode-help';const summary=document.createElement('summary');summary.textContent='How to use';details.append(summary,hint);section.append(details);}
  }
  document.querySelector('.practice-note')?.remove();document.querySelector('footer')?.remove();
  function select(next){
    if(!panels[next])return;
    if(next!==mode){
      CelloTuner.stop('Microphone off.');ScaleGuide.cancel('Ready for a new count-in');stop();
      mode=next;
    }
    if(next==='scales')panels.scales.append(metro);else panels.practice.append(metro);
    for(const id of Object.keys(panels)){
      panels[id].hidden=id!==next;buttons[id].setAttribute('aria-selected',id===next);buttons[id].tabIndex=id===next?0:-1;
    }
    document.body.dataset.mode=next;
  }
  // Space controls the visible mode, never a hidden drone button.
  document.addEventListener('keydown',event=>{
    if(event.code!=='Space'||event.repeat||['INPUT','SELECT','BUTTON','TEXTAREA','A','SUMMARY'].includes(document.activeElement.tagName))return;
    event.preventDefault();event.stopImmediatePropagation();
    $(mode==='practice'?'play':mode==='tuner'?'tuner-play':'scale-play').click();
  },true);
  select(mode);
  return {select,current:()=>mode};
})();
