const Web3 = require('web3');
const abi = require('./abi.json');

const address = '0x06012c8cf97BEaD5deAe237070F9587f8E7A266d';
const network = 'https://mainnet.infura.io/v3/17f57437c8674212a0e994c4462344ec';

const web3 = new Web3(new Web3.providers.HttpProvider(network));
const contract = new web3.eth.Contract(abi, address);

// Get arguments from command line
const startingBlock = parseInt(process.argv[2]);
const endingBlock = parseInt(process.argv[3]);

// Map of matrons to their respective birth count
var births = {};

// Total number of births across all matrons
var totalBirths = 0;

// Current highest birth count for a single matron
var highestBirthCount = 0;

// Current matron with highest birth count
var biggestMatron;

function findBirths(currentBlock) {

    // Make sure we will not read past our endingBlock
    if (currentBlock + 4999 > endingBlock) {
        var lastBlock = endingBlock;
    } else {
        var lastBlock = currentBlock + 4999;
    }

    console.log("Checking blocks " + currentBlock + " - " + lastBlock + "...")

    // Fetch Birth events from chain
    return contract.getPastEvents('Birth', {
         fromBlock: currentBlock,
         toBlock: lastBlock
    })
    .then(function(events) {

        // Loop through each birth event
        for (var x in events) {

            totalBirths += 1;
            var matron = events[x].returnValues[2];

            // Make sure birth is not the result of a gen0 cat being created
            if (matron != 0) {
                if (births[matron]) {

                    // Increment matron's birth count if we have seen it before
                    births[matron] += 1;

                } else {

                    // Initialize matron's birth count if we have not seen it before
                    births[matron] = 1;
                }

                // Check if a matron is now the biggest momma
                if (births[matron] > highestBirthCount) {
                    highestBirthCount = births[matron];
                    biggestMatron = matron;
                }
            }

        }
    });
}

async function main() {

    // Check 5000 blocks for Births per iteration
    for (let currentBlock = startingBlock; currentBlock < endingBlock; currentBlock += 5000) {
        const result = await findBirths(currentBlock);
    }

    console.log("Total births between blocks " + startingBlock + " and " + endingBlock + ": " + totalBirths);

    // Perform contract call to get the birth timestamp, generation, and genes of biggestMatron
    contract.methods.getKitty(biggestMatron).call(function (error, result) {
        console.log("ID of matron with most births: " + biggestMatron)
        console.log("Birth timestamp: " + result.birthTime);
        console.log("Generation: " + result.generation);
        console.log("Genes: " + result.genes);
    })


}

main();
