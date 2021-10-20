import { clamp, convertHSLtoRGB } from '../magichome-interface/utils';
import { HomebridgeMagichomeDynamicPlatformAccessory } from '../platformAccessory';

export class GRBStripSingleColor extends HomebridgeMagichomeDynamicPlatformAccessory {
  public eightByteProtocol = 2;
  async updateDeviceState() {

    //**** local variables ****\\
    const brightness = this.lightState.brightness;
    
    const mask = 0xF0; // the 'mask' byte tells the controller which LEDs to turn on color(0xF0), white (0x0F), or both (0xFF)
    
    const rgb = Math.round( 10 ** (0.024064 * brightness ) );
  
    this.platform.logs.debug('Current Brightness: br:%o', brightness);
    this.platform.logs.debug('Current r:%o, g:%o, b:%o', rgb, rgb, rgb);
   
    await this.send([0x31, rgb, rgb, rgb, 0x00, mask, 0x0F]);

    
  }//updateDeviceState

  async updateHomekitState() {

    this.service.updateCharacteristic(this.platform.Characteristic.On,  this.lightState.isOn);
    
    this.lightState.brightness = Math.round( 41.55343 * Math.log10(this.lightState.RGB.blue) );
    
    this.service.updateCharacteristic(this.platform.Characteristic.Brightness,  this.lightState.brightness);

  }//updateHomekitState

  async setColor() {

    const rgb = Math.round( 10 ** ( 0.024064 * this.lightState.brightness ) );

    await this.send([0x31, rgb, rgb, rgb, 0x00, 0x0F, 0x0F]); //8th byte checksum calculated later in send()
    
  }//setColor
    
 
}
