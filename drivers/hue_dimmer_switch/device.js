'use strict';

const Homey = require('homey');
const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

class HueDimmerSwitchZigBee extends ZigBeeDevice {

  onMeshInit() {
    // Battery
    let genPowerCfgEndpoint = this.getClusterEndpoint("genPowerCfg");
    this.registerCapability("measure_battery", "genPowerCfg", {
      getOpts: {
          getOnStart:true
      },
      endpoint:genPowerCfgEndpoint
    });
    this.registerAttrReportListener(
      "genPowerCfg", "batteryPercentageRemaining",
      60, 300, 1,
      this.onBatteryReport.bind(this),
      genPowerCfgEndpoint
    );

    this.registerReportListener('genOnOff', 'on', this.onCommandParser.bind(this));
    this.registerReportListener('genOnOff', 'onWithEffect', this.onCommandParser.bind(this));
    this.registerReportListener('genOnOff', 'off', this.offCommandParser.bind(this));
    this.registerReportListener('genOnOff', 'offWithEffect', this.offCommandParser.bind(this));
    this.registerReportListener('genLevelCtrl', 'step', this.stepCommandParser.bind(this));
    this.registerReportListener('genLevelCtrl', 'stop', this.stopCommandParser.bind(this));

    this.switchOnTriggerDevice = new Homey.FlowCardTriggerDevice('hue_dimmer_switch_on').register();
    this.switchOffTriggerDevice = new Homey.FlowCardTriggerDevice('hue_dimmer_switch_off').register();
    this.switchDimTriggerDevice = new Homey.FlowCardTriggerDevice('hue_dimmer_switch_dim').register()
      .registerRunListener((args, state, callback) => {
        return callback(null, args.action === state.action);
      });
  }

  onBatteryReport(value) {
    if (value <= 200 && value !== 255) {
        this.setCapabilityValue('measure_battery', Math.round(value / 2));
    } else {
        this.setCapabilityValue('measure_battery', null);
    }
  }


  /**
  	 * Method that handles an incoming on/onWithEffect report
  	 * @returns {*}
  	 */
  onCommandParser() {
    return this.switchOnTriggerDevice.trigger(this, {}, {})
      .then(() => this.log('triggered hue_dimmer_switch_on'))
      .catch(err => this.error('Error triggering hue_dimmer_switch_on', err));
  }

  /**
  	 * Method that handles an incoming off/offWithEffect report
  	 * @returns {*}
  	 */
  offCommandParser() {
    return this.switchOffTriggerDevice.trigger(this, {}, {})
      .then(() => this.log('triggered hue_dimmer_switch_off'))
      .catch(err => this.error('Error triggering hue_dimmer_switch_off', err));
  }

  /**
  	 * Method that handles an incoming step report
  	 * @returns {*}
  	 */
  stepCommandParser(payload) {
    var direction = payload.stepmode === 0 ? 'up' : 'down'; // 0=up,1=down
    var mode = payload.stepsize === 30 ? 'press' : 'hold'; // 30=press,56=hold

    return this.switchDimTriggerDevice.trigger(this, {}, { action: `${direction}-${mode}` })
      .then(() => this.log(`triggered hue_dimmer_switch_dim, action=${direction}-${mode}`))
      .catch(err => this.error('Error triggering hue_dimmer_switch_dim', err));
  }

  /**
  	 * Method that handles an incoming stop report
  	 * @returns {*}
  	 */
  stopCommandParser() {
    return this.switchDimTriggerDevice.trigger(this, {}, { action: 'release' })
    .then(() => this.log('triggered hue_dimmer_switch_dim, action=release'))
    .catch(err => this.error('Error triggering hue_dimmer_switch_dim', err));
  }
}

module.exports = HueDimmerSwitchZigBee;
