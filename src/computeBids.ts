const _ = require('lodash');

interface ITreeNode {
    children: ITreeNode[];
    groupId?: string;
    localProb: number;
    parent: ITreeNode | null;
    totalProb: number;
    value?: boolean;
}

function computeBidsOutcome(bidsHash: IBidsHash): IBidsHash {
    const result: IBidsHash = {};

    const rootNode: ITreeNode = {
        children: [],
        localProb: 1,
        parent: null,
        totalProb: 1
    };

    const branches: ITreeNode[] = [rootNode];

    _.forEach(bidsHash, (probability: number, groupId: string): void => {
        result[groupId] = NaN;

        // this will never happen, no reason to count
        if (!probability) {
            result[groupId] = 0;
            return;
        }

        const newBranches: ITreeNode[] = [];

        branches.forEach((node: ITreeNode) => {
            // no reason to follow this branch
            if (!node.totalProb) {
                return;
            }

            const leftChild: ITreeNode = {
                children: [],
                groupId,
                localProb: probability,
                parent: node,
                totalProb: node.totalProb * probability,
                value: true
            };

            newBranches.push(leftChild);
            node.children.push(leftChild);

            if (probability < 1) {
                const rightChild: ITreeNode = {
                    children: [],
                    groupId,
                    localProb: 1 - probability,
                    parent: node,
                    totalProb: node.totalProb * (1 - probability),
                    value: false
                };

                newBranches.push(rightChild);
                node.children.push(rightChild);
            }
        });

        // if skipped branching let's preserve the old value
        if (newBranches.length) {
            branches.length = 0;
            branches.push(...newBranches);
        }
    });

    printTree(rootNode);

    return computeProbabilityByDecisionTree(rootNode);
}

interface IDecision {
    groupId: string;
    value: boolean;
}

function computeProbabilityByDecisionTree(
    node: ITreeNode,
    decisions: IDecision[] = [],
    results: IBidsHash = {}
): IBidsHash {
    const {
        groupId,
        value,
        children,
        totalProb
    } = node;

    // non root nodes
    if (groupId && value !== undefined) {
        if (!(groupId in results)) {
            results[groupId] = 0;
        }

        decisions.push({
            groupId,
            value
        });
    }

    if (children.length) {
        children.forEach((node: ITreeNode) => computeProbabilityByDecisionTree(node, decisions, results));
    } else {
        const {length: depth} = decisions;
        const {length: bidsQ} = decisions.filter(({value}: IDecision) => value);

        const prob = bidsQ ? 1 / bidsQ : 0;

        console.log(prob, totalProb);

        decisions.forEach(({groupId, value}: IDecision) => {
            if (value) {
                results[groupId] += prob * totalProb;
            }
        });
    }

    if (groupId) {
        decisions.pop();
    }

    return results;
}

function printTree(node: ITreeNode, path: string = ''): void {
    const {
        groupId,
        value,
        totalProb,
        localProb,
        children
    } = node;

    path += `[${[groupId || 'root', value === undefined ? 'root' : +value, localProb, totalProb].join(', ')}] > `;

    children.forEach((node: ITreeNode) => printTree(node, path));

    if (!children.length) {
        console.log(path);
    }

    // res += children.reduce((acc: string, node: ITreeNode) => acc + printTree(node), '');
}


/*const testTree: ITreeNode = {
    children: [],
    localProb: 1,
    parent: null,
    totalProb: 1
};

const leftChild: ITreeNode = {
    children: [],
    localProb: 1,
    parent: testTree,
    totalProb: 1,
    value: true
};

const rightChild: ITreeNode = {
    children: [],
    localProb: .5,
    parent: testTree,
    totalProb: .5,
    value: false
};

testTree.children.push(leftChild, rightChild);

const test: IBidsHash = {
    one: 1,
    two: 0.5,
    three: 1,
    four: 0.5
};

const testCalc = computeBidsOutcome(test);

printTree(testCalc);

const result = computeProbabilityByDecisionTree(testCalc);

console.log(result);*/

module.exports.computeBidsOutcome = computeBidsOutcome;
