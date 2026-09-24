'use strict';
// Scale transport; all targets and visual updates follow the shared audio clock.
const ScaleGuide=(()=>{
  const keys=[
    ['C',0],['D♭',1],['D',2],['E♭',3],['E',4],['F',5],
    ['F♯',6],['G',7],['A♭',8],['A',9],['B♭',10],['B',11]
  ];
  const letters=['C','D','E','F','G','A','B'],natural=[0,2,4,5,7,9,11];
  const patterns={major:[0,2,4,5,7,9,11],natural:[0,2,3,5,7,8,10],harmonic:[0,2,3,5,7,8,11],melodic:[0,2,3,5,7,9,11]};
  const minorNames=['C','C♯','D','E♭','E','F','F♯','G','G♯','A','B♭','B'];
  const keyName=(index,type)=>type==='major'?keys[index][0]:minorNames[index];
  let running=false,pending=false,token=0,events=0,countIn=4,hold=2,sequence=[],ownedDrone=false,finishing=false;
  let follow=false,position=-1,noteBeat=0,skipRequested=false;
  const review=()=>typeof PracticeReview==='undefined'?null:PracticeReview;
  const timers=new Set();
  const lockIds=['scale-key','scale-type','scale-start','scale-octaves','scale-hold','scale-drone','scale-listen','scale-headphones','scale-reference','scale-pacing','scale-output','tuning','tempo','meter','metro-play'];
  const intonation=()=>typeof ScaleIntonation==='undefined'?null:ScaleIntonation;
  function makeScale(keyIndex,startOctave,length,type='major'){
    const key=keyName(keyIndex,type),pc=keys[keyIndex][1],firstLetter=letters.indexOf(key[0]),base=(startOctave+1)*12+pc;
    function makeNote(degree,steps){
      const midi=base+12*Math.floor(degree/7)+steps[degree%7];
      const letterIndex=(firstLetter+degree)%7;
      const writtenOctave=startOctave+Math.floor((firstLetter+degree)/7);
      const accidental=midi-((writtenOctave+1)*12+natural[letterIndex]);
      const signatureSteps=type==='major'?patterns.major:patterns.natural;
      const keyAccidental=base+12*Math.floor(degree/7)+signatureSteps[degree%7]-((writtenOctave+1)*12+natural[letterIndex]);
      const name=letters[letterIndex]+({[-2]:'♭♭',[-1]:'♭',0:'',1:'♯',2:'♯♯'})[accidental]+writtenOctave;
      return {midi,name,letterIndex,writtenOctave,accidental,keyAccidental};
    }
    const up=Array.from({length:length*7+1},(_,degree)=>makeNote(degree,patterns[type]||patterns.major));
    const down=Array.from({length:length*7},(_,i)=>makeNote(length*7-1-i,type==='melodic'?patterns.natural:(patterns[type]||patterns.major)));
    return up.concat(down);
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
    Array.from($('scale-key').children).forEach((option,i)=>option.textContent=keyName(i,$('scale-type').value||'major'));
    sequence=makeScale(Number($('scale-key').value),Number($('scale-start').value),Number($('scale-octaves').value),$('scale-type').value||'major');
    ScaleNotation.setNotes(sequence,Number($('scale-hold').value));
    $('scale-current').textContent='—';$('scale-next').textContent=sequence[0].name;
    $('scale-beat').textContent='Ready for your count-in';$('scale-status').textContent='Ready';
  }
  function mark(index){
    ScaleNotation.mark(index);
  }
  function clearState(message){
    if(running||pending)review()?.finish(message==='Scale complete');
    token++;running=false;pending=false;finishing=false;
    $('scale-skip').hidden=true;
    intonation()?.stop(message==='Scale complete'?'Scale complete — microphone off.':'Microphone off.');
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
    if(follow&&event>=countIn){
      let changed=false;
      if(position<0){position=0;noteBeat=0;changed=true;}
      else if(noteBeat>=hold&&(skipRequested||intonation()?.ready())){
        const wasSkipped=skipRequested;
        if(wasSkipped)at(time,()=>review()?.skip());
        skipRequested=false;position++;noteBeat=0;changed=true;
      }
      if(position>=sequence.length){
        finishing=true;at(time,()=>{clearState('Scale complete');stopMetronome();mark(sequence.length);});return false;
      }
      const index=position,beat=noteBeat++;
      at(time,()=>showNote(index,beat,time,changed,true));return true;
    }
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
        showNote(index,beat,time,beat===0,false);
      }
    });
    return true;
  }
  function showNote(index,beat,time,changed,waiting){
    if(changed){
      review()?.target(index,time);
      intonation()?.setTarget(sequence[index]);
    }
    const halfway=(sequence.length-1)/2;
    $('scale-status').textContent=index<halfway?'Ascending':index===halfway?'Top note':'Descending';
    $('scale-current').textContent=sequence[index].name;
    $('scale-next').textContent=sequence[index+1]?.name||'Finish';
    $('scale-beat').textContent=(waiting&&beat>=hold?'Waiting for a steady note':'Beat '+(beat+1)+' of '+hold)+' · Note '+(index+1)+' of '+sequence.length;
    mark(index);
  }
  function silent(){return (running||pending)&&$('scale-output').value==='silent';}
  async function startGuide(){
    if(tunerIsActive())return;
    if(running||pending){cancel();return;}
    // Own a fresh metronome run; a count-in always starts on beat one.
    stopMetronome();
    preview();events=0;countIn=beatsPerMeasure;hold=Number($('scale-hold').value);
    follow=$('scale-pacing').value==='follow';position=-1;noteBeat=0;skipRequested=false;
    const currentToken=++token;pending=true;lock(true);button();$('scale-error').textContent='';
    try{
      if(follow&&!$('scale-listen').checked)throw new Error('Enable listening for Wait for me, or choose Steady tempo.');
      if(silent()){stop();} // Silent listening never retains a pre-existing drone.
      if(intonation())await intonation().prepare();
      if(currentToken!==token)return;
      await ensureAudio();
      if(currentToken!==token)return;
      if(document.visibilityState==='hidden')throw new Error('Keep this tab visible to practice.');
      if($('scale-drone').checked&&!silent()){
        note=keys[Number($('scale-key').value)][1];octave=Number($('scale-start').value);renderPitch();
        // Cancel any earlier pending start before claiming a new drone.
        if(!playing){if(starting)stop();ownedDrone=true;await start();}
        if(currentToken!==token)return;
        if(!playing)throw new Error('The drone could not start. Try again.');
      }
      pending=false;running=true;button();
      $('scale-skip').hidden=!follow;
      if($('scale-listen').checked)review()?.begin(sequence,`${keyName(Number($('scale-key').value),$('scale-type').value||'major')} ${$('scale-type').value||'major'} · A4 ${tuning} Hz · ${$('scale-reference').value==='pure'?'Pure intervals':'Equal temperament'} · ${follow?'Wait for me':'Steady tempo'} · ${tempo} BPM`);
      else $('practice-report').hidden=true;
      await startMetronome();
      if(currentToken!==token)return;
      if(!metroPlaying)throw new Error($('metro-error').textContent||'The metronome could not start.');
    }catch(e){
      if(currentToken!==token)return;
      cancel('Could not start');$('scale-error').textContent=e.message;
    }
  }
  keys.forEach(([name],i)=>{
    const option=document.createElement('option');option.value=i;option.textContent=name;$('scale-key').append(option);
  });
  $('scale-key').value='0';
  ['scale-key','scale-type','scale-start','scale-octaves','scale-hold'].forEach(id=>$(id).addEventListener('change',preview));
  $('scale-play').addEventListener('click',startGuide);
  $('scale-skip').addEventListener('click',()=>{if(running&&follow&&position>=0)skipRequested=true;});
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='hidden'&&(running||pending))cancel('Tab hidden — start again for a count-in');
  });
  preview();button();
  return {active:()=>running,schedule,transportStopped,cancel,makeScale,silent};
})();
