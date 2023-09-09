const ethers = require('ethers');
const fs = require('fs');
const readline = require('readline'); // for reading user input
require("dotenv").config();

const url = process.env.WEBSOCKET_URL;
const friendsAddress = '0xCF205808Ed36593aa40a44F10c7f7C2F67d4A4d4';
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


let currentGasPrice = ethers.parseUnits('4', 'gwei'); // default gas price
let multiplier = 2; // default multiplier for buy price
let maxBuyPriceLimit = 9000000000000000; // 0.009 ethers by default
let waitTime = 500; // 0.5s by default
let qty = 1;

const buySharesForAddress = async (address, slippage = 100) => {

    if (slippage >= 200) {
      multiplier = (slippage / 100) + 1;
      currentGasPrice = ethers.parseUnits('10', 'gwei');
      maxBuyPriceLimit = 10000000000000000; // 0.01 ethers for high slippage
    }
  
    while (true) {

      const weiBalance = await provider.getBalance(address);
      
      if (weiBalance >= 1000000000000000) { // 0.001 ETH
  
        const buyPriceBigInt = await friends.getBuyPriceAfterFee(address, qty);
        const buyPrice = BigInt(multiplier) * buyPriceBigInt;

        if (buyPrice > maxBuyPriceLimit) {
          console.log(`### STOP ### Buy price exceeded the limit for address ${address}: ${buyPrice}`);
          break;
        }
  
        console.log('### ATTEMPTING TO BUY ###', address, buyPrice, 'including a slippage of', slippage,'%');
        try {
          const tx = await friends.buyShares(address, qty, {value: buyPrice, gasPrice: currentGasPrice});
          fs.appendFileSync('./buys.txt', address + "\n");
          const receipt = await tx.wait();
          console.log('Transaction Mined:', receipt.blockNumber);
          break; // Exit the loop if the transaction was successful
        } catch (error) {
            console.log('Transaction Failed:', error);
        }
      } else {
        console.log(`Insufficient funds for address: ${address} with balance ${weiBalance}.`);
        break;
      }
  
      // Wait for waitTime seconds before checking again
      // await new Promise(resolve => setTimeout(resolve, waitTime));
      
    }
    process.exit(0);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter the address to buy shares for, followed by slippage (default 100): ', (input) => {
    const [address, slippage] = input.split(',').map(item => item.trim());
    buySharesForAddress(address, slippage || 100);
    rl.close();
});

process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason);
});
