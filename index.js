const rpio = require("rpio");
const PIN1 = 37;
let Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("switch-plugin", "MyAwesomeSwitch", MySwitch);
};

const BUZZER_DELAY = 3000;

const BUZZER = "BUZZER";
const OFF = "OFF";

class MySwitch {
  constructor() {
    rpio.open(PIN1, rpio.OUTPUT);
    setTimeout(() => this.clear(), 0);
  }

  getServices() {
    let informationService = new Service.AccessoryInformation();
    informationService
      .setCharacteristic(Characteristic.Manufacturer, "My switch manufacturer")
      .setCharacteristic(Characteristic.Model, "My switch model")
      .setCharacteristic(Characteristic.SerialNumber, "123-456-789");

    const switchService = new Service.Door("Door");
    switchService
      .getCharacteristic(Characteristic.CurrentPosition)
      .on("get", next => next(null, this.getProgress()));
    switchService
      .getCharacteristic(Characteristic.TargetPosition)
      .on("get", next => next(null, this.getTarget()))
      .on("set", (on, next) => {
        this.openDoor();
        next();
      });

    this.informationService = informationService;
    this.switchService = switchService;
    return [informationService, switchService];
  }

  getProgress() {
    switch (this.state) {
      case BUZZER:
        return 100;
      case OFF:
        return 0;
    }
  }

  getTarget() {
    switch (this.state) {
      case BUZZER:
        return 0;
      case OFF:
        return 0;
    }
  }

  openDoor() {
    if (this.state !== OFF) {
      this.clear();
      return;
    }
    this.startOpening();
  }

  updateHomekit() {
    this.switchService
      .getCharacteristic(Characteristic.CurrentPosition)
      .updateValue(this.getProgress());
    this.switchService
      .getCharacteristic(Characteristic.TargetPosition)
      .updateValue(this.getTarget());
  }

  clear() {
    this.state = OFF;
    rpio.write(PIN1, rpio.HIGH);
    clearTimeout(this.buzzerTimeout);
    this.updateHomekit();
  }

  startOpening() {
    this.state = BUZZER;
    rpio.write(PIN1, rpio.LOW);

    this.updateHomekit();

    this.buzzerTimeout = setTimeout(() => {
      this.clear();
      this.updateHomekit();
    }, BUZZER_DELAY);
  }
}
