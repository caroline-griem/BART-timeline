import { JsPsych } from 'jspsych';
import HtmlButtonResponsePlugin from '@jspsych/plugin-html-button-response';

declare function showStartInstructions(): {
    type: typeof HtmlButtonResponsePlugin;
    stimulus: () => string;
    choices: string[];
};
declare function showEndResults(jsPsych: JsPsych): {
    type: typeof HtmlButtonResponsePlugin;
    stimulus: () => string;
    choices: string[];
};
declare function createTimeline(jsPsych: JsPsych, { max_pumps, min_pumps, currency_unit_per_pump, //eg 1 cent per pump
num_trials, }?: {
    max_pumps?: number;
    min_pumps?: number;
    currency_unit_per_pump?: number;
    num_trials?: number;
}): {
    timeline: {
        timeline: ({
            timeline: {
                type: typeof HtmlButtonResponsePlugin;
                stimulus: () => string;
                on_load: () => void;
                choices: string[];
                button_html: (choice: any, index: any) => string;
                on_finish: (data: any) => void;
            }[];
            loop_function: () => boolean;
        } | {
            type: typeof HtmlButtonResponsePlugin;
            stimulus: () => string;
            choices: string[];
            on_finish: (data: any) => void;
        })[];
        on_timeline_start: () => void;
    }[];
    repetitions: number;
};
declare const timelineUnits: {};
declare const utils: {
    showStartInstructions: typeof showStartInstructions;
    showEndResults: typeof showEndResults;
};

export { createTimeline, timelineUnits, utils };
