const generateSimulatedTraffic = async () => {
  console.log('Sending simulated cache traffic to Telemetry Collector...');
  
  for (let i = 0; i < 50; i++) {
    const isHit = Math.random() > 0.3; // 70% hit rate
    
    await fetch('http://localhost:4000/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: `test-key-${Math.floor(Math.random() * 5)}`,
        type: isHit ? 'HIT' : 'MISS',
        source: isHit ? (Math.random() > 0.5 ? 'L1' : 'L2') : undefined,
        durationMs: Math.random() * 50
      })
    });
    
    // Slight delay between requests
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log('Simulated traffic complete. You can view metrics at http://localhost:4000/metrics');
};

generateSimulatedTraffic().catch(console.error);
