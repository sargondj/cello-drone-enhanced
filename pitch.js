'use strict';
// Pure signal functions: no microphone, DOM, storage, or network access.
const CelloPitch=(()=>{
  const names=['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
  const frequency=(midi,a4=440)=>a4*2**((midi-69)/12);
  const cents=(hz,target)=>1200*Math.log2(hz/target);
  function noteName(hz,a4=440){
    const midi=Math.round(69+12*Math.log2(hz/a4));
    return names[((midi%12)+12)%12]+(Math.floor(midi/12)-1);
  }
  function detect(input,sampleRate){
    if(!input||input.length<2048||!Number.isFinite(sampleRate)||sampleRate<8000)return {reason:'unreliable'};
    let mean=0,clipped=0;
    for(const v of input){mean+=v;if(Math.abs(v)>=.98)clipped++;}
    if(clipped/input.length>.01)return {reason:'clipping'};
    mean/=input.length;
    let energy=0;
    for(const v of input)energy+=(v-mean)**2;
    const rms=Math.sqrt(energy/input.length);
    if(rms<.003)return {reason:'quiet'};
    // Average decimation reduces CPU use; frequency uses the actual sample rate.
    const stride=Math.max(1,Math.floor(sampleRate/12000));
    const rate=sampleRate/stride,n=Math.floor(input.length/stride),data=new Float32Array(n);
    for(let i=0;i<n;i++){
      let sum=0;for(let j=0;j<stride;j++)sum+=input[i*stride+j]-mean;
      data[i]=sum/stride;
    }
    const windowSize=Math.floor(n/2),maxLag=Math.min(windowSize-2,Math.ceil(rate/45));
    const minLag=Math.max(2,Math.floor(rate/1100));
    const normalized=new Float64Array(maxLag+1);normalized[0]=1;
    let total=0;
    // YIN-style cumulative mean normalized difference, fixed comparison window.
    for(let lag=1;lag<=maxLag;lag++){
      let difference=0;
      for(let i=0;i<windowSize;i++){const d=data[i]-data[i+lag];difference+=d*d;}
      total+=difference;normalized[lag]=total?difference*lag/total:1;
    }
    let lag=minLag;
    for(;lag<maxLag-1;lag++){
      if(normalized[lag]<.15){
        while(lag+1<maxLag&&normalized[lag+1]<normalized[lag])lag++;
        break;
      }
    }
    if(lag>=maxLag-1||normalized[lag]>.15)return {reason:'unreliable'};
    const left=normalized[lag-1],center=normalized[lag],right=normalized[lag+1];
    const denominator=left-2*center+right;
    const offset=denominator===0?0:Math.max(-1,Math.min(1,.5*(left-right)/denominator));
    const hz=rate/(lag+offset);
    if(!Number.isFinite(hz)||hz<45||hz>1100)return {reason:'unreliable'};
    return {hz,rms,periodicity:1-center};
  }
  function createSmoother(){
    let history=[],smoothed=null;
    return {
      reset(){history=[];smoothed=null;},
      push(value){
        // Large jumps start a new acquisition; do not average different notes.
        if(history.length&&Math.abs(value-history[history.length-1])>35){history=[];smoothed=null;}
        history.push(value);if(history.length>5)history.shift();
        if(history.length<3)return null;
        const sorted=[...history].sort((a,b)=>a-b),median=sorted[Math.floor(sorted.length/2)];
        smoothed=smoothed===null?median:.45*median+.55*smoothed;
        return smoothed;
      }
    };
  }
  return {frequency,cents,noteName,detect,createSmoother};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CelloPitch;
