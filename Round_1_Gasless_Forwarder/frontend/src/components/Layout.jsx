/* eslint-disable react/prop-types */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  SwapHoriz as TransactionsIcon,
  Settings as SettingsIcon,
  IntegrationInstructions,
  Leaderboard,
  QuestionAnswer,
} from '@mui/icons-material';

const drawerWidth = 240;

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Transactions', icon: <TransactionsIcon />, path: '/transactions' },
    { text: 'Instructions', icon: <IntegrationInstructions />, path: '/instructions' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    { text: 'LeaderBoard', icon: <Leaderboard />, path: '/leaderboard' },
    { text: 'FAQs', icon: <QuestionAnswer />, path: '/faq' },
  ];

  const drawer = (
    <div>
      <Toolbar sx={{ 
        backgroundColor: 'primary.dark',
        borderRight: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 700,
            letterSpacing: '0.5px',
            color: 'text.primary',
            ml: 1,
            fontFamily: 'Inter, sans-serif'
          }}
        >
          Where&apos;s Gas
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: 'divider' }} />
      <List sx={{ py: 2 }}>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            component={Link}
            to={item.path}
            selected={location.pathname === item.path}
            sx={{
              borderRadius: 1,
              '&.Mui-selected': {
                backgroundColor: 'primary.dark',
                borderLeft: '4px solid',
                borderColor: 'secondary.main',
                '& .MuiListItemIcon-root': {
                  color: 'secondary.main'
                }
              },
              '&:hover': {
                backgroundColor: 'action.hover',
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            <ListItemIcon sx={{ 
              color: 'text.secondary',
              minWidth: '40px'
            }}>
              {React.cloneElement(item.icon, { fontSize: 'medium' })}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              primaryTypographyProps={{
                variant: 'h6',
                fontWeight: 500,
                color: 'text.primary',
                fontFamily: 'Inter, sans-serif'
              }} 
            />
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          boxShadow: 'none',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ 
              mr: 2, 
              display: { sm: 'none' },
              color: 'text.primary'
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            noWrap 
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.3px'
            }}
          >
            {menuItems.find((item) => item.path === location.pathname)?.text}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider'
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          bgcolor: 'background.default',
          minHeight: '100vh'
        }}
      >
        <Toolbar />
        <Box sx={{ 
          maxWidth: 1200,
          mx: 'auto',
          borderRadius: 2,
          bgcolor: 'background.paper',
        }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}