import { useState } from 'react';
import { Upload, X, Plus, FileText, ArrowRight } from 'lucide-react';

type BatchTransfer = {
  recipient: string;
  tokenAddress: string;
  amount: string;
};

export function BatchTransferPage() {
  const [transfers, setTransfers] = useState<BatchTransfer[]>([
    { recipient: '', tokenAddress: '', amount: '' },
  ]);

  const [csvFile, setCsvFile] = useState<File | null>(null);

  const addTransfer = () => {
    setTransfers([...transfers, { recipient: '', tokenAddress: '', amount: '' }]);
  };

  const removeTransfer = (index: number) => {
    setTransfers(transfers.filter((_, i) => i !== index));
  };

  const updateTransfer = (index: number, field: keyof BatchTransfer, value: string) => {
    const newTransfers = [...transfers];
    newTransfers[index] = { ...newTransfers[index], [field]: value };
    setTransfers(newTransfers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Batch transfer submitted:', transfers);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      // Here you would parse the CSV file and update the transfers state
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 neon-text">Batch Transfer</h1>

        {/* CSV Upload */}
        <div className="glass-panel p-8 mb-8">
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer flex flex-col items-center space-y-4"
            >
              <Upload className="w-12 h-12 text-blue-400" />
              <div>
                <p className="text-lg font-medium">Drop your CSV file here</p>
                <p className="text-sm text-gray-400">or click to browse</p>
              </div>
            </label>
            {csvFile && (
              <div className="mt-4 flex items-center justify-center space-x-4">
                <FileText className="w-5 h-5 text-blue-400" />
                <span>{csvFile.name}</span>
                <button
                  onClick={() => setCsvFile(null)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Manual Entry Form */}
        <div className="glass-panel p-8">
          <h2 className="text-xl font-bold mb-6">Manual Entry</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {transfers.map((transfer, index) => (
              <div
                key={index}
                className="p-6 bg-gray-800/50 rounded-lg space-y-4 relative"
              >
                {transfers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTransfer(index)}
                    className="absolute top-4 right-4 text-red-400 hover:text-red-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Recipient Address
                    </label>
                    <input
                      type="text"
                      className="cyber-input"
                      placeholder="0x..."
                      value={transfer.recipient}
                      onChange={(e) =>
                        updateTransfer(index, 'recipient', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Token Address
                    </label>
                    <input
                      type="text"
                      className="cyber-input"
                      placeholder="0x..."
                      value={transfer.tokenAddress}
                      onChange={(e) =>
                        updateTransfer(index, 'tokenAddress', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Amount
                    </label>
                    <input
                      type="text"
                      className="cyber-input"
                      placeholder="0.0"
                      value={transfer.amount}
                      onChange={(e) =>
                        updateTransfer(index, 'amount', e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-between">
              <button
                type="button"
                onClick={addTransfer}
                className="cyber-button bg-gray-800 hover:bg-gray-700"
              >
                Add Transfer
                <Plus className="w-5 h-5 inline-block ml-2" />
              </button>
              <button type="submit" className="cyber-button">
                Send Batch
                <ArrowRight className="w-5 h-5 inline-block ml-2" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}