import { HomebridgeMagichomeDynamicPlatformAccessory } from '../platformAccessory';

export class DimmerStrip extends HomebridgeMagichomeDynamicPlatformAccessory {
  
  /**
   ** @updateHomekitState
   * send state to homekit
   */
  async updateHomekitState() {

    this.lightState.brightness = Math.round( 41.55343 * Math.log10(this.lightState.RGB.blue) );

    this.service.updateCharacteristic(this.platform.Characteristic.On, this.lightState.isOn);

    if(  this.lightState.isOn ){
      this.service.updateCharacteristic(this.platform.Characteristic.Brightness, this.lightState.brightness);
    }

  }
    
  async setColor() {

    //**** local variables ****\\
    const rgb = Math.round( 10 ** ( 0.024064 * this.lightState.brightness ) );

    await this.send([0x31, rgb, rgb, rgb, 0x03, 0x01, 0x0F]); //8th byte checksum calculated later in send()
    
  }//setColor


}
