// import React, { useState } from 'react';
// import { 
//   Container, 
//   Box, 
//   Typography, 
//   Tab, 
//   Tabs,
// } from '@mui/material';
// import { ThemeProvider, createTheme } from '@mui/material/styles';
// import { motion, AnimatePresence } from 'framer-motion';
// import styled from '@emotion/styled';
// import TokenBridge from './components/TokenBridge';
// import NFTBridge from './components/NFTBridge';
// import ConnectWallet from './components/ConnectWallet';
// import { Web3Provider } from './context/Web3Context';

// const darkTheme = createTheme({
//   palette: {
//     mode: 'dark',
//     primary: {
//       main: '#6d28d9',
//     },
//     secondary: {
//       main: '#7c3aed',
//     },
//     background: {
//       default: '#0f172a',
//       paper: 'rgba(30, 41, 59, 0.8)',
//     },
//   },
// });

// const GlowingBackground = styled(motion.div)`
//   position: fixed;
//   top: 0;
//   left: 0;
//   right: 0;
//   bottom: 0;
//   z-index: -1;
//   background: linear-gradient(45deg, #1e293b, #0f172a);
//   overflow: hidden;

//   &::before {
//     content: '';
//     position: absolute;
//     width: 200%;
//     height: 200%;
//     background: radial-gradient(
//       circle,
//       rgba(124, 58, 237, 0.1) 0%,
//       rgba(109, 40, 217, 0.1) 25%,
//       transparent 70%
//     );
//     animation: rotate 20s linear infinite;
//   }

//   @keyframes rotate {
//     from {
//       transform: rotate(0deg) scale(1);
//     }
//     to {
//       transform: rotate(360deg) scale(1.5);
//     }
//   }
// `;

// const StyledContainer = styled(Container)`
//   position: relative;
//   z-index: 1;
// `;

// const TabPanel = styled(motion.div)`
//   padding: 24px 0;
// `;

// const StyledTabs = styled(Tabs)`
//   .MuiTabs-indicator {
//     height: 3px;
//     background: linear-gradient(90deg, #6d28d9, #7c3aed);
//   }
// `;

// const StyledTab = styled(Tab)`
//   color: rgba(255, 255, 255, 0.7);
//   &.Mui-selected {
//     color: #fff;
//   }
// `;

// function App() {
//   const [tabValue, setTabValue] = useState(0);

//   const handleTabChange = (event, newValue) => {
//     setTabValue(newValue);
//   };

//   const pageVariants = {
//     initial: {
//       opacity: 0,
//       y: 20,
//     },
//     animate: {
//       opacity: 1,
//       y: 0,
//       transition: {
//         duration: 0.4,
//       },
//     },
//     exit: {
//       opacity: 0,
//       y: -20,
//       transition: {
//         duration: 0.3,
//       },
//     },
//   };

//   const titleVariants = {
//     initial: { y: -20, opacity: 0 },
//     animate: {
//       y: 0,
//       opacity: 1,
//       transition: {
//         duration: 0.6,
//         ease: "easeOut",
//       },
//     },
//   };

//   return (
//     <ThemeProvider theme={darkTheme}>
//       <Web3Provider>
//         <GlowingBackground
//           animate={{
//             background: [
//               "linear-gradient(45deg, #1e293b, #0f172a)",
//               "linear-gradient(45deg, #0f172a, #1e293b)",
//             ],
//           }}
//           transition={{
//             duration: 10,
//             repeat: Infinity,
//             repeatType: "reverse",
//           }}
//         />
//         <StyledContainer maxWidth="lg">
//           <Box sx={{ flexGrow: 1, mt: 4 }}>
//             <motion.div
//               initial="initial"
//               animate="animate"
//               variants={titleVariants}
//             >
//               <Typography 
//                 variant="h3" 
//                 component="h1" 
//                 gutterBottom 
//                 align="center"
//                 sx={{
//                   fontWeight: 'bold',
//                   background: 'linear-gradient(45deg, #6d28d9, #7c3aed)',
//                   WebkitBackgroundClip: 'text',
//                   WebkitTextFillColor: 'transparent',
//                   mb: 4
//                 }}
//               >
//                 Cross-Chain Bridge Portal
//               </Typography>
//             </motion.div>
            
//             <motion.div
//               initial={{ scale: 0.9, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               transition={{ duration: 0.5 }}
//             >
//               <ConnectWallet />
//             </motion.div>

//             <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
//               <StyledTabs value={tabValue} onChange={handleTabChange} centered>
//                 <StyledTab label="Token Bridge" />
//                 <StyledTab label="NFT Bridge" />
//               </StyledTabs>
//             </Box>

//             <AnimatePresence mode='wait'>
//               {tabValue === 0 && (
//                 <TabPanel
//                   key="token"
//                   initial="initial"
//                   animate="animate"
//                   exit="exit"
//                   variants={pageVariants}
//                 >
//                   <TokenBridge />
//                 </TabPanel>
//               )}
//               {tabValue === 1 && (
//                 <TabPanel
//                   key="nft"
//                   initial="initial"
//                   animate="animate"
//                   exit="exit"
//                   variants={pageVariants}
//                 >
//                   <NFTBridge />
//                 </TabPanel>
//               )}
//             </AnimatePresence>
//           </Box>
//         </StyledContainer>
//       </Web3Provider>
//     </ThemeProvider>
//   );
// }

// export default App;

// App.js
import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, AppBar, Toolbar, Typography } from '@mui/material';
import { WalletProvider } from './context/WalletContext';
import Dashboard from './components/Dashboard';
import TokenBalance from './components/TokenBalance';
import BridgeOperations from './components/BridgeOperations';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <WalletProvider>
        <Box className="min-h-screen bg-gray-100">
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6">
                Cross-Chain Bridge DApp
              </Typography>
            </Toolbar>
          </AppBar>

          <Container maxWidth="lg" className="py-8">
            <Box className="space-y-8">
              <Dashboard />
              <Box className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TokenBalance />
                <BridgeOperations />
              </Box>
            </Box>
          </Container>
        </Box>
      </WalletProvider>
    </ThemeProvider>
  );
};

export default App;