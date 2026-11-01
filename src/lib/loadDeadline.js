export const PROGRESS_MIN_LOAD_MS=3000;
export const MAX_LOAD_MS=10000;

// The race also covers requests that stall before their fetch starts (for
// example while waiting for an auth lock), when aborting fetch alone is not enough.
export async function loadWithDeadline(load,{minimumMs=0,timeoutMessage='The online request took too long to load.'}={}) {
  const started=Date.now(),controller=new AbortController();
  let timer;
  const deadline=new Promise((_,reject)=>{
    timer=setTimeout(()=>{
      const error=new Error(timeoutMessage);error.code='LOAD_TIMEOUT';
      reject(error);controller.abort();
    },MAX_LOAD_MS);
  });
  try{
    return await Promise.race([Promise.resolve().then(()=>load(controller.signal)),deadline]);
  }finally{
    clearTimeout(timer);
    const remaining=minimumMs-(Date.now()-started);
    if(remaining>0)await new Promise(resolve=>setTimeout(resolve,remaining));
  }
}
