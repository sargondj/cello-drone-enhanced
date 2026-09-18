const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
class EventTarget {
  constructor(){this.events={};}
  addEventListener(type,fn){(this.events[type]??=[]).push(fn);}
  dispatch(type,event={}){for(const fn of this.events[type]||[])fn(event);}
}
class Element extends EventTarget{
  constructor(){super();this.value='';this.checked=true;this.disabled=false;this.children=[];this.dataset={};this.style={};this.tagName='DIV';this.textContent='';this.classList={add(){},toggle(){}};}
  setAttribute(k,v){this[k]=String(v);}removeAttribute(k){delete this[k];}
  append(el){this.children.push(el);}replaceChildren(){this.children=[];}
  click(){if(!this.disabled)this.dispatch('click',{});}
  closest(){return this;}
}
const els={},get=id=>els[id]??=new Element();
for(const [id,value] of Object.entries({volume:'30',tone:'warm','metro-volume':'40','scale-start':'3','scale-octaves':'1','scale-hold':'2',tuning:'440',tempo:'80'}))get(id).value=value;
const strings=[36,43,50,57].map(midi=>{const el=new Element();el.dataset.string=String(midi);return el;});
let clock=0,serial=0,microphoneCalls=0,lastConstraints,mode='grant',resolver,lastStream,resumeResolver,delayResume=false;
const timers=new Map(),intervals=new Map(),nodes=[],streams=[];
class Track extends EventTarget{
  constructor(){super();this.readyState='live';this.muted=false;this.stops=0;}
  stop(){this.readyState='ended';this.stops++;}
}
function makeStream(){
 const track=new Track();const s={getTracks:()=>[track],getAudioTracks:()=>[track],track};streams.push(s);lastStream=s;return s;
}
function node(){
 const n={connections:[],disconnected:false,connect(to){this.connections.push(to);},disconnect(){this.disconnected=true;}};nodes.push(n);return n;
}
const param=()=>({value:0,setTargetAtTime(v){this.value=v;},setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;},cancelScheduledValues(){}});
let hz=65.406391,quiet=false;
class AudioContext{
 constructor(){this.state='suspended';this.sampleRate=48000;this.destination={speaker:true};}
 get currentTime(){return clock/1000;}
 resume(){if(delayResume)return new Promise(resolve=>{resumeResolver=()=>{this.state='running';resolve();};});this.state='running';return Promise.resolve();}
 createGain(){return Object.assign(node(),{gain:param()});}
 createOscillator(){return Object.assign(node(),{frequency:param(),start(){},stop(){}});}
 createMediaStreamSource(s){return Object.assign(node(),{micStream:s});}
 createAnalyser(){return Object.assign(node(),{fftSize:2048,getFloatTimeDomainData(data){for(let i=0;i<data.length;i++)data[i]=quiet?0:.15*Math.sin(2*Math.PI*hz*i/48000);}});}
}
const doc=Object.assign(new EventTarget(),{getElementById:get,createElement:()=>new Element(),visibilityState:'visible',body:new Element(),activeElement:new Element(),querySelectorAll:selector=>selector==='[data-string]'?strings:[]});
const win=Object.assign(new EventTarget(),{AudioContext,isSecureContext:true});
const box={window:win,document:doc,navigator:{mediaDevices:{getUserMedia:async constraints=>{
 microphoneCalls++;lastConstraints=constraints;
 if(mode==='deny')throw Object.assign(new Error('denied'),{name:'NotAllowedError'});
 if(mode==='pending')return new Promise(resolve=>{resolver=resolve;});
 return makeStream();
}}},setTimeout:(fn,ms=0)=>{const id=++serial;timers.set(id,{fn,at:clock+ms});return id;},clearTimeout:id=>timers.delete(id),setInterval:fn=>{intervals.set(++serial,fn);return serial;},clearInterval:id=>intervals.delete(id)};
vm.createContext(box);const run=code=>vm.runInContext(code,box);
for(const file of ['app.js','scale.js','pitch.js','tuner.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../',file),'utf8'),box);
const tick=()=>new Promise(setImmediate);
async function advance(ms){
 const end=clock+ms;
 while(true){
   const entry=[...timers.entries()].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];
   if(!entry)break;
   clock=entry[1].at;timers.delete(entry[0]);entry[1].fn();await tick();
 }
 clock=end;
}
(async()=>{
 assert.equal(microphoneCalls,0,'No permission prompt on load');
 await run('start()');await run('startMetronome()');
 await run('CelloTuner.start()');
 assert.equal(run('playing||metroPlaying'),false);
 assert.equal(lastConstraints.video,false);
 assert.equal(lastConstraints.audio.echoCancellation,false);
 assert.equal(get('play').disabled,true);
 await run('start()');await run('startMetronome()');get('scale-play').click();
 assert.equal(run('playing||metroPlaying||ScaleGuide.active()'),false,'Playback blocked during listening');
 await advance(700);
 assert.match(get('tuner-feedback').textContent,/In tune/);
 const micNode=nodes.find(n=>n.micStream);
 assert.equal(micNode.connections.length,1);assert.equal(micNode.connections[0].connections.length,0,'No microphone monitoring');
 quiet=true;await advance(100);
 assert.equal(get('tuner-needle').hidden,true);assert.equal(get('tuner-cents').textContent,'—','Silence clears stale result');
 quiet=false;hz=65.406391*2**(25/1200);await advance(600);
 assert.match(get('tuner-feedback').textContent,/Sharp/);
 hz=65.406391*2**(-25/1200);await advance(600);
 assert.match(get('tuner-feedback').textContent,/Flat/);
 hz=130.812782;await advance(600);
 assert.match(get('tuner-feedback').textContent,/Different note or octave/);
 assert.equal(get('tuner-needle').hidden,true);
 get('tuner-strings').dispatch('click',{target:strings[3]});
 assert.match(get('tuner-target').textContent,/A3/);assert.equal(get('tuner-cents').textContent,'—');
 get('tuning').value='442';get('tuning').dispatch('change');
 assert.equal(get('tuner-reference').textContent,'A4 = 442 Hz');
 assert.match(get('tuner-target').textContent,/221.00/);
 lastStream.track.muted=true;lastStream.track.dispatch('mute');await advance(200);
 assert.match(get('tuner-feedback').textContent,/Microphone paused/);
 lastStream.track.muted=false;
 run('CelloTuner.stop()');assert.equal(lastStream.track.stops,1);
 assert.equal(micNode.disconnected,true);assert.equal(get('play').disabled,false);
 mode='deny';await run('CelloTuner.start()');
 assert.equal(run('CelloTuner.active()'),false);assert.match(get('tuner-error').textContent,/denied/);
 mode='pending';const start=run('CelloTuner.start()');await tick();
 run('CelloTuner.stop()');const late=makeStream();resolver(late);await start;
 assert.equal(late.track.stops,1,'Late grant after cancel is immediately released');
 assert.equal(run('CelloTuner.active()'),false);
 mode='grant';await run('CelloTuner.start()');
 doc.visibilityState='hidden';doc.dispatch('visibilitychange');
 assert.equal(lastStream.track.stops,1);assert.equal(run('CelloTuner.active()'),false);
 doc.visibilityState='visible';
 await run('CelloTuner.start()');
 run("context.state='suspended';context.onstatechange()");
 assert.equal(lastStream.track.stops,1);assert.equal(run('CelloTuner.active()'),false);
 await run('CelloTuner.start()');lastStream.track.readyState='ended';lastStream.track.dispatch('ended');
 assert.equal(run('CelloTuner.active()'),false);
 // Stream acquired while AudioContext resume is pending must still be releasable.
 delayResume=true;const waiting=run('CelloTuner.start()');await tick();
 const held=lastStream;run('CelloTuner.stop()');assert.equal(held.track.stops,1);
 resumeResolver();await waiting;delayResume=false;
 await run('CelloTuner.start()');win.dispatch('pagehide');
 assert.equal(lastStream.track.stops,1);assert.equal(run('CelloTuner.active()'),false);
 const calls=microphoneCalls;win.isSecureContext=false;await run('CelloTuner.start()');
 assert.equal(microphoneCalls,calls);assert.match(get('tuner-error').textContent,/HTTPS/);
 assert.ok(streams.every(s=>s.track.readyState==='ended'),'No leaked streams');
 console.log('PASS: mic permission, quiet/sharp/flat/octave feedback, calibration, no speaker monitoring, transport exclusion, denied/canceled/late permissions, mute/disconnect, hidden tab/page exit, interrupted/pending audio, cleanup.');
})().catch(error=>{console.error(error);process.exit(1)});
