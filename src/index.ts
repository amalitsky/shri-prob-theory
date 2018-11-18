const _ = require('lodash');
const { computeBidsOutcome } = require('./computeBids');
const {
    ourList,
    jquery,
    yat,
    brbr,
    bundle,
    loremipsum,
    art,
    kiss,
    five03,
    undef,
    inDoubt,
    index,
    crutch,
    mb,
    ajax,
    test
} = require('../data/choises');

const matrix: string[][] = [
    ourList,
    art,
    test,
    jquery,
    yat,
    kiss,
    brbr,
    bundle,
    loremipsum,
    five03,
    undef,
    inDoubt,
    index,
    crutch,
    mb,
    ajax
];

// TODO uniqueness check

const length = matrix[0].length;

interface IExhaustedChoices {
    [Identifier: string]: boolean;
}

type solutionValue = number | string;

const choicesOutOfTheRaceHash: IExhaustedChoices = {};

interface ISolutionRecord {
    value: solutionValue;
    probability: number;
    stepProb: number;
}

const solution: ISolutionRecord[][] = [];

interface ISolutionBet {
    groupId: number;
    probability: number;
}

interface IStepSolutionsHash {
    [Identifier: string]: ISolutionBet[];
}

let i = 0;

while (i < length) {
    const solutions: ISolutionRecord[] = [];
    const stepSolutionsHash: IStepSolutionsHash = {};

    matrix.forEach((row: solutionValue[], groupId: number) => {
        const choice = row[i];

        if (!choice) {
            return;
        }

        let previousStep;

        if (i) {
            previousStep = solution[i - 1][groupId];
        }

        const record = {
            probability: NaN,
            stepProb: previousStep ? (previousStep.stepProb - previousStep.probability) : 1,
            value: choice
        };

        solutions[groupId] = record;

        // this group is out of the race, don't care about it's bid
        if (!record.stepProb) {
            record.probability = 0;
            return;
        }

        // this choice is out of the race, group is skipping the step
        if (choice in choicesOutOfTheRaceHash) {
            record.probability = 0;
            return;
        }

        // adding the bid into the hash
        if (!(choice in stepSolutionsHash)) {
            stepSolutionsHash[choice] = [];
        }

        stepSolutionsHash[choice].push({
            groupId,
            probability: record.stepProb
        });
    });

    // going through all the bids for the step
    _.forEach(stepSolutionsHash, (bets: ISolutionBet[], choice: solutionValue): void => {
        const bidsHash = bets.reduce((acc: IBidsHash, {groupId, probability}: ISolutionBet) => {
            acc[groupId] = probability;
            return acc;
        }, {});

        //console.log(`choice: ${choice}`);

        const winProbabilityHash = computeBidsOutcome(bidsHash);

        _.forEach(winProbabilityHash,
            (probability: ISolutionBet['probability'], groupId: ISolutionBet['groupId']) => {
                solutions[groupId].probability = probability;
                // solutions[groupId].value = choice;
        });
    });

    // all valid bids are gone from the list of available choices
    Object.keys(stepSolutionsHash)
        .forEach((choice: solutionValue) => choicesOutOfTheRaceHash[choice] = true);

    solution.push(solutions);

    i++;
}

solution.forEach((stepSolution: ISolutionRecord[]) => {
    const [ourEstimate] = stepSolution;
    const {value, probability, stepProb} = ourEstimate;

    const winProbability = (probability / stepProb) * 100;
    const stepProbability = stepProb * 100;

    console.log(
        `${value}: ` +
        `chance of getting here: ${(stepProbability).toFixed(2)}%, ` +
        `chance of taking: ${winProbability.toFixed(2)}%, `
    );

    // console.log(stepSolution[1]);
});

export {};
