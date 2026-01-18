import {
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Box,
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import LogoutButton from './LogoutButton';

const drawerWidth = 135;

function Sidebar() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const iconStyle = {
    fontFamily: 'Material Symbols Outlined',
    fontSize: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const menuItems = [
    { to: '/dashboard', icon: 'donut_small', label: 'Dashboard' },
    { to: '/goals', icon: 'flag', label: 'My Goals' },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          display: 'flex',
          position: 'fixed',
          left: 0,
          flexDirection: 'column',
          alignItems: 'center',
        },
      }}
      open
    >
      <Toolbar>
        <Box
          component="img"
          sx={{ height: 85, width: 85 }}
          alt="Logo"
          src="/logo.png"
        />
      </Toolbar>

      <List sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        {menuItems.map(({ to, icon, label }) => (
          <ListItemButton
            key={to}
            component={Link}
            to={to}
            sx={{
              justifyContent: 'center',
              padding: 2,
              flexDirection: 'column',
              '&:hover': {
                backgroundColor: 'transparent',
                '& .icon-box': {
                  transform: 'scale(1.1)',
                  backgroundColor: '#d6efff',
                  borderRadius: '20px',
                },
              },
            }}
          >
            <Box
              className="icon-box"
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: 60,
                height: 40,
                borderRadius: '20px',
                backgroundColor: isActive(to) ? '#b9e1fc' : 'transparent',
                transition:
                  'background-color 0.3s ease-in-out, transform 0.3s ease-in-out',
              }}
            >
              <span className="material-symbols-rounded" style={iconStyle}>
                {icon}
              </span>
            </Box>
            <ListItemText
              primary={label}
              sx={{
                textAlign: 'center',
                marginTop: 1,
              }}
            />
          </ListItemButton>
        ))}

        <Box sx={{ paddingBottom: 2 }}>
          <LogoutButton />
        </Box>
      </List>
    </Drawer>
  );
}

export default Sidebar;
