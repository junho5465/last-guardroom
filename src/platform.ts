export interface AdReceipt {completed:boolean;receipt:string}
export interface Platform {name:string;rewardedAd(placement:string,showMock:()=>Promise<boolean>):Promise<AdReceipt>}
export class WebPlatform implements Platform {name='web';async rewardedAd(_placement:string,showMock:()=>Promise<boolean>){return {completed:await showMock(),receipt:crypto.randomUUID()};}}
// SDK 연결은 공식 완료 콜백을 검증하는 별도 구현으로 교체합니다. v1은 모두 모의 광고입니다.
export class TossPlatform extends WebPlatform {name='toss-mock';}
export class OneStorePlatform extends WebPlatform {name='onestore-mock';}
export const platform:Platform=new WebPlatform();
