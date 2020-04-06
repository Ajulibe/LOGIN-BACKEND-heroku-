const largeNumber = require("./script2");

const a = largeNumber.largeNumber;
const b = 6;

setTimeout(() => {
  console.log(a + b);
}, 3000);
