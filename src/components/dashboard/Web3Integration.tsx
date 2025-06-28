
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, Wallet, Coins, TrendingUp, ExternalLink, RefreshCw } from 'lucide-react';

const Web3Integration = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  const connectedWallets = [
    {
      type: 'MetaMask',
      address: '0x742d35cc6c3b4c6c4a7c1234567890abcdef',
      balance: '2.45 ETH',
      usdValue: '$4,890',
      network: 'Ethereum Mainnet'
    },
    {
      type: 'Phantom',
      address: 'DsVmA5xB...7Qd9K2pL',
      balance: '156.7 SOL',
      usdValue: '$3,250',
      network: 'Solana Mainnet'
    }
  ];

  const defiPositions = [
    {
      protocol: 'Uniswap V3',
      type: 'Liquidity Pool',
      pair: 'ETH/USDC',
      value: '$12,450',
      apy: '18.7%',
      status: 'Active'
    },
    {
      protocol: 'Compound',
      type: 'Lending',
      asset: 'USDC',
      value: '$8,900',
      apy: '4.2%',
      status: 'Active'
    },
    {
      protocol: 'Aave',
      type: 'Borrowing',
      asset: 'ETH',
      value: '$5,200',
      apy: '2.8%',
      status: 'Active'
    }
  ];

  const nftHoldings = [
    {
      collection: 'Bored Ape Yacht Club',
      tokenId: '#3847',
      floorPrice: '45 ETH',
      lastSale: '52 ETH',
      image: '/placeholder.svg'
    },
    {
      collection: 'CryptoPunks',
      tokenId: '#7234',
      floorPrice: '78 ETH',
      lastSale: '85 ETH',
      image: '/placeholder.svg'
    },
    {
      collection: 'Azuki',
      tokenId: '#1892',
      floorPrice: '12 ETH',
      lastSale: '15 ETH',
      image: '/placeholder.svg'
    }
  ];

  const tokenizedAssets = [
    {
      name: 'Real Estate Token NYC',
      symbol: 'RET-NYC',
      value: '$25,000',
      shares: '0.05%',
      apy: '8.5%',
      type: 'Real Estate'
    },
    {
      name: 'Art Collection Token',
      symbol: 'ART-COL',
      value: '$15,000',
      shares: '0.12%',
      apy: '12.3%',
      type: 'Fine Art'
    }
  ];

  const connectWallet = async () => {
    try {
      // Simulate wallet connection
      setWalletConnected(true);
      setWalletAddress('0x742d35cc6c3b4c6c4a7c1234567890abcdef');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Globe className="w-7 h-7 mr-2 text-purple-600" />
            Web3 & DeFi Hub
          </h2>
          <p className="text-gray-600">Manage your decentralized finance portfolio</p>
        </div>
        {!walletConnected ? (
          <Button onClick={connectWallet} className="bg-gradient-to-r from-purple-600 to-blue-600">
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        ) : (
          <Button variant="outline" onClick={disconnectWallet}>
            <Wallet className="w-4 h-4 mr-2" />
            Disconnect
          </Button>
        )}
      </div>

      {!walletConnected ? (
        <Card className="text-center py-12">
          <CardContent>
            <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Connect Your Web3 Wallet</h3>
            <p className="text-gray-600 mb-6">
              Connect your MetaMask, WalletConnect, or other Web3 wallet to access DeFi features
            </p>
            <Button onClick={connectWallet} size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600">
              <Wallet className="w-5 h-5 mr-2" />
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="defi">DeFi Positions</TabsTrigger>
            <TabsTrigger value="nfts">NFTs</TabsTrigger>
            <TabsTrigger value="tokenized">Tokenized Assets</TabsTrigger>
            <TabsTrigger value="trading">DEX Trading</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-purple-600 to-blue-700 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Web3 Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$52,690</div>
                  <div className="flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +15.7% (24h)
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">DeFi Yield</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">12.4%</div>
                  <div className="text-sm text-gray-500">Average APY</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">NFT Holdings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">187 ETH</div>
                  <div className="text-sm text-gray-500">Floor Value</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Connected Wallets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {connectedWallets.map((wallet, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <Wallet className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">{wallet.type}</div>
                          <div className="text-sm text-gray-500">{wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}</div>
                          <div className="text-xs text-gray-400">{wallet.network}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{wallet.balance}</div>
                        <div className="text-sm text-gray-500">{wallet.usdValue}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="defi" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  DeFi Positions
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {defiPositions.map((position, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                          <Coins className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">{position.protocol}</div>
                          <div className="text-sm text-gray-500">{position.type} • {position.pair || position.asset}</div>
                          <Badge variant={position.status === 'Active' ? 'default' : 'secondary'} className="text-xs mt-1">
                            {position.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{position.value}</div>
                        <div className="text-sm text-green-600">{position.apy} APY</div>
                        <Button variant="ghost" size="sm" className="mt-1">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nfts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>NFT Collection</CardTitle>
                <CardDescription>Your non-fungible token holdings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {nftHoldings.map((nft, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <div className="aspect-square bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                        <span className="text-white font-bold">{nft.collection}</span>
                      </div>
                      <div className="p-4">
                        <div className="font-medium">{nft.collection}</div>
                        <div className="text-sm text-gray-500">{nft.tokenId}</div>
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Floor Price:</span>
                            <span className="font-medium">{nft.floorPrice}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Last Sale:</span>
                            <span className="font-medium">{nft.lastSale}</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-3">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tokenized" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tokenized Real-World Assets</CardTitle>
                <CardDescription>Fractional ownership of real estate, art, and other assets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tokenizedAssets.map((asset, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-xs">{asset.type.slice(0, 2)}</span>
                        </div>
                        <div>
                          <div className="font-medium">{asset.name}</div>
                          <div className="text-sm text-gray-500">{asset.symbol} • {asset.shares} ownership</div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {asset.type}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{asset.value}</div>
                        <div className="text-sm text-green-600">{asset.apy} returns</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trading" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>DEX Trading</CardTitle>
                <CardDescription>Trade directly on decentralized exchanges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Coins className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">DEX Trading Coming Soon</h3>
                  <p className="text-gray-600 mb-4">
                    Integrated trading with Uniswap, SushiSwap, and other DEXs
                  </p>
                  <Button variant="outline">
                    Join Waitlist
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Web3Integration;
