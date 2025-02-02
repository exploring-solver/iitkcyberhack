import React, { useContext, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Button,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  DialogActions,
} from '@mui/material';
import { Web3Context } from '../context/Web3Context';

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
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Network Settings
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Connected Account"
                    secondary={account || 'Not connected'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Network ID"
                    secondary={networkId || 'Unknown'}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Auto Gas Estimation"
                    secondary="Automatically estimate gas for transactions"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={settings.autoGasEstimation}
                      onChange={handleSettingChange('autoGasEstimation')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Default Gas Limit"
                    secondary="Set default gas limit for transactions"
                  />
                  <ListItemSecondaryAction>
                    <TextField
                      size="small"
                      value={settings.gasLimit}
                      onChange={handleSettingChange('gasLimit')}
                      disabled={settings.autoGasEstimation}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Application Settings
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Notifications"
                    secondary="Enable transaction notifications"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={settings.notificationsEnabled}
                      onChange={handleSettingChange('notificationsEnabled')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Dark Mode"
                    secondary="Toggle dark/light theme"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={settings.darkMode}
                      onChange={handleSettingChange('darkMode')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setOpenDialog(true)}
                >
                  Reset to Defaults
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveSettings}
                >
                  Save Settings
                </Button>
              </Box>

              {status.message && (
                <Alert severity={status.type} sx={{ mt: 2 }}>
                  {status.message}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Reset Settings</DialogTitle>
        <DialogContent>
          Are you sure you want to reset all settings to their default values?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleReset} color="error">
            Reset
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}