const Bonjour = require("bonjour");

const fetch = require("node-fetch");

const { program } = require('commander');
program.version('0.0.1');

const TEMP_MIN=143 // == 7000K
const TEMP_MAX=344 // == 2900K

const getLight = async () => {
  const bonjour = new Bonjour();
  return (new Promise((resolve, reject) => {
    const t = setTimeout(() => reject("timeout"), 5000);
    bonjour.findOne({type: "elg"}, function (service) {
      clearTimeout(t);
      resolve(service);
    });
  })).finally(() => bonjour.destroy());
}

const takeAction = async (command) => {
  const options = {}
  if (command) {
    options.method = "put";
    options.body = JSON.stringify(command)
  }

  const light = await getLight();
  console.log("light:", light);

  const res = await fetch("http://" + light.addresses[0] + ":9123/elgato/lights", options);
  const body = await res.json();
  console.log("status", body);
  
}

const mapBrightness = (v) => {
  console.log("input", v);
  const result = Math.floor(v/100*(TEMP_MAX-TEMP_MIN) + TEMP_MIN);
  console.log("output", result);
  return result;
}

program
  .command("on")
  .description("turn light on")
  .action(() => takeAction( { lights: [{ on: 1 }] } ));

program
  .command("off")
  .description("turn light off")
  .action(() => takeAction( { lights: [{ on: 0 }] } ));

program
  .command("brightness <value>")
  .description("set brightness (0-100)")
  .action((value) => takeAction( { lights: [{brightness: parseInt(value) }] } ));

program
  .command("temp <value>")
  .description("set temperature (0-100) -- 0=7000K (cool), 100=2900K (warm)")
  .action((value) => takeAction( { lights: [{temperature: mapBrightness(parseInt(value)) }] } ));

program
  .command("status")
  .description("get light status")
  .action(() => takeAction());

const main = async () => {
  program.parseAsync(process.argv);
}

main();
