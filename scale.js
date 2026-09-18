'use strict';
// Stage 2: visual guide only. Each update is scheduled from the metronome's audio clock.
const ScaleGuide=(()=>{
  const keys=[
    ['C',0],['D♭',1],['D',2],['E♭',3],['E',4],['F',5],
    ['F♯',6],['G',7],['A♭',8],['A',9],['B♭',10],['B',11]
  ];
  const letters=['C','D','E','F','G','A','B'],natural=[0,2,4,5,7,9,11],steps=[0,2,4,5,7,9,11];
  let running=false,pending=false,token=0,events=0,countIn=4,hold=2,sequence=[],ownedDrone=false,finishing=false;
  const timers=new Set();
  const lockIds=['scale-key','scale-start','scale-octaves','scale-hold','scale-drone','tempo','meter','metro-play'];
  function makeScale(keyIndex,startOctave,length){
    const [key,pc]=keys[keyIndex],firstLetter=letters.indexOf(key[0]),base=(startOctave+1)*12+pc;
    const up=[];
    for(let degree=0;degree<=length*7;degree++){
      const midi=base+12*Math.floor(degree/7)+steps[degree%7];
      const letterIndex=(firstLetter+degree)%7;
      const writtenOctave=startOctave+Math.floor((firstLetter+degree)/7);
      const accidental=midi-((writtenOctave+1)*12+natural[letterIndex]);
      const name=letters[letterIndex]+({[-1]:'♭',0:'',1:'♯'})[accidental]+writtenOctave;
      up.push({midi,name});
    }
    return up.concat(up.slice(0,-1).reverse());
  }
  function lock(value){
    lockIds.forEach(id=>$(id).disabled=value);
    // The selected root stays fixed for the duration of the exercise.
    document.querySelectorAll('[data-note],[data-octave]').forEach(el=>el.disabled=value);
  }
  function button(){
    $('scale-play').textContent=pending?'Cancel':running?'Stop scale':'Start scale';
    $('scale-play').setAttribute('aria-pressed',running);
  }
  function preview(){
    sequence=makeScale(Number($('scale-key').value),Number($('scale-start').value),Number($('scale-octaves').value));
    $('scale-notes').replaceChildren();
    sequence.forEach((n,i)=>{
      const el=document.createElement('div');el.className='scale-note';
      const name=document.createElement('strong');name.textContent=n.name;
      const order=document.createElement('small');order.textContent=i+1;
      el.append(name);el.append(order);$('scale-notes').append(el);
    });
    $('scale-current').textContent='—';$('scale-next').textContent=sequence[0].name;
    $('scale-beat').textContent='Ready for your count-in';$('scale-status').textContent='Ready';
  }
  function mark(index){
    Array.from($('scale-notes').children).forEach((el,i)=>{
      el.classList.toggle('current',i===index);
      el.classList.toggle('done',i<index);
      if(i===index)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');
    });
  }
  function clearState(message){
    token++;running=false;pending=false;finishing=false;
    timers.forEach(clearTimeout);timers.clear();
    if(ownedDrone){ownedDrone=false;stop();}
    lock(false);button();mark(-1);
    $('scale-current').textContent='—';$('scale-next').textContent=sequence[0]?.name||'—';
    $('scale-status').textContent=message;
    $('scale-beat').textContent=message;
  }
  function transportStopped(){
    if(running||pending)clearState('Stopped — start again for a count-in');
  }
  function cancel(message='Stopped — start again for a count-in'){
    clearState(message);stopMetronome();
  }
  function at(time,fn){
    const currentToken=token;
    const timer=setTimeout(()=>{
      timers.delete(timer);
      if(!running||currentToken!==token)return;
      fn();
    },Math.max(0,(time-context.currentTime)*1000));
    timers.add(timer);
  }
  function schedule(time){
    if(!running)return true;
    if(finishing)return false;
    const event=events++;
    if(event>=countIn+sequence.length*hold){
      finishing=true;
      at(time,()=>{
        clearState('Scale complete');stopMetronome();
        mark(sequence.length);
        $('scale-next').textContent='—';$('scale-beat').textContent='Ready to play again';
      });
      return false; // No extra click at the end of the final note.
    }
    at(time,()=>{
      if(event<countIn){
        $('scale-status').textContent='Count-in';
        $('scale-current').textContent=String(event+1);
        $('scale-next').textContent=sequence[0].name;
        $('scale-beat').textContent='Count '+(event+1)+' of '+countIn;
      }else{
        const offset=event-countIn,index=Math.floor(offset/hold),beat=offset%hold;
        const halfway=(sequence.length-1)/2;
        $('scale-status').textContent=index<halfway?'Ascending':index===halfway?'Top note':'Descending';
        $('scale-current').textContent=sequence[index].name;
        $('scale-next').textContent=sequence[index+1]?.name||'Finish';
        $('scale-beat').textContent='Beat '+(beat+1)+' of '+hold+' · Note '+(index+1)+' of '+sequence.length;
        mark(index);
      }
    });
    return true;
  }
  async function startGuide(){
    if(tunerIsActive())return;
    if(running||pending){cancel();return;}
    // Own a fresh metronome run; a count-in always starts on beat one.
    stopMetronome();
    preview();events=0;countIn=beatsPerMeasure;hold=Number($('scale-hold').value);
    const currentToken=++token;pending=true;lock(true);button();$('scale-error').textContent='';
    try{
      await ensureAudio();
      if(currentToken!==token)return;
      if(document.visibilityState==='hidden')throw new Error('Keep this tab visible to practice.');
      if($('scale-drone').checked){
        note=keys[Number($('scale-key').value)][1];octave=Number($('scale-start').value);renderPitch();
        // Cancel any earlier pending start before claiming a new drone.
        if(!playing){if(starting)stop();ownedDrone=true;await start();}
        if(currentToken!==token)return;
        if(!playing)throw new Error('The drone could not start. Try again.');
      }
      pending=false;running=true;button();
      await startMetronome();
      if(currentToken!==token)return;
      if(!metroPlaying)throw new Error($('metro-error').textContent||'The metronome could not start.');
    }catch(e){
      if(currentToken!==token)return;
      cancel('Could not start');$('scale-error').textContent=e.message;
    }
  }
  keys.forEach(([name],i)=>{
    const option=document.createElement('option');option.value=i;option.textContent=name+' major';$('scale-key').append(option);
  });
  $('scale-key').value='0';
  ['scale-key','scale-start','scale-octaves','scale-hold'].forEach(id=>$(id).addEventListener('change',preview));
  $('scale-play').addEventListener('click',startGuide);
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='hidden'&&(running||pending))cancel('Tab hidden — start again for a count-in');
  });
  preview();button();
  return {active:()=>running,schedule,transportStopped,cancel,makeScale};
})();
