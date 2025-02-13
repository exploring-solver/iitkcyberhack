import { useContext, useState } from 'react';
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
    <Box sx={{ p: 3 , minHeight: screen}} >
      <Typography variant="h4" gutterBottom sx={{ 
        fontWeight: 600,
        mb: 4,
        color: 'text.primary',
        fontFamily: 'Inter, sans-serif'
      }}>
        Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            bgcolor: 'background.paper',
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
            borderRadius: 2
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ 
                fontWeight: 600,
                mb: 2,
                color: 'text.primary',
                fontFamily: 'Inter, sans-serif'
              }}>
                Network Settings
              </Typography>
              <List dense>
                <ListItem sx={{ py: 1.5 }}>
                  <ListItemText
                    primary="Connected Account"
                    primaryTypographyProps={{ 
                      variant: 'body1',
                      fontWeight: 500,
                      color: 'text.primary'
                    }}
                    secondary={account || 'Not connected'}
                    secondaryTypographyProps={{ 
                      variant: 'body2',
                      color: 'text.secondary',
                      sx: { fontFamily: 'monospace' }
                    }}
                  />
                </ListItem>
                <ListItem sx={{ py: 1.5 }}>
                  <ListItemText
                    primary="Network ID"
                    primaryTypographyProps={{ 
                      variant: 'body1',
                      fontWeight: 500,
                      color: 'text.primary'
                    }}
                    secondary={networkId || 'Unknown'}
                    secondaryTypographyProps={{ 
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                </ListItem>
                <Divider sx={{ my: 2, bgcolor: 'divider' }} />
                <ListItem sx={{ py: 1.5 }}>
                  <ListItemText
                    primary="Auto Gas Estimation"
                    secondary="Automatically estimate gas for transactions"
                    primaryTypographyProps={{ 
                      variant: 'body1',
                      fontWeight: 500,
                      color: 'text.primary'
                    }}
                    secondaryTypographyProps={{ 
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={settings.autoGasEstimation}
                      onChange={handleSettingChange('autoGasEstimation')}
                      color="secondary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem sx={{ py: 1.5 }}>
                  <ListItemText
                    primary="Default Gas Limit"
                    secondary="Set default gas limit for transactions"
                    primaryTypographyProps={{ 
                      variant: 'body1',
                      fontWeight: 500,
                      color: 'text.primary'
                    }}
                    secondaryTypographyProps={{ 
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                  <ListItemSecondaryAction>
                    <TextField
                      size="small"
                      value={settings.gasLimit}
                      onChange={handleSettingChange('gasLimit')}
                      disabled={settings.autoGasEstimation}
                      sx={{
                        width: 100,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                          bgcolor: 'background.default'
                        }
                      }}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ 
            bgcolor: 'background.paper',
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
            borderRadius: 2
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ 
                fontWeight: 600,
                mb: 2,
                color: 'text.primary',
                fontFamily: 'Inter, sans-serif'
              }}>
                Application Settings
              </Typography>
              <List dense>
                <ListItem sx={{ py: 1.5 }}>
                  <ListItemText
                    primary="Notifications"
                    secondary="Enable transaction notifications"
                    primaryTypographyProps={{ 
                      variant: 'body1',
                      fontWeight: 500,
                      color: 'text.primary'
                    }}
                    secondaryTypographyProps={{ 
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={settings.notificationsEnabled}
                      onChange={handleSettingChange('notificationsEnabled')}
                      color="secondary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem sx={{ py: 1.5 }}>
                  <ListItemText
                    primary="Dark Mode"
                    secondary="Toggle dark/light theme"
                    primaryTypographyProps={{ 
                      variant: 'body1',
                      fontWeight: 500,
                      color: 'text.primary'
                    }}
                    secondaryTypographyProps={{ 
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={settings.darkMode}
                      onChange={handleSettingChange('darkMode')}
                      color="secondary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>

              <Box sx={{ 
                mt: 3, 
                display: 'flex', 
                gap: 2, 
                justifyContent: 'flex-end'
              }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setOpenDialog(true)}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 1,
                    px: 3,
                    '&:hover': {
                      bgcolor: 'error.dark',
                      color: 'white'
                    }
                  }}
                >
                  Reset to Defaults
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleSaveSettings}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 1,
                    px: 3,
                    boxShadow: 'none',
                    '&:hover': {
                      bgcolor: 'secondary.dark',
                      boxShadow: 'none'
                    }
                  }}
                >
                  Save Settings
                </Button>
              </Box>

              {status.message && (
                <Alert 
                  severity={status.type} 
                  sx={{ 
                    mt: 2,
                    borderRadius: 1,
                    bgcolor: status.type === 'success' ? 'success.dark' : 'error.dark'
                  }}
                >
                  {status.message}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 600,
          color: 'text.primary',
          bgcolor: 'background.default',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          Reset Settings
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Typography color="text.secondary">
            Are you sure you want to reset all settings to their default values?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ 
          px: 3,
          py: 2,
          bgcolor: 'background.default',
          borderTop: '1px solid',
          borderColor: 'divider'
        }}>
          <Button 
            onClick={() => setOpenDialog(false)}
            sx={{
              textTransform: 'none',
              borderRadius: 1,
              px: 3,
              color: 'text.secondary'
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleReset} 
            color="error"
            variant="contained"
            sx={{
              textTransform: 'none',
              borderRadius: 1,
              px: 3,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: 'error.dark',
                boxShadow: 'none'
              }
            }}
          >
            Reset
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}