const ethers = require('ethers');
const readline = require('readline');
require("dotenv").config();

const url = process.env.WEBSOCKET_URL;
const friendsAddress = '0xCF205808Ed36593aa40a44F10c7f7C2F67d4A4d4';
const provider = new ethers.WebSocketProvider(url);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
const account = wallet.connect(provider);

const friends = new ethers.Contract(
  friendsAddress,
  [
    'function sellShares(address sharesSubject, uint256 amount) public payable',
    'function sharesBalance(address sharesSubject, address holder) public view returns (uint256)',
  ],
  account
);

const gasPrice = ethers.parseUnits('0.000000000000049431', 'ether');

const sellAllSharesForAddress = async (address) => {
  const bal = await friends.sharesBalance(address, wallet.address);
  
  if (bal > 0) {
    console.log(`Selling ${bal} shares for address: ${address}`);
    try {
      const tx = await friends.sellShares(address, bal, {gasPrice});
      const receipt = await tx.wait();
      console.log('Transaction Mined:', receipt.blockNumber);
    } catch (error) {
      console.log('Transaction Failed:', error);
    }
  } else {
    console.log(`You don't hold any shares for address: ${address}`);
    process.exit(0);
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter the address to sell shares for: ', (input) => {
  sellAllSharesForAddress(input.trim());
  rl.close();
});

process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason);
});
