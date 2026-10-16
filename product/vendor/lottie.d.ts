export interface IconAnimation {
 totalFrames:number; frameRate:number;
 setSpeed(speed:number):void;
 goToAndPlay(frame:number,isFrame:boolean):void;
 goToAndStop(frame:number,isFrame:boolean):void;
 destroy():void;
 addEventListener(name:string,callback:()=>void):void;
}
declare const lottie:{loadAnimation(options:{container:Element,renderer:'svg',loop:boolean,autoplay:boolean,animationData:unknown,rendererSettings?:{progressiveLoad:boolean}}):IconAnimation};
export default lottie;
