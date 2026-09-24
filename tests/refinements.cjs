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
const doc=Object.assign(new EventTarget(),{getElementById:get,createElement:()=>new Element(),createElementNS:()=>new Element(),visibilityState:'visible',body:new Element(),activeElement:new Element(),querySelectorAll:selector=>selector==='[data-string]'?strings:[]});
const win=Object.assign(new EventTarget(),{AudioContext,isSecureContext:true});
const box={window:win,document:doc,navigator:{mediaDevices:{getUserMedia:async constraints=>{
 microphoneCalls++;lastConstraints=constraints;
 if(mode==='deny')throw Object.assign(new Error('denied'),{name:'NotAllowedError'});
 if(mode==='pending')return new Promise(resolve=>{resolver=resolve;});
 return makeStream();
}}},setTimeout:(fn,ms=0)=>{const id=++serial;timers.set(id,{fn,at:clock+ms});return id;},clearTimeout:id=>timers.delete(id),setInterval:fn=>{intervals.set(++serial,fn);return serial;},clearInterval:id=>intervals.delete(id)};
vm.createContext(box);const run=code=>vm.runInContext(code,box);
for(const file of ['app.js','scale-tuning.js','review.js','notation.js','scale.js','pitch.js','tuner.js','intonation.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../',file),'utf8'),box);
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
async function startGuide(){get('scale-play').click();await tick();await tick();await tick();}
async function playTime(ms){for(let i=0;i<ms;i+=25){await advance(Math.min(25,ms-i));for(const fn of [...intervals.values()])fn();}}
(async()=>{
 const pitch=require('../scale-tuning.js'),review=require('../review.js');
 assert.equal(pitch.frequency(52,48,440,'pure')/pitch.frequency(48,48,440,'pure'),1.25);
 assert.equal(pitch.frequency(51,48,440,'pure')/pitch.frequency(48,48,440,'pure'),1.2);
 assert.equal(pitch.frequency(60,48,440,'pure')/pitch.frequency(48,48,440,'pure'),2);
 assert.equal(pitch.frequency(50,48,442,'equal'),442*2**((50-69)/12));
 const row={name:'C3',started:0,skipped:false,samples:[{time:.4,cents:20},{time:.5,cents:25},{time:.6,cents:30}]};
 assert.equal(review.summarize(row).status,'Tends sharp');assert.equal(review.summarize(row).inTunePercent,0);
 assert.equal(review.summarize({...row,skipped:true}).status,'Unscored');
 assert.equal(review.summarize({...row,samples:[]}).status,'Unscored');
 assert.equal(review.summarize({...row,samples:[{time:.4,cents:0},{time:.41,cents:0},{time:.42,cents:0}]}).status,'Unscored');
 get('scale-listen').checked=true;get('scale-headphones').checked=false;get('scale-output').value='silent';get('scale-reference').value='pure';
 await run('ScaleIntonation.prepare()');hz=pitch.frequency(52,48,440,'pure');run("ScaleIntonation.setTarget({midi:52,name:'E3'})");await advance(800);
 assert.match(get('intonation-feedback').textContent,/In tune/,'Live analysis uses the selected pure ratio');run('ScaleIntonation.stop()');
 // Follow mode stays on the target during silence, and advances only after settled sound.
 get('scale-reference').value='equal';get('scale-pacing').value='follow';get('scale-hold').value='1';get('tempo').value='120';get('tempo').dispatch('change');
 quiet=true;await startGuide();assert.equal(run('playing'),false,'Silent mode suppresses drone');assert.equal(run('metroGain.gain.value'),0,'Silent mode mutes clicks');
 assert.equal(get('tuning').disabled,true,'Reference is fixed for this report');
 await playTime(4500);assert.equal(get('scale-current').textContent,'C3','Silence does not advance');assert.match(get('scale-beat').textContent,/Waiting/);
 quiet=false;hz=pitch.frequency(48,48,440,'equal');await playTime(1000);assert.equal(get('scale-current').textContent,'D3');
 quiet=true;await playTime(1000);assert.equal(get('scale-current').textContent,'D3','Next target resets qualification');
 get('scale-skip').click();await playTime(600);assert.equal(get('scale-current').textContent,'E3');
 run('ScaleGuide.cancel()');assert.equal(lastStream.track.stops,1);assert.equal(get('tuning').disabled,false);
 assert.equal(get('practice-report').hidden,false);assert.equal(get('report-heading').textContent,'Partial scale review');
 const rows=get('report-rows').children;assert.equal(rows.length,15);
 assert.equal(rows[0].children[1].textContent,'Centered');assert.equal(rows[1].children[2].textContent,'Skipped');assert.equal(rows[14].children[2].textContent,'Not reached');
 // A complete silent fixed-tempo run with no sound must not earn a score.
 get('scale-pacing').value='steady';get('tempo').value='240';get('tempo').dispatch('change');await startGuide();await playTime(5000);
 assert.equal(get('report-heading').textContent,'Scale review');assert.match(get('report-summary').textContent,/0 of 15 notes reviewed/);assert.match(get('report-summary').textContent,/No score/);
 assert.ok(get('report-rows').children.every(r=>r.children[1].textContent==='Unscored'));
 // All skipped notes can finish a follow run, including the last target.
 get('scale-pacing').value='follow';await startGuide();await playTime(1300);
 for(let i=0;i<15;i++){get('scale-skip').click();await playTime(350);}
 assert.equal(get('scale-status').textContent,'Scale complete');assert.equal(run('ScaleGuide.active()||ScaleIntonation.active()||metroPlaying'),false);
 assert.ok(get('report-rows').children.every(r=>r.children[2].textContent==='Skipped'));
 // Follow mode is gated on listening; opting out retains a no-microphone guide.
 get('scale-listen').checked=false;get('scale-pacing').value='follow';const calls=microphoneCalls;await startGuide();assert.equal(microphoneCalls,calls);assert.match(get('scale-error').textContent,/Enable listening/);
 assert.ok(streams.every(s=>s.track.readyState==='ended'));
 console.log('PASS: ratio references, report statistics/unscored rules, pure live target, silent output, pause/follow/skip, partial/complete report, fixed calibration, no-sound no-score, listen gate and stream cleanup.');
})().catch(error=>{console.error(error);process.exit(1)});
