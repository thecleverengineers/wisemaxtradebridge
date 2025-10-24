import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowDownLeft, AlertCircle, Copy, Check } from 'lucide-react';

interface DepositWallet {
  id: string;
  network: string;
  wallet_address: string;
  qr_code_url: string | null;
  is_active: boolean;
}

interface DepositDialogProps {
  userId: string;
  onDepositCreated: () => void;
}

export const DepositDialog = ({ userId, onDepositCreated }: DepositDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [depositWallets, setDepositWallets] = useState<DepositWallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<DepositWallet | null>(null);
  const [amount, setAmount] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      fetchDepositWallets();
    }
  }, [open]);

  const fetchDepositWallets = async () => {
    try {
      const { data, error } = await supabase
        .from('deposit_wallets')
        .select('*')
        .eq('is_active', true)
        .order('network', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setDepositWallets(data);
        setSelectedWallet(data[0]);
      }
    } catch (error) {
      console.error('Error fetching deposit wallets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load deposit options',
        variant: 'destructive',
      });
    }
  };

  const handleWalletSelect = (walletId: string) => {
    const wallet = depositWallets.find(w => w.id === walletId);
    setSelectedWallet(wallet || null);
  };

  const copyAddress = () => {
    if (selectedWallet?.wallet_address) {
      navigator.clipboard.writeText(selectedWallet.wallet_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Address Copied',
        description: 'Wallet address copied to clipboard',
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedWallet) {
      toast({
        title: 'No Wallet Selected',
        description: 'Please select a deposit wallet',
        variant: 'destructive',
      });
      return;
    }

    const depositAmount = parseFloat(amount);
    if (!amount || depositAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid deposit amount',
        variant: 'destructive',
      });
      return;
    }

    if (depositAmount < 10) {
      toast({
        title: 'Amount Too Low',
        description: 'Minimum deposit amount is $10',
        variant: 'destructive',
      });
      return;
    }

    if (!transactionHash) {
      toast({
        title: 'Missing Transaction Hash',
        description: 'Please enter your transaction hash/ID',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Create deposit transaction record (for admin approval)
      const { error: depositError } = await supabase
        .from('deposit_transactions')
        .insert({
          user_id: userId,
          amount: depositAmount,
          currency: 'USDT',
          network: selectedWallet.network,
          tx_hash: transactionHash,
          from_address: null,
          to_address: selectedWallet.wallet_address,
          status: 'pending',
        });

      if (depositError) throw depositError;

      toast({
        title: 'Deposit Request Submitted',
        description: 'Your deposit is pending admin approval',
      });

      setAmount('');
      setTransactionHash('');
      setOpen(false);
      onDepositCreated();
    } catch (error: any) {
      console.error('Error submitting deposit:', error);
      toast({
        title: 'Deposit Failed',
        description: error.message || 'Failed to submit deposit request',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-16 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
          <ArrowDownLeft className="h-6 w-6 mr-2" />
          Deposit Funds
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Deposit Funds</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Select currency and send funds to the provided address
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {depositWallets.length === 0 ? (
            <Alert className="bg-muted border-border">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <AlertDescription className="text-muted-foreground">
                No deposit options available at the moment.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div>
                <Label htmlFor="deposit-wallet" className="text-foreground">
                  Currency & Network
                </Label>
                <Select
                  value={selectedWallet?.id}
                  onValueChange={handleWalletSelect}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Select deposit option" />
                  </SelectTrigger>
                  <SelectContent>
                    {depositWallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        USDT - {wallet.network}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedWallet && (
                <>
                  <Alert className="bg-muted border-border">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <AlertDescription className="text-muted-foreground text-sm">
                      Please send only USDT on the {selectedWallet.network} network to this address.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <Label htmlFor="wallet-address" className="text-foreground">
                      Deposit Address
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="wallet-address"
                        value={selectedWallet.wallet_address}
                        readOnly
                        className="bg-background border-border text-foreground font-mono text-sm"
                      />
                      <Button
                        onClick={copyAddress}
                        variant="outline"
                        size="icon"
                        className="bg-background border-border hover:bg-muted"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4 text-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {selectedWallet.qr_code_url && (
                    <div className="flex justify-center">
                      <img
                        src={selectedWallet.qr_code_url}
                        alt="QR Code"
                        className="w-48 h-48 border-2 border-border rounded-lg"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="amount" className="text-foreground">
                      Amount (USDT)
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min={10}
                      placeholder="Min: $10"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="bg-background border-border text-foreground"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tx-hash" className="text-foreground">
                      Transaction Hash/ID
                    </Label>
                    <Input
                      id="tx-hash"
                      type="text"
                      placeholder="Enter transaction hash after payment"
                      value={transactionHash}
                      onChange={(e) => setTransactionHash(e.target.value)}
                      className="bg-background border-border text-foreground"
                    />
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {loading ? 'Submitting...' : 'Submit Deposit'}
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
