'use strict';

const Homey = require('homey');
const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

class HueMotionSensorZigBee extends ZigBeeDevice {
    async onMeshInit() {
        this.registerAttrReportListener("msTemperatureMeasurement", "measuredValue", 60, 300, null, this.onTemperatureReport.bind(this), 1)
        this.registerAttrReportListener("msOccupancySensing", "occupancy", 1, 60, null, this.onOccupancyReport.bind(this), 1)
        this.registerAttrReportListener("genPowerCfg", "batteryPercentageRemaining", 10, 300, 1, this.onBatteryReport.bind(this), 1);
        this.registerAttrReportListener("msIlluminanceMeasurement", "measuredValue", 10, 60, 1, this.onIlluminanceReport.bind(this), 1);
    }

    onTemperatureReport(value) {
        this.setCapabilityValue('measure_temperature', Math.round((value / 100) * 10) / 10);
    }

    onOccupancyReport(value) {
        //console.log("onOccupancyReport="+value);
        this.setCapabilityValue('alarm_motion', value==1);
    }

    onBatteryReport(value) {
        if (value <= 200 && value !== 255) {
            this.setCapabilityValue('measure_battery', Math.round(value / 2));
        } else {
            this.setCapabilityValue('measure_battery', null);
        }
    }

    onIlluminanceReport(value) {
        this.setCapabilityValue("measure_luminance", Math.round(Math.pow(10, (value - 1) / 10000)));
    }
}

module.exports = HueMotionSensorZigBee;
