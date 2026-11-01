export const MAX_PHOTO_BYTES=5*1024*1024;
export function validPhotoData(value){return typeof value==='string'&&value.length<=65536&&/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value);}
export async function prepareProfilePhoto(file){
  if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Choose a JPG, PNG or WebP image.');
  if(file.size>MAX_PHOTO_BYTES)throw Error('Choose an image smaller than 5 MB.');
  let image;
  try{image=await createImageBitmap(file);}catch{throw Error('This image could not be opened. Choose another image.');}
  try{
    const canvas=document.createElement('canvas');canvas.width=192;canvas.height=192;
    const ctx=canvas.getContext('2d'),side=Math.min(image.width,image.height);
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,192,192);
    ctx.drawImage(image,(image.width-side)/2,(image.height-side)/2,side,side,0,0,192,192);
    let data=canvas.toDataURL('image/jpeg',.85);
    if(!validPhotoData(data))data=canvas.toDataURL('image/jpeg',.6);
    if(!validPhotoData(data))throw Error('This image is too detailed to save. Choose a smaller image.');
    return data;
  }finally{image.close();}
}
