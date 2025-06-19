import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Box, Typography, Divider, Avatar, ListItemButton, ListItemAvatar, Tooltip, IconButton } from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Home as HomeIcon,
  AccountBalanceWallet as TransactionsIcon,
  PieChart as BudgetIcon,
  Assessment as ReportsIcon,
  CurrencyRupee as RupeeIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const mainMenuItems = [
    { text: 'Dashboard', icon: <HomeIcon />, path: '/dashboard' },
    { text: 'Transactions', icon: <TransactionsIcon />, path: '/dashboard/transactions' },
    { text: 'Budget', icon: <BudgetIcon />, path: '/dashboard/budget/overview' },
    { text: 'Reports', icon: <ReportsIcon />, path: '/dashboard/reports' }
  ];
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          <RupeeIcon />
        </Avatar>
        <Typography variant="h6" component="div" fontWeight="bold">
          Finance MS
        </Typography>
      </Box>
      
      <Divider sx={{ mx: 2 }} />
      
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <List sx={{ px: 1, flexGrow: 1 }}>
          {mainMenuItems.map((item) => {
            const isActive = location.pathname === item.path || 
                          (item.path !== '/dashboard' && 
                          location.pathname.startsWith(item.path)) ||
                          (item.path === '/dashboard' && location.pathname === '/dashboard/');
            
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  sx={{
                    borderRadius: 1,
                    bgcolor: isActive ? 'primary.lighter' : 'transparent',
                    color: isActive ? 'primary.main' : 'text.primary',
                    '&:hover': {
                      bgcolor: isActive ? 'primary.lighter' : 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: isActive ? 'primary.main' : 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{
                      fontWeight: isActive ? 'medium' : 'regular'
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
        
        {/* Bottom section */}
        <Box sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                <PersonIcon />
              </Avatar>
            </ListItemAvatar>
            <Box sx={{ ml: 1, overflow: 'hidden' }}>
              <Typography variant="subtitle2" noWrap>
                {user?.name || 'User'}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {user?.email || 'user@example.com'}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Tooltip title="Settings">
              <IconButton size="small" component={Link} to="/settings">
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Help">
              <IconButton size="small" component={Link} to="/help">
                <HelpIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Logout">
              <IconButton size="small" onClick={handleLogout}>
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;