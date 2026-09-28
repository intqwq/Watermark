import {embedTrace,detectTrace} from './trace-codec.js?v=c9339be02f85';
self.onmessage=({data:{operation,width,height,buffer,id}})=>{
  try{
    const image={width,height,data:new Uint8ClampedArray(buffer)};
    if(operation==='embed'){
      const result=embedTrace(image,id);
      self.postMessage({result,buffer:image.data.buffer},[image.data.buffer]);
    }else if(operation==='detect')self.postMessage({result:detectTrace(image)});
    else throw new Error('Unknown operation');
  }catch(error){self.postMessage({error:error.message});}
};
