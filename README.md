# CoW Swap SDK

A comprehensive Node.js SDK for interacting with the CoW Protocol (Coincidence of Wants) on Ethereum mainnet. This SDK provides a complete solution for executing token swaps through CoW Protocol's order book API with automatic token approvals, order monitoring, and status tracking.

## 🚀 Features

- **Token Swaps**: Execute WETH to USDT swaps on Ethereum mainnet
- **Automatic Approvals**: Handles ERC20 token approvals automatically
- **Quote Fetching**: Get real-time quotes from CoW Protocol
- **Order Monitoring**: Track order status and execution
- **Error Handling**: Comprehensive error handling and logging
- **Environment Configuration**: Secure configuration via environment variables

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Ethereum mainnet RPC endpoint
- Private key for wallet operations
- Sufficient WETH balance for swaps

## 🛠️ Installation

1. Clone the repository and navigate to the cow_swap directory:
```bash
cd cow_swap
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
touch .env
```

4. Add your configuration to the `.env` file:
```env
PRIVATE_KEY=your_private_key_here
RPC_URL=your_ethereum_mainnet_rpc_url_here
```

**⚠️ Security Note**: Never commit your `.env` file to version control. Add it to your `.gitignore` file.

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PRIVATE_KEY` | Your wallet's private key (without 0x prefix) | Yes |
| `RPC_URL` | Ethereum mainnet RPC endpoint URL | Yes |

### Supported Tokens

The SDK is currently configured for:
- **WETH**: `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`
- **USDT**: `0xdAC17F958D2ee523a2206206994597C13D831ec7`

### Swap Configuration

Default swap parameters:
- **Sell Amount**: 0.01 WETH
- **Sell Token**: WETH
- **Buy Token**: USDT
- **Network**: Ethereum Mainnet

## 🚀 Usage

### Basic Usage

Run the swap script:
```bash
node src/eoa.js
```

The script will:
1. Connect to Ethereum mainnet
2. Check and set token approvals if needed
3. Fetch a quote from CoW Protocol
4. Sign and submit the order
5. Monitor the order status
6. Display execution results

### Expected Output

```
Wallet address: 0x...
chainId 1
Sell amount: 10000000000000000
Getting quote...
Quote received:
- Fee amount: 0
- Buy amount: 12345678
- Valid to: 2024-01-01T12:00:00.000Z
Approving tokens to spender: 0xC92E8bdf79f0507f65a392b0ab4667716BFE0110
Checking allowance for 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 to spender 0xC92E8bdf79f0507f65a392b0ab4667716BFE0110
Current allowance: 0
Setting approval for 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
Approval transaction sent: 0x...
Waiting for approval confirmation...
Approval confirmed in block 12345678
Signing order...
Submitting order...
✅ Order submitted successfully!
Order ID: 0x...
```

## 📊 Order Monitoring

The SDK includes comprehensive order monitoring capabilities:

### Check Order Status
```javascript
const orderStatus = await checkOrderStatus(orderUID);
```

### Monitor Order Completion
```javascript
const result = await monitorOrder(orderUID, timeoutMinutes);
```

### Order Status Types
- `pending`: Order is waiting to be matched
- `fulfilled`: Order has been successfully executed
- `cancelled`: Order was cancelled
- `expired`: Order expired without execution

## 🔍 API Reference

### Main Functions

#### `run(wallet)`
Executes a complete swap operation.

**Parameters:**
- `wallet`: Ethers.js wallet instance

**Returns:**
- `Promise<string>`: Order UID

#### `checkAndSetAllowance(provider, wallet, tokenAddress, spenderAddress, amount)`
Checks and sets ERC20 token allowance if needed.

**Parameters:**
- `provider`: Ethers.js provider
- `wallet`: Ethers.js wallet
- `tokenAddress`: Token contract address
- `spenderAddress`: Spender contract address
- `amount`: Required allowance amount

#### `checkOrderStatus(orderUID, chainId)`
Fetches current order status from CoW Protocol API.

**Parameters:**
- `orderUID`: Order unique identifier
- `chainId`: Network chain ID (default: mainnet)

#### `monitorOrder(orderUID, timeoutMinutes)`
Monitors order until completion or timeout.

**Parameters:**
- `orderUID`: Order unique identifier
- `timeoutMinutes`: Monitoring timeout in minutes (default: 10)

## 🔧 Customization

### Modifying Swap Parameters

To change the swap configuration, edit the constants in `src/eoa.js`:

```javascript
// Change swap amount
const amount = ethers.utils.parseUnits("0.1", 18).toString(); // 0.1 WETH

// Change tokens (ensure addresses are correct)
const sellToken = "0x..."; // Your sell token address
const buyToken = "0x...";  // Your buy token address
```

### Adding New Tokens

1. Add token addresses to the configuration
2. Update the swap parameters
3. Ensure you have sufficient balance of the sell token

## 🛡️ Security Considerations

- **Private Key Security**: Never expose your private key in code or logs
- **Environment Variables**: Use `.env` files for sensitive configuration
- **Network Verification**: The script verifies you're connected to mainnet
- **Allowance Management**: The SDK handles token approvals securely

## 📝 Error Handling

The SDK includes comprehensive error handling for:
- Network connectivity issues
- Insufficient token balances
- Failed approvals
- Order submission errors
- API rate limiting

## 🔗 Dependencies

- `@cowprotocol/cow-sdk`: Official CoW Protocol SDK
- `ethers`: Ethereum library for wallet and contract interactions
- `dotenv`: Environment variable management

## 📚 Resources

- [CoW Protocol Documentation](https://docs.cow.fi/)
- [CoW Protocol API Reference](https://api.cow.fi/docs)
- [Ethers.js Documentation](https://docs.ethers.io/)
- [CoW Protocol GitHub](https://github.com/cowprotocol)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## ⚠️ Disclaimer

This SDK is for educational and development purposes. Always test with small amounts before using with significant funds. The authors are not responsible for any financial losses incurred through the use of this software.

## 🆘 Support

For issues and questions:
1. Check the [CoW Protocol documentation](https://docs.cow.fi/)
2. Review the error messages in the console output
3. Ensure your environment variables are correctly set
4. Verify you have sufficient token balances

---

**Happy Trading! 🚀** 