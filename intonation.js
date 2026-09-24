'use strict';
// Local microphone analysis; only derived measurements go to the practice report.
const ScaleIntonation=(()=>{
  let request=0,pending=false,listening=false,stream=null,source=null,analyser=null,buffer=null,timer=null;
  let target=null,readyAt=0,steadySince=null,canAdvance=false,root=48,reference='equal';
  const smoother=CelloPitch.createSmoother();
  function display(state,message,cents=null){
    $('scale-listening').dataset.state=state;
    $('intonation-status').textContent=state==='reliable'?'Steady pitch':state==='off'?'Microphone off':'No reliable reading';
    $('intonation-feedback').textContent=message;
    $('intonation-cents').textContent=cents===null?'—':`${cents>0?'+':''}${Math.round(cents)}¢`;
    $('intonation-needle').hidden=cents===null;
    if(cents!==null)$('intonation-needle').style.left=(50+Math.max(-50,Math.min(50,cents)))+'%';
    $('intonation-meter').setAttribute('aria-label',cents===null?message:`${Math.round(cents)} cents. ${message}`);
    $('scale-listening').dataset.inTune=String(cents!==null&&Math.abs(cents)<=10);
  }
  function clear(message,state='uncertain'){smoother.reset();steadySince=null;canAdvance=false;display(state,message);}
  function stopListening(message='Microphone off.'){
    request++;pending=false;listening=false;target=null;
    clearTimeout(timer);timer=null;
    if(stream){const old=stream;stream=null;old.getTracks().forEach(t=>t.stop());}
    if(source){source.disconnect();source=null;}
    if(analyser){analyser.disconnect();analyser=null;}
    buffer=null;clear(message,'off');
  }
  function fail(message){ScaleGuide.cancel(message);$('scale-error').textContent=message;}
  function sample(){
    if(!listening)return;
    if(document.visibilityState==='hidden'||context.state!=='running'){fail('Listening interrupted — start the scale again.');return;}
    try{
      if(stream.getAudioTracks().some(t=>t.muted))clear('Microphone paused.');
      else if(!target)clear('Listen to the count-in.');
      else if(context.currentTime<readyAt)clear('Settling on the new note…');
      else{
        const expected=typeof ScaleTuning==='undefined'?CelloPitch.frequency(target.midi,tuning):ScaleTuning.frequency(target.midi,root,tuning,reference);
        if(expected<45||expected>1100)clear('This note is outside the listening range. Follow the notation.');
        else{
          analyser.getFloatTimeDomainData(buffer);
          const result=CelloPitch.detect(buffer,context.sampleRate);
          if(!result.hz){
            const messages={quiet:'No clear sound — bow the current note.',clipping:'Input too loud — move the microphone farther away.',unreliable:'Unclear pitch — bow one note steadily.'};
            clear(messages[result.reason]||messages.unreliable);
          }else{
            const deviation=CelloPitch.cents(result.hz,expected);
            if(Math.abs(deviation)>100){
              clear(`Different note or octave: heard ${CelloPitch.noteName(result.hz,tuning)}; expected ${target.name}.`);
            }else{
              const stable=smoother.push(deviation);
              if(stable===null){canAdvance=false;steadySince=null;display('uncertain','Keep the pitch steady…');}
              else{
                display('reliable',Math.abs(stable)<=10?'In tune':stable<0?'Flat — raise the pitch slightly':'Sharp — lower the pitch slightly',stable);
                if(typeof PracticeReview!=='undefined')PracticeReview.add(deviation,context.currentTime);
                if(Math.abs(stable)<=50){if(steadySince===null)steadySince=context.currentTime;canAdvance=context.currentTime-steadySince>=.24;}
                else{steadySince=null;canAdvance=false;}
              }
            }
          }
        }
      }
      timer=setTimeout(sample,80);
    }catch(error){fail('Microphone stopped — start the scale again.');}
  }
  async function prepare(){
    stopListening();
    if(!$('scale-listen').checked)return;
    if($('scale-output').value!=='silent'&&!$('scale-headphones').checked)throw new Error('Connect headphones and confirm below, or select Silent accompaniment.');
    root=(Number($('scale-start').value)+1)*12+Number($('scale-key').value);
    reference=$('scale-reference').value;
    if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia)throw new Error('Listening needs HTTPS (or localhost) and microphone support.');
    const token=++request;pending=true;clear('Allow microphone access.');
    // Both operations begin in the Start scale gesture; attach audio errors immediately.
    const audioReady=ensureAudio().then(()=>null,error=>error);
    try{
      const acquired=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false,channelCount:1},video:false});
      if(token!==request){acquired.getTracks().forEach(t=>t.stop());return;}
      stream=acquired;
      const audioError=await audioReady;
      if(token!==request)return;
      if(audioError)throw audioError;
      if(document.visibilityState==='hidden')throw new Error('Keep this tab visible to practice.');
      const tracks=stream.getAudioTracks();
      if(!tracks.length||tracks.some(t=>t.readyState==='ended'))throw new Error('The microphone disconnected.');
      tracks.forEach(t=>{
        t.addEventListener('ended',()=>{if(token===request)fail('Microphone disconnected — start the scale again.');});
        t.addEventListener('mute',()=>{if(token===request)clear('Microphone paused.');});
      });
      source=context.createMediaStreamSource(stream);analyser=context.createAnalyser();analyser.fftSize=8192;
      buffer=new Float32Array(analyser.fftSize);source.connect(analyser); // Never monitor to speakers.
      pending=false;listening=true;clear('Listen to the count-in.');sample();
    }catch(error){
      if(token!==request)return;
      stopListening();
      if(error.name==='NotAllowedError'||error.name==='SecurityError')throw new Error('Microphone access denied. Allow it in site settings, or turn off Listen to my playing.');
      throw error;
    }
  }
  function setTarget(note){
    if(!listening)return;
    target=note;
    // Discard the previous note's entire FFT window plus a short bow-transition guard.
    readyAt=context.currentTime+buffer.length/context.sampleRate+.08;
    clear('Settling on the new note…');
  }
  function options(){
    $('scale-listening').hidden=!$('scale-listen').checked;
    if(!$('scale-listen').checked)stopListening();
  }
  $('scale-listen').addEventListener('change',options);
  $('tuning').addEventListener('change',()=>{if(target)setTarget(target);});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&(pending||listening))fail('Tab hidden — listening stopped.');});
  window.addEventListener('pagehide',()=>{if(pending||listening)fail('Listening stopped.');});
  options();
  return {prepare,stop:stopListening,setTarget,ready:()=>listening&&canAdvance,active:()=>pending||listening};
})();
