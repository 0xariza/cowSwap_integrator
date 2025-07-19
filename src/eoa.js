require("dotenv").config();
const {
    OrderBookApi,
    OrderQuoteRequest,
    OrderQuoteSideKindSell,
    OrderSigningUtils,
    SigningScheme,
    SupportedChainId,
    UnsignedOrder,
  } = require("@cowprotocol/cow-sdk");
  const { ethers } = require("ethers");
  
// ABI for ERC20 approve function
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];

// CoW Protocol GPv2VaultRelayer address (the correct spender)
const COW_VAULT_RELAYER = "0xC92E8bdf79f0507f65a392b0ab4667716BFE0110";

/**
 * Check and set token allowance if needed
 */
async function checkAndSetAllowance(
  provider,
  wallet,
  tokenAddress,
  spenderAddress,
  amount
) {
  console.log(`Checking allowance for ${tokenAddress} to spender ${spenderAddress}`);
  
  // Create contract instance
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
  
  // Check current allowance
  const currentAllowance = await tokenContract.allowance(wallet.address, spenderAddress);
  console.log(`Current allowance: ${currentAllowance.toString()}`);
  
  // If allowance is insufficient, approve
  if (currentAllowance.lt(amount)) {
    console.log(`Setting approval for ${tokenAddress}`);
    
    // Define approval amount - approve a large amount to avoid future approvals
    const approvalAmount = ethers.constants.MaxUint256;
    
    // Create and send approval transaction
    const approveTx = await tokenContract.approve(spenderAddress, approvalAmount, {
      gasLimit: 100000,
      gasPrice: await provider.getGasPrice()
    });
    
    console.log(`Approval transaction sent: ${approveTx.hash}`);
    console.log(`Waiting for approval confirmation...`);
    
    // Wait for confirmation
    const approveReceipt = await approveTx.wait(1);
    console.log(`Approval confirmed in block ${approveReceipt.blockNumber}`);
    
    return true;
  } else {
    console.log(`Token allowance is sufficient`);
    return false;
  }
}

async function run(wallet) {
    const chainId = +(await wallet.provider.send("eth_chainId", []));
    console.log("chainId", chainId);
    
    if (chainId !== SupportedChainId.MAINNET) {
      throw new Error(`Please connect to mainnet. ChainId: ${chainId}`);
    }
  
    const orderBookApi = new OrderBookApi({
      chainId: SupportedChainId.MAINNET,
    });
  
    const ownerAddress = await wallet.getAddress();

    // Token addresses and amount
    const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // USDT
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // WETH
    
    // ✅ INCREASED AMOUNT - 0.01 WETH instead of 0.0001 WETH to cover fees
    const amount = ethers.utils.parseUnits("0.01", 18).toString(); 
    console.log("Sell amount:", amount);
  
    const sellToken = WETH_ADDRESS;
    const buyToken = USDT_ADDRESS;
    const sellAmount = amount;
  
    const quoteRequest = {
      sellToken,
      buyToken,
      from: ownerAddress,
      receiver: ownerAddress,
      sellAmountBeforeFee: sellAmount,
      kind: OrderQuoteSideKindSell.SELL,
    };
  
    console.log("Getting quote...");
    const { quote } = await orderBookApi.getQuote(quoteRequest);
    console.log("Quote received:");
    console.log("- Fee amount:", quote.feeAmount);
    console.log("- Buy amount:", quote.buyAmount);
    console.log("- Valid to:", new Date(quote.validTo * 1000));
  
    // ✅ FIXED - Use correct spender address
    const spenderAddress = COW_VAULT_RELAYER;
    console.log("Approving tokens to spender:", spenderAddress);
    
    await checkAndSetAllowance(
      wallet.provider,
      wallet,
      sellToken,
      spenderAddress,
      sellAmount
    );
  
    // ✅ FIXED - Use actual fee amount from quote
    const feeAmount = "0";
  
    const order = {
      ...quote,
      sellAmount,
      feeAmount, // Use the actual fee from the quote
      receiver: ownerAddress,
    };
  
    console.log("Signing order...");
    const orderSigningResult = await OrderSigningUtils.signOrder(
      order,
      chainId,
      wallet
    );
  
    console.log("Submitting order...");
    const orderId = await orderBookApi.sendOrder({
      ...quote,
      ...orderSigningResult,
      sellAmount: order.sellAmount,
      feeAmount: order.feeAmount,
      signingScheme: orderSigningResult.signingScheme,
    });
    
    console.log("✅ Order submitted successfully!");
    console.log("Order ID:", orderId);
    return orderId;
  }

