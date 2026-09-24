'use strict';
const $ = id => document.getElementById(id);
const pitches = [ ['C',''], ['D♭','C♯'], ['D',''], ['E♭','D♯'], ['E',''], ['F',''], ['G♭','F♯'], ['G',''], ['A♭','G♯'], ['A',''], ['B♭','A♯'], ['B',''] ];
let note=0, octave=3, tuning=440, context=null, master=null, voices=[], playing=false, starting=false, requestId=0, wakeLock=null;
const frequency = () => tuning * 2 ** (((octave+1)*12 + note - 69)/12);
function renderPitch(){
  $('note-display').textContent=pitches[note][0];
  $('octave-display').textContent=octave;
  $('frequency').textContent=frequency().toFixed(2);
  $('register').textContent=({2:'Low register',3:'Middle register',4:'High register'})[octave];
  document.querySelectorAll('[data-note]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.note)===note));
  document.querySelectorAll('[data-octave]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.octave)===octave));
  if(playing) voices.forEach((v,i)=>v.osc.frequency.setTargetAtTime(frequency()*(i+1),context.currentTime,.008));
}
pitches.forEach(([name,alias],i)=>{
  const b=document.createElement('button'); b.type='button'; b.dataset.note=i;
  b.setAttribute('aria-label',name+(alias?' / '+alias:'')); b.setAttribute('aria-pressed',i===note);
  b.textContent=name;
  if(alias){const s=document.createElement('small');s.textContent=alias;b.append(s);}
  b.addEventListener('click',()=>{note=i;renderPitch();}); $('notes').append(b);
});
$('octaves').addEventListener('click',e=>{const b=e.target.closest('[data-octave]');if(b){octave=Number(b.dataset.octave);renderPitch();}});
function updateTone(){if(!context)return;const weights=$('tone').value==='warm'?[1,.25,.1]:[1,0,0];voices.forEach((v,i)=>v.gain.gain.setTargetAtTime(weights[i]/1.35,context.currentTime,.025));}
function level(){return .42;}
function ui(){
  document.body.classList.toggle('playing',playing);
  $('play-label').textContent=starting?'Cancel':playing?'Stop drone':'Play drone';
  $('play-icon').textContent=playing||starting?'■':'▶';
  $('status').textContent=starting?'Starting…':playing?'Playing':'Ready';
  $('play-hint').textContent=playing?'Listen, settle into the pitch, and play.':'A steady note, for as long as you need.';
}
function tunerIsActive(){return typeof CelloTuner!=='undefined'&&CelloTuner.active();}
async function acquireWakeLock(){
  if(!('wakeLock' in navigator)||!(playing||metroPlaying||tunerIsActive())||document.visibilityState!=='visible'||wakeLock)return;
  try{const lock=await navigator.wakeLock.request('screen');if(!(playing||metroPlaying||tunerIsActive())){await lock.release();return;}wakeLock=lock;lock.addEventListener('release',()=>{if(wakeLock===lock)wakeLock=null;});}catch{/* Screen wake lock is optional. */}
}
function stop(){
  requestId++;starting=false;playing=false;
  if(master&&context){
    const oldMaster=master,oldVoices=voices,t=context.currentTime;
    oldMaster.gain.cancelScheduledValues(t);oldMaster.gain.setTargetAtTime(0,t,.02);
    oldVoices.forEach(v=>{v.osc.stop(t+.15);v.osc.onended=()=>{v.osc.disconnect();v.gain.disconnect();};});
    setTimeout(()=>oldMaster.disconnect(),250);
  }
  master=null;voices=[];
  releaseWakeLockIfIdle();
  ui();
}
async function start(){
  if(tunerIsActive())return;
  const thisRequest=++requestId;starting=true;ui();$('error').textContent='';
  try{
    await ensureAudio();
    if(thisRequest!==requestId)return;
    if(context.state!=='running')throw new Error('Audio is paused by your device. Tap Play to try again.');
    const t=context.currentTime;master=context.createGain();master.gain.value=0;master.connect(context.destination);
    voices=[1,2,3].map(h=>{const osc=context.createOscillator(),gain=context.createGain();osc.type='sine';osc.frequency.value=frequency()*h;gain.gain.value=0;osc.connect(gain);gain.connect(master);osc.start(t);return{osc,gain};});
    updateTone();master.gain.setTargetAtTime(level(),t,.035);
    playing=true;starting=false;ui();acquireWakeLock();
  }catch(e){if(thisRequest!==requestId)return;stop();$('error').textContent=e.message||'Could not start audio. Tap Play to try again.';}
}
$('play').addEventListener('click',()=>{if(playing||starting)stop();else start();});
$('tone').addEventListener('change',updateTone);
$('tuning').addEventListener('change',()=>{const value=Number($('tuning').value);if(!Number.isFinite(value)||value<400||value>480){$('tuning').value=tuning;$('error').textContent='Choose an A4 tuning between 400 and 480 Hz.';return;}tuning=value;$('error').textContent='';renderPitch();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')acquireWakeLock();});
window.addEventListener('pagehide',()=>{stopMetronome();stop();});
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat&&!['INPUT','SELECT','BUTTON','TEXTAREA','A'].includes(document.activeElement.tagName)){e.preventDefault();$('play').click();}});
renderPitch();


// Independent metronome transport; both instruments share the audio clock.
let metroPlaying=false, metroStarting=false, metroRequest=0, metroGain=null;
let metroTimer=null, nextBeatTime=0, beatIndex=0, tempo=80, beatsPerMeasure=4;
const scheduledClicks=new Set(), beatTimers=new Set();
function releaseWakeLockIfIdle(){
  if(!playing&&!metroPlaying&&!tunerIsActive()&&wakeLock){const lock=wakeLock;wakeLock=null;lock.release().catch(()=>{});}
}
async function ensureAudio(){
  const AudioContext=window.AudioContext||window.webkitAudioContext;
  if(!AudioContext)throw new Error('Audio is not supported in this browser.');
  if(!context||context.state==='closed'){
    context=new AudioContext();
    context.onstatechange=()=>{
      if(context.state!=='running'){
        if(typeof ScaleIntonation!=='undefined'&&ScaleIntonation.active())ScaleGuide.cancel('Audio interrupted — start the scale again.');
        if(tunerIsActive())CelloTuner.stop('Audio interrupted — tap Start tuner again.');
        if(playing){stop();$('status').textContent='Paused';$('play-hint').textContent='Audio was interrupted. Tap Play to resume.';}
        if(metroPlaying){stopMetronome();$('metro-status').textContent='Paused — tap Start to resume';}
      }
    };
  }
  await context.resume();
  if(context.state!=='running')throw new Error('Audio is paused by your device. Tap Start to try again.');
}
function metroLevel(){return .35;}
function drawBeats(){
  $('beat-lights').replaceChildren();
  for(let i=0;i<beatsPerMeasure;i++){
    const el=document.createElement('span');el.textContent=i+1;
    if(i===0&&$('accent').checked)el.classList.add('downbeat');
    $('beat-lights').append(el);
  }
}
function metroUi(){
  $('metro-play').textContent=metroStarting?'Cancel':metroPlaying?'Stop metronome':'Start metronome';
  $('metro-play').setAttribute('aria-pressed',metroPlaying);
  $('metro-status').textContent=metroStarting?'Starting…':metroPlaying?tempo+' BPM':'Ready';
}
function scheduleClick(time,beat){
  const osc=context.createOscillator(),gain=context.createGain();
  osc.frequency.value=beat===0&&$('accent').checked?1400:900;
  gain.gain.setValueAtTime(0,time);
  gain.gain.linearRampToValueAtTime(1,time+.002);
  gain.gain.exponentialRampToValueAtTime(.001,time+.045);
  osc.connect(gain);gain.connect(metroGain);
  const click={osc,gain};scheduledClicks.add(click);
  osc.onended=()=>{osc.disconnect();gain.disconnect();scheduledClicks.delete(click);};
  osc.start(time);osc.stop(time+.05);
  const token=metroRequest;
  const timer=setTimeout(()=>{
    beatTimers.delete(timer);
    if(!metroPlaying||token!==metroRequest)return;
    Array.from($('beat-lights').children).forEach((el,i)=>el.classList.toggle('active',i===beat));
  },Math.max(0,(time-context.currentTime)*1000));
  beatTimers.add(timer);
}
function scheduleBeats(){
  if(!metroPlaying)return;
  // After a delayed callback, skip elapsed beats instead of playing a burst.
  const now=context.currentTime, interval=60/tempo;
  if(nextBeatTime<now){
    if(typeof ScaleGuide!=='undefined'&&ScaleGuide.active()){
      ScaleGuide.cancel('Timing interrupted — start the scale again.');return;
    }
    const skipped=Math.ceil((now-nextBeatTime)/interval);
    nextBeatTime+=skipped*interval;beatIndex=(beatIndex+skipped)%beatsPerMeasure;
  }
  while(nextBeatTime<now+.1){
    if(typeof ScaleGuide!=='undefined'&&!ScaleGuide.schedule(nextBeatTime))return;
    scheduleClick(nextBeatTime,beatIndex);
    nextBeatTime+=interval;beatIndex=(beatIndex+1)%beatsPerMeasure;
  }
}
function stopMetronome(){
  if(typeof ScaleGuide!=='undefined')ScaleGuide.transportStopped();
  metroRequest++;metroStarting=false;metroPlaying=false;
  clearInterval(metroTimer);metroTimer=null;
  beatTimers.forEach(clearTimeout);beatTimers.clear();
  if(metroGain){
    const old=metroGain;
    old.gain.cancelScheduledValues(context.currentTime);
    old.gain.setTargetAtTime(0,context.currentTime,.005);
    for(const click of scheduledClicks)click.osc.stop(context.currentTime+.02);
    setTimeout(()=>old.disconnect(),40);metroGain=null;
  }
  drawBeats();metroUi();releaseWakeLockIfIdle();
}
async function startMetronome(){
  if(tunerIsActive())return;
  const token=++metroRequest;metroStarting=true;metroUi();$('metro-error').textContent='';
  try{
    await ensureAudio();
    if(token!==metroRequest)return;
    if(document.visibilityState==='hidden')throw new Error('Keep this tab visible to start the metronome.');
    metroGain=context.createGain();metroGain.gain.value=metroLevel();metroGain.connect(context.destination);
    metroPlaying=true;metroStarting=false;beatIndex=0;nextBeatTime=context.currentTime+.05;
    metroUi();scheduleBeats();metroTimer=setInterval(scheduleBeats,25);acquireWakeLock();
  }catch(e){
    if(token!==metroRequest)return;
    stopMetronome();$('metro-error').textContent=e.message||'Could not start the metronome.';
  }
}
$('metro-play').addEventListener('click',()=>{if(metroPlaying||metroStarting)stopMetronome();else startMetronome();});
$('tempo').addEventListener('change',()=>{
  const value=Number($('tempo').value);
  if(!Number.isInteger(value)||value<30||value>240){
    $('tempo').value=tempo;$('metro-error').textContent='Choose a whole-number tempo from 30 to 240 BPM.';return;
  }
  tempo=value;$('metro-error').textContent='';metroUi();
});
$('meter').addEventListener('change',()=>{
  const wasPlaying=metroPlaying;if(wasPlaying)stopMetronome();
  beatsPerMeasure=Number($('meter').value);drawBeats();
  if(wasPlaying)startMetronome();
});
$('accent').addEventListener('change',drawBeats);
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='hidden'&&(metroPlaying||metroStarting)){
    stopMetronome();$('metro-status').textContent='Paused — return and tap Start';
  }
});
drawBeats();metroUi();
