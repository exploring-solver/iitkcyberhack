import { useContext, useState } from 'react';
import { Web3Context } from '../context/Web3Context';
import { Alert, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Switch, Button, TextField } from '@mui/material';

export default function Settings() {
  const { account, networkId } = useContext(Web3Context);
  const [settings, setSettings] = useState({
    autoGasEstimation: true,
    notificationsEnabled: true,
    darkMode: true,
    gasLimit: '100000',
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleSettingChange = (setting) => (event) => {
    setSettings({
      ...settings,
      [setting]: event.target.type === 'checkbox' ? event.target.checked : event.target.value,
    });
  };

  const handleSaveSettings = () => {
    try {
      localStorage.setItem('forwarderSettings', JSON.stringify(settings));
      setStatus({
        type: 'success',
        message: 'Settings saved successfully!',
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Failed to save settings: ' + error.message,
      });
    }
  };

  const handleReset = () => {
    setOpenDialog(false);
    setSettings({
      autoGasEstimation: true,
      notificationsEnabled: true,
      darkMode: true,
      gasLimit: '100000',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold mb-8 text-gray-900">Settings</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-100 p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Network Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Connected Account</label>
                  <p className="mt-1 text-sm text-gray-500 font-mono">{account || 'Not connected'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Network ID</label>
                  <p className="mt-1 text-sm text-gray-500">{networkId || 'Unknown'}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Auto Gas Estimation</label>
                    <p className="mt-1 text-sm text-gray-500">Automatically estimate gas for transactions</p>
                  </div>
                  <Switch
                    checked={settings.autoGasEstimation}
                    onChange={handleSettingChange('autoGasEstimation')}
                    color="primary"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Default Gas Limit</label>
                    <p className="mt-1 text-sm text-gray-500">Set default gas limit for transactions</p>
                  </div>
                  <TextField
                    size="small"
                    value={settings.gasLimit}
                    onChange={handleSettingChange('gasLimit')}
                    disabled={settings.autoGasEstimation}
                    className="w-24"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-100 p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Application Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notifications</label>
                    <p className="mt-1 text-sm text-gray-500">Enable transaction notifications</p>
                  </div>
                  <Switch
                    checked={settings.notificationsEnabled}
                    onChange={handleSettingChange('notificationsEnabled')}
                    color="primary"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dark Mode</label>
                    <p className="mt-1 text-sm text-gray-500">Toggle dark/light theme</p>
                  </div>
                  <Switch
                    checked={settings.darkMode}
                    onChange={handleSettingChange('darkMode')}
                    color="primary"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-4">
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => setOpenDialog(true)}
                  className="text-sm font-medium"
                >
                  Reset to Defaults
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveSettings}
                  className="text-sm font-medium"
                >
                  Save Settings
                </Button>
              </div>

              {status.message && (
                <Alert severity={status.type} className="mt-4">
                  {status.message}
                </Alert>
              )}
            </div>
          </div>

          <Dialog
            open={openDialog}
            onClose={() => setOpenDialog(false)}
            PaperProps={{
              className: 'bg-white rounded-lg shadow-lg',
            }}
          >
            <DialogTitle className="text-lg font-semibold text-gray-900">Reset Settings</DialogTitle>
            <DialogContent className="py-4">
              <p className="text-sm text-gray-500">Are you sure you want to reset all settings to their default values?</p>
            </DialogContent>
            <DialogActions className="px-4 py-2">
              <Button
                onClick={() => setOpenDialog(false)}
                className="text-sm font-medium text-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReset}
                color="secondary"
                variant="contained"
                className="text-sm font-medium"
              >
                Reset
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      </div>
    </div>
  );
}