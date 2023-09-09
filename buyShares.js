const ethers = require('ethers');
const fs = require('fs');
const readline = require('readline'); // for reading user input
require("dotenv").config();

const url = process.env.WEBSOCKET_URL;
const friendsAddress = '0xCF205808Ed36593aa40a44F10c7f7C2F67d4A4d4';
const provider = new ethers.WebSocketProvider(url);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
const account = wallet.connect(provider);
// const maxBuyPriceLimit = 6000000000000000 // 0.006 E
const maxBuyPriceLimit = 10000000000000000  //0.01E
const gasPrice = ethers.parseUnits('2', 'gwei');
const qty = 1;

const friends = new ethers.Contract(
  friendsAddress,
  [
    'function buyShares(address arg0, uint256 arg1)',
    'function getBuyPriceAfterFee(address sharesSubject, uint256 amount) public view returns (uint256)',
  ],
  account
);

const buySharesForAddress = async (address) => {
  const weiBalance = await provider.getBalance(address);

  if (weiBalance >= 10000000000000000) { // 0.01 ETH
    const buyPrice = await friends.getBuyPriceAfterFee(address, qty);

    if (buyPrice > maxBuyPriceLimit) {
      console.log(`### STOP ### Buy price exceeded the limit for address ${address}: ${buyPrice}`);
      process.exit(0);
    }

    console.log('### ATTEMPTING TO BUY ###', address, buyPrice);
    const tx = await friends.buyShares(address, qty, {value: buyPrice, gasPrice});
    fs.appendFileSync('./buys.txt', address + "\n");
    try {
      const receipt = await tx.wait();
      console.log('Transaction Mined:', receipt.blockNumber);
    } catch (error) {
      console.log('Transaction Failed:', error);
    }
  } else {
    console.log('Low wei balance!');
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter the address to buy shares for: ', (input) => {
  const address = input.trim();
  buySharesForAddress(address);
  rl.close();
});

process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason);
});

