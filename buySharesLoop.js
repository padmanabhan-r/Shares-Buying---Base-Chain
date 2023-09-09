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
    'function buyShares(address arg0, uint256 arg1)',
    'function getBuyPriceAfterFee(address sharesSubject, uint256 amount) public view returns (uint256)',
  ],
  account
);

let currentGasPrice = ethers.parseUnits('8', 'gwei'); // default gas price
let multiplier = 1; // default multiplier for buy price
let maxBuyPriceLimit = 6000000000000000; // 0.006 ethers by default
let waitTime = 500; // 0.5s by default
let qty = 1;

const buySharesForAddress = async (address, mode = 'N') => {
    if (mode === 'H') {
      currentGasPrice = ethers.parseUnits('10', 'gwei');
      multiplier = 2;
      waitTime = 100;
      maxBuyPriceLimit = 10000000000000000; // 0.01 ethers for high value
    }
  
    while (true) {
    //   const weiBalance = await provider.getBalance(address);
      
    //   if (weiBalance >= 1000000000000000) { // 0.001 ETH
  
        // const buyPriceBigInt = await friends.getBuyPriceAfterFee(address, qty);
        // const buyPrice = BigInt(multiplier) * buyPriceBigInt;

        // const buyPrice = await friends.getBuyPriceAfterFee(address, qty);
        let buyPrice = 4500000000000000;

        // if (buyPrice > maxBuyPriceLimit) {
        //   console.log(`### STOP ### Buy price exceeded the limit for address ${address}: ${buyPrice}. Retrying...`);
        //   continue;
        // }
  
        console.log('### ATTEMPTING TO BUY ###', address, buyPrice);
        try {
          const tx = await friends.buyShares(address, qty, {value: buyPrice, gasPrice: currentGasPrice});
          fs.appendFileSync('./buys.txt', address + "\n");
          const receipt = await tx.wait();
          console.log('Transaction Mined:', receipt.blockNumber);
          break; // Exit the loop if the transaction was successful
        } catch (error) {
            console.log('Transaction Failed:', error);
        }
    //   } else {
    //     console.log(`Insufficient funds for address: ${address} with balance ${weiBalance}. Waiting for sufficient funds...`);
    //   }
  
      // Wait for waitTime seconds before checking again
      // await new Promise(resolve => setTimeout(resolve, waitTime));

    }
    process.exit(0);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter the address to buy shares for, followed by mode (N or H): ', (input) => {
    const [address, mode] = input.split(',').map(item => item.trim());
    buySharesForAddress(address, mode || 'N');
    rl.close();
});

process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason);
});
