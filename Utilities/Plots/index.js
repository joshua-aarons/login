import { InteractivePlot } from "./interactive-plot.js";

const plot = new InteractivePlot("#contanier");
plot.size = [550, 400];
plot.xTime = true;
plot.xLabel = "Time";


let y = [[1772453462184,2],[1772454272451,11],[1773395208266,6],[1773805033488,129],[1777530926694,1],[1777617714382,1],[1778745168222,184],[1779086653916,210],[1779327851916,689],[1779689185712,0],[1779763703732,129.76003333333333],[1779781803270,291.7981833333333],[1779843689796,218.29248333333334],[1779946426511,181.67605],[1780365667534,119.72985],[1780442049299,291.8000666666667],[1780459681757,8.356633333333333],[1780466008703,183.41766666666666],[1780557197971,6.259516666666666],[1780557923331,1.7101],[1780560207671,4.628566666666667],[1780978166234,4.776133333333333]];
// let now = Date.now();
// const timeOfDay = 1000 * 60 * 60 * 24; // ms in a day
// let y1 = new Array(20).fill(0).map((_, i) => new Vector(
//     timeOfDay * 31 * i / 19 ,
//     0.1*Math.random() + i / 22 
// ));
// let y2 = new Array(20).fill(0).map((_, i) => new Vector(
//     timeOfDay * 31 * i / 19 ,
//     1 - (0.1*Math.random() + i / 22) 
// ));

// Series on primary (left) Y axis
plot.addSeries(
    y,
    { stroke: "#009cff", strokeWidth: 2 },
    0,
    "Participant Interactions"
);

// // Series on secondary (right) Y axis — different scale
// plot.addSeries(
//     y2,
//     { stroke: "#ff7d00", strokeWidth: 2 },
//     0,
//     "Host Interactions"
// );

/**
 * @param {number} minutes - The duration in minutes to format.
 */
export function formatMinutes(minutes) {
  let res = ""
  if (typeof minutes === "boolean") {
    res = minutes ? "On" : "Off";
  } else if (minutes < 1) {
    res =  `${Math.round(minutes * 60)}s`;
  } else if (minutes < 60) {
    const minute1dp = minutes.toFixed(1);
    if (minute1dp.endsWith(".0")) {
      res = `${Math.round(minutes)}m`;
    } else {
      res = `${minute1dp}m`;
    }
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    if (remainingMinutes === 0) {
      res = `${hours}h`;
    } else {
      res = `${hours}h ${remainingMinutes}m`;
    }
  }
  return res;
}

plot.setYLabel("Interaction Percentage", 0);
plot.setYFormat(formatMinutes)

plot.setYAxisSide("left", 0);
plot.setYLabel("Secondary Y (right)", 1);
plot.setYAxisSide("right", 1);

document.getElementById("contanier").appendChild(plot);