'use strict';

const Homey = require('homey');
const ZigBeeDevice = require('homey-meshdriver').ZigBeeDevice;

class HueMotionSensorZigBee extends ZigBeeDevice {
    async onMeshInit() {
        // Temperature
        let msTemperatureMeasurementEndpoint = this.getClusterEndpoint("msTemperatureMeasurement");
        this.registerCapability("measure_temperature", "msTemperatureMeasurement", {
            getOpts: {
                getOnStart:true
            },
            endpoint:msTemperatureMeasurementEndpoint
        });
        this.registerAttrReportListener(
            "msTemperatureMeasurement", "measuredValue",
            300, 600, null,
            this.onTemperatureReport.bind(this),
            msTemperatureMeasurementEndpoint
        );
        // Occupancy
        let msOccupancySensingEndpoint = this.getClusterEndpoint("msOccupancySensing")
        this.registerCapability("alarm_motion", "msOccupancySensing", {
            getOpts: {
                getOnStart:true
            },
            endpoint:msOccupancySensingEndpoint
        });
        this.registerAttrReportListener(
            "msOccupancySensing", "occupancy",
            1, 60, null,
            this.onOccupancyReport.bind(this),
            msOccupancySensingEndpoint
        );
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
        // Luminance
        let msIlluminanceMeasurementEndpoint = this.getClusterEndpoint("msIlluminanceMeasurement");
        this.registerCapability("measure_luminance", "msIlluminanceMeasurement", {
            getOpts: {
                getOnStart:true
            },
            endpoint:msIlluminanceMeasurementEndpoint
        });
        this.registerAttrReportListener(
            "msIlluminanceMeasurement", "measuredValue",
            2, 60, 1,
            this.onIlluminanceReport.bind(this),
            msIlluminanceMeasurementEndpoint
        );
    }

    onTemperatureReport(value) {
        this.setCapabilityValue('measure_temperature', Math.round((value / 100) * 10) / 10);
    }

    onOccupancyReport(value) {
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
        if (value === 0) {
            this.setCapabilityValue("measure_luminance", 0);
        } else if (value === 0xffff) {
            this.setCapabilityValue("measure_luminance", null);
        } else {
            this.setCapabilityValue("measure_luminance", Math.round(Math.pow(10, (value - 1) / 10000)));
        }
    }
}

module.exports = HueMotionSensorZigBee;
