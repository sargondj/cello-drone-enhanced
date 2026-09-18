const assert=require('node:assert/strict');
const pitch=require('../pitch.js');
let seed=27;
const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296*2-1;};
function signal(hz,rate,harmonics,noise=0,dc=0){
  return Float32Array.from({length:8192},(_,i)=>dc+noise*random()+harmonics.reduce((sum,amplitude,j)=>sum+amplitude*Math.sin(2*Math.PI*hz*(j+1)*i/rate+.23*j),0));
}
let count=0,maxError=0;
for(const rate of [44100,48000,96000]){
  for(const a4 of [400,440,442,480]){
    for(const midi of [36,43,50,57]){
      for(const cents of [-100,-30,-5,0,5,30,100]){
        const target=pitch.frequency(midi,a4)*2**(cents/1200);
        for(const harmonics of [[.2],[.12,.22,.1,.04,.02],[.04,.2,.16,.07]]){
          const result=pitch.detect(signal(target,rate,harmonics,.001,.03),rate);
          assert.ok(result.hz,JSON.stringify({rate,a4,midi,cents,result}));
          const error=Math.abs(pitch.cents(result.hz,target));
          assert.ok(error<3,JSON.stringify({rate,a4,midi,cents,error}));
          maxError=Math.max(maxError,error);count++;
        }
      }
    }
  }
}
for(const rate of [44100,48000]){
  assert.equal(pitch.detect(new Float32Array(8192),rate).reason,'quiet');
  assert.equal(pitch.detect(new Float32Array(8192).fill(.1),rate).reason,'quiet');
  assert.equal(pitch.detect(Float32Array.from({length:8192},()=>random()*.2),rate).reason,'unreliable');
  assert.equal(pitch.detect(signal(220,rate,[.001]),rate).reason,'quiet');
  assert.equal(pitch.detect(signal(220,rate,[1.3]),rate).reason,'clipping');
  const doubled=pitch.detect(signal(pitch.frequency(36)*2,rate,[.2]),rate);
  assert.ok(Math.abs(pitch.cents(doubled.hz,pitch.frequency(36))-1200)<3,'Do not fold pure octave into selected string');
}
const smoother=pitch.createSmoother();
assert.equal(smoother.push(10),null);assert.equal(smoother.push(11),null);
assert.equal(smoother.push(9),10);
assert.equal(smoother.push(100),null);
smoother.reset();assert.equal(smoother.push(0),null);
assert.equal(pitch.noteName(220),'A3');
console.log('PASS: '+count+' synthetic tone cases; max error '+maxError.toFixed(2)+' cents. Silence, DC, noise, clipping, weak signal, octave preservation, and smoothing checked.');
