'use strict';
const CelloTuner=(()=>{
  let selected=36,listening=false,pending=false,request=0,stream=null,source=null,analyser=null;
  let buffer=null,timer=null,settleUntil=0;
  const smoother=CelloPitch.createSmoother();
  const transportIds=['play','metro-play','scale-play'];
  function text(id,value){if($(id).textContent!==value)$(id).textContent=value;}
  function lock(value){transportIds.forEach(id=>$(id).disabled=value);}
  function controls(){
    text('tuner-play',pending?'Cancel microphone request':listening?'Stop tuner':'Start tuner');
    $('tuner-play').setAttribute('aria-pressed',listening);
    text('tuner-status',pending?'Waiting for permission':listening?'Microphone on':'Microphone off');
  }
  function clearReading(message){
    smoother.reset();text('tuner-cents','—');text('tuner-detected','No reading');
    $('tuner-needle').hidden=true;$('tuner-meter').setAttribute('aria-label','No pitch reading');
    $('tuner').dataset.inTune='false';text('tuner-feedback',message);
  }
  function updateTarget(){
    const name=CelloPitch.noteName(CelloPitch.frequency(selected,tuning),tuning);
    text('tuner-target',name+' · '+CelloPitch.frequency(selected,tuning).toFixed(2)+' Hz');
    text('tuner-reference','A4 = '+tuning+' Hz');
    document.querySelectorAll('[data-string]').forEach(el=>el.setAttribute('aria-pressed',Number(el.dataset.string)===selected));
    clearReading(listening?'Bow the selected open string steadily.':'Choose a string, then start the tuner.');
  }
  function stopTuner(message='Microphone off. Playback is ready.'){
    request++;pending=false;listening=false;
    clearTimeout(timer);timer=null;
    if(stream){const old=stream;stream=null;old.getTracks().forEach(track=>track.stop());}
    if(source){source.disconnect();source=null;}
    if(analyser){analyser.disconnect();analyser=null;}
    buffer=null;lock(false);controls();clearReading(message);releaseWakeLockIfIdle();
  }
  function errorMessage(error){
    switch(error?.name){
      case 'NotAllowedError':case 'SecurityError':return 'Microphone access was denied. Allow it in this site’s browser settings, then tap Start tuner.';
      case 'NotFoundError':return 'No microphone was found. Connect or enable one, then try again.';
      case 'NotReadableError':case 'AbortError':return 'The microphone could not be opened. Close other apps using it and try again.';
      default:return error?.message||'Could not start the microphone. Please try again.';
    }
  }
  function showResult(result){
    if(!result.hz){
      const messages={quiet:'Play the selected string, or move the microphone closer.',clipping:'Input is too loud — move the microphone farther away.',unreliable:'No steady pitch yet — bow one open string.'};
      clearReading(messages[result.reason]||messages.unreliable);return;
    }
    const deviation=CelloPitch.cents(result.hz,CelloPitch.frequency(selected,tuning));
    const stable=smoother.push(deviation);
    if(stable===null){
      text('tuner-cents','—');$('tuner-needle').hidden=true;
      $('tuner').dataset.inTune='false';$('tuner-meter').setAttribute('aria-label','Acquiring a stable pitch');
      text('tuner-detected','Acquiring pitch');text('tuner-feedback','Keep the bow steady…');return;
    }
    const measured=CelloPitch.frequency(selected,tuning)*2**(stable/1200);
    text('tuner-detected',CelloPitch.noteName(measured,tuning)+' · '+measured.toFixed(2)+' Hz');
    if(Math.abs(stable)>200){
      text('tuner-cents','—');$('tuner-needle').hidden=true;$('tuner').dataset.inTune='false';
      $('tuner-meter').setAttribute('aria-label','Pitch outside selected string range');
      text('tuner-feedback','Different note or octave detected — check the selected string.');return;
    }
    const rounded=Math.round(stable),label=(rounded>0?'+':'')+rounded+' cents';
    text('tuner-cents',label);
    $('tuner-needle').hidden=false;
    $('tuner-needle').style.left=(50+Math.max(-50,Math.min(50,stable)))+'%';
    const inTune=Math.abs(stable)<=5;
    $('tuner').dataset.inTune=String(inTune);
    const feedback=inTune?'In tune':stable<0?'Flat — raise the pitch slightly':'Sharp — lower the pitch slightly';
    text('tuner-feedback',feedback+(Math.abs(stable)>50?' · beyond the meter range':''));
    $('tuner-meter').setAttribute('aria-label',label+', '+(inTune?'in tune':stable<0?'flat':'sharp'));
  }
  function sample(){
    if(!listening)return;
    if(document.visibilityState==='hidden'){stopTuner('Tab hidden — microphone stopped.');return;}
    if(context.state!=='running'){stopTuner('Audio interrupted — tap Start tuner again.');return;}
    try{
      if(stream.getAudioTracks().some(track=>track.muted)){
        clearReading('Microphone paused — waiting for sound.');
      }else if(context.currentTime>=settleUntil){
        analyser.getFloatTimeDomainData(buffer);
        showResult(CelloPitch.detect(buffer,context.sampleRate));
      }
      timer=setTimeout(sample,100);
    }catch(error){stopTuner('Microphone stopped.');text('tuner-error',errorMessage(error));}
  }
  async function startTuner(){
    if(listening||pending){stopTuner();return;}
    text('tuner-error','');
    if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){
      text('tuner-error','Open the app over HTTPS (or localhost) in a browser with microphone support.');return;
    }
    // Cancel all speaker transports, including asynchronous starts, before listening.
    ScaleGuide.cancel('Stopped for tuning');stop();
    const token=++request;pending=true;lock(true);controls();clearReading('Allow microphone access to tune.');
    try{
      // Start both requests inside this user gesture. Attach rejection handlers immediately.
      const audioReady=ensureAudio().then(()=>null,error=>error);
      const acquired=await navigator.mediaDevices.getUserMedia({
        audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false,channelCount:1},video:false
      });
      if(token!==request){acquired.getTracks().forEach(track=>track.stop());return;}
      stream=acquired;
      // Release the acquired stream even if AudioContext resume never resolves.
      const audioError=await audioReady;
      if(token!==request)return;
      if(audioError)throw audioError;
      if(document.visibilityState==='hidden')throw new Error('Keep this tab visible to tune.');
      const tracks=stream.getAudioTracks();
      if(!tracks.length||tracks.some(track=>track.readyState==='ended'))throw new Error('The microphone disconnected. Try again.');
      tracks.forEach(track=>{
        track.addEventListener('ended',()=>{if(token===request)stopTuner('Microphone disconnected — tap Start tuner again.');});
        track.addEventListener('mute',()=>{if(token===request)clearReading('Microphone paused — waiting for sound.');});
      });
      source=context.createMediaStreamSource(stream);
      analyser=context.createAnalyser();analyser.fftSize=8192;
      buffer=new Float32Array(analyser.fftSize);
      source.connect(analyser); // Deliberately no connection to speakers.
      pending=false;listening=true;settleUntil=context.currentTime+.3;
      controls();clearReading('Bow the selected open string steadily.');acquireWakeLock();sample();
    }catch(error){
      if(token!==request)return;
      stopTuner('Microphone off.');text('tuner-error',errorMessage(error));
    }
  }
  $('tuner-play').addEventListener('click',startTuner);
  $('tuner-strings').addEventListener('click',event=>{
    const el=event.target.closest('[data-string]');
    if(!el)return;selected=Number(el.dataset.string);updateTarget();
  });
  $('tuning').addEventListener('change',updateTarget);
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='hidden'&&(listening||pending))stopTuner('Tab hidden — microphone stopped.');
  });
  window.addEventListener('pagehide',()=>stopTuner('Microphone off.'));
  updateTarget();controls();
  return {active:()=>listening||pending,start:startTuner,stop:stopTuner};
})();
