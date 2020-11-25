import { clamp, convertHSLtoRGB, convertRGBtoHSL } from '../magichome-interface/utils';
import { HomebridgeMagichomeDynamicPlatformAccessory } from '../PlatformAccessory';

export class RGBWWBulb extends HomebridgeMagichomeDynamicPlatformAccessory {
  
  async updateDeviceState(_timeout = 200) {

    //**** local variables ****\\
    const hsl = this.lightState.HSL;
    const [red, green, blue] = convertHSLtoRGB(hsl); //convert HSL to RGB
    const whites = this.hueToWhiteTemperature(); //calculate the white colors as a function of hue and saturation. See "calculateWhiteColor()"
    const brightness = this.lightState.brightness;
    
    // this.platform.log.debug('Current HSL and Brightness: h:%o s:%o l:%o br:%o', hsl.hue, hsl.saturation, hsl.luminance, brightness);
    // this.platform.log.debug('Converted RGB: r:%o g:%o b:%o', red, green, blue);
    
    let mask = 0xF0; // the 'mask' byte tells the controller which LEDs to turn on color(0xF0), white (0x0F), or both (0xFF)
    //we default the mask to turn on color. Other values can still be set, they just wont turn on
    
    //sanitize our color/white values with Math.round and clamp between 0 and 255, not sure if either is needed
    //next determine brightness by dividing by 100 and multiplying it back in as brightness (0-100)
    let r = Math.round(((clamp(red, 0, 255) / 100) * brightness));
    let g = Math.round(((clamp(green, 0, 255) / 100) * brightness));
    let b = Math.round(((clamp(blue, 0, 255) / 100) * brightness));
    let ww = Math.round(((clamp(whites.warmWhite, 0, 255) / 100) * brightness));
    let cw = Math.round(((clamp(whites.coldWhite, 0, 255) / 100) * brightness));
    

    if (hsl.hue == 31 && (hsl.saturation == 33)) {
      r = 0;
      g = 0;
      b = 0;
      ww = Math.round((255 / 100) * brightness);
      cw = 0;
      mask = 0x0F;
      //this.platform.log.debug('Setting warmWhite only without colors or coldWhite: ww:%o', ww);
    } else if ((hsl.hue == 208 && (hsl.saturation == 17))) {
      r = 0;
      g = 0;
      b = 0;
      ww = 0;
      cw = Math.round((255 / 100) * brightness);
      mask = 0x0F;
      // this.platform.log.debug('Setting coldWhite only without colors or warmWhite: cw:%o', cw);

      //if saturation is below config set threshold, set rgb to 0 and set the mask to white (0x0F). 
      //White colors were already calculated above
    } else if ((hsl.saturation < this.colorWhiteThreshold)) {
      r = 0;
      g = 0;
      b = 0;
      mask = 0x0F;
      // this.platform.log.debug('Setting warmWhite and coldWhite without colors: ww:%o cw:%o', ww, cw);
    } else { //else set warmWhite and coldWhite to zero. Color mask already set at top

      ww = 0;
      cw = 0;
      //this.platform.log.debug('Setting colors without white: r:%o g:%o b:%o', r, g, b);

    }
    this.send([0x31, r, g, b, ww, cw, mask, 0x0F], true, _timeout); //9th byte checksum calculated later in send()

    
  }//setColor


  async updateHomekitState() {
    let { hue, saturation } = this.lightState.HSL;
    const { luminance } = this.lightState.HSL;
    let { brightness } = this.lightState;
    const { isOn } = this.lightState;
    const { coldWhite, warmWhite } = this.lightState.whiteValues;

    if(luminance > 0 && isOn){
      brightness = luminance * 2;
    } else if (isOn){
      brightness = clamp(((coldWhite/2.55) + (warmWhite/2.55)), 0, 100);
      if(warmWhite>coldWhite){
        saturation = this.colorWhiteThreshold - (this.colorWhiteThreshold * (this.lightState.whiteValues.coldWhite/255));
        hue = 0.0;
      } else {
        saturation = this.colorWhiteThreshold - (this.colorWhiteThreshold * (this.lightState.whiteValues.warmWhite/255));
        hue = 180.0;
      }
    }
    brightness = Math.round(brightness);
    hue = parseFloat( hue.toFixed(3) ) + 0.001;
    saturation = parseFloat( saturation.toFixed(3) )+ 0.001;
    if( isNaN(hue) || isNaN(saturation) || isNaN(brightness)){
      throw new Error('convertion error in homekit reporting...');
    }
    this.platform.log.debug(`Reporting to HomeKit: on=${isOn} hue=${hue} sat=${saturation} bri=${brightness} `);
    // since we just properly calculated it, we might as well update it
    this.lightState.brightness = brightness;

    this.service.updateCharacteristic(this.platform.Characteristic.On, isOn);
    this.service.updateCharacteristic(this.platform.Characteristic.Hue, hue);
    this.service.updateCharacteristic(this.platform.Characteristic.Saturation,  saturation);
    this.service.updateCharacteristic(this.platform.Characteristic.Brightness, brightness);

    return {isOn, hue, saturation, brightness };
  }
    
}
