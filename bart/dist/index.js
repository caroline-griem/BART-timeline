import HtmlButtonResponsePlugin from '@jspsych/plugin-html-button-response';

// src/index.ts
function getBalloonStyle(pump_count) {
  const maxBalloonHeightVh = 50;
  const baseHeightPx = 100;
  const growthPerPumpPx = 10;
  const maxBalloonHeightPx = window.innerHeight * (maxBalloonHeightVh / 100);
  const estimatedHeightPx = baseHeightPx + pump_count * growthPerPumpPx;
  const finalHeightPx = Math.min(estimatedHeightPx, maxBalloonHeightPx);
  const scale = 1 + pump_count * 0.02;
  const cappedScale = Math.min(scale, 1.5);
  return `
       height: ${finalHeightPx}px;
       transform: scale(${cappedScale});
       transform-origin: bottom center;
       width: auto;
     `;
}
function showStartInstructions() {
  let USDollar = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  });
  let currency_unit_per_pump = 0.01;
  const stimulus = `
        <h1>Balloon Analog Risk Task (BART)</h1>
         <p>In this task, you will inflate a balloon to earn money.</p>
         <p>Click <strong>Pump</strong> to inflate the balloon and earn <strong>${USDollar.format(0.01 * currency_unit_per_pump)}</strong> per pump.</p>
         <p>Click <strong>Collect</strong> to save your money and end the round.</p>
         <p>If the balloon pops, you lose the money for that round!</p>
          <p>Click below to start the task.</p>
       `;
  const instructions = {
    type: HtmlButtonResponsePlugin,
    stimulus: () => {
      return stimulus;
    },
    choices: ["Start"]
  };
  return instructions;
}
function showEndResults(jsPsych) {
  let USDollar = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  });
  const data = jsPsych.data.get().filter({ task: "bart" });
  const totalPoints = data.filter({ exploded: false, cashed_out: true }).select("pump_count").sum();
  const stimulus = `<p>You earned a total of <strong>${USDollar.format(totalPoints * 0.01)}</strong>!</p>
      <p>Thanks for participating!</p>`;
  const instructions = {
    type: HtmlButtonResponsePlugin,
    stimulus: () => {
      return stimulus;
    },
    choices: ["Finish"]
  };
  return instructions;
}
function createTrialTimeline(jsPsych, max_pumps, min_pumps, currency_unit_per_pump) {
  let pump_count;
  let balloon_popped;
  let cashed_out;
  let explosion_point;
  let USDollar = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  });
  const pump_loop = {
    timeline: [{
      type: HtmlButtonResponsePlugin,
      stimulus: () => {
        const style = getBalloonStyle(pump_count);
        return `
             <div class="bart-container">
               <div class="balloon-area">
                 <img src="images/transparent_balloon.png" style="${style}" />
               </div>
             </div>
           `;
      },
      on_load: () => {
        const oldEarnings = document.querySelector(".earnings-text");
        if (oldEarnings)
          oldEarnings.remove();
        const earningsText = document.createElement("div");
        earningsText.className = "earnings-text";
        earningsText.innerHTML = `Possible earnings this round: <strong>${USDollar.format(pump_count * currency_unit_per_pump * 0.01)}</strong>`;
        const content = document.querySelector(".jspsych-content");
        if (content) {
          content.appendChild(earningsText);
        }
      },
      choices: ["Pump", "Collect"],
      button_html: (choice, index) => {
        if (choice === "Pump") {
          return `<button class="jspsych-btn jspsych-bart-pump-button">${choice}</button>`;
        } else {
          return `<button class="jspsych-btn jspsych-bart-collect-button">${choice}</button>`;
        }
      },
      on_finish: (data) => {
        if (data.response === 0) {
          pump_count++;
          if (pump_count >= explosion_point) {
            balloon_popped = true;
          }
        } else if (data.response === 1) {
          cashed_out = true;
        }
      }
    }],
    loop_function: () => !balloon_popped && !cashed_out
  };
  const outcome = {
    type: HtmlButtonResponsePlugin,
    stimulus: () => {
      const style = getBalloonStyle(pump_count);
      if (balloon_popped) {
        return `
<div style="text-align: center; max-width: 600px; margin: 0 auto;">
                <div class="bart-container">
               <div class="balloon-area">
                 <img src="images/transparent_popped_balloon.png" style="${style}" />
               </div>
             </div>
               <div style="text-align: center; max-width: 600px;">
                 <p><strong>POP!</strong> The balloon exploded. You earned <strong>${USDollar.format(0)}</strong> this round.</p>
                 <p>Total earnings across all rounds: <strong>${USDollar.format(0.01 * jsPsych.data.get().filter({ task: "bart", exploded: false, cashed_out: true }).select("pump_count").sum())}</strong></p>
               </div>
             </div>
           `;
      } else {
        const total_points = pump_count + jsPsych.data.get().filter({ task: "bart", exploded: false, cashed_out: true }).select("pump_count").sum();
        const total_money = total_points * currency_unit_per_pump * 0.01;
        return `
             <p>You collected <strong>${USDollar.format(0.01 * pump_count)}</strong> this round.</p>
             <p>Total earnings across all rounds: <strong>${USDollar.format(total_money)}</strong></p>
           `;
      }
    },
    choices: ["Continue"],
    on_finish: (data) => {
      data.task = "bart";
      data.pump_count = pump_count;
      data.exploded = balloon_popped;
      data.cashed_out = cashed_out;
    }
  };
  const singleTrial = {
    timeline: [pump_loop, outcome],
    on_timeline_start: () => {
      pump_count = 0;
      balloon_popped = false;
      cashed_out = false;
      explosion_point = Math.floor(Math.random() * (max_pumps - min_pumps)) + min_pumps;
    }
  };
  return singleTrial;
}
function createTimeline(jsPsych, {
  max_pumps = 20,
  min_pumps = 1,
  currency_unit_per_pump = 1,
  //eg 1 cent per pump
  num_trials = 5
  // number of trials in the experiment
} = {}) {
  const trial = createTrialTimeline(jsPsych, max_pumps, min_pumps, currency_unit_per_pump);
  const bart_timeline = {
    timeline: [trial],
    repetitions: num_trials
  };
  return bart_timeline;
}
var timelineUnits = {};
var utils = {
  showStartInstructions,
  showEndResults
};

export { createTimeline, timelineUnits, utils };
//# sourceMappingURL=out.js.map
//# sourceMappingURL=index.js.map