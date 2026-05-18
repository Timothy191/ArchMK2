#!/usr/bin/env node

const http = require('http');
const { exec } = require('child_process');

const PORTAL_URL = 'http://localhost:3002';
const LOGIN_URL = 'http://localhost:3002/login';
const SUPABASE_URL = 'http://localhost:54321'; // Default Supabase local URL

async function checkHealth(url, name) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServices() {
  console.log('🔍 Checking service health...');
  
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes with 5-second intervals
  
  while (attempts < maxAttempts) {
    attempts++;
    
    try {
      const [portalHealthy, supabaseHealthy] = await Promise.all([
        checkHealth(PORTAL_URL, 'Portal'),
        checkHealth(SUPABASE_URL, 'Supabase')
      ]);
      
      console.log(`Attempt ${attempts}: Portal ${portalHealthy ? '✅' : '❌'}, Supabase ${supabaseHealthy ? '✅' : '❌'}`);
      
      if (portalHealthy && supabaseHealthy) {
        console.log('🎉 All services are healthy!');
        console.log('🌐 Opening browser to login page...');
        
        // Open browser based on platform
        const openCmd = process.platform === 'darwin' ? 'open' : 
                       process.platform === 'win32' ? 'start' : 'xdg-open';
        
        exec(`${openCmd} ${LOGIN_URL}`, (error) => {
          if (error) {
            console.error('Failed to open browser:', error.message);
            console.log(`Please manually navigate to: ${LOGIN_URL}`);
          } else {
            console.log(`✅ Browser opened to: ${LOGIN_URL}`);
          }
        });
        
        return;
      }
    } catch (error) {
      console.log(`Attempt ${attempts}: Health check failed - ${error.message}`);
    }
    
    // Wait 5 seconds before next attempt
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  console.log('❌ Services did not become healthy within the timeout period');
  console.log(`Please check manually: Portal at ${PORTAL_URL}, Supabase at ${SUPABASE_URL}`);
}

waitForServices().catch(console.error);
