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
  currency: string;
  network: string;
  wallet_address: string;
  wallet_label: string | null;
  min_deposit_amount: number;
  network_fee_notice: string | null;
  qr_code_url: string | null;
  show_qr_code: boolean;
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
        .order('currency', { ascending: true });

      if (error) throw error;
      setDepositWallets(data || []);
      if (data && data.length > 0) {
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

    if (depositAmount < selectedWallet.min_deposit_amount) {
      toast({
        title: 'Amount Too Low',
        description: `Minimum deposit amount is ${selectedWallet.min_deposit_amount} ${selectedWallet.currency}`,
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
      // Create deposit transaction record
      const { error } = await supabase
        .from('deposit_transactions')
        .insert({
          user_id: userId,
          currency: selectedWallet.currency,
          network: selectedWallet.network,
          amount: depositAmount,
          to_address: selectedWallet.wallet_address,
          transaction_hash: transactionHash,
          status: 'pending',
          confirmations: 0,
          required_confirmations: 1,
        });

      if (error) throw error;

      toast({
        title: 'Deposit Request Submitted',
        description: 'Your deposit is pending confirmation',
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
                        {wallet.currency} - {wallet.network}
                        {wallet.wallet_label && ` (${wallet.wallet_label})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedWallet && (
                <>
                  {selectedWallet.network_fee_notice && (
                    <Alert className="bg-muted border-border">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <AlertDescription className="text-muted-foreground text-sm">
                        {selectedWallet.network_fee_notice}
                      </AlertDescription>
                    </Alert>
                  )}

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

                  {selectedWallet.show_qr_code && selectedWallet.qr_code_url && (
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
                      Amount ({selectedWallet.currency})
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min={selectedWallet.min_deposit_amount}
                      placeholder={`Min: ${selectedWallet.min_deposit_amount}`}
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
