const ethers = require('ethers');
const fs = require('fs');
const readline = require('readline'); // for reading user input
require("dotenv").config();

const url = process.env.WEBSOCKET_URL;
const friendsAddress = '0xCF205808Ed36593aa40a44F10c7f7C2F67d4A4d4';
// const provider = new ethers.JsonRpcProvider(`https://mainnet.base.org`);
const provider = new ethers.WebSocketProvider(url);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
const account = wallet.connect(provider);

const friends = new ethers.Contract(
  friendsAddress,
  [
    'function getBuyPriceAfterFee(address sharesSubject, uint256 amount) public view returns (uint256)',
  ],
  account
);

const qty = 1;

function weiToEther(weiValue) {
    const weiBigInt = BigInt(weiValue);
    const divisor = BigInt("1000000000000000000"); // 10^18

    // Perform the division to get the whole ethers
    const wholeEthers = weiBigInt / divisor;

    // Get the remainder and scale it to get 3 decimal places
    const remainder = weiBigInt % divisor;
    const scaledRemainder = remainder * BigInt(1000) / divisor;

    // Combine whole ethers with the scaled remainder
    const combinedValue = Number(wholeEthers) + Number(scaledRemainder) / 1000;

    // Return the value formatted with 3 decimal places
    return combinedValue.toFixed(3);
}

const getPriceChanges = async (address) => {
  
    while (true) {

        try {
            const buyPriceInWei = await friends.getBuyPriceAfterFee(address, qty);
            const buyPriceInEther = weiToEther(buyPriceInWei);
            console.log('### Price Now -  ###', address, buyPriceInEther);
        } catch (error) {
            console.error('Error encountered:', error);
        }
        

        // Wait for waitTime seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 500));

    }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter the address: ', (input) => {
    const address = input.trim();
    getPriceChanges(address);
    rl.close();
  });

process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason);
});