/**
 * Check order status using CoW Protocol API
 */
async function checkOrderStatus(orderUID, chainId = SupportedChainId.MAINNET) {
  try {
    const baseUrl = chainId === SupportedChainId.MAINNET 
      ? 'https://api.cow.fi/mainnet' 
      : 'https://api.cow.fi/gnosis';
    
    const response = await fetch(`${baseUrl}/api/v1/orders/${orderUID}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return { error: 'Order not found' };
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const orderData = await response.json();
    
    console.log('\n📊 Order Status:');
    console.log('- Order UID:', orderData.uid);
    console.log('- Status:', orderData.status);
    console.log('- Creation Date:', new Date(orderData.creationDate));
    console.log('- Sell Token:', orderData.sellToken);
    console.log('- Buy Token:', orderData.buyToken);
    console.log('- Sell Amount:', orderData.sellAmount);
    console.log('- Buy Amount:', orderData.buyAmount);
    console.log('- Fee Amount:', orderData.feeAmount);
    console.log('- Valid To:', new Date(orderData.validTo * 1000));
    
    if (orderData.executedSellAmount) {
      console.log('- Executed Sell Amount:', orderData.executedSellAmount);
      console.log('- Executed Buy Amount:', orderData.executedBuyAmount);
      console.log('- Executed Fee Amount:', orderData.executedFeeAmount);
    }
    
    if (orderData.txHash) {
      console.log('- Transaction Hash:', orderData.txHash);
      console.log('- Etherscan:', `https://etherscan.io/tx/${orderData.txHash}`);
    }
    
    return orderData;
    
  } catch (error) {
    console.error('Error checking order status:', error.message);
    return { error: error.message };
  }
}

/**
 * Monitor order until completion or timeout
 */
async function monitorOrder(orderUID, timeoutMinutes = 10) {
  const startTime = Date.now();
  const timeout = timeoutMinutes * 60 * 1000; // Convert to milliseconds
  
  console.log(`\n🔍 Monitoring order ${orderUID} for up to ${timeoutMinutes} minutes...`);
  
  while (Date.now() - startTime < timeout) {
    const orderStatus = await checkOrderStatus(orderUID);
    
    if (orderStatus.error) {
      console.log('❌ Error checking order:', orderStatus.error);
      break;
    }
    
    const status = orderStatus.status;
    console.log(`⏳ Order status: ${status}`);
    
    if (status === 'fulfilled') {
      console.log('✅ Order completed successfully!');
      return orderStatus;
    } else if (status === 'cancelled' || status === 'expired') {
      console.log(`❌ Order ${status}`);
      return orderStatus;
    }
    
    // Wait 30 seconds before checking again
    console.log('Waiting 30 seconds before next check...');
    await new Promise(resolve => setTimeout(resolve, 30000));
  }
  
  console.log('⏰ Monitoring timeout reached');
  return await checkOrderStatus(orderUID);
}

async function main() {
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    const RPC_URL = process.env.RPC_URL;
    
    if (!PRIVATE_KEY || !RPC_URL) {
      throw new Error("Please set PRIVATE_KEY and RPC_URL in your .env file");
    }
    
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
    console.log("Wallet address:", wallet.address);
    
    try {
      const orderId = await run(wallet);
      // const orderId = "0xc5bba5c14a150e1146343879a77d6805e56a66a4cf9b1157c1fdc56c19daae62ae87f9bd09895f1aa21c5023b61ecd85eba515d168333662";
      console.log("Trade completed with order ID:", orderId);
      
      // Check order status immediately
      console.log('\n--- Checking Order Status ---');
      await checkOrderStatus(orderId);
      
      // Monitor the order for completion
      console.log('\n--- Monitoring Order ---');
      await monitorOrder(orderId, 10); // Monitor for 10 minutes
      
    } catch (err) {
      console.error("Error running order:", err);
      if (err.body) {
        console.error("Error details:", err.body);
      }
    }
}

main();